import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createGame, updateGame, type InputState } from './engine/game';
import { createLoop } from './engine/loop';
import { createInput } from './engine/input';
import type { GameState } from './engine/types';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu, PauseMenu, GameOver, LevelComplete } from './components/Menus';
import { TouchControls } from './components/TouchControls';
import { useGameStore, saveHigh, type Screen } from './store/gameStore';
import { sound } from './audio';

export default function App(): JSX.Element {
  const gameRef = useRef<GameState | null>(null);
  const screenRef = useRef<Screen>('menu');
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches,
  );
  const [newBest, setNewBest] = useState(false);
  const set = useGameStore((s) => s.set);
  const setScreen = useGameStore((s) => s.setScreen);
  const screen = useGameStore((s) => s.screen);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const muted = useGameStore((s) => s.muted);
  const volume = useGameStore((s) => s.volume);
  screenRef.current = screen;

  useEffect(() => {
    sound.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    sound.setVolume(volume);
  }, [volume]);

  const syncStore = useCallback(
    (g: GameState) => {
      const st = useGameStore.getState();
      const patch: Record<string, number> = {};
      if (st.score !== g.score) patch.score = g.score;
      if (st.lives !== g.lives) patch.lives = g.lives;
      if (st.level !== g.level) patch.level = g.level;
      if (Math.abs(st.timeLeft - g.timeLeft) > 0.4) patch.timeLeft = Math.ceil(g.timeLeft);
      if (st.enemiesLeft !== g.enemiesRemaining) patch.enemiesLeft = g.enemiesRemaining;
      if (Object.keys(patch).length) set(patch);
    },
    [set],
  );

  const startGame = useCallback(
    (level = 1, lives = 3, prevScore = 0, keepAbilities = false) => {
      const prev = gameRef.current;
      const g = createGame(level, lives, prevScore, keepAbilities, prev ?? undefined);
      gameRef.current = g;
      setNewBest(false);
      set({ score: g.score, lives: g.lives, level: g.level, timeLeft: Math.ceil(g.timeLeft), enemiesLeft: g.enemiesRemaining });
      setScreen('playing');
      sound.unlock();
      sound.startMusic();
    },
    [set, setScreen],
  );

  const quitToMenu = useCallback(() => {
    gameRef.current = null;
    sound.stopMusic();
    setScreen('menu');
  }, [setScreen]);

  // main loop + input
  useEffect(() => {
    const input = createInput();
    const loop = createLoop(
      (dt) => {
        if (screenRef.current !== 'playing') return;
        const g = gameRef.current;
        if (!g) return;
        const polled = input.poll();
        if (polled.pause) {
          setScreen('paused');
          return;
        }
        const mapped: InputState = { up: polled.input.up, down: polled.input.down, left: polled.input.left, right: polled.input.right };
        updateGame(g, mapped, dt, polled.bomb);
        for (const s of g.sounds) sound.play(s);
        g.sounds.length = 0;
        syncStore(g);
        if (g.status === 'clear') {
          saveHigh(g.score);
          const st = useGameStore.getState();
          set({ score: g.score, highScore: Math.max(st.highScore, g.score) });
          setScreen('levelClear');
          sound.play('win');
        } else if (g.status === 'gameover') {
          const st = useGameStore.getState();
          const best = Math.max(st.highScore, g.score);
          setNewBest(g.score > st.highScore && g.score > 0);
          saveHigh(g.score);
          set({ highScore: best });
          setScreen('gameOver');
          sound.play('gameover');
        }
      },
      () => {},
    );
    loop.start();
    const onVis = () => {
      if (document.hidden && screenRef.current === 'playing') setScreen('paused');
    };
    document.addEventListener('visibilitychange', onVis);
    (window as unknown as { __bomberInput: unknown }).__bomberInput = input;
    return () => {
      loop.stop();
      input.dispose();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [syncStore, setScreen, set]);

  const g = gameRef.current;
  const hudProps = {
    bombs: g?.player.maxBombs ?? 1,
    range: g?.player.range ?? 2,
    speed: g?.player.speed ?? 150,
    shield: g ? g.time < g.player.shieldUntil : false,
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">💣</span>
          <span className="brand-text">
            <small>NEON PROTOCOL</small>
            <strong>BOMBER<span>MAN</span></strong>
          </span>
        </div>
        <div className="top-actions">
          {screen === 'playing' && (
            <button className="btn ghost sm" onClick={() => setScreen('paused')} aria-label="Pause">
              ⏸
            </button>
          )}
          <button
            className="btn ghost sm"
            onClick={() => useGameStore.getState().toggleMute()}
            aria-label="Toggle sound"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {(screen === 'playing' || screen === 'paused') && <HUD {...hudProps} />}

      <main className="stage">
        <div className="canvas-wrap">
          <GameCanvas gameRef={gameRef} />
          {screen === 'playing' && g && g.status === 'dying' && (
            <div className="banner">OUCH!</div>
          )}
          {screen === 'playing' && g && g.exit.revealed && g.enemiesRemaining > 0 && (
            <div className="hint">Defeat all foes, then reach the golden door!</div>
          )}
          {screen === 'playing' && g && g.exit.revealed && g.enemiesRemaining === 0 && (
            <div className="hint open">🚪 Door open — GO!</div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {screen === 'menu' && <MainMenu key="menu" onStart={(lvl) => startGame(lvl, 3, 0)} />}
          {screen === 'paused' && (
            <PauseMenu
              key="pause"
              onResume={() => setScreen('playing')}
              onRestart={() => {
                const cur = gameRef.current;
                startGame(cur?.level ?? 1, cur?.lives ?? 3, cur ? cur.score - 0 : 0, false);
              }}
              onQuit={quitToMenu}
            />
          )}
          {screen === 'levelClear' && (
            <LevelComplete
              key="clear"
              level={useGameStore.getState().level}
              score={score}
              onNext={() => {
                const cur = gameRef.current;
                const nl = (cur?.level ?? 1) + 1;
                const sc = cur?.score ?? score;
                const lv = cur?.lives ?? 3;
                startGame(nl, lv, sc, true);
              }}
              onMenu={quitToMenu}
            />
          )}
          {screen === 'gameOver' && (
            <GameOver
              key="over"
              score={score}
              high={highScore}
              isNewBest={newBest}
              onRetry={() => startGame(1, 3, 0)}
              onMenu={quitToMenu}
            />
          )}
        </AnimatePresence>
      </main>

      {(screen === 'playing' || screen === 'paused') && isTouch && (
        <TouchControls
          onDir={(dir, pressed) => {
            const inp = (window as unknown as { __bomberInput?: { setTouch: (d: string, v: boolean) => void } }).__bomberInput;
            inp?.setTouch(dir, pressed);
          }}
          onBomb={() => {
            const inp = (window as unknown as { __bomberInput?: { queueBomb: () => void } }).__bomberInput;
            inp?.queueBomb();
          }}
        />
      )}

      <footer className="foot">
        <span>Move: WASD / Arrows · Bomb: Space · Pause: P/Esc</span>
        <span className="dim">v2.0 <span className="neon">NEON PROTOCOL</span> · 60 FPS · touch ready</span>
      </footer>
    </div>
  );
}
