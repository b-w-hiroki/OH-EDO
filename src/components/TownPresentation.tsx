import type { AreaId, GameState, NPCId } from "../types";
import { AREAS, NPCS } from "../data";

interface Props {
  state: GameState;
  onTalk: (npc: NPCId) => void;
  onSelect: (npc: NPCId) => void;
  selectedNpc: NPCId | null;
  activeSpeaker?: string | null;
  objective: string;
}

const AREA_BACKGROUND: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "/assets/edo/backgrounds/nagaya.webp",
  well: "/assets/edo/backgrounds/well.webp",
  market: "/assets/edo/backgrounds/market.webp",
  firehouse: "/assets/edo/backgrounds/firehouse.webp",
};

const AREA_BANNER: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "やすらぎ長屋",
  well: "井戸端",
  market: "商店通り",
  firehouse: "町火消",
};

const AREA_GREETING: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "よく来たねぇ",
  well: "今日は何を聞いた？",
  market: "今日は活きがいいよ！",
  firehouse: "気を抜くなよ",
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
  const primary = npcs[0];
  const activeNpc = speakerToNpc(activeSpeaker);
  const playerSpeaking = Boolean(activeSpeaker?.includes("主人公"));
  const dialogOpen = state.screen === "dialog";

  return (
    <section
      className={`town-presentation area-${area} ${dialogOpen ? "is-dialogue" : ""} ${playerSpeaking ? "is-player-speaking" : ""}`}
      style={{ backgroundImage: `url("${AREA_BACKGROUND[area]}")` }}
      aria-label={`${AREAS[state.currentArea].name}の情景`}
    >
      <div className="town-presentation-vignette" aria-hidden="true" />

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
      />

      {primary && (
        <>
        <div className="presentation-speech-bubble" aria-hidden="true">
          {AREA_GREETING[area]}
        </div>
        <button
          className={`presentation-character presentation-npc presentation-primary ${characterClass(primary)} ${activeNpc === primary ? "is-speaking" : ""} ${selectedNpc === primary ? "is-selected" : ""}`}
          aria-label={`${displayName(primary)}を選ぶ`}
          onClick={() => onSelect(primary)}
          onDoubleClick={() => onTalk(primary)}
          type="button"
        >
          {selectedNpc === primary && <span className="presentation-talk-ready">話せる</span>}
          <span className="presentation-name">{displayName(primary)}</span>
        </button>
        </>
      )}

      {npcs.slice(1).map((npc) => (
        <button
          className={`presentation-character presentation-npc presentation-secondary ${characterClass(npc)} ${activeNpc === npc ? "is-speaking" : ""} ${selectedNpc === npc ? "is-selected" : ""}`}
          key={npc}
          aria-label={`${displayName(npc)}を選ぶ`}
          onClick={() => onSelect(npc)}
          onDoubleClick={() => onTalk(npc)}
          type="button"
        >
          {selectedNpc === npc && <span className="presentation-talk-ready">話せる</span>}
          <span className="presentation-name">{displayName(npc)}</span>
        </button>
      ))}

      <div className="presentation-scene-note">
        <span>町のひとこと</span>
        <strong>{AREAS[state.currentArea].flavor[0]}</strong>
      </div>
    </section>
  );
}
