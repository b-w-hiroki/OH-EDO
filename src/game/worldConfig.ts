import type { NPCId } from "../types";

/** Spatial layout for the walkable town. Pure data — no Phaser imports. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec {
  x: number;
  y: number;
}

/** Phaser canvas (logical) size. */
export const GAME_WIDTH = 832;
export const GAME_HEIGHT = 552;

/** Scrollable world size. */
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 1320;

export type OutdoorArea = "market" | "nagaya" | "well";

/** Outdoor areas, stacked top-to-bottom. The player walks between them. */
export const AREA_BOUNDS: Record<OutdoorArea, Rect> = {
  market: { x: 0, y: 0, w: WORLD_WIDTH, h: 440 },
  nagaya: { x: 0, y: 440, w: WORLD_WIDTH, h: 440 },
  well: { x: 0, y: 880, w: WORLD_WIDTH, h: 440 },
};

export const AREA_GROUND: Record<OutdoorArea, number> = {
  market: 0x3b2f23,
  nagaya: 0x342a20,
  well: 0x2b3036,
};

export const AREA_LABEL: Record<OutdoorArea, string> = {
  market: "商店通り",
  nagaya: "長屋前",
  well: "井戸端",
};

export const PLAYER_SPAWN: Vec = { x: 600, y: 700 };

export type WorldNPC = Exclude<NPCId, "kumitori_master">;

export const NPC_SPAWNS: Record<WorldNPC, Vec> = {
  newsman: { x: 360, y: 250 },
  fishmonger: { x: 930, y: 250 },
  landlord: { x: 780, y: 690 },
  child: { x: 820, y: 1090 },
};

/** Door to the long-house room — sits in the 長屋前 area. */
export const ROOM_DOOR: Rect = { x: 1000, y: 558, w: 124, h: 138 };

/** Solid well in the 井戸端 area. */
export const WELL_OBSTACLE: Rect = { x: 430, y: 990, w: 156, h: 120 };

/** Non-colliding decoration blocks: [x, y, w, h, fillColor]. */
export const DECORATIONS: Array<[number, number, number, number, number]> = [
  // 商店通り — market stalls
  [150, 130, 220, 90, 0x4b3b2b],
  [470, 120, 200, 80, 0x4b3b2b],
  [1010, 130, 210, 96, 0x4b3b2b],
  // 長屋前 — long-house blocks
  [180, 540, 280, 110, 0x46382a],
  [180, 760, 280, 96, 0x46382a],
  [620, 540, 240, 92, 0x46382a],
  // 井戸端 — barrels / laundry frames
  [900, 980, 150, 96, 0x404a3a],
  [1080, 1140, 150, 96, 0x404a3a],
  [180, 1150, 200, 90, 0x404a3a],
];
