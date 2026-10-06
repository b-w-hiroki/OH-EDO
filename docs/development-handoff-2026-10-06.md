# 開発引き継ぎ — 2026-10-06

OH-EDOの見た目・操作改善に関する決定、確認済みの実装、未完了項目、再開手順をまとめる。会話の逐語録ではなく、次の作業者が実装済みと構想を区別して継続するための記録。

## 確認時点と追記先

2026-10-06 01:45 UTC時点のGitHub・remote・実コードを確認した。以降の作業では、この固定記録より最新remoteを優先する。

- リポジトリ: [b-w-hiroki/OH-EDO](https://github.com/b-w-hiroki/OH-EDO)
- 公開: [OH-EDO](https://b-w-hiroki.github.io/OH-EDO/)
- remote main: `afc0de2a3314f7c5b2e44c8766b6c00001db3c9c`
- open PRは[#169](https://github.com/b-w-hiroki/OH-EDO/pull/169)のみ。未マージ・Draft。
- PR169 branch: `codex/oh-edo-published-picker-fit-20261005`
- 文書追記前の実装head: `07049b006e609aaff2667b1a49660a125a0e036f`
- 本文はPR169の同じbranchへ追記する。文書追記後のheadはPR/Git履歴で確認し、実装検証済みheadと区別する。
- mainの[verify](https://github.com/b-w-hiroki/OH-EDO/actions/runs/37338441510)、[capture](https://github.com/b-w-hiroki/OH-EDO/actions/runs/37338441398)、[Pages](https://github.com/b-w-hiroki/OH-EDO/actions/runs/37338441568)は成功。
- Pages deployment `6863935504` は同じmain SHA、success（2026-10-05 16:09:01 UTC）。PR168反映後の公開版は前回PCブラウザでも確認済み。
- PR169の修正はまだ公開されていない。公開後の修正確認とユーザーの最終見た目評価は未実施。

## 共通のUI・操作方針

- 日本語中心。美しく違和感なく、インパクトと統一性を両立する。
- 意味のない余白、文字詰まり、過剰なカード分割を避ける。RPG/SLGらしく画面を大きく、ダイナミックに使う。
- 本文16〜18pxを目安に、補助文字14px以上、タップ領域44px以上を目標とする。これは今後の評価基準であり、現行全画面が満たしたという宣言ではない。
- 縮小して押し込まず、情報の優先順位、段階的な表示、適切なスクロールで収める。
- キャラ・道具・足元の見切れ、つぶれ、ギザギザ、顔や文字の暗さ、ボタンの重なりを特に見る。画像の外枠だけでなく、手・魚・紙・杖などの実際の描画も検査する。
- 選択中、話す相手、進行状況、戻る先が明確であること。連打、戻る、再開、途中選択、reloadで進行とセーブが維持されること。
- CI通過、PCブラウザの画面検証、実機での使いやすさ、ユーザーの最終見た目評価はそれぞれ別の確認とする。

## OH-EDOの方向と保つ範囲

イメージは「太閤立志伝」「大航海時代」のような、町・人物・仕事を大きく見せるRPG/SLGの体験。新規の経済・関係性システムは構想段階であり、実装済みとして扱わない。現行にはNPC関係値・評判・噂があるが、構想中の追加システムと同一ではない。

現行Day1〜10、選択と報酬、既存のセーブ・移行・再開、Local fallback、オフライン復元を保つ。見た目改善だけを理由にゲームバランスや新章を追加しない。既存の進行不具合候補は、最新sourceと実操作で再現した重大な問題だけを最小修正する。

## PR167 → 168 → 169の履歴

以下のマージ状態とSHAは上記確認時点にGitHubで照合した。PR本文には過去の途中head・当時のDraft表記が残っているため、現在のPRメタデータを優先する。

| PR | 状態 | 最終実装head | merge commit | 主な内容 |
| --- | --- | --- | --- | --- |
| [167](https://github.com/b-w-hiroki/OH-EDO/pull/167) | 2026-10-05 03:15:58 UTCにマージ済み | `975871819d6c848469f68f0fea0d89eb9f33614d` | `4814a9f254b30b3e39f2d3c40195ae5a5fc6e159` | 選択NPCへのフォーカス、明確な会話CTA、人物picker・keyboard・選択保存、魚屋/瓦版屋の専用肖像、縦横ナビ整理 |
| [168](https://github.com/b-w-hiroki/OH-EDO/pull/168) | 2026-10-05 16:08:04 UTCに外部でマージ済み・公開確認済み | `fb71359457f9614f7bfb5e9093352d5489bcfc5b` | `afc0de2a3314f7c5b2e44c8766b6c00001db3c9c` | 5人の新立ち絵、専用portrait、本文分離、自然な体格差・公平な距離、輪郭と背景の分離 |
| [169](https://github.com/b-w-hiroki/OH-EDO/pull/169) | 未マージ・Draft | `07049b006e609aaff2667b1a49660a125a0e036f`（文書追記前） | なし | 公開版で再現したpickerのはみ出しと横向きタイトルを修正 |

### 人物・本文・操作で確定した実装

- 選択NPCを1人表示し、主人公との場面を作る。「1人」はNPCの人数であり、主人公まで消す意味ではない。
- おかみさん・熊さん・源太・瓦版屋・火消し頭の承認済み全身立ち絵を統合。
- おかみさん・源太・火消し頭の専用portraitを追加。魚屋・瓦版屋の既存専用portraitも保持。
- 人物領域と本文を分離。縦画面は積み重ね、短い横画面は左右配置。長い会話は本文内でスクロールできる。
- 次へ/とじるの明示ボタン、focus表示、Enterの二重送り防止。本文を読んでいるだけで勝手に先へ進めない。
- pickerはkeyboard操作、End、Escapeとfocus復帰に対応。場所ごとの選択とreload後の表示人物を一致させる。

素材の実際の参照先は[src/characterArt.ts](../src/characterArt.ts)。全身は `public/assets/edo/characters/renewed/*.webp`、新portraitは同配下の `portraits/*.webp`。旧PNG・既存portrait・原画は保持する。

### 人物の距離と体格

[src/characterPlacement.ts](../src/characterPlacement.ts)の `CHARACTER_PLACEMENT` は、人の頭から足までの確認済みpixel anchorを使う。透明キャンバスの大きさや、掲げた紙・杖・魚の幅で見かけの身長を決めない。

- 主人公と大人の体高は場面高の70%を基準に揃える。
- 子どもは大人基準の72%（`stature: .72`）。自然な子どもの体格・元の姿勢を保つ。
- 共通の足元は場面高の94%。CSSの下端6%と原画の足元anchorで揃える。
- 非等方の引き伸ばし、理由のない近景/遠景差、道具幅を基準にした人物縮小は避ける。
- 全身containと道具・影の余裕、人物と本文の非干渉を、町と会話の両方で確認する。

### 人物輪郭と背景の分離

人物の背後に板・背面パネルを置く案は撤回された。採用方向は、既存アルファ輪郭に沿う近い影と、背景だけを暗くする処理。顔・服・文字・portraitを暗くしない。離れた黒い塊や二人目の人物に見える影にしない。

[src/character-art-integration.css](../src/character-art-integration.css)の `.town-art-stage` に集約されている現在値:

| CSS変数 | 現在値 | 役割 |
| --- | --- | --- |
| `--character-shadow-rgb` | `42 30 28` | 暖かい墨色の単一alpha shadow |
| `--character-shadow-opacity` | `.86` | 輪郭影の濃さ |
| `--character-shadow-x` / `--character-shadow-y` | `clamp(2px, 1cqh, 4px)` | 近い斜めoffset |
| `--character-shadow-blur` | `.35px` | 小さいぼかし |
| `--background-dim-rgb` | `25 23 28` | 背景暗幕の色 |
| `--background-dim-opacity` | `.23` | 背景だけの暗幕 |

影は `.presentation-character-image-default` の単一 `drop-shadow`。暗幕は `.town-art-stage .town-background::after` にだけ置く。人物・本文の親へまとめてfilter/opacityを掛けない。

比較後の強調版は、影64%→86%、ぼかし0.75→0.35px、背景16%→23%。方向への好意的な評価と「もっと明確に」の要望を受けた限定調整であり、人物配置・offset・素材は変えていない。別画面へ機械的に同じ数値を適用せず、その背景と人物・UIの組み合わせで判断する。

## PR169の再現・修正・検証

公開main `afc0de2` を、ユーザーの既存保存状態を使わない独立したPCブラウザcontextで操作した。

1. **375×667 / 844×390の人物picker**: 下端がviewport外へ出て最後の候補が切れた。上下の空きを測って開く方向を選び、狭い場合はパネル内スクロールとする。resize・scroll・visualViewport変更に追従し、初期focusは `preventScroll` を指定。
2. **844×390のタイトル**: 画像高が2px、開始ボタンのtopが約690pxになり初期画面外へ押し出された。幅600px以上・高さ500px以下だけ既存画像と説明を左右に配置。修正版では画像高346px、開始ボタンbottom348px、document高390pxで画面内に収まった。

実装変更ファイル（文書追記を含まない）:

- [src/components/TownSidePanel.tsx](../src/components/TownSidePanel.tsx)
- [src/modern-town-interaction.css](../src/modern-town-interaction.css)
- [src/title-viewport.css](../src/title-viewport.css)
- [scripts/full-character-art-qa.mjs](../scripts/full-character-art-qa.mjs)
- [scripts/capture-screenshots.mjs](../scripts/capture-screenshots.mjs)

### 成功済み範囲と限界

実装head `07049b006e609aaff2667b1a49660a125a0e036f` の[verify 37390833879](https://github.com/b-w-hiroki/OH-EDO/actions/runs/37390833879)と[capture-screenshots 37390833913](https://github.com/b-w-hiroki/OH-EDO/actions/runs/37390833913)は成功。今回はその既存結果とsourceを再確認し、文書保存のためにゲームの重い再テストを追加実行していない。

| 検証 | 実際の範囲 |
| --- | --- |
| Windows Microsoft Edge（Chromium）の独立context | 公開版と修正版の375×667、390×844、844×390。title→町→会話→人物選択→仕事の選択→報酬→Day2の町を各3画面で完走。choice/result reload、報酬重複なし、進行・選択維持 |
| 人物・場面fixture | 6人物/エリア組み合わせ×4画面＝24ケース。5人、子どもは長屋/井戸端の2場面。375×667、390×844、844×390、1600×900。公開版と修正版で確認 |
| 人物QA | 全身/portrait読込と枠内表示、共通足元・体格、輪郭影・背景だけの暗幕、UI非干渉、picker bounds、End/Escape/focus、reload、長会話scroll、Enter一回進行、開いたpickerの回転 |
| タイトル画面チェック | 375×667、390×844、844×390、430×932、1600×900。画像と開始ボタンが最初の画面内 |
| CIのChromium通し回帰 | 1600×900、390×844、375×667でDay1〜10。保存移行、choice/reward reload、連打、音設定、offline Day10復元など。844×390の選択/結果・回転も別途確認 |
| CIのWebKit | 430×932縦、844×390横の会話・移動・layout/touch/focus等のsmoke。WebKit全サイズのDay1〜10通し検証とは記載しない |
| verify / 性能 | unit 5件、typecheck、build、production smoke、local-perf-report成功 |

24ケースはDay6のテスト状態を使った人物・場面の検査であり、初回プレイの一巡とは別。公開版と修正版の対応画像もこの区別を記録している。

**未完了**: 物理iPhone Safariでの確認、PR169を公開した後の実操作確認、全画面に対するユーザーの最終見た目評価。CI成功をこれらの代わりにしない。汲取親方の新素材統合も未完了。

## 素材と比較証跡の参照先

- 原画・runtime・Library masterの対応: [character-art-integration-20261005.md](character-art-integration-20261005.md)、[CHARACTER_ASSET_MAP.md](CHARACTER_ASSET_MAP.md)、[ASSET_INVENTORY.md](ASSET_INVENTORY.md)。
- 初期統合文書のcheckpointには途中headや当時のversionがある。PR168の最終成功記録も確認し、同じLibrary IDを編集する場合は現在versionを改めて確認する。
- PR168の最終比較・動画・証跡archiveの確認済み識別情報は[PR168本文](https://github.com/b-w-hiroki/OH-EDO/pull/168)を参照。
- Library画像は識別情報から必要なものだけ取得し、取得できないときは別URLや保存先を推測しない。署名付きURL・認証情報は文書へ保存しない。
- 今回は新素材生成・大量の画像添付をしない。既存の比較識別情報を再利用する。

強調版（PR168、すべてversion 0）:

| Library path | Library ID |
| --- | --- |
| `/oh-edo-foreground-stronger-375x667-before-after.png` | `libfile_2325b0d969fc819183109e77bc36560f` |
| `/oh-edo-foreground-stronger-390x844-before-after.png` | `libfile_8d4be82ab90481918e8e3ae4dab03b1f` |
| `/oh-edo-foreground-stronger-844x390-before-after.png` | `libfile_864528a1ea548191a2a98236abd76958` |

公開版とPR169修正版（すべてversion 0、タイトル/picker before-after、町・会話・選択・報酬・5人の人物を原寸収録）:

| Library path | Library ID |
| --- | --- |
| `/oh-edo-public-audit-375x667.png` | `libfile_2c97ce8311f08191951394402834be36` |
| `/oh-edo-public-audit-390x844.png` | `libfile_0336284f05c08191a5f6e91533265528` |
| `/oh-edo-public-audit-844x390.png` | `libfile_28c8026addd08191a28fdc5e34eeba07` |

## 旧作業の保持と再開時の扱い

- 旧原画・worktree・未追跡QA記録を削除・reset・上書き・pruneしない。現在の追記先は `OH-EDO-public-validation-20261005`。
- 確認した別worktreeには `OH-EDO-source`、`OH-EDO-uiux`、`OH-EDO-ui-coherence`、`OH-EDO-pages-assets`、`OH-EDO-asset-renewal`、`OH-EDO-character-art-integration` がある。最後のものはPR168 head `fb713594...` を保持。
- `OH-EDO-source` のlocal mainは古い `5be3e798...`。remote mainと混同しない。
- 過去記録にある `codex/local-mock-alignment-after-162` / `1601199` と別Day8 branchは、このcheckoutのbranch一覧では未同定。消失と判断せず、扱う前に所在と差分を調べる。
- 汲取親方の新素材は未統合。現行 `characterArtPath("kumitori_master")` はnullで、既存の確立した全身表示経路がない。新素材の存在だけを理由にゲームへ差し込まない。
- 他プロジェクトとworktree・portを分ける。前回OHのテストportは4321だが、待受の所有元と空きを毎回確認する。別の作業者のserverを止めない。
- 競合や旧作業の差分は内容を確認して整理する。一括ours/theirsや古いlocal mainへの巻き戻しを使わない。

## 別プロジェクトの未完了事項（今回の現物調査対象外）

以下は引き継がれた開発上の既知状態。最新remote・各repo・素材は今回照合していない。OHの文書pushとは別に扱い、他repoのコードpushは今回行わない。

| プロジェクト | 残る開発事項・既知状態 |
| --- | --- |
| AINAN | 引きスワイプで扇状の狙い、世界座標に沿う範囲表示、画面外へのcamera追従、投げる→巻く→hit、motion同期、装備と見た目の連動、分離layer。新キャラ素材のゲーム統合は未完。HUD修正 `b2a68034b6c884cdad22c78f4ad72f33d3b85e9d` はlocalのみ・外部push保留という既知状態 |
| おさいふ | `f62b2b6076869073b55688152c725a0f887c9fc4` はlocalのみ・外部push保留という既知状態。詳細は当該repoを再確認して続ける |
| おさんぽビンゴ | `c471473f00790c9e14fc957b953e60274ef906dc` はlocalのみ・外部push保留という既知状態。詳細は当該repoを再確認して続ける |
| AI_project002（6ゲーム） | PR314が反映済みという過去確認。最新状態は未照合 |
| 各ゲームのアウトゲーム | 準備→プレイ→結果→次の目標という設計方針。各ゲームへ実装済みとは扱わない |
| ポートフォリオ | 業務委託→外部アピール→採用向け。画像中心・少ない文章。実績を捏造しない |
| 灰鐘の巡礼路 | sourceの再受領と公開準備が未完 |

## 再開チェックリストとコマンド

1. 最新main、open PR、headごとのCI、公開deploymentを確認。PR169のマージ/公開を推測しない。
2. 未完の見た目・実機検証を先に行う。タイトル→町→会話/選択→quest/報酬→町を一巡し、読みやすさ・見切れ・重なり・選択・戻る・再開を確認。
3. 実機ではSafariのtoolbar、回転、safe area、本文/補助文字の実際の読める大きさ、長会話scroll、タップ・連打を確認。独立したテスト保存状態を使い、既存saveを消さない。
4. 再現した問題を小さい範囲で修正。旧素材・旧作業・既存Day1〜10を保つ。
5. 変更に見合うunit/type/build/操作回帰を実施。見た目はbefore/afterを同条件で確認し、CIと目視を別々に記録。
6. branchへpushしDraft PRへ保存。完成した小さい単位を先に報告し、localだけに残さない。
7. マージ・公開は別途確認する。公開後に実際の公開URLで修正を確かめる。

既存OH専用worktreeでの確認例（PowerShell。未保存差分を先に点検）:

```powershell
git status --short
git worktree list
git fetch origin
git log -5 --oneline origin/main
gh pr list --repo b-w-hiroki/OH-EDO --state open
gh pr view 169 --repo b-w-hiroki/OH-EDO --json state,isDraft,mergedAt,headRefName,headRefOid,url
gh run list --repo b-w-hiroki/OH-EDO --commit 07049b006e609aaff2667b1a49660a125a0e036f
```

PR169が未マージなら、そのbranchの既存専用worktreeを使う。マージ済みなら最新 `origin/main` から別のbranch/worktreeを作る。既存branchを別worktreeから無断で操作しない。

```powershell
# PR169がマージ済みの場合の例。名前と保存先の重複を先に確認する。
git worktree add -b codex/oh-edo-next-review ../OH-EDO-next-review origin/main
```

実装を再開する時だけ、依存関係と必要なブラウザを準備して対応する検証を実行する。4322は例なので、空きを確認して変更する。`--strictPort` で別portへの自動切替を防ぐ。

```powershell
npm ci
npm install --no-save --package-lock=false playwright@1.55.0
npx playwright install chromium webkit
npm run dev -- --host 127.0.0.1 --port 4322 --strictPort
# 別terminalで、必要な検証のみ実行する。
npm run verify
$env:OH_EDO_URL = 'http://127.0.0.1:4322'
node scripts/capture-screenshots.mjs
node scripts/full-character-art-qa.mjs
node scripts/release-qa.mjs
```

ブラウザ不足時は当該環境のPlaywright手順と[既存CI手順](../.github/workflows/screenshots.yml)を確認する。上記は次回実装検証用の準備例であり、今回の文書変更では実行していない。Windows Edgeによるviewport検証とCIのChromium/WebKit、物理iPhoneの結果は混ぜず、実際に使った環境・画面・commit・成功/未実施を記録する。
