import {
  COLS,
  ROWS,
  TILE,
  BOMB_FUSE,
  EXPLOSION_DURATION,
  INVINCIBLE_TIME,
  POWERUP_DROP_CHANCE,
  BASE_SPEED,
  timeLimitForLevel,
  enemySpecForLevel,
  enemySpeed,
} from './constants';
import { generateGrid, clearSpawn } from './grid';
import { PLAYER_SIZE, moveWithCollision } from './player';
import { computeBlast, tileInExplosions } from './explosion';
import { placeBomb, updateBombPassThrough } from './bomb';
import { applyPowerUp, randomPowerUp, playerTile } from './powerups';
import { spawnEnemies, bfsDirection, enemyTile } from './enemy';
import { CellType, type GameState } from './types';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function createGame(level = 1, lives = 3, score = 0, keepAbilities = false, prev?: GameState): GameState {
  const grid = generateGrid(level);
  clearSpawn(grid);
  const state: GameState = {
    level,
    cols: COLS,
    rows: ROWS,
    grid,
    player: {
      px: 1 * TILE + (TILE - PLAYER_SIZE) / 2,
      py: 1 * TILE + (TILE - PLAYER_SIZE) / 2,
      dir: { x: 0, y: 1 },
      moving: false,
      speed: prev && keepAbilities ? prev.player.speed : BASE_SPEED,
      maxBombs: prev && keepAbilities ? prev.player.maxBombs : 1,
      range: prev && keepAbilities ? prev.player.range : 2,
      shieldUntil: 0,
      invincibleUntil: 0,
      alive: true,
      deathTimer: 0,
      walkPhase: 0,
    },
    bombs: [],
    explosions: [],
    enemies: [],
    powerups: [],
    exit: { tx: 0, ty: 0, revealed: false },
    time: 0,
    timeLeft: timeLimitForLevel(level),
    score,
    lives,
    status: 'playing',
    statusTimer: 0,
    nextId: 1,
    floats: [],
    particles: [],
    events: [],
    sounds: [],
    shake: 0,
    enemiesRemaining: 0,
  };
  // Hide exit under a random block
  const blocks: { x: number; y: number }[] = [];
  for (let y = 1; y < ROWS - 1; y++)
    for (let x = 1; x < COLS - 1; x++) if (grid[y][x] === CellType.Block) blocks.push({ x, y });
  const door = blocks.length ? blocks[Math.floor(Math.random() * blocks.length)] : { x: COLS - 2, y: ROWS - 2 };
  state.exit = { tx: door.x, ty: door.y, revealed: false };

  spawnEnemies(state, enemySpecForLevel(level), (kind) => enemySpeed(kind, level));
  state.enemiesRemaining = state.enemies.length;
  return state;
}

export function tryPlaceBomb(state: GameState): void {
  placeBomb(state);
}

export function updateGame(state: GameState, input: InputState, dt: number, bombPressed: boolean): void {
  dt = Math.min(dt, 1 / 20);
  if (state.status === 'gameover' || state.status === 'clear') {
    updateFx(state, dt);
    return;
  }

  state.time += dt;
  if (state.status === 'playing') {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      killPlayer(state, true);
    }
  }

  // dying sequence
  if (state.status === 'dying') {
    state.statusTimer -= dt;
    updateFx(state, dt);
    updateExplosions(state, dt);
    if (state.statusTimer <= 0) {
      if (state.lives <= 0) {
        state.status = 'gameover';
        state.sounds.push('gameover');
      } else {
        respawnPlayer(state);
        state.status = 'playing';
      }
    }
    return;
  }

  // --- player movement ---
  const p = state.player;
  if (p.alive) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    p.moving = dx !== 0 || dy !== 0;
    if (p.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      p.dir = { x: dx, y: dy };
      p.walkPhase += dt * 10;
      const step = p.speed * dt;
      const moved = moveWithCollision(state.grid, p.px, p.py, dx * step, dy * step, PLAYER_SIZE, state.bombs, null);
      p.px = clamp(moved.px, 0, COLS * TILE - PLAYER_SIZE);
      p.py = clamp(moved.py, 0, ROWS * TILE - PLAYER_SIZE);
    }
    updateBombPassThrough(state);
    if (bombPressed) tryPlaceBomb(state);
  }

  // --- bombs ---
  updateBombs(state, dt);

  // --- explosions ---
  updateExplosions(state, dt);

  // --- enemies ---
  updateEnemies(state, input, dt);

  // --- powerup pickup ---
  checkPowerupPickup(state);

  // --- hazard checks ---
  checkHazards(state);

  // --- exit / level clear ---
  checkExit(state);

  updateFx(state, dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);
}

function updateBombs(state: GameState, dt: number): void {
  for (const b of state.bombs) b.fuse -= dt;
  // collect due bombs, including chain reactions triggered below
  const queue = state.bombs.filter((b) => b.fuse <= 0);
  const detonated = new Set<number>();
  while (queue.length) {
    const b = queue.shift()!;
    if (detonated.has(b.id)) continue;
    detonated.add(b.id);
    detonate(state, b);
    // chain: any bomb whose tile is in the new blast detonates
    for (const e of state.explosions) {
      for (const bb of state.bombs) {
        if (detonated.has(bb.id)) continue;
        if (e.cells.some((c) => c.x === bb.tx && c.y === bb.ty)) {
          bb.fuse = 0;
          if (!queue.includes(bb)) queue.push(bb);
        }
      }
    }
  }
  state.bombs = state.bombs.filter((b) => !detonated.has(b.id));
}

function detonate(state: GameState, bomb: { tx: number; ty: number; range: number; id: number }): void {
  const { cells, hitBlocks } = computeBlast(state.grid, bomb.tx, bomb.ty, bomb.range);
  state.explosions.push({ id: state.nextId++, cells, timer: EXPLOSION_DURATION, duration: EXPLOSION_DURATION });
  state.sounds.push('explosion');
  state.shake = Math.min(1, state.shake + 0.7);
  spawnExplosionParticles(state, cells);
  // destroy blocks
  for (const hb of hitBlocks) {
    state.grid[hb.y][hb.x] = CellType.Empty;
    addScore(state, 10, hb.x, hb.y, 'block');
    // reveal exit?
    if (state.exit.tx === hb.x && state.exit.ty === hb.y) state.exit.revealed = true;
    // powerup drop
    if (Math.random() < POWERUP_DROP_CHANCE) {
      // don't drop on exit tile (classic rule keeps exit usable)
      if (!(state.exit.tx === hb.x && state.exit.ty === hb.y)) {
        state.powerups.push({ id: state.nextId++, tx: hb.x, ty: hb.y, type: randomPowerUp() });
      }
    } else if (state.exit.tx === hb.x && state.exit.ty === hb.y) {
      // exit revealed, nothing else
    }
    // powerups caught in NEW blast cells (except just-spawned) are destroyed
    destroyPowerupsInBlast(state, cells, hb);
  }
  void bomb;
}

function destroyPowerupsInBlast(state: GameState, cells: { x: number; y: number }[], justDestroyed: { x: number; y: number }): void {
  const justKey = new Set(state.powerups.filter((pu) => pu.tx === justDestroyed.x && pu.ty === justDestroyed.y).map((pu) => pu.id));
  state.powerups = state.powerups.filter((pu) => {
    if (justKey.has(pu.id)) return true;
    return !cells.some((c) => c.x === pu.tx && c.y === pu.ty);
  });
}

function updateExplosions(state: GameState, dt: number): void {
  for (const e of state.explosions) e.timer -= dt;
  state.explosions = state.explosions.filter((e) => e.timer > 0);
}

function updateEnemies(state: GameState, _input: InputState, dt: number): void {
  const p = state.player;
  const pTile = playerTile(state);
  for (const e of state.enemies) {
    if (!e.alive) continue;
    // killed by explosion?
    const et = enemyTile(e);
    if (tileInExplosions(state.explosions, et.tx, et.ty)) {
      e.alive = false;
      addScore(state, e.scoreValue, et.tx, et.ty, 'enemy');
      state.sounds.push('enemyDie');
      spawnDeathParticles(state, e.px + PLAYER_SIZE / 2, e.py + PLAYER_SIZE / 2);
      continue;
    }
    // AI
    e.changeTimer -= dt;
    if (e.kind === 'wanderer') {
      if (e.changeTimer <= 0 || blockedAhead(state, e)) {
        e.dir = randomFreeDir(state, e) ?? { x: 0, y: 0 };
        e.changeTimer = 1 + Math.random() * 2;
      }
    } else if (e.kind === 'chaser') {
      const dist = Math.abs(et.tx - pTile.tx) + Math.abs(et.ty - pTile.ty);
      if (dist <= 8 && p.alive) {
        const d = bfsDirection(state.grid, et.tx, et.ty, pTile.tx, pTile.ty);
        if (d) {
          // steer toward tile center then along path: bias dir
          e.dir = d;
          e.changeTimer = 0.3;
        }
      } else if (e.changeTimer <= 0 || blockedAhead(state, e)) {
        e.dir = randomFreeDir(state, e) ?? { x: 0, y: 0 };
        e.changeTimer = 1 + Math.random() * 2;
      }
    } else {
      // smart: chase + avoid explosion tiles
      const dist = Math.abs(et.tx - pTile.tx) + Math.abs(et.ty - pTile.ty);
      if (dist <= 10 && p.alive) {
        const d = bfsDirection(state.grid, et.tx, et.ty, pTile.tx, pTile.ty);
        if (d) {
          const nx = et.tx + d.x;
          const ny = et.ty + d.y;
          if (!tileInExplosions(state.explosions, nx, ny)) {
            e.dir = d;
            e.changeTimer = 0.25;
          } else {
            e.dir = randomFreeDir(state, e, true) ?? { x: 0, y: 0 };
            e.changeTimer = 0.5;
          }
        }
      } else if (e.changeTimer <= 0 || blockedAhead(state, e)) {
        e.dir = randomFreeDir(state, e, true) ?? { x: 0, y: 0 };
        e.changeTimer = 0.8 + Math.random();
      }
    }
    // move with tile-center steering
    const step = e.speed * dt;
    const targetCx = et.tx * TILE + (TILE - PLAYER_SIZE) / 2;
    const targetCy = et.ty * TILE + (TILE - PLAYER_SIZE) / 2;
    // snap toward center of current tile on perpendicular axis for clean turning
    if (e.dir.x !== 0) {
      e.py += clamp(targetCy - e.py, -step, step);
    } else if (e.dir.y !== 0) {
      e.px += clamp(targetCx - e.px, -step, step);
    }
    const nx = e.px + e.dir.x * step;
    const ny = e.py + e.dir.y * step;
    if (canEnemyOccupy(state, nx, ny)) {
      e.px = nx;
      e.py = ny;
    } else {
      e.changeTimer = 0;
    }
  }
  state.enemies = state.enemies.filter((e) => {
    if (!e.alive) {
      state.enemiesRemaining = Math.max(0, state.enemiesRemaining - 1);
      return false;
    }
    return true;
  });
}

function blockedAhead(state: GameState, e: { px: number; py: number; dir: { x: number; y: number } }): boolean {
  return !canEnemyOccupy(state, e.px + e.dir.x * 4, e.py + e.dir.y * 4);
}

function canEnemyOccupy(state: GameState, px: number, py: number): boolean {
  const size = PLAYER_SIZE;
  const x0 = Math.floor(px / TILE);
  const y0 = Math.floor(py / TILE);
  const x1 = Math.floor((px + size - 1) / TILE);
  const y1 = Math.floor((py + size - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || ty >= ROWS || tx >= COLS) return false;
      if (state.grid[ty][tx] !== CellType.Empty) return false;
      if (state.bombs.some((b) => b.tx === tx && b.ty === ty)) return false;
    }
  }
  return true;
}

function randomFreeDir(
  state: GameState,
  e: { px: number; py: number },
  avoidBlast = false,
): { x: number; y: number } | null {
  const et = enemyTile(e as never);
  const options = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ].filter((d) => {
    const nx = et.tx + d.x;
    const ny = et.ty + d.y;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
    if (state.grid[ny][nx] !== CellType.Empty) return false;
    if (state.bombs.some((b) => b.tx === nx && b.ty === ny)) return false;
    if (avoidBlast && tileInExplosions(state.explosions, nx, ny)) return false;
    return true;
  });
  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)];
}

function checkPowerupPickup(state: GameState): void {
  const p = state.player;
  if (!p.alive) return;
  const t = playerTile(state);
  const idx = state.powerups.findIndex((pu) => pu.tx === t.tx && pu.ty === t.ty);
  if (idx >= 0) {
    const [pu] = state.powerups.splice(idx, 1);
    const gained = applyPowerUp(state, pu.type);
    addScore(state, gained, pu.tx, pu.ty, 'powerup');
  }
}

function checkHazards(state: GameState): void {
  const p = state.player;
  if (!p.alive || state.status !== 'playing') return;
  const t = playerTile(state);
  // explosion hit
  if (tileInExplosions(state.explosions, t.tx, t.ty)) {
    killPlayer(state);
    return;
  }
  // enemy touch (AABB overlap)
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const overlap =
      Math.abs(e.px - p.px) < PLAYER_SIZE - 6 && Math.abs(e.py - p.py) < PLAYER_SIZE - 6;
    if (overlap) {
      killPlayer(state);
      return;
    }
  }
}

function killPlayer(state: GameState, timeout = false): void {
  const p = state.player;
  if (!p.alive || state.status !== 'playing') return;
  if (state.time < p.invincibleUntil && !timeout) return;
  if (state.time < p.shieldUntil && !timeout) {
    // consume shield
    p.shieldUntil = 0;
    p.invincibleUntil = state.time + INVINCIBLE_TIME;
    state.sounds.push('hit');
    return;
  }
  p.alive = false;
  p.deathTimer = 1.2;
  state.lives -= 1;
  state.status = 'dying';
  state.statusTimer = 1.4;
  state.sounds.push('hit');
  spawnDeathParticles(state, p.px + PLAYER_SIZE / 2, p.py + PLAYER_SIZE / 2);
}

function respawnPlayer(state: GameState): void {
  const p = state.player;
  p.px = 1 * TILE + (TILE - PLAYER_SIZE) / 2;
  p.py = 1 * TILE + (TILE - PLAYER_SIZE) / 2;
  p.alive = true;
  p.invincibleUntil = state.time + INVINCIBLE_TIME;
  p.shieldUntil = 0;
  p.dir = { x: 0, y: 1 };
}

function checkExit(state: GameState): void {
  if (state.status !== 'playing') return;
  if (!state.exit.revealed) return;
  if (state.enemiesRemaining > 0) return;
  const t = playerTile(state);
  if (t.tx === state.exit.tx && t.ty === state.exit.ty) {
    const bonus = Math.floor(state.timeLeft) * 5;
    addScore(state, 500 + bonus, t.tx, t.ty, 'level');
    state.status = 'clear';
    state.sounds.push('win');
  }
}

function addScore(state: GameState, amount: number, tx: number, ty: number, kind: 'block' | 'enemy' | 'powerup' | 'level'): void {
  state.score += amount;
  state.events.push({ kind, amount, px: tx * TILE + TILE / 2, py: ty * TILE });
  state.floats.push({
    id: state.nextId++,
    px: tx * TILE + TILE / 2,
    py: ty * TILE,
    text: `+${amount}`,
    timer: 1.0,
    duration: 1.0,
  });
}

function updateFx(state: GameState, dt: number): void {
  for (const f of state.floats) f.timer -= dt;
  state.floats = state.floats.filter((f) => f.timer > 0);
  for (const pt of state.particles) {
    pt.timer -= dt;
    pt.px += pt.vx * dt;
    pt.py += pt.vy * dt;
    pt.vy += 300 * dt;
  }
  state.particles = state.particles.filter((pt) => pt.timer > 0);
}

function spawnExplosionParticles(state: GameState, cells: { x: number; y: number }[]): void {
  for (const c of cells) {
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        px: c.x * TILE + TILE / 2 + (Math.random() - 0.5) * 20,
        py: c.y * TILE + TILE / 2 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 220,
        vy: -Math.random() * 180,
        timer: 0.5 + Math.random() * 0.3,
        duration: 0.8,
        color: ['#ffd23f', '#ff7b00', '#ff3b30', '#fff'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4,
      });
    }
  }
}

function spawnDeathParticles(state: GameState, px: number, py: number): void {
  for (let i = 0; i < 16; i++) {
    state.particles.push({
      px,
      py,
      vx: (Math.random() - 0.5) * 260,
      vy: -Math.random() * 240,
      timer: 0.7,
      duration: 0.7,
      color: '#7dd3fc',
      size: 3 + Math.random() * 3,
    });
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export { BOMB_FUSE };
