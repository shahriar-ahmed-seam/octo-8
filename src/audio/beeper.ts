/**
 * beeper.ts — Web Audio buzzer for the CHIP-8 sound timer.
 *
 * CHIP-8 produces a single tone while the sound timer (ST) is non-zero.
 * This singleton lazily creates an AudioContext (resumed on the first user
 * gesture to satisfy autoplay policies) and gates a square-wave oscillator
 * with a short attack/release envelope so toggling doesn't click.
 */

class Beeper {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private playing = false;
  private muted = false;
  private frequency = 440;

  private ensure(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(this.ctx.destination);

    this.osc = this.ctx.createOscillator();
    this.osc.type = 'square';
    this.osc.frequency.value = this.frequency;
    this.osc.connect(this.gain);
    this.osc.start();
  }

  /** Call from a user gesture (e.g. clicking Run) to unlock audio. */
  resume(): void {
    this.ensure();
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  setPlaying(on: boolean): void {
    if (on === this.playing) return;
    this.playing = on;
    this.apply();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.apply();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setFrequency(hz: number): void {
    this.frequency = hz;
    if (this.osc && this.ctx) {
      this.osc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.01);
    }
  }

  private apply(): void {
    if (!this.ctx || !this.gain) return;
    const target = this.playing && !this.muted ? 0.08 : 0;
    this.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.008);
  }
}

export const beeper = new Beeper();
