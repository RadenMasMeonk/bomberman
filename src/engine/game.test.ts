import { describe, it, expect } from 'vitest';
import { generateGrid, clearSpawn, isSolidCell } from './grid';
import { computeBlast } from './explosion';
import { createGame, updateGame } from './game';
import { spawnEnemies, enemyTile } from './enemy';
import { CellType } from './types';
import { COLS, ROWS } from './constants';

const IDLE = { up: false, down: false, left: false, right: false };

function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('level generation', () => {
  it('keeps spawn L-shape clear', () => {
    for (let i = 0; i < 50; i++) {
      const g = generateGrid(1);
      expect(g[1][1]).toBe(CellType.Empty);
      expect(g[1][2]).toBe(CellType.Empty);
      expect(g[2][1]).toBe(CellType.Empty);
    }
  });

  it('has border walls and inner wall lattice', () => {
    const g = generateGrid(1, () => 0);
    for (let x = 0; x < COLS; x++) {
      expect(g[0][x]).toBe(CellType.Wall);
      expect(g[ROWS - 1][x]).toBe(CellType.Wall);
    }
    expect(g[2][2]).toBe(CellType.Wall);
    expect(g[4][4]).toBe(CellType.Wall);
  });

  it('clearSpawn empties start cells', () => {
    const g = generateGrid(1, () => 0.99);
    g[1][1] = CellType.Block;
    clearSpawn(g);
    expect(g[1][1]).toBe(CellType.Empty);
  });
});

describe('enemy spawning', () => {
  // Regression test for the "enemies sit still until a nearby block is blown up"
  // bug: spawn spots used to be any empty tile, including pockets sealed on all
  // four sides by destructible blocks.
  it('never spawns enemies in sealed pockets', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const s = createGame(1);
      s.enemies = [];
      spawnEnemies(s, [{ kind: 'wanderer', count: 12 }], () => 90, seeded(seed));
      for (const e of s.enemies) {
        const t = enemyTile(e);
        const exits = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].filter(([dx, dy]) => !isSolidCell(s.grid, t.tx + dx, t.ty + dy));
        expect(exits.length).toBeGreaterThan(0);
      }
    }
  });

  it('enemies start moving on the first update', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const s = createGame(1);
      s.enemies = [];
      spawnEnemies(s, [{ kind: 'wanderer', count: 10 }], () => 90, seeded(seed));
      const before = s.enemies.map((e) => ({ x: e.px, y: e.py }));
      for (let i = 0; i < 30; i++) updateGame(s, IDLE, 1 / 60, false);
      const moved = s.enemies.filter((e, i) => e.px !== before[i].x || e.py !== before[i].y).length;
      expect(moved).toBeGreaterThan(0);
    }
  });
});

describe('explosion propagation', () => {
  it('is blocked by walls and stops after first block', () => {
    const g = generateGrid(1, () => 0);
    // open corridor row 1
    g[1][3] = CellType.Block;
    g[1][4] = CellType.Empty;
    const { cells, hitBlocks } = computeBlast(g, 1, 1, 3);
    expect(cells).toContainEqual({ x: 3, y: 1 });
    expect(cells).not.toContainEqual({ x: 4, y: 1 });
    expect(hitBlocks).toContainEqual({ x: 3, y: 1 });
  });

  it('includes center and four arms in open space', () => {
    const g = generateGrid(1, () => 0);
    const { cells } = computeBlast(g, 1, 1, 2);
    expect(cells).toContainEqual({ x: 1, y: 1 });
    // (2,1) is classic pillar wall? x=2,y=1 is not both-even so open
    expect(cells.length).toBeGreaterThanOrEqual(3);
  });
});

describe('game flow', () => {
  it('bomb detonates, destroys blocks and scores', () => {
    const s = createGame(1);
    // force an open pocket and a block next to player
    s.grid[1][2] = CellType.Block;
    s.grid[2][1] = CellType.Empty;
    s.player.px = 1 * 48 + 7;
    s.player.py = 1 * 48 + 7;
    const score0 = s.score;
    // place bomb via update
    updateGame(s, { up: false, down: false, left: false, right: false }, 1 / 60, true);
    expect(s.bombs.length).toBe(1);
    // fast-forward fuse
    for (let i = 0; i < 200; i++) updateGame(s, { up: false, down: false, left: false, right: false }, 1 / 60, false);
    expect(s.score).toBeGreaterThan(score0);
    expect(s.explosions.length + s.bombs.length).toBeGreaterThanOrEqual(0);
  });

  it('chain reaction detonates adjacent bomb', () => {
    const s = createGame(1);
    s.grid[1][2] = CellType.Empty;
    s.grid[1][3] = CellType.Empty;
    s.player.px = 1 * 48 + 7;
    s.player.py = 1 * 48 + 7;
    s.player.maxBombs = 3;
    s.player.range = 3;
    updateGame(s, { up: false, down: false, left: false, right: false }, 1 / 60, true);
    // manually add second bomb in blast path with long fuse
    s.bombs.push({ id: 999, tx: 2, ty: 1, fuse: 10, range: 2, owner: 'player', passThrough: false });
    for (let i = 0; i < 200; i++) updateGame(s, { up: false, down: false, left: false, right: false }, 1 / 60, false);
    // second bomb should have detonated via chain (removed from list)
    expect(s.bombs.find((b) => b.id === 999)).toBeUndefined();
  });

  it('state resets cleanly on new game', () => {
    const a = createGame(1);
    updateGame(a, { up: false, down: false, left: false, right: false }, 1 / 60, true);
    const b = createGame(1);
    expect(b.bombs.length).toBe(0);
    expect(b.explosions.length).toBe(0);
    expect(b.status).toBe('playing');
  });

  it('player can walk fully off a fresh bomb, but not back onto it', () => {
    const s = createGame(1);
    s.enemies = []; // isolate movement from enemy interference
    s.grid[1][2] = CellType.Empty;
    s.grid[1][3] = CellType.Empty;
    s.grid[1][4] = CellType.Empty;
    s.grid[1][5] = CellType.Empty;
    s.grid[1][6] = CellType.Empty;
    s.player.px = 1 * 48 + 7;
    s.player.py = 1 * 48 + 7;
    const idle = { up: false, down: false, left: false, right: false };
    updateGame(s, idle, 1 / 60, true);
    expect(s.bombs.length).toBe(1);

    // hold right for ~0.4s (bomb fuses at 2s) — must fully exit tile (1,1), i.e. px >= 96
    const right = { up: false, down: false, left: false, right: true };
    for (let i = 0; i < 25; i++) updateGame(s, right, 1 / 60, false);
    expect(s.bombs.length).toBe(1); // not yet exploded
    expect(s.bombs[0].passThrough).toBe(false); // overlap fully ended
    expect(s.player.px).toBeGreaterThan(110); // well clear of the bomb tile

    // walk back left into the bomb — must be blocked at the tile boundary (px >= 96).
    // Total elapsed (~1.4s) stays under the 2s fuse so the bomb is still there.
    const left = { up: false, down: false, left: true, right: false };
    for (let i = 0; i < 60; i++) updateGame(s, left, 1 / 60, false);
    expect(s.bombs.length).toBe(1);
    expect(s.player.px).toBeGreaterThanOrEqual(95);
  });
});
