import type { AreaId, GameState, NPCId } from "../types";
import { AREAS, NPCS } from "../data";
import { characterArtPath } from "../characterArt";

interface Props {
  state: GameState;
  onTalk: (npc: NPCId) => void;
  onSelect: (npc: NPCId) => void;
  selectedNpc: NPCId | null;
  activeSpeaker?: string | null;
  objective: string;
}

const AREA_BACKGROUND: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "/assets/edo/backgrounds/nagaya.avif",
  well: "/assets/edo/backgrounds/well.avif",
  market: "/assets/edo/backgrounds/market.avif",
  firehouse: "/assets/edo/backgrounds/firehouse.avif",
};

const AREA_BANNER: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "やすらぎ長屋",
  well: "井戸端",
  market: "商店通り",
  firehouse: "町火消",
};

const NPC_GREETING: Partial<Record<NPCId, string>> = {
  landlord: "よく来たねぇ",
  fishmonger: "今日は活きがいいよ！",
  child: "ねえねえ、聞いて！",
  newsman: "面白い話、あるよ！",
  firechief: "気を抜くなよ",
};

const AREA_NOTE: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "人がつながる。町が育つ。ここに、あたらしい江戸。",
  well: "水を汲めば、噂も汲める。井戸端は今日もにぎやか。",
  market: "声と商いが行き交えば、町はもっと面白くなる。",
  firehouse: "町を守る手は、ひとりじゃ足りない。声を掛け合っていこう。",
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

function displayName(npc: NPCId): string {
  switch (npc) {
    case "landlord":
      return "おかみさん";
    case "fishmonger":
      return "熊さん";
    case "child":
      return "源太";
    case "newsman":
      return "瓦版屋";
    case "firechief":
      return "火消し頭";
    default:
      return NPCS[npc].name;
  }
}

function CharacterImage({ id, alt = "" }: { id: NPCId | "player"; alt?: string }) {
  const src = characterArtPath(id);
  if (!src) return null;
  return <img className="presentation-character-image" src={src} alt={alt} draggable={false} />;
}

function characterClass(npc: NPCId): string {
  if (npc === "landlord") return "art-landlord";
  if (npc === "fishmonger") return "art-fishmonger";
  if (npc === "child") return "art-child";
  if (npc === "newsman") return "art-newsman";
  if (npc === "firechief") return "art-firechief";
  return "";
}

function speakerToNpc(speaker?: string | null): NPCId | null {
  if (!speaker) return null;
  if (speaker.includes("大家")) return "landlord";
  if (speaker.includes("魚")) return "fishmonger";
  if (speaker.includes("子ども")) return "child";
  if (speaker.includes("瓦版")) return "newsman";
  if (speaker.includes("火消し")) return "firechief";
  return null;
}

export function TownPresentation({
  state,
  onTalk,
  onSelect,
  selectedNpc,
  activeSpeaker,
  objective,
}: Props) {
  const area = state.currentArea === "room" ? "nagaya" : state.currentArea;
  const npcs = npcIdsForArea(state);
  const activeNpc = speakerToNpc(activeSpeaker);
  const playerSpeaking = Boolean(activeSpeaker?.includes("主人公"));
  const dialogOpen = state.screen === "dialog";
  const featuredNpc =
    dialogOpen && activeNpc && npcs.includes(activeNpc)
      ? activeNpc
      : selectedNpc && npcs.includes(selectedNpc)
        ? selectedNpc
        : npcs[0];

  return (
    <section
      className={`town-presentation area-${area} ${dialogOpen ? "is-dialogue" : ""} ${playerSpeaking ? "is-player-speaking" : ""}`}
      aria-label={`${AREAS[state.currentArea].name}の情景`}
    >
      <div
        className="town-background"
        style={{ backgroundImage: `url("${AREA_BACKGROUND[area]}")` }}
        aria-hidden="true"
      />
      <div className="town-presentation-vignette" aria-hidden="true" />
      <div className="scene-petals" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="presentation-noren" aria-hidden="true">
        <span>{AREA_BANNER[area]}</span>
      </div>

      <aside className="presentation-hanging-note">
        <small>今日の目当て</small>
        <strong>{objective}</strong>
        <span>{AREA_NOTE[area]}</span>
      </aside>

      <button
        className={`presentation-character presentation-player ${playerSpeaking ? "is-speaking" : ""}`}
        aria-label="主人公"
        type="button"
      >
        <CharacterImage id="player" />
      </button>

      {featuredNpc && (
        <>
        <div className="presentation-speech-bubble" aria-hidden="true">
          {NPC_GREETING[featuredNpc] ?? "今日はどうした？"}
        </div>
        <button
          key={featuredNpc}
          className={`presentation-character presentation-npc presentation-primary presentation-featured ${characterClass(featuredNpc)} ${activeNpc === featuredNpc ? "is-speaking" : ""} ${selectedNpc === featuredNpc ? "is-selected" : ""}`}
          aria-label={`${displayName(featuredNpc)}を選ぶ`}
          onClick={() => onSelect(featuredNpc)}
          onDoubleClick={() => onTalk(featuredNpc)}
          type="button"
        >
          <CharacterImage id={featuredNpc} />
          <span className="presentation-name">{displayName(featuredNpc)}</span>
        </button>
        </>
      )}

    </section>
  );
}
