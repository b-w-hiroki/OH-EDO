# Character Asset Map

OH！EDO！の画面用キャラクター素材を、CSSスプライト切り出しではなく個別ファイルで扱うための対応表。

| Game id | 表示名 | File |
|---|---|---|
| player | たろう | `public/assets/edo/characters/full/player.webp` |
| landlord | おかみさん | `public/assets/edo/characters/full/landlord.webp` |
| fishmonger | 熊さん | `public/assets/edo/characters/full/fishmonger.webp` |
| child | 源太 | `public/assets/edo/characters/full/child.webp` |
| newsman | 瓦版屋 | `public/assets/edo/characters/full/newsman.webp` |
| firechief | 火消し頭 | `public/assets/edo/characters/full/firechief.webp` |

## Usage

- TownPresentation の大きな立ち絵
- 会話ポートレート
- 会話カットイン
- 右サイド「このあたりの人たち」
- 大きな「話す」CTAの選択キャラ表示

## Rules

- `characters-sheet.webp` は資料・フォールバック用途に残すが、通常UIでは直接切り出して使わない。
- 新しい高解像度版を作る場合も同じファイルパスを置換し、レイアウトコード側の変更を最小化する。
- 背景透過、同一のライトアニメ調、同程度の頭身・線・彩色を維持する。
- 現在の個別ファイルは既存キャラクターシートから整理した first-pass asset。今後、個別生成版へ順次差し替える。
