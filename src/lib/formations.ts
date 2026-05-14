export type LineRole = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface FormationSlot {
  role: LineRole;
  /** Normalized x in [0,1] within team's half (0=goal, 1=halfway line) */
  x: number;
  /** Normalized y in [0,1] across pitch width (0=top, 1=bottom) */
  y: number;
}

export interface Formation {
  name: string;
  slots: FormationSlot[];
}

/** Spread n items evenly across the pitch width */
function spread(n: number): number[] {
  if (n === 1) return [0.5];
  return Array.from({ length: n }, (_, i) => (i + 0.5) / n);
}

function makeFormation(
  name: string,
  lines: Array<{ role: LineRole; x: number; count: number }>,
): Formation {
  const slots: FormationSlot[] = [];
  for (const { role, x, count } of lines) {
    for (const y of spread(count)) {
      slots.push({ role, x, y });
    }
  }
  return { name, slots };
}

export const FORMATIONS: Record<string, Formation> = {
  '4-3-3': makeFormation('4-3-3', [
    { role: 'GK', x: 0.07, count: 1 },
    { role: 'DEF', x: 0.28, count: 4 },
    { role: 'MID', x: 0.55, count: 3 },
    { role: 'ATT', x: 0.82, count: 3 },
  ]),
  '4-4-2': makeFormation('4-4-2', [
    { role: 'GK', x: 0.07, count: 1 },
    { role: 'DEF', x: 0.28, count: 4 },
    { role: 'MID', x: 0.58, count: 4 },
    { role: 'ATT', x: 0.86, count: 2 },
  ]),
  '3-5-2': makeFormation('3-5-2', [
    { role: 'GK', x: 0.07, count: 1 },
    { role: 'DEF', x: 0.28, count: 3 },
    { role: 'MID', x: 0.55, count: 5 },
    { role: 'ATT', x: 0.86, count: 2 },
  ]),
  '4-2-3-1': makeFormation('4-2-3-1', [
    { role: 'GK', x: 0.07, count: 1 },
    { role: 'DEF', x: 0.24, count: 4 },
    { role: 'MID', x: 0.46, count: 2 },
    { role: 'MID', x: 0.67, count: 3 },
    { role: 'ATT', x: 0.88, count: 1 },
  ]),
  // Small-sided
  '1-2-1': makeFormation('1-2-1', [
    { role: 'GK', x: 0.1, count: 1 },
    { role: 'DEF', x: 0.38, count: 2 },
    { role: 'ATT', x: 0.82, count: 1 },
  ]),
  '1-2-1-1': makeFormation('1-2-1-1', [
    { role: 'GK', x: 0.08, count: 1 },
    { role: 'DEF', x: 0.32, count: 2 },
    { role: 'MID', x: 0.6, count: 1 },
    { role: 'ATT', x: 0.85, count: 1 },
  ]),
  '1-3-2': makeFormation('1-3-2', [
    { role: 'GK', x: 0.08, count: 1 },
    { role: 'DEF', x: 0.35, count: 3 },
    { role: 'ATT', x: 0.78, count: 2 },
  ]),
  '1-2-3': makeFormation('1-2-3', [
    { role: 'GK', x: 0.08, count: 1 },
    { role: 'DEF', x: 0.35, count: 2 },
    { role: 'ATT', x: 0.78, count: 3 },
  ]),
};

export const FULL_SIDED_FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];

/** Pick the best default formation for a given player count */
export function pickFormation(playerCount: number): string {
  if (playerCount >= 10) return '4-3-3';
  if (playerCount === 9 || playerCount === 8) return '4-3-3';
  if (playerCount === 7) return '1-3-2';
  if (playerCount === 6) return '1-2-1-1';
  if (playerCount <= 5) return '1-2-1';
  return '4-3-3';
}

/** Returns the available formation names for a player count */
export function availableFormations(playerCount: number): string[] {
  if (playerCount >= 8) return FULL_SIDED_FORMATIONS;
  if (playerCount === 7) return ['1-3-2', '1-2-3'];
  if (playerCount === 6) return ['1-2-1-1'];
  return ['1-2-1'];
}
