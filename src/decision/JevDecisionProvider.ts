import type { DecisionContext, DecisionProvider, DecisionResult } from "./types";

export class JevDecisionProvider implements DecisionProvider {
  constructor(private readonly proxyUrl: string) {}

  async decide(context: DecisionContext): Promise<DecisionResult> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(this.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Jev proxy failed: ${response.status}`);
      }
      const result = (await response.json()) as DecisionResult;
      if (!result?.rumor || !result?.npc || !result?.quest || !result?.specialEvent) {
        throw new Error("Invalid Jev decision payload");
      }
      return { ...result, provider: "jev" };
    } finally {
      window.clearTimeout(timer);
    }
  }
}
