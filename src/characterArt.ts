import type { NPCId } from "./types";
import { publicAsset } from "./publicAsset";

export const CHARACTER_ART: Record<"player" | Exclude<NPCId, "kumitori_master">, string> = {
  player: publicAsset("assets/edo/characters/full/player.webp"),
  landlord: publicAsset("assets/edo/characters/full/landlord.webp"),
  fishmonger: publicAsset("assets/edo/characters/full/fishmonger.webp"),
  child: publicAsset("assets/edo/characters/full/child.webp"),
  newsman: publicAsset("assets/edo/characters/full/newsman.webp"),
  firechief: publicAsset("assets/edo/characters/full/firechief.webp"),
};

export function characterArtPath(id: NPCId | "player"): string | null {
  if (id === "kumitori_master") return null;
  return CHARACTER_ART[id];
}
