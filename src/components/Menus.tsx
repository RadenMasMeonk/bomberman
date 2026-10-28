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

const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: `${(i * 29 + 7) % 100}%`,
  top: `${(i * 17 + 11) % 62}%`,
  delay: `${(i % 7) * 0.45}s`,
  size: `${1 + (i % 3)}px`,
}));

const MOTES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 5) % 100}%`,
  bottom: `${(i * 13) % 55}%`,
  delay: `${(i % 9) * 0.8}s`,
  duration: `${7 + (i % 5) * 1.6}s`,
  size: `${2 + (i % 3)}px`,
}));

/**
 * Main menu — adventure / Zelda-inspired theme (2026-10-26).
 * Replaces the neon arcade dashboard with a full-screen dusk-forest scene:
 * moon, stars, mountain ridges, drifting embers, a golden crest, rune-era
 * typography and "realm" chapter cards. Functionality is unchanged.
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
      className="overlay menu-overlay quest-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Main menu Bomberman Quest"
    >
      <div className="menu-bg adventure-bg" aria-hidden="true">
        <div className="adventure-moon" />
        <div className="adventure-stars">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>
        <div className="adventure-ridge far" />
        <div className="adventure-ridge near" />
        <div className="adventure-fog" />
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="mote"
            style={{
              left: m.left,
              bottom: m.bottom,
              width: m.size,
              height: m.size,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
          />
        ))}
      </div>

      <motion.div
        className="menu-shell quest-shell"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <header className="menu-head">
          <div className="menu-brand">
            <motion.div
              className="menu-crest"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              <span className="crest-tri t1" />
              <span className="crest-tri t2" />
              <span className="crest-tri t3" />
            </motion.div>
            <div>
              <p className="menu-kicker">THE LEGEND OF</p>
              <h1 className="menu-title">
                BOMBER<span>MAN</span>
              </h1>
              <p className="menu-subtitle">A BOMBER'S QUEST · SIX REALMS AWAIT</p>
            </div>
          </div>
          <div className="menu-best">
            <small>LEGEND RECORD</small>
            <b>{String(highScore).padStart(6, '0')}</b>
          </div>
        </header>

        <div className="menu-columns">
          <section className="menu-play">
            <p className="menu-tagline">
              <span className="tag-rune" aria-hidden="true">✦</span>
              Jawab panggilan petualangan. Bobol lorong, kalahkan penjaga, dan buka
              gerbang keluar sebelum fajar padam.
            </p>

            <div className="menu-label">
              <span>I</span> CHOOSE YOUR REALM
            </div>
            <div className="sector-grid" role="radiogroup" aria-label="Pilih realm">
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
                    <span className="sector-index">CHAPTER {ROMAN[s.n - 1]}</span>
                    <span className="sector-name">{s.name}</span>
                    <span className="sector-realm">{s.realm}</span>
                    <span className="sector-dot" aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>

            <div className="sector-detail">
              <span>
                REALM {String(sector).padStart(2, '0')} / {SECTORS.length}
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
              <span className="start-sword" aria-hidden="true">⚔</span>
              <span>BEGIN THE QUEST</span>
              <small>ENTER</small>
            </motion.button>

            <div className="menu-help-row">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowHow((v) => !v)}
                aria-expanded={showHow}
              >
                {showHow ? '▾ Tutup gulungan' : '▸ Buka gulungan misi'}
              </button>
              <span className="menu-hint">WASD / panah · Space bom · P jeda</span>
            </div>

            {showHow && (
              <motion.div
                className="menu-brief"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <b>📜 Gulungan Misi</b>
                <ol>
                  <li>Hancurkan blok dan pungut rune kekuatan.</li>
                  <li>Kalahkan semua penjaga, lalu masuki gerbang emas.</li>
                  <li>Bom menyala 2 detik dan memicu rantai. Jangan terjebak!</li>
                </ol>
              </motion.div>
            )}
          </section>

          <aside className="menu-info">
            <div className="quest-panel">
              <div className="menu-label">
                <span>II</span> ADVENTURER'S KIT
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
                <span>III</span> CHOOSE YOUR NINJA
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
                <span>IV</span> SACRED CONTROLS
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
            <span>REALM 15×13</span>
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
