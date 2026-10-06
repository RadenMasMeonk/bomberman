import { TILE } from './constants';
import { PLAYER_SIZE } from './player';
import type { Bomb, GameState } from './types';

export function activeBombCount(state: GameState): number {
  return state.bombs.length;
}

export function canPlaceBomb(state: GameState): boolean {
  const p = state.player;
  if (!p.alive || state.status !== 'playing') return false;
  if (state.bombs.length >= p.maxBombs) return false;
  const tx = Math.floor((p.px + TILE / 2) / TILE);
  const ty = Math.floor((p.py + TILE / 2) / TILE);
  return !state.bombs.some((b) => b.tx === tx && b.ty === ty);
}

export function placeBomb(state: GameState): Bomb | null {
  if (!canPlaceBomb(state)) return null;
  const p = state.player;
  const tx = Math.floor((p.px + TILE / 2) / TILE);
  const ty = Math.floor((p.py + TILE / 2) / TILE);
  const bomb: Bomb = {
    id: state.nextId++,
    tx,
    ty,
    fuse: 2.0,
    range: p.range,
    owner: 'player',
    passThrough: true,
  };
  state.bombs.push(bomb);
  state.sounds.push('place');
  return bomb;
}

/**
 * Disable passThrough only once the player's body box no longer overlaps
 * the bomb tile at all. Checking the center point instead would trap the
 * player at the tile boundary (body half-out, bomb already solid).
 */
export function updateBombPassThrough(state: GameState): void {
  const p = state.player;
  for (const b of state.bombs) {
    if (!b.passThrough) continue;
    const bx = b.tx * TILE;
    const by = b.ty * TILE;
    const overlaps =
      p.px < bx + TILE && p.px + PLAYER_SIZE > bx && p.py < by + TILE && p.py + PLAYER_SIZE > by;
    if (!overlaps) b.passThrough = false;
  }
}
