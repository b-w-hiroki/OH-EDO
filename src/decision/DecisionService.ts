import type {
  DecisionContext,
  DecisionLogEntry,
  DecisionProvider,
  DecisionResult,
} from "./types";
import { JevDecisionProvider } from "./JevDecisionProvider";
import { LocalDecisionProvider } from "./LocalDecisionProvider";

export interface DecisionOutcome {
  result: DecisionResult;
  fallbackReason?: string;
}

export class DecisionService {
  constructor(
    private readonly primary: DecisionProvider | null,
    private readonly fallback: DecisionProvider = new LocalDecisionProvider()
  ) {}

  async decide(context: DecisionContext): Promise<DecisionOutcome> {
    if (this.primary) {
      try {
        return { result: await this.primary.decide(context) };
      } catch (error) {
        const fallbackReason =
          error instanceof Error ? error.message : "Unknown Jev error";
        return {
          result: await this.fallback.decide(context),
          fallbackReason,
        };
      }
    }
    return {
      result: await this.fallback.decide(context),
      fallbackReason: "Jev proxy is not configured",
    };
  }
}

export function createDecisionService(): DecisionService {
  const proxyUrl = import.meta.env.VITE_JEV_PROXY_URL?.trim();
  return new DecisionService(
    proxyUrl ? new JevDecisionProvider(proxyUrl) : null
  );
}

export function makeDecisionLog(
  context: DecisionContext,
  result: DecisionResult,
  appliedRumor?: DecisionLogEntry["appliedRumor"],
  fallbackReason?: string
): DecisionLogEntry {
  return {
    id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gameDay: context.day,
    context,
    result,
    appliedRumor,
    provider: result.provider,
    fallbackReason,
  };
}
