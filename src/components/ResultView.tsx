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

type ResultMetricKey = keyof JobResult["delta"];

const RESULT_METRICS: Array<{
  key: ResultMetricKey;
  label: string;
  current: (player: Player, town: Town) => number;
}> = [
  { key: "money", label: "銭", current: (player) => player.money },
  { key: "trust", label: "信用", current: (player) => player.trust },
  { key: "iki", label: "粋", current: (player) => player.iki },
  { key: "network", label: "人脈", current: (player) => player.network },
  { key: "skill", label: "腕前", current: (player) => player.skill },
  { key: "hygiene", label: "町の衛生", current: (_player, town) => town.hygiene },
];

export function ResultView({
  result,
  player,
  town,
  activeRumors,
  onNext,
}: Props) {
  const changes = RESULT_METRICS.filter(({ key }) => result.delta[key] !== 0);

  return (
    <section className="resultview legacy-result-panel">
      <div className="area-card">
        <h2 className="area-name">仕事の結末</h2>
        <p className="area-desc">{result.resultText}</p>
      </div>

      <div className="card result-change-card">
        <h3>今回の変化</h3>
        <ul className="result-change-list">
          {changes.map(({ key, label, current }) => (
            <li key={key}>
              <span>{label}</span>
              <strong>{signed(result.delta[key])}</strong>
              <small>いま {current(player, town)}</small>
            </li>
          ))}
        </ul>
      </div>

      {activeRumors.length > 0 && (
        <div className="card result-rumor-card">
          <h3>町についた噂</h3>
          <p className="rumor-tags">
            {activeRumors.map((rumor) => `#${rumor}`).join("  ")}
          </p>
        </div>
      )}

      <div className="status-actions">
        <button className="primary" onClick={onNext}>
          夜へ進む
        </button>
      </div>
    </section>
  );
}
