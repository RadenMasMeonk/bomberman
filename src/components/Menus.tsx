import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export function MainMenu(props: { onStart: () => void }): JSX.Element {
  const { highScore, muted, volume, toggleMute, setVolume } = useGameStore();
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Main menu"
    >
      <motion.div
        className="panel"
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="logo">
          <span className="logo-bomb">💣</span>
          <h1>
            BOMBER<span>MAN</span>
          </h1>
        </div>
        <p className="tagline">Blast blocks · Dodge foes · Find the exit</p>
        <div className="controls-hint">
          <div><kbd>WASD</kbd>/<kbd>←↑↓→</kbd> move</div>
          <div><kbd>Space</kbd> bomb · <kbd>P</kbd>/<kbd>Esc</kbd> pause</div>
        </div>
        <motion.button
          className="btn primary"
          onClick={props.onStart}
          autoFocus
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ▶ START GAME
        </motion.button>
        {highScore > 0 && <div className="high">🏆 BEST: {highScore}</div>}
        <div className="audio-row">
          <button className="btn ghost" onClick={toggleMute} aria-pressed={muted}>
            {muted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <label className="vol">
            Vol
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </label>
        </div>
        <div className="legend">
          <span>💣+1 bomb</span><span>🔥+range</span><span>👟speed</span><span>🛡shield</span><span>♥life</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PauseMenu(props: { onResume: () => void; onRestart: () => void; onQuit: () => void }): JSX.Element {
  const { toggleMute, muted } = useGameStore();
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="panel" role="dialog" aria-label="Paused">
        <h2>⏸ PAUSED</h2>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onResume} autoFocus>Resume</button>
          <button className="btn" onClick={props.onRestart}>Restart level</button>
          <button className="btn ghost" onClick={toggleMute}>{muted ? '🔇 Unmute' : '🔊 Mute'}</button>
          <button className="btn danger" onClick={props.onQuit}>Quit to menu</button>
        </div>
      </div>
    </motion.div>
  );
}

export function GameOver(props: { score: number; high: number; isNewBest: boolean; onRetry: () => void; onMenu: () => void }): JSX.Element {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <h2>💀 GAME OVER</h2>
        {props.isNewBest && <div className="newbest">🎉 NEW BEST! 🎉</div>}
        <div className="final-score">SCORE: {props.score}</div>
        <div className="dim">BEST: {props.high}</div>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onRetry} autoFocus>↻ Play again</button>
          <button className="btn ghost" onClick={props.onMenu}>Main menu</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LevelComplete(props: { level: number; score: number; onNext: () => void; onMenu: () => void }): JSX.Element {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="panel"
        initial={{ scale: 0.85, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <h2>🎉 LEVEL {props.level} CLEAR!</h2>
        <div className="final-score">SCORE: {props.score}</div>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onNext} autoFocus>Next level →</button>
          <button className="btn ghost" onClick={props.onMenu}>Main menu</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
