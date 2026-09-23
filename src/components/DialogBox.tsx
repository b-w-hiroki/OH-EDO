import type { DialogLine } from "../types";

interface Props {
  line: DialogLine;
  index: number;
  total: number;
  onNext: () => void;
}

function speakerGlyph(speaker: string): string {
  if (speaker.includes("魚")) return "魚";
  if (speaker.includes("大家")) return "家";
  if (speaker.includes("子ども")) return "子";
  if (speaker.includes("瓦版")) return "瓦";
  if (speaker.includes("火消し")) return "火";
  if (speaker.includes("主人公")) return "旅";
  return speaker.slice(0, 1);
}

export function DialogBox({ line, index, total, onNext }: Props) {
  const isLast = index === total - 1;
  return (
    <section className="dialog mock-dialog" onClick={onNext}>
      <div className="dialog-portrait" aria-hidden="true">
        {speakerGlyph(line.speaker)}
      </div>
      <div className="dialog-body">
        <div className="dialog-speaker">{line.speaker}</div>
        <p className="dialog-text">{line.text}</p>
        <div className="dialog-foot">
          <span className="dialog-progress">
            {index + 1} / {total}
          </span>
          <span className="dialog-next-cue">
            {isLast ? "とじる" : "次へ"}
            <span aria-hidden="true">›</span>
          </span>
        </div>
      </div>
    </section>
  );
}
