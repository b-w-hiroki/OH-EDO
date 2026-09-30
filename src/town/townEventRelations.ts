import type { NPCId, NPCRelations } from "../types";

export type TownEventRelationDelta = Partial<Record<NPCId, number>>;

const RELATION_DELTAS: Record<string, TownEventRelationDelta> = {
  cleanup_street: { fishmonger: 2, newsman: 1 },
  cleanup_lost: { landlord: 2, child: 2, newsman: 1 },
  cleanup_merchants: { fishmonger: 2, landlord: -1, newsman: 1 },

  well_queue: { landlord: 2, child: 1 },
  well_listen: { child: 2, landlord: 1, fishmonger: -1 },
  well_carry: { child: 2, landlord: 1 },

  market_share: { fishmonger: 2, landlord: 1, newsman: 1 },
  market_fetch: { fishmonger: 2, newsman: 1, firechief: -1 },
  market_limit: { landlord: 1, child: 1, fishmonger: -1 },

  watch_stoves: { firechief: 2, fishmonger: 1 },
  watch_routes: { firechief: 2, landlord: 1 },
  watch_people: { firechief: 1, child: 1, newsman: 1 },

  council_trade: { fishmonger: 2, newsman: 1, firechief: -1 },
  council_safety: { landlord: 2, firechief: 2, fishmonger: -1 },
  council_balance: { landlord: 1, fishmonger: 1, child: 1, newsman: 1, firechief: 1 },
};

const NPC_LABELS: Partial<Record<NPCId, string>> = {
  landlord: "おかみさん",
  fishmonger: "熊さん",
  child: "源太",
  newsman: "瓦版屋",
  firechief: "火消し頭",
};

export function townEventRelationDeltas(choiceId: string): TownEventRelationDelta {
  return RELATION_DELTAS[choiceId] ?? {};
}

export function applyTownEventRelationDeltas(
  relations: NPCRelations,
  choiceId: string
): NPCRelations {
  const deltas = townEventRelationDeltas(choiceId);
  return Object.entries(deltas).reduce<NPCRelations>((next, [npcId, delta]) => {
    const npc = npcId as NPCId;
    const amount = delta ?? 0;
    const current = next[npc];
    if (!current || amount === 0) return next;
    return {
      ...next,
      [npc]: {
        ...current,
        affinity: current.affinity + amount,
        familiarity: current.familiarity + 1,
      },
    };
  }, relations);
}

export function townEventRelationSummary(choiceId: string): string {
  const deltas = townEventRelationDeltas(choiceId);
  return Object.entries(deltas)
    .filter(([, delta]) => Boolean(delta))
    .map(([npcId, delta]) => {
      const label = NPC_LABELS[npcId as NPCId] ?? npcId;
      return `${label} ${(delta ?? 0) > 0 ? "+" : ""}${delta}`;
    })
    .join(" / ");
}
