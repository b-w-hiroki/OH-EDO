import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DialogKind,
  DialogLine,
  GameState,
  JobChoice,
  FireChoice,
  PatrolChoice,
  FestivalChoice,
  NPCId,
  AreaId,
} from "./types";
import {
  ALREADY_MET_LINES,
  AREAS,
  CHILD_INTRO_LINES,
  FISHMONGER_INTRO_LINES,
  FIRE_CHOICES,
  FIRE_INTRO_LINES,
  FIRECHIEF_INTRO_LINES,
  PATROL_CHOICES,
  PATROL_INTRO_LINES,
  FESTIVAL_CHOICES,
  FESTIVAL_INTRO_LINES,
  NPC_EPISODES,
  REPUTATION_LINES,
  RANKS,
  INITIAL_STATE,
  JOB_CHOICES,
  KUMITORI_EVENT_LINES,
  LANDLORD_INTRO_LINES,
  NEWSMAN_INTRO_LINES,
  NPCS,
  NIGHT_LINES,
  OPENING_LINES,
  RUMOR_REPLIES,
  FIRE_RUMOR_REPLIES,
  getFireAreaEcho,
  getRumorAreaEcho,
  pickDominantRumor,
} from "./data";
import { DialogBox } from "./components/DialogBox";
import { StatusBar } from "./components/StatusBar";
import { JobView } from "./components/JobView";
import { ResultView } from "./components/ResultView";
import { PhaserGame } from "./game/PhaserGame";
import { EventBus } from "./game/EventBus";
import { uiSound } from "./game/uiSound";
import { buildDayDecisionContext } from "./decision/DecisionContextBuilder";
import {
  createDecisionService,
  makeDecisionLog,
} from "./decision/DecisionService";

const decisionService = createDecisionService();

const STORAGE_KEY = "oh-edo-mvp-save-v2";

function loadInitial(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const merged: GameState = {
      ...INITIAL_STATE,
      ...parsed,
      player: { ...INITIAL_STATE.player, ...(parsed.player ?? {}) },
      town: { ...INITIAL_STATE.town, ...(parsed.town ?? {}) },
      flags: { ...INITIAL_STATE.flags, ...(parsed.flags ?? {}) },
      npcRelations: Object.fromEntries(
        Object.entries(INITIAL_STATE.npcRelations).map(([npcId, initial]) => [
          npcId,
          {
            ...initial,
            ...(parsed.npcRelations?.[npcId as NPCId] ?? {}),
          },
        ])
      ) as GameState["npcRelations"],
      activeRumors: parsed.activeRumors ?? [],
      rumorHistory: parsed.rumorHistory ?? [],
      reputationTags: parsed.reputationTags ?? [],
      log: parsed.log ?? [],
      playerActions: parsed.playerActions ?? [],
      decisionLogs: parsed.decisionLogs ?? [],
      lastDecision: parsed.lastDecision ?? null,
      fireAftermath: parsed.fireAftermath ?? null,
      dialog: null,
      lastJobResult: parsed.lastJobResult ?? null,
      lastPatrolResult: parsed.lastPatrolResult ?? null,
      lastFestivalResult: parsed.lastFestivalResult ?? null,
    };
    // Drop transient dialog/overlay state on load.
    const screen = merged.flags.intro_done ? "town" : "title";
    return { ...merged, dialog: null, screen };
  } catch {
    return INITIAL_STATE;
  }
}

function appendLog(log: string[], day: number, entry: string): string[] {
  return [...log, `Day${day}： ${entry}`];
}

function withProgression(s: GameState): GameState {
  const score =
    s.player.trust + s.player.network + s.player.skill + Math.max(0, s.player.iki);
  const current =
    [...RANKS].reverse().find((r) => score >= r.score) ?? RANKS[0];

  const counts = s.rumorHistory.reduce<Record<string, number>>((acc, rumor) => {
    acc[rumor.tag] = (acc[rumor.tag] ?? 0) + 1;
    return acc;
  }, {});
  const reputationTags = [...s.reputationTags];
  const add = (tag: GameState["reputationTags"][number]) => {
    if (!reputationTags.includes(tag)) reputationTags.push(tag);
  };
  if ((counts.helpful ?? 0) >= 2) add("頼れるやつ");
  if ((counts.iki ?? 0) >= 2) add("粋なやつ");
  if ((counts.quick ?? 0) >= 2) add("仕事が早いやつ");
  if ((counts.clean ?? 0) >= 2) add("丁寧なやつ");
  if ((counts.funny ?? 0) >= 2) add("変なやつ");

  const liveRumors =
    s.rumorHistory.length === 0
      ? s.activeRumors
      : Array.from(
          new Set(
            s.rumorHistory
              .filter((r) => s.day - r.createdDay < r.durationDays)
              .map((r) => r.tag)
          )
        );

  return {
    ...s,
    player: { ...s.player, rank: current.rank, rankName: current.name },
    activeRumors: liveRumors,
    reputationTags,
  };
}

function makeRumorRecords(
  tags: GameState["activeRumors"],
  day: number,
  source: string,
  strength = 2
): GameState["rumorHistory"] {
  return tags.map((tag, index) => ({
    id: `rumor-${day}-${source}-${tag}-${index}`,
    tag,
    strength,
    createdDay: day,
    durationDays: strength >= 3 ? 3 : 2,
    source,
  }));
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

    case "firechief_intro":
      return {
        ...closeToTown,
        flags: { ...s.flags, met_firechief: true },
        npcRelations: {
          ...s.npcRelations,
          firechief: {
            ...s.npcRelations.firechief,
            familiarity: s.npcRelations.firechief.familiarity + 1,
            attitude: "friendly",
          },
        },
        log: appendLog(s.log, s.day, "火消し頭に顔を覚えられた。"),
      };

    case "episode_landlord":
      return withProgression({
        ...closeToTown,
        flags: { ...s.flags, episode_landlord_done: true },
        player: { ...s.player, trust: s.player.trust + 2 },
        npcRelations: {
          ...s.npcRelations,
          landlord: {
            ...s.npcRelations.landlord,
            affinity: s.npcRelations.landlord.affinity + 2,
            familiarity: s.npcRelations.landlord.familiarity + 1,
            attitude: "friendly",
          },
        },
        log: appendLog(s.log, s.day, "大家に頼まれ、長屋の小さな用事を片づけた。（信用 +2）"),
      });

    case "episode_fishmonger":
      return withProgression({
        ...closeToTown,
        flags: { ...s.flags, episode_fishmonger_done: true },
        player: { ...s.player, network: s.player.network + 2, skill: s.player.skill + 1 },
        npcRelations: {
          ...s.npcRelations,
          fishmonger: {
            ...s.npcRelations.fishmonger,
            affinity: s.npcRelations.fishmonger.affinity + 2,
            familiarity: s.npcRelations.fishmonger.familiarity + 1,
            attitude: "friendly",
          },
        },
        log: appendLog(s.log, s.day, "魚屋の売り子を手伝い、商店通りに顔が広がった。（人脈 +2）"),
      });

    case "episode_child":
      return withProgression({
        ...closeToTown,
        flags: { ...s.flags, episode_child_done: true },
        player: { ...s.player, iki: s.player.iki + 1, network: s.player.network + 1 },
        npcRelations: {
          ...s.npcRelations,
          child: {
            ...s.npcRelations.child,
            affinity: s.npcRelations.child.affinity + 2,
            familiarity: s.npcRelations.child.familiarity + 1,
            attitude: "friendly",
          },
        },
        log: appendLog(s.log, s.day, "子どもの竹とんぼ騒ぎに付き合った。（粋 +1 / 人脈 +1）"),
      });

    case "episode_newsman":
      return withProgression({
        ...closeToTown,
        flags: { ...s.flags, episode_newsman_done: true },
        player: { ...s.player, iki: s.player.iki + 1, network: s.player.network + 1 },
        npcRelations: {
          ...s.npcRelations,
          newsman: {
            ...s.npcRelations.newsman,
            affinity: s.npcRelations.newsman.affinity + 2,
            familiarity: s.npcRelations.newsman.familiarity + 1,
            attitude: "friendly",
          },
        },
        log: appendLog(s.log, s.day, "瓦版屋と祭り前の町を歩いた。（粋 +1 / 人脈 +1）"),
      });

    case "festival_intro":
      return {
        ...s,
        dialog: null,
        screen: "festival_choice",
        flags: { ...s.flags, festival_started: true },
        log: appendLog(s.log, s.day, "春祭りの準備に巻き込まれた。"),
      };

    case "patrol_intro":
      return {
        ...s,
        dialog: null,
        screen: "patrol_choice",
        flags: { ...s.flags, patrol_started: true },
        log: appendLog(s.log, s.day, "火消し頭から町内見回りを任された。"),
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

    case "fire_intro":
      return {
        ...s,
        dialog: null,
        screen: "fire_choice",
        flags: { ...s.flags, fire_intro_started: true },
        log: appendLog(s.log, s.day, "長屋裏手で小火騒ぎが起きた。"),
      };

    case "rumor_landlord":
    case "rumor_fishmonger":
    case "rumor_child":
    case "rumor_newsman":
    case "reputation_reply":
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

  // Day 4+: short personal episodes make the town feel inhabited.
  if (s.day >= 4) {
    if (npc === "landlord" && !s.flags.episode_landlord_done) {
      return { kind: "episode_landlord", lines: NPC_EPISODES.landlord };
    }
    if (npc === "fishmonger" && !s.flags.episode_fishmonger_done) {
      return { kind: "episode_fishmonger", lines: NPC_EPISODES.fishmonger };
    }
    if (npc === "child" && !s.flags.episode_child_done) {
      return { kind: "episode_child", lines: NPC_EPISODES.child };
    }
    if (npc === "newsman" && !s.flags.episode_newsman_done) {
      return { kind: "episode_newsman", lines: NPC_EPISODES.newsman };
    }
    if (npc === "newsman" && s.flags.episode_newsman_done && !s.flags.festival_started && !s.flags.festival_done) {
      return { kind: "festival_intro", lines: FESTIVAL_INTRO_LINES };
    }
  }

  // Persistent reputation changes how people talk even after short-lived rumors fade.
  for (const reputation of s.reputationTags) {
    const lines = REPUTATION_LINES[reputation]?.[npc];
    if (lines && lines.length > 0) {
      return { kind: "reputation_reply", lines };
    }
  }

  // Fire-chief progression must take priority over ambient rumor reactions.
  if (npc === "firechief") {
    if (!s.flags.firehouse_unlocked) return null;
    if (!s.flags.met_firechief) {
      return { kind: "firechief_intro", lines: FIRECHIEF_INTRO_LINES };
    }
    if (s.day >= 3 && !s.flags.patrol_started && !s.flags.patrol_done) {
      return { kind: "patrol_intro", lines: PATROL_INTRO_LINES };
    }
  }

  // Day 3 fire aftermath takes priority over older sewage-rumor replies.
  if (s.day >= 3 && s.flags.fire_event_done) {
    const tag = pickDominantRumor(s.activeRumors);
    if (tag) {
      const replies = FIRE_RUMOR_REPLIES[npc][tag];
      if (replies && replies.length > 0) {
        return { kind: `rumor_${npc}` as DialogKind, lines: replies };
      }
    }
  }

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

    case "firechief":
      return { kind: "already_met", lines: ALREADY_MET_LINES.firechief };
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
  return withProgression({
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
    playerActions: [
      ...s.playerActions,
      {
        id: `action-${Date.now()}`,
        day: s.day,
        type: choice.id,
        // The landlord commissioned the town job, so she is the primary
        // relationship target for the first "yesterday -> today" loop.
        targetNpcId: "landlord",
        importance:
          choice.id === "choice_kumitori_friendly" ||
          choice.id === "choice_kumitori_careful"
            ? 3
            : choice.id === "choice_kumitori_reluctant"
              ? 1
              : 2,
        tags: [...choice.rumorTags],
      },
    ],
    rumorHistory: [
      ...s.rumorHistory,
      ...makeRumorRecords(choice.rumorTags, s.day, choice.id, 2),
    ],
    lastJobResult: { choiceId: choice.id, resultText: choice.resultText, delta },
  });
}

function getCurrentObjective(state: GameState): string {
  if (!state.flags.intro_done) return "大江戸町へ入る";
  if (!state.flags.met_landlord) return "長屋前で大家に会う";
  if (!state.flags.kumitori_job_done) {
    if (!state.flags.kumitori_event_started) return "町を歩いて、長屋の困りごとを聞く";
    return "長屋の初仕事を終える";
  }
  if (!state.flags.day2_started) return "部屋へ戻って一日を終える";
  if (!state.flags.fire_event_done) return "町の噂を確かめ、次の騒ぎへ向かう";
  if (!state.flags.met_firechief) return "火消し小屋で火消し頭に会う";
  if (!state.flags.patrol_done) return "火消し頭の見回り仕事を手伝う";
  if (state.day >= 5) return "町の人との関係を深め、顔役への道を歩く";
  if (state.day >= 4 && !state.flags.festival_done) {
    if (!state.flags.episode_newsman_done) return "町の人たちの小さな頼みごとを聞く";
    if (!state.flags.festival_started) return "瓦版屋に春祭りの話を聞く";
    return "春祭りの準備を手伝う";
  }
  if (state.day >= 4) return "町を歩き、次の出来事を探す";
  return "町を歩いて人と話す";
}

function getYesterdaySummary(state: GameState): string | null {
  if (state.day <= 1) return null;
  const yesterday = state.playerActions
    .filter((action) => action.day === state.day - 1)
    .slice(-1)[0];
  if (!yesterday) return state.lastDecision ? "昨日の行動が町の噂になっている。" : null;
  const tag = yesterday.tags?.[0];
  return tag
    ? `昨日の行動が「#${tag}」として町に残っている。`
    : "昨日の行動を町の人たちが覚えている。";
}

function getNextLead(state: GameState): string | null {
  if (
    state.day < 2 ||
    !state.lastDecision ||
    state.flags.fire_intro_started ||
    state.flags.fire_event_done
  ) {
    return null;
  }
  if (state.lastDecision.specialEvent.shouldTrigger) {
    return "火消し小屋の方が妙に騒がしい。昨日の噂と何か関係があるらしい。";
  }
  if (state.lastDecision.quest.shouldUnlock) {
    return "魚屋がこちらをちらちら見ている。どうやら次の頼みごとがあるようだ。";
  }
  const rumor = pickDominantRumor(state.activeRumors);
  if (rumor === "iki" || rumor === "funny") {
    return "瓦版屋が紙束を抱えて待ち構えている。昨日の話をもっと盛る気らしい。";
  }
  if (rumor === "helpful" || rumor === "clean") {
    return "井戸端で『あの新入りに頼めばいい』という声が聞こえ始めた。";
  }
  if (rumor === "quick") {
    return "商店通りで『あいつ、仕事は速いらしいぞ』という声が飛び交っている。";
  }
  if (rumor === "yabo") {
    return "大家が『次はもう少し粋にやんな』と、別の仕事を匂わせている。";
  }
  return "町はもう次の騒ぎを始めている。少し歩けば、また何かに巻き込まれそうだ。";
}

function App() {
  const [state, setState] = useState<GameState>(loadInitial);
  const [sceneReady, setSceneReady] = useState(false);
  const [areaTransition, setAreaTransition] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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
    EventBus.emit("game-flags", {
      roomUnlocked: state.flags.room_unlocked,
      firehouseUnlocked: state.flags.firehouse_unlocked,
    });
  }, [state.flags.room_unlocked, state.flags.firehouse_unlocked]);

  useEffect(() => {
    if (sceneReady && state.day >= 2) EventBus.emit("warp", "nagaya");
  }, [state.day, sceneReady]);

  // On scene ready, re-sync everything Phaser may have missed.
  useEffect(() => {
    if (!sceneReady) return;
    EventBus.emit("screen-changed", state.screen);
    EventBus.emit("game-flags", {
      roomUnlocked: state.flags.room_unlocked,
      firehouseUnlocked: state.flags.firehouse_unlocked,
    });
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
    uiSound.next();
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
    uiSound.select();
    setToast("行動が町の評判に影響した");
    window.setTimeout(() => setToast(null), 1800);
    setState((s) => (s.screen === "job" ? applyJobChoice(s, choice) : s));
  }, []);

  const startFireEvent = useCallback(() => {
    setState((s) => {
      if (
        s.day < 2 ||
        s.flags.fire_intro_started ||
        s.flags.fire_event_done ||
        s.screen !== "town"
      ) {
        return s;
      }
      return startDialogInState(s, "fire_intro", FIRE_INTRO_LINES);
    });
  }, []);

  const chooseFireResponse = useCallback(async (choice: FireChoice) => {
    if (state.screen !== "fire_choice") return;
    uiSound.select();
    const e = choice.effects;
    const action = {
      id: `action-${Date.now()}`,
      day: state.day,
      type: choice.id,
      targetNpcId: "landlord" as const,
      importance: 3,
      tags: [...choice.rumorTags],
    };
    const provisional: GameState = {
      ...state,
      player: {
        ...state.player,
        trust: state.player.trust + (e.trust ?? 0),
        iki: state.player.iki + (e.iki ?? 0),
        network: state.player.network + (e.network ?? 0),
        skill: state.player.skill + (e.skill ?? 0),
      },
      town: {
        ...state.town,
        safety: state.town.safety + (e.safety ?? 0),
      },
      playerActions: [...state.playerActions, action],
      activeRumors: [...choice.rumorTags],
      log: appendLog(state.log, state.day, choice.resultText),
    };

    const context = buildDayDecisionContext(provisional);
    const outcome = await decisionService.decide(context);
    const decidedRumor =
      outcome.result.rumor.type === "none"
        ? pickDominantRumor(choice.rumorTags)
        : outcome.result.rumor.type;
    const decisionLog = makeDecisionLog(
      context,
      outcome.result,
      decidedRumor ?? undefined,
      outcome.fallbackReason
    );

    const fireChiefAssessment =
      outcome.result.npc.attitude === "impressed"
        ? "火消し頭「新入りにしちゃ上出来だ。火事場で役目を見つけられるやつは覚えておく」"
        : outcome.result.npc.attitude === "friendly"
          ? "火消し頭「悪くない動きだった。次も周りを見て動け」"
          : outcome.result.npc.attitude === "cautious"
            ? "火消し頭「勢いはあるが、火事場じゃ一歩間違えば邪魔になる。覚えとけ」"
            : outcome.result.npc.attitude === "annoyed"
              ? "火消し頭「火事場で勝手はするな。町を守るなら連携を覚えろ」"
              : "火消し頭「まずは無事で何よりだ。次に備えておけ」";

    const headline =
      decidedRumor === "quick"
        ? "『疾風の桶運び、煙を追い越す』"
        : decidedRumor === "iki"
          ? "『火事場でも粋、新入りの立ち回り』"
          : decidedRumor === "helpful"
            ? "『新入り、長屋の小火で人助け』"
            : decidedRumor === "funny"
              ? "『小火より騒がしい新入り現る』"
              : "『長屋の小火、町内総出で大事なし』";

    uiSound.result();
    setToast("昨日の行動が、今日の町の空気になった");
    window.setTimeout(() => setToast(null), 2200);
    setState((current) => withProgression({
      ...provisional,
      screen: "fire_result",
      flags: { ...provisional.flags, fire_event_done: true },
      activeRumors: decidedRumor ? [decidedRumor] : [...choice.rumorTags],
      lastDecision: outcome.result,
      decisionLogs: [...current.decisionLogs, decisionLog],
      rumorHistory: [
        ...current.rumorHistory,
        ...makeRumorRecords(
          decidedRumor ? [decidedRumor] : choice.rumorTags,
          state.day,
          choice.id,
          outcome.result.rumor.strength
        ),
      ],
      fireAftermath: {
        choiceId: choice.id,
        resultText: choice.resultText,
        fireChiefAssessment,
        newsHeadline: headline,
        townSummary: outcome.result.quest.shouldUnlock
          ? "町では『次もあいつに頼める』という空気が出始めている。"
          : "町では、昨日の動きを見ていた連中が少しずつこちらを覚え始めている。",
        provider: outcome.result.provider,
        rumor: outcome.result.rumor.type,
        rumorStrength: outcome.result.rumor.strength,
      },
      log: appendLog(
        provisional.log,
        state.day,
        `小火の翌日判断：#${decidedRumor ?? "none"} / ${outcome.result.provider}`
      ),
    }));
  }, [state]);

  const chooseFestival = useCallback((choice: FestivalChoice) => {
    uiSound.select();
    setState((s) => {
      if (s.screen !== "festival_choice") return s;
      const e = choice.effects;
      const hasBonus =
        choice.favoredReputation != null &&
        s.reputationTags.includes(choice.favoredReputation);
      const bonus = hasBonus ? 1 : 0;
      const next = withProgression({
        ...s,
        screen: "festival_result",
        player: {
          ...s.player,
          trust: s.player.trust + (e.trust ?? 0) + (hasBonus && choice.id === "festival_stalls" ? 1 : 0),
          iki: s.player.iki + (e.iki ?? 0) + (hasBonus && choice.id === "festival_decor" ? 1 : 0),
          network: s.player.network + (e.network ?? 0) + (hasBonus && choice.id === "festival_news" ? 1 : 0),
          skill: s.player.skill + (e.skill ?? 0),
        },
        town: {
          ...s.town,
          trend: s.town.trend + (e.trend ?? 0) + bonus,
          economy: s.town.economy + (e.economy ?? 0) + bonus,
        },
        flags: { ...s.flags, festival_done: true },
        activeRumors: Array.from(new Set([...s.activeRumors, ...choice.rumorTags])),
        rumorHistory: [
          ...s.rumorHistory,
          ...makeRumorRecords(choice.rumorTags, s.day, choice.id, hasBonus ? 3.5 : 3),
        ],
        playerActions: [
          ...s.playerActions,
          {
            id: `action-${Date.now()}`,
            day: s.day,
            type: choice.id,
            targetNpcId: "newsman",
            importance: 3,
            tags: [...choice.rumorTags],
          },
        ],
        lastFestivalResult: {
          choiceId: choice.id,
          resultText: choice.resultText,
          bonusText: hasBonus
            ? `評判「${choice.favoredReputation}」が活きて、町の反応がさらに良くなった。`
            : null,
          nextDayText:
            "祭りの準備を終えた翌朝、町ではもう『新入り』ではなく名前で呼ぶ声が増えていた。",
        },
        log: appendLog(
          s.log,
          s.day,
          choice.resultText + (hasBonus ? `（評判「${choice.favoredReputation}」が活きた）` : "")
        ),
      });
      return next;
    });
    uiSound.result();
    setToast("評判がイベントの結果に反映された");
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const choosePatrol = useCallback((choice: PatrolChoice) => {
    uiSound.select();
    setToast("見回りの結果が町に残った");
    window.setTimeout(() => setToast(null), 1800);
    setState((s) => {
      if (s.screen !== "patrol_choice") return s;
      const e = choice.effects;
      const next = withProgression({
        ...s,
        screen: "patrol_result",
        player: {
          ...s.player,
          trust: s.player.trust + (e.trust ?? 0),
          iki: s.player.iki + (e.iki ?? 0),
          network: s.player.network + (e.network ?? 0),
          skill: s.player.skill + (e.skill ?? 0),
        },
        town: {
          ...s.town,
          safety: s.town.safety + (e.safety ?? 0),
        },
        flags: { ...s.flags, patrol_done: true },
        activeRumors: Array.from(new Set([...s.activeRumors, ...choice.rumorTags])),
        rumorHistory: [
          ...s.rumorHistory,
          ...makeRumorRecords(choice.rumorTags, s.day, choice.id, 2.5),
        ],
        playerActions: [
          ...s.playerActions,
          {
            id: `action-${Date.now()}`,
            day: s.day,
            type: choice.id,
            targetNpcId: "firechief",
            importance: 2,
            tags: [...choice.rumorTags],
          },
        ],
        lastPatrolResult: {
          choiceId: choice.id,
          resultText: choice.resultText,
          nextDayText:
            "見回りの翌朝、火消し小屋では『新入りも少しは町を見る目がついた』と話されている。",
        },
        log: appendLog(s.log, s.day, choice.resultText),
      });
      return next;
    });
  }, []);

  const goToNight = useCallback(async () => {
    const context = buildDayDecisionContext(state);
    const outcome = await decisionService.decide(context);
    const decidedRumor =
      outcome.result.rumor.type === "none"
        ? undefined
        : outcome.result.rumor.type;
    const decisionLog = makeDecisionLog(
      context,
      outcome.result,
      decidedRumor,
      outcome.fallbackReason
    );

    setState((current) => {
      const providerLabel =
        outcome.result.provider === "jev" ? "Jev" : "Local";
      const rumorText = decidedRumor
        ? `#${decidedRumor}（強さ ${outcome.result.rumor.strength.toFixed(1)}）`
        : "大きな噂なし";
      const fallbackText = outcome.fallbackReason
        ? ` / fallback: ${outcome.fallbackReason}`
        : "";

      const targetNpcId = context.targetNpcId;
      const currentRelation = current.npcRelations[targetNpcId];
      const nextRelation = {
        ...currentRelation,
        affinity: currentRelation.affinity + outcome.result.npc.affinityDelta,
        familiarity: currentRelation.familiarity + 1,
        attitude: outcome.result.npc.attitude,
      };
      const secondaryAttitude =
        outcome.result.rumor.type === "helpful" ||
        outcome.result.rumor.type === "clean" ||
        outcome.result.rumor.type === "iki"
          ? "friendly"
          : outcome.result.rumor.type === "yabo"
            ? "cautious"
            : "neutral";
      const secondaryAffinity =
        outcome.result.rumor.type === "helpful" ||
        outcome.result.rumor.type === "iki"
          ? 1
          : outcome.result.rumor.type === "yabo"
            ? -1
            : 0;
      const rippleNpcIds: NPCId[] = ["fishmonger", "child", "newsman"];
      const rippledRelations = rippleNpcIds.reduce(
        (relations, npcId) => ({
          ...relations,
          [npcId]: {
            ...relations[npcId],
            affinity: relations[npcId].affinity + secondaryAffinity,
            familiarity: relations[npcId].familiarity + 1,
            attitude: secondaryAttitude,
          },
        }),
        {
          ...current.npcRelations,
          [targetNpcId]: nextRelation,
        }
      );

      const withDecision: GameState = {
        ...current,
        activeRumors: decidedRumor ? [decidedRumor] : [],
        npcRelations: rippledRelations,
        lastDecision: outcome.result,
        decisionLogs: [...current.decisionLogs, decisionLog],
        log: appendLog(
          appendLog(
            current.log,
            current.day,
            `翌日の町判断：${rumorText} / ${providerLabel}${fallbackText}`
          ),
          current.day,
          `大家の態度：${outcome.result.npc.attitude} / 好意 ${outcome.result.npc.affinityDelta >= 0 ? "+" : ""}${outcome.result.npc.affinityDelta}`
        ),
      };
      return startDialogInState(withDecision, "night", NIGHT_LINES);
    });
  }, [state]);

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
  const dominantRumor = pickDominantRumor(state.activeRumors);
  const areaEcho =
    state.day >= 3 && state.flags.fire_event_done
      ? getFireAreaEcho(dominantRumor, state.currentArea)
      : state.day >= 2
        ? getRumorAreaEcho(dominantRumor, state.currentArea)
        : null;
  const nextLead = getNextLead(state);
  const currentObjective = getCurrentObjective(state);
  const yesterdaySummary = getYesterdaySummary(state);

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
      {inWorld && (
        <div className="objective-strip">
          <span>今日の目当て</span>
          <strong>{currentObjective}</strong>
        </div>
      )}

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
          <div className="world-layout">
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

            {state.screen === "fire_choice" && (
              <div className="overlay">
                <FireChoiceView choices={FIRE_CHOICES} onChoose={chooseFireResponse} />
              </div>
            )}

            {state.screen === "fire_result" && state.fireAftermath && (
              <div className="overlay">
                <FireAftermathView
                  aftermath={state.fireAftermath}
                  onNext={() =>
                    setState((s) => ({
                      ...s,
                      screen: "town",
                      day: 3,
                      time: "morning",
                      currentArea: "nagaya",
                      flags: {
                        ...s.flags,
                        day3_started: true,
                        firehouse_unlocked: true,
                      },
                      log: appendLog(
                        s.log,
                        3,
                        "小火騒ぎの翌朝。町は昨日より少しだけこちらを見るようになった。"
                      ),
                    }))
                  }
                />
              </div>
            )}

            {state.screen === "festival_choice" && (
              <div className="overlay">
                <FestivalChoiceView choices={FESTIVAL_CHOICES} onChoose={chooseFestival} />
              </div>
            )}

            {state.screen === "festival_result" && state.lastFestivalResult && (
              <div className="overlay">
                <FestivalResultView
                  result={state.lastFestivalResult}
                  onNext={() =>
                    setState((s) =>
                      withProgression({
                        ...s,
                        screen: "town",
                        day: 5,
                        time: "morning",
                        currentArea: "nagaya",
                        flags: { ...s.flags, day5_started: true },
                        log: appendLog(
                          s.log,
                          5,
                          s.lastFestivalResult?.nextDayText ?? "五日目の朝になった。"
                        ),
                      })
                    )
                  }
                />
              </div>
            )}

            {state.screen === "patrol_choice" && (
              <div className="overlay">
                <PatrolChoiceView choices={PATROL_CHOICES} onChoose={choosePatrol} />
              </div>
            )}

            {state.screen === "patrol_result" && state.lastPatrolResult && (
              <div className="overlay">
                <PatrolResultView
                  result={state.lastPatrolResult}
                  onNext={() =>
                    setState((s) =>
                      withProgression({
                        ...s,
                        screen: "town",
                        day: 4,
                        time: "morning",
                        currentArea: "firehouse",
                        flags: { ...s.flags, day4_started: true },
                        log: appendLog(
                          s.log,
                          4,
                          s.lastPatrolResult?.nextDayText ?? "四日目の朝になった。"
                        ),
                      })
                    )
                  }
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
            <TownSidePanel
              state={state}
              dominantRumor={dominantRumor}
              areaEcho={areaEcho}
              yesterdaySummary={yesterdaySummary}
            />
          </div>
        )}

        {inWorld && (
          <>
          <AreaNav state={state} onMove={(area) => {
            uiSound.move();
            const label = AREAS[area].name;
            setAreaTransition(label);
            window.setTimeout(() => setAreaTransition(null), 900);
            setState((s) => ({ ...s, currentArea: area }));
            EventBus.emit("warp", area);
          }} />
          <div className="logstrip">
            <span className="logstrip-label">町の声</span>
            <span className="logstrip-text">
              {areaEcho ?? lastLog ?? "まだ語ることはない。"}
            </span>
            {state.activeRumors.length > 0 && (
              <span className="logstrip-rumors">
                {state.activeRumors.map((r) => `#${r}`).join(" ")}
              </span>
            )}
          </div>
          {nextLead && (
            <div className="next-lead">
              <span className="next-lead-label">次の気配</span>
              <span className="next-lead-text">{nextLead}</span>
              <button className="primary" onClick={startFireEvent}>
                騒ぎを見に行く
              </button>
            </div>
          )}
          </>
        )}
      </main>
      {areaTransition && (
        <div className="area-transition" aria-live="polite">
          <span>場所を移動</span>
          <strong>{areaTransition}</strong>
        </div>
      )}
      {toast && <div className="game-toast" aria-live="polite">{toast}</div>}
    </div>
  );
}

function AreaNav({
  state,
  onMove,
}: {
  state: GameState;
  onMove: (area: AreaId) => void;
}) {
  const items: Array<{ id: AreaId; label: string; locked?: boolean }> = [
    { id: "nagaya", label: "長屋前" },
    { id: "well", label: "井戸端" },
    { id: "market", label: "商店通り" },
    {
      id: "firehouse",
      label: "火消し小屋",
      locked: !state.flags.firehouse_unlocked,
    },
  ];

  return (
    <nav className="area-nav" aria-label="町の移動">
      {items.map((item) => (
        <button
          key={item.id}
          className={state.currentArea === item.id ? "active" : ""}
          disabled={item.locked}
          onClick={() => onMove(item.id)}
        >
          <span>{item.label}</span>
          {item.locked && <small>まだ行けない</small>}
        </button>
      ))}
    </nav>
  );
}

function TownSidePanel({
  state,
  dominantRumor,
  areaEcho,
  yesterdaySummary,
}: {
  state: GameState;
  dominantRumor: ReturnType<typeof pickDominantRumor>;
  areaEcho: string | null;
  yesterdaySummary: string | null;
}) {
  const areaNpcIds: NPCId[] =
    state.currentArea === "market"
      ? ["fishmonger", "newsman"]
      : state.currentArea === "well"
        ? ["child"]
        : state.currentArea === "firehouse"
          ? ["firechief"]
          : ["landlord", "child"];

  return (
    <aside className="town-side-panel">
      <section className="side-card">
        <div className="side-card-title">このあたりの人たち</div>
        <div className="nearby-list">
          {areaNpcIds.map((npcId) => (
            <div className="nearby-person" key={npcId}>
              <span className={`nearby-avatar avatar-${npcId}`}>
                <span>{NPCS[npcId].name.slice(0, 1)}</span>
              </span>
              <div>
                <strong>{NPCS[npcId].name}</strong>
                <small>{state.npcRelations[npcId].attitude}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {yesterdaySummary && (
        <section className="side-card yesterday-card">
          <div className="side-card-title">昨日の行動 → 今日</div>
          <p>{yesterdaySummary}</p>
        </section>
      )}

      <section className="side-card rumor-card">
        <div className="side-card-title">今日のうわさ</div>
        <p>{areaEcho ?? "まだ大きな噂はない。"}</p>
        {dominantRumor && <span className="rumor-chip">#{dominantRumor}</span>}
      </section>

      <section className="side-card town-mood-card">
        <div className="side-card-title">町の空気</div>
        <div className="mood-list">
          {[
            ["衛生", state.town.hygiene],
            ["治安", state.town.safety],
            ["流行", state.town.trend],
            ["景気", state.town.economy],
          ].map(([label, value]) => (
            <div className="mood-row" key={label}>
              <span>{label}</span>
              <div className="mood-bar"><i style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} /></div>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>
    </aside>
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
    <section className="title mock-title">
      <div className="title-hero" aria-hidden="true"></div>
      <div className="title-copy">
      <p className="title-kicker">あの頃も、きっと、たのしい。</p>
      <h1 className="title-main">OH！EDO！</h1>
      <p className="title-sub">江戸ライフ成り上がり</p>
      <p className="title-flavor">
        流れ着いたのは、騒がしくも妙に居心地のいい大江戸の長屋。
        <br />
        町を歩き、声をかけ──町は、あんたのことを少しずつ覚えていく。
      </p>
      <div className="title-actions">
        <button className="primary title-start" onClick={onStart}>
          {hasSave ? "つづきから" : "大江戸町へ"}
        </button>
      </div>
      </div>
      <div className="title-cast" aria-hidden="true">
        <span className="cast-chip cast-fish">魚屋</span>
        <span className="cast-chip cast-landlord">大家</span>
        <span className="cast-chip cast-child">子ども</span>
        <span className="cast-chip cast-news">瓦版</span>
      </div>
    </section>
  );
}

function FestivalChoiceView({
  choices,
  onChoose,
}: {
  choices: FestivalChoice[];
  onChoose: (choice: FestivalChoice) => void;
}) {
  return (
    <section className="panel festival-panel">
      <h2>春祭りの準備</h2>
      <p className="panel-desc">町の一員として、どこに手を貸す？</p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            {choice.favoredReputation && (
              <small className="favored-reputation">相性：{choice.favoredReputation}</small>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function FestivalResultView({
  result,
  onNext,
}: {
  result: NonNullable<GameState["lastFestivalResult"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel festival-result">
      <h2>祭りの準備、そのあと</h2>
      <p>{result.resultText}</p>
      {result.bonusText && <p className="reputation-bonus">{result.bonusText}</p>}
      <p className="muted">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>五日目へ</button>
      </div>
    </section>
  );
}

function PatrolChoiceView({
  choices,
  onChoose,
}: {
  choices: PatrolChoice[];
  onChoose: (choice: PatrolChoice) => void;
}) {
  return (
    <section className="panel">
      <h2>火消し小屋の見回り</h2>
      <p className="panel-desc">町を守るために、今日はどこを見る？</p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PatrolResultView({
  result,
  onNext,
}: {
  result: NonNullable<GameState["lastPatrolResult"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel">
      <h2>見回り完了</h2>
      <p>{result.resultText}</p>
      <p className="muted">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>四日目へ</button>
      </div>
    </section>
  );
}

function FireAftermathView({
  aftermath,
  onNext,
}: {
  aftermath: NonNullable<GameState["fireAftermath"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel fire-aftermath">
      <h2>小火騒ぎ、そのあと</h2>
      <p>{aftermath.resultText}</p>
      <div className="aftermath-card">
        <strong>火消し頭</strong>
        <p>{aftermath.fireChiefAssessment}</p>
      </div>
      <div className="aftermath-card">
        <strong>瓦版の見出し</strong>
        <p>{aftermath.newsHeadline}</p>
      </div>
      <div className="aftermath-card">
        <strong>町の空気</strong>
        <p>{aftermath.townSummary}</p>
      </div>
      <p className="muted">
        判断: {aftermath.provider} / 噂強度 {aftermath.rumorStrength.toFixed(1)}
      </p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>三日目へ</button>
      </div>
    </section>
  );
}

function FireChoiceView({
  choices,
  onChoose,
}: {
  choices: FireChoice[];
  onChoose: (choice: FireChoice) => void;
}) {
  return (
    <section className="panel">
      <h2>小火騒ぎ</h2>
      <p className="panel-desc">
        火消し組が来るまでのわずかな間、どう動く？
      </p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button
            className="fire-choice"
            key={choice.id}
            onClick={() => onChoose(choice)}
          >
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
          </button>
        ))}
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
          <h3>町の人との関係</h3>
          <ul>
            <li>
              大家：{state.npcRelations.landlord.attitude}
              （好意 {state.npcRelations.landlord.affinity >= 0 ? "+" : ""}
              {state.npcRelations.landlord.affinity}）
            </li>
            <li>
              魚屋：{state.npcRelations.fishmonger.attitude}
              （好意 {state.npcRelations.fishmonger.affinity >= 0 ? "+" : ""}
              {state.npcRelations.fishmonger.affinity}）
            </li>
            <li>
              長屋の子ども：{state.npcRelations.child.attitude}
              （好意 {state.npcRelations.child.affinity >= 0 ? "+" : ""}
              {state.npcRelations.child.affinity}）
            </li>
            <li>
              瓦版屋：{state.npcRelations.newsman.attitude}
              （好意 {state.npcRelations.newsman.affinity >= 0 ? "+" : ""}
              {state.npcRelations.newsman.affinity}）
            </li>
            <li>
              火消し頭：{state.npcRelations.firechief.attitude}
              （好意 {state.npcRelations.firechief.affinity >= 0 ? "+" : ""}
              {state.npcRelations.firechief.affinity}）
            </li>
          </ul>
        </div>
        <div>
          <h3>評判</h3>
          {state.reputationTags.length === 0 ? (
            <p className="muted">まだ町に定着した評判はない。</p>
          ) : (
            <ul>{state.reputationTags.map((r) => <li key={r}>{r}</li>)}</ul>
          )}
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

      <h3>最近の噂</h3>
      {state.rumorHistory.length === 0 ? (
        <p className="muted">まだ記録された噂はない。</p>
      ) : (
        <ul>
          {[...state.rumorHistory].slice(-6).reverse().map((r) => (
            <li key={r.id}>Day{r.createdDay} #{r.tag} / 強さ {r.strength.toFixed(1)}</li>
          ))}
        </ul>
      )}

      <details className="decision-debug">
        <summary>Decisionログ（開発用）</summary>
        {state.decisionLogs.length === 0 ? (
          <p className="muted">まだ判断ログはない。</p>
        ) : (
          <pre>{JSON.stringify(state.decisionLogs.slice(-2), null, 2)}</pre>
        )}
      </details>

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
