import type { GameState, TownEventDef } from "../types";

export const DAY6_CLEANUP_EVENT: TownEventDef = {
  id: "day6_festival_cleanup",
  day: 6,
  title: "祭りのあと片づけ",
  area: "market",
  targetNpcId: "fishmonger",
  closingText: "祭りが終わっても、町の暮らしは止まらない。もう次の頼みごとがこちらを待っている。"
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

export const DAY7_WELL_EVENT: TownEventDef = {
  id: "day7_well_order",
  day: 7,
  title: "井戸端の順番騒ぎ",
  area: "well",
  targetNpcId: "child",
  closingText: "揉めごとが収まれば、井戸端はまたいつもの噂話へ戻る。明日は商店通りが騒がしいらしい。"
  intro: [
    { speaker: "長屋の子ども", text: "たいへん！ 井戸の前でみんな怒ってる！" },
    { speaker: "大家", text: "洗い物と水汲みが重なってね。誰が先だで朝から大騒ぎさ。" },
    { speaker: "主人公", text: "火事じゃないのに、ずいぶん熱いな。" },
  ],
  choices: [
    {
      id: "well_queue",
      label: "順番を決める",
      description: "並ぶ場所を決めて、急ぐ人から短時間で回す。",
      effects: { trust: 3, skill: 1, hygiene: 2 },
      rumorTags: ["clean", "quick"],
      resultText: "桶の列を作り、朝の混雑は思ったより早く収まった。",
    },
    {
      id: "well_listen",
      label: "まず話を聞く",
      description: "揉めている双方の事情を聞き、互いに譲れるところを探す。",
      effects: { trust: 2, network: 3, iki: 1 },
      rumorTags: ["helpful", "iki"],
      resultText: "言い分をひとつずつ聞いたら、怒鳴り合いはいつの間にか井戸端話へ戻っていた。",
    },
    {
      id: "well_carry",
      label: "自分で水を運ぶ",
      description: "急ぎの家へ水を運び、詰まりそのものを減らす。",
      effects: { trust: 3, skill: 2, hygiene: 3 },
      rumorTags: ["helpful", "quick"],
      resultText: "何往復かするうちに列がほどけ、最後には子どもまで桶運びを真似し始めた。",
    },
  ],
};

export const DAY8_MARKET_EVENT: TownEventDef = {
  id: "day8_market_shortage",
  day: 8,
  title: "商店通りの品不足",
  area: "market",
  targetNpcId: "fishmonger",
  closingText: "品薄の一日は乗り切った。今度は火消し小屋から、町を見てほしいと声がかかっている。"
  intro: [
    { speaker: "魚屋", text: "祭りで売れすぎた。魚も野菜も、今日は入ってくる量が少ねえ。" },
    { speaker: "瓦版屋", text: "品薄って書けば客はもっと来る。商売ってのは不思議だな。" },
    { speaker: "主人公", text: "煽る前に、今日の店を回す方法を考えよう。" },
  ],
  choices: [
    {
      id: "market_share",
      label: "店同士で融通する",
      description: "余っている品と足りない品を店同士で交換する。",
      effects: { trust: 3, network: 3, economy: 3 },
      rumorTags: ["helpful", "clean"],
      resultText: "店ごとの余りを回したことで、通り全体は何とか一日を乗り切った。",
    },
    {
      id: "market_fetch",
      label: "河岸まで走る",
      description: "足を使って追加の仕入れを探しに行く。",
      effects: { money: 15, skill: 2, economy: 4 },
      rumorTags: ["quick", "helpful"],
      resultText: "河岸を走り回って少量の仕入れを確保し、熊さんが大声で礼を言った。",
    },
    {
      id: "market_limit",
      label: "売り方を工夫する",
      description: "一人あたりの量を抑え、できるだけ多くの客へ行き渡らせる。",
      effects: { trust: 2, iki: 2, economy: 2, trend: 2 },
      rumorTags: ["iki", "clean"],
      resultText: "売り切れを急がず小分けにしたことで、昼過ぎまで通りに品が残った。",
    },
  ],
};

export const DAY9_FIREHOUSE_EVENT: TownEventDef = {
  id: "day9_firehouse_watch",
  day: 9,
  title: "祭り明けの町内警戒",
  area: "firehouse",
  targetNpcId: "firechief",
  closingText: "火事のない日にも町を守る仕事はある。明日は大家たちが、もっと大きな相談を持ってくるらしい。"
  intro: [
    { speaker: "火消し頭", text: "祭りのあとは気が緩む。火より怖いのは『もう大丈夫』って顔だ。" },
    { speaker: "主人公", text: "今日は何を見る？" },
    { speaker: "火消し頭", text: "お前が決めろ。町を見る目があるか、そろそろ試す。" },
  ],
  choices: [
    {
      id: "watch_stoves",
      label: "店の火元を見て回る",
      description: "商店通りの竈や炭の始末を確認する。",
      effects: { trust: 2, skill: 3, safety: 5 },
      rumorTags: ["clean", "helpful"],
      resultText: "消したつもりの炭をひとつ見つけ、熊さんたちと念入りに火の始末をした。",
    },
    {
      id: "watch_routes",
      label: "逃げ道を確認する",
      description: "荷物や屋台跡で塞がれた路地がないか見て回る。",
      effects: { trust: 3, network: 1, safety: 4 },
      rumorTags: ["helpful", "quick"],
      resultText: "細い路地の荷をどかし、火消し頭が『前より町が見えてる』と頷いた。",
    },
    {
      id: "watch_people",
      label: "町人へ声をかける",
      description: "火の用心を押しつけず、世間話のついでに伝えて回る。",
      effects: { iki: 3, network: 2, safety: 3 },
      rumorTags: ["iki", "helpful"],
      resultText: "堅い注意ではなく世間話で伝えたせいか、町人たちは素直に火元を見直した。",
    },
  ],
};

export const DAY10_COUNCIL_EVENT: TownEventDef = {
  id: "day10_town_council",
  day: 10,
  title: "町内の大きな相談",
  area: "nagaya",
  targetNpcId: "landlord",
  closingText: "流れ者だった自分へ、町のこれからを聞く声が集まった。ここから先は、暮らすだけでなく町をつくる日々になる。"
  intro: [
    { speaker: "大家", text: "たろう、ちょっと座りな。今日は雑用じゃないよ。" },
    { speaker: "魚屋", text: "商店通りをもっと賑やかにしたい。" },
    { speaker: "火消し頭", text: "人を増やすなら安全も考えろ。" },
    { speaker: "瓦版屋", text: "面白くなってきた。で、町の顔役はどう思う？" },
  ],
  choices: [
    {
      id: "council_trade",
      label: "商いを優先する",
      description: "店と客を増やし、町の稼ぎを伸ばす方向を推す。",
      effects: { network: 2, economy: 6, trend: 2 },
      rumorTags: ["quick", "iki"],
      resultText: "商いを増やす案が動き始めた。熊さんは喜び、火消し頭は『安全も忘れるな』と釘を刺した。",
    },
    {
      id: "council_safety",
      label: "暮らしと安全を優先する",
      description: "井戸・路地・防火を整え、住みやすさを先に固める。",
      effects: { trust: 4, safety: 5, hygiene: 3 },
      rumorTags: ["clean", "helpful"],
      resultText: "派手さより暮らしを選んだ。大家と火消し頭は頷き、瓦版屋は『地味だが長持ちする』と書き留めた。",
    },
    {
      id: "council_balance",
      label: "みんなの案をつなぐ",
      description: "商い・安全・祭りを一つの町づくりとしてまとめる。",
      effects: { trust: 3, iki: 3, network: 3, safety: 2, economy: 2, trend: 2 },
      rumorTags: ["iki", "helpful"],
      resultText: "誰か一人の案ではなく、町全体で少しずつ進める話にまとまった。今度は誰も『新入り』とは呼ばなかった。",
    },
  ],
};

export const TOWN_EVENT_LIST: TownEventDef[] = [
  DAY6_CLEANUP_EVENT,
  DAY7_WELL_EVENT,
  DAY8_MARKET_EVENT,
  DAY9_FIREHOUSE_EVENT,
  DAY10_COUNCIL_EVENT,
];

export const TOWN_EVENTS: Record<string, TownEventDef> = Object.fromEntries(
  TOWN_EVENT_LIST.map((event) => [event.id, event])
);

export function nextTownEvent(state: GameState): TownEventDef | null {
  if (state.day < 5 || !state.flags.festival_done) return null;
  return (
    TOWN_EVENT_LIST.find(
      (event) =>
        event.day >= state.day &&
        !state.completedTownEventIds.includes(event.id)
    ) ?? null
  );
}
