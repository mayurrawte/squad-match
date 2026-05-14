// src/lib/initials.ts

export function getInitials(name: string): string {
  // Strip non-alphanumeric (except spaces), split on whitespace, take first letter
  // of up to 2 tokens, uppercase. Empty / whitespace-only → "?".
  const tokens = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return '?';
  if (tokens.length === 1) return tokens[0][0].toUpperCase();
  return (tokens[0][0] + tokens[1][0]).toUpperCase();
}

const PALETTE = [
  { bg: '#E0E7FF', ink: '#1E40AF' }, // blue marker tint
  { bg: '#FEE2E2', ink: '#DC2626' }, // red marker tint
  { bg: '#DCFCE7', ink: '#16A34A' }, // green marker tint
  { bg: '#FEF9C3', ink: '#A16207' }, // yellow marker tint
  { bg: '#E5E7EB', ink: '#1A1A1A' }, // grey
];

export function getInitialsColor(name: string): { bg: string; ink: string } {
  // djb2-style hash for determinism
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
