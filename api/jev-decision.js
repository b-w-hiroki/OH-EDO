const JEV_URL = "https://www.jevai.org/api/v1/decisions";

const choiceCriteria = {
  quick: "仕事が早い・勢いがあるという解釈が最も自然",
  funny: "珍事や笑い話として広がるのが最も自然",
  helpful: "親切・人助けとして広がるのが最も自然",
  clean: "衛生改善や丁寧な仕事として広がるのが最も自然",
  iki: "粋で気の利いた振る舞いとして広がるのが最も自然",
  yabo: "野暮・不満げ・感じの悪い振る舞いとして広がるのが最も自然",
  none: "特に大きな噂として広げないのが最も自然",
};

const attitudeCriteria = {
  friendly: "親しげに接する",
  neutral: "特に態度を変えない",
  cautious: "少し警戒する",
  annoyed: "不満や苛立ちを示す",
  impressed: "感心し、一目置く",
};

function clamp(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function requireChoice(value, permitted, label) {
  if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(permitted, value)) {
    throw new Error(`Invalid ${label} choice: ${String(value)}`);
  }
  return value;
}

function mapAnswers(answers, permittedRumors) {
  const rumor = answers.rumor_type ?? {};
  const strength = answers.rumor_strength ?? {};
  const attitude = answers.npc_attitude ?? {};
  const affinity = answers.npc_affinity_change ?? {};
  const talk = answers.npc_should_talk ?? {};
  const quest = answers.quest_should_unlock ?? {};
  const special = answers.special_event_should_trigger ?? {};

  const rumorChoice = requireChoice(rumor.choice ?? "none", permittedRumors, "rumor");
  const attitudeChoice = requireChoice(
    attitude.choice ?? "neutral",
    attitudeCriteria,
    "attitude"
  );
  const talkP = clamp(talk.noul ?? 0, 0, 1, 0);
  const questP = clamp(quest.noul ?? 0, 0, 1, 0);
  const specialP = clamp(special.noul ?? 0, 0, 1, 0);

  return {
    rumor: {
      type: rumorChoice,
      strength: clamp(strength.score ?? 0, 0, 4, 0),
    },
    npc: {
      attitude: attitudeChoice,
      // Score criteria is 0..4 with 2 = no change. Convert to -2..+2.
      affinityDelta: clamp((affinity.score ?? 2) - 2, -2, 2, 0),
      shouldTalkProbability: talkP,
      shouldTalk: talkP >= 0.65,
    },
    quest: {
      unlockProbability: questP,
      shouldUnlock: questP >= 0.75,
    },
    specialEvent: {
      triggerProbability: specialP,
      shouldTrigger: specialP >= 0.8,
    },
    provider: "jev",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "JEV_API_KEY is not configured" });
    return;
  }

  const context = req.body?.context;
  if (!context) {
    res.status(400).json({ error: "context is required" });
    return;
  }

  const candidateRumors = Array.isArray(context.candidateRumors)
    ? context.candidateRumors
    : [];
  const permittedRumors = Object.fromEntries(
    Object.entries(choiceCriteria).filter(
      ([key]) => key === "none" || candidateRumors.includes(key)
    )
  );
  if (Object.keys(permittedRumors).length < 2) {
    permittedRumors.none = choiceCriteria.none;
    permittedRumors.helpful = choiceCriteria.helpful;
  }

  const body = {
    model: "typesafe-ai/jev",
    state: context,
    questions: {
      rumor_type: {
        type: "choice",
        instructions:
          "昨日の行動と町の状態から、今日もっとも自然に広がる噂を選ぶ。明確な因果を優先し、候補外の噂は作らない。",
        criteria: permittedRumors,
      },
      rumor_strength: {
        type: "score",
        instructions: "この噂が今日どの程度広がるのが自然か評価する。",
        criteria: [
          "ほぼ誰も知らない",
          "一部の関係者だけが知っている",
          "長屋や近所では知られている",
          "町内でかなり広まっている",
          "町中の話題になっている",
        ],
      },
      npc_attitude: {
        type: "choice",
        instructions:
          "対象NPCが今日プレイヤーに示す態度として最も自然なものを選ぶ。",
        criteria: attitudeCriteria,
      },
      npc_affinity_change: {
        type: "score",
        instructions: "対象NPCの好意度変化を評価する。",
        criteria: [
          "大きく悪化",
          "少し悪化",
          "変化なし",
          "少し上昇",
          "大きく上昇",
        ],
      },
      npc_should_talk: {
        type: "noul",
        instructions:
          "今日、このNPCが自発的にプレイヤーへ話しかけるのが自然か。",
      },
      quest_should_unlock: {
        type: "noul",
        instructions:
          "昨日までの行動と現在の関係性から、新しい依頼を解放するのが自然か。",
      },
      special_event_should_trigger: {
        type: "noul",
        instructions:
          "今日、最近の行動に関連する特殊イベントを発生させるのが自然か。",
      },
    },
  };

  try {
    const response = await fetch(JEV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || (typeof payload.code === "number" && payload.code !== 0)) {
      res.status(502).json({
        error: "Jev request failed",
        status: response.status,
        message: payload?.message,
      });
      return;
    }
    const answers = payload?.data?.answers ?? payload?.answers;
    if (!answers) {
      res.status(502).json({ error: "Jev response did not include answers" });
      return;
    }
    res.status(200).json(mapAnswers(answers, permittedRumors));
  } catch (error) {
    res.status(502).json({
      error: "Jev request failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
