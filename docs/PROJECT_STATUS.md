# OH！EDO！ Project Status

## 実装済み

- Day1 汲み取りイベント
- Day2 噂 / NPC反応 / 場所ごとの町の声
- Jev Decision層 + Local fallback
- NPC関係値と判断ログの保存
- 小火騒ぎ → Jev aftermath → Day3
- 火消し小屋 / 火消し頭
- Day3 町内見回り → Day4
- Day4 NPC個別ミニエピソード
- 春祭り準備イベント → Day5
- 噂履歴 / 寿命 / 評判タグ
- 成長ランク
- 横画面 / 縦画面レスポンシブ
- NPC直接タップ / サイドカードからの会話
- エリアタブによるタッチ移動
- production build smoke check
- 今日の目当て / 昨日の行動→今日の変化表示
- エリア移動演出 / UI効果音
- GitHub Pages deploy workflow

## 外部設定が必要なもの

### Jev本番接続

コード側の接続口・フォールバックは実装済み。
本番でJevを利用するには、デプロイ先に以下を設定する。

- `JEV_API_KEY`
- ブラウザ側 `VITE_JEV_PROXY_URL`

秘密鍵はブラウザへ配置しない。

### GitHub Pages

`.github/workflows/pages.yml` が main push で build/verify/deploy を行う。
Pages環境がGitHub側で有効になると公開URLへ反映される。

## 次フェーズ候補

最初の5日間アークとモック寄せは一通り成立済み。以降は以下を優先する。

1. 実物iPhone SafariでDay1→Day10の最終目視
2. 外部プレイテスト
3. GitHub Pages最終deploy解消
4. NPC個別エピソードの追加
5. 音・環境音の本番品質化


## 2026-09-25 Release QA

- 承認済みモック寄せ最終調整を完了
- desktop 1600×900 / mobile 430×932 の通常・会話スクショを継続取得
- Day1 → Day5 を実ブラウザ操作で自動通し確認
- 長屋前 / 井戸端 / 商店通り / 火消し小屋 / 部屋をPC・モバイルで確認
- Chromium 430×932で横はみ出し、タップ領域、画面密度を検査
- WebKit iPhone相当でSafe Area / 横幅 / 会話タップを確認
- 火消し小屋解放後のモバイルナビを3列×2段へ修正し、横スクロールを撤去
- 背景4枚はすべて1672×941。再生成ではなくCSS拡大を止め、原寸寄り描画へ変更
- `npm test` / `npm run typecheck` / `npm run build` / `npm run smoke` 成功

### 残る外部依存

- GitHub Pages最終deployがGitHub側要因で失敗する場合がある。アプリbuildとは分離して追跡する。
- 実物のiPhone端末での最終目視はCIでは代替できないため、WebKit iPhone相当QAを自動化済み。


## 2026-09-27 Five-day Arc Finalization

- 春の江戸・5エリア背景セットへ差し替え済み
- 各エリアの主人公 / NPC配置をPC・430pxで再調整
- Day4の春祭り導入を、町の一員になり始める物語上の山場として強化
- Day5に「五日間の歩み」表示を追加
- 顔なじみ人数 / 主人公ランク / 主な評判 / 次章への気配を既存UI内で表示
- NPCがDay5では「新入り」ではなく名前や町の顔として反応
- エリア小話をDay1〜Day5で変化させ、町の生活感と経過を可視化
- 春祭り前後でNPCの一言と情景トーンを変化
- Release QAでDay5 finale cardも明示的に検証・撮影
- 同一PRの古いGitHub Actionsは自動キャンセルし、最新コミットだけ検証するよう改善

### 残る外部依存

- 実物iPhone Safariでの最終目視
- GitHub Pages deployの断続的失敗は Issue #62 でアプリCIと分離して追跡


## 2026-09-27 Release Hardening

- version: 0.1.0-rc.3
- セーブをversioned envelope化し、旧raw GameStateセーブを自動移行
- 旧セーブ移行をdesktop browser QAへ追加
- Runtime Error Boundaryを追加
- PWA manifest / service worker / iPhone standalone metadataを追加
- 初回の長屋背景と主人公アートをpreload
- キーボードfocus表示とtouch-actionを改善
- 外部送信なしのsessionStorage進行メトリクスを追加
- Playtest / Release checklistを文書化
- Pagesはbuildとartifact uploadまで成功、最終deployのみIssue #62で継続追跡

### 正式0.1.0へ残る条件

- 物理iPhone SafariでDay1→Day5完走
- GitHub Pagesの最終deploy成功
- 初見プレイテスト3人以上


## 2026-09-27 Day6 / Next Chapter Start

- main version: 0.2.0-dev.1
- release/0.1.0-rc3 remains the five-day release candidate
- Day6「祭りのあと片づけ」を追加
- Day6はgeneric town-event定義から選択肢 / 効果 / 結果を駆動
- desktop / mobile / WebKit QAをDay6まで延長
- ChoiceImpact / TownEventViewsをApp.tsxから分離
- Day6固有CSSをtown-events.cssへ分離
- Pages workflowをupload-pages-artifact@v4へ更新
- Pages復旧手順をdocs/PAGES_RECOVERY.mdへ整理

### 外部依存

- Issue #76: physical iPhone Safari final QA
- Issue #77: first-time user playtest
- Issue #62: GitHub Pages final deploy


## 2026-09-27 Day7–Day10 Expansion

- version: 0.2.0-dev.2
- Day7 井戸端の順番騒ぎ
- Day8 商店通りの品不足
- Day9 祭り明けの町内警戒
- Day10 町内の大きな相談
- Day6〜Day10を同一のgeneric town-event engineで駆動
- completedTownEventIdsでイベント完了履歴を保存
- 旧Day6セーブは自動migration
- エリア小話をDay10まで拡張
- browser QAをDay1→Day10へ延長


## 2026-09-27 Day10 QA Alignment

- physical iPhone QA / playtest IssueをDay1→Day10基準へ更新
- Release / Playtest checklistをDay10基準へ更新
- audio preference保存をSafari private storageでも安全化
- production smokeへJS/CSS bundle budgetを追加
- mainの次章実装はgeneric town-event engineに統一
