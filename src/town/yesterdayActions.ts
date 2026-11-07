import type { PlayerActionRecord } from '../decision/types';
export function yesterdayActions(actions: PlayerActionRecord[], day: number): PlayerActionRecord[] {
  if (day <= 1) return [];
  return actions.filter(action => action.day === day - 1).slice(-3).reverse();
}
