import type { GameState, NPCId, TownEventDef } from "../types";

export const DAY6_CLEANUP_EVENT: TownEventDef = {
  id: "day6_festival_cleanup",
  day: 6,
  title: "祭りのあと片づけ",
  area: "market",
  targetNpcId: "fishmonger",
  closingText: "祭りが終わっても、町の暮らしは止まらない。もう次の頼みごとがこちらを待っている。",
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
  closingText: "揉めごとが収まれば、井戸端はまたいつもの噂話へ戻る。明日は商店通りが騒がしいらしい。",
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
  closingText: "品薄の一日は乗り切った。今度は火消し小屋から、町を見てほしいと声がかかっている。",
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
  closingText: "火事のない日にも町を守る仕事はある。明日は大家たちが、もっと大きな相談を持ってくるらしい。",
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
  closingText: "流れ者だった自分へ、町のこれからを聞く声が集まった。ここから先は、暮らすだけでなく町をつくる日々になる。",
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


export interface TownEventConsequence {
  townReaction: string;
  npcReactions: Partial<Record<NPCId, string>>;
}

export const TOWN_EVENT_CONSEQUENCES: Record<string, TownEventConsequence> = {
  cleanup_street: { townReaction: "商店通りが早く日常を取り戻し、店先では片づけの手際が話題になっている。", npcReactions: { fishmonger: "昨日は助かったぜ。通りが空いたから、朝から店を開けられた。", newsman: "祭りの翌朝がきれいだと、町の印象まで変わるもんだな。" } },
  cleanup_lost: { townReaction: "返ってきた落とし物の話が人づてに広がり、町で名前を呼ばれる回数が増えた。", npcReactions: { landlord: "落とし物を返して回ったんだって？ そういうことは案外みんな覚えてるよ。", child: "手ぬぐい、ちゃんと戻ったって！ みんな喜んでたよ。" } },
  cleanup_merchants: { townReaction: "店じまいを手伝った商人たちが、次の仕事でも声をかけようと話している。", npcReactions: { fishmonger: "荷運びまで付き合うとはな。次に忙しい時も頼むぜ。", newsman: "商人連中の間じゃ、使える顔役ができたって評判だ。" } },
  well_queue: { townReaction: "井戸端には自然と列ができ、昨日決めた順番が朝の習慣になり始めた。", npcReactions: { landlord: "今朝は怒鳴り声がしないね。昨日の順番、ちゃんと残ってるよ。", child: "今日はみんな並んでる！ 昨日より早いよ。" } },
  well_listen: { townReaction: "井戸端では相手の事情を聞いてから譲る空気が少しだけ残っている。", npcReactions: { landlord: "決まりを押しつけず話を聞いたのが効いたね。", child: "昨日けんかしてた人たち、今日は普通にしゃべってたよ。" } },
  well_carry: { townReaction: "困った時は手の空いた者が桶を持つ、という小さな助け合いが井戸端に生まれた。", npcReactions: { child: "ぼくも桶を運んだよ！ 昨日のたろうみたいに。", landlord: "自分で動くと、周りもつられて動くもんだね。" } },
  market_share: { townReaction: "商店同士で在庫を融通する話が続き、通り全体で商いを回す空気が生まれた。", npcReactions: { fishmonger: "隣の店と融通するなんて前は考えなかった。悪くねえな。", newsman: "一軒の得より通り全体、って話が商人の間で広がってる。" } },
  market_fetch: { townReaction: "河岸とのつながりが増え、商店通りでは新しい仕入れ先の話が飛び交っている。", npcReactions: { fishmonger: "昨日の仕入れ先、次も使えそうだ。足で稼いだ甲斐があったな。", landlord: "商店通りが朝から賑やかだね。あんたが河岸まで走ったそうじゃないか。" } },
  market_limit: { townReaction: "買い占めず分け合う売り方が評判になり、品薄でも険悪にならずに済んでいる。", npcReactions: { fishmonger: "売り切るより行き渡らせる、か。客の顔を見ると正解だったかもな。", newsman: "『品薄でも喧嘩なし』。昨日の記事ならこの見出しだな。" } },
  watch_stoves: { townReaction: "店先では火の始末を互いに声かけするようになり、夜の不安が少し減った。", npcReactions: { firechief: "炭ひとつ見逃さなかったな。町を見る目が育ってきた。", fishmonger: "昨日から火を落とす時、もう一度見るようにしてるぜ。" } },
  watch_routes: { townReaction: "路地の荷物が整理され、町人が逃げ道を意識して通りを使うようになった。", npcReactions: { firechief: "火が出る前に道を空ける。そういう仕事の方が大事なんだ。", landlord: "路地が歩きやすくなったね。火事じゃなくても助かるよ。" } },
  watch_people: { townReaction: "堅い触れではなく世間話から火の用心が広がり、町人同士の声かけが増えた。", npcReactions: { firechief: "命令せずに動かしたか。お前らしいやり方だな。", newsman: "火の用心まで世間話にするとは、粋な広め方だ。" } },
  council_trade: { townReaction: "商いを広げる案が動き始め、期待と同時に安全を心配する声も上がっている。", npcReactions: { fishmonger: "店が増えるなら大歓迎だ。通りをもっと面白くしようぜ。", firechief: "賑わうほど守る場所も増える。そこまで考えて次を決めろ。" } },
  council_safety: { townReaction: "井戸・路地・防火を先に整える方針が共有され、暮らしを守る仕事が増え始めた。", npcReactions: { landlord: "派手じゃなくても、毎日困らない町が一番さ。", firechief: "足元を固める判断は嫌いじゃない。次は実際に動かす番だ。" } },
  council_balance: { townReaction: "商い・安全・祭りを一緒に考える話が町内へ広がり、相談役として頼られ始めた。", npcReactions: { landlord: "みんなの話をつないだね。もう居候の仕事じゃないよ。", fishmonger: "欲張りな案だが、町全体でやるなら乗ってやる。", firechief: "まとめた以上、最後まで面倒を見るんだな。", newsman: "『町の顔役、みんなの案を背負う』。次の見出しは決まったな。" } },
};

export function townEventConsequence(choiceId?: string): TownEventConsequence | null {
  return choiceId ? TOWN_EVENT_CONSEQUENCES[choiceId] ?? null : null;
}

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
