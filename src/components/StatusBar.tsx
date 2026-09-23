import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

const PLAYER_STATS = [
  ["位", "位"],
  ["銭", "銭"],
  ["信用", "信"],
  ["粋", "粋"],
  ["人脈", "縁"],
  ["腕前", "腕"],
] as const;

export function StatusBar({ player, town }: Props) {
  const values = [
    player.rankName,
    player.money,
    player.trust,
    player.iki,
    player.network,
    player.skill,
  ];

  return (
    <div className="statusbar mock-statusbar">
      <div className="statusbar-group player-stats">
        {PLAYER_STATS.map(([label, icon], i) => (
          <span className="stat stat-card" key={label}>
            <span className="stat-icon" aria-hidden="true">{icon}</span>
            <span className="stat-copy">
              <span className="stat-key">{label}</span>
              <span className="stat-val">{values[i]}</span>
            </span>
          </span>
        ))}
      </div>
      <div className="statusbar-group town">
        <span className="stat subtle compact-town">
          <span className="stat-key">町</span>
          <span className="stat-val">
            衛{town.hygiene}・治{town.safety}・流{town.trend}・景{town.economy}
          </span>
        </span>
      </div>
    </div>
  );
}
