import type { GameState, TownEventDef } from "../types";

export const DAY6_CLEANUP_EVENT: TownEventDef = {
  id: "day6_festival_cleanup",
  title: "祭りのあと片づけ",
  area: "market",
  intro: [
    { speaker: "魚屋", text: "祭りが終わったら終わり、って顔してるな？ 甘い甘い。" },
    { speaker: "瓦版屋", text: "通りは紙くず、空箱、忘れ物。祭りの翌朝がいちばん町らしいんだ。" },
    { speaker: "大家", text: "たろう、今度は見物じゃないよ。どこから手をつける？" },
  ],
  choices: [
    {
      id: "cleanup_street",
      label: "通りを片づける",
      description: "みんなが歩けるよう、紙くずと空箱を集める。",
      effects: { trust: 2, skill: 1, hygiene: 5 },
      rumorTags: ["clean", "helpful"],
      resultText: "通りを端から片づけ、昼前にはいつもの商店通りが戻ってきた。",
    },
    {
      id: "cleanup_lost",
      label: "落とし物を持ち主へ返す",
      description: "祭りの忘れ物を聞いて回り、人づてに持ち主を探す。",
      effects: { trust: 2, network: 3, iki: 1 },
      rumorTags: ["helpful", "iki"],
      resultText: "巾着や手ぬぐいをひとつずつ持ち主へ戻し、名前を呼ばれる回数がまた増えた。",
    },
    {
      id: "cleanup_merchants",
      label: "店じまいを手伝う",
      description: "屋台や店の荷をまとめ、商人たちの片づけを手伝う。",
      effects: { money: 10, network: 2, skill: 2, economy: 3 },
      rumorTags: ["quick", "helpful"],
      resultText: "熊さんたちと荷を運び、通りの店じまいを手早く終わらせた。",
    },
  ],
};

export const TOWN_EVENTS: Record<string, TownEventDef> = {
  [DAY6_CLEANUP_EVENT.id]: DAY6_CLEANUP_EVENT,
};

export function nextTownEvent(state: GameState): TownEventDef | null {
  if (
    state.day === 5 &&
    state.flags.festival_done &&
    !state.flags.day6_started &&
    !state.flags.day6_cleanup_done
  ) {
    return DAY6_CLEANUP_EVENT;
  }
  return null;
}
