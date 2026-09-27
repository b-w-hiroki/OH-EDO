const SESSION_KEY = "oh-edo-session-metrics";

export type MetricEvent = {
  type: string;
  at: string;
  day?: number;
  detail?: string;
};

export function recordMetric(type: string, day?: number, detail?: string): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const events = raw ? (JSON.parse(raw) as MetricEvent[]) : [];
    events.push({ type, at: new Date().toISOString(), day, detail });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(events.slice(-100)));
  } catch {
    // Metrics are optional and never block play.
  }
}


export function readMetrics(): MetricEvent[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MetricEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearMetrics(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Optional QA data only.
  }
}
