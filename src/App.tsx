import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AreaId,
  DialogKind,
  DialogLine,
  GameState,
  JobChoice,
  NPCId,
  Screen,
} from "./types";
import {
  ALREADY_MET_LINES,
  AREAS,
  CHILD_INTRO_LINES,
  FISHMONGER_INTRO_LINES,
  INITIAL_STATE,
  JOB_CHOICES,
  KUMITORI_EVENT_LINES,
  LANDLORD_INTRO_LINES,
  NEWSMAN_INTRO_LINES,
  NIGHT_LINES,
  NPCS,
  OPENING_LINES,
  RUMOR_REPLIES,
  pickDominantRumor,
} from "./data";
import { DialogBox } from "./components/DialogBox";
import { StatusBar } from "./components/StatusBar";
import { MapView } from "./components/MapView";
import { JobView } from "./components/JobView";
import { ResultView } from "./components/ResultView";

const STORAGE_KEY = "oh-edo-mvp-save-v1";

function loadInitial(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as GameState;
    // Drop transient dialog state on load.
    return { ...parsed, dialog: null };
  } catch {
    return INITIAL_STATE;
  }
}

function appendLog(log: string[], day: number, entry: string): string[] {
  return [...log, `Day${day}： ${entry}`];
}

function metOtherCount(flags: GameState["flags"]): number {
  let n = 0;
  if (flags.met_fishmonger) n++;
  if (flags.met_child) n++;
  if (flags.met_newsman) n++;
  return n;
}

function shouldTriggerKumitori(s: GameState): boolean {
  return (
    s.day === 1 &&
    s.flags.met_landlord &&
    !s.flags.kumitori_event_started &&
    s.currentArea === "nagaya" &&
    (s.flags.rumor_heard_kumitori || metOtherCount(s.flags) >= 2)
  );
}

function shouldTriggerLandlordIntro(s: GameState): boolean {
  return (
    s.flags.intro_done &&
    !s.flags.met_landlord &&
    s.currentArea === "nagaya"
  );
}

function startDialogInState(
  s: GameState,
  kind: DialogKind,
  lines: DialogLine[],
  fallbackReturn: Screen = "map"
): GameState {
  if (lines.length === 0) return s;
  const returnTo = s.screen === "dialog" ? fallbackReturn : s.screen;
  return {
    ...s,
    screen: "dialog",
    dialog: { kind, lines, index: 0, returnTo },
  };
}

function applyDialogComplete(s: GameState, kind: DialogKind): GameState {
  const closeToMap: GameState = { ...s, dialog: null, screen: "map" };

  switch (kind) {
    case "opening":
      return {
        ...closeToMap,
        flags: { ...s.flags, intro_done: true },
        currentArea: "nagaya",
        log: appendLog(s.log, s.day, "見知らぬ町、大江戸の路地に立った。"),
      };

    case "landlord_intro":
      return {
        ...closeToMap,
        flags: { ...s.flags, met_landlord: true, room_unlocked: true },
        log: appendLog(s.log, s.day, "長屋に仮の居場所ができた。"),
      };

    case "fishmonger_intro":
      return {
        ...closeToMap,
        flags: {
          ...s.flags,
          met_fishmonger: true,
          rumor_heard_kumitori: true,
        },
        log: appendLog(s.log, s.day, "長屋の汲み取りが遅れているらしい。"),
      };

    case "child_intro":
      return {
        ...closeToMap,
        flags: { ...s.flags, met_child: true },
        player: { ...s.player, network: s.player.network + 1 },
        log: appendLog(s.log, s.day, "子どもに顔を覚えられた。（人脈 +1）"),
      };

    case "newsman_intro":
      return {
        ...closeToMap,
        flags: { ...s.flags, met_newsman: true },
        player: { ...s.player, iki: s.player.iki + 1 },
        log: appendLog(s.log, s.day, "瓦版屋に売り出されかけた。（粋 +1）"),
      };

    case "kumitori_event":
      return {
        ...s,
        dialog: null,
        screen: "job",
        flags: { ...s.flags, kumitori_event_started: true },
        log: appendLog(s.log, s.day, "汲み取りの初仕事が舞い込んだ。"),
      };

    case "night":
      return {
        ...s,
        dialog: null,
        screen: "map",
        flags: { ...s.flags, day1_ended: true, day2_started: true },
        day: 2,
        time: "morning",
        currentArea: "nagaya",
        log: appendLog(s.log, 2, "夜が明けて、二日目の朝が来た。"),
      };

    case "rumor_landlord":
    case "rumor_fishmonger":
    case "rumor_child":
    case "rumor_newsman":
    case "already_met":
      return closeToMap;
  }
}

interface NPCDialogPick {
  kind: DialogKind;
  lines: DialogLine[];
}

function pickNPCDialog(s: GameState, npc: NPCId): NPCDialogPick | null {
  if (npc === "kumitori_master") return null;

  // Day 2+: rumor reply takes priority when a matching tag exists.
  if (s.day >= 2) {
    const tag = pickDominantRumor(s.activeRumors);
    if (tag) {
      const replies = RUMOR_REPLIES[npc][tag];
      if (replies && replies.length > 0) {
        return { kind: `rumor_${npc}` as DialogKind, lines: replies };
      }
    }
  }

  switch (npc) {
    case "landlord":
      if (!s.flags.met_landlord) {
        return { kind: "landlord_intro", lines: LANDLORD_INTRO_LINES };
      }
      if (shouldTriggerKumitori(s)) {
        return { kind: "kumitori_event", lines: KUMITORI_EVENT_LINES };
      }
      return { kind: "already_met", lines: ALREADY_MET_LINES.landlord };

    case "fishmonger":
      if (!s.flags.met_fishmonger) {
        return { kind: "fishmonger_intro", lines: FISHMONGER_INTRO_LINES };
      }
      return { kind: "already_met", lines: ALREADY_MET_LINES.fishmonger };

    case "child":
      if (!s.flags.met_child) {
        return { kind: "child_intro", lines: CHILD_INTRO_LINES };
      }
      return { kind: "already_met", lines: ALREADY_MET_LINES.child };

    case "newsman":
      if (!s.flags.met_newsman) {
        return { kind: "newsman_intro", lines: NEWSMAN_INTRO_LINES };
      }
      return { kind: "already_met", lines: ALREADY_MET_LINES.newsman };
  }
}

function applyJobChoice(s: GameState, choice: JobChoice): GameState {
  const e = choice.effects;
  const delta = {
    money: e.money ?? 0,
    trust: e.trust ?? 0,
    iki: e.iki ?? 0,
    network: e.network ?? 0,
    skill: e.skill ?? 0,
    hygiene: e.hygiene ?? 0,
  };
  return {
    ...s,
    screen: "result",
    player: {
      ...s.player,
      money: s.player.money + delta.money,
      trust: s.player.trust + delta.trust,
      iki: s.player.iki + delta.iki,
      network: s.player.network + delta.network,
      skill: s.player.skill + delta.skill,
    },
    town: {
      ...s.town,
      hygiene: s.town.hygiene + delta.hygiene,
    },
    flags: { ...s.flags, kumitori_job_done: true },
    activeRumors: Array.from(new Set([...s.activeRumors, ...choice.rumorTags])),
    log: appendLog(s.log, s.day, choice.resultText),
    lastJobResult: {
      choiceId: choice.id,
      resultText: choice.resultText,
      delta,
    },
  };
}

function App() {
  const [state, setState] = useState<GameState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / privacy mode
    }
  }, [state]);

  // Auto-triggers when we are on the map screen without an active dialog.
  useEffect(() => {
    if (state.screen !== "map" || state.dialog) return;
    if (shouldTriggerLandlordIntro(state)) {
      setState((s) =>
        startDialogInState(s, "landlord_intro", LANDLORD_INTRO_LINES)
      );
      return;
    }
    if (shouldTriggerKumitori(state)) {
      setState((s) =>
        startDialogInState(s, "kumitori_event", KUMITORI_EVENT_LINES)
      );
    }
  }, [state]);

  const startGame = useCallback(() => {
    setState((s) => startDialogInState(s, "opening", OPENING_LINES, "title"));
  }, []);

  const advanceDialog = useCallback(() => {
    setState((s) => {
      if (!s.dialog) return s;
      const nextIndex = s.dialog.index + 1;
      if (nextIndex < s.dialog.lines.length) {
        return { ...s, dialog: { ...s.dialog, index: nextIndex } };
      }
      return applyDialogComplete(s, s.dialog.kind);
    });
  }, []);

  const moveTo = useCallback((area: AreaId) => {
    setState((s) => {
      if (s.screen !== "map") return s;
      if (area === "room" && !s.flags.room_unlocked) return s;
      return { ...s, currentArea: area };
    });
  }, []);

  const talkTo = useCallback((npc: NPCId) => {
    setState((s) => {
      if (s.screen !== "map") return s;
      const picked = pickNPCDialog(s, npc);
      if (!picked) return s;
      return startDialogInState(s, picked.kind, picked.lines);
    });
  }, []);

  const chooseJob = useCallback((choice: JobChoice) => {
    setState((s) => {
      if (s.screen !== "job") return s;
      return applyJobChoice(s, choice);
    });
  }, []);

  const goToNight = useCallback(() => {
    setState((s) => startDialogInState(s, "night", NIGHT_LINES, "result"));
  }, []);

  const openStatus = useCallback(() => {
    setState((s) => (s.screen === "map" ? { ...s, screen: "status" } : s));
  }, []);

  const closeStatus = useCallback(() => {
    setState((s) => (s.screen === "status" ? { ...s, screen: "map" } : s));
  }, []);

  const resetGame = useCallback(() => {
    if (!window.confirm("旅をやり直しますか？セーブも消えるよ。")) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
  }, []);

  const currentArea = useMemo(
    () => AREAS[state.currentArea],
    [state.currentArea]
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">OH！EDO！</span>
          <span className="badge">
            Day {state.day}・{timeLabel(state.time)}
          </span>
          {state.screen !== "title" && (
            <span className="badge subtle">{currentArea.name}</span>
          )}
        </div>
        <div className="topbar-right">
          {state.screen === "map" && (
            <button className="ghost" onClick={openStatus}>
              ステータス
            </button>
          )}
          {state.screen !== "title" && (
            <button className="ghost" onClick={resetGame}>
              はじめから
            </button>
          )}
        </div>
      </header>

      {state.screen !== "title" && state.screen !== "dialog" && (
        <StatusBar player={state.player} town={state.town} />
      )}

      <main className="main">
        {state.screen === "title" && (
          <TitleView onStart={startGame} hasSave={hasSave(state)} />
        )}

        {state.screen === "dialog" && state.dialog && (
          <DialogBox
            line={state.dialog.lines[state.dialog.index]}
            index={state.dialog.index}
            total={state.dialog.lines.length}
            onNext={advanceDialog}
          />
        )}

        {state.screen === "map" && (
          <MapView
            state={state}
            area={currentArea}
            onMove={moveTo}
            onTalk={talkTo}
            npcLookup={NPCS}
          />
        )}

        {state.screen === "job" && (
          <JobView choices={JOB_CHOICES} onChoose={chooseJob} />
        )}

        {state.screen === "result" && state.lastJobResult && (
          <ResultView
            result={state.lastJobResult}
            player={state.player}
            town={state.town}
            activeRumors={state.activeRumors}
            onNext={goToNight}
          />
        )}

        {state.screen === "status" && (
          <StatusPanel
            state={state}
            onClose={closeStatus}
          />
        )}
      </main>
    </div>
  );
}

function timeLabel(t: GameState["time"]): string {
  switch (t) {
    case "morning":
      return "朝";
    case "noon":
      return "昼";
    case "evening":
      return "夕";
    case "night":
      return "夜";
  }
}

function hasSave(s: GameState): boolean {
  return s.day !== 1 || s.flags.intro_done;
}

function TitleView({
  onStart,
  hasSave,
}: {
  onStart: () => void;
  hasSave: boolean;
}) {
  return (
    <section className="title">
      <h1 className="title-main">OH！EDO！</h1>
      <p className="title-sub">江戸ライフ成り上がり ── MVP プロトタイプ</p>
      <p className="title-flavor">
        流れ着いたのは、騒がしくも妙に居心地のいい大江戸の長屋。<br />
        町は、あんたのことを少しずつ覚えていく。
      </p>
      <div className="title-actions">
        <button className="primary" onClick={onStart}>
          {hasSave ? "続きから（保存済み）" : "はじめる"}
        </button>
      </div>
    </section>
  );
}

function StatusPanel({
  state,
  onClose,
}: {
  state: GameState;
  onClose: () => void;
}) {
  return (
    <section className="status-panel">
      <h2>覚え書き</h2>
      <div className="status-grid">
        <div>
          <h3>身の上</h3>
          <ul>
            <li>位：{state.player.rankName}（Rank {state.player.rank}）</li>
            <li>銭：{state.player.money}</li>
            <li>信用：{state.player.trust}</li>
            <li>粋：{state.player.iki}</li>
            <li>人脈：{state.player.network}</li>
            <li>腕前：{state.player.skill}</li>
          </ul>
        </div>
        <div>
          <h3>町の様子</h3>
          <ul>
            <li>衛生：{state.town.hygiene}</li>
            <li>治安：{state.town.safety}</li>
            <li>流行：{state.town.trend}</li>
            <li>景気：{state.town.economy}</li>
          </ul>
        </div>
        <div>
          <h3>身についた噂</h3>
          {state.activeRumors.length === 0 ? (
            <p className="muted">まだ何の噂にもなっていない。</p>
          ) : (
            <ul>
              {state.activeRumors.map((r) => (
                <li key={r}>#{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3>これまでの覚え書き</h3>
      {state.log.length === 0 ? (
        <p className="muted">まだ何も書き残せていない。</p>
      ) : (
        <ol className="log">
          {state.log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ol>
      )}

      <div className="status-actions">
        <button className="primary" onClick={onClose}>
          町へ戻る
        </button>
      </div>
    </section>
  );
}

export default App;
