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

MVPの核は成立済み。以降は量産より、以下の順で完成度を上げる。

1. 立ち絵 / 背景の正式アート差し替え
2. 音 / SE / 環境音
3. Day4以降の生活イベント
4. NPC個別エピソード
5. エンディング
6. 外部プレイテスト


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
