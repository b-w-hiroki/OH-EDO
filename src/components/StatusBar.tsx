import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

export function StatusBar({ player, town }: Props) {
  return (
    <div className="statusbar">
      <div className="statusbar-group">
        <span className="stat">
          <span className="stat-key">位</span>
          <span className="stat-val">{player.rankName}</span>
        </span>
        <span className="stat">
          <span className="stat-key">銭</span>
          <span className="stat-val">{player.money}</span>
        </span>
        <span className="stat">
          <span className="stat-key">信用</span>
          <span className="stat-val">{player.trust}</span>
        </span>
        <span className="stat">
          <span className="stat-key">粋</span>
          <span className="stat-val">{player.iki}</span>
        </span>
        <span className="stat">
          <span className="stat-key">人脈</span>
          <span className="stat-val">{player.network}</span>
        </span>
        <span className="stat">
          <span className="stat-key">腕前</span>
          <span className="stat-val">{player.skill}</span>
        </span>
      </div>
      <div className="statusbar-group town">
        <span className="stat">
          <span className="stat-key">衛生</span>
          <span className="stat-val">{town.hygiene}</span>
        </span>
        <span className="stat subtle">
          <span className="stat-key">治安</span>
          <span className="stat-val">{town.safety}</span>
        </span>
        <span className="stat subtle">
          <span className="stat-key">流行</span>
          <span className="stat-val">{town.trend}</span>
        </span>
        <span className="stat subtle">
          <span className="stat-key">景気</span>
          <span className="stat-val">{town.economy}</span>
        </span>
      </div>
    </div>
  );
}
