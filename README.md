# 💣 Bomberman

A polished Bomberman-style game in the browser — **React + TypeScript + Vite**, plain `<canvas>` rendering (the spec-sanctioned fallback for PixiJS), Zustand meta-state, Framer Motion menus, procedural Web Audio SFX/music, Vitest-tested pure engine.

## Run

```bash
npm install
npm run dev     # play at http://localhost:5173
npm run build   # typecheck + production build
npm test        # vitest suite (level gen, blasts, chain reactions)
```

## Controls

| Action | Keys |
|---|---|
| Move | WASD / Arrow keys |
| Bomb | Space |
| Pause | P / Esc |
| Touch | D-pad + 💣 button (auto-shown on coarse pointers) |

## Rules

- 15×13 grid, 48px tiles. Border + every even/even cell = indestructible wall.
- ~65% of free cells start as destructible blocks (fewer on later levels). Spawn L-shape `(1,1),(1,2),(2,1)` is always clear.
- Bombs: 2s fuse, cross blast, chain-react, max = capacity. Walk off fresh bombs, can't walk back on.
- 25% block-drop power-ups: 💣 +capacity, 🔥 +range, 👟 speed, 🛡 10s shield, ♥ rare life.
- 3 foes: Wanderer (random), Chaser (BFS chase ≤8 tiles), Smart (fast, chases ≤10, avoids blasts).
- Exit door hides under a random block; revealed when that block blows. Enter it with 0 foes left to clear the level (+500 + 5s time bonus).
- Scoring: block +10, foe +100/200/300, power-up +50. Best score in `localStorage`.

## Structure

```
src/
  engine/   # pure TS, no React: types, constants, grid, player, bomb,
            # explosion, enemy, powerups, game (orchestrator), loop, input
  components/ # GameCanvas (canvas renderer), HUD, Menus, TouchControls
  store/gameStore.ts  # zustand: screen/score/lives/level/mute
  audio.ts  # procedural WebAudio SFX + chiptune loop (swap in Howler files anytime)
  App.tsx main.tsx index.css
```

## Notes / defaults chosen

- **Canvas instead of PixiJS**: spec allows `plain HTML5 <canvas>` fallback — chosen for zero-asset reliability and 60fps without sprite downloads.
- **CSS instead of Tailwind**: same retro look with one stylesheet, no extra build plugin.
- **Procedural audio instead of Howler files**: Howler is installed; `src/audio.ts` notes where to wire real `src/assets/sounds/*` files. Synth guarantees sound on first run.
- Levels scale past 5 endlessly (more/faster foes, tighter timers).
