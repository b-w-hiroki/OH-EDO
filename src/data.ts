import type {
  AreaDef,
  DialogLine,
  GameState,
  JobChoice,
  FireChoice,
  PatrolChoice,
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
    met_firechief: false,
    firehouse_unlocked: false,
    rumor_heard_kumitori: false,
    kumitori_event_started: false,
    kumitori_job_done: false,
    day1_ended: false,
    day2_started: false,
    fire_intro_started: false,
    fire_event_done: false,
    day3_started: false,
    patrol_started: false,
    patrol_done: false,
    day4_started: false,
  },
  npcRelations: {
    landlord: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
    fishmonger: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
    child: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
    newsman: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
    firechief: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
    kumitori_master: { affinity: 0, caution: 0, familiarity: 0, attitude: "neutral" },
  },
  activeRumors: [],
  rumorHistory: [],
  reputationTags: [],
  log: [],
  playerActions: [],
  decisionLogs: [],
  lastDecision: null,
  fireAftermath: null,
  dialog: null,
  lastJobResult: null,
  lastPatrolResult: null,
};

export const NPCS: Record<NPCId, NPCDef> = {
  landlord: { id: "landlord", name: "大家" },
  fishmonger: { id: "fishmonger", name: "魚屋" },
  child: { id: "child", name: "長屋の子ども" },
  newsman: { id: "newsman", name: "瓦版屋" },
  firechief: { id: "firechief", name: "火消し頭" },
  kumitori_master: { id: "kumitori_master", name: "汲み取り親方" },
};

export const AREAS: Record<AreaDef["id"], AreaDef> = {
  nagaya: {
    id: "nagaya",
    name: "長屋前",
    description:
      "古びた板壁が並ぶ長屋の前。物干しが揺れて、味噌の匂いと魚の生臭さが入り混じる。",
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
    flavor: [
      "瓦版屋が「号外」と叫ぶたび、犬が一緒に走り出す。",
      "魚屋の前で値切る婆さんと、笑って受け流す若い衆。",
    ],
  },
  firehouse: {
    id: "firehouse",
    name: "火消し小屋",
    description:
      "纏と鳶口、桶が整然と並ぶ町火消しの詰所。威勢のいい掛け声と木の匂いがする。",
    flavor: [
      "若い衆が纏の扱いを何度も繰り返している。",
      "昨日の小火の話を肴に、火消したちが笑っている。",
    ],
  },
  room: {
    id: "room",
    name: "長屋の部屋",
    description:
      "畳二枚ほどの薄暗い部屋。荷物と呼べる荷物もないが、屋根があるというのは存外ありがたい。",
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

export const FIRECHIEF_INTRO_LINES: DialogLine[] = [
  { speaker: "火消し頭", text: "昨日の新入りってのは、お前か。" },
  { speaker: "主人公", text: "たぶん、その呼ばれ方をしているのは俺だ。" },
  { speaker: "火消し頭", text: "火事場じゃ腕より先に、周りを見る目が要る。昨日は悪くなかった。" },
  { speaker: "主人公", text: "褒められてるのか？" },
  { speaker: "火消し頭", text: "半分な。残り半分は次も見てから決める。暇なら小屋に顔を出せ。" },
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
  firechief: [
    { speaker: "火消し頭", text: "町を守るのは派手さじゃねえ。次に備えて道具を見とけ。" },
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
  firechief: {
    helpful: [{ speaker: "火消し頭", text: "町の連中を助けるのは悪くねえ。だが火事場じゃ自分の身も守れ。" }],
    quick: [{ speaker: "火消し頭", text: "速さは武器だ。だが火はもっと速い。先を読め。" }],
    iki: [{ speaker: "火消し頭", text: "気が利くじゃねえか。そういうのは火事場で助かる。" }],
    funny: [{ speaker: "火消し頭", text: "笑い話で済むうちはいい。火だけは笑ってくれねえぞ。" }],
    clean: [{ speaker: "火消し頭", text: "後始末まで見るやつは信用できる。覚えとく。" }],
    yabo: [{ speaker: "火消し頭", text: "野暮でも動けりゃまだいい。次は周りを見ろ。" }],
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


export const RUMOR_AREA_ECHOES: Partial<
  Record<RumorTag, Partial<Record<AreaDef["id"], string>>>
> = {
  helpful: {
    nagaya: "長屋では『新入り、思ったより役に立つね』と話題になっている。",
    well: "井戸端では、長屋の空気が少しマシになったと噂されている。",
    market: "商店通りでは、昨日の丁寧な働きぶりを魚屋が得意げに話している。",
  },
  clean: {
    nagaya: "長屋の軒先で『今日はちょっと匂いが違うね』と声が上がる。",
    well: "井戸端では、衛生の話から昨日の新入りの仕事ぶりへ話が移っている。",
    market: "魚屋が『仕事は地味でも町は助かる』と客に話している。",
  },
  iki: {
    nagaya: "子どもたちが、昨日の新入りに勝手なあだ名をつけて呼んでいる。",
    well: "井戸端では『臭い仕事でも愛想がいい』と笑い話になっている。",
    market: "瓦版屋が『臭い仕事も粋にこなす』という見出しを考えている。",
  },
  quick: {
    nagaya: "長屋では『あんな勢いで桶を運ぶやつは初めてだ』と笑われている。",
    well: "井戸端では、昨日の仕事の速さと雑さが半々で語られている。",
    market: "商店通りでは『疾風の汲み取り人』という妙な呼び名が広まりつつある。",
  },
  yabo: {
    nagaya: "長屋では『嫌そうな顔はしてたけど逃げなかった』と評されている。",
    well: "井戸端では『あの新入り、顔に出すねえ』と少しからかわれている。",
    market: "瓦版屋は『もっと派手な失敗なら記事になったのに』と残念そうだ。",
  },
  funny: {
    nagaya: "子どもたちは昨日の騒ぎを何度も再現して笑っている。",
    well: "井戸端では、事実より少し盛られた話になっている。",
    market: "瓦版屋が、昨日の出来事を面白おかしく話して客を集めている。",
  },
};

export function getRumorAreaEcho(
  rumor: RumorTag | null,
  area: AreaDef["id"]
): string | null {
  if (!rumor) return null;
  return RUMOR_AREA_ECHOES[rumor]?.[area] ?? null;
}


export const FIRE_INTRO_LINES: DialogLine[] = [
  { speaker: "長屋の子ども", text: "火だー！ ……じゃなくて、煙だー！" },
  { speaker: "主人公", text: "どっちにしても騒ぐには十分だな。" },
  { speaker: "大家", text: "裏手の物置から煙が出てる。火消し組が来るまで、町内でできることをやるよ！" },
  { speaker: "魚屋", text: "桶ならある！ 走れるやつは井戸へ！" },
  { speaker: "瓦版屋", text: "書いてる場合じゃねえな。……いや、あとで書くけどよ！" },
  { speaker: "大家", text: "新入り、昨日みたいに町の役に立てるかい？" },
];

export const FIRE_CHOICES: FireChoice[] = [
  {
    id: "fire_evacuate",
    label: "声を張って避難を手伝う",
    description: "人を動かす。安全確保と人脈を優先する。",
    effects: { trust: 3, network: 2, safety: 4 },
    rumorTags: ["helpful", "iki"],
    resultText: "大声で長屋中を回り、子どもと年寄りを先に外へ出した。",
  },
  {
    id: "fire_bucket",
    label: "桶を運んで消火を手伝う",
    description: "体を動かして現場を支える。腕前と安全を優先する。",
    effects: { trust: 2, skill: 2, safety: 6 },
    rumorTags: ["helpful", "quick"],
    resultText: "井戸と物置を何度も往復し、火消し組が来るまで延焼を抑えた。",
  },
  {
    id: "fire_report",
    label: "煙の出どころを確かめて伝える",
    description: "むやみに飛び込まず、状況を見て火消し組へ伝える。",
    effects: { trust: 2, iki: 2, safety: 5 },
    rumorTags: ["iki", "helpful"],
    resultText: "風向きと煙の出どころを確かめ、火消し組に手短に伝えた。",
  },
];


export const FIRE_RUMOR_REPLIES: Record<
  NPCId,
  Partial<Record<RumorTag, DialogLine[]>>
> = {
  landlord: {
    helpful: [{ speaker: "大家", text: "昨日はよく動いたね。火事場じゃ、周りを見て動けるやつが一番助かるんだよ。" }],
    quick: [{ speaker: "大家", text: "桶を持って飛び回ってたそうじゃないか。勢いだけで転ばなかったのは上出来だよ。" }],
    iki: [{ speaker: "大家", text: "慌てず役目を見つけたって？ そういうのを少しずつ『粋』って言うんだよ。" }],
    funny: [{ speaker: "大家", text: "火事場でまで話の種を作るとはね。あんた、妙な才能があるよ。" }],
    clean: [{ speaker: "大家", text: "火の始末まで丁寧だったって聞いたよ。地味でも、そういう仕事が町を守るんだ。" }],
    yabo: [{ speaker: "大家", text: "火事場で野暮は命取りだよ。次はもっと周りを見な。" }],
  },
  fishmonger: {
    helpful: [{ speaker: "魚屋", text: "昨日は助かったぜ。魚より先に町を守る日もあるってこった。" }],
    quick: [{ speaker: "魚屋", text: "桶の往復、見てたぜ。あの速さなら魚河岸でも使えるな！" }],
    iki: [{ speaker: "魚屋", text: "火事場で騒がず役目を見つける。へえ、新入りにしちゃ粋じゃねえか。" }],
    funny: [{ speaker: "魚屋", text: "瓦版屋が昨日の騒ぎを三割増しで話してやがる。お前、いい商売道具だな。" }],
    clean: [{ speaker: "魚屋", text: "後始末まで抜かりなかったって？ 仕事ってのはそこまでやって一人前よ。" }],
    yabo: [{ speaker: "魚屋", text: "次は火より先に顔を引き締めろ。町の連中はよく見てるぜ。" }],
  },
  child: {
    helpful: [{ speaker: "長屋の子ども", text: "昨日かっこよかった！ ぼくも大きくなったら桶持つ！" }],
    quick: [{ speaker: "長屋の子ども", text: "すっごい速かった！ でも水こぼしてた！ ちょっとだけ！" }],
    iki: [{ speaker: "長屋の子ども", text: "火のとき落ち着いてた！ なんか大人っぽかった！" }],
    funny: [{ speaker: "長屋の子ども", text: "昨日の真似してるの！ えいっ、火事だー！ ……怒られた！" }],
    clean: [{ speaker: "長屋の子ども", text: "あと片づけもしたんだって？ えらい！ ぼくはしない！" }],
    yabo: [{ speaker: "長屋の子ども", text: "昨日ちょっと変な顔してたね！ 火よりこわかった！" }],
  },
  newsman: {
    helpful: [{ speaker: "瓦版屋", text: "見出しは『新入り、火事場で人助け』。地味だが売れる。人情は強い。" }],
    quick: [{ speaker: "瓦版屋", text: "『疾風の桶運び、煙を追い越す』。うん、だいぶ盛った。" }],
    iki: [{ speaker: "瓦版屋", text: "『騒がず、慌てず、火事場で粋』。こいつは字面がいい。" }],
    funny: [{ speaker: "瓦版屋", text: "昨日の話、もう二割増しだ。昼には五割増しになる予定だ。" }],
    clean: [{ speaker: "瓦版屋", text: "『火の始末、後始末まで』。真面目すぎるが、町内受けはいいな。" }],
    yabo: [{ speaker: "瓦版屋", text: "『新入り、火事場で右往左往』……いや、本人に怒られるか。" }],
  },
  firechief: {
    helpful: [{ speaker: "火消し頭", text: "昨日の動きは悪くなかった。町を守る気があるなら、また小屋に来い。" }],
    quick: [{ speaker: "火消し頭", text: "桶運びの足は見た。次は速さだけじゃなく段取りも覚えろ。" }],
    iki: [{ speaker: "火消し頭", text: "火事場で慌てず動けるのは強みだ。若い衆にも見せてやれ。" }],
    funny: [{ speaker: "火消し頭", text: "瓦版屋の話は半分に聞け。だが昨日お前が動いたのは本当だ。" }],
    clean: [{ speaker: "火消し頭", text: "火の始末と後始末。両方できて一人前だ。" }],
    yabo: [{ speaker: "火消し頭", text: "昨日は危なっかしかった。次は俺の声を聞け。" }],
  },
  kumitori_master: {},
};

export const FIRE_AREA_ECHOES: Partial<
  Record<RumorTag, Partial<Record<AreaDef["id"], string>>>
> = {
  helpful: {
    nagaya: "長屋では『あの新入り、火事場でも人を助けてたよ』と話されている。",
    well: "井戸端では、誰を先に逃がしたかまで細かく話が広がっている。",
    market: "商店通りでは『困ったときに動けるやつ』として少し顔が売れた。",
  },
  quick: {
    nagaya: "長屋では、昨日の桶運びの速さが子どもたちの遊びになっている。",
    well: "井戸端では『水より先に本人が飛んでた』と少し盛られている。",
    market: "魚屋が客に『あいつは仕事が速い』と昨日より大きな声で話している。",
  },
  iki: {
    nagaya: "長屋では、慌てず役割を見つけた立ち回りが評判になっている。",
    well: "井戸端では『火事場でも落ち着いてた』という話が何度も繰り返されている。",
    market: "瓦版屋が『火事場の粋』という見出しを気に入っている。",
  },
  funny: {
    nagaya: "子どもたちが小火騒ぎを芝居にして、昨日の動きを大げさに再現している。",
    well: "井戸端では、事実よりだいぶ派手な火事だったことになっている。",
    market: "瓦版屋が、煙より話を大きくして売り歩いている。",
  },
  clean: {
    nagaya: "長屋では、火の始末と後片づけまでやったことが静かに評価されている。",
    well: "井戸端では『最後までやる新入り』という評判が立ち始めた。",
    market: "商店通りでは、派手さはないが仕事を任せられそうだという声が出ている。",
  },
  yabo: {
    nagaya: "長屋では『次はもう少し落ち着けばね』と苦笑されている。",
    well: "井戸端では、昨日の慌てぶりまで含めて話の種になっている。",
    market: "瓦版屋は失敗談の方が売れると少し嬉しそうだ。",
  },
};

export function getFireAreaEcho(
  rumor: RumorTag | null,
  area: AreaDef["id"]
): string | null {
  if (!rumor) return null;
  return FIRE_AREA_ECHOES[rumor]?.[area] ?? null;
}


export const PATROL_INTRO_LINES: DialogLine[] = [
  { speaker: "火消し頭", text: "小火が消えて終わりじゃねえ。火事は、起きる前に潰す方が安い。" },
  { speaker: "主人公", text: "つまり見回りか。" },
  { speaker: "火消し頭", text: "桶、路地、屋根。町は狭い。ひとつ塞がりゃ全部が困る。" },
  { speaker: "主人公", text: "江戸って、暮らすだけで忙しいな。" },
  { speaker: "火消し頭", text: "だから面白えんだ。ひとつ見てこい。終わったら報告しろ。" },
];

export const PATROL_CHOICES: PatrolChoice[] = [
  {
    id: "patrol_buckets",
    label: "防火桶を見て回る",
    description: "水量と置き場所を確認する。地味だが確実。",
    effects: { trust: 2, skill: 1, safety: 5 },
    rumorTags: ["clean", "helpful"],
    resultText: "空の桶を見つけて水を足し、倒れた桶を通り沿いへ戻した。",
  },
  {
    id: "patrol_alley",
    label: "路地の荷物を片づける",
    description: "火事のとき人が通れるよう、通路を空ける。",
    effects: { trust: 3, network: 1, safety: 4 },
    rumorTags: ["helpful", "iki"],
    resultText: "路地を塞いでいた荷物を町人と動かし、逃げ道を一本通した。",
  },
  {
    id: "patrol_roofs",
    label: "屋根と風向きを見る",
    description: "火がどこへ広がるかを想像しながら町を見る。",
    effects: { iki: 2, skill: 2, safety: 3 },
    rumorTags: ["iki", "quick"],
    resultText: "屋根の並びと風の抜け方を見て、火消し頭へ危ない筋を伝えた。",
  },
];

export const RANKS = [
  { rank: 1, name: "流れ者", score: 0 },
  { rank: 2, name: "長屋の居候", score: 5 },
  { rank: 3, name: "町の便利屋", score: 12 },
  { rank: 4, name: "頼れる厄介者", score: 22 },
  { rank: 5, name: "大江戸町の顔役", score: 36 },
] as const;
