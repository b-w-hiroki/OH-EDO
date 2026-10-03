import type { GameState, NPCId, Screen } from "./types";
import { INITIAL_STATE } from "./data";

export const STORAGE_KEY = "oh-edo-mvp-save-v2";
export const SAVE_SCHEMA_VERSION = 1;

interface SaveEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: Partial<GameState>;
}

const RESTORABLE_SCREENS = new Set<Screen>([
  "title",
  "dialog",
  "town",
  "job",
  "result",
  "fire_choice",
  "fire_result",
  "patrol_choice",
  "patrol_result",
  "festival_choice",
  "festival_result",
  "town_event_choice",
  "town_event_result",
  "room",
  "status",
]);

function restoreScreen(parsed: Partial<GameState>, merged: GameState): Screen {
  if (!merged.flags.intro_done) {
    return parsed.screen === "dialog" && merged.dialog ? "dialog" : "title";
  }

  const requested = parsed.screen;
  if (!requested || !RESTORABLE_SCREENS.has(requested)) return "town";
  if (requested === "title") return "town";
  if (requested === "dialog") return merged.dialog ? "dialog" : "town";
  if (requested === "result") return merged.lastJobResult ? requested : "town";
  if (requested === "fire_result") return merged.fireAftermath ? requested : "town";
  if (requested === "patrol_result") return merged.lastPatrolResult ? requested : "town";
  if (requested === "festival_result") return merged.lastFestivalResult ? requested : "town";
  if (requested === "town_event_choice") {
    return merged.activeTownEventId ? requested : "town";
  }
  if (requested === "town_event_result") {
    return merged.activeTownEventId && merged.lastTownEventResult ? requested : "town";
  }
  return requested;
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
    dialog: parsed.dialog ?? null,
    lastJobResult: parsed.lastJobResult ?? null,
    lastPatrolResult: parsed.lastPatrolResult ?? null,
    lastFestivalResult: parsed.lastFestivalResult ?? null,
    activeTownEventId: parsed.activeTownEventId ?? null,
    completedTownEventIds:
      parsed.completedTownEventIds ??
      (parsed.flags?.day6_cleanup_done ? ["day6_festival_cleanup"] : []),
    lastTownEventResult: parsed.lastTownEventResult ?? null,
  };
  return { ...merged, screen: restoreScreen(parsed, merged) };
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
