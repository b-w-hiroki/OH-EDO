import type { FireChoice, FestivalChoice, GameState, PatrolChoice } from "../types";
import { AREAS } from "../data";
import { ChoiceImpact } from "./ChoiceImpact";
import { readMetrics } from "../game/metrics";
import { relationLabel, rumorLabel } from "../townLabels";
import { publicAsset } from "../publicAsset";

function festivalClosingLine(choiceId: NonNullable<GameState["lastFestivalResult"]>["choiceId"]): string {
  switch (choiceId) {
    case "festival_stalls":
      return "店先のあちこちから『助かったよ』と声が飛ぶ。見物客ではなく、働く側の顔で祭りを迎えた。";
    case "festival_decor":
      return "夕暮れの提灯が灯るころ、通りの景色を見て『あいつの仕事だ』と指さす声が聞こえた。";
    case "festival_news":
      return "祭りが始まる前から名前が町を一周した。瓦版屋は面白そうに次の見出しを考えている。";
  }
}

export function TitleView({
  onStart,
  hasSave,
}: {
  onStart: () => void;
  hasSave: boolean;
}) {
  return (
    <section className="title mock-title">
      <div className="title-hero" aria-hidden="true"></div>
      <div className="title-copy">
      <p className="title-kicker">あの頃も、きっと、たのしい。</p>
      <h1 className="title-main title-main-generated">
        <img
          className="title-logo-image"
          src={publicAsset("assets/edo/ui/generated/runtime/logo-oh-edo-approved.svg")}
          alt="OH！EDO！"
          draggable={false}
        />
      </h1>
      <p className="title-sub">江戸ライフ成り上がり</p>
      <p className="title-flavor">
        流れ着いたのは、騒がしくも妙に居心地のいい大江戸の長屋。
        <br />
        町を歩き、声をかけ──町は、あんたのことを少しずつ覚えていく。
      </p>
      <div className="title-actions">
        <button className="primary title-start" onClick={onStart}>
          {hasSave ? "つづきから" : "大江戸町へ"}
        </button>
      </div>
      </div>
      <div className="title-cast" aria-hidden="true">
        <span className="cast-chip cast-fish">魚屋</span>
        <span className="cast-chip cast-landlord">大家</span>
        <span className="cast-chip cast-child">子ども</span>
        <span className="cast-chip cast-news">瓦版</span>
      </div>
    </section>
  );
}

export function FestivalChoiceView({
  choices,
  onChoose,
}: {
  choices: FestivalChoice[];
  onChoose: (choice: FestivalChoice) => void;
}) {
  return (
    <section className="panel festival-panel legacy-choice-panel">
      <h2>春祭りの準備</h2>
      <p className="panel-desc">町の一員として、どこに手を貸す？</p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            <ChoiceImpact effects={choice.effects} />
            {choice.favoredReputation && (
              <small className="favored-reputation">相性：{choice.favoredReputation}</small>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export function FestivalResultView({
  result,
  onNext,
}: {
  result: NonNullable<GameState["lastFestivalResult"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel festival-result legacy-result-panel">
      <h2>祭りの準備、そのあと</h2>
      <p>{result.resultText}</p>
      {result.bonusText && <p className="reputation-bonus">{result.bonusText}</p>}
      <p className="festival-town-response">{festivalClosingLine(result.choiceId)}</p>
      <p className="muted">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>五日目へ</button>
      </div>
    </section>
  );
}

export function PatrolChoiceView({
  choices,
  onChoose,
}: {
  choices: PatrolChoice[];
  onChoose: (choice: PatrolChoice) => void;
}) {
  return (
    <section className="panel legacy-choice-panel">
      <h2>火消し小屋の見回り</h2>
      <p className="panel-desc">町を守るために、今日はどこを見る？</p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button className="fire-choice" key={choice.id} onClick={() => onChoose(choice)}>
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            <ChoiceImpact effects={choice.effects} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function PatrolResultView({
  result,
  onNext,
}: {
  result: NonNullable<GameState["lastPatrolResult"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel patrol-result legacy-result-panel">
      <h2>見回り完了</h2>
      <p>{result.resultText}</p>
      <p className="muted">{result.nextDayText}</p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>四日目へ</button>
      </div>
    </section>
  );
}

function rumorReachLabel(strength: number): string {
  if (strength >= 3) return "町じゅうの話題";
  if (strength >= 2) return "町内で広がる噂";
  return "近所の小さな噂";
}

export function FireAftermathView({
  aftermath,
  onNext,
}: {
  aftermath: NonNullable<GameState["fireAftermath"]>;
  onNext: () => void;
}) {
  return (
    <section className="panel fire-aftermath legacy-result-panel">
      <h2>小火騒ぎ、そのあと</h2>
      <p>{aftermath.resultText}</p>
      <div className="aftermath-card">
        <strong>火消し頭</strong>
        <p>{aftermath.fireChiefAssessment}</p>
      </div>
      <div className="aftermath-card">
        <strong>瓦版の見出し</strong>
        <p>{aftermath.newsHeadline}</p>
      </div>
      <div className="aftermath-card">
        <strong>町の空気</strong>
        <p>{aftermath.townSummary}</p>
      </div>
      <p className="muted">
        町への広がり：{rumorReachLabel(aftermath.rumorStrength)}
      </p>
      <div className="panel-actions">
        <button className="primary" onClick={onNext}>三日目へ</button>
      </div>
    </section>
  );
}

export function FireChoiceView({
  choices,
  onChoose,
}: {
  choices: FireChoice[];
  onChoose: (choice: FireChoice) => void;
}) {
  return (
    <section className="panel legacy-choice-panel">
      <h2>小火騒ぎ</h2>
      <p className="panel-desc">
        火消し組が来るまでのわずかな間、どう動く？
      </p>
      <div className="fire-choice-list">
        {choices.map((choice) => (
          <button
            className="fire-choice"
            key={choice.id}
            onClick={() => onChoose(choice)}
          >
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
            <ChoiceImpact effects={choice.effects} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function RoomView({ day, onClose }: { day: number; onClose: () => void }) {
  const room = AREAS.room;
  const flavor = room.flavor[Math.min(day - 1, room.flavor.length - 1)];
  return (
    <section className="panel room-panel">
      <div className="room-content">
      <h2>{room.name}</h2>
      <p className="panel-desc">{room.description}</p>
      <p className="muted">― {flavor}</p>
      <p>ひと息ついた。狭くても、戻る場所があるというのは悪くない。</p>
      <div className="panel-actions">
        <button className="primary" onClick={onClose}>
          町へ出る
        </button>
      </div>
      </div>
    </section>
  );
}

export function StatusPanel({
  state,
  onClose,
}: {
  state: GameState;
  onClose: () => void;
}) {
  const playtestMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("playtest") === "1";

  const copyPlaytestReport = async () => {
    const report = {
      exportedAt: new Date().toISOString(),
      day: state.day,
      rank: state.player.rankName,
      completedTownEventIds: state.completedTownEventIds,
      playerActions: state.playerActions,
      metrics: readMetrics(),
    };
    const text = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      window.alert("プレイテスト記録をコピーしました。");
    } catch {
      window.prompt("下の記録をコピーしてください。", text);
    }
  };

  return (
    <section className="panel status-book">
      <header className="status-book-heading">
        <span className="status-book-seal">覚</span>
        <div><small>たろうの帳面</small><h2>覚え書き</h2></div>
      </header>
      <div className="status-grid">
        <div className="status-sheet status-self">
          <h3>身の上</h3>
          <ul>
            <li>位：{state.player.rankName}（Rank {state.player.rank}）</li>
            <li>銭：{state.player.money}</li>
            <li>信用：{state.player.trust}</li>
            <li>粋：{state.player.iki}</li>
            <li>人脈：{state.player.network}</li>
            <li>腕前：{state.player.skill}</li>
          </ul>
        </div>
        <div className="status-sheet status-town">
          <h3>町の様子</h3>
          <ul>
            <li>衛生：{state.town.hygiene}</li>
            <li>治安：{state.town.safety}</li>
            <li>流行：{state.town.trend}</li>
            <li>景気：{state.town.economy}</li>
          </ul>
        </div>
        <div className="status-sheet status-relations">
          <h3>町の人との関係</h3>
          <ul>
            <li>
              大家：{relationLabel(state.npcRelations.landlord.attitude)}
              （好意 {state.npcRelations.landlord.affinity >= 0 ? "+" : ""}
              {state.npcRelations.landlord.affinity}）
            </li>
            <li>
              魚屋：{relationLabel(state.npcRelations.fishmonger.attitude)}
              （好意 {state.npcRelations.fishmonger.affinity >= 0 ? "+" : ""}
              {state.npcRelations.fishmonger.affinity}）
            </li>
            <li>
              長屋の子ども：{relationLabel(state.npcRelations.child.attitude)}
              （好意 {state.npcRelations.child.affinity >= 0 ? "+" : ""}
              {state.npcRelations.child.affinity}）
            </li>
            <li>
              瓦版屋：{relationLabel(state.npcRelations.newsman.attitude)}
              （好意 {state.npcRelations.newsman.affinity >= 0 ? "+" : ""}
              {state.npcRelations.newsman.affinity}）
            </li>
            <li>
              火消し頭：{relationLabel(state.npcRelations.firechief.attitude)}
              （好意 {state.npcRelations.firechief.affinity >= 0 ? "+" : ""}
              {state.npcRelations.firechief.affinity}）
            </li>
          </ul>
        </div>
        <div className="status-sheet status-reputation">
          <h3>評判</h3>
          {state.reputationTags.length === 0 ? (
            <p className="muted">まだ町に定着した評判はない。</p>
          ) : (
            <ul>{state.reputationTags.map((r) => <li key={r}>{r}</li>)}</ul>
          )}
        </div>
        <div className="status-sheet status-rumors">
          <h3>身についた噂</h3>
          {state.activeRumors.length === 0 ? (
            <p className="muted">まだ何の噂にもなっていない。</p>
          ) : (
            <ul>
              {state.activeRumors.map((r) => (
                <li key={r}>{rumorLabel(r)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3>最近の噂</h3>
      {state.rumorHistory.length === 0 ? (
        <p className="muted">まだ記録された噂はない。</p>
      ) : (
        <ul>
          {[...state.rumorHistory].slice(-6).reverse().map((r) => (
            <li key={r.id}>Day{r.createdDay} {rumorLabel(r.tag)} / 強さ {r.strength.toFixed(1)}</li>
          ))}
        </ul>
      )}

      {playtestMode && (
        <details className="decision-debug">
          <summary>Decisionログ（プレイテスト用）</summary>
          {state.decisionLogs.length === 0 ? (
            <p className="muted">まだ判断ログはない。</p>
          ) : (
            <pre>{JSON.stringify(state.decisionLogs.slice(-2), null, 2)}</pre>
          )}
        </details>
      )}

      <h3>これまでの覚え書き</h3>
      {state.log.length === 0 ? (
        <p className="muted">まだ何も書き残せていない。</p>
      ) : (
        <ol className="log">
          {[...state.log].slice(-8).reverse().map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ol>
      )}

      <div className="panel-actions">
        {playtestMode && (
          <button className="ghost" onClick={copyPlaytestReport}>
            プレイ記録をコピー
          </button>
        )}
        <button className="primary" onClick={onClose}>
          町へ戻る
        </button>
      </div>
    </section>
  );
}

