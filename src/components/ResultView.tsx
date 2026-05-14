import type { JobResult, Player, RumorTag, Town } from "../types";

interface Props {
  result: JobResult;
  player: Player;
  town: Town;
  activeRumors: RumorTag[];
  onNext: () => void;
}

function signed(n: number): string {
  if (n === 0) return "±0";
  return n > 0 ? `+${n}` : `${n}`;
}

export function ResultView({
  result,
  player,
  town,
  activeRumors,
  onNext,
}: Props) {
  const d = result.delta;
  return (
    <section className="resultview">
      <div className="area-card">
        <h2 className="area-name">仕事の結末</h2>
        <p className="area-desc">{result.resultText}</p>
      </div>

      <div className="card-row">
        <div className="card">
          <h3>差し引き</h3>
          <ul>
            <li>銭：{signed(d.money)}</li>
            <li>信用：{signed(d.trust)}</li>
            <li>粋：{signed(d.iki)}</li>
            <li>人脈：{signed(d.network)}</li>
            <li>腕前：{signed(d.skill)}</li>
            <li>町の衛生：{signed(d.hygiene)}</li>
          </ul>
        </div>

        <div className="card">
          <h3>今のあんた</h3>
          <ul>
            <li>銭：{player.money}</li>
            <li>信用：{player.trust}</li>
            <li>粋：{player.iki}</li>
            <li>人脈：{player.network}</li>
            <li>腕前：{player.skill}</li>
            <li>町の衛生：{town.hygiene}</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>町についた噂</h3>
        {activeRumors.length === 0 ? (
          <p className="muted">特に何も言われていない。</p>
        ) : (
          <p className="rumor-tags">
            {activeRumors.map((r) => `#${r}`).join("  ")}
          </p>
        )}
      </div>

      <div className="status-actions">
        <button className="primary" onClick={onNext}>
          夜へ進む
        </button>
      </div>
    </section>
  );
}
