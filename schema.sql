-- Pixels table: the canvas state
CREATE TABLE IF NOT EXISTS pixels (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#000000',
  owner TEXT DEFAULT NULL,
  brightness REAL NOT NULL DEFAULT 100.0,
  price_cents REAL NOT NULL DEFAULT 0.01,
  last_placed_at TEXT NOT NULL DEFAULT (datetime('now')),
  faction TEXT DEFAULT NULL,
  PRIMARY KEY (x, y)
);

-- Factions leaderboard
CREATE TABLE IF NOT EXISTS factions (
  name TEXT PRIMARY KEY,
  pixel_count INTEGER NOT NULL DEFAULT 0,
  total_spent_cents REAL NOT NULL DEFAULT 0
);

-- Recent pixel placements for activity feed
CREATE TABLE IF NOT EXISTS placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  color TEXT NOT NULL,
  owner TEXT NOT NULL,
  price_cents REAL NOT NULL,
  faction TEXT DEFAULT NULL,
  placed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for decay queries
CREATE INDEX IF NOT EXISTS idx_pixels_last_placed ON pixels(last_placed_at);
-- Index for faction lookups
CREATE INDEX IF NOT EXISTS idx_pixels_faction ON pixels(faction);
-- Index for recent placements
CREATE INDEX IF NOT EXISTS idx_placements_time ON placements(placed_at DESC);
