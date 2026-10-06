import { create } from 'zustand';

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
  set: (p: Partial<GameStore>) => void;
  setScreen: (s: Screen) => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

function loadHigh(): number {
  try {
    return Number(localStorage.getItem('bomberman-high') ?? 0) || 0;
  } catch {
    return 0;
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
  set: (p) => set(p),
  setScreen: (screen) => set({ screen }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setVolume: (volume) => set({ volume }),
}));

export function saveHigh(score: number): void {
  try {
    const prev = Number(localStorage.getItem('bomberman-high') ?? 0) || 0;
    if (score > prev) localStorage.setItem('bomberman-high', String(score));
  } catch {
    /* ignore */
  }
}
