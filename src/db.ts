import type { Pixel, Faction, Placement } from "./types";

const CANVAS_SIZE = 500;
const DECAY_RATE = 5; // 5% per hour
const MAX_PRICE_CENTS = 10; // $0.10 cap
const BASE_PRICE_CENTS = 0.01; // $0.0001

let dbInitialized = false;

export async function initDb(db: D1Database) {
  if (dbInitialized) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS pixels (
      x INTEGER NOT NULL, y INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#000000',
      owner TEXT DEFAULT NULL, brightness REAL NOT NULL DEFAULT 100.0,
      price_cents REAL NOT NULL DEFAULT 0.01,
      last_placed_at TEXT NOT NULL DEFAULT (datetime('now')),
      faction TEXT DEFAULT NULL, PRIMARY KEY (x, y)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS factions (
      name TEXT PRIMARY KEY, pixel_count INTEGER NOT NULL DEFAULT 0,
      total_spent_cents REAL NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      x INTEGER NOT NULL, y INTEGER NOT NULL, color TEXT NOT NULL,
      owner TEXT NOT NULL, price_cents REAL NOT NULL,
      faction TEXT DEFAULT NULL, placed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_pixels_last_placed ON pixels(last_placed_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_pixels_faction ON pixels(faction)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_placements_time ON placements(placed_at DESC)`),
  ]);
  dbInitialized = true;
}

export function getPixelPrice(existing: Pixel | null): number {
  if (!existing || existing.brightness <= 0) return BASE_PRICE_CENTS;
  return Math.min(existing.price_cents * 2, MAX_PRICE_CENTS);
}

export function getPixelPriceDollars(existing: Pixel | null): string {
  const cents = getPixelPrice(existing);
  return `$${(cents / 100).toFixed(6)}`;
}

function applyDecay(pixel: Pixel): Pixel {
  const now = Date.now();
  const placed = new Date(pixel.last_placed_at + "Z").getTime();
  const hoursElapsed = (now - placed) / (1000 * 60 * 60);
  const decayedBrightness = Math.max(0, pixel.brightness - DECAY_RATE * hoursElapsed);
  return { ...pixel, brightness: decayedBrightness };
}

export async function getPixel(db: D1Database, x: number, y: number): Promise<Pixel | null> {
  const row = await db.prepare("SELECT * FROM pixels WHERE x = ? AND y = ?").bind(x, y).first<Pixel>();
  if (!row) return null;
  return applyDecay(row);
}

export async function placePixel(
  db: D1Database,
  x: number,
  y: number,
  color: string,
  owner: string,
  faction: string | null,
  priceCents: number,
): Promise<Pixel> {
  const existing = await getPixel(db, x, y);
  const oldFaction = existing?.faction || null;

  await db.batch([
    // Upsert the pixel
    db.prepare(`INSERT INTO pixels (x, y, color, owner, brightness, price_cents, last_placed_at, faction)
      VALUES (?, ?, ?, ?, 100.0, ?, datetime('now'), ?)
      ON CONFLICT(x, y) DO UPDATE SET
        color = excluded.color, owner = excluded.owner, brightness = 100.0,
        price_cents = excluded.price_cents, last_placed_at = excluded.last_placed_at,
        faction = excluded.faction`)
      .bind(x, y, color, owner, priceCents, faction),

    // Log the placement
    db.prepare(`INSERT INTO placements (x, y, color, owner, price_cents, faction) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(x, y, color, owner, priceCents, faction),

    // Update new faction count (if faction provided)
    ...(faction
      ? [
          db.prepare(`INSERT INTO factions (name, pixel_count, total_spent_cents)
            VALUES (?, 1, ?) ON CONFLICT(name) DO UPDATE SET
            pixel_count = pixel_count + 1, total_spent_cents = total_spent_cents + ?`)
            .bind(faction, priceCents, priceCents),
        ]
      : []),

    // Decrement old faction count if pixel was overwritten from different faction
    ...(oldFaction && oldFaction !== faction
      ? [
          db.prepare(`UPDATE factions SET pixel_count = MAX(0, pixel_count - 1) WHERE name = ?`)
            .bind(oldFaction),
        ]
      : []),
  ]);

  return {
    x, y, color, owner, brightness: 100, price_cents: priceCents,
    last_placed_at: new Date().toISOString(), faction,
  };
}

export async function getCanvasRegion(
  db: D1Database,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Promise<Pixel[]> {
  const rows = await db
    .prepare("SELECT * FROM pixels WHERE x >= ? AND x < ? AND y >= ? AND y < ? AND brightness > 0")
    .bind(x1, x2, y1, y2)
    .all<Pixel>();
  return (rows.results || []).map(applyDecay).filter((p) => p.brightness > 0);
}

export async function getAllPixels(db: D1Database): Promise<Pixel[]> {
  const rows = await db.prepare("SELECT * FROM pixels WHERE brightness > 0").all<Pixel>();
  return (rows.results || []).map(applyDecay).filter((p) => p.brightness > 0);
}

export async function getFactions(db: D1Database): Promise<Faction[]> {
  const rows = await db.prepare("SELECT * FROM factions ORDER BY total_spent_cents DESC LIMIT 20").all<Faction>();
  return rows.results || [];
}

export async function getRecentPlacements(db: D1Database, limit = 50): Promise<Placement[]> {
  const rows = await db.prepare("SELECT * FROM placements ORDER BY placed_at DESC LIMIT ?").bind(limit).all<Placement>();
  return rows.results || [];
}

export async function getStats(db: D1Database): Promise<{ total_pixels_placed: number; active_pixels: number; total_spent: number }> {
  const [totalResult, activeResult, spentResult] = await db.batch([
    db.prepare("SELECT COUNT(*) as count FROM placements"),
    db.prepare("SELECT COUNT(*) as count FROM pixels WHERE brightness > 0"),
    db.prepare("SELECT COALESCE(SUM(price_cents), 0) as total FROM placements"),
  ]);
  return {
    total_pixels_placed: (totalResult.results[0] as any)?.count || 0,
    active_pixels: (activeResult.results[0] as any)?.count || 0,
    total_spent: (spentResult.results[0] as any)?.total || 0,
  };
}

export async function decayPixels(db: D1Database): Promise<number> {
  // Delete pixels that have fully decayed (placed > 20 hours ago = 100% / 5% per hour)
  const result = await db.prepare(
    `DELETE FROM pixels WHERE datetime(last_placed_at, '+20 hours') < datetime('now')`
  ).run();
  return result.meta?.changes || 0;
}

export { CANVAS_SIZE, BASE_PRICE_CENTS, MAX_PRICE_CENTS };
