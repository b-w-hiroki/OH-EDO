import type { DialogLine } from "../types";

interface Props {
  line: DialogLine;
  index: number;
  total: number;
  onNext: () => void;
}

export function DialogBox({ line, index, total, onNext }: Props) {
  const isLast = index === total - 1;
  return (
    <section className="dialog">
      <div className="dialog-speaker">{line.speaker}</div>
      <p className="dialog-text">{line.text}</p>
      <div className="dialog-foot">
        <span className="dialog-progress">
          {index + 1} / {total}
        </span>
        <button className="primary" onClick={onNext}>
          {isLast ? "ここまで" : "次へ"}
        </button>
      </div>
    </section>
  );
}
