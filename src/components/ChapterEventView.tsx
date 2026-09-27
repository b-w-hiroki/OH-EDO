import type { ChapterEventChoice, ChapterEventResult } from "../types";
import type { TownEventDefinition } from "../events/chapterTwo";

function impactChips(effects: ChapterEventChoice["effects"]): string[] {
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
  return Object.entries(effects)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${Number(value) > 0 ? "+" : ""}${value}`);
}

export function ChapterEventChoiceView({
  event,
  onChoose,
}: {
  event: TownEventDefinition;
  onChoose: (choice: ChapterEventChoice) => void;
}) {
  return (
    <section className="panel chapter-event-panel">
      <p className="panel-kicker">Day {event.day}</p>
      <h2>{event.title}</h2>
      <p className="panel-desc">{event.prompt}</p>
      <div className="fire-choice-list">
        {event.choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            <span className="choice-impact" aria-label={`変化：${impactChips(choice.effects).join("、")}`}>
              {impactChips(choice.effects).map((chip) => <small key={chip}>{chip}</small>)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ChapterEventResultView({
  event,
  result,
  onNext,
}: {
  event: TownEventDefinition;
  result: ChapterEventResult;
  onNext: () => void;
}) {
  const final = event.day >= 10;
  return (
    <section className="panel chapter-event-result">
      <p className="panel-kicker">Day {event.day}</p>
      <h2>{event.title}、そのあと</h2>
      <p>{result.resultText}</p>
      <div className="chapter-town-response">
        <strong>町の反応</strong>
        <p>{result.townResponse}</p>
      </div>
      <p className="muted">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>
          {final ? "町へ戻る" : `${event.day + 1}日目へ`}
        </button>
      </div>
    </section>
  );
}
