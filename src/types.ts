export interface Env {
  DB: D1Database;
  PAYMENT_ADDRESS: string;
  FACILITATOR_URL: string;
  FACILITATOR_API_KEY?: string;
  NETWORK: string;
  BASE_PRICE: string;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  owner: string | null;
  price_cents: number;
  last_placed_at: string;
  faction: string | null;
}

export interface Faction {
  name: string;
  pixel_count: number;
  total_spent_cents: number;
}

export interface Placement {
  id: number;
  x: number;
  y: number;
  color: string;
  owner: string;
  price_cents: number;
  faction: string | null;
  placed_at: string;
}

export interface CanvasState {
  pixels: Array<{
    x: number;
    y: number;
    color: string;
    owner: string | null;
    faction: string | null;
  }>;
  factions: Faction[];
  stats: {
    total_pixels_placed: number;
    active_pixels: number;
    total_spent: number;
  };
}

export interface PlacePixelRequest {
  x: number;
  y: number;
  color: string;
  faction?: string;
}
