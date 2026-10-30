import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SKINS, getSkin } from '../skins';

const SECTORS = [
  { n: 1, name: 'NEON SLUMS', realm: 'The Lantern Market', desc: 'Kampung cahaya yang sunyi. Uji nyali sebelum melangkah lebih jauh.' },
  { n: 2, name: 'PLASMA GRID', realm: 'The Shattered Stones', desc: 'Reruntuhan kristal tempat para pemburu mulai mengejar langkahmu.' },
  { n: 3, name: 'VOID CIRCUIT', realm: 'The Hollow Woods', desc: 'Labirin hampa yang sempit. Musuh cepat bersembunyi di setiap tikungan.' },
  { n: 4, name: 'MAGMA CORE', realm: 'The Molten Keep', desc: 'Jantung gunung yang mendidih. Waktu menyusut bersama nyala api.' },
  { n: 5, name: 'EVENT HORIZON', realm: 'The Edge of Night', desc: 'Gerbang di ujung dunia. Hanya legenda yang sanggup bertahan.' },
  { n: 6, name: 'SHADOW DOJO', realm: 'The Hidden Shrine', desc: 'Dojo tersembunyi para ninja. Tanpa ampun, tanpa amal.' },
] as const;

const LOADOUT = [
  { icon: '💣', title: 'Bomb Satchel', desc: '+1 bom' },
  { icon: '🔥', title: 'Ember Rune', desc: '+1 jangkauan' },
  { icon: '🌿', title: 'Swift Boots', desc: 'Gerak lincah' },
  { icon: '🛡️', title: 'Aegis', desc: '1 hit · 10s' },
] as const;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 41 + 6) % 100}%`,
  delay: `${(i % 8) * 0.9}s`,
  duration: `${9 + (i % 5) * 1.8}s`,
  size: `${8 + (i % 4) * 7}px`,
  color: ['#ffd23f', '#ff5a5f', '#4ecb71', '#3a86ff', '#9b5de5'][i % 5],
}));

/**
 * Main menu — cartoon / comic theme (2026-10-30).
 * Replaces the dusk-forest quest scene with a bright Saturday-morning
 * cartoon: sunny sky, puffy clouds, rolling hills, floating bubbles, a
 * bouncing bomb mascot, chunky outlined type and bouncy arcade buttons.
 * All gameplay functionality is unchanged.
 */
export function MainMenu(props: { onStart: (level: number) => void }): JSX.Element {
  const { highScore, muted, volume, skin, toggleMute, setVolume, setSkin } = useGameStore();
  const [sector, setSector] = useState<number>(1);
  const [showHow, setShowHow] = useState(false);
  const activeSector = SECTORS.find((s) => s.n === sector) ?? SECTORS[0];
  const activeSkin = getSkin(skin);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') props.onStart(sector);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props, sector]);

  return (
    <motion.div
      className="overlay menu-overlay cartoon-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Main menu Bomberman Cartoon"
    >
      <div className="menu-bg cartoon-bg" aria-hidden="true">
        <div className="cartoon-sun" />
        <div className="cartoon-cloud c1" />
        <div className="cartoon-cloud c2" />
        <div className="cartoon-cloud c3" />
        <div className="cartoon-hill h1" />
        <div className="cartoon-hill h2" />
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              background: b.color,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          />
        ))}
      </div>

      <motion.div
        className="menu-shell cartoon-shell"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <header className="menu-head">
          <div className="menu-brand">
            <div className="cartoon-bomb" aria-hidden="true">
              <span className="cartoon-spark" />
            </div>
            <div>
              <p className="menu-kicker">SUPER BLAST ADVENTURE</p>
              <h1 className="menu-title">
                BOMBER<span>MAN</span>
              </h1>
              <p className="menu-subtitle">POP! BOOM! ZAP! · SIX WORLDS OF FUN</p>
            </div>
          </div>
          <div className="menu-best">
            <small>HIGH SCORE</small>
            <b>{String(highScore).padStart(6, '0')}</b>
          </div>
        </header>

        <div className="menu-columns">
          <section className="menu-play">
            <p className="menu-tagline">
              <span className="tag-rune" aria-hidden="true">💥</span>
              Petualangan penuh ledakan! Pecahkan blok, kumpulkan kekuatan, dan
              kalahkan para penjaga sebelum bom meledak!
            </p>

            <div className="menu-label">
              <span>I</span> PILIH DUNIA
            </div>
            <div className="sector-grid" role="radiogroup" aria-label="Pilih dunia">
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
                    <span className="sector-index">WORLD {ROMAN[s.n - 1]}</span>
                    <span className="sector-name">{s.name}</span>
                    <span className="sector-realm">{s.realm}</span>
                    <span className="sector-dot" aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>

            <div className="sector-detail">
              <span>
                DUNIA {String(sector).padStart(2, '0')} / {SECTORS.length}
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
              <span className="start-bomb" aria-hidden="true">💣</span>
              <span>AYO MAIN!</span>
              <small>ENTER</small>
            </motion.button>

            <div className="menu-help-row">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowHow((v) => !v)}
                aria-expanded={showHow}
              >
                {showHow ? '▾ Tutup petunjuk' : '▸ Buka petunjuk'}
              </button>
              <span className="menu-hint">WASD / panah · Space bom · P jeda</span>
            </div>

            {showHow && (
              <motion.div
                className="menu-brief"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <b>📖 Cara Main</b>
                <ol>
                  <li>Hancurkan blok dan ambil item kekuatan.</li>
                  <li>Kalahkan semua musuh, lalu masuk pintu keluar.</li>
                  <li>Bom meledak setelah 2 detik dan memicu rantai. Jangan terjebak!</li>
                </ol>
              </motion.div>
            )}
          </section>

          <aside className="menu-info">
            <div className="quest-panel">
              <div className="menu-label">
                <span>II</span> TAS PETUALANG
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

            <div className="quest-panel">
              <div className="menu-label">
                <span>III</span> PILIH NINJA
              </div>
              <div className="skin-grid" role="radiogroup" aria-label="Pilih skin ninja">
                {SKINS.map((s) => {
                  const active = skin === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`skin-card${active ? ' active' : ''}`}
                      onClick={() => setSkin(s.id)}
                      title={s.desc}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span
                        className="skin-swatch"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(160deg, ${s.palette.hood}, ${s.palette.body})`,
                          borderColor: s.palette.accent,
                        }}
                      >
                        <span className="skin-band" style={{ background: s.palette.accent }} />
                      </span>
                      <span className="skin-meta">
                        <b>{s.name}</b>
                        <small>{s.realm}</small>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="skin-desc">{activeSkin.desc}</p>
            </div>

            <div className="quest-panel">
              <div className="menu-label">
                <span>IV</span> KONTROL
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
              {muted ? '🔇 Bisu' : '🔊 Nyala'}
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
            <span>PAPAN 15×13</span>
            <span>RANTAI BOM ON</span>
            <span>SIAP SENTUH</span>
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
