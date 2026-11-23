// Web Audio API Mechanical Keyboard Engine
// Supports high-fidelity Mechvibes sound packs with real audio sprites,
// plus zero-latency synthesis fallback.

type SwitchType = "off" | "blue" | "brown" | "red" | "linear";

interface KeyTiming {
  timing: [number, number][];
}

interface SoundPackConfig {
  audio_file?: string;
  definitions: Record<string, KeyTiming>;
}

interface SoundPackState {
  audioBuffer: AudioBuffer | null;
  definitions: Record<string, KeyTiming>;
  loading: boolean;
  loaded: boolean;
}

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentSwitch: SwitchType = "blue";
  private volume: number = 0.6;
  private effectsGain: GainNode | null = null;
  private effectsVolume: number = 0.6;
  private lastEffectAt = 0;

  // Sound packs cache
  private soundPacks: Record<string, SoundPackState> = {
    blue: { audioBuffer: null, definitions: {}, loading: false, loaded: false },
    brown: { audioBuffer: null, definitions: {}, loading: false, loaded: false },
    red: { audioBuffer: null, definitions: {}, loading: false, loaded: false },
  };

  constructor() {
    // Tự động preload sound pack mặc định khi ở client
    if (typeof window !== "undefined") {
      setTimeout(() => {
        this.loadSoundPack("blue");
      }, 500);
    }
  }

  private initContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  private normalizeSwitch(type: SwitchType): "blue" | "brown" | "red" | "off" {
    if (type === "linear") return "red";
    return type;
  }

  setSwitchType(type: SwitchType) {
    this.currentSwitch = type;
    const normalized = this.normalizeSwitch(type);
    if (normalized !== "off") {
      this.loadSoundPack(normalized);
    }
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

  setEffectsVolume(vol: number) {
    this.effectsVolume = Math.max(0, Math.min(1, vol));
    if (this.effectsGain && this.audioCtx) {
      this.effectsGain.gain.setTargetAtTime(this.effectsVolume * 0.6, this.audioCtx.currentTime, 0.02);
    }
  }

  getEffectsVolume(): number {
    return this.effectsVolume;
  }

  /**
   * Tải và giải mã Sound Pack thực tế từ thư mục public/sounds/
   */
  async loadSoundPack(packName: "blue" | "brown" | "red"): Promise<void> {
    const pack = this.soundPacks[packName];
    if (!pack || pack.loaded || pack.loading) return;

    pack.loading = true;

    try {
      this.initContext();

      // 1. Tải file cấu hình mapping timing phím
      const configRes = await fetch(`/sounds/${packName}/config.json`);
      if (!configRes.ok) throw new Error(`HTTP ${configRes.status} fetching config`);
      const config: SoundPackConfig = await configRes.json();
      pack.definitions = config.definitions || {};

      // 2. Tải file âm thanh sprite ogg
      const audioRes = await fetch(`/sounds/${packName}/sound.ogg`);
      if (!audioRes.ok) throw new Error(`HTTP ${audioRes.status} fetching audio`);
      const arrayBuffer = await audioRes.arrayBuffer();

      // 3. Giải mã AudioBuffer vào bộ nhớ Web Audio
      if (this.audioCtx) {
        const decoded = await this.audioCtx.decodeAudioData(arrayBuffer);
        pack.audioBuffer = decoded;
        pack.loaded = true;
      }
    } catch (err) {
      console.warn(`[SoundManager] Không thể tải sound pack "${packName}", dùng bộ giả lập:`, err);
    } finally {
      pack.loading = false;
    }
  }

  /**
   * Tìm đoạn audio timing [startMs, endMs] tương ứng với phím bấm
   */
  private resolveKeyTiming(
    defs: Record<string, KeyTiming>,
    isSpace: boolean,
    keyOrChar?: string
  ): [number, number] | null {
    if (isSpace || keyOrChar === " " || keyOrChar === "Space") {
      const timing = defs["Space"]?.timing?.[0];
      if (timing) return timing;
    }

    if (!keyOrChar) {
      const fallbackLetters = ["KeyA", "KeyE", "KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"];
      const randomKey = fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
      return defs[randomKey]?.timing?.[0] || defs["KeyA"]?.timing?.[0] || null;
    }

    if (keyOrChar === "Backspace") {
      return defs["Backspace"]?.timing?.[0] || null;
    }
    if (keyOrChar === "Enter") {
      return defs["Enter"]?.timing?.[0] || null;
    }
    if (keyOrChar === "Tab") {
      return defs["Tab"]?.timing?.[0] || null;
    }

    if (keyOrChar.length === 1) {
      const upper = keyOrChar.toUpperCase();
      // Ký tự chữ cái chuẩn A-Z
      if (upper >= "A" && upper <= "Z") {
        const k = `Key${upper}`;
        if (defs[k]?.timing?.[0]) return defs[k].timing[0];
      }
      // Chữ số 0-9
      if (keyOrChar >= "0" && keyOrChar <= "9") {
        const k = `Digit${keyOrChar}`;
        if (defs[k]?.timing?.[0]) return defs[k].timing[0];
      }

      // Ký tự dấu câu
      const punctMap: Record<string, string> = {
        ",": "Comma",
        ".": "Period",
        "/": "Slash",
        ";": "Semicolon",
        "'": "Quote",
        "-": "Minus",
        "=": "Equal",
        "[": "BracketLeft",
        "]": "BracketRight",
        "`": "Backquote",
      };
      if (punctMap[keyOrChar] && defs[punctMap[keyOrChar]]?.timing?.[0]) {
        return defs[punctMap[keyOrChar]].timing[0];
      }

      // Ký tự tiếng Việt có dấu: hash cố định vào 1 phím A-Z để âm thanh nhất quán
      const charCode = keyOrChar.charCodeAt(0);
      const letter = String.fromCharCode(65 + (charCode % 26));
      const mappedKey = `Key${letter}`;
      if (defs[mappedKey]?.timing?.[0]) return defs[mappedKey].timing[0];
    }

    return defs["KeyA"]?.timing?.[0] || null;
  }

  /**
   * Phát âm thanh gõ phím cơ thực tế từ Sound Pack (hoặc fallback synthesizer)
   */
  playKeypress(isSpace = false, isError = false, keyOrChar?: string) {
    if (this.currentSwitch === "off") return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const normalized = this.normalizeSwitch(this.currentSwitch);
      const pack = this.soundPacks[normalized];

      // NẾU SOUND PACK ĐÃ TẢI XONG: PHÁT ÂM THANH PHÍM CƠ THẬT
      if (pack && pack.loaded && pack.audioBuffer) {
        const timing = this.resolveKeyTiming(pack.definitions, isSpace, keyOrChar);
        if (timing) {
          const [startMs, endMs] = timing;
          const startSec = startMs / 1000;
          // Độ dài tiếng gõ phím cơ down-stroke
          const durationSec = Math.max(0.04, Math.min(0.2, (endMs - startMs) / 1000));

          const source = this.audioCtx.createBufferSource();
          source.buffer = pack.audioBuffer;

          // Biến thiên độ cao nhẹ ngẫu nhiên (±2%) tạo cảm giác tự nhiên như gõ phím thật
          source.playbackRate.value = 0.98 + Math.random() * 0.04;

          const gainNode = this.audioCtx.createGain();
          // Biến thiên lực gõ phím nhẹ (velocity variation)
          const velocity = 0.9 + Math.random() * 0.2;
          gainNode.gain.value = this.volume * velocity;

          source.connect(gainNode);
          gainNode.connect(this.audioCtx.destination);

          source.start(this.audioCtx.currentTime, startSec, durationSec);

          // Nếu là phím gõ sai, đệm thêm âm bass cảnh báo nhẹ
          if (isError) {
            this.playErrorChirp();
          }
          return;
        }
      }

      // NẾU SOUND PACK CHƯA TẢI XONG: TỰ ĐỘNG KÍCH HOẠT TẢI VÀ DÙNG FALLBACK TẠM THỜI
      if (pack && !pack.loaded && !pack.loading) {
        this.loadSoundPack(normalized);
      }

      this.playSyntheticKeypress(normalized, isSpace, isError);
    } catch {
      // AudioContext policy or audio failure safely ignored
    }
  }

  private playErrorChirp() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Bộ giả lập Web Audio dự phòng khi sound pack chưa tải xong
   */
  private playSyntheticKeypress(switchType: "blue" | "brown" | "red", isSpace: boolean, isError: boolean) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const gainNode = this.audioCtx.createGain();
    gainNode.connect(this.audioCtx.destination);

    if (isError) {
      this.playErrorChirp();
      return;
    }

    if (switchType === "blue") {
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
    } else if (switchType === "brown") {
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
    } else {
      // red / linear
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
  }

  /** Bus riêng cho hiệu ứng thưởng: tránh chồng âm và tránh clip với tiếng phím. */
  private getEffectsBus(): GainNode | null {
    if (this.currentSwitch === "off" || this.effectsVolume <= 0) return null;
    this.initContext();
    if (!this.audioCtx) return null;

    if (!this.effectsGain) {
      this.effectsGain = this.audioCtx.createGain();
      this.effectsGain.gain.value = this.effectsVolume * 0.6;
      this.effectsGain.connect(this.audioCtx.destination);
    }
    return this.effectsGain;
  }

  private canPlayEffect(minGapMs = 55): boolean {
    const now = Date.now();
    if (now - this.lastEffectAt < minGapMs) return false;
    this.lastEffectAt = now;
    return true;
  }

  private playNote(
    bus: GainNode,
    frequency: number,
    at: number,
    duration: number,
    peak: number,
    type: OscillatorType = "sine"
  ) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    osc.connect(gain);
    gain.connect(bus);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  /** Thang ngũ cung: leo dần theo bậc combo, không bao giờ nghịch tai. */
  playCombo(tier: 1 | 2 | 3 | 4) {
    if (!this.canPlayEffect(70)) return;
    const bus = this.getEffectsBus();
    if (!bus || !this.audioCtx) return;

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0];
    const start = this.audioCtx.currentTime + 0.01;
    const notes = Math.min(2 + tier, 5);
    for (let index = 0; index < notes; index++) {
      const frequency = scale[(tier - 1 + index) % scale.length] * (index === notes - 1 ? 2 : 1);
      this.playNote(bus, frequency, start + index * 0.06, 0.18, 0.16, "triangle");
    }
  }

  /** Tiếng lấp lánh cho phần thưởng biến thiên. */
  playReward(tone: "rare" | "epic") {
    if (!this.canPlayEffect(90)) return;
    const bus = this.getEffectsBus();
    if (!bus || !this.audioCtx) return;

    const start = this.audioCtx.currentTime + 0.01;
    const base = tone === "epic" ? 1046.5 : 880;
    this.playNote(bus, base, start, 0.12, 0.16, "sine");
    this.playNote(bus, base * 1.5, start + 0.06, 0.16, 0.13, "triangle");
    if (tone === "epic") {
      this.playNote(bus, base * 2, start + 0.13, 0.22, 0.1, "sine");
    }
  }

  playRecord() {
    if (!this.canPlayEffect(200)) return;
    const bus = this.getEffectsBus();
    if (!bus || !this.audioCtx) return;

    const start = this.audioCtx.currentTime + 0.01;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      this.playNote(bus, frequency, start + index * 0.08, 0.28, 0.15, "triangle");
    });
  }

  playLevelUp() {
    if (!this.canPlayEffect(200)) return;
    const bus = this.getEffectsBus();
    if (!bus || !this.audioCtx) return;

    const start = this.audioCtx.currentTime + 0.01;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.playNote(bus, frequency, start + index * 0.09, 0.32, 0.14, "sine");
    });
  }

  playCountdown(secondsLeft: number) {
    if (!this.canPlayEffect(300)) return;
    const bus = this.getEffectsBus();
    if (!bus || !this.audioCtx) return;
    const urgency = secondsLeft <= 3 ? 1.45 : 1;
    this.playNote(bus, 620 * urgency, this.audioCtx.currentTime + 0.01, 0.07, 0.09, "square");
  }
}

export const soundManager = new SoundManager();
export type { SwitchType };
