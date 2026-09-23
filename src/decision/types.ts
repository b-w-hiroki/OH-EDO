import type { AreaId, NPCId, RumorTag } from "../types";

export type DecisionProviderName = "jev" | "local";
export type NpcAttitude = "friendly" | "neutral" | "cautious" | "annoyed" | "impressed";
export type DecisionRumor = RumorTag | "none";

export interface PlayerActionRecord {
  id: string;
  day: number;
  type: string;
  targetNpcId?: NPCId;
  importance: number;
  tags: RumorTag[];
}

export interface DecisionContext {
  day: number;
  area: AreaId;
  targetNpcId: NPCId;
  yesterdayActions: PlayerActionRecord[];
  player: {
    money: number;
    trust: number;
    iki: number;
    network: number;
    skill: number;
  };
  town: {
    hygiene: number;
    safety: number;
    trend: number;
    economy: number;
  };
  npcRelations: Record<NPCId, {
    affinity: number;
    caution: number;
    familiarity: number;
    attitude: NpcAttitude;
  }>;
  candidateRumors: RumorTag[];
  recentEvents: string[];
}

export interface DecisionResult {
  rumor: {
    type: DecisionRumor;
    strength: number;
  };
  npc: {
    attitude: NpcAttitude;
    affinityDelta: number;
    shouldTalkProbability: number;
    shouldTalk: boolean;
  };
  quest: {
    unlockProbability: number;
    shouldUnlock: boolean;
  };
  specialEvent: {
    triggerProbability: number;
    shouldTrigger: boolean;
  };
  provider: DecisionProviderName;
}

export interface DecisionLogEntry {
  id: string;
  gameDay: number;
  context: DecisionContext;
  result: DecisionResult;
  appliedRumor?: RumorTag;
  provider: DecisionProviderName;
  fallbackReason?: string;
}

export interface DecisionProvider {
  decide(context: DecisionContext): Promise<DecisionResult>;
}
