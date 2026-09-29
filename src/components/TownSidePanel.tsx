import type { AreaId, GameState, NPCId, RumorTag } from "../types";
import { AREAS, NPCS } from "../data";
import { nextTownEvent } from "../events/townEvents";
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

function SideIcon({ kind }: { kind: "people" | "change" | "story" | "rumor" | "mood" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  if (kind === "people") return <svg {...common}><circle cx="5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4"/><circle cx="11" cy="5.4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M1.8 13c.4-3 2-4.5 3.7-4.5S8.8 10 9.2 13M9 12.8c.2-2.3 1.3-3.5 2.7-3.5 1.2 0 2.2.9 2.5 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
  if (kind === "change") return <svg {...common}><path d="M2 4h7M7 2l2 2-2 2M14 12H7m2-2-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === "story") return <svg {...common}><path d="M3 2.5h8.5A1.5 1.5 0 0 1 13 4v9H4.5A1.5 1.5 0 0 1 3 11.5v-9z" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 5h5M5.5 7.5h4M5.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
  if (kind === "rumor") return <svg {...common}><path d="M2.5 4.5h11v6h-6L4 13v-2.5H2.5v-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5.5" cy="7.5" r=".7" fill="currentColor"/><circle cx="8" cy="7.5" r=".7" fill="currentColor"/><circle cx="10.5" cy="7.5" r=".7" fill="currentColor"/></svg>;
  return <svg {...common}><path d="M2.5 10.5c2-2.8 3.7-2.8 5.5 0s3.5 2.8 5.5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 6.5c2-2.8 3.7-2.8 5.5 0s3.5 2.8 5.5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
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
    yesterdaySummary ?? areaEcho ?? "まだ大きな噂はない。",
    yesterdaySummary && areaEcho
      ? areaEcho
      : areaFlavor[Math.min(areaFlavor.length - 1, Math.max(0, state.day - 1))] ?? areaFlavor[0],
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
