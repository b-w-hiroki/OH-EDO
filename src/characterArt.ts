import type { NPCId } from "./types";
import { publicAsset } from "./publicAsset";

export const CHARACTER_ART: Record<"player" | Exclude<NPCId, "kumitori_master">, string> = {
  player: publicAsset("assets/edo/characters/full/player.webp"),
  landlord: publicAsset("assets/edo/characters/renewed/landlord.webp"),
  fishmonger: publicAsset("assets/edo/characters/renewed/fishmonger.webp"),
  child: publicAsset("assets/edo/characters/renewed/child.webp"),
  newsman: publicAsset("assets/edo/characters/renewed/newsman.webp"),
  firechief: publicAsset("assets/edo/characters/renewed/firechief.webp"),
};

const CHARACTER_PORTRAIT_ART: Partial<Record<NPCId, string>> = {
  landlord: publicAsset("assets/edo/characters/renewed/portraits/landlord.webp"),
  fishmonger: publicAsset("assets/edo/characters/portraits/fishmonger.png"),
  child: publicAsset("assets/edo/characters/renewed/portraits/child.webp"),
  newsman: publicAsset("assets/edo/characters/portraits/newsman.png"),
  firechief: publicAsset("assets/edo/characters/renewed/portraits/firechief.webp"),
};

export function characterArtPath(id: NPCId | "player"): string | null {
  if (id === "kumitori_master") return null;
  return CHARACTER_ART[id];
}

export function characterPortraitPath(id: NPCId): string | null {
  return CHARACTER_PORTRAIT_ART[id] ?? characterArtPath(id);
}

export function hasDedicatedCharacterPortrait(id: NPCId): boolean {
  return Boolean(CHARACTER_PORTRAIT_ART[id]);
}
