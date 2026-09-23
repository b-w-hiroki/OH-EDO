# Jev Decision Architecture

## Goal
OH! EDO! の核である「昨日の行動 → 今日の噂 → NPC反応」を、固定分岐だけでなく状況依存の判断に拡張する。

## Boundary
Jev は文章生成やゲーム進行そのものを担当しない。State から Typed Decision を返すだけ。

- Choice: 噂タイプ / NPC態度
- Score: 噂強度 / 態度変化
- Noul: 話しかける / 依頼解放 / 特殊イベント発生の確率

Noul の最終発火はゲーム側の閾値で決める。

## Runtime flow
Player Action → GameState → DecisionContext → Jev (or Local fallback) → DecisionResult → Game logic/UI

## Fallback
VITE_JEV_PROXY_URL が未設定、通信失敗、型不正の場合は LocalDecisionProvider を使う。
秘密鍵はブラウザへ置かない。

## Deterministic vs AI
明確な因果（報酬、衛生、基礎信用）はゲーム側で固定。
Jev は「どう解釈されるか」「どれだけ広がるか」「誰が反応するか」を担当する。

## MVP acceptance
- APIなしでもDay2まで進む
- Decision結果がセーブされる
- fallback理由をログで追える
- Day2会話にDecisionで選んだ噂が反映される
