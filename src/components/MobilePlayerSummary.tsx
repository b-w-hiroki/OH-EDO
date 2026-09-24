import type { Player, Town } from "../types";

interface Props {
  player: Player;
  town: Town;
}

function meter(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function MobilePlayerSummary({ player, town }: Props) {
  const skills = [
    { icon: "🪭", label: "人との縁", value: player.network },
    { icon: "🔨", label: "仕事の腕", value: player.skill },
    { icon: "🍚", label: "暮らし力", value: town.hygiene },
    { icon: "🌸", label: "江戸の粋", value: player.iki },
  ];

  return (
    <section className="mobile-player-summary" aria-label="主人公の状態">
      <div className="mobile-player-main">
        <div className="mobile-player-portrait" aria-hidden="true" />
        <div className="mobile-player-copy">
          <div className="mobile-player-name">たろう</div>
          <div className="mobile-profile-row">
            <span>信用</span>
            <div className="mobile-profile-meter"><i style={{ width: `${meter(player.trust)}%` }} /></div>
            <strong>{player.trust}</strong>
          </div>
          <div className="mobile-profile-row">
            <span>粋</span>
            <div className="mobile-profile-meter mood"><i style={{ width: `${meter(player.iki)}%` }} /></div>
            <strong>{player.iki}</strong>
          </div>
          <div className="mobile-money">所持金 <strong>{player.money.toLocaleString()} 文</strong></div>
        </div>
      </div>

      <div className="mobile-skill-grid">
        {skills.map((skill) => (
          <div className="mobile-skill-card" key={skill.label}>
            <span aria-hidden="true">{skill.icon}</span>
            <small>{skill.label}</small>
            <strong>Lv.{Math.max(1, Math.ceil(skill.value / 5))}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
