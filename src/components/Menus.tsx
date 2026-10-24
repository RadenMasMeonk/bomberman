import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const TAGLINE_FULL = 'Blast blocks · Dodge sentries · Breach the exit gate';

const SECTORS = [
  { n: 1, name: 'NEON SLUMS', desc: 'Patrol ringan. Cocok untuk pemanasan.' },
  { n: 2, name: 'PLASMA GRID', desc: 'Chaser mulai memburu. Waspada!' },
  { n: 3, name: 'VOID CIRCUIT', desc: 'Musuh cepat + jebakan rapat.' },
  { n: 4, name: 'MAGMA CORE', desc: 'Tekanan waktu & patroli padat.' },
  { n: 5, name: 'EVENT HORIZON', desc: 'Mode brutal. Hanya untuk legenda.' },
  { n: 6, name: 'SHADOW DOJO', desc: 'Level ninja rahasia. Musuh tanpa ampun.' },
] as const;

const LOADOUT = [
  { icon: '💣', title: 'Extra Bomb', desc: '+1 kapasitas bom' },
  { icon: '🔥', title: 'Fire Range', desc: '+1 jangkauan ledakan' },
  { icon: '⚡', title: 'Speed Up', desc: 'Gerak lebih lincah' },
  { icon: '🛡️', title: 'Shield', desc: 'Tahan 1 hit · 10 dtk' },
] as const;

function useTypedText(full: string, speed = 34): string {
  const [len, setLen] = useState(0);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (reduceMotion) {
      setLen(full.length);
      return;
    }
    setLen(0);
    const id = window.setInterval(() => {
      setLen((v) => {
        if (v >= full.length) {
          window.clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [full, speed, reduceMotion]);
  return full.slice(0, len);
}

export function MainMenu(props: { onStart: (level: number) => void }): JSX.Element {
  const { highScore, muted, volume, toggleMute, setVolume } = useGameStore();
  const [sector, setSector] = useState<number>(1);
  const [showHow, setShowHow] = useState(false);
  const typed = useTypedText(TAGLINE_FULL);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 37.7 + 11) % 100}%`,
        top: `${(i * 53.3 + 7) % 100}%`,
        delay: `${(i % 9) * 0.3}s`,
      })),
    [],
  );

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
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div className="menu-bg" aria-hidden="true">
        <div className="menu-orb a" />
        <div className="menu-orb b" />
        {stars.map((s) => (
          <span key={s.id} className="menu-star" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
        ))}
        <div className="menu-grid-floor" />
        <div className="menu-scan" />
      </div>

      <motion.div
        className="panel menu-panel"
        style={{ rotateX, rotateY }}
        initial={{ scale: 0.94, y: 26, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div className="status-bar">
          <span className="status-dot" />
          <span>SYSTEM ONLINE</span>
          <span className="sep">//</span>
          <span>NEON PROTOCOL v2.0</span>
          <span className="right">SECTOR {String(sector).padStart(2, '0')}</span>
        </div>

        <div className="logo-row">
          <motion.div
            className="logo-core"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            💣
          </motion.div>
          <div>
            <h1 className="neon-title">
              <span className="thin">BOMBER</span>
              <span className="mag">MAN</span>
            </h1>
            <p className="subtitle">◢ FUTURISTIC ARCADE BREACH UNIT ◣</p>
          </div>
        </div>

        <div className="typed-wrap" aria-live="polite">
          <span className="typed-tag">MISSION</span>
          <span className="typed">
            {typed}
            <span className="caret">▌</span>
          </span>
        </div>

        <div className="menu-grid2">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="sector-label">▸ PILIH SECTOR AWAL</div>
            <div className="sector-row" role="radiogroup" aria-label="Pilih sector">
              {SECTORS.map((s) => (
                <motion.button
                  key={s.n}
                  role="radio"
                  aria-checked={sector === s.n}
                  className={`sector-btn${sector === s.n ? ' active' : ''}`}
                  onClick={() => setSector(s.n)}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  title={s.name}
                >
                  <small>S-{String(s.n).padStart(2, '0')}</small>
                  <strong>{s.n}</strong>
                </motion.button>
              ))}
            </div>
            <div className="sector-desc">
              <b>{activeSector.name}</b> — {activeSector.desc}
            </div>
            <motion.button
              className="btn primary big-start"
              onClick={() => props.onStart(sector)}
              autoFocus
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              ▶ MULAI MISI — SECTOR {sector}
            </motion.button>
            <div className="menu-actions-row">
              <button
                className="icon-btn"
                onClick={() => setShowHow((v) => !v)}
                aria-expanded={showHow}
              >
                {showHow ? '▾ Tutup briefing' : '▸ Briefing misi'}
              </button>
              <span className="dim" style={{ fontSize: 12 }}>
                tekan <kbd>Enter</kbd> untuk mulai cepat
              </span>
            </div>
            {showHow && (
              <motion.div
                className="howto"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <b>🎯 Cara menang:</b>
                <ol>
                  <li>Hancurkan blok, kumpulkan power-up.</li>
                  <li>Kalahkan semua penjaga, lalu masuk pintu emas.</li>
                  <li>Jangan terjebak ledakan sendiri — bom meledak 2 dtk + berantai!</li>
                </ol>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="loadout-label">▸ LOADOUT / POWER-UP</div>
            <div className="loadout-grid">
              {LOADOUT.map((p, i) => (
                <motion.div
                  key={p.title}
                  className="loadout-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  whileHover={{ y: -3 }}
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
            <div className="ctrl-grid">
              <div className="ctrl-item">
                <div className="k"><kbd>WASD</kbd><kbd>←↑↓→</kbd></div>
                <small>Gerak</small>
              </div>
              <div className="ctrl-item">
                <div className="k"><kbd>Space</kbd></div>
                <small>Pasang bom</small>
              </div>
              <div className="ctrl-item">
                <div className="k"><kbd>P</kbd><kbd>Esc</kbd></div>
                <small>Pause</small>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="menu-actions-row">
          <div className="audio-chip">
            <button className="icon-btn" onClick={toggleMute} aria-pressed={muted}>
              {muted ? '🔇 Mute' : '🔊 Suara'}
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
        </div>

        {highScore > 0 && (
          <motion.div
            className="best-chip"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="trophy">🏆</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <small>REKOR TERTINGGI</small>
              <b>{highScore}</b>
            </div>
            <small>◢ SIAP PECAHKAN?</small>
          </motion.div>
        )}

        <div className="menu-footer">
          <span>◢ TOUCH READY · 60 FPS · v2.0</span>
          <span>GRID 15×13 · CHAIN-BLAST ON</span>
        </div>
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
