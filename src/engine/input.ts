/** Keyboard + touch input handling (framework-free). */

export interface InputBinding {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function createInput() {
  const keys = new Set<string>();
  const touch: InputBinding = { up: false, down: false, left: false, right: false };
  let bombQueued = false;
  let pauseQueued = false;

  const down = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === ' ') bombQueued = true;
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') pauseQueued = true;
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  return {
    setTouch(dir: keyof InputBinding, v: boolean) {
      touch[dir] = v;
    },
    queueBomb() {
      bombQueued = true;
    },
    poll(): { input: InputBinding; bomb: boolean; pause: boolean } {
      const input: InputBinding = {
        up: keys.has('arrowup') || keys.has('w') || touch.up,
        down: keys.has('arrowdown') || keys.has('s') || touch.down,
        left: keys.has('arrowleft') || keys.has('a') || touch.left,
        right: keys.has('arrowright') || keys.has('d') || touch.right,
      };
      const bomb = bombQueued;
      const pause = pauseQueued;
      bombQueued = false;
      pauseQueued = false;
      return { input, bomb, pause };
    },
    dispose() {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    },
  };
}

export type GameInput = ReturnType<typeof createInput>;
