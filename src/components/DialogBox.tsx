import type { DialogLine, NPCId } from "../types";
import { characterArtPath, characterPortraitPath } from "../characterArt";

interface Props {
  line: DialogLine;
  index: number;
  total: number;
  onNext: () => void;
}

function speakerClass(speaker: string): string {
  if (speaker.includes("魚")) return "speaker-fishmonger";
  if (speaker.includes("大家")) return "speaker-landlord";
  if (speaker.includes("子ども")) return "speaker-child";
  if (speaker.includes("瓦版")) return "speaker-newsman";
  if (speaker.includes("火消し")) return "speaker-firechief";
  if (speaker.includes("主人公")) return "speaker-player";
  return "speaker-generic";
}

function displaySpeaker(speaker: string): string {
  if (speaker.includes("大家")) return "おかみさん";
  if (speaker === "魚屋") return "熊さん";
  if (speaker.includes("長屋の子ども")) return "源太";
  return speaker;
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

function speakerArt(speakerType: string): string | null {
  const npcBySpeaker: Partial<Record<string, NPCId>> = {
    "speaker-fishmonger": "fishmonger",
    "speaker-landlord": "landlord",
    "speaker-child": "child",
    "speaker-newsman": "newsman",
    "speaker-firechief": "firechief",
  };
  const npc = npcBySpeaker[speakerType];
  if (npc) return characterPortraitPath(npc);
  if (speakerType === "speaker-player") return characterArtPath("player");
  return null;
}

export function DialogBox({ line, index, total, onNext }: Props) {
  const isLast = index === total - 1;
  const speaker = speakerClass(line.speaker);
  const portrait = speakerArt(speaker);
  return (
    <section className={`dialog mock-dialog ${speaker}`} onClick={onNext}>
      <div className={`dialog-cutin ${speaker}`} aria-hidden="true" />
      <div className={`dialog-portrait ${speaker}`} aria-hidden="true">
        {portrait ? (
          <img src={portrait} alt="" draggable={false} />
        ) : (
          <span>{speakerGlyph(line.speaker)}</span>
        )}
      </div>
      <div className="dialog-body">
        <div className="dialog-speaker">{displaySpeaker(line.speaker)}</div>
        <p className="dialog-text" data-dialog-scroll tabIndex={0} aria-label="会話本文" onClick={(event) => event.stopPropagation()}>{line.text}</p>
        <div className="dialog-foot">
          <span className="dialog-progress">
            {index + 1} / {total}
          </span>
          <button className="dialog-next-cue" type="button" onClick={(event) => { event.stopPropagation(); onNext(); }}>
            {isLast ? "とじる" : "次へ"}
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
