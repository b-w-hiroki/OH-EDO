import { chromium, webkit, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4173";
const STORAGE_KEY = "oh-edo-mvp-save-v2";
await mkdir("qa-artifacts", { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function state(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

async function dispatchClick(locator) {
  await locator.evaluate((el) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
  );
}

async function advanceDialogs(page, max = 40) {
  for (let i = 0; i < max; i++) {
    const dialog = page.locator(".mock-dialog:visible").first();
    if (await dialog.count()) {
      await dispatchClick(dialog);
      await page.waitForTimeout(70);
      continue;
    }
    await page.waitForTimeout(90);
    if (!(await page.locator(".mock-dialog:visible").count())) return;
  }
  throw new Error("dialog loop did not settle");
}

async function freshStart(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "大江戸町へ" }).click();
  await advanceDialogs(page);
  await page.waitForSelector(".world-layout", { timeout: 10000 });
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const s = JSON.parse(raw);
    return s.screen === "town" && s.flags?.met_landlord;
  }, STORAGE_KEY);
}

async function move(page, label) {
  const ids = { "長屋前": "nagaya", "井戸端": "well", "商店通り": "market", "火消し小屋": "firehouse", "部屋": "room" };
  const button = page.locator(".reference-area-nav button").filter({ hasText: label }).first();
  await button.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForFunction((text) => {
    const button = [...document.querySelectorAll(".reference-area-nav button")].find((el) => el.textContent?.includes(text));
    return Boolean(button && !button.disabled);
  }, label);
  await button.click();
  if (label !== "部屋") {
    await page.waitForFunction(({ key, area }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      return JSON.parse(raw).currentArea === area;
    }, { key: STORAGE_KEY, area: ids[label] });
  }
  await page.waitForTimeout(120);
}

async function talk(page, name) {
  const card = page.locator(".nearby-person").filter({ hasText: name }).first();
  await card.waitFor({ state: "visible", timeout: 5000 });
  await card.click();
  await page.waitForTimeout(80);
  await page.locator(".reference-talk-cta:visible").click();
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  await advanceDialogs(page);
}

async function completeDay1ToDay5(page) {
  await freshStart(page);

  await move(page, "商店通り");
  await talk(page, "熊さん");

  await move(page, "長屋前");
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  await advanceDialogs(page);
  await page.waitForSelector(".jobview", { timeout: 5000 });
  await page.getByRole("button", { name: "これで行く" }).first().click();
  await page.getByRole("button", { name: "夜へ進む" }).click();
  await advanceDialogs(page);

  let s = await state(page);
  assert(s?.day === 2 && s.flags?.day2_started, "Day2 did not start");
  assert(s.lastDecision?.provider === "local" || s.lastDecision?.provider === "jev", "Decision provider missing after night");

  await page.getByRole("button", { name: "騒ぎを見に行く" }).click();
  await advanceDialogs(page);
  await page.waitForSelector(".fire-choice-list", { timeout: 5000 });
  await page.locator(".fire-choice").first().click();
  await page.waitForSelector(".fire-aftermath", { timeout: 10000 });
  await page.getByRole("button", { name: "三日目へ" }).click();

  s = await state(page);
  assert(s?.day === 3 && s.flags?.firehouse_unlocked, "Day3/firehouse unlock failed");
  assert(s.fireAftermath?.provider === "local" || s.fireAftermath?.provider === "jev", "Fire aftermath provider missing");

  await move(page, "火消し小屋");
  await talk(page, "火消し頭");
  await talk(page, "火消し頭");
  await page.waitForSelector(".fire-choice-list", { timeout: 5000 });
  await page.locator(".fire-choice").first().click();
  await page.getByRole("button", { name: "四日目へ" }).click();

  s = await state(page);
  assert(s?.day === 4 && s.flags?.patrol_done, "Day4/patrol progression failed");

  await move(page, "商店通り");
  await talk(page, "瓦版屋");
  await talk(page, "瓦版屋");
  await page.waitForSelector(".festival-panel", { timeout: 5000 });
  await page.locator(".fire-choice").first().click();
  await page.getByRole("button", { name: "五日目へ" }).click();

  s = await state(page);
  assert(s?.day === 5 && s.flags?.day5_started && s.flags?.festival_done, "Day5/festival progression failed");
  assert(s.flags?.room_unlocked, "room unlock regressed");
  assert(s.flags?.firehouse_unlocked, "firehouse unlock regressed");
  assert(Array.isArray(s.playerActions) && s.playerActions.length >= 3, "player action history missing");
  assert(Array.isArray(s.decisionLogs) && s.decisionLogs.length >= 2, "decision logs missing");
  return s;
}

async function captureAreas(page, prefix) {
  const areas = [
    ["長屋前", "nagaya"],
    ["井戸端", "well"],
    ["商店通り", "market"],
    ["火消し小屋", "firehouse"],
  ];
  for (const [label, slug] of areas) {
    await move(page, label);
    await page.screenshot({ path: `qa-artifacts/${prefix}-${slug}-world.png`, fullPage: false });
    const talkButton = page.locator(".nearby-talk:visible").first();
    if (await talkButton.count()) {
      await dispatchClick(talkButton);
      await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
      await page.waitForTimeout(120);
      await page.screenshot({ path: `qa-artifacts/${prefix}-${slug}-dialog.png`, fullPage: false });
      await advanceDialogs(page);
    }
  }

  await move(page, "部屋");
  await page.waitForSelector(".room-panel", { timeout: 5000 });
  await page.screenshot({ path: `qa-artifacts/${prefix}-room.png`, fullPage: false });
  await page.getByRole("button", { name: "町へ出る" }).click();
}

async function assertMobileLayout(page) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const stage = document.querySelector(".presentation-stage")?.getBoundingClientRect();
    const talk = document.querySelector(".reference-talk-cta")?.getBoundingClientRect();
    const navButtons = [...document.querySelectorAll(".reference-area-nav button:not(:disabled)")].map((el) => el.getBoundingClientRect());
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      stageTop: stage?.top ?? null,
      stageHeight: stage?.height ?? null,
      talkWidth: talk?.width ?? null,
      talkHeight: talk?.height ?? null,
      navMinHeight: navButtons.length ? Math.min(...navButtons.map((r) => r.height)) : 0,
      navOverflow: navButtons.some((r) => r.left < -1 || r.right > window.innerWidth + 1),
    };
  });

  assert(result.scrollWidth <= result.viewportWidth + 1, `horizontal overflow: ${JSON.stringify(result)}`);
  assert(result.stageTop !== null && result.stageTop < 220, `scene starts too low: ${JSON.stringify(result)}`);
  assert(result.talkHeight === null || result.talkHeight >= 44, `talk CTA too small: ${JSON.stringify(result)}`);
  assert(result.navMinHeight >= 44, `nav touch targets too small: ${JSON.stringify(result)}`);
  assert(!result.navOverflow, `nav overflows viewport: ${JSON.stringify(result)}`);
  return result;
}

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay5(page);
  await captureAreas(page, "desktop-1600");
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider };
}

async function runIPhoneWebKit() {
  const browser = await webkit.launch({ headless: true });
  const iphone = devices["iPhone 16 Pro Max"] ?? devices["iPhone 15 Pro Max"] ?? devices["iPhone 14 Pro Max"];
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: 430, height: 932 },
    screen: { width: 430, height: 932 },
  });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay5(page);
  const layout = await assertMobileLayout(page);
  await captureAreas(page, "iphone-webkit-430");
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider, layout };
}

const desktop = await runDesktop();
const iphone = await runIPhoneWebKit();
console.log(JSON.stringify({ ok: true, desktop, iphone }, null, 2));
