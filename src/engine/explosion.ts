import { CellType, type Vec } from './types';

/**
 * Compute cross-shaped blast cells from (tx,ty) with given range.
 * Stopped by walls; stops AFTER including the first block hit.
 */
export function computeBlast(
  grid: CellType[][],
  tx: number,
  ty: number,
  range: number,
): { cells: Vec[]; hitBlocks: Vec[] } {
  const cells: Vec[] = [{ x: tx, y: ty }];
  const hitBlocks: Vec[] = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const rows = grid.length;
  const cols = grid[0].length;
  for (const d of dirs) {
    for (let i = 1; i <= range; i++) {
      const x = tx + d.x * i;
      const y = ty + d.y * i;
      if (x < 0 || y < 0 || x >= cols || y >= rows) break;
      const c = grid[y][x];
      if (c === CellType.Wall) break;
      cells.push({ x, y });
      if (c === CellType.Block) {
        hitBlocks.push({ x, y });
        break;
      }
    }
  }
  return { cells, hitBlocks };
}

/** True if tile is covered by any active explosion. */
export function tileInExplosions(explosions: { cells: Vec[] }[], tx: number, ty: number): boolean {
  return explosions.some((e) => e.cells.some((c) => c.x === tx && c.y === ty));
}
