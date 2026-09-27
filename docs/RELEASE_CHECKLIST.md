# OH！EDO！ Release Checklist

## 自動確認

- [ ] npm test
- [ ] npm run typecheck
- [ ] npm run build
- [ ] npm run smoke
- [ ] Chromium desktop Day1→Day10
- [ ] Chromium 430×932 Day1→Day10
- [ ] WebKit iPhone-class smoke
- [ ] desktop/mobile Day5 finale capture
- [ ] Day10 completion state / final town-event result
- [ ] save schema migration check
- [ ] manifest / service worker production smoke

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
