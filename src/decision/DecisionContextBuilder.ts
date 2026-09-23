import type { GameState } from "../types";
import type { DecisionContext } from "./types";

export function buildDayDecisionContext(state: GameState): DecisionContext {
  return {
    day: state.day + 1,
    area: state.currentArea,
    yesterdayActions: state.playerActions.filter(
      (action) => action.day === state.day
    ),
    player: {
      money: state.player.money,
      trust: state.player.trust,
      iki: state.player.iki,
      network: state.player.network,
      skill: state.player.skill,
    },
    town: { ...state.town },
    candidateRumors: [...state.activeRumors],
    recentEvents: state.log.slice(-6),
  };
}
