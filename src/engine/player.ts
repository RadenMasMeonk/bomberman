import { TILE } from './constants';
import { isSolidCell } from './grid';
import type { Bomb } from './types';
import { CellType } from './types';

export interface MoveBox {
  px: number;
  py: number;
  size: number;
}

/** Pixel-space collision: can the box at (px,py) with given size overlap only walkable tiles? */
export function canOccupy(
  grid: CellType[][],
  px: number,
  py: number,
  size: number,
  bombs: Bomb[],
  ignoreBombId: number | null,
  playerOnBombTile: { tx: number; ty: number } | null,
): boolean {
  const x0 = Math.floor(px / TILE);
  const y0 = Math.floor(py / TILE);
  const x1 = Math.floor((px + size - 1) / TILE);
  const y1 = Math.floor((py + size - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolidCell(grid, tx, ty)) return false;
      const bomb = bombs.find((b) => b.tx === tx && b.ty === ty);
      if (bomb) {
        if (ignoreBombId !== null && bomb.id === ignoreBombId) continue;
        // Freshly placed bomb stays walkable until the player has fully
        // stepped off it (see updateBombPassThrough). No tile check here:
        // passThrough is cleared exactly when overlap ends.
        if (bomb.passThrough) continue;
        return false;
      }
    }
  }
  return true;
}

/**
 * Move with axis separation + corner sliding assistance.
 * Returns new position. Size is slightly smaller than a tile for forgiveness.
 */
export function moveWithCollision(
  grid: CellType[][],
  px: number,
  py: number,
  dx: number,
  dy: number,
  size: number,
  bombs: Bomb[],
  passTile: { tx: number; ty: number } | null,
): { px: number; py: number } {
  let nx = px;
  let ny = py;
  // X axis
  if (dx !== 0) {
    const tryX = nx + dx;
    if (canOccupy(grid, tryX, ny, size, bombs, null, passTile)) {
      nx = tryX;
    } else {
      // corner assist: nudge vertically toward tile center
      const centerY = Math.round(ny / TILE) * TILE + (TILE - size) / 2;
      const diff = centerY - ny;
      if (Math.abs(diff) > 1 && Math.abs(diff) < 18) {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), Math.abs(dx));
        if (canOccupy(grid, nx, ny + step, size, bombs, null, passTile)) ny += step;
      }
    }
  }
  // Y axis
  if (dy !== 0) {
    const tryY = ny + dy;
    if (canOccupy(grid, nx, tryY, size, bombs, null, passTile)) {
      ny = tryY;
    } else {
      const centerX = Math.round(nx / TILE) * TILE + (TILE - size) / 2;
      const diff = centerX - nx;
      if (Math.abs(diff) > 1 && Math.abs(diff) < 18) {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), Math.abs(dy));
        if (canOccupy(grid, nx + step, ny, size, bombs, null, passTile)) nx += step;
      }
    }
  }
  return { px: nx, py: ny };
}

export const PLAYER_SIZE = TILE - 14;
