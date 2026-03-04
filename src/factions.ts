// Shared faction definitions — used by both frontend and backend
export const FACTIONS = [
  { name: "Bombadil", color: "#d4a017" },   // LOTR — gold
  { name: "Starbuck", color: "#4ade80" },    // BSG — green
  { name: "Muaddib", color: "#f97316" },     // Dune — orange
  { name: "Kenobi", color: "#3b82f6" },      // Star Wars — blue
  { name: "Picard", color: "#ef4444" },      // Star Trek — red
  { name: "Deckard", color: "#a78bfa" },     // Blade Runner — purple
  { name: "Ripley", color: "#06b6d4" },      // Alien — cyan
] as const;

export function getFactionForAddress(address: string): (typeof FACTIONS)[number] {
  const lastChar = address.slice(-1).toLowerCase();
  const index = parseInt(lastChar, 16) % FACTIONS.length;
  return FACTIONS[index];
}
