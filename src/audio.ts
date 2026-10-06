/**
 * Procedural sound engine (Web Audio, no asset files needed).
 * Howler is installed per spec for future file-based SFX; this synth
 * guarantees sound works out-of-the-box with zero assets.
 * Place real files in src/assets/sounds/ and wire Howler here to swap.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private musicTimer: number | null = null;
  muted = false;
  volume = 0.6;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(m ? 0 : this.volume, this.ctx.currentTime);
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master && this.ctx && !this.muted) this.master.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  unlock(): void {
    this.ensure();
  }

  play(name: string): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'place':
        this.blip(220, 330, 0.12, 'square', 0.25, t);
        break;
      case 'explosion':
        this.noise(0.5, 0.5, t);
        this.blip(120, 40, 0.45, 'sawtooth', 0.4, t);
        break;
      case 'powerup':
        this.blip(523, 523, 0.09, 'square', 0.22, t);
        this.blip(659, 659, 0.09, 'square', 0.22, t + 0.09);
        this.blip(784, 784, 0.14, 'square', 0.22, t + 0.18);
        break;
      case 'hit':
        this.blip(400, 90, 0.4, 'sawtooth', 0.35, t);
        break;
      case 'enemyDie':
        this.blip(600, 150, 0.25, 'square', 0.25, t);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => this.blip(f, f, 0.16, 'triangle', 0.3, t + i * 0.13));
        break;
      case 'gameover':
        [400, 350, 300, 200].forEach((f, i) => this.blip(f, f * 0.9, 0.25, 'sawtooth', 0.28, t + i * 0.2));
        break;
      default:
        break;
    }
  }

  private blip(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, t: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, t: number): void {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1200;
    src.connect(f);
    f.connect(g);
    g.connect(this.master!);
    src.start(t);
  }

  startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.musicTimer !== null) return;
    // Simple chiptune loop: bass + arp via scheduled blips
    const bass = [110, 110, 130.8, 98];
    let step = 0;
    const tick = () => {
      if (this.muted) {
        step++;
        return;
      }
      const c = this.ctx;
      if (!c || !this.master) return;
      const t = c.currentTime;
      const f = bass[step % bass.length];
      this.blip(f, f, 0.22, 'triangle', 0.12, t);
      if (step % 2 === 0) this.blip(f * 4, f * 4, 0.08, 'square', 0.05, t);
      step++;
    };
    tick();
    this.musicTimer = window.setInterval(tick, 300);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    for (const n of this.musicNodes) {
      try {
        n.osc.stop();
      } catch {
        /* noop */
      }
    }
    this.musicNodes = [];
  }
}

export const sound = new SoundEngine();
