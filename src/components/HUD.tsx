import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const HUD = memo(function HUD(props: {
  bombs: number;
  range: number;
  speed: number;
  shield: boolean;
}): JSX.Element {
  const { score, lives, level, timeLeft, enemiesLeft, highScore, muted } = useGameStore();
  return (
    <div className="hud" role="status" aria-label="Game HUD">
      <div className="hud-group">
        <span className="hud-label">SCORE</span>
        <motion.span key={score} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="hud-value score">
          {score}
        </motion.span>
      </div>
      <div className="hud-group">
        <span className="hud-label">BEST</span>
        <span className="hud-value dim">{Math.max(highScore, score)}</span>
      </div>
      <div className="hud-group">
        <span className="hud-label">LEVEL</span>
        <span className="hud-value">{level}</span>
      </div>
      <div className="hud-group">
        <span className="hud-label">TIME</span>
        <span className={`hud-value ${timeLeft < 30 ? 'danger' : ''}`}>{fmt(timeLeft)}</span>
      </div>
      <div className="hud-group">
        <span className="hud-label">LIVES</span>
        <span className="hearts" aria-label={`${lives} lives`}>
          {'♥'.repeat(Math.max(0, Math.min(lives, 8)))}
          <span className="hearts-empty">{'♡'.repeat(Math.max(0, 3 - lives))}</span>
        </span>
      </div>
      <div className="hud-group">
        <span className="hud-label">FOES</span>
        <span className="hud-value">{enemiesLeft}</span>
      </div>
      <div className="hud-group hud-abilities">
        <span title="Bombs">💣×{props.bombs}</span>
        <span title="Range">🔥×{props.range}</span>
        <span title="Speed">👟{props.speed}</span>
        {props.shield && <span className="shield-badge">🛡 SHIELD</span>}
        {muted && <span className="muted-badge">🔇</span>}
      </div>
    </div>
  );
});
