import type {
  AreaId,
  ChapterEventChoice,
  ChapterEventResult,
  DialogLine,
  GameState,
  NPCId,
} from "../types";

export interface TownEventDefinition {
  id: string;
  day: number;
  area: AreaId;
  triggerNpc: NPCId;
  title: string;
  prompt: string;
  intro: DialogLine[];
  choices: ChapterEventChoice[];
  nextDayText: string;
  townResponse: (choice: ChapterEventChoice, state: GameState) => string;
}

export const CHAPTER_TWO_EVENTS: TownEventDefinition[] = [
  {
    id: "day6_cleanup",
    day: 6,
    area: "market",
    triggerNpc: "fishmonger",
    title: "祭りのあと片づけ",
    prompt: "祭りの熱が残る商店通り。どこから手をつける？",
    intro: [
      { speaker: "魚屋", text: "祭りが終わりゃ、残るのは売上とごみだ。たろう、手ぇ貸せ。" },
      { speaker: "主人公", text: "顔役ってのは後片づけまでやるのか。" },
      { speaker: "魚屋", text: "祭りのあとまで面倒見てこそ町のもんだ。好きなところから頼む。" },
    ],
    choices: [
      {
        id: "cleanup_stalls",
        label: "屋台の片づけを手伝う",
        description: "商人と一緒に荷をまとめ、通りを早く空ける。",
        effects: { trust: 2, network: 2, economy: 2 },
        rumorTags: ["helpful", "quick"],
        resultText: "店主たちと声を掛け合い、通りの屋台を手早く畳んだ。",
      },
      {
        id: "cleanup_trash",
        label: "ごみを拾って通りを整える",
        description: "目立たない仕事を丁寧に片づける。",
        effects: { trust: 3, skill: 1, hygiene: 5 },
        rumorTags: ["clean", "helpful"],
        resultText: "紙くずや割れた串を拾い、祭り前より通りをきれいにした。",
      },
      {
        id: "cleanup_lost",
        label: "落とし物を持ち主へ返す",
        description: "人に声をかけながら、忘れ物を町へ戻す。",
        effects: { network: 3, iki: 1, trend: 1 },
        rumorTags: ["iki", "helpful"],
        resultText: "小銭入れや手ぬぐいを一つずつ持ち主へ返し、また名前を覚えられた。",
      },
    ],
    nextDayText: "七日目の朝、祭りの後始末まで見ていた町人の目が少し変わっていた。",
    townResponse: (choice) =>
      choice.id === "cleanup_trash"
        ? "井戸端では『派手な祭りのあとに黙って掃除してた』と評判になっている。"
        : choice.id === "cleanup_lost"
          ? "商店通りでは『落とし物まで戻すとは気が利く』と話が広がっている。"
          : "店主たちは『最後まで付き合うやつだ』と、少し誇らしげに話している。",
  },
  {
    id: "day7_well_dispute",
    day: 7,
    area: "well",
    triggerNpc: "child",
    title: "井戸端の順番",
    prompt: "水汲みの順番をめぐって、近所同士が言い合いになっている。",
    intro: [
      { speaker: "長屋の子ども", text: "たろう、たいへん！ 井戸の順番で大人がずっと喧嘩してる！" },
      { speaker: "主人公", text: "子どもが呼びに来る時点で嫌な予感しかしない。" },
      { speaker: "長屋の子ども", text: "みんな、たろうなら何とかするって！" },
    ],
    choices: [
      {
        id: "well_listen",
        label: "両方の言い分を聞く",
        description: "時間はかかるが、まず事情を整理する。",
        effects: { trust: 3, network: 2 },
        rumorTags: ["helpful", "clean"],
        resultText: "どちらの家にも事情があり、順番より困っている時間帯を分ける方がよいと分かった。",
      },
      {
        id: "well_rule",
        label: "順番を紙に書いて決める",
        description: "曖昧さを減らし、揉めにくい形を作る。",
        effects: { trust: 2, skill: 2, hygiene: 2 },
        rumorTags: ["clean", "quick"],
        resultText: "朝夕で使う家を分けた簡単な順番表を作り、井戸端の声が少し静かになった。",
      },
      {
        id: "well_joke",
        label: "笑い話にして空気を変える",
        description: "正面から決めず、場を和ませて譲り合いを促す。",
        effects: { iki: 3, network: 1 },
        rumorTags: ["funny", "iki"],
        resultText: "誰が一番長く井戸端でしゃべっているかという話にすり替え、全員が笑って一度引いた。",
      },
    ],
    nextDayText: "八日目。井戸端では、昨日の揉めごとより『どう収めたか』の方が話題になっていた。",
    townResponse: (choice) =>
      choice.id === "well_joke"
        ? "井戸端では『喧嘩を笑い話に変えた』と、本人たちまで笑っている。"
        : choice.id === "well_rule"
          ? "井戸の脇には簡単な順番書きが残り、朝の渋滞が減っている。"
          : "近所同士が少し気まずそうに、それでも昨日より穏やかに水を汲んでいる。",
  },
  {
    id: "day8_market_shortage",
    day: 8,
    area: "market",
    triggerNpc: "fishmonger",
    title: "品不足の商店通り",
    prompt: "仕入れが遅れ、いくつかの店で品物が足りない。どう動く？",
    intro: [
      { speaker: "魚屋", text: "今日は荷が遅い。うちだけじゃねえ、八百屋も困ってる。" },
      { speaker: "主人公", text: "祭りの次は品不足か。この町、休ませる気がないな。" },
      { speaker: "瓦版屋", text: "だから毎日記事になるんだよ。" },
    ],
    choices: [
      {
        id: "market_share",
        label: "店同士で在庫を融通する",
        description: "人脈を使って、足りない店へ回せる品を探す。",
        effects: { trust: 3, network: 3, economy: 4 },
        rumorTags: ["helpful", "iki"],
        resultText: "余っている店と足りない店をつなぎ、商店通り全体で品不足をしのいだ。",
      },
      {
        id: "market_notice",
        label: "品切れを正直に知らせる",
        description: "無理に売らず、入荷時間と代替品を丁寧に伝える。",
        effects: { trust: 3, skill: 1, trend: 1 },
        rumorTags: ["clean", "helpful"],
        resultText: "入荷待ちを隠さず伝えたことで、客は意外と納得して別の店へ流れた。",
      },
      {
        id: "market_hype",
        label: "瓦版屋と代替品を売り込む",
        description: "ない物より、ある物を面白く見せる。",
        effects: { iki: 2, network: 2, trend: 4, economy: 2 },
        rumorTags: ["funny", "quick", "iki"],
        resultText: "瓦版屋の口上で『今日はこれが旬』と別の商品を売り込み、通りの勢いを落とさずに済んだ。",
      },
    ],
    nextDayText: "九日目。商人たちは昨日の立ち回りを覚え、相談の声が以前より自然に飛んでくる。",
    townResponse: (choice) =>
      choice.id === "market_hype"
        ? "瓦版には『品不足すら売り文句に変える』と大げさな見出しが踊っている。"
        : choice.id === "market_notice"
          ? "客から『正直な店が増えた』という声が出て、商店通りの空気が少し柔らかい。"
          : "店主同士が品を回し合う姿が増え、通り全体がひとつの店のように動いている。",
  },
  {
    id: "day9_firehouse_watch",
    day: 9,
    area: "firehouse",
    triggerNpc: "firechief",
    title: "祭礼あとの火の用心",
    prompt: "人通りが落ち着いた後こそ火の用心。どこを見る？",
    intro: [
      { speaker: "火消し頭", text: "祭りが終わったからって気を抜くな。疲れた時ほど火は出る。" },
      { speaker: "主人公", text: "今度は何を見ればいい。" },
      { speaker: "火消し頭", text: "町を見ろ。前より見えるものが増えてるはずだ。" },
    ],
    choices: [
      {
        id: "watch_kitchens",
        label: "店の火元を見て回る",
        description: "商店のかまどや炭を確認する。",
        effects: { trust: 2, skill: 2, safety: 5 },
        rumorTags: ["clean", "helpful"],
        resultText: "閉店後の店を回り、消し忘れた炭と危ない油皿を見つけた。",
      },
      {
        id: "watch_routes",
        label: "人の逃げ道を確認する",
        description: "路地や荷物の位置を見て、火事の時の流れを想像する。",
        effects: { iki: 2, skill: 2, safety: 4 },
        rumorTags: ["iki", "quick"],
        resultText: "祭り道具が残る路地を見つけ、火事の前に通り道を空けた。",
      },
      {
        id: "watch_neighbors",
        label: "町人へ火の用心を声かけする",
        description: "一軒ずつ顔を見ながら注意を促す。",
        effects: { trust: 3, network: 2, safety: 3 },
        rumorTags: ["helpful", "iki"],
        resultText: "一軒ずつ声をかけると、町人の方から危ない場所を教えてくれるようになった。",
      },
    ],
    nextDayText: "十日目。火消し頭はもう手伝いではなく、町を任せる相手のように話す。",
    townResponse: (choice) =>
      choice.id === "watch_neighbors"
        ? "町人たちの方から『ここも見てくれ』と声が上がり、火の用心が町全体へ広がっている。"
        : choice.id === "watch_routes"
          ? "路地の祭り道具が片づき、歩きやすくなった道を火消したちが確認している。"
          : "商店通りでは昨日見つけた危ない火元の話が伝わり、店主たちが早めに炭を落としている。",
  },
  {
    id: "day10_town_council",
    day: 10,
    area: "nagaya",
    triggerNpc: "landlord",
    title: "町内の大相談",
    prompt: "町の金をどこへ使うか。みんなの意見が割れている。",
    intro: [
      { speaker: "大家", text: "たろう、座りな。今日は手伝いじゃなく相談だよ。" },
      { speaker: "魚屋", text: "商店通りを直しゃ客が増える。" },
      { speaker: "火消し頭", text: "先に防火だ。焼けたら商いも何もねえ。" },
      { speaker: "瓦版屋", text: "井戸も狭い。揉める前に手を入れた方が記事にならん。" },
      { speaker: "主人公", text: "つまり、どれも間違ってないから面倒なんだな。" },
      { speaker: "大家", text: "そういうこと。町の顔なら、選ぶだけじゃなく納得させな。" },
    ],
    choices: [
      {
        id: "council_safety",
        label: "防火を優先する",
        description: "大事が起きないための備えを先にする。",
        effects: { trust: 3, safety: 7, skill: 1 },
        rumorTags: ["clean", "helpful"],
        resultText: "防火桶と路地の整備を優先し、商人には『焼けなければ商いは続く』と頭を下げた。",
      },
      {
        id: "council_market",
        label: "商店通りを整える",
        description: "景気を回し、その利益を次の整備へつなげる。",
        effects: { network: 3, economy: 6, trend: 2 },
        rumorTags: ["quick", "iki"],
        resultText: "商店通りの修繕を先に決め、増えた稼ぎから次の町普請へ回す約束を取った。",
      },
      {
        id: "council_well",
        label: "井戸端を整える",
        description: "毎日の暮らしに近い場所から手を入れる。",
        effects: { trust: 4, hygiene: 5, network: 2 },
        rumorTags: ["helpful", "clean"],
        resultText: "井戸まわりの整備を選び、毎日使う場所を先に良くすることで町内の納得を集めた。",
      },
    ],
    nextDayText: "相談が終わると、誰も『新入り』とは呼ばなかった。次からは、町の決め事にも名前が入る。",
    townResponse: (choice, state) => {
      const rank = state.player.rankName;
      if (choice.id === "council_market") return `${rank}として、商いを回して次へつなぐ判断が町内に残った。`;
      if (choice.id === "council_well") return `${rank}として、暮らしに近い場所を優先する判断が町内に残った。`;
      return `${rank}として、大事が起きないための備えを優先する判断が町内に残った。`;
    },
  },
];

export function eventForDay(day: number): TownEventDefinition | null {
  return CHAPTER_TWO_EVENTS.find((event) => event.day === day) ?? null;
}

export function eventById(id: string | null): TownEventDefinition | null {
  if (!id) return null;
  return CHAPTER_TWO_EVENTS.find((event) => event.id === id) ?? null;
}

export function makeChapterResult(
  event: TownEventDefinition,
  choice: ChapterEventChoice,
  state: GameState
): ChapterEventResult {
  return {
    eventId: event.id,
    choiceId: choice.id,
    resultText: choice.resultText,
    townResponse: event.townResponse(choice, state),
    nextDayText: event.nextDayText,
  };
}
