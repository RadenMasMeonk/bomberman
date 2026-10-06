import { TILE, BASE_SPEED, SPEED_UP_STEP, MAX_SPEED, SHIELD_DURATION } from './constants';
import type { GameState, PowerUpType } from './types';

export function randomPowerUp(rand: () => number = Math.random): PowerUpType {
  const r = rand();
  if (r < 0.3) return 'fire';
  if (r < 0.55) return 'bomb';
  if (r < 0.75) return 'speed';
  if (r < 0.93) return 'shield';
  return 'life';
}

export function applyPowerUp(state: GameState, type: PowerUpType): number {
  const p = state.player;
  let score = 50;
  switch (type) {
    case 'bomb':
      p.maxBombs = Math.min(p.maxBombs + 1, 6);
      break;
    case 'fire':
      p.range = Math.min(p.range + 1, 8);
      break;
    case 'speed':
      p.speed = Math.min(p.speed + SPEED_UP_STEP, MAX_SPEED);
      break;
    case 'shield':
      p.shieldUntil = state.time + SHIELD_DURATION;
      break;
    case 'life':
      state.lives += 1;
      score = 100;
      break;
  }
  state.sounds.push('powerup');
  return score;
}

export function playerTile(state: GameState): { tx: number; ty: number } {
  const p = state.player;
  return {
    tx: Math.floor((p.px + TILE / 2) / TILE),
    ty: Math.floor((p.py + TILE / 2) / TILE),
  };
}

export function baseSpeed(): number {
  return BASE_SPEED;
}
