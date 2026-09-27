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

1. 実物iPhone Safariでの最終目視
2. 外部プレイテスト
3. Day6以降 / 次章の生活イベント
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
