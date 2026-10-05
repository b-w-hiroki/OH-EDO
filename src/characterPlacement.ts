import type { CSSProperties } from "react";
import type { NPCId } from "./types";

type VisibleCharacter = "player" | Exclude<NPCId, "kumitori_master">;

// Pixel anchors reviewed on the existing art, not the transparent canvas or
// raised props. Uniform scaling preserves each pose and natural proportions.
export const CHARACTER_PLACEMENT: Record<VisibleCharacter, {
  width: number; height: number; head: number; foot: number; anchor: number; stature: number;
}> = {
  player: { width: 255, height: 838, head: 80, foot: 831, anchor: 128, stature: 1 },
  landlord: { width: 977, height: 1484, head: 16, foot: 1467, anchor: 488, stature: 1 },
  fishmonger: { width: 970, height: 1502, head: 16, foot: 1485, anchor: 500, stature: 1 },
  newsman: { width: 921, height: 1550, head: 178, foot: 1533, anchor: 460, stature: 1 },
  firechief: { width: 917, height: 1671, head: 200, foot: 1654, anchor: 600, stature: 1 },
  child: { width: 978, height: 1499, head: 110, foot: 1482, anchor: 500, stature: .72 },
};

export function characterPlacementStyle(id: NPCId | "player"): CSSProperties | undefined {
  if (id === "kumitori_master") return undefined;
  const art = CHARACTER_PLACEMENT[id];
  const scale = .7 * art.stature / (art.foot - art.head);
  return {
    "--art-height": scale * art.height,
    "--art-width": scale * art.width,
    "--art-anchor": scale * art.anchor,
    "--art-padding-bottom": scale * (art.height - art.foot),
  } as CSSProperties;
}
