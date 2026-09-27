# OH！EDO！ Day6+ Roadmap

## 次章の核

Day1〜Day5で「新入り → 町の便利屋」までを体験した後、Day6以降は「町の中で立場を持つことで、誰かの味方をすると別の誰かへ影響が出る」段階へ進める。

コア体験は変えない。

**昨日の行動 → 今日の町の空気 → 人間関係の変化 → 次の頼みごと**

## Day6〜10案

### Day6：祭りの後片づけ
- 祭り後のごみ / 落とし物 / 売上精算
- 熊さん、瓦版屋、おかみさんの利害が少しずつ違う
- Day5で得た評判によって最初の頼まれ方が変わる

### Day7：井戸端の揉めごと
- 水の順番 / 洗い物 / 近所同士の小さな対立
- 正解ではなく「誰にどう見られるか」を中心にする

### Day8：商店通りの困りごと
- 品不足 / 仕入れ / 客足
- 景気・人脈が結果へ影響

### Day9：火消し組との距離
- 火事ではなく、防火・祭礼警備・町内連携
- 火消し頭との関係値を個別エピソードへ接続

### Day10：町内の大きな相談
- Day6〜9で築いた関係が集約される
- 「顔役」へ近づく節目
- 複数NPCの意見が衝突し、単純な最適解にしない

## 新エリア候補

- 寺社前
- 河岸 / 船着場
- 湯屋
- 団子屋・茶屋
- 裏路地

一度に増やさず、まず1エリア + 2NPC程度。

## イベントデータ駆動化

App.tsxへ進行分岐を増やし続けず、次章からイベントを定義データへ寄せる。

想定形:

```ts
type TownEvent = {
  id: string;
  available: (state: GameState) => boolean;
  area: AreaId;
  intro: DialogLine[];
  choices: {
    id: string;
    label: string;
    description: string;
    effects: Partial<Player & Town>;
    rumorTags: RumorTag[];
  }[];
  aftermath: (state: GameState, choiceId: string) => EventOutcome;
};
```

## 移行順

1. Day6新規イベントをデータ駆動で作る
2. 春祭りを同じ仕組みに移植
3. 見回り
4. 小火
5. Day1初仕事

既存Day1〜5を先に全面書き換えない。動いている0.1.0を基準として段階移行する。

## App.tsx整理

0.1.0後に以下へ分離する。

- `progression/`：日付・ランク・フラグ遷移
- `events/`：イベント定義と選択結果
- `town/`：町の噂・エリア反応
- `components/`：表示専用
- `saveState.ts`：セーブ/migration（分離済み）

## CSS整理

見た目を変えず以下の順で分割する。

- tokens / base
- header / HUD
- town scene
- dialog
- side rail
- event panels
- mobile overrides
- finale / transient feedback

既存の最終overrideを先に移し、古い重複ルールを削除する。スクショ比較を必須にする。

## Done条件

- Day6〜10がデータ定義中心で追加できる
- Day1〜5の挙動に回帰なし
- 新イベント追加でApp.tsxを大きく編集しない
- desktop / mobile / WebKit QAが維持される
