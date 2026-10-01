import type { AreaId, GameState } from "../types";

function AreaNavIcon({ kind }: { kind: AreaId | "map" }) {
  const common = {
    width: 42,
    height: 42,
    viewBox: "0 0 42 42",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  if (kind === "nagaya") {
    return (
      <svg {...common}>
        <path d="M7 18L21 8l14 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 18h22v17H10z" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M17 35V23h8v12" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 15h26" stroke="currentColor" strokeWidth="1.5" opacity=".55"/>
      </svg>
    );
  }
  if (kind === "well") {
    return (
      <svg {...common}>
        <path d="M9 17h24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M12 17v17m18-17v17" stroke="currentColor" strokeWidth="2"/>
        <ellipse cx="21" cy="29" rx="10" ry="5" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M15 13h12l3 4H12l3-4z" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 17v8" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    );
  }
  if (kind === "market") {
    return (
      <svg {...common}>
        <path d="M7 17h28l-3-7H10l-3 7z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M9 17v18h24V17" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M14 21h14" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M13 27h16v8H13z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    );
  }
  if (kind === "firehouse") {
    return (
      <svg {...common}>
        <path d="M8 35h26" stroke="currentColor" strokeWidth="2"/>
        <path d="M11 35V18h20v17" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M8 18L21 9l13 9" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M21 18v17" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M18 14c1-3 4-4 5-7 2 3 4 5 2 8-1 2-5 2-7-1z" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    );
  }
  if (kind === "room") {
    return (
      <svg {...common}>
        <rect x="10" y="7" width="22" height="28" rx="1" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M21 7v28M10 18h22" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M14 12h5v4h-5zm9 0h5v4h-5z" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="24.5" cy="26" r="1.2" fill="currentColor"/>
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 10l9-3 10 4 9-3v24l-9 3-10-4-9 3V10z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M16 7v24m10-20v24" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M11 16l3 2m14 7l3 2" stroke="currentColor" strokeWidth="1.5" opacity=".6"/>
    </svg>
  );
}

export function AreaNav({
  state,
  onMove,
  onRoom,
  onMap,
}: {
  state: GameState;
  onMove: (area: AreaId) => void;
  onRoom: () => void;
  onMap: () => void;
}) {
  const items: Array<{
    id: AreaId | "map";
    label: string;
    icon: AreaId | "map";
    description: string;
    locked?: boolean;
  }> = [
    { id: "nagaya", label: "長屋前", icon: "nagaya", description: "住人たちと交流する" },
    { id: "well", label: "井戸端", icon: "well", description: "町の人と話をする" },
    { id: "market", label: "商店通り", icon: "market", description: "買い物・仕事・情報収集" },
    {
      id: "firehouse",
      label: "火消し小屋",
      icon: "firehouse",
      description: "火消しと話す",
      locked: !state.flags.firehouse_unlocked,
    },
    {
      id: "room",
      label: "部屋",
      icon: "room",
      description: "休む・持ち物の整理",
      locked: !state.flags.room_unlocked,
    },
    { id: "map", label: "江戸の地図", icon: "map", description: "町全体を見る" },
  ];

  return (
    <nav className="area-nav reference-area-nav" aria-label="町の移動">
      {items.map((item) => {
        const active = item.id !== "map" && state.currentArea === item.id;
        return (
          <button
            key={item.id}
            className={active ? "active" : item.id === "map" ? "map-tab" : ""}
            disabled={item.locked}
            onClick={() => {
              if (item.id === "map") onMap();
              else if (item.id === "room") onRoom();
              else onMove(item.id);
            }}
          >
            <span className={`area-nav-icon approved-nav-icon nav-icon-${item.icon}`}><AreaNavIcon kind={item.icon} /></span>
            <span className="area-nav-copy">
              <strong>{item.label}</strong>
              <small>{item.locked ? "まだ行けない" : item.description}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
