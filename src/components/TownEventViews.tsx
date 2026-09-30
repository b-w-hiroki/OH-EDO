import { useState } from "react";
import type { TownEventDef, TownEventResult } from "../types";
import { ChoiceImpact } from "./ChoiceImpact";
import { townEventRelationSummary } from "../town/townEventRelations";

export function TownEventChoiceView({
  event,
  onChoose,
}: {
  event: TownEventDef;
  onChoose: (choiceId: string) => void;
}) {
  const [showIntro, setShowIntro] = useState(false);
  return (
    <section className="panel town-event-panel">
      <header className="town-event-heading">
        <span className="town-event-day-seal">{event.day}日目</span>
        <div>
          <small>大江戸町・今日の相談</small>
          <h2>{event.title}</h2>
        </div>
      </header>
      <button
        type="button"
        className="town-event-intro-toggle"
        aria-expanded={showIntro}
        onClick={() => setShowIntro((current) => !current)}
      >
        <span>関係者の声</span>
        <small>{event.intro.length}人</small>
        <b aria-hidden="true">{showIntro ? "−" : "＋"}</b>
      </button>
      <div className={`town-event-intro ${showIntro ? "is-open" : ""}`}>
        {event.intro.map((line, index) => (
          <p key={`${line.speaker}-${index}`}>
            <strong>{line.speaker}</strong>
            <span>{line.text}</span>
          </p>
        ))}
      </div>
      <p className="panel-desc">町の顔として、今日はどこから手をつける？</p>
      <div className="fire-choice-list">
        {event.choices.map((choice, index) => {
          const relationSummary = townEventRelationSummary(choice.id);
          return (
            <button className="fire-choice town-event-choice" key={choice.id} onClick={() => onChoose(choice.id)}>
              <span className="town-event-choice-mark" aria-hidden="true">{["壱", "弐", "参"][index] ?? index + 1}</span>
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
              <ChoiceImpact effects={choice.effects} />
              {relationSummary && (
                <small className="choice-relations">人間関係：{relationSummary}</small>
              )}
            </button>
          );
        })}
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
      <header className="town-event-heading result-heading">
        <span className="town-event-day-seal result-seal">済</span>
        <div>
          <small>町に残ったもの</small>
          <h2>今日の仕事、そのあと</h2>
        </div>
      </header>
      <p>{result.resultText}</p>
      <p className="festival-town-response">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>町へ戻る</button>
      </div>
    </section>
  );
}
