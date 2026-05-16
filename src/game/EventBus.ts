import Phaser from "phaser";

/**
 * Singleton event bridge between React (state owner) and Phaser (the town scene).
 *
 * React → Phaser:
 *   "screen-changed" (screen: Screen)        — Phaser enables input only on "town"
 *   "game-flags"     ({ roomUnlocked })      — gates the room door
 *   "warp"           (area: AreaId)          — repositions the player
 *
 * Phaser → React:
 *   "scene-ready"    ()                      — town scene finished create()
 *   "area-entered"   (area: OutdoorArea)     — player walked into a new area
 *   "npc-interact"   (npc: NPCId)            — player pressed action near an NPC
 *   "enter-room"     ()                      — player opened the room door
 */
export const EventBus = new Phaser.Events.EventEmitter();
