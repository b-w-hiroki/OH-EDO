let audioContext: AudioContext | null = null;
let muted = false;
let ambientTimer: number | null = null;
let ambientStep = 0;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioContext ??= new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

function ensureRunning(ctx: AudioContext): void {
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(
  frequency: number,
  duration = 0.07,
  gainValue = 0.025,
  type: OscillatorType = "sine",
  delay = 0
): void {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  ensureRunning(ctx);

  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + Math.min(0.018, duration * 0.22));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseBurst(
  duration = 0.045,
  gainValue = 0.008,
  cutoff = 1200,
  delay = 0
): void {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  ensureRunning(ctx);

  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const envelope = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;

  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
}

function woodenTap(base = 210, gain = 0.012): void {
  noiseBurst(0.035, gain * 0.55, 900);
  tone(base, 0.045, gain, "triangle");
  tone(base * 1.52, 0.028, gain * 0.42, "sine", 0.012);
}

function softChime(notes: number[], gain = 0.012): void {
  notes.forEach((note, index) => {
    tone(note, 0.18 + index * 0.035, gain * (1 - index * 0.1), "sine", index * 0.045);
    tone(note * 2, 0.11, gain * 0.22, "triangle", index * 0.045 + 0.008);
  });
}

function ambientPulse(): void {
  if (muted) return;

  // Keep ambience sparse: a distant street hush plus a tiny pentatonic phrase.
  noiseBurst(0.7, 0.00115, 620);
  const phrases = [
    [196, 293.66],
    [220, 329.63],
    [174.61, 261.63],
    [196, 246.94],
  ];
  const phrase = phrases[ambientStep % phrases.length];
  ambientStep += 1;
  tone(phrase[0], 1.45, 0.0022, "sine", 0.12);
  tone(phrase[1], 0.85, 0.00165, "sine", 0.72);
}

export const uiSound = {
  next(): void {
    // Dry wood/paper page advance rather than a UI beep.
    woodenTap(245, 0.0085);
    noiseBurst(0.055, 0.0036, 1500, 0.012);
  },

  select(): void {
    // Short shamisen/koto-like two-note confirmation.
    woodenTap(196, 0.009);
    tone(392, 0.095, 0.0105, "triangle", 0.028);
    tone(523.25, 0.13, 0.008, "sine", 0.078);
  },

  move(): void {
    // Compact travel-marker tap.
    woodenTap(174.61, 0.0068);
    tone(349.23, 0.065, 0.0045, "sine", 0.025);
  },

  result(): void {
    // Warm pentatonic completion chord.
    softChime([261.63, 329.63, 440], 0.0105);
  },

  startAmbience(): void {
    if (typeof window === "undefined" || ambientTimer != null) return;
    ambientPulse();
    ambientTimer = window.setInterval(ambientPulse, 11000);
  },

  stopAmbience(): void {
    if (ambientTimer != null) {
      window.clearInterval(ambientTimer);
      ambientTimer = null;
    }
  },

  setMuted(value: boolean): void {
    muted = value;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("oh-edo-muted", value ? "1" : "0");
      } catch {
        // Audio preference storage is optional and must never block play.
      }
    }
    if (value) {
      this.stopAmbience();
    } else {
      ambientPulse();
    }
  },

  isMuted(): boolean {
    if (typeof window !== "undefined") {
      try {
        muted = localStorage.getItem("oh-edo-muted") === "1";
      } catch {
        // Keep the in-memory value when storage is unavailable.
      }
    }
    return muted;
  },
};
