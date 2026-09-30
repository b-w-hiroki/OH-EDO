# OH！EDO！ Release Checklist

## 自動確認

- [x] npm test
- [x] npm run typecheck
- [x] npm run build
- [x] npm run smoke
- [x] Chromium desktop Day1→Day10
- [x] Chromium 430×932 Day1→Day10
- [x] WebKit iPhone-class portrait smoke
- [x] WebKit iPhone-class landscape smoke
- [x] desktop/mobile Day5 finale capture
- [x] Day10 completion state / final town-event result
- [x] save schema migration check
- [x] manifest / service worker production smoke
- [x] PWA offline reload + Day10 save restore

## 物理iPhone Safari

- [ ] 縦画面
- [ ] 横画面
- [ ] Safe Area
- [ ] アドレスバー伸縮時のレイアウト
- [ ] NPCタップ
- [ ] 話すCTA
- [ ] 会話送り
- [ ] 選択肢
- [ ] エリア移動
- [ ] 部屋出入り
- [ ] Day1→Day10完走
- [ ] ホーム画面追加
- [ ] standalone起動
- [ ] 再起動後セーブ復帰

## 公開

- [ ] GitHub Pages Source = GitHub Actions
- [ ] github-pages Environmentの保護設定確認
- [ ] deploy-pages成功
- [ ] 公開URLで初回起動
- [ ] 公開URLでリロード
- [ ] アセット404なし
- [ ] Local fallbackでDay1→Day10継続可能

## リリース

- [ ] release/0.1.0-rc3を実機承認
- [ ] 0.1.0 tag
- [ ] GitHub Release
- [ ] Release notes
- [ ] 不要な古いrelease branch整理


## Branch policy

- `release/0.1.0-rc3`: Day1〜Day5安定版候補。内容固定。
- `main`: 0.2系開発線。Day1〜Day10。
- 0.1.0正式tagは実機QA / Pages / 初見テストが完了した時点でrc3から作成する。
- 0.2系正式化はDay1〜Day10の実機・初見QA完了後に判断する。


## Visual parity gates

Automated browser captures must cover both desktop 1600×900 and mobile 430×932 unless noted.

- [x] Title screen
- [x] Normal town world
- [x] NPC dialogue
- [x] Day1 job choice / result
- [x] Fire choice / aftermath
- [x] Patrol choice / result
- [x] Festival choice / result
- [x] Day5 finale
- [x] Day6–Day10 choice panels
- [x] Status / 覚え書き
- [x] Room interior and exit control
- [x] WebKit iPhone-class portrait world/dialogue
- [x] WebKit iPhone-class 844×390 landscape world/dialogue
- [x] No transient day/rank overlays obscuring captured decision/result states
- [x] No horizontal overflow and all primary actions remain reachable


## 2026-10-01 current gates

Automated app/browser gates above are green on the mock-density consolidated development line. Remaining release gates are intentionally external:

- Issue #76: physical iPhone Safari Day1→Day10 final QA
- Issue #77: first-time user playtest (3–5 people)
- Issue #62: GitHub Pages final deploy / repository environment configuration

Do not work around these by weakening app QA or replacing physical/user validation with CI.
