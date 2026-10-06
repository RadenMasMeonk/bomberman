import { memo, useEffect, useRef } from 'react';
import { COLS, ROWS, TILE } from '../engine/constants';
import { CellType, type GameState } from '../engine/types';
import { PLAYER_SIZE } from '../engine/player';

const W = COLS * TILE;
const H = ROWS * TILE;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGame(ctx: CanvasRenderingContext2D, s: GameState, now: number, reduceMotion: boolean): void {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  // screen shake
  if (s.shake > 0.02 && !reduceMotion) {
    const m = s.shake * 8;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // floor
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const odd = (x + y) % 2 === 0;
      ctx.fillStyle = odd ? '#1f7a3d' : '#1c6e37';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // exit door (under blocks until revealed)
  const ex = s.exit;
  if (ex.revealed) {
    const dx = ex.tx * TILE;
    const dy = ex.ty * TILE;
    ctx.fillStyle = '#0b0b10';
    roundRect(ctx, dx + 8, dy + 8, TILE - 16, TILE - 16, 8);
    ctx.fill();
    ctx.strokeStyle = s.enemiesRemaining === 0 ? '#ffd23f' : '#666';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = s.enemiesRemaining === 0 ? '#ffd23f' : '#888';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.enemiesRemaining === 0 ? 'OPEN' : 'EXIT', dx + TILE / 2, dy + TILE / 2);
  }

  // powerups
  for (const pu of s.powerups) {
    const cx = pu.tx * TILE + TILE / 2;
    const cy = pu.ty * TILE + TILE / 2;
    const bob = reduceMotion ? 0 : Math.sin(now / 300 + pu.id) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, cx - 15, cy - 15 + bob, 30, 30, 8);
    ctx.fill();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 17px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph: Record<string, string> = { bomb: '●', fire: '▲', speed: '»', shield: '⛨', life: '♥' };
    ctx.fillStyle = pu.type === 'life' ? '#e11d48' : pu.type === 'shield' ? '#2563eb' : '#f59e0b';
    ctx.fillText(glyph[pu.type] ?? '?', cx, cy + 1 + bob);
  }

  // walls & blocks
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = s.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (c === CellType.Wall) {
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(px + 3, py + 3, TILE - 6, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, py + TILE - 5, TILE, 5);
      } else if (c === CellType.Block) {
        ctx.fillStyle = '#a16207';
        roundRect(ctx, px + 2, py + 2, TILE - 4, TILE - 4, 6);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        roundRect(ctx, px + 6, py + 6, TILE - 12, TILE - 12, 4);
        ctx.fill();
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 16);
        ctx.lineTo(px + TILE - 6, py + 16);
        ctx.moveTo(px + 6, py + 32);
        ctx.lineTo(px + TILE - 6, py + 32);
        ctx.stroke();
      }
    }
  }

  // bombs (pulsing)
  for (const b of s.bombs) {
    const cx = b.tx * TILE + TILE / 2;
    const cy = b.ty * TILE + TILE / 2;
    const urgency = 1 - b.fuse / 2;
    const pulse = reduceMotion ? 1 : 1 + Math.sin(now / (140 - urgency * 80)) * (0.06 + urgency * 0.1);
    const r = 15 * pulse;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, r);
    g.addColorStop(0, '#4b5563');
    g.addColorStop(1, '#111827');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // fuse spark
    ctx.strokeStyle = '#d6a85c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 10);
    ctx.quadraticCurveTo(cx + 14, cy - 20, cx + 8 + (reduceMotion ? 0 : Math.sin(now / 90) * 3), cy - 24);
    ctx.stroke();
    ctx.fillStyle = urgency > 0.6 && !reduceMotion && Math.floor(now / 120) % 2 === 0 ? '#ff3b30' : '#ffd23f';
    ctx.beginPath();
    ctx.arc(cx + 8 + (reduceMotion ? 0 : Math.sin(now / 90) * 3), cy - 25, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // white highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // explosions
  for (const e of s.explosions) {
    const k = e.timer / e.duration; // 1 -> 0
    const alpha = Math.min(1, k * 2);
    for (const c of e.cells) {
      const px = c.x * TILE;
      const py = c.y * TILE;
      const flick = reduceMotion ? 0 : Math.sin(now / 60 + c.x * 2 + c.y) * 3;
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(
        px + TILE / 2,
        py + TILE / 2,
        4,
        px + TILE / 2,
        py + TILE / 2,
        TILE / 1.4,
      );
      g.addColorStop(0, '#fff7cc');
      g.addColorStop(0.45, '#ffd23f');
      g.addColorStop(1, '#ff5a00');
      ctx.fillStyle = g;
      roundRect(ctx, px + 2 + flick * 0.3, py + 2, TILE - 4, TILE - 4, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // enemies
  for (const e of s.enemies) {
    const cx = e.px + PLAYER_SIZE / 2;
    const cy = e.py + PLAYER_SIZE / 2;
    const squash = reduceMotion ? 0 : Math.sin(now / 180 + e.id) * 2;
    const colors: Record<string, [string, string]> = {
      wanderer: ['#f472b6', '#9d174d'],
      chaser: ['#fb923c', '#7c2d12'],
      smart: ['#c084fc', '#581c87'],
    };
    const [body, dark] = colors[e.kind] ?? colors.wanderer;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, e.py + PLAYER_SIZE + 1, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    roundRect(ctx, e.px, e.py + squash * 0.3, PLAYER_SIZE, PLAYER_SIZE - squash * 0.3, 10);
    ctx.fill();
    ctx.fillStyle = dark;
    roundRect(ctx, e.px + 4, e.py + PLAYER_SIZE - 10, PLAYER_SIZE - 8, 6, 3);
    ctx.fill();
    // eyes look along dir
    const ex0 = e.dir.x * 3;
    const ey0 = e.dir.y * 3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 7 + ex0, cy - 4 + ey0, 5, 0, Math.PI * 2);
    ctx.arc(cx + 7 + ex0, cy - 4 + ey0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx - 7 + ex0 * 1.6, cy - 4 + ey0 * 1.6, 2.4, 0, Math.PI * 2);
    ctx.arc(cx + 7 + ex0 * 1.6, cy - 4 + ey0 * 1.6, 2.4, 0, Math.PI * 2);
    ctx.fill();
    if (e.kind !== 'wanderer') {
      // angry brows
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 12);
      ctx.lineTo(cx - 3, cy - 8);
      ctx.moveTo(cx + 12, cy - 12);
      ctx.lineTo(cx + 3, cy - 8);
      ctx.stroke();
    }
  }

  // player
  const p = s.player;
  if (p.alive) {
    const blink = s.time < p.invincibleUntil && !reduceMotion && Math.floor(now / 120) % 2 === 0;
    if (!blink) {
      const bob = p.moving && !reduceMotion ? Math.abs(Math.sin(p.walkPhase)) * 3 : 0;
      const cx = p.px + PLAYER_SIZE / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, p.py + PLAYER_SIZE + 1, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // body (white bomber)
      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, p.px, p.py - bob, PLAYER_SIZE, PLAYER_SIZE, 11);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      roundRect(ctx, p.px + 3, p.py - bob + PLAYER_SIZE - 12, PLAYER_SIZE - 6, 9, 4);
      ctx.fill();
      // face direction eyes
      const ex0 = p.dir.x * 3;
      const ey0 = p.dir.y * 3;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 6 + ex0, p.py + 12 - bob + ey0, 3, 0, Math.PI * 2);
      ctx.arc(cx + 6 + ex0, p.py + 12 - bob + ey0, 3, 0, Math.PI * 2);
      ctx.fill();
      // antenna
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, p.py - bob);
      ctx.lineTo(cx, p.py - 7 - bob);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, p.py - 8 - bob, 3, 0, Math.PI * 2);
      ctx.fill();
      // shield ring
      if (s.time < p.shieldUntil) {
        ctx.strokeStyle = `rgba(59,130,246,${0.6 + 0.4 * Math.sin(now / 200)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, p.py + PLAYER_SIZE / 2 - bob, PLAYER_SIZE / 2 + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // particles
  for (const pt of s.particles) {
    ctx.globalAlpha = Math.max(0, pt.timer / pt.duration);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.px - pt.size / 2, pt.py - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // floating texts
  ctx.textAlign = 'center';
  for (const f of s.floats) {
    const k = f.timer / f.duration;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = '#111827';
    ctx.fillText(f.text, f.px + 1, f.py - (1 - k) * 30 + 1);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(f.text, f.px, f.py - (1 - k) * 30);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

interface Props {
  gameRef: React.MutableRefObject<GameState | null>;
}

export const GameCanvas = memo(function GameCanvas({ gameRef }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const render = () => {
      const s = gameRef.current;
      if (s) drawGame(ctx, s, performance.now(), reduceMotion.current);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [gameRef]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="game-canvas"
      aria-label="Bomberman game board"
    />
  );
});
