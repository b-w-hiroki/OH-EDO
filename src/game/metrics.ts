const SESSION_KEY = "oh-edo-session-metrics";

type MetricEvent = {
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


export function metricReport(): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const events = raw ? (JSON.parse(raw) as MetricEvent[]) : [];
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        events,
      },
      null,
      2
    );
  } catch {
    return JSON.stringify({ generatedAt: new Date().toISOString(), events: [] }, null, 2);
  }
}

export function isPlaytestMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has("playtest");
  } catch {
    return false;
  }
}
