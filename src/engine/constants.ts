export const COLS = 15;
export const ROWS = 13;
export const TILE = 48;

export const BOMB_FUSE = 2.0;
export const EXPLOSION_DURATION = 0.55;
export const INVINCIBLE_TIME = 2.0;
export const SHIELD_DURATION = 10.0;

export const BASE_SPEED = 150; // px/sec
export const SPEED_UP_STEP = 22;
export const MAX_SPEED = 260;

export const POWERUP_DROP_CHANCE = 0.25;

export const TIME_LIMITS = [180, 170, 160, 150, 140];

export function timeLimitForLevel(level: number): number {
  if (level <= TIME_LIMITS.length) return TIME_LIMITS[level - 1];
  return 120;
}

/** Enemy counts per level (1-indexed). Scales after 5. */
export function enemySpecForLevel(level: number): { kind: 'wanderer' | 'chaser' | 'smart'; count: number }[] {
  const l = Math.min(level, 8);
  const spec: { kind: 'wanderer' | 'chaser' | 'smart'; count: number }[] = [
    { kind: 'wanderer', count: Math.min(2 + level, 5) },
  ];
  if (l >= 2) spec.push({ kind: 'chaser', count: Math.min(1 + Math.floor(level / 1.5), 4) });
  if (l >= 3) spec.push({ kind: 'smart', count: Math.min(Math.floor(level / 2), 3) });
  if (level > 5) spec[0].count += level - 5;
  return spec;
}

export function enemySpeed(kind: string, level: number): number {
  const base = kind === 'wanderer' ? 70 : kind === 'chaser' ? 95 : 125;
  return Math.min(base + (level - 1) * 8, 220);
}
