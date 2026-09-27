export function ChoiceImpact({ effects }: { effects: Record<string, number | undefined> }) {
  const labels: Record<string, string> = {
    money: "銭",
    trust: "信用",
    iki: "粋",
    network: "人脈",
    skill: "腕前",
    hygiene: "衛生",
    safety: "治安",
    trend: "流行",
    economy: "景気",
  };
  const chips = Object.entries(effects)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${Number(value) > 0 ? "+" : ""}${value}`);

  if (chips.length === 0) return null;
  return (
    <span className="choice-impact" aria-label={`変化：${chips.join("、")}`}>
      {chips.map((chip) => <small key={chip}>{chip}</small>)}
    </span>
  );
}
