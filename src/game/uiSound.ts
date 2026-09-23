let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioContext ??= new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

function tone(frequency: number, duration = 0.07, gainValue = 0.025): void {
  const ctx = context();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
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
};
