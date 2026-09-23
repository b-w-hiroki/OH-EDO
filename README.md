# OH！EDO！

江戸に流れ着いたよそ者が、町の騒動に巻き込まれながら、仕事・噂・人情・粋を通じて「町の顔役」になっていく町生活アドベンチャー。

## コア体験

**昨日の行動 → 翌日の噂 → NPCの態度変化 → 次の事件へ**

現在は、Day1の汲み取りからDay4の火消し小屋見回りまで一続きで遊べます。

## 実装済み

- Day1: 汲み取り仕事 + 4つの振る舞い
- Day2: 噂 / NPC反応 / 場所ごとの町の声
- Day2→3: 小火騒ぎ + Jev/Local Decision aftermath
- Day3: 火消し小屋、火消し頭、町内見回り
- Day4への進行
- NPC関係値
- 噂履歴 / 寿命 / 評判タグ
- 成長ランク
- セーブ
- 横 / 縦レスポンシブ
- タッチD-pad + 話すボタン
- Jev失敗時 Local fallback
- Decisionログ
- CI / smoke check
- GitHub Pages workflow

## 操作

### PC
- 移動: 矢印 / WASD
- 話す・調べる: Space / E
- 会話送り: Space / Enter / 会話欄クリック

### スマホ / タッチ
- 画面上の方向パッド
- 「話す」ボタン
- 会話 / 選択肢はタップ

## 開発

```bash
npm install
npm run dev
npm run verify
```

`npm run verify` は test → typecheck → build → production smoke check を実行します。

## Jev

Jevは文章生成ではなく **State → Typed Decision** の判断層として利用します。

ブラウザは `VITE_JEV_PROXY_URL` のみを参照し、秘密鍵はサーバー環境の `JEV_API_KEY` に置きます。

未設定・通信失敗・不正レスポンス時は `LocalDecisionProvider` にフォールバックするため、Jevなしでもゲームは継続します。

Vercel互換サンプル: `api/jev-decision.js`

## 公開

GitHub Pages workflowを同梱しています。

想定公開URL:
https://b-w-hiroki.github.io/OH-EDO/

Pages上ではサーバーAPIがないため、別途Jev Proxyを設定しない場合はLocal Decisionで動作します。

## デザイン

- ライトなアニメ調
- 明るい配色
- 横/縦両対応
- 江戸らしさは富士山・城・刀だけでなく、長屋・井戸・火消し・桶・路地・仕事・噂など生活ディテールで表現

詳細:
- `docs/JEV_DECISION_ARCHITECTURE.md`
- `docs/RESPONSIVE_ART_GUIDE.md`
- `docs/HISTORICAL_NOTES.md`
- `docs/PROJECT_STATUS.md`
