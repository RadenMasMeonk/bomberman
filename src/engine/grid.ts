import { COLS, ROWS } from './constants';
import { CellType } from './types';

export function isWallCell(x: number, y: number): boolean {
  if (x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1) return true;
  return x % 2 === 0 && y % 2 === 0;
}

const START_SAFE = new Set(['1,1', '1,2', '2,1']);

function isStartSafe(x: number, y: number): boolean {
  return START_SAFE.has(`${x},${y}`);
}

/** Generate a level grid. `rand` injectable for tests. */
export function generateGrid(level: number, rand: () => number = Math.random): CellType[][] {
  const grid: CellType[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < COLS; x++) {
      if (isWallCell(x, y)) row.push(CellType.Wall);
      else row.push(CellType.Empty);
    }
    grid.push(row);
  }
  // Block density decreases slightly with level: 65% -> ~50%
  const density = Math.max(0.5, 0.68 - (level - 1) * 0.03);
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (grid[y][x] !== CellType.Empty) continue;
      if (isStartSafe(x, y)) continue;
      if (rand() < density) grid[y][x] = CellType.Block;
    }
  }
  return grid;
}

/** Ensure the L-shaped spawn is clear (used by tests & safety). */
export function clearSpawn(grid: CellType[][]): void {
  const cells: [number, number][] = [
    [1, 1],
    [1, 2],
    [2, 1],
  ];
  for (const [x, y] of cells) grid[y][x] = CellType.Empty;
}

export function isSolidCell(grid: CellType[][], x: number, y: number): boolean {
  if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return true;
  return grid[y][x] !== CellType.Empty;
}

export function inBounds(x: number, y: number, cols = COLS, rows = ROWS): boolean {
  return x >= 0 && y >= 0 && x < cols && y < rows;
}
