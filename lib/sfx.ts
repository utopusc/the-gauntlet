/* THE GAUNTLET — tiny retro 8-bit SFX engine (Web Audio, no asset files).
 *
 * Pure OscillatorNode square/triangle blips. Singleton export `sfx`.
 * - AudioContext is LAZY-initialised on the first user gesture (any sfx call),
 *   to satisfy browser autoplay policies.
 * - Every method is wrapped in try/catch and is a no-op if Web Audio is
 *   unavailable or the context can't start — it must NEVER throw.
 * - Mute state defaults to OFF (sound ON). UI shows a MUTE toggle.
 *
 * API (code against this verbatim):
 *   sfx.blip()    -> short typing/UI tick
 *   sfx.select()  -> menu/mode select confirm (two-tone up)
 *   sfx.hit()     -> boss takes damage (noisy descending zap)
 *   sfx.ko()      -> defeat slam (low rumble + buzz)
 *   sfx.win()     -> victory fanfare (ascending arpeggio)
 *   sfx.lose()    -> failure sting (descending minor)
 *   sfx.toggleMute(): boolean   -> flips mute, returns NEW muted state
 *   sfx.muted: boolean          -> current mute state (true = silent)
 *   sfx.setMuted(v: boolean)    -> set explicitly (e.g. restore from storage)
 */

type WAWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const STORAGE_KEY = 'gauntlet.sfx.muted';

class RetroSfx {
  /** true = silenced. Default false (sound ON). */
  muted = false;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private supported = true;

  constructor() {
    // restore persisted mute preference if present (browser only)
    try {
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === '1') this.muted = true;
      }
    } catch {
      /* ignore */
    }
  }

  /** Lazily create the AudioContext on first gesture. Never throws. */
  private ensure(): boolean {
    if (!this.supported) return false;
    if (this.ctx && this.master) {
      // resume if a gesture suspended/auto-suspended it
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    try {
      const w = (typeof window !== 'undefined' ? window : undefined) as
        | WAWindow
        | undefined;
      const Ctor = w?.AudioContext || w?.webkitAudioContext;
      if (!Ctor) {
        this.supported = false;
        return false;
      }
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18; // overall headroom — chip-tunes are loud
      this.master.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch {
      this.supported = false;
      this.ctx = null;
      this.master = null;
      return false;
    }
  }

  /** Schedule a single oscillator tone. All times relative to ctx.currentTime. */
  private tone(
    freq: number,
    opts: {
      type?: OscillatorType;
      at?: number; // delay (s) from now
      dur?: number; // seconds
      gain?: number; // peak gain (0..1)
      to?: number; // optional glide target freq
      attack?: number;
    } = {},
  ): void {
    if (this.muted) return;
    if (!this.ensure() || !this.ctx || !this.master) return;
    try {
      const {
        type = 'square',
        at = 0,
        dur = 0.09,
        gain = 0.5,
        to,
        attack = 0.005,
      } = opts;
      const t0 = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (typeof to === 'number') {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      }
      // pluck envelope (attack -> exp decay)
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      /* never throw */
    }
  }

  /** A burst of white noise (for hits / KO). */
  private noise(
    opts: { at?: number; dur?: number; gain?: number } = {},
  ): void {
    if (this.muted) return;
    if (!this.ensure() || !this.ctx || !this.master) return;
    try {
      const { at = 0, dur = 0.12, gain = 0.35 } = opts;
      const t0 = this.ctx.currentTime + at;
      const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, gain), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      // low-pass to make it "crunchy" not hissy
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1800, t0);
      lp.frequency.exponentialRampToValueAtTime(400, t0 + dur);
      src.connect(lp);
      lp.connect(g);
      g.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    } catch {
      /* never throw */
    }
  }

  // ---- public SFX ---------------------------------------------------------

  /** UI / typing tick. */
  blip(): void {
    this.tone(660 + Math.random() * 40, {
      type: 'square',
      dur: 0.045,
      gain: 0.32,
    });
  }

  /** Menu/mode select confirm — bright two-tone up. */
  select(): void {
    this.tone(523, { type: 'square', dur: 0.07, gain: 0.4 });
    this.tone(784, { type: 'square', at: 0.06, dur: 0.1, gain: 0.42 });
  }

  /** Boss takes damage — noisy descending zap. */
  hit(): void {
    this.tone(420, { type: 'square', dur: 0.11, gain: 0.45, to: 120 });
    this.noise({ dur: 0.1, gain: 0.3 });
  }

  /** Defeat slam — low rumble + buzz. */
  ko(): void {
    this.tone(180, { type: 'triangle', dur: 0.35, gain: 0.5, to: 50 });
    this.tone(90, { type: 'square', at: 0.04, dur: 0.4, gain: 0.4, to: 40 });
    this.noise({ at: 0.0, dur: 0.3, gain: 0.4 });
  }

  /** Victory fanfare — ascending arpeggio. */
  win(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) =>
      this.tone(f, {
        type: 'square',
        at: i * 0.09,
        dur: 0.14,
        gain: 0.42,
      }),
    );
    // sparkle tail
    this.tone(1568, { type: 'triangle', at: 0.45, dur: 0.25, gain: 0.3 });
  }

  /** Failure sting — descending minor. */
  lose(): void {
    const notes = [392, 311, 262, 196];
    notes.forEach((f, i) =>
      this.tone(f, {
        type: 'square',
        at: i * 0.13,
        dur: 0.18,
        gain: 0.4,
      }),
    );
  }

  // ---- mute control -------------------------------------------------------

  setMuted(v: boolean): void {
    this.muted = !!v;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
      }
    } catch {
      /* ignore */
    }
  }

  /** Flip mute. Returns the NEW muted state. Plays a confirm blip when unmuting. */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      // give audible feedback that sound is back on (also warms the ctx)
      this.blip();
    }
    return this.muted;
  }
}

export const sfx = new RetroSfx();
export default sfx;
