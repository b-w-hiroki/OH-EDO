import type { GameState, NPCId } from "./types";
import { NPCS } from "./data";

export function npcDisplayName(npc: NPCId): string {
  switch (npc) {
    case "landlord":
      return "おかみさん";
    case "fishmonger":
      return "熊さん";
    case "child":
      return "源太";
    case "newsman":
      return "瓦版屋";
    case "firechief":
      return "火消し頭";
    default:
      return NPCS[npc].name;
  }
}

export function npcSubtitle(npc: NPCId): string {
  switch (npc) {
    case "landlord":
      return "長屋のおかみさん";
    case "fishmonger":
      return "威勢のいい魚屋";
    case "child":
      return "よく遊ぶ子ども";
    case "newsman":
      return "町を駆ける瓦版屋";
    case "firechief":
      return "町火消しの頭";
    default:
      return NPCS[npc].name;
  }
}

export function rumorLabel(tag?: string): string {
  switch (tag) {
    case "helpful":
      return "人助け";
    case "clean":
      return "丁寧な仕事";
    case "iki":
      return "粋な立ち回り";
    case "quick":
      return "手際がいい";
    case "funny":
      return "愉快なやつ";
    case "yabo":
      return "ちょっと野暮";
    default:
      return "町の話題";
  }
}

export function actionTagLabel(tag?: string): string {
  switch (tag) {
    case "helpful":
      return "町の人を手伝った";
    case "clean":
      return "丁寧に仕事をした";
    case "iki":
      return "粋に立ち回った";
    case "quick":
      return "手早く片づけた";
    case "funny":
      return "町を笑わせた";
    case "yabo":
      return "少し不器用に動いた";
    default:
      return "町でひと仕事した";
  }
}

export function fiveDayHook(state: GameState): string {
  if (state.player.rank >= 5) {
    return "祭りが終わる前から、次の揉めごとを『たろうに聞こう』という声が上がっている。";
  }
  if (state.reputationTags.includes("頼れるやつ")) {
    return "祭りの片づけが始まるそばから、次の頼みごとを持った町人がこちらを探している。";
  }
  if (state.reputationTags.includes("粋なやつ")) {
    return "瓦版屋が、次は祭りの外で起きる話を一緒に追おうと手招きしている。";
  }
  return "五日で町はずいぶん近くなった。明日もまた、誰かがこちらを呼び止めそうだ。";
}

function hasMetNpc(state: GameState, npc: NPCId): boolean {
  switch (npc) {
    case "landlord":
      return state.flags.met_landlord;
    case "fishmonger":
      return state.flags.met_fishmonger;
    case "child":
      return state.flags.met_child;
    case "newsman":
      return state.flags.met_newsman;
    case "firechief":
      return state.flags.met_firechief;
    default:
      return false;
  }
}

export function isNpcKnown(state: GameState, npc: NPCId): boolean {
  const relation = state.npcRelations[npc];
  return (
    relation.familiarity >= 3 ||
    relation.affinity >= 2 ||
    relation.attitude === "friendly" ||
    relation.attitude === "impressed" ||
    (state.day >= 5 && hasMetNpc(state, npc))
  );
}

export function relationLabel(
  attitude: GameState["npcRelations"][NPCId]["attitude"]
): string {
  switch (attitude) {
    case "friendly":
      return "仲良し";
    case "impressed":
      return "頼られてる";
    case "cautious":
      return "気にされてる";
    case "annoyed":
      return "ちょっと苦手";
    default:
      return "はじめて";
  }
}

export function relationMemoryLabel(state: GameState, npc: NPCId): string {
  const relation = state.npcRelations[npc];
  if (state.day >= 5 && hasMetNpc(state, npc)) return "顔なじみ";
  if (relation.familiarity >= 5 || relation.affinity >= 5) return "町の顔なじみ";
  if (isNpcKnown(state, npc)) return "覚えられてる";
  return relationLabel(relation.attitude);
}
