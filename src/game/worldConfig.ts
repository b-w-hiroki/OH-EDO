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
export const WORLD_HEIGHT = 1760;

export type OutdoorArea = "market" | "nagaya" | "well" | "firehouse";

/** Outdoor areas, stacked top-to-bottom. The player walks between them. */
export const AREA_BOUNDS: Record<OutdoorArea, Rect> = {
  market: { x: 0, y: 0, w: WORLD_WIDTH, h: 440 },
  nagaya: { x: 0, y: 440, w: WORLD_WIDTH, h: 440 },
  well: { x: 0, y: 880, w: WORLD_WIDTH, h: 440 },
  firehouse: { x: 0, y: 1320, w: WORLD_WIDTH, h: 440 },
};

export const AREA_GROUND: Record<OutdoorArea, number> = {
  market: 0xe5c68e,
  nagaya: 0xd9b982,
  well: 0xb9d7d5,
  firehouse: 0xd6ad7c,
};

export const AREA_LABEL: Record<OutdoorArea, string> = {
  market: "商店通り",
  nagaya: "長屋前",
  well: "井戸端",
  firehouse: "火消し小屋",
};

export const PLAYER_SPAWN: Vec = { x: 600, y: 700 };

export type WorldNPC = Exclude<NPCId, "kumitori_master">;

export const NPC_SPAWNS: Record<WorldNPC, Vec> = {
  newsman: { x: 360, y: 250 },
  fishmonger: { x: 930, y: 250 },
  landlord: { x: 780, y: 690 },
  child: { x: 820, y: 1090 },
  firechief: { x: 720, y: 1510 },
};

/** Door to the long-house room — sits in the 長屋前 area. */
export const ROOM_DOOR: Rect = { x: 1000, y: 558, w: 124, h: 138 };

/** Solid well in the 井戸端 area. */
export const WELL_OBSTACLE: Rect = { x: 430, y: 990, w: 156, h: 120 };

/** Non-colliding decoration blocks: [x, y, w, h, fillColor]. */
export const DECORATIONS: Array<[number, number, number, number, number]> = [
  // 商店通り — market stalls
  [150, 130, 220, 90, 0xe9b770],
  [470, 120, 200, 80, 0xf0c681],
  [1010, 130, 210, 96, 0xe7b06b],
  // 長屋前 — long-house blocks
  [180, 540, 280, 110, 0xcf9f6c],
  [180, 760, 280, 96, 0xd8aa76],
  [620, 540, 240, 92, 0xc99867],
  // 井戸端 — barrels / laundry frames
  [900, 980, 150, 96, 0x9eb77d],
  [1080, 1140, 150, 96, 0xa9c68e],
  [180, 1150, 200, 90, 0x98b47b],
  // 火消し小屋 — equipment racks / buckets
  [210, 1430, 300, 110, 0x5a3b2c],
  [1040, 1450, 180, 95, 0x5a3b2c],
  [320, 1630, 200, 70, 0x6a4a35],
];
