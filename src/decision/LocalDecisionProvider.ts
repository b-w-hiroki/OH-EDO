import { RUMOR_PRIORITY } from "../data";
import type { DecisionContext, DecisionProvider, DecisionResult } from "./types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class LocalDecisionProvider implements DecisionProvider {
  async decide(context: DecisionContext): Promise<DecisionResult> {
    const chosen =
      RUMOR_PRIORITY.find((tag) => context.candidateRumors.includes(tag)) ??
      context.candidateRumors[0] ??
      "none";

    const importance = context.yesterdayActions.reduce(
      (sum, action) => sum + action.importance,
      0
    );
    const strength = Math.max(0, Math.min(4, importance));

    const positive =
      chosen === "helpful" || chosen === "clean" || chosen === "iki";
    const negative = chosen === "yabo";
    const shouldTalkProbability = clamp01(
      chosen === "none" ? 0.3 : 0.68 + strength * 0.07
    );
    const unlockProbability = clamp01(
      positive ? 0.58 + strength * 0.06 : 0.18
    );
    const specialProbability = clamp01(
      chosen === "funny" || chosen === "quick" ? 0.35 + strength * 0.05 : 0.22
    );

    return {
      rumor: { type: chosen, strength },
      npc: {
        attitude: positive ? "impressed" : negative ? "annoyed" : "neutral",
        affinityDelta: positive ? 2 : negative ? -1 : 0,
        shouldTalkProbability,
        shouldTalk: shouldTalkProbability >= 0.65,
      },
      quest: {
        unlockProbability,
        shouldUnlock: unlockProbability >= 0.75,
      },
      specialEvent: {
        triggerProbability: specialProbability,
        shouldTrigger: specialProbability >= 0.8,
      },
      provider: "local",
    };
  }
}
