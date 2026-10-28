import { create } from 'zustand';
import { DEFAULT_SKIN_ID, isSkinId } from '../skins';

export type Screen = 'menu' | 'playing' | 'paused' | 'levelClear' | 'gameOver';

interface GameStore {
  screen: Screen;
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  enemiesLeft: number;
  highScore: number;
  muted: boolean;
  volume: number;
  skin: string;
  set: (p: Partial<GameStore>) => void;
  setScreen: (s: Screen) => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  setSkin: (id: string) => void;
}

function loadHigh(): number {
  try {
    return Number(localStorage.getItem('bomberman-high') ?? 0) || 0;
  } catch {
    return 0;
  }
}

function loadSkin(): string {
  try {
    const saved = localStorage.getItem('bomberman-skin');
    return isSkinId(saved) ? saved : DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

function saveSkin(id: string): void {
  try {
    localStorage.setItem('bomberman-skin', id);
  } catch {
    /* ignore */
  }
}

export const useGameStore = create<GameStore>((set) => ({
  screen: 'menu',
  score: 0,
  lives: 3,
  level: 1,
  timeLeft: 180,
  enemiesLeft: 0,
  highScore: loadHigh(),
  muted: false,
  volume: 0.6,
  skin: loadSkin(),
  set: (p) => set(p),
  setScreen: (screen) => set({ screen }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setVolume: (volume) => set({ volume }),
  setSkin: (id) => {
    if (!isSkinId(id)) return;
    saveSkin(id);
    set({ skin: id });
  },
}));

export function saveHigh(score: number): void {
  try {
    const prev = Number(localStorage.getItem('bomberman-high') ?? 0) || 0;
    if (score > prev) localStorage.setItem('bomberman-high', String(score));
  } catch {
    /* ignore */
  }
}
