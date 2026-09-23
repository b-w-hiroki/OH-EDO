import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

const STATS = [
  { label: "銭", icon: "💰", key: "money" },
  { label: "信用", icon: "🪭", key: "trust" },
  { label: "粋", icon: "✥", key: "iki" },
  { label: "人脈", icon: "👥", key: "network" },
  { label: "腕前", icon: "⚔", key: "skill" },
  { label: "衛生", icon: "🧹", key: "hygiene" },
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
            <span className="reference-stat-icon" aria-hidden="true">{stat.icon}</span>
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
