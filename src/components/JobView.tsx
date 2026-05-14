import type { JobChoice } from "../types";

interface Props {
  choices: JobChoice[];
  onChoose: (choice: JobChoice) => void;
}

function effectsLabel(e: JobChoice["effects"]): string {
  const parts: string[] = [];
  if (e.money) parts.push(`銭 ${signed(e.money)}`);
  if (e.trust) parts.push(`信用 ${signed(e.trust)}`);
  if (e.iki) parts.push(`粋 ${signed(e.iki)}`);
  if (e.network) parts.push(`人脈 ${signed(e.network)}`);
  if (e.skill) parts.push(`腕前 ${signed(e.skill)}`);
  if (e.hygiene) parts.push(`衛生 ${signed(e.hygiene)}`);
  return parts.join(" / ");
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function JobView({ choices, onChoose }: Props) {
  return (
    <section className="jobview">
      <div className="area-card">
        <h2 className="area-name">仕事 ── 汲み取り騒動</h2>
        <p className="area-desc">
          長屋の汲み取りが遅れている。親方は腰をやっちまった。
          住む場所代わりの初仕事、どう片付ける？
        </p>
      </div>

      <ul className="choice-list">
        {choices.map((c) => (
          <li key={c.id} className="choice-card">
            <h3>{c.label}</h3>
            <p>{c.description}</p>
            <p className="choice-effects">{effectsLabel(c.effects)}</p>
            <button className="primary" onClick={() => onChoose(c)}>
              これで行く
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
