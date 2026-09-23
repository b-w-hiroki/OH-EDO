export type Screen =
  | "title"
  | "dialog"
  | "town"
  | "job"
  | "result"
  | "fire_choice"
  | "fire_result"
  | "patrol_choice"
  | "patrol_result"
  | "festival_choice"
  | "festival_result"
  | "room"
  | "status";

export type TimeOfDay = "morning" | "noon" | "evening" | "night";

export type AreaId = "nagaya" | "well" | "market" | "firehouse" | "room";

export type NPCId =
  | "landlord"
  | "fishmonger"
  | "child"
  | "newsman"
  | "firechief"
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
  | "firechief_intro"
  | "patrol_intro"
  | "festival_intro"
  | "episode_landlord"
  | "episode_fishmonger"
  | "episode_child"
  | "episode_newsman"
  | "reputation_reply"
  | "kumitori_event"
  | "night"
  | "fire_intro"
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
  met_firechief: boolean;
  firehouse_unlocked: boolean;
  rumor_heard_kumitori: boolean;
  kumitori_event_started: boolean;
  kumitori_job_done: boolean;
  day1_ended: boolean;
  day2_started: boolean;
  fire_intro_started: boolean;
  fire_event_done: boolean;
  day3_started: boolean;
  patrol_started: boolean;
  patrol_done: boolean;
  day4_started: boolean;
  episode_landlord_done: boolean;
  episode_fishmonger_done: boolean;
  episode_child_done: boolean;
  episode_newsman_done: boolean;
  festival_started: boolean;
  festival_done: boolean;
  day5_started: boolean;
}

export interface ActiveDialog {
  kind: DialogKind;
  lines: DialogLine[];
  index: number;
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

export interface RumorRecord {
  id: string;
  tag: RumorTag;
  strength: number;
  createdDay: number;
  durationDays: number;
  source: string;
}

export type ReputationTag =
  | "頼れるやつ"
  | "粋なやつ"
  | "仕事が早いやつ"
  | "丁寧なやつ"
  | "変なやつ";

export interface PatrolChoice {
  id: "patrol_buckets" | "patrol_alley" | "patrol_roofs";
  label: string;
  description: string;
  effects: {
    trust?: number;
    iki?: number;
    network?: number;
    skill?: number;
    safety?: number;
  };
  rumorTags: RumorTag[];
  resultText: string;
}

export interface PatrolResult {
  choiceId: PatrolChoice["id"];
  resultText: string;
  nextDayText: string;
}

export interface FestivalChoice {
  id: "festival_stalls" | "festival_decor" | "festival_news";
  label: string;
  description: string;
  effects: {
    trust?: number;
    iki?: number;
    network?: number;
    skill?: number;
    trend?: number;
    economy?: number;
  };
  rumorTags: RumorTag[];
  resultText: string;
  favoredReputation?: ReputationTag;
}

export interface FestivalResult {
  choiceId: FestivalChoice["id"];
  resultText: string;
  bonusText: string | null;
  nextDayText: string;
}

export interface FireAftermath {
  choiceId: FireChoice["id"];
  resultText: string;
  fireChiefAssessment: string;
  newsHeadline: string;
  townSummary: string;
  provider: import("./decision/types").DecisionProviderName;
  rumor: import("./decision/types").DecisionRumor;
  rumorStrength: number;
}

export interface FireChoice {
  id: "fire_evacuate" | "fire_bucket" | "fire_report";
  label: string;
  description: string;
  effects: {
    trust?: number;
    iki?: number;
    network?: number;
    skill?: number;
    safety?: number;
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
  /** Day-flavored 小話. Index by day - 1 (clamped). */
  flavor: string[];
}

export interface NPCDef {
  id: NPCId;
  name: string;
}

export interface NPCRelationState {
  affinity: number;
  caution: number;
  familiarity: number;
  attitude: import("./decision/types").NpcAttitude;
}

export type NPCRelations = Record<NPCId, NPCRelationState>;

export interface GameState {
  screen: Screen;
  day: number;
  time: TimeOfDay;
  currentArea: AreaId;
  player: Player;
  town: Town;
  flags: Flags;
  npcRelations: NPCRelations;
  activeRumors: RumorTag[];
  rumorHistory: RumorRecord[];
  reputationTags: ReputationTag[];
  log: string[];
  playerActions: import("./decision/types").PlayerActionRecord[];
  decisionLogs: import("./decision/types").DecisionLogEntry[];
  lastDecision: import("./decision/types").DecisionResult | null;
  fireAftermath: FireAftermath | null;
  dialog: ActiveDialog | null;
  lastJobResult: JobResult | null;
  lastPatrolResult: PatrolResult | null;
  lastFestivalResult: FestivalResult | null;
}
