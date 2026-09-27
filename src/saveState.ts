import type { GameState, NPCId } from "./types";
import { INITIAL_STATE } from "./data";

export const STORAGE_KEY = "oh-edo-mvp-save-v2";
export const SAVE_SCHEMA_VERSION = 1;

interface SaveEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: Partial<GameState>;
}

function mergeState(parsed: Partial<GameState>): GameState {
  const merged: GameState = {
    ...INITIAL_STATE,
    ...parsed,
    player: { ...INITIAL_STATE.player, ...(parsed.player ?? {}) },
    town: { ...INITIAL_STATE.town, ...(parsed.town ?? {}) },
    flags: { ...INITIAL_STATE.flags, ...(parsed.flags ?? {}) },
    npcRelations: Object.fromEntries(
      Object.entries(INITIAL_STATE.npcRelations).map(([npcId, initial]) => [
        npcId,
        {
          ...initial,
          ...(parsed.npcRelations?.[npcId as NPCId] ?? {}),
        },
      ])
    ) as GameState["npcRelations"],
    activeRumors: parsed.activeRumors ?? [],
    rumorHistory: parsed.rumorHistory ?? [],
    reputationTags: parsed.reputationTags ?? [],
    log: parsed.log ?? [],
    playerActions: parsed.playerActions ?? [],
    decisionLogs: parsed.decisionLogs ?? [],
    lastDecision: parsed.lastDecision ?? null,
    fireAftermath: parsed.fireAftermath ?? null,
    dialog: null,
    lastJobResult: parsed.lastJobResult ?? null,
    lastPatrolResult: parsed.lastPatrolResult ?? null,
    lastFestivalResult: parsed.lastFestivalResult ?? null,
    activeChapterEventId: parsed.activeChapterEventId ?? null,
    completedChapterEvents: parsed.completedChapterEvents ?? [],
    lastChapterResult: parsed.lastChapterResult ?? null,
  };
  const screen = merged.flags.intro_done ? "town" : "title";
  return { ...merged, dialog: null, screen };
}

export function loadGameState(storage: Storage = localStorage): GameState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;

    const decoded = JSON.parse(raw) as SaveEnvelope | Partial<GameState>;
    const parsed =
      typeof decoded === "object" &&
      decoded !== null &&
      "schemaVersion" in decoded &&
      "state" in decoded
        ? (decoded as SaveEnvelope).state
        : (decoded as Partial<GameState>);

    return mergeState(parsed);
  } catch {
    return INITIAL_STATE;
  }
}

export function saveGameState(state: GameState, storage: Storage = localStorage): boolean {
  try {
    const envelope: SaveEnvelope = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      state,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearGameState(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / denied storage: nothing else to do.
  }
}
