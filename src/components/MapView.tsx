import type { AreaDef, AreaId, GameState, NPCDef, NPCId } from "../types";
import { AREAS } from "../data";

interface Props {
  state: GameState;
  area: AreaDef;
  onMove: (id: AreaId) => void;
  onTalk: (id: NPCId) => void;
  npcLookup: Record<NPCId, NPCDef>;
}

export function MapView({ state, area, onMove, onTalk, npcLookup }: Props) {
  const flavorIndex = Math.min(state.day - 1, area.flavor.length - 1);
  const flavor = area.flavor[flavorIndex];

  const reachableExits = area.exits.filter((id) => {
    if (id === "room" && !state.flags.room_unlocked) return false;
    return true;
  });

  return (
    <section className="mapview">
      <div className="area-card">
        <h2 className="area-name">{area.name}</h2>
        <p className="area-desc">{area.description}</p>
        {flavor && <p className="area-flavor">― {flavor}</p>}
      </div>

      <div className="card-row">
        <div className="card">
          <h3>ここに居る人</h3>
          {area.npcs.length === 0 ? (
            <p className="muted">誰も居ない。</p>
          ) : (
            <ul className="npc-list">
              {area.npcs.map((id) => (
                <li key={id}>
                  <button
                    className="npc-button"
                    onClick={() => onTalk(id)}
                  >
                    <span className="npc-name">{npcLookup[id].name}</span>
                    <span className="npc-hint">話しかける</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>移動</h3>
          <ul className="move-list">
            {reachableExits.map((id) => (
              <li key={id}>
                <button className="ghost" onClick={() => onMove(id)}>
                  {AREAS[id].name} へ
                </button>
              </li>
            ))}
            {area.exits.includes("room") && !state.flags.room_unlocked && (
              <li className="muted">（長屋の部屋：まだ入れない）</li>
            )}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>町の小話・噂</h3>
        {state.log.length === 0 ? (
          <p className="muted">特に語ることはまだない。</p>
        ) : (
          <ol className="log">
            {[...state.log].slice(-6).reverse().map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ol>
        )}
        {state.activeRumors.length > 0 && (
          <p className="rumor-tags">
            あんたについた噂： {state.activeRumors.map((r) => `#${r}`).join("  ")}
          </p>
        )}
      </div>
    </section>
  );
}
