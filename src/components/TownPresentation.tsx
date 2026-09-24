import type { AreaId, GameState, NPCId } from "../types";
import { AREAS, NPCS } from "../data";

interface Props {
  state: GameState;
  onTalk: (npc: NPCId) => void;
}

const AREA_BACKGROUND: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "/assets/edo/backgrounds/nagaya.webp",
  well: "/assets/edo/backgrounds/well.webp",
  market: "/assets/edo/backgrounds/market.webp",
  firehouse: "/assets/edo/backgrounds/firehouse.webp",
};

function npcIdsForArea(state: GameState): NPCId[] {
  switch (state.currentArea) {
    case "market":
      return ["fishmonger", "newsman"];
    case "well":
      return ["child"];
    case "firehouse":
      return ["firechief"];
    case "nagaya":
      return ["landlord", "child"];
    default:
      return ["landlord"];
  }
}

function characterClass(npc: NPCId): string {
  if (npc === "landlord") return "art-landlord";
  if (npc === "fishmonger") return "art-fishmonger";
  if (npc === "child") return "art-child";
  if (npc === "newsman") return "art-newsman";
  if (npc === "firechief") return "art-firechief";
  return "";
}

export function TownPresentation({ state, onTalk }: Props) {
  const area = state.currentArea === "room" ? "nagaya" : state.currentArea;
  const npcs = npcIdsForArea(state);
  const primary = npcs[0];

  return (
    <section
      className={`town-presentation area-${area}`}
      style={{ backgroundImage: `url("${AREA_BACKGROUND[area]}")` }}
      aria-label={`${AREAS[state.currentArea].name}の情景`}
    >
      <div className="town-presentation-vignette" aria-hidden="true" />

      <div className="presentation-location-card">
        <span>いまいる場所</span>
        <strong>{AREAS[state.currentArea].name}</strong>
      </div>

      <button
        className="presentation-character presentation-player"
        aria-label="主人公"
        type="button"
      />

      {primary && (
        <button
          className={`presentation-character presentation-npc presentation-primary ${characterClass(primary)}`}
          aria-label={`${NPCS[primary].name}と話す`}
          onClick={() => onTalk(primary)}
          type="button"
        >
          <span className="presentation-name">{NPCS[primary].name}</span>
        </button>
      )}

      {npcs.slice(1).map((npc) => (
        <button
          className={`presentation-character presentation-npc presentation-secondary ${characterClass(npc)}`}
          key={npc}
          aria-label={`${NPCS[npc].name}と話す`}
          onClick={() => onTalk(npc)}
          type="button"
        >
          <span className="presentation-name">{NPCS[npc].name}</span>
        </button>
      ))}

      <div className="presentation-scene-note">
        <span>町のひとこと</span>
        <strong>{AREAS[state.currentArea].flavor[0]}</strong>
      </div>
    </section>
  );
}
