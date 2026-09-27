import type { TownEventDef, TownEventResult } from "../types";
import { ChoiceImpact } from "./ChoiceImpact";

export function TownEventChoiceView({
  event,
  onChoose,
}: {
  event: TownEventDef;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <section className="panel town-event-panel">
      <h2>{event.title}</h2>
      <div className="town-event-intro">
        {event.intro.map((line, index) => (
          <p key={`${line.speaker}-${index}`}>
            <strong>{line.speaker}</strong>
            <span>{line.text}</span>
          </p>
        ))}
      </div>
      <p className="panel-desc">町の顔として、今日はどこから手をつける？</p>
      <div className="fire-choice-list">
        {event.choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice.id)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            <ChoiceImpact effects={choice.effects} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function TownEventResultView({
  result,
  onNext,
}: {
  result: TownEventResult;
  onNext: () => void;
}) {
  return (
    <section className="panel town-event-result">
      <h2>今日の仕事、そのあと</h2>
      <p>{result.resultText}</p>
      <p className="festival-town-response">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>町へ戻る</button>
      </div>
    </section>
  );
}
