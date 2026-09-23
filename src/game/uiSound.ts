let audioContext: AudioContext | null = null;
let muted = false;
let ambientTimer: number | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioContext ??= new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

function tone(
  frequency: number,
  duration = 0.07,
  gainValue = 0.025,
  type: OscillatorType = "sine"
): void {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function ambientPulse(): void {
  if (muted) return;
  tone(196, 1.8, 0.0035, "sine");
  window.setTimeout(() => tone(293.66, 1.2, 0.0025, "sine"), 500);
  window.setTimeout(() => tone(392, 0.55, 0.002, "triangle"), 1350);
}

export const uiSound = {
  next(): void {
    tone(620, 0.045, 0.018);
  },
  select(): void {
    tone(420, 0.055, 0.022);
    window.setTimeout(() => tone(560, 0.06, 0.018), 45);
  },
  move(): void {
    tone(330, 0.045, 0.014);
  },
  result(): void {
    tone(520, 0.06, 0.018);
    window.setTimeout(() => tone(690, 0.08, 0.018), 60);
  },
  startAmbience(): void {
    if (typeof window === "undefined" || ambientTimer != null) return;
    ambientPulse();
    ambientTimer = window.setInterval(ambientPulse, 9000);
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
      localStorage.setItem("oh-edo-muted", value ? "1" : "0");
    }
    if (!value) ambientPulse();
  },
  isMuted(): boolean {
    if (typeof window !== "undefined" && localStorage.getItem("oh-edo-muted") === "1") {
      muted = true;
    }
    return muted;
  },
};
