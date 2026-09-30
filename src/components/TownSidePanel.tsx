import type { AreaId, GameState, NPCId, RumorTag } from "../types";
import { AREAS, NPCS } from "../data";
import { nextTownEvent, townEventConsequence } from "../events/townEvents";
import { characterArtPath } from "../characterArt";
import {
  actionTagLabel,
  fiveDayHook,
  isNpcKnown,
  npcDisplayName,
  npcSubtitle,
  relationMemoryLabel,
  rumorLabel,
} from "../townLabels";

function areaNpcIds(state: GameState): NPCId[] {
  if (state.currentArea === "market") return ["fishmonger", "newsman"];
  if (state.currentArea === "well") return ["child"];
  if (state.currentArea === "firehouse") return ["firechief"];
  if (state.currentArea === "room") return ["landlord"];
  return ["landlord", "child"];
}

function sidePanelNpcIds(state: GameState): NPCId[] {
  const local = areaNpcIds(state);
  const nearbyByArea: Partial<Record<AreaId, NPCId[]>> = {
    nagaya: ["landlord", "child", "fishmonger", "newsman"],
    market: ["fishmonger", "newsman", "child", "landlord"],
    well: ["child", "landlord", "fishmonger", "newsman"],
    firehouse: ["firechief", "newsman", "landlord", "fishmonger"],
    room: ["landlord"],
  };
  const merged = [...local, ...(nearbyByArea[state.currentArea] ?? [])];
  return Array.from(new Set(merged)).slice(0, 4);
}


function npcRailLine(state: GameState, npc: NPCId): string {
  const yesterday = state.playerActions.filter((action) => action.day === state.day - 1).slice(-1)[0];
  const specific = townEventConsequence(yesterday?.type)?.npcReactions[npc];
  if (specific) return specific;

  const relation = state.npcRelations[npc];
  if (state.day >= 5 && relation.familiarity >= 3) {
    switch (npc) {
      case "landlord": return "最近、顔つきが変わったねぇ。";
      case "fishmonger": return "昨日は助かったよ。また頼むぜ。";
      case "child": return "たろう、またなんかしてるの？";
      case "newsman": return "次の話も、お前の名前が出そうだな。";
      case "firechief": return "あんたの動き、ちゃんと見てたぜ。";
    }
  }
  if (relation.affinity >= 3) return "この町にも、だいぶ馴染んできたな。";
  if (relation.familiarity >= 2) return "また顔を見たな。今日はどうした？";
  return "まだ新入りの顔だな。";
}

function relationPercent(state: GameState, npc: NPCId): number {
  const relation = state.npcRelations[npc];
  return Math.max(8, Math.min(100, 18 + relation.familiarity * 13 + relation.affinity * 8));
}

function nextChapterLead(state: GameState): { place: string; title: string; text: string } | null {
  if (!state.completedTownEventIds.includes("day10_town_council")) return null;
  const councilChoice = [...state.playerActions]
    .reverse()
    .find((action) => action.type.startsWith("council_"))?.type;

  switch (councilChoice) {
    case "council_trade":
      return {
        place: "河岸・船着場",
        title: "町の外から、商いの話が届き始めた",
        text: "熊さんが新しい仕入れ先を探している。次は町の中だけでなく、川向こうとのつながりが仕事になりそうだ。",
      };
    case "council_safety":
      return {
        place: "寺社前・裏路地",
        title: "暮らしを守る相談が、町外れへ広がった",
        text: "火消し頭が古い道と人の流れを気にしている。次は町内の安全を、外との境目まで見に行くことになりそうだ。",
      };
    case "council_balance":
      return {
        place: "湯屋・茶屋",
        title: "人が集まる場所から、新しい相談が生まれそうだ",
        text: "大家と瓦版屋が、町人の本音を拾える場所を探している。次章では『顔役』として人の間をつなぐ仕事が増えていく。",
      };
    default:
      return {
        place: "町の外れ",
        title: "大江戸町の外からも、名前を呼ぶ声がする",
        text: "十日間で築いた評判が、少しずつ町の外へ届き始めている。次は新しい場所と人間関係が待っている。",
      };
  }
}

function SideIcon({ kind }: { kind: "people" | "change" | "story" | "rumor" | "mood" }) {
  return <span className={`side-icon-art side-icon-${kind}`} aria-hidden="true" />;
}

export function TownSidePanel({
  state,
  dominantRumor,
  areaEcho,
  yesterdaySummary,
  selectedNpc,
  onSelect,
  onTalk,
  onStartNextDay,
}: {
  state: GameState;
  dominantRumor: RumorTag | null;
  areaEcho: string | null;
  yesterdaySummary: string | null;
  selectedNpc: NPCId | null;
  onSelect: (npc: NPCId) => void;
  onTalk: (npc: NPCId) => void;
  onStartNextDay: () => void;
}) {
  const areaNpcIds = sidePanelNpcIds(state);
  const knownCount = areaNpcIds.filter((npcId) => isNpcKnown(state, npcId)).length;
  const totalKnownCount = (Object.keys(state.npcRelations) as NPCId[])
    .filter((npc) => npc !== "kumitori_master")
    .filter((npc) => isNpcKnown(state, npc)).length;
  const finaleReady = state.day === 5 && state.flags.festival_done;
  const upcomingTownEvent = state.screen === "town" ? nextTownEvent(state) : null;
  const nextChapter = nextChapterLead(state);
  const areaFlavor = AREAS[state.currentArea].flavor;
  const recentActionItems = state.playerActions
    .slice(-3)
    .reverse()
    .map((action) => ({
      label: actionTagLabel(action.tags?.[0]),
      effect: action.tags?.[0]
        ? `「${rumorLabel(action.tags[0])}」として町に残った`
        : "町の人が覚えている",
    }));

  const rumorItems = [
    areaEcho ?? "まだ大きな噂はない。",
    areaFlavor[Math.min(areaFlavor.length - 1, Math.max(0, state.day - 1))] ?? areaFlavor[0],
    dominantRumor
      ? `町では「${rumorLabel(dominantRumor)}」の話が少しずつ広がっている。`
      : "商店通りでは、朝から新しい話題を探す声が聞こえる。",
  ];

  return (
    <aside className="town-side-panel">
      <section className="side-card">
        <div className="side-card-title">
          <span><SideIcon kind="people" /> このあたりの人たち</span>
          <small className="side-card-more">
            {knownCount > 0 ? `${knownCount}人が顔なじみ` : "まだ新入り"}
          </small>
        </div>
        <div className="nearby-list">
          {areaNpcIds.map((npcId) => (
            <div
              className={`nearby-person ${selectedNpc === npcId ? "selected" : ""}`}
              key={npcId}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(npcId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(npcId);
                }
              }}
            >
              <span className={`nearby-avatar avatar-${npcId}`}>
                {characterArtPath(npcId) ? (
                  <img src={characterArtPath(npcId) ?? undefined} alt="" draggable={false} />
                ) : (
                  <span>{NPCS[npcId].name.slice(0, 1)}</span>
                )}
              </span>
              <div className="nearby-copy">
                <strong>{npcDisplayName(npcId)}</strong>
                <span className="npc-subtitle">{npcSubtitle(npcId)}</span>
                <span className="npc-memory-line">{npcRailLine(state, npcId)}</span>
                <span className="npc-relation-meter" aria-label={`関係度 ${relationPercent(state, npcId)}%`}>
                  <i style={{ width: `${relationPercent(state, npcId)}%` }} />
                </span>
                <small className={`relation-pill ${isNpcKnown(state, npcId) ? "is-known" : ""}`}>♥ {relationMemoryLabel(state, npcId)}</small>
              </div>
              <button
                className="nearby-talk"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(npcId);
                  onTalk(npcId);
                }}
                aria-label={`${npcDisplayName(npcId)}と話す`}
              >
                話す
              </button>
            </div>
          ))}
        </div>
      </section>

      {finaleReady && (
        <section className="side-card town-finale-card">
          <div className="side-card-title"><span><SideIcon kind="story" /> 五日間の歩み</span></div>
          <strong className="town-finale-rank">{state.player.rankName}</strong>
          <div className="town-finale-stats">
            <span>顔なじみ <b>{totalKnownCount}人</b></span>
            <span>評判 <b>{state.reputationTags[0] ?? "これから"}</b></span>
          </div>
          <p>{fiveDayHook(state)}</p>
          <button className="primary town-next-day" onClick={onStartNextDay}>
            六日目へ
          </button>
        </section>
      )}

      {!finaleReady && upcomingTownEvent && (
        <section className="side-card town-next-event-card">
          <div className="side-card-title"><span><SideIcon kind="story" /> 次の日の頼みごと</span></div>
          <strong>{upcomingTownEvent.day}日目：{upcomingTownEvent.title}</strong>
          <p>{AREAS[upcomingTownEvent.area].name}で、また誰かがたろうを待っている。</p>
          <button className="primary town-next-day" onClick={onStartNextDay}>
            {upcomingTownEvent.day}日目へ
          </button>
        </section>
      )}

      {nextChapter && (
        <section className="side-card next-chapter-card">
          <div className="side-card-title"><span><SideIcon kind="story" /> 次章の気配</span></div>
          <small className="next-chapter-place">{nextChapter.place}</small>
          <strong>{nextChapter.title}</strong>
          <p>{nextChapter.text}</p>
        </section>
      )}

      {(recentActionItems.length > 0 || yesterdaySummary) && (
        <section className="side-card yesterday-card">
          <div className="side-card-title"><span><SideIcon kind="change" /> 昨日の行動 → 今日の変化</span></div>
          {recentActionItems.length > 0 ? (
            <ul className="action-change-list">
              {recentActionItems.map((item, index) => (
                <li key={`${index}-${item.label}`}>
                  <span>{item.label}</span>
                  <b>→</b>
                  <strong>{item.effect}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>{yesterdaySummary}</p>
          )}
        </section>
      )}

      <section className="side-card town-flavor-card">
        <div className="side-card-title"><span><SideIcon kind="story" /> この場所の小話</span></div>
        <p>{AREAS[state.currentArea].flavor[Math.min(AREAS[state.currentArea].flavor.length - 1, Math.max(0, state.day - 1))]}</p>
      </section>

      <section className="side-card rumor-card">
        <div className="side-card-title"><span><SideIcon kind="rumor" /> 今日のうわさ</span></div>
        <ul className="rumor-list">
          {rumorItems.map((item, index) => (
            <li key={`${index}-${item}`}>
              <span className={`rumor-marker rumor-marker-${index}`} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {dominantRumor && <span className="rumor-chip">{rumorLabel(dominantRumor)}</span>}
      </section>

      <section className="side-card town-mood-card">
        <div className="side-card-title"><span><SideIcon kind="mood" /> 町の空気</span></div>
        <div className="mood-list">
          {[
            ["衛生", state.town.hygiene],
            ["治安", state.town.safety],
            ["流行", state.town.trend],
            ["景気", state.town.economy],
          ].map(([label, value]) => (
            <div className="mood-row" key={label}>
              <span>{label}</span>
              <div className="mood-bar"><i style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} /></div>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
