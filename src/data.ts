import type {
  AreaDef,
  DialogLine,
  GameState,
  JobChoice,
  NPCDef,
  NPCId,
  RumorTag,
} from "./types";

export const INITIAL_STATE: GameState = {
  screen: "title",
  day: 1,
  time: "morning",
  currentArea: "nagaya",
  player: {
    money: 0,
    trust: 0,
    iki: 0,
    network: 0,
    skill: 0,
    rank: 1,
    rankName: "流れ者",
  },
  town: {
    hygiene: 45,
    safety: 50,
    trend: 50,
    economy: 50,
  },
  flags: {
    intro_done: false,
    met_landlord: false,
    room_unlocked: false,
    met_fishmonger: false,
    met_child: false,
    met_newsman: false,
    rumor_heard_kumitori: false,
    kumitori_event_started: false,
    kumitori_job_done: false,
    day1_ended: false,
    day2_started: false,
  },
  activeRumors: [],
  log: [],
  dialog: null,
  lastJobResult: null,
};

export const NPCS: Record<NPCId, NPCDef> = {
  landlord: { id: "landlord", name: "大家" },
  fishmonger: { id: "fishmonger", name: "魚屋" },
  child: { id: "child", name: "長屋の子ども" },
  newsman: { id: "newsman", name: "瓦版屋" },
  kumitori_master: { id: "kumitori_master", name: "汲み取り親方" },
};

export const AREAS: Record<AreaDef["id"], AreaDef> = {
  nagaya: {
    id: "nagaya",
    name: "長屋前",
    description:
      "古びた板壁が並ぶ長屋の前。物干しが揺れて、味噌の匂いと魚の生臭さが入り混じる。",
    npcs: ["landlord"],
    exits: ["well", "market", "room"],
    flavor: [
      "どこかの部屋から、ぐずる赤ん坊の声が漏れている。",
      "朝の井戸端会議が、ここまで風に乗って届く。",
    ],
  },
  well: {
    id: "well",
    name: "井戸端",
    description:
      "桶の音と女衆の笑い声が響く井戸端。洗いものの石鹸の匂いと、噂話の匂いが同じくらい濃い。",
    npcs: ["child"],
    exits: ["nagaya", "market"],
    flavor: [
      "誰かの旦那が昨夜どこで飲んでいたか、もう町中にバレているらしい。",
      "井戸の縁に座った猫が、欠伸を一つしてまた寝た。",
    ],
  },
  market: {
    id: "market",
    name: "商店通り",
    description:
      "魚屋、八百屋、瓦版屋。声と荷車と威勢のいい啖呵がぶつかり合う、江戸らしい一角。",
    npcs: ["fishmonger", "newsman"],
    exits: ["nagaya", "well"],
    flavor: [
      "瓦版屋が「号外」と叫ぶたび、犬が一緒に走り出す。",
      "魚屋の前で値切る婆さんと、笑って受け流す若い衆。",
    ],
  },
  room: {
    id: "room",
    name: "長屋の部屋",
    description:
      "畳二枚ほどの薄暗い部屋。荷物と呼べる荷物もないが、屋根があるというのは存外ありがたい。",
    npcs: [],
    exits: ["nagaya"],
    flavor: [
      "壁の節穴から、隣の暮らしの音がそのまま聞こえてくる。",
      "天井板の隅に、前の住人が書いた落書きが残っている。",
    ],
  },
};

export const OPENING_LINES: DialogLine[] = [
  { speaker: "主人公", text: "ここが大江戸町か……人も店も、やけに騒がしいな。" },
  { speaker: "魚屋", text: "へいらっしゃい！ 今朝の魚は跳ねる前から売れてくよ！" },
  {
    speaker: "瓦版屋",
    text: "号外、号外！ 火消し組、掛け声の稽古で隣の団子屋を泣かす！",
  },
  { speaker: "長屋の子ども", text: "どいてどいてー！ 江戸最速ごっこだー！" },
  { speaker: "主人公", text: "……来る町を間違えたかもしれない。" },
];

export const LANDLORD_INTRO_LINES: DialogLine[] = [
  {
    speaker: "大家",
    text: "おや、見ない顔だね。旅人かい、行き倒れかい、それとも厄介ごとの種かい。",
  },
  { speaker: "主人公", text: "できれば一つ目でお願いしたい。" },
  {
    speaker: "大家",
    text: "口だけは達者だね。ちょうど長屋に空き部屋がある。まあ、部屋っていうより物置だけどね。",
  },
  { speaker: "主人公", text: "貸してくれるのか？" },
  {
    speaker: "大家",
    text: "ただし、住むなら町の役に立ちな。ここじゃ、持ちつ持たれつってやつだよ。",
  },
];

export const FISHMONGER_INTRO_LINES: DialogLine[] = [
  {
    speaker: "魚屋",
    text: "おう、見ない顔だな。財布は軽そうだが、腹は減ってそうな顔してるぜ。",
  },
  { speaker: "主人公", text: "顔でそこまでわかるのか。" },
  { speaker: "魚屋", text: "江戸の商売人は目が命よ。で、買うのかい、冷やかしかい？" },
  { speaker: "主人公", text: "今は町を見て回ってるだけだ。" },
  { speaker: "魚屋", text: "なら鼻も使いな。今日はちょいと長屋の方が香ばしいぜ。" },
];

export const CHILD_INTRO_LINES: DialogLine[] = [
  {
    speaker: "長屋の子ども",
    text: "あ、新入りだ！ どこから来たの？ 忍者？ 飛脚？ それとも借金取り？",
  },
  { speaker: "主人公", text: "なぜその三択なんだ。" },
  { speaker: "長屋の子ども", text: "この町、だいたいそのへんが走ってるから！" },
  { speaker: "主人公", text: "江戸ってそういう町なのか……？" },
];

export const NEWSMAN_INTRO_LINES: DialogLine[] = [
  {
    speaker: "瓦版屋",
    text: "お、見ない顔。新入り、迷子、謎の旅人。どれで売り出す？",
  },
  { speaker: "主人公", text: "売り出さないでくれ。" },
  { speaker: "瓦版屋", text: "遠慮するなって。江戸じゃ、噂になってからが一人前よ。" },
  { speaker: "主人公", text: "一人前の基準がおかしい。" },
];

export const KUMITORI_EVENT_LINES: DialogLine[] = [
  { speaker: "大家", text: "ちょうどよかった。あんた、暇だね？" },
  { speaker: "主人公", text: "暇と決めつけるのが早い。" },
  {
    speaker: "大家",
    text: "長屋の汲み取りが遅れててね。親方が腰をやっちまったらしい。",
  },
  { speaker: "主人公", text: "汲み取り……？" },
  { speaker: "長屋の子ども", text: "くさいやつ！" },
  {
    speaker: "大家",
    text: "騒ぐんじゃないよ。こいつは江戸の大事な仕事さ。町を清潔にして、畑の肥やしにもなる。",
  },
  { speaker: "主人公", text: "なるほど、町と外の村をつなぐ仕事でもあるのか。" },
  { speaker: "大家", text: "わかったなら手伝いな。住む場所代わりの初仕事だよ。" },
];

export const NIGHT_LINES: DialogLine[] = [
  { speaker: "大家", text: "今日はもう休みな。明日になりゃ、町もまた別の顔を見せるさ。" },
  { speaker: "主人公", text: "毎日こんなに騒がしいのか？" },
  { speaker: "大家", text: "今日は静かな方だよ。" },
  { speaker: "主人公", text: "……やっぱり来る町を間違えたかもしれない。" },
];

export const ALREADY_MET_LINES: Record<NPCId, DialogLine[]> = {
  landlord: [
    { speaker: "大家", text: "ぼーっと突っ立ってるんじゃないよ。少しは町を見てきな。" },
  ],
  fishmonger: [
    { speaker: "魚屋", text: "また来たのかい。買わねえなら邪魔だぜ……ってのは冗談だ。" },
  ],
  child: [
    { speaker: "長屋の子ども", text: "ねえ、忍者の修行ってさせてくれる？" },
  ],
  newsman: [
    { speaker: "瓦版屋", text: "見出しはまだ書けねえなあ。もう少し転んでくれよ。" },
  ],
  kumitori_master: [
    { speaker: "汲み取り親方", text: "……（腰をさすって唸っている）" },
  ],
};

export const JOB_CHOICES: JobChoice[] = [
  {
    id: "choice_kumitori_fast",
    label: "急いで数をこなす",
    description: "効率重視。銭は多いが、少し雑に見られる。",
    effects: { money: 30, trust: 2, skill: 2, hygiene: 4 },
    rumorTags: ["quick", "funny"],
    resultText:
      "仕事は早かったが、桶を揺らして町人を何人か逃げ回らせた。",
  },
  {
    id: "choice_kumitori_careful",
    label: "丁寧に回る",
    description: "町人への印象と衛生改善を重視する。",
    effects: { money: 20, trust: 4, iki: 1, skill: 2, hygiene: 8 },
    rumorTags: ["helpful", "clean"],
    resultText:
      "新入りにしては丁寧な仕事ぶりで、大家と町人に少し感心された。",
  },
  {
    id: "choice_kumitori_friendly",
    label: "声をかけながら回る",
    description: "人脈と粋を重視する。時間はかかるが顔を覚えられる。",
    effects: { money: 15, trust: 3, iki: 3, network: 2, skill: 1, hygiene: 5 },
    rumorTags: ["iki", "funny", "helpful"],
    resultText:
      "臭い仕事なのに妙に愛想よく回ったせいで、子どもに変なあだ名をつけられた。",
  },
  {
    id: "choice_kumitori_reluctant",
    label: "いやいや引き受ける",
    description: "最低限こなす。報酬はあるが、少し野暮に見られる。",
    effects: { money: 10, trust: 1, iki: -1, skill: 1, hygiene: 2 },
    rumorTags: ["yabo", "funny"],
    resultText:
      "嫌そうな顔は隠せなかったが、逃げなかっただけ少し見直された。",
  },
];

/**
 * Day-2 rumor-reaction dialogues per NPC, keyed by the dominant rumor tag.
 * Priority order for picking a tag: iki → helpful → quick → yabo → funny.
 */
export const RUMOR_REPLIES: Record<NPCId, Partial<Record<RumorTag, DialogLine[]>>> = {
  landlord: {
    helpful: [
      { speaker: "大家", text: "昨日はよくやったね。口だけじゃないってのは、少しわかったよ。" },
    ],
    quick: [
      { speaker: "大家", text: "早いのはいいけどね、江戸じゃ雑な仕事はすぐ噂になるよ。" },
    ],
    iki: [
      { speaker: "大家", text: "妙に愛想を振りまいてたらしいじゃないか。まあ、悪いことじゃないね。" },
    ],
    yabo: [
      { speaker: "大家", text: "嫌そうな顔してたって？ 顔に出すんじゃないよ、野暮だねえ。" },
    ],
    funny: [
      { speaker: "大家", text: "あんた、来た初日から話の種になるとはね。厄介な才能だよ。" },
    ],
  },
  fishmonger: {
    helpful: [
      { speaker: "魚屋", text: "おう、新入り。昨日は長屋の空気をちったあ救ったらしいな。" },
    ],
    quick: [
      { speaker: "魚屋", text: "仕事が早いって聞いたぜ。桶まで飛んでたって話もあるがな。" },
    ],
    iki: [
      { speaker: "魚屋", text: "臭い仕事で愛想よくできるなら、商売人の素質あるぜ。" },
    ],
    yabo: [
      { speaker: "魚屋", text: "嫌々でもやったんなら半人前だ。次は顔も売ってこい。" },
    ],
    funny: [
      { speaker: "魚屋", text: "昨日の話、魚より先に売れそうだぜ。" },
    ],
  },
  child: {
    helpful: [
      { speaker: "長屋の子ども", text: "昨日ありがと！ 長屋がちょっとだけ、ちょっとだけマシ！" },
    ],
    quick: [
      { speaker: "長屋の子ども", text: "桶もって走ってたってほんと？ ぼくもやる！" },
    ],
    iki: [
      { speaker: "長屋の子ども", text: "くさいけどいい人ー！ 今日もなんかする？" },
    ],
    yabo: [
      { speaker: "長屋の子ども", text: "昨日、すっごい変な顔してたね！" },
    ],
    funny: [
      { speaker: "長屋の子ども", text: "ねえねえ、次はもっと変なことして！" },
    ],
  },
  newsman: {
    helpful: [
      { speaker: "瓦版屋", text: "見出しは『謎の新入り、長屋を救う』だな。地味か？ 地味だな。" },
    ],
    quick: [
      { speaker: "瓦版屋", text: "『疾風の汲み取り人』……売れる。いや、売っていいのか？" },
    ],
    iki: [
      { speaker: "瓦版屋", text: "臭い仕事も粋にこなす、か。こいつは江戸向きの見出しだ。" },
    ],
    yabo: [
      { speaker: "瓦版屋", text: "嫌々働く新入り。うーん、見出しとしては弱いな。もっと転べ。" },
    ],
    funny: [
      { speaker: "瓦版屋", text: "あんた、記事にしやすい顔してるよ。いや、行動が。" },
    ],
  },
  kumitori_master: {},
};

export const RUMOR_PRIORITY: RumorTag[] = [
  "iki",
  "helpful",
  "quick",
  "yabo",
  "funny",
];

/** Pick the highest-priority rumor tag the player has earned, or null. */
export function pickDominantRumor(rumors: RumorTag[]): RumorTag | null {
  for (const tag of RUMOR_PRIORITY) {
    if (rumors.includes(tag)) return tag;
  }
  return null;
}
