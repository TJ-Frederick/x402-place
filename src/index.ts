import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, PlacePixelRequest } from "./types";
import {
  initDb,
  getPixel,
  placePixel,
  getAllPixels,
  getCanvasRegion,
  getFactions,
  getRecentPlacements,
  getStats,
  decayPixels,
  getPixelPrice,
  getPixelPriceDollars,
  CANVAS_SIZE,
  BASE_PRICE_CENTS,
} from "./db";
import { serveHtml } from "./frontend";

function toBase64(str: string): string {
  return btoa(Array.from(new TextEncoder().encode(str), (b) => String.fromCharCode(b)).join(""));
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Serve frontend
app.get("/", (c) => {
  return c.html(serveHtml(c.env));
});

// Get full canvas state (for initial load)
app.get("/api/canvas", async (c) => {
  await initDb(c.env.DB);
  const pixels = await getAllPixels(c.env.DB);
  const factions = await getFactions(c.env.DB);
  const stats = await getStats(c.env.DB);
  return c.json({ pixels, factions, stats, canvasSize: CANVAS_SIZE });
});

// Get canvas region (for viewport)
app.get("/api/canvas/region", async (c) => {
  await initDb(c.env.DB);
  const x1 = parseInt(c.req.query("x1") || "0");
  const y1 = parseInt(c.req.query("y1") || "0");
  const x2 = parseInt(c.req.query("x2") || "500");
  const y2 = parseInt(c.req.query("y2") || "500");
  const pixels = await getCanvasRegion(c.env.DB, x1, y1, x2, y2);
  return c.json({ pixels });
});

// Get price for a specific pixel
app.get("/api/pixel/:x/:y", async (c) => {
  await initDb(c.env.DB);
  const x = parseInt(c.req.param("x"));
  const y = parseInt(c.req.param("y"));
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) {
    return c.json({ error: "Out of bounds" }, 400);
  }
  const pixel = await getPixel(c.env.DB, x, y);
  const price = getPixelPrice(pixel);
  const priceDollars = getPixelPriceDollars(pixel);
  return c.json({
    pixel,
    price: priceDollars,
    priceCents: price,
    isOccupied: pixel !== null && pixel.brightness > 0,
  });
});

// Build x402 payment requirements for a pixel
function buildPaymentRequired(
  origin: string,
  x: number,
  y: number,
  existing: boolean,
  priceDollars: string,
  priceCents: number,
  env: Env,
) {
  const description = `Place pixel at (${x}, ${y}) - ${existing ? "overwrite for " + priceDollars : "base price " + priceDollars}`;
  return {
    x402Version: 2,
    error: "Payment required to place a pixel",
    accepts: [
      {
        scheme: "exact",
        network: env.NETWORK || "eip155:723",
        maxAmountRequired: String(Math.round(priceCents * 10000)),
        resource: `${origin}/api/pixel`,
        description,
        asset: "0x33ad9e4bd16b69b5bfded37d8b5d9ff9aba014fb",
        payTo: env.PAYMENT_ADDRESS,
        maxTimeoutSeconds: 300,
        extra: { assetTransferMethod: "erc2612", name: "Stable Coin", version: "1" },
      },
    ],
  };
}

// Place a pixel — supports two modes:
// 1. PAYMENT-SIGNATURE header → x402 paid placement (verify + settle with facilitator)
// 2. Neither → return 402 with payment requirements
app.post("/api/pixel", async (c) => {
  await initDb(c.env.DB);

  const body = await c.req.json<PlacePixelRequest>();
  const { x, y, color, faction } = body;

  // Validate coordinates
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) {
    return c.json({ error: "Coordinates out of bounds (0-499)" }, 400);
  }
  // Validate color
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return c.json({ error: "Invalid color format. Use #RRGGBB" }, 400);
  }

  const existing = await getPixel(c.env.DB, x, y);
  const requiredPrice = getPixelPrice(existing);
  const requiredPriceDollars = getPixelPriceDollars(existing);

  const paymentSig = c.req.header("PAYMENT-SIGNATURE") || c.req.header("payment-signature");

  // --- Path 1: x402 paid placement ---
  if (paymentSig) {
    let payer = "anonymous";
    const decoded = JSON.parse(atob(paymentSig));
    payer = decoded?.payload?.authorization?.from || "anonymous";

    const facilitatorUrl = c.env.FACILITATOR_URL || "https://x402.stablecoin.xyz";
    const origin = new URL(c.req.url).origin;
    const requirements = {
      scheme: "exact",
      network: c.env.NETWORK || "eip155:723",
      maxAmountRequired: String(Math.round(requiredPrice * 10000)),
      resource: `${origin}/api/pixel`,
      description: `Place pixel at (${x}, ${y})`,
      asset: "0x33ad9e4bd16b69b5bfded37d8b5d9ff9aba014fb",
      payTo: c.env.PAYMENT_ADDRESS,
      maxTimeoutSeconds: 300,
      extra: { assetTransferMethod: "erc2612", name: "Stable Coin", version: "1" },
    };

    const facilitatorHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (c.env.FACILITATOR_API_KEY) {
      facilitatorHeaders["X-API-Key"] = c.env.FACILITATOR_API_KEY;
    }

    // Verify
    const payloadBody = JSON.stringify({ paymentPayload: decoded, paymentRequirements: requirements });
    let verifyRes: Response;
    try {
      verifyRes = await fetch(`${facilitatorUrl}/verify`, {
        method: "POST",
        headers: facilitatorHeaders,
        body: payloadBody,
      });
    } catch (e: any) {
      return c.json({ error: "Facilitator unreachable during verify", reason: e.message }, 502);
    }
    if (!verifyRes.ok && verifyRes.status !== 200) {
      const text = await verifyRes.text().catch(() => "");
      return c.json({ error: "Facilitator verify returned " + verifyRes.status, reason: text }, 502);
    }
    const verification = (await verifyRes.json()) as any;
    if (!verification.isValid) {
      return c.json({ error: "Payment verification failed", reason: verification.invalidReason }, 402);
    }

    // Settle (with retry — transient facilitator failures are common)
    let settlement: any = null;
    let settleError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const settleRes = await fetch(`${facilitatorUrl}/settle`, {
          method: "POST",
          headers: facilitatorHeaders,
          body: payloadBody,
        });
        if (!settleRes.ok && settleRes.status !== 200) {
          settleError = "Facilitator settle returned " + settleRes.status;
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        settlement = (await settleRes.json()) as any;
        if (settlement.success) break;
        settleError = settlement.errorReason || "Settlement rejected";
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      } catch (e: any) {
        settleError = e.message || "Network error";
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    if (!settlement?.success) {
      return c.json({ error: "Payment settlement failed", reason: settleError }, 402);
    }

    const pixel = await placePixel(c.env.DB, x, y, color, payer, faction || null, requiredPrice);
    const factions = await getFactions(c.env.DB);
    const stats = await getStats(c.env.DB);
    return c.json({
      success: true, pixel, factions, stats, paid: true,
      message: `Pixel placed at (${x}, ${y}) for ${requiredPriceDollars}`,
    });
  }

  // --- Path 2: No payment — return 402 ---
  const paymentRequired = buildPaymentRequired(
    new URL(c.req.url).origin, x, y, existing !== null && existing.brightness > 0,
    requiredPriceDollars, requiredPrice, c.env,
  );
  const encoded = toBase64(JSON.stringify(paymentRequired));
  return c.json(paymentRequired, 402, { "PAYMENT-REQUIRED": encoded });
});

// Leaderboard
app.get("/api/leaderboard", async (c) => {
  await initDb(c.env.DB);
  const factions = await getFactions(c.env.DB);
  const stats = await getStats(c.env.DB);
  const recent = await getRecentPlacements(c.env.DB, 20);
  return c.json({ factions, stats, recent });
});

// Recent activity feed
app.get("/api/activity", async (c) => {
  await initDb(c.env.DB);
  const limit = parseInt(c.req.query("limit") || "50");
  const recent = await getRecentPlacements(c.env.DB, Math.min(limit, 100));
  return c.json({ recent });
});

// Trigger decay (can be called by a cron or manually)
app.post("/api/decay", async (c) => {
  await initDb(c.env.DB);
  const removed = await decayPixels(c.env.DB);
  return c.json({ removed, message: `Decayed ${removed} pixels` });
});

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", canvasSize: CANVAS_SIZE, version: "1.0.0" });
});

export default app;
