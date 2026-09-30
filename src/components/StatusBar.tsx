import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

type StatKey = "money" | "trust" | "iki" | "network" | "skill" | "hygiene";

const STATS: Array<{ label: string; key: StatKey }> = [
  { label: "銭", key: "money" },
  { label: "信用", key: "trust" },
  { label: "粋", key: "iki" },
  { label: "人脈", key: "network" },
  { label: "腕前", key: "skill" },
  { label: "衛生", key: "hygiene" },
];

function ResourceIcon({ kind }: { kind: StatKey }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 22 22",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  switch (kind) {
    case "money":
      return <svg {...common}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><rect x="8.3" y="8.3" width="5.4" height="5.4" rx=".6" stroke="currentColor" strokeWidth="1.5"/></svg>;
    case "trust":
      return <svg {...common}><path d="M11 18s-6-3.8-6-8.1C5 7.2 6.8 5.5 9 5.5c1.2 0 2.1.5 2.9 1.5.7-1 1.7-1.5 2.9-1.5 2.2 0 4 1.7 4 4.4 0 4.3-6 8.1-6 8.1H11z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;
    case "iki":
      return <svg {...common}><path d="M6 16c4-1 7-4 9-9 1 4 0 8-3 10-2 1-4 1-6-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 14l6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case "network":
      return <svg {...common}><circle cx="6" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.6"/><circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.6"/><circle cx="11" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.6"/><path d="M7.8 8.3l2 5.3m4.4-5.3-2 5.3M8.2 7h5.6" stroke="currentColor" strokeWidth="1.5"/></svg>;
    case "skill":
      return <svg {...common}><path d="M6 17l5-10 5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 12h5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
    case "hygiene":
      return <svg {...common}><path d="M11 4c3 4 5 6.4 5 9a5 5 0 1 1-10 0c0-2.6 2-5 5-9z" stroke="currentColor" strokeWidth="1.7"/><path d="M9 14c.5 1 1.3 1.5 2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  }
}

export function StatusBar({ player, town }: Props) {
  const values: Record<StatKey, string | number> = {
    money: player.money,
    trust: player.trust,
    iki: player.iki,
    network: player.network,
    skill: player.skill,
    hygiene: town.hygiene,
  };

  return (
    <div className="statusbar reference-statusbar">
      <span className="rank-chip" title="現在の立ち位置">
        {player.rankName}
      </span>
      <div className="reference-stat-row">
        {STATS.map((stat) => (
          <span className="reference-stat" key={stat.key}>
            <span className={`reference-stat-icon stat-icon-${stat.key}`} aria-hidden="true">
              <ResourceIcon kind={stat.key} />
            </span>
            <span className="reference-stat-copy">
              <span className="reference-stat-key">{stat.label}</span>
              <strong>{values[stat.key]}</strong>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
