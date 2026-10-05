import type { AreaId, GameState, NPCId } from "../types";
import { AREAS, NPCS } from "../data";
import { characterArtPath } from "../characterArt";
import { CHARACTER_PLACEMENT, characterPlacementStyle } from "../characterPlacement";
import { publicAsset } from "../publicAsset";

interface Props {
  state: GameState;
  onSelect: (npc: NPCId) => void;
  selectedNpc: NPCId | null;
  activeSpeaker?: string | null;
}

const AREA_BACKGROUND: Record<Exclude<AreaId, "room">, string> = {
  nagaya: publicAsset("assets/edo/backgrounds/nagaya.webp"),
  well: publicAsset("assets/edo/backgrounds/well.webp"),
  market: publicAsset("assets/edo/backgrounds/market.webp"),
  firehouse: publicAsset("assets/edo/backgrounds/firehouse.webp"),
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

function npcGreeting(state: GameState, npc: NPCId): string {
  const relation = state.npcRelations[npc];
  if (state.day >= 5 && relation?.familiarity >= 3) {
    switch (npc) {
      case "landlord":
        return "たろう、今日も頼むよ";
      case "fishmonger":
        return "おう、たろう！";
      case "child":
        return "たろう、遊ぼう！";
      case "newsman":
        return "次の見出し、頼むぜ";
      case "firechief":
        return "来たか、たろう";
    }
  }
  if (state.day >= 4 && state.flags.festival_started) {
    if (npc === "newsman") return "祭りが始まるぞ！";
    if (npc === "fishmonger") return "今日は稼ぎ時だ！";
    if (npc === "landlord") return "町が浮かれてるねぇ";
  }
  return NPC_GREETING[npc] ?? "今日はどうした？";
}

const AREA_NOTE: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "人がつながる。町が育つ。ここに、あたらしい江戸。",
  well: "水を汲めば、噂も汲める。井戸端は今日もにぎやか。",
  market: "声と商いが行き交えば、町はもっと面白くなる。",
  firehouse: "町を守る手は、ひとりじゃ足りない。声を掛け合っていこう。",
};

const AREA_MOTTO: Record<Exclude<AreaId, "room">, string> = {
  nagaya: "人のつながりが、町をつくる。",
  well: "水を汲めば、噂も汲める。",
  market: "声と商いが、町を動かす。",
  firehouse: "守る手は、ひとりじゃ足りない。",
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

function CharacterImage({
  id,
  alt = "",
  approvedSrc,
}: {
  id: NPCId | "player";
  alt?: string;
  approvedSrc?: string;
}) {
  const src = characterArtPath(id);
  if (!src) return null;
  const placement = id === "kumitori_master" ? null : CHARACTER_PLACEMENT[id];
  return (
    <>
      <img
        className="presentation-character-image presentation-character-image-default"
        src={src}
        data-art-head={placement?.head}
        data-art-foot={placement?.foot}
        data-art-anchor={placement?.anchor}
        alt={alt}
        draggable={false}
      />
      {approvedSrc && (
        <img
          className="presentation-character-image presentation-character-image-approved"
          src={approvedSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
    </>
  );
}

function characterClass(npc: NPCId): string {
  if (npc === "landlord") return "art-landlord";
  if (npc === "fishmonger") return "art-fishmonger";
  if (npc === "child") return "art-child";
  if (npc === "newsman") return "art-newsman";
  if (npc === "firechief") return "art-firechief";
  return "";
}

function festivalVisualClass(state: GameState): string {
  if (state.day === 4 && state.flags.festival_started) return "is-festival-prep";
  if (state.day === 5 && state.flags.festival_done) return "is-festival-after";
  if (state.day === 6 && state.flags.festival_done && !state.flags.day6_cleanup_done) return "is-festival-leftover";
  if (state.day === 6 && state.flags.day6_cleanup_done) return "is-festival-cleaned";
  return "";
}

function townMoodClasses(state: GameState): string {
  const classes: string[] = [];
  if (state.town.hygiene >= 55) classes.push("is-town-clean");
  if (state.town.economy >= 55) classes.push("is-town-bustling");
  if (state.town.safety >= 55) classes.push("is-town-calm");
  return classes.join(" ");
}

function visualConsequenceClass(state: GameState): string {
  const yesterday = state.playerActions.filter((action) => action.day === state.day - 1).slice(-1)[0];
  const type = yesterday?.type ?? "";
  if (/cleanup_/.test(type)) return "has-cleanup-memory";
  if (/well_/.test(type)) return "has-well-memory";
  if (/market_/.test(type)) return "has-market-memory";
  if (/watch_/.test(type)) return "has-watch-memory";
  if (/council_/.test(type)) return "has-council-memory";
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
  onSelect,
  selectedNpc,
  activeSpeaker,
}: Props) {
  const area = state.currentArea === "room" ? "nagaya" : state.currentArea;
  const npcs = npcIdsForArea(state);
  const activeNpc = speakerToNpc(activeSpeaker);
  const playerSpeaking = Boolean(activeSpeaker?.includes("主人公"));
  const dialogOpen = state.screen === "dialog";
  const featuredNpc =
    dialogOpen && activeNpc
      ? activeNpc
      : selectedNpc
        ? selectedNpc
        : npcs[0];
  const secondaryNpc = !dialogOpen
    ? npcs.find((npc) => npc !== featuredNpc) ?? null
    : null;
  const approvedNagayaDialogue = dialogOpen && area === "nagaya";

  return (
    <section
      className={`town-presentation area-${area} ${dialogOpen ? "is-dialogue" : ""} ${playerSpeaking ? "is-player-speaking" : ""} ${festivalVisualClass(state)} ${visualConsequenceClass(state)} ${townMoodClasses(state)}`}
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
      <div className="scene-props" aria-hidden="true">
        <span className="scene-prop prop-lantern" />
        <span className="scene-prop prop-crate" />
        <span className="scene-prop prop-sign" />
        <span className="scene-life-prop life-basket" />
        <span className="scene-life-prop life-buckets" />
        <span className="scene-life-prop life-goods" />
        <span className="scene-life-prop life-passerby" />
        <span className="scene-memory-prop memory-cleanup" />
        <span className="scene-memory-prop memory-well" />
        <span className="scene-memory-prop memory-market" />
        <span className="scene-memory-prop memory-watch" />
        <span className="scene-memory-prop memory-council" />
        <span className="scene-ambient-accent accent-nagaya" />
        <span className="scene-ambient-accent accent-well" />
        <span className="scene-ambient-accent accent-market" />
        <span className="scene-ambient-accent accent-firehouse" />
      </div>

      <div className="presentation-noren" aria-hidden="true">
        <span>{AREA_BANNER[area]}</span>
      </div>

      <aside className="presentation-hanging-note" aria-label="町のひとこと">
        <small>町のひとこと</small>
        <strong>{AREA_MOTTO[area]}</strong>
        <span>{AREA_NOTE[area]}</span>
      </aside>

      <button
        className={`presentation-character presentation-player ${playerSpeaking ? "is-speaking" : ""}`}
        style={characterPlacementStyle("player")}
        aria-label="主人公"
        type="button"
      >
        <CharacterImage
          id="player"
          approvedSrc={approvedNagayaDialogue ? publicAsset("assets/edo/characters/approved-live/player-approved-live.png") : undefined}
        />
      </button>

      {secondaryNpc && (
        <button
          key={`secondary-${secondaryNpc}`}
          className={`presentation-character presentation-npc presentation-secondary ${characterClass(secondaryNpc)} ${state.npcRelations[secondaryNpc]?.familiarity >= 3 ? "is-familiar" : ""} ${selectedNpc === secondaryNpc ? "is-selected" : ""}`}
          aria-label={`${displayName(secondaryNpc)}を選ぶ`}
          aria-pressed={selectedNpc === secondaryNpc}
          onClick={() => onSelect(secondaryNpc)}
          type="button"
        >
          <CharacterImage id={secondaryNpc} />
          <span className="presentation-name">{displayName(secondaryNpc)}</span>
        </button>
      )}

      {featuredNpc && (
        <>
        <div className="presentation-speech-bubble" aria-hidden="true">
          {npcGreeting(state, featuredNpc)}
        </div>
        <button
          key={featuredNpc}
          style={characterPlacementStyle(featuredNpc)}
          className={`presentation-character presentation-npc presentation-primary presentation-featured ${characterClass(featuredNpc)} ${state.npcRelations[featuredNpc]?.familiarity >= 3 ? "is-familiar" : ""} ${activeNpc === featuredNpc ? "is-speaking" : ""} ${selectedNpc === featuredNpc ? "is-selected" : ""}`}
          aria-label={`${displayName(featuredNpc)}を選ぶ`}
          aria-pressed={selectedNpc === featuredNpc}
          onClick={() => onSelect(featuredNpc)}
          type="button"
        >
          <CharacterImage
            id={featuredNpc}
          />
          <span className="presentation-name">{displayName(featuredNpc)}</span>
        </button>
        </>
      )}

    </section>
  );
}
