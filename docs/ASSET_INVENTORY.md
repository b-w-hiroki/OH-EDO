# OH！EDO！ Asset Inventory

現行の実装用アセット台帳。新規生成・差し替え前に必ずここを確認し、同じ役割の素材を重複生成しない。

## 背景

| Area | Path | Size |
|---|---|---:|
| 長屋前 | `public/assets/edo/backgrounds/nagaya.webp` | 126,020 B |
| 井戸端 | `public/assets/edo/backgrounds/well.webp` | 133,568 B |
| 商店通り | `public/assets/edo/backgrounds/market.webp` | 121,288 B |
| 火消し小屋 | `public/assets/edo/backgrounds/firehouse.webp` | 127,438 B |
| 長屋の部屋 | `public/assets/edo/backgrounds/room.webp` | 66,750 B |

## 立ち絵

| Character | Path | Size |
|---|---|---:|
| 主人公 / たろう | `public/assets/edo/characters/full/player.webp` | 87,284 B |
| おかみさん | `public/assets/edo/characters/full/landlord.webp` | 62,740 B |
| 熊さん | `public/assets/edo/characters/full/fishmonger.webp` | 117,688 B |
| 源太 | `public/assets/edo/characters/full/child.webp` | 39,788 B |
| 瓦版屋 | `public/assets/edo/characters/full/newsman.webp` | 88,412 B |
| 火消し頭 | `public/assets/edo/characters/full/firechief.webp` | 98,364 B |

## UI

| Asset | Path | Size |
|---|---|---:|
| 和紙/UI sheet | `public/assets/edo/ui/ui-sheet.webp` | 15,009 B |

## 運用ルール

- 背景はエリア単位で1枚を基準にする。
- 立ち絵はNPC IDと1:1で対応させる。
- 実装へ入れる画像はWebPを基本とする。
- 新規アセットは既存の春・明るいライトアニメ調へ合わせる。
- 背景にTAP / START / 説明文などゲーム外文字を入れない。
- キャラクター素材は背景を持たせない。
- 新規エリアを追加する場合は、背景・NPC・ナビ・QAスクショまでを同一PRで完了させる。
- 差し替え前に `src/characterArt.ts` と `src/components/TownPresentation.tsx` の参照先を確認する。
- 未使用になった素材は放置せず、削除か「保留」理由を台帳に記録する。

## 次の追加予定

Issue #84:
- 寺社前 / 茶屋まわり
- 茶屋の娘
- 寺社の世話役

正式アートが用意できるまでは既存背景の流用で実装完了扱いにしない。
