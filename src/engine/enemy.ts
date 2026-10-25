import { TILE, COLS, ROWS } from './constants';
import { isSolidCell } from './grid';
import type { CellType, Dir, Enemy, EnemyKind, GameState } from './types';
import { PLAYER_SIZE } from './player';

const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/** BUG FIX (2026-10-25): directions that actually lead out of a tile. */
function freeNeighbors(grid: CellType[][], x: number, y: number): Dir[] {
  return DIRS.filter((d) => !isSolidCell(grid, x + d.x, y + d.y));
}

export function spawnEnemies(
  state: GameState,
  specs: { kind: EnemyKind; count: number }[],
  getSpeed: (kind: EnemyKind) => number,
  rand: () => number = Math.random,
): void {
  const occupied = new Set(state.enemies.map((e) => `${enemyTile(e).tx},${enemyTile(e).ty}`));
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i++) {
      const spot = findSpawnSpot(state.grid, rand, occupied);
      if (!spot) continue;
      occupied.add(`${spot.x},${spot.y}`);
      const scoreValue = spec.kind === 'wanderer' ? 100 : spec.kind === 'chaser' ? 200 : 300;
      // BUG FIX (2026-10-25): the old code picked a completely random direction
      // that could point straight into a block. Now the first direction always
      // points at a real open neighbour, so enemies start roaming immediately.
      const exits = freeNeighbors(state.grid, spot.x, spot.y);
      const dir = exits[Math.floor(rand() * exits.length)] ?? { x: 0, y: 0 };
      state.enemies.push({
        id: state.nextId++,
        kind: spec.kind,
        px: spot.x * TILE + (TILE - PLAYER_SIZE) / 2,
        py: spot.y * TILE + (TILE - PLAYER_SIZE) / 2,
        dir: { ...dir },
        speed: getSpeed(spec.kind),
        alive: true,
        changeTimer: 0,
        scoreValue,
      });
    }
  }
}

function findSpawnSpot(
  grid: CellType[][],
  rand: () => number,
  occupied: Set<string>,
): { x: number; y: number } | null {
  let fallback: { x: number; y: number } | null = null;
  for (let tries = 0; tries < 400; tries++) {
    const x = 1 + Math.floor(rand() * (COLS - 2));
    const y = 1 + Math.floor(rand() * (ROWS - 2));
    if (grid[y][x] !== 0) continue;
    // keep distance from player spawn (1,1)
    const dist = Math.abs(x - 1) + Math.abs(y - 1);
    if (dist < 6) continue;
    // don't stack two enemies on the same tile
    if (occupied.has(`${x},${y}`)) continue;
    // BUG FIX (2026-10-25): never spawn inside a pocket sealed by destructible
    // blocks. That was the reason enemies sat still until the player blew up a
    // nearby block. An enemy needs at least one open neighbour to move at all.
    const exits = freeNeighbors(grid, x, y).length;
    if (exits === 0) continue;
    // Prefer corridors/junctions (2+ exits) over dead ends; a dead end is an
    // acceptable fallback because the enemy can still walk in and out.
    if (exits >= 2) return { x, y };
    if (!fallback) fallback = { x, y };
  }
  return fallback;
}

/** BFS next-step direction toward target tile, avoiding solid cells. */
export function bfsDirection(
  grid: CellType[][],
  fromTx: number,
  fromTy: number,
  toTx: number,
  toTy: number,
): { x: number; y: number } | null {
  if (fromTx === toTx && fromTy === toTy) return null;
  const rows = grid.length;
  const cols = grid[0].length;
  const prev = new Map<string, string>();
  const q: [number, number][] = [[fromTx, fromTy]];
  const seen = new Set([`${fromTx},${fromTy}`]);
  while (q.length) {
    const [cx, cy] = q.shift()!;
    if (cx === toTx && cy === toTy) break;
    for (const d of DIRS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(k)) continue;
      if (isSolidCell(grid, nx, ny)) continue;
      seen.add(k);
      prev.set(k, `${cx},${cy}`);
      q.push([nx, ny]);
    }
  }
  const target = `${toTx},${toTy}`;
  if (!seen.has(target)) return null;
  // walk back to neighbor of start
  let cur = target;
  let p = prev.get(cur);
  while (p && p !== `${fromTx},${fromTy}`) {
    cur = p;
    p = prev.get(cur);
  }
  if (!p) return null;
  const [nx, ny] = cur.split(',').map(Number);
  return { x: Math.sign(nx - fromTx), y: Math.sign(ny - fromTy) };
}

export function enemyTile(e: Enemy): { tx: number; ty: number } {
  return {
    tx: Math.floor((e.px + PLAYER_SIZE / 2) / TILE),
    ty: Math.floor((e.py + PLAYER_SIZE / 2) / TILE),
  };
}
