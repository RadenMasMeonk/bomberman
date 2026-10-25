# Bomberman Game — Project Spec for OpenCode

## 1. Goal

Build a polished, interactive **Bomberman-style game** that runs in the browser using **React + TypeScript**. The game should feel good to play: smooth movement, juicy explosions, sound, animations, and a clean UI (menus, HUD, game over screen).

Work step by step through the milestones in section 8. After each milestone, make sure the project builds and runs (`npm run dev`, `npm run build`) before moving on.

---

## 2. Tech Stack

| Purpose | Choice |
|---|---|
| Build tool | **Vite** (React + TypeScript template) |
| UI framework | **React 18+** |
| Game rendering | **PixiJS** via `@pixi/react` (fast 2D sprites, animations, particles). Fallback: plain HTML5 `<canvas>` |
| UI animations (menus, HUD, overlays) | **Framer Motion** |
| State management | **Zustand** (UI/meta state: score, lives, level, screen) |
| Sound | **Howler.js** |
| Styling | **Tailwind CSS** |
| Testing | **Vitest** (for pure game-logic functions) |
| Optional | `use-sound`, `react-use`, `howler`, `pixi-particles` |

Install:

```bash
npm create vite@latest bomberman -- --template react-ts
cd bomberman
npm i pixi.js @pixi/react zustand framer-motion howler tailwindcss
npm i -D vitest @types/howler
```

---

## 3. Architecture Rules (important)

1. **Separate the game engine from React.**
   - `src/engine/` = pure TypeScript, **no React imports**. Contains game state, rules, collision, AI, bomb/explosion logic.
   - `src/components/` = React components that **render** the engine state and forward input.
2. The engine runs on a **fixed-timestep game loop** (`requestAnimationFrame` + accumulator, e.g. 60 updates/sec). Do NOT drive game logic with `setInterval` or React state updates.
3. Game state that changes every frame (positions, timers) lives in the engine (mutable ref/object). Only **low-frequency UI state** (score, lives, level, current screen) goes in Zustand to avoid re-render storms.
4. Keep functions small and pure where possible so they are testable.
5. Use TypeScript strictly (`strict: true`). No `any`.

### Folder structure

```
src/
  engine/
    types.ts          # Cell, Entity, Bomb, Explosion, PowerUp types
    constants.ts      # grid size, speeds, timers
    grid.ts           # level generation, cell helpers
    player.ts         # movement + collision
    bomb.ts           # placement, fuse, chain reactions
    explosion.ts      # blast propagation (cross shape, blocked by walls)
    enemy.ts          # enemy AI
    powerups.ts       # power-up spawn + effects
    loop.ts           # fixed timestep game loop
    input.ts          # keyboard + touch input handling
  components/
    GameCanvas.tsx    # Pixi stage / canvas rendering
    HUD.tsx           # lives, score, timer, bombs, power-ups
    MainMenu.tsx
    PauseMenu.tsx
    GameOver.tsx
    LevelComplete.tsx
    TouchControls.tsx # on-screen D-pad + bomb button for mobile
  store/
    gameStore.ts      # Zustand store (screen, score, lives, level)
  assets/
    sprites/ sounds/ fonts/
  App.tsx
  main.tsx
```

---

## 4. Game Rules & Mechanics

### Grid
- Grid size: **15 columns × 13 rows**, tile size 48px (scale responsively to fit the screen).
- Cell types: `EMPTY`, `WALL` (indestructible), `BLOCK` (destructible).
- Classic layout: indestructible walls on border and on every cell where both `x` and `y` are even.
- Randomly fill ~60–70% of the remaining empty cells with destructible blocks.
- Keep the **player start corner (3 cells in an L shape) always empty** so the player is never trapped.

### Player
- Moves with **Arrow keys / WASD**; places a bomb with **Space**; pause with **Esc / P**.
- Smooth pixel movement (not instant tile jumps), with **corner-sliding assistance** so turning corners feels forgiving.
- Starts with: 3 lives, 1 bomb, blast range 2, base speed.
- After being hit: brief **invincibility with blinking** (about 2 seconds) and respawn at start.
- Player character model is a **ninja** (dark hood, red headband/scarf, mask eye-slit). Keep the ninja look in all sprite/animation work.

### Bombs
- Placed on the player's current tile. Fuse: **2 seconds**.
- Player can walk off a freshly placed bomb, but cannot walk back onto it.
- Max simultaneous bombs = player's bomb capacity.
- **Chain reaction:** an explosion that touches another bomb detonates it immediately.

### Explosions
- Cross-shaped blast (up/down/left/right) up to `range` tiles.
- Stopped by indestructible walls. Destroys the first destructible block it hits and stops there.
- Lasts ~0.5 seconds; kills the player and enemies standing in it.
- Destroyed blocks have a chance (~25%) to drop a power-up.

### Power-ups
| Power-up | Effect |
|---|---|
| Extra Bomb | +1 max bombs |
| Fire Range | +1 blast range |
| Speed Up | +movement speed (capped) |
| Shield | One-hit protection for 10s |
| Extra Life | +1 life (rare) |

Power-ups can be destroyed by explosions (except the one just revealed).

### Enemies
- 3 types, introduced progressively across levels:
  1. **Wanderer** — moves randomly, changes direction at intersections.
  2. **Chaser** — moves toward the player when within N tiles (BFS pathfinding).
  3. **Fast / Smart** — faster, avoids explosion tiles.
- Touching an enemy damages the player. Enemies die to explosions.
- Level completes when **all enemies are dead** and the **exit door** (hidden under a block) is reached.

### Scoring
- Block destroyed: +10 · Enemy killed: +100 / +200 / +300 by type · Power-up collected: +50 · Level cleared: time bonus.

### Levels
- Increasing difficulty: more enemies, faster enemies, fewer blocks, time limit (e.g. 180s).
- At least **6 levels**, then loop with scaling difficulty.
- Level roster: 1 NEON SLUMS · 2 PLASMA GRID · 3 VOID CIRCUIT · 4 MAGMA CORE · 5 EVENT HORIZON · 6 SHADOW DOJO.

---

## 5. UI / UX Requirements ("make the UI better and interactive")

- **Screens:** Main Menu → Game → Pause → Level Complete → Game Over (with high score saved in `localStorage`).
- **Framer Motion** for animated screen transitions, menu button hover/press effects, score pop-ups, and HUD updates.
- **HUD:** lives (hearts), score, level, timer, current bomb count, range, speed, active shield.
- **Game feel / juice:**
  - Screen shake on explosions.
  - Explosion sprite animation + particle sparks.
  - Block-breaking animation.
  - Floating "+10" text for score.
  - Player walk animation (4 directions), death animation, blinking invincibility.
  - Bomb pulsing/scale animation as fuse runs down.
- **Sound (Howler):** bomb place, explosion, power-up pickup, player hit, enemy death, level complete, game over, and looping background music. Include a **mute toggle** and volume slider.
- **Responsive:** canvas scales to window; works on desktop and mobile. Show **touch controls** (D-pad + bomb button) on touch devices.
- **Accessibility:** visible focus states on menu buttons, keyboard navigable menus, `prefers-reduced-motion` respected (disable screen shake).
- **Visual style:** pick a consistent retro/pixel-art look. Use free assets (e.g. from kenney.nl or opengameart.org) or draw simple placeholder sprites with shapes first, then swap in sprites later.

---

## 6. Optional Features (only after core is done)

- Local 2-player mode (WASD + Arrow keys).
- Simple AI opponent "battle mode".
- Level editor or random level seeds.
- Online leaderboard (backend optional).
- Gamepad support via the Gamepad API.

---

## 7. Code Quality Rules

- Use functional React components + hooks only.
- Memoize heavy components (`React.memo`) and never create new objects/arrays inside the render loop unnecessarily.
- Clean up the game loop, event listeners, and audio on unmount.
- Add unit tests (Vitest) for: level generation (start area is clear), explosion propagation (walls block, blocks stop blast), chain reactions, collision, and scoring.
- Format with Prettier, lint with ESLint. Commit in small steps with clear messages.
- Write a concise `README.md` with how to run, controls, and project structure.

---

## 8. Milestones (do in order)

1. **Setup** — Vite + React + TS + Tailwind + folder structure. App renders an empty canvas.
2. **Grid & rendering** — Generate level, render walls/blocks/floor with Pixi (placeholder shapes OK).
3. **Player movement** — Smooth movement, collision with walls/blocks, keyboard input, game loop.
4. **Bombs & explosions** — Place bombs, fuse timer, cross-shaped blast, destroy blocks, kill player, chain reactions.
5. **Power-ups** — Drops from blocks, pickup, effects reflected in HUD.
6. **Enemies** — Wanderer first, then Chaser, then Smart; enemy-player and explosion interactions.
7. **Game flow** — Lives, scoring, exit door, level progression, win/lose conditions.
8. **UI polish** — Menus, HUD, Framer Motion transitions, screen shake, particles, floating score text.
9. **Audio** — Sound effects, music, mute/volume controls.
10. **Mobile & responsive** — Touch controls, scaling, performance check.
11. **Tests & cleanup** — Vitest tests, lint, README, final bug-fix pass.

---

## 9. Acceptance Criteria

- `npm run dev` starts the game with no console errors; `npm run build` succeeds.
- Stable 60 FPS on a typical laptop.
- Game is fully playable from main menu to game over using keyboard only.
- No way for the player to get trapped at spawn.
- Chain reactions and blast blocking behave exactly like classic Bomberman.
- State resets cleanly when restarting a game (no leftover bombs, enemies, or timers).

---

## 10. Instructions for the Agent

- Before coding each milestone, briefly state your plan, then implement it.
- Prefer simple, readable solutions over clever ones.
- If an asset is missing, create a placeholder and note where a real sprite/sound should go.
- Ask me only when a decision truly blocks progress; otherwise choose a sensible default and mention it.
- Do not add libraries beyond section 2 without explaining why.

---

## 11. Change Log

### 2026-10-24 — Sixth level + ninja player model

**New level: SHADOW DOJO (Sector 6)**
- Added sector 6 to the main-menu roster (`src/components/Menus.tsx`): `SHADOW DOJO — Level ninja rahasia. Musuh tanpa ampun.`
- Added a 6th time limit (`130s`) in `src/engine/constants.ts` (`TIME_LIMITS`), so Sector 6 no longer falls back to the generic `120s`.
- Existing level scaling already supports level 6: 5 Wanderers + 4 Chasers + 3 Smart enemies, speed scaling continues, and levels past 6 still loop with scaling difficulty.

**Player model is now a ninja**
- Replaced the white bomber placeholder sprite in `src/components/GameCanvas.tsx` with a top-down ninja:
  - dark hood and body, navy arms/legs;
  - white mask eye-slit with pupils that follow the movement direction;
  - red headband with a trailing ribbon;
  - red waist sash and flowing scarf tails animated by `walkPhase`;
  - existing shadow, walk bob, invincibility blink, and shield ring are preserved.
- Gameplay stats, collision size (`PLAYER_SIZE`), and controls are unchanged.

**Docs**
- Updated AGENTS.md sections 4 (Player, Levels) and added this changelog.

**Verification**
- Run `npm test`, `npm run lint`, and `npm run build` after future edits to keep the level and sprite changes regression-free.

### 2026-10-25 — Enemy spawn fix + main menu redesign

**Bug: enemies stood still until the player blew up a nearby block**
- Cause: `findSpawnSpot()` in `src/engine/enemy.ts` accepted *any* empty tile, including
  pockets sealed on all four sides by destructible blocks. `randomFreeDir()` then returned
  `null`, the enemy got `dir = {0,0}`, and it could not move until an explosion opened a path.
  The initial direction was also picked from all four compass directions, so it could point
  straight into a wall.
- Fix (comments marked `BUG FIX (2026-10-25)` in the code):
  - `findSpawnSpot()` now rejects sealed tiles (0 open neighbours), prefers junctions/corridors
    (2+ open neighbours), and only falls back to a dead end if nothing better exists.
  - Spawn spots are tracked in an `occupied` set so two enemies can never stack on one tile.
  - The first direction now comes from `freeNeighbors()`, so it always points at an open tile.
  - `updateEnemies()` in `src/engine/game.ts` has a safety net: if an enemy still ends up with
    no direction, it immediately picks a free one instead of idling.
- Regression tests added in `src/engine/game.test.ts`:
  - `never spawns enemies in sealed pockets` (25 seeds, 12 enemies each);
  - `enemies start moving on the first update` (15 seeds).

**Main menu redesigned (was clipped and too dense)**
- File: `src/components/Menus.tsx` (`MainMenu`) + menu styles in `src/index.css`
  (block titled `main menu v2 (redesigned 2026-10-25)`).
- Old menu was a dashboard crammed inside the canvas-sized stage with `overflow: hidden`,
  so the bottom of the panel could be cut off. New version is a full-screen overlay
  (`position: fixed`, scrollable) with a clear hierarchy:
  - header: brand/logo + high score;
  - left column: sector picker (6 cards with names + active-sector description),
    big `START SECTOR` button, collapsible mission briefing;
  - right column: loadout cards + controls;
  - footer: audio mute/volume + build metadata.
- Removed the decorative typewriter line, 3D tilt, fake status bar and the unused
  `.sector-btn` / `.menu-panel` / `.logo-*` / `.typed-*` CSS. Pause/Game Over/Level Clear
  panels and the shared `.status-bar` styles are unchanged.
- Menu still supports `Enter` to start the selected sector and keeps the 6-sector roster
  (including SHADOW DOJO).

**Verification (this change)**
- `npm test` → 11 tests pass.
- `npm run lint` (tsc --noEmit) → clean.
- `npm run build` → succeeds.

