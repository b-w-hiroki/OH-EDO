import type { GameState } from "../types";
import type { DecisionContext } from "./types";

export function buildDayDecisionContext(state: GameState): DecisionContext {
  const yesterdayActions = state.playerActions.filter(
    (action) => action.day === state.day
  );
  const targetNpcId =
    yesterdayActions[yesterdayActions.length - 1]?.targetNpcId ?? "landlord";

  return {
    day: state.day + 1,
    area: state.currentArea,
    targetNpcId,
    yesterdayActions,
    player: {
      money: state.player.money,
      trust: state.player.trust,
      iki: state.player.iki,
      network: state.player.network,
      skill: state.player.skill,
    },
    town: { ...state.town },
    npcRelations: { ...state.npcRelations },
    candidateRumors: [...state.activeRumors],
    recentEvents: state.log.slice(-6),
  };
}
