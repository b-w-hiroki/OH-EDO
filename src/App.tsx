import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DialogKind,
  DialogLine,
  GameState,
  JobChoice,
  NPCId,
  AreaId,
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
  OPENING_LINES,
  RUMOR_REPLIES,
  pickDominantRumor,
} from "./data";
import { DialogBox } from "./components/DialogBox";
import { StatusBar } from "./components/StatusBar";
import { JobView } from "./components/JobView";
import { ResultView } from "./components/ResultView";
import { PhaserGame } from "./game/PhaserGame";
import { EventBus } from "./game/EventBus";

const STORAGE_KEY = "oh-edo-mvp-save-v2";

function loadInitial(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as GameState;
    // Drop transient dialog/overlay state on load.
    const screen = parsed.flags.intro_done ? "town" : "title";
    return { ...parsed, dialog: null, screen };
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
    s.flags.intro_done && !s.flags.met_landlord && s.currentArea === "nagaya"
  );
}

function startDialogInState(
  s: GameState,
  kind: DialogKind,
  lines: DialogLine[]
): GameState {
  if (lines.length === 0) return s;
  return { ...s, screen: "dialog", dialog: { kind, lines, index: 0 } };
}

function applyDialogComplete(s: GameState, kind: DialogKind): GameState {
  const closeToTown: GameState = { ...s, dialog: null, screen: "town" };

  switch (kind) {
    case "opening":
      return {
        ...closeToTown,
        flags: { ...s.flags, intro_done: true },
        currentArea: "nagaya",
        log: appendLog(s.log, s.day, "見知らぬ町、大江戸の路地に立った。"),
      };

    case "landlord_intro":
      return {
        ...closeToTown,
        flags: { ...s.flags, met_landlord: true, room_unlocked: true },
        log: appendLog(s.log, s.day, "長屋に仮の居場所ができた。"),
      };

    case "fishmonger_intro":
      return {
        ...closeToTown,
        flags: { ...s.flags, met_fishmonger: true, rumor_heard_kumitori: true },
        log: appendLog(s.log, s.day, "長屋の汲み取りが遅れているらしい。"),
      };

    case "child_intro":
      return {
        ...closeToTown,
        flags: { ...s.flags, met_child: true },
        player: { ...s.player, network: s.player.network + 1 },
        log: appendLog(s.log, s.day, "子どもに顔を覚えられた。（人脈 +1）"),
      };

    case "newsman_intro":
      return {
        ...closeToTown,
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
        screen: "town",
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
      return closeToTown;
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
    town: { ...s.town, hygiene: s.town.hygiene + delta.hygiene },
    flags: { ...s.flags, kumitori_job_done: true },
    activeRumors: Array.from(new Set([...s.activeRumors, ...choice.rumorTags])),
    log: appendLog(s.log, s.day, choice.resultText),
    lastJobResult: { choiceId: choice.id, resultText: choice.resultText, delta },
  };
}

function App() {
  const [state, setState] = useState<GameState>(loadInitial);
  const [sceneReady, setSceneReady] = useState(false);
  const dialogOpenRef = useRef(false);

  // Persist.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / privacy mode
    }
  }, [state]);

  // Auto-triggers when standing on the town with no dialog open.
  useEffect(() => {
    if (state.screen !== "town" || state.dialog) return;
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

  // ── React → Phaser bridge ───────────────────────────
  useEffect(() => {
    EventBus.emit("screen-changed", state.screen);
  }, [state.screen]);

  useEffect(() => {
    EventBus.emit("game-flags", { roomUnlocked: state.flags.room_unlocked });
  }, [state.flags.room_unlocked]);

  useEffect(() => {
    if (sceneReady && state.day >= 2) EventBus.emit("warp", "nagaya");
  }, [state.day, sceneReady]);

  // On scene ready, re-sync everything Phaser may have missed.
  useEffect(() => {
    if (!sceneReady) return;
    EventBus.emit("screen-changed", state.screen);
    EventBus.emit("game-flags", { roomUnlocked: state.flags.room_unlocked });
    EventBus.emit("warp", state.currentArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady]);

  // ── Phaser → React bridge ───────────────────────────
  useEffect(() => {
    const onNpc = (npc: NPCId) => {
      setState((s) => {
        if (s.screen !== "town") return s;
        const picked = pickNPCDialog(s, npc);
        if (!picked) return s;
        return startDialogInState(s, picked.kind, picked.lines);
      });
    };
    const onArea = (area: AreaId) => {
      setState((s) =>
        s.screen === "town" && s.currentArea !== area
          ? { ...s, currentArea: area }
          : s
      );
    };
    const onEnterRoom = () => {
      setState((s) =>
        s.screen === "town"
          ? { ...s, screen: "room", currentArea: "room" }
          : s
      );
    };
    const onSceneReady = () => setSceneReady(true);

    EventBus.on("npc-interact", onNpc);
    EventBus.on("area-entered", onArea);
    EventBus.on("enter-room", onEnterRoom);
    EventBus.on("scene-ready", onSceneReady);
    return () => {
      EventBus.off("npc-interact", onNpc);
      EventBus.off("area-entered", onArea);
      EventBus.off("enter-room", onEnterRoom);
      EventBus.off("scene-ready", onSceneReady);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────
  const startGame = useCallback(() => {
    setState((s) => startDialogInState(s, "opening", OPENING_LINES));
  }, []);

  const advanceDialog = useCallback(() => {
    setState((s) => {
      if (!s.dialog) return s;
      const next = s.dialog.index + 1;
      if (next < s.dialog.lines.length) {
        return { ...s, dialog: { ...s.dialog, index: next } };
      }
      return applyDialogComplete(s, s.dialog.kind);
    });
  }, []);

  const chooseJob = useCallback((choice: JobChoice) => {
    setState((s) => (s.screen === "job" ? applyJobChoice(s, choice) : s));
  }, []);

  const goToNight = useCallback(() => {
    setState((s) => startDialogInState(s, "night", NIGHT_LINES));
  }, []);

  const closeRoom = useCallback(() => {
    setState((s) =>
      s.screen === "room"
        ? { ...s, screen: "town", currentArea: "nagaya" }
        : s
    );
  }, []);

  const openStatus = useCallback(() => {
    setState((s) => (s.screen === "town" ? { ...s, screen: "status" } : s));
  }, []);

  const closeStatus = useCallback(() => {
    setState((s) => (s.screen === "status" ? { ...s, screen: "town" } : s));
  }, []);

  const resetGame = useCallback(() => {
    if (!window.confirm("旅をやり直しますか？セーブも消えるよ。")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  // Keyboard page-turning: Space / Enter advance an open dialog.
  useEffect(() => {
    dialogOpenRef.current = state.screen === "dialog" && state.dialog !== null;
  }, [state.screen, state.dialog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.repeat || !dialogOpenRef.current) return;
      e.preventDefault();
      advanceDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceDialog]);

  // ── Render ──────────────────────────────────────────
  const inWorld = state.flags.intro_done && state.screen !== "title";
  const inOpening = state.screen === "dialog" && !state.flags.intro_done;
  const lastLog = state.log[state.log.length - 1];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">OH！EDO！</span>
          <span className="badge">
            Day {state.day}・{timeLabel(state.time)}
          </span>
          {inWorld && (
            <span className="badge subtle">{AREAS[state.currentArea].name}</span>
          )}
        </div>
        <div className="topbar-right">
          {state.screen === "town" && (
            <button className="ghost" onClick={openStatus}>
              覚え書き
            </button>
          )}
          {state.screen !== "title" && (
            <button className="ghost" onClick={resetGame}>
              はじめから
            </button>
          )}
        </div>
      </header>

      {inWorld && <StatusBar player={state.player} town={state.town} />}

      <main className="main">
        {state.screen === "title" && (
          <TitleView onStart={startGame} hasSave={hasSave(state)} />
        )}

        {inOpening && state.dialog && (
          <section className="solo-dialog">
            <DialogBox
              line={state.dialog.lines[state.dialog.index]}
              index={state.dialog.index}
              total={state.dialog.lines.length}
              onNext={advanceDialog}
            />
          </section>
        )}

        {inWorld && (
          <div className="stage">
            <PhaserGame />

            {state.screen === "town" && (
              <p className="controls-hint">
                矢印 / WASD で移動・スペースで話しかける
              </p>
            )}

            {state.screen === "dialog" && state.dialog && (
              <div className="overlay">
                <DialogBox
                  line={state.dialog.lines[state.dialog.index]}
                  index={state.dialog.index}
                  total={state.dialog.lines.length}
                  onNext={advanceDialog}
                />
              </div>
            )}

            {state.screen === "job" && (
              <div className="overlay">
                <JobView choices={JOB_CHOICES} onChoose={chooseJob} />
              </div>
            )}

            {state.screen === "result" && state.lastJobResult && (
              <div className="overlay">
                <ResultView
                  result={state.lastJobResult}
                  player={state.player}
                  town={state.town}
                  activeRumors={state.activeRumors}
                  onNext={goToNight}
                />
              </div>
            )}

            {state.screen === "room" && (
              <div className="overlay">
                <RoomView day={state.day} onClose={closeRoom} />
              </div>
            )}

            {state.screen === "status" && (
              <div className="overlay">
                <StatusPanel state={state} onClose={closeStatus} />
              </div>
            )}
          </div>
        )}

        {inWorld && (
          <div className="logstrip">
            <span className="logstrip-label">町の声</span>
            <span className="logstrip-text">
              {lastLog ?? "まだ語ることはない。"}
            </span>
            {state.activeRumors.length > 0 && (
              <span className="logstrip-rumors">
                {state.activeRumors.map((r) => `#${r}`).join(" ")}
              </span>
            )}
          </div>
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
      <p className="title-sub">江戸ライフ成り上がり ── 歩けるプロト</p>
      <p className="title-flavor">
        流れ着いたのは、騒がしくも妙に居心地のいい大江戸の長屋。
        <br />
        町を歩き、声をかけ──町は、あんたのことを少しずつ覚えていく。
      </p>
      <div className="title-actions">
        <button className="primary" onClick={onStart}>
          {hasSave ? "続きから（保存済み）" : "はじめる"}
        </button>
      </div>
    </section>
  );
}

function RoomView({ day, onClose }: { day: number; onClose: () => void }) {
  const room = AREAS.room;
  const flavor = room.flavor[Math.min(day - 1, room.flavor.length - 1)];
  return (
    <section className="panel">
      <h2>{room.name}</h2>
      <p className="panel-desc">{room.description}</p>
      <p className="muted">― {flavor}</p>
      <p>ひと息ついた。狭くても、戻る場所があるというのは悪くない。</p>
      <div className="panel-actions">
        <button className="primary" onClick={onClose}>
          町へ出る
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
    <section className="panel">
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
          {[...state.log].slice(-8).reverse().map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ol>
      )}

      <div className="panel-actions">
        <button className="primary" onClick={onClose}>
          町へ戻る
        </button>
      </div>
    </section>
  );
}

export default App;
