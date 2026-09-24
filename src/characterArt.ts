import type { NPCId } from "./types";

export const CHARACTER_ART: Record<"player" | Exclude<NPCId, "kumitori_master">, string> = {
  player: "/assets/edo/characters/full/player.webp",
  landlord: "/assets/edo/characters/full/landlord.webp",
  fishmonger: "/assets/edo/characters/full/fishmonger.webp",
  child: "/assets/edo/characters/full/child.webp",
  newsman: "/assets/edo/characters/full/newsman.webp",
  firechief: "/assets/edo/characters/full/firechief.webp",
};

export function characterArtPath(id: NPCId | "player"): string | null {
  if (id === "kumitori_master") return null;
  return CHARACTER_ART[id];
}
