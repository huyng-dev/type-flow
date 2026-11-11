// Web Audio API Mechanical Keyboard Synthesizer
// Zero external files, zero latency, ultra responsive

type SwitchType = "off" | "blue" | "brown" | "linear";

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentSwitch: SwitchType = "blue";
  private volume: number = 0.5;

  private initContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  setSwitchType(type: SwitchType) {
    this.currentSwitch = type;
  }

  getSwitchType(): SwitchType {
    return this.currentSwitch;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  playKeypress(isSpace = false, isError = false) {
    if (this.currentSwitch === "off") return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const gainNode = this.audioCtx.createGain();
      gainNode.connect(this.audioCtx.destination);

      if (isError) {
        // Soft error click
        const osc = this.audioCtx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

        gainNode.gain.setValueAtTime(this.volume * 0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.08);
        return;
      }

      if (this.currentSwitch === "blue") {
        // Clicky switch (Cherry MX Blue style) - sharp click transient + bottom out
        const clickOsc = this.audioCtx.createOscillator();
        const baseFreq = isSpace ? 3200 : 3800 + Math.random() * 600;
        clickOsc.type = "triangle";
        clickOsc.frequency.setValueAtTime(baseFreq, now);
        clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

        gainNode.gain.setValueAtTime(this.volume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        clickOsc.connect(gainNode);
        clickOsc.start(now);
        clickOsc.stop(now + 0.025);

        // Low thud bottom out
        const thudOsc = this.audioCtx.createOscillator();
        const thudGain = this.audioCtx.createGain();
        thudGain.connect(this.audioCtx.destination);
        thudOsc.type = "sine";
        thudOsc.frequency.setValueAtTime(isSpace ? 180 : 240, now);
        thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
        thudGain.gain.setValueAtTime(this.volume * 0.25, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        thudOsc.connect(thudGain);
        thudOsc.start(now);
        thudOsc.stop(now + 0.04);

      } else if (this.currentSwitch === "brown") {
        // Tactile switch (Cherry MX Brown style) - deeper "thock"
        const osc = this.audioCtx.createOscillator();
        const baseFreq = isSpace ? 280 : 380 + Math.random() * 80;
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

        gainNode.gain.setValueAtTime(this.volume * 0.45, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.045);

      } else if (this.currentSwitch === "linear") {
        // Soft Linear switch - smooth clack
        const osc = this.audioCtx.createOscillator();
        const baseFreq = isSpace ? 400 : 550 + Math.random() * 100;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch {
      // AudioContext policy or audio failure safely ignored
    }
  }
}

export const soundManager = new SoundManager();
export type { SwitchType };

