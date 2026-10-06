// Shared engine types — pure TypeScript, no React imports.

export const enum CellType {
  Empty = 0,
  Wall = 1,
  Block = 2,
}

export type Vec = { x: number; y: number };

export type Dir = { x: number; y: number };

export type PowerUpType = 'bomb' | 'fire' | 'speed' | 'shield' | 'life';

export interface Bomb {
  id: number;
  tx: number;
  ty: number;
  fuse: number;
  range: number;
  owner: 'player';
  passThrough: boolean;
}

export interface Explosion {
  id: number;
  cells: Vec[];
  timer: number;
  duration: number;
}

export type EnemyKind = 'wanderer' | 'chaser' | 'smart';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  /** pixel position (top-left in pixels) */
  px: number;
  py: number;
  dir: Dir;
  speed: number; // px per second
  alive: boolean;
  changeTimer: number;
  scoreValue: number;
}

export interface PlayerState {
  /** pixel position top-left */
  px: number;
  py: number;
  dir: Dir;
  moving: boolean;
  speed: number; // px/sec
  maxBombs: number;
  range: number;
  shieldUntil: number; // game-time seconds remaining shield
  invincibleUntil: number; // game-time for blink
  alive: boolean;
  deathTimer: number;
  walkPhase: number;
}

export interface PowerUpItem {
  id: number;
  tx: number;
  ty: number;
  type: PowerUpType;
}

export interface ExitDoor {
  tx: number;
  ty: number;
  revealed: boolean;
}

export interface FloatText {
  id: number;
  px: number;
  py: number;
  text: string;
  timer: number;
  duration: number;
}

export interface Particle {
  px: number;
  py: number;
  vx: number;
  vy: number;
  timer: number;
  duration: number;
  color: string;
  size: number;
}

export interface ScoreEvent {
  kind: 'block' | 'enemy' | 'powerup' | 'level' | 'life';
  amount: number;
  px: number;
  py: number;
}

export interface GameState {
  level: number;
  cols: number;
  rows: number;
  grid: CellType[][];
  player: PlayerState;
  bombs: Bomb[];
  explosions: Explosion[];
  enemies: Enemy[];
  powerups: PowerUpItem[];
  exit: ExitDoor;
  time: number; // elapsed game time
  timeLeft: number;
  score: number;
  lives: number;
  status: 'playing' | 'dying' | 'clear' | 'gameover';
  statusTimer: number;
  nextId: number;
  floats: FloatText[];
  particles: Particle[];
  events: ScoreEvent[];
  sounds: string[];
  shake: number;
  enemiesRemaining: number;
}
