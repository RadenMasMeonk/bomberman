/** Fixed-timestep game loop: 60 updates/sec with accumulator. No React imports. */

export function createLoop(step: (dt: number) => void, render: () => void) {
  let raf = 0;
  let last = 0;
  let acc = 0;
  const STEP = 1 / 60;
  let running = false;

  const frame = (t: number) => {
    if (!running) return;
    if (!last) last = t;
    let dt = (t - last) / 1000;
    last = t;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    render();
    raf = requestAnimationFrame(frame);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
