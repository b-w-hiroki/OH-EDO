# OH！EDO！

江戸に流れ着いたよそ者が、町の騒動に巻き込まれながら、仕事・噂・人情・粋を通じて「町の顔役」になっていくゲーム。

## MVPの核
**昨日の行動 → 翌日の噂 → NPCの態度変化**

Day1の汲み取り仕事で選んだ振る舞いが、Day2の町の噂とNPC会話に返る縦切りを実装しています。

## 開発
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Jev
Jevは文章生成ではなくDecision層として利用します。
ブラウザは `VITE_JEV_PROXY_URL` のみを参照し、秘密鍵はサーバー環境の `JEV_API_KEY` に置きます。

Jevが未設定・失敗した場合は `LocalDecisionProvider` に自動フォールバックし、ゲームは継続します。

Vercel互換のサンプルプロキシ: `api/jev-decision.js`

## UI
- 横画面: 世界を広く見せる
- 縦画面: ステータス圧縮、会話/選択を下寄せ
- ライトなアニメ調の明るい配色
- 江戸らしさは城や富士山より生活ディテールで表現

詳細は `docs/` を参照してください。
