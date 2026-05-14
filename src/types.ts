export type Screen =
  | "title"
  | "dialog"
  | "map"
  | "job"
  | "result"
  | "night"
  | "status";

export type TimeOfDay = "morning" | "noon" | "evening" | "night";

export type AreaId = "nagaya" | "well" | "market" | "room";

export type NPCId =
  | "landlord"
  | "fishmonger"
  | "child"
  | "newsman"
  | "kumitori_master";

export type RumorTag =
  | "quick"
  | "funny"
  | "helpful"
  | "clean"
  | "iki"
  | "yabo";

export type JobChoiceId =
  | "choice_kumitori_fast"
  | "choice_kumitori_careful"
  | "choice_kumitori_friendly"
  | "choice_kumitori_reluctant";

export type DialogKind =
  | "opening"
  | "landlord_intro"
  | "fishmonger_intro"
  | "child_intro"
  | "newsman_intro"
  | "kumitori_event"
  | "night"
  | "rumor_landlord"
  | "rumor_fishmonger"
  | "rumor_child"
  | "rumor_newsman"
  | "already_met";

export interface DialogLine {
  speaker: string;
  text: string;
}

export interface Player {
  money: number;
  trust: number;
  iki: number;
  network: number;
  skill: number;
  rank: number;
  rankName: string;
}

export interface Town {
  hygiene: number;
  safety: number;
  trend: number;
  economy: number;
}

export interface Flags {
  intro_done: boolean;
  met_landlord: boolean;
  room_unlocked: boolean;
  met_fishmonger: boolean;
  met_child: boolean;
  met_newsman: boolean;
  rumor_heard_kumitori: boolean;
  kumitori_event_started: boolean;
  kumitori_job_done: boolean;
  day1_ended: boolean;
  day2_started: boolean;
}

export interface ActiveDialog {
  kind: DialogKind;
  lines: DialogLine[];
  index: number;
  /** Returned-to-screen after the dialog finishes (before any onComplete-driven transition). */
  returnTo: Screen;
}

export interface JobChoice {
  id: JobChoiceId;
  label: string;
  description: string;
  effects: {
    money?: number;
    trust?: number;
    iki?: number;
    network?: number;
    skill?: number;
    hygiene?: number;
  };
  rumorTags: RumorTag[];
  resultText: string;
}

export interface JobResult {
  choiceId: JobChoiceId;
  resultText: string;
  delta: {
    money: number;
    trust: number;
    iki: number;
    network: number;
    skill: number;
    hygiene: number;
  };
}

export interface AreaDef {
  id: AreaId;
  name: string;
  description: string;
  npcs: NPCId[];
  /** Areas accessible from here. */
  exits: AreaId[];
  /** Day-flavored 小話. Index by day - 1 (clamped). */
  flavor: string[];
}

export interface NPCDef {
  id: NPCId;
  name: string;
}

export interface GameState {
  screen: Screen;
  day: number;
  time: TimeOfDay;
  currentArea: AreaId;
  player: Player;
  town: Town;
  flags: Flags;
  activeRumors: RumorTag[];
  log: string[];
  dialog: ActiveDialog | null;
  lastJobResult: JobResult | null;
}
