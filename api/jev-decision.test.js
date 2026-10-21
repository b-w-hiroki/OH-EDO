import test from "node:test";
import assert from "node:assert/strict";
import handler from "./jev-decision.js";

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("returns 503 when JEV_API_KEY is missing", async () => {
  const previous = process.env.JEV_API_KEY;
  delete process.env.JEV_API_KEY;
  const res = makeRes();
  await handler({ method: "POST", body: { context: {} } }, res);
  assert.equal(res.statusCode, 503);
  if (previous) process.env.JEV_API_KEY = previous;
});

test("maps Jev typed answers into DecisionResult", async () => {
  const previousKey = process.env.JEV_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.JEV_API_KEY = "test-key";
  process.env.JEV_PROXY_TOKEN = "synthetic-token";
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        code: 0,
        message: "ok",
        data: {
          answers: {
            rumor_type: { choice: "helpful" },
            rumor_strength: { score: 3.2 },
            npc_attitude: { choice: "impressed" },
            npc_affinity_change: { score: 3.5 },
            npc_should_talk: { noul: 0.9 },
            quest_should_unlock: { noul: 0.8 },
            special_event_should_trigger: { noul: 0.4 }
          }
        }
      };
    }
  });

  const res = makeRes();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer synthetic-token" },
    body: {
      context: {
        candidateRumors: ["helpful", "funny"],
        yesterdayActions: [],
        player: {},
        town: {}
      }
    }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rumor.type, "helpful");
  assert.equal(res.body.rumor.strength, 3.2);
  assert.equal(res.body.npc.attitude, "impressed");
  assert.equal(res.body.npc.shouldTalk, true);
  assert.equal(res.body.quest.shouldUnlock, true);
  assert.equal(res.body.specialEvent.shouldTrigger, false);

  globalThis.fetch = previousFetch;
  delete process.env.JEV_PROXY_TOKEN;
  if (previousKey) process.env.JEV_API_KEY = previousKey;
  else delete process.env.JEV_API_KEY;
});


test("rejects unknown typed choices from Jev", async () => {
  const previousKey = process.env.JEV_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.JEV_API_KEY = "test-key";
  process.env.JEV_PROXY_TOKEN = "synthetic-token";
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        code: 0,
        data: {
          answers: {
            rumor_type: { choice: "made_up_rumor" },
            rumor_strength: { score: 2 },
            npc_attitude: { choice: "friendly" },
            npc_affinity_change: { score: 2 },
            npc_should_talk: { noul: 0.5 },
            quest_should_unlock: { noul: 0.5 },
            special_event_should_trigger: { noul: 0.5 }
          }
        }
      };
    }
  });

  const res = makeRes();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer synthetic-token" },
    body: {
      context: {
        candidateRumors: ["helpful", "funny"],
        yesterdayActions: [],
        player: {},
        town: {}
      }
    }
  }, res);

  assert.equal(res.statusCode, 502);
  assert.match(res.body.message, /Invalid rumor choice/);

  globalThis.fetch = previousFetch;
  delete process.env.JEV_PROXY_TOKEN;
  if (previousKey) process.env.JEV_API_KEY = previousKey;
  else delete process.env.JEV_API_KEY;
});

test("clamps numeric Jev answers to safe ranges", async () => {
  const previousKey = process.env.JEV_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.JEV_API_KEY = "test-key";
  process.env.JEV_PROXY_TOKEN = "synthetic-token";
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        code: 0,
        data: {
          answers: {
            rumor_type: { choice: "helpful" },
            rumor_strength: { score: 99 },
            npc_attitude: { choice: "impressed" },
            npc_affinity_change: { score: -10 },
            npc_should_talk: { noul: 5 },
            quest_should_unlock: { noul: -1 },
            special_event_should_trigger: { noul: "not-a-number" }
          }
        }
      };
    }
  });

  const res = makeRes();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer synthetic-token" },
    body: {
      context: {
        candidateRumors: ["helpful"],
        yesterdayActions: [],
        player: {},
        town: {}
      }
    }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rumor.strength, 4);
  assert.equal(res.body.npc.affinityDelta, -2);
  assert.equal(res.body.npc.shouldTalkProbability, 1);
  assert.equal(res.body.quest.unlockProbability, 0);
  assert.equal(res.body.specialEvent.triggerProbability, 0);

  globalThis.fetch = previousFetch;
  delete process.env.JEV_PROXY_TOKEN;
  if (previousKey) process.env.JEV_API_KEY = previousKey;
  else delete process.env.JEV_API_KEY;
});


test("rejects unauthenticated and oversized requests before provider call", async () => {
  process.env.JEV_API_KEY = "synthetic-key";
  process.env.JEV_PROXY_TOKEN = "synthetic-token";
  const priorFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("unexpected provider call"); };
  const unauthorized = makeRes();
  await handler({ method: "POST", body: { context: {} } }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);
  const oversized = makeRes();
  await handler({ method: "POST", headers: { authorization: "Bearer synthetic-token" }, body: { context: { text: "x".repeat(17_000) } } }, oversized);
  assert.equal(oversized.statusCode, 413);
  assert.equal(calls, 0);
  globalThis.fetch = priorFetch;
  delete process.env.JEV_API_KEY;
  delete process.env.JEV_PROXY_TOKEN;
});


test("aborts a stalled synthetic provider request", async () => {
  const priorFetch = globalThis.fetch;
  const priorTimeout = AbortSignal.timeout;
  process.env.JEV_API_KEY = "synthetic-key";
  process.env.JEV_PROXY_TOKEN = "synthetic-token";
  const signal = new AbortController().signal;
  AbortSignal.timeout = (ms) => {
    assert.equal(ms, 8000);
    return signal;
  };
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal, signal);
    throw Object.assign(new Error("aborted"), { name: "AbortError" });
  };
  try {
    const res = makeRes();
    await handler({ method: "POST", headers: { authorization: "Bearer synthetic-token" }, body: { context: {} } }, res);
    assert.equal(res.statusCode, 502);
  } finally {
    globalThis.fetch = priorFetch;
    AbortSignal.timeout = priorTimeout;
    delete process.env.JEV_API_KEY;
    delete process.env.JEV_PROXY_TOKEN;
  }
});
