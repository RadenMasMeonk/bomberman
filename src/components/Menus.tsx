import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const SECTORS = [
  { n: 1, name: 'NEON SLUMS', desc: 'Patrol ringan. Cocok untuk pemanasan.' },
  { n: 2, name: 'PLASMA GRID', desc: 'Chaser mulai memburu. Waspada!' },
  { n: 3, name: 'VOID CIRCUIT', desc: 'Musuh cepat + jebakan rapat.' },
  { n: 4, name: 'MAGMA CORE', desc: 'Tekanan waktu & patroli padat.' },
  { n: 5, name: 'EVENT HORIZON', desc: 'Mode brutal. Hanya untuk legenda.' },
  { n: 6, name: 'SHADOW DOJO', desc: 'Level ninja rahasia. Musuh tanpa ampun.' },
] as const;

const LOADOUT = [
  { icon: '💣', title: 'Extra Bomb', desc: '+1 bom' },
  { icon: '🔥', title: 'Fire Range', desc: '+1 ledakan' },
  { icon: '⚡', title: 'Speed Up', desc: 'Gerak lincah' },
  { icon: '🛡️', title: 'Shield', desc: '1 hit · 10s' },
] as const;

/**
 * Main menu redesign (2026-10-25).
 * Old layout: very dense dashboard crammed into the game-canvas area.
 * New layout: full-screen, two-column arcade screen with a hierarchy:
 * brand → sector select → start button, with loadout/controls on the side.
 * Everything scrolls when the viewport is short, so nothing gets clipped.
 */
export function MainMenu(props: { onStart: (level: number) => void }): JSX.Element {
  const { highScore, muted, volume, toggleMute, setVolume } = useGameStore();
  const [sector, setSector] = useState<number>(1);
  const [showHow, setShowHow] = useState(false);
  const activeSector = SECTORS.find((s) => s.n === sector) ?? SECTORS[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') props.onStart(sector);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props, sector]);

  return (
    <motion.div
      className="overlay menu-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Main menu Neon Protocol"
    >
      <div className="menu-bg" aria-hidden="true">
        <div className="menu-glow a" />
        <div className="menu-glow b" />
        <div className="menu-grid-floor" />
        <div className="menu-scan" />
      </div>

      <motion.div
        className="menu-shell"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <header className="menu-head">
          <div className="menu-brand">
            <motion.span
              className="menu-bomb"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              💣
            </motion.span>
            <div>
              <p className="menu-kicker">NEON PROTOCOL // ARCADE BREACH</p>
              <h1 className="menu-title">
                BOMBER<span>MAN</span>
              </h1>
            </div>
          </div>
          <div className="menu-best">
            <small>HIGH SCORE</small>
            <b>{String(highScore).padStart(6, '0')}</b>
          </div>
        </header>

        <div className="menu-columns">
          <section className="menu-play">
            <p className="menu-tagline">Blast blocks. Dodge sentries. Breach the exit gate.</p>

            <div className="menu-label">
              <span>01</span> SELECT SECTOR
            </div>
            <div className="sector-grid" role="radiogroup" aria-label="Pilih sector">
              {SECTORS.map((s) => {
                const active = sector === s.n;
                return (
                  <motion.button
                    key={s.n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`sector-card${active ? ' active' : ''}`}
                    onClick={() => setSector(s.n)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="sector-index">S-{String(s.n).padStart(2, '0')}</span>
                    <span className="sector-name">{s.name}</span>
                    <span className="sector-dot" aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>

            <div className="sector-detail">
              <span>
                SECTOR {String(sector).padStart(2, '0')} / {SECTORS.length}
              </span>
              <p>{activeSector.desc}</p>
            </div>

            <motion.button
              className="btn primary menu-start"
              onClick={() => props.onStart(sector)}
              autoFocus
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>▶ START SECTOR {String(sector).padStart(2, '0')}</span>
              <small>ENTER</small>
            </motion.button>

            <div className="menu-help-row">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowHow((v) => !v)}
                aria-expanded={showHow}
              >
                {showHow ? '▾ Hide briefing' : '▸ Mission briefing'}
              </button>
              <span className="menu-hint">WASD / arrows · Space bombs · P pause</span>
            </div>

            {showHow && (
              <motion.div
                className="menu-brief"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <b>🎯 Mission</b>
                <ol>
                  <li>Blow up blocks and grab power-ups.</li>
                  <li>Defeat every sentry, then reach the golden door.</li>
                  <li>Bombs fuse for 2s and chain-react. Don't trap yourself!</li>
                </ol>
              </motion.div>
            )}
          </section>

          <aside className="menu-info">
            <div>
              <div className="menu-label">
                <span>02</span> LOADOUT
              </div>
              <div className="loadout-grid">
                {LOADOUT.map((p, i) => (
                  <motion.div
                    key={p.title}
                    className="loadout-card"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.05 }}
                    whileHover={{ y: -2 }}
                    title={p.desc}
                  >
                    <span className="ic">{p.icon}</span>
                    <div>
                      <b>{p.title}</b>
                      <span>{p.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <div className="menu-label">
                <span>03</span> CONTROLS
              </div>
              <div className="ctrl-grid">
                <div className="ctrl-item">
                  <div className="k">
                    <kbd>WASD</kbd>
                    <kbd>←↑↓→</kbd>
                  </div>
                  <small>Move</small>
                </div>
                <div className="ctrl-item">
                  <div className="k">
                    <kbd>Space</kbd>
                  </div>
                  <small>Bomb</small>
                </div>
                <div className="ctrl-item">
                  <div className="k">
                    <kbd>P</kbd>
                    <kbd>Esc</kbd>
                  </div>
                  <small>Pause</small>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="menu-foot">
          <div className="audio-chip">
            <button type="button" className="icon-btn" onClick={toggleMute} aria-pressed={muted}>
              {muted ? '🔇 Mute' : '🔊 Sound'}
            </button>
            <label className="vol">
              VOL
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
          <div className="menu-foot-meta">
            <span>GRID 15×13</span>
            <span>CHAIN-BLAST ON</span>
            <span>TOUCH READY</span>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}

export function PauseMenu(props: { onResume: () => void; onRestart: () => void; onQuit: () => void }): JSX.Element {
  const { toggleMute, muted } = useGameStore();
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="panel"
        role="dialog"
        aria-label="Paused"
        initial={{ y: 18, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
      >
        <div className="status-bar" style={{ margin: '0 auto' }}>
          <span className="status-dot" />
          <span>STANDBY MODE</span>
        </div>
        <h2 className="fx-title">⏸ PAUSED</h2>
        <p className="dim" style={{ margin: 0 }}>Sistem dibekukan. Pilih aksi berikutnya.</p>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onResume} autoFocus>▶ Lanjutkan</button>
          <button className="btn" onClick={props.onRestart}>↻ Ulangi sector</button>
          <button className="btn ghost" onClick={toggleMute}>{muted ? '🔇 Unmute' : '🔊 Mute'}</button>
          <button className="btn danger" onClick={props.onQuit}>Keluar ke menu</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GameOver(props: { score: number; high: number; isNewBest: boolean; onRetry: () => void; onMenu: () => void }): JSX.Element {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="panel"
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      >
        <div className="status-bar" style={{ margin: '0 auto', borderColor: 'rgba(255,84,112,0.4)' }}>
          <span className="status-dot" style={{ background: '#ff5470', boxShadow: '0 0 12px #ff5470' }} />
          <span>SIGNAL LOST</span>
        </div>
        <h2 className="fx-title mag">💀 MISI GAGAL</h2>
        {props.isNewBest && (
          <motion.div
            className="newbest"
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.08, 1] }}
            transition={{ duration: 0.5 }}
          >
            🎉 REKOR BARU! 🎉
          </motion.div>
        )}
        <div className="final-score">SCORE: {props.score}</div>
        <div className="dim">BEST: {props.high}</div>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onRetry} autoFocus>↻ Coba lagi</button>
          <button className="btn ghost" onClick={props.onMenu}>Menu utama</button>
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
        <div className="status-bar" style={{ margin: '0 auto', borderColor: 'rgba(61,255,184,0.4)' }}>
          <span className="status-dot" />
          <span>SECTOR CLEAR</span>
        </div>
        <h2 className="fx-title">🎉 SECTOR {props.level} DITAKLUKKAN!</h2>
        <div className="final-score">SCORE: {props.score}</div>
        <div className="btn-col">
          <button className="btn primary" onClick={props.onNext} autoFocus>Next sector →</button>
          <button className="btn ghost" onClick={props.onMenu}>Menu utama</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
