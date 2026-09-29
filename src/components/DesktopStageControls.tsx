import type { AreaId, GameState, NPCId } from "../types";
import { AREAS } from "../data";
import { characterArtPath } from "../characterArt";
import { npcDisplayName } from "../townLabels";

const PIN_POS: Record<AreaId | "map", { left: string; top: string }> = {
  nagaya: { left: "16%", top: "62%" },
  well: { left: "43%", top: "30%" },
  market: { left: "56%", top: "68%" },
  firehouse: { left: "77%", top: "35%" },
  room: { left: "28%", top: "78%" },
  map: { left: "85%", top: "74%" },
};

export function DesktopStageControls({
  state,
  activeTalkNpc,
  onMove,
  onRoom,
  onMap,
  onTalk,
}: {
  state: GameState;
  activeTalkNpc: NPCId | null;
  onMove: (area: AreaId) => void;
  onRoom: () => void;
  onMap: () => void;
  onTalk: () => void;
}) {
  const items: Array<{ id: AreaId | "map"; label: string; locked?: boolean }> = [
    { id: "nagaya", label: "長屋前" },
    { id: "well", label: "井戸端" },
    { id: "market", label: "商店通り" },
    { id: "firehouse", label: "火消し小屋", locked: !state.flags.firehouse_unlocked },
    { id: "room", label: "部屋", locked: !state.flags.room_unlocked },
    { id: "map", label: "地図" },
  ];

  return (
    <div className="desktop-stage-controls">
      <div className="stage-minimap" aria-label="町のミニマップ">
        <div className="stage-minimap-title">{AREAS[state.currentArea].name}</div>
        <div className="stage-minimap-canvas">
          <span className="map-river" aria-hidden="true" />
          <span className="map-road road-a" aria-hidden="true" />
          <span className="map-road road-b" aria-hidden="true" />
          {items.map((item) => {
            const active = item.id !== "map" && state.currentArea === item.id;
            const pos = PIN_POS[item.id];
            return (
              <button
                key={item.id}
                className={`stage-map-pin ${active ? "active" : ""} ${item.id === "map" ? "map-open" : ""}`}
                style={{ left: pos.left, top: pos.top }}
                disabled={item.locked}
                onClick={() => {
                  if (item.id === "map") onMap();
                  else if (item.id === "room") onRoom();
                  else onMove(item.id);
                }}
              >
                <span>{active ? "●" : "○"}</span>
                <small>{item.locked ? "—" : item.label}</small>
              </button>
            );
          })}
        </div>
      </div>

      <button
        className="stage-talk-prompt"
        disabled={!activeTalkNpc}
        onClick={onTalk}
      >
        <span className="stage-talk-key">E</span>
        <strong>話す</strong>
        <small>{activeTalkNpc ? npcDisplayName(activeTalkNpc) : "相手を選ぶ"}</small>
      </button>

      <div className="stage-touch-controls" aria-hidden="true">
        <span className="stage-dpad">◆</span>
        <span className="stage-action-bubble">
          {activeTalkNpc && characterArtPath(activeTalkNpc) ? (
            <img src={characterArtPath(activeTalkNpc) ?? undefined} alt="" draggable={false} />
          ) : (
            "•••"
          )}
        </span>
      </div>
    </div>
  );
}
