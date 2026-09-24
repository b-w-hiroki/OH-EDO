import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

const STATS = [
  { label: "銭", icon: "銭", key: "money" },
  { label: "信用", icon: "信", key: "trust" },
  { label: "粋", icon: "粋", key: "iki" },
  { label: "人脈", icon: "縁", key: "network" },
  { label: "腕前", icon: "腕", key: "skill" },
  { label: "衛生", icon: "衛", key: "hygiene" },
] as const;

export function StatusBar({ player, town }: Props) {
  const values: Record<(typeof STATS)[number]["key"], string | number> = {
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
              {stat.icon}
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
