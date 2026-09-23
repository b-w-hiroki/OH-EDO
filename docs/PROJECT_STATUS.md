# OH！EDO！ Project Status

## 実装済み

- Day1 汲み取りイベント
- Day2 噂 / NPC反応 / 場所ごとの町の声
- Jev Decision層 + Local fallback
- NPC関係値と判断ログの保存
- 小火騒ぎ → Jev aftermath → Day3
- 火消し小屋 / 火消し頭
- Day3 町内見回り → Day4
- 噂履歴 / 寿命 / 評判タグ
- 成長ランク
- 横画面 / 縦画面レスポンシブ
- タッチ操作
- production build smoke check
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
