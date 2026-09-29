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
    if (!raw) return null;
    const decoded = JSON.parse(raw);
    return decoded?.state ?? decoded;
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
    const decoded = JSON.parse(raw);
    const s = decoded?.state ?? decoded;
    return Boolean(s.flags?.intro_done);
  }, STORAGE_KEY);
  await page.waitForTimeout(180);
  await advanceDialogs(page);
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
      const decoded = JSON.parse(raw);
      const s = decoded?.state ?? decoded;
      return s.currentArea === area;
    }, { key: STORAGE_KEY, area: ids[label] });
  }
  await page.waitForTimeout(80);
  const transition = page.locator(".area-transition");
  if (await transition.count()) {
    await transition.waitFor({ state: "hidden", timeout: 1800 }).catch(() => {});
  }
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

async function completeDay1ToDay10(page, prefix, { captureMilestones = true } = {}) {
  await freshStart(page);

  let initial = await state(page);
  if (!initial?.flags?.met_landlord) {
    await talk(page, "おかみさん");
  }

  await move(page, "商店通り");
  await talk(page, "熊さん");

  await move(page, "長屋前");
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  await advanceDialogs(page);
  await page.waitForSelector(".jobview", { timeout: 5000 });
  if (captureMilestones) {
    await page.waitForTimeout(280);
    await page.screenshot({ path: `qa-artifacts/${prefix}-day1-choice.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "これで行く" }).first().click();
  await page.waitForSelector(".resultview", { timeout: 5000 });
  await settleResultCapture(page);
  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-day1-result.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "夜へ進む" }).click();
  await advanceDialogs(page);

  let s = await state(page);
  assert(s?.day === 2 && s.flags?.day2_started, "Day2 did not start");
  assert(s.lastDecision?.provider === "local" || s.lastDecision?.provider === "jev", "Decision provider missing after night");

  await page.getByRole("button", { name: "騒ぎを見に行く" }).click();
  await advanceDialogs(page);
  await page.waitForSelector(".fire-choice-list", { timeout: 5000 });
  if (captureMilestones) {
    await page.waitForTimeout(280);
    await page.screenshot({ path: `qa-artifacts/${prefix}-fire-choice.png`, fullPage: false });
  }
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const decoded = JSON.parse(raw);
    const s = decoded?.state ?? decoded;
    return s.screen === "fire_choice";
  }, STORAGE_KEY);
  await page.locator(".fire-choice").first().evaluate((el) => el.click());
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const decoded = JSON.parse(raw);
    const s = decoded?.state ?? decoded;
    return s.screen === "fire_result";
  }, STORAGE_KEY, { timeout: 30000 });
  await page.waitForSelector(".fire-aftermath", { timeout: 5000 });
  await settleResultCapture(page);
  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-fire-result.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "三日目へ" }).click();

  s = await state(page);
  assert(s?.day === 3 && s.flags?.firehouse_unlocked, "Day3/firehouse unlock failed");
  assert(s.fireAftermath?.provider === "local" || s.fireAftermath?.provider === "jev", "Fire aftermath provider missing");

  await move(page, "火消し小屋");
  await talk(page, "火消し頭");
  await talk(page, "火消し頭");
  await page.waitForSelector(".fire-choice-list", { timeout: 5000 });
  if (captureMilestones) {
    await page.waitForTimeout(280);
    await page.screenshot({ path: `qa-artifacts/${prefix}-patrol-choice.png`, fullPage: false });
  }
  await page.locator(".fire-choice").first().evaluate((el) => el.click());
  await page.waitForSelector(".patrol-result", { timeout: 5000 });
  await settleResultCapture(page);
  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-patrol-result.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "四日目へ" }).click();

  s = await state(page);
  assert(s?.day === 4 && s.flags?.patrol_done, "Day4/patrol progression failed");

  await move(page, "商店通り");
  await talk(page, "瓦版屋");
  await talk(page, "瓦版屋");
  await page.waitForSelector(".festival-panel", { timeout: 5000 });
  if (captureMilestones) {
    await page.waitForTimeout(280);
    await page.screenshot({ path: `qa-artifacts/${prefix}-festival-choice.png`, fullPage: false });
  }
  await page.locator(".fire-choice").first().evaluate((el) => el.click());
  await page.waitForSelector(".festival-result", { timeout: 5000 });
  await settleResultCapture(page);
  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-festival-result.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "五日目へ" }).click();

  s = await state(page);
  assert(s?.day === 5 && s.flags?.day5_started && s.flags?.festival_done, "Day5/festival progression failed");
  await page.waitForSelector(".town-finale-card", { timeout: 5000 });
  if (captureMilestones) {
    await page.waitForTimeout(2300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `qa-artifacts/${prefix}-day5-finale.png`, fullPage: false });
  }

  const chapterEvents = [
    { day: 6, button: "六日目へ", id: "day6_festival_cleanup" },
    { day: 7, button: "7日目へ", id: "day7_well_order" },
    { day: 8, button: "8日目へ", id: "day8_market_shortage" },
    { day: 9, button: "9日目へ", id: "day9_firehouse_watch" },
    { day: 10, button: "10日目へ", id: "day10_town_council" },
  ];

  for (const chapter of chapterEvents) {
    await page.getByRole("button", { name: chapter.button }).click();
    await page.waitForSelector(".town-event-panel", { timeout: 5000 });
    const eventPanelBounds = await page.evaluate(() => {
      const panel = document.querySelector(".town-event-panel")?.getBoundingClientRect();
      const stage = document.querySelector(".presentation-stage")?.getBoundingClientRect();
      return panel && stage
        ? {
            viewportWidth: window.innerWidth,
            panelTop: panel.top,
            panelBottom: panel.bottom,
            stageTop: stage.top,
            stageBottom: stage.bottom,
          }
        : null;
    });
    assert(eventPanelBounds, `Day${chapter.day} town-event bounds missing`);
    if (eventPanelBounds.viewportWidth <= 599) {
      assert(
        eventPanelBounds.panelTop >= eventPanelBounds.stageTop - 1,
        `Day${chapter.day} town-event panel clipped above mobile stage: ${JSON.stringify(eventPanelBounds)}`
      );
      assert(
        eventPanelBounds.panelBottom <= eventPanelBounds.stageBottom + 3,
        `Day${chapter.day} town-event panel exceeds mobile stage: ${JSON.stringify(eventPanelBounds)}`
      );
    }
    if (captureMilestones) {
      await page.waitForTimeout(2300);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `qa-artifacts/${prefix}-day${chapter.day}-choice.png`,
        fullPage: false,
      });
    }
    s = await state(page);
    assert(s?.day === chapter.day, `Day${chapter.day} did not start`);
    assert(s.activeTownEventId === chapter.id, `Day${chapter.day} event missing`);
    await page.locator(".town-event-panel .fire-choice").first().evaluate((el) => el.click());
    await page.waitForSelector(".town-event-result", { timeout: 5000 });
    await page.getByRole("button", { name: "町へ戻る" }).click();
    s = await state(page);
    assert(
      s.completedTownEventIds?.includes(chapter.id),
      `Day${chapter.day} event did not complete`
    );
    if (chapter.day === 6) {
      assert(s.flags?.day6_started && s.flags?.day6_cleanup_done, "Day6 compatibility flags missing");
    }
  }

  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-day10-world.png`, fullPage: false });
  }
  assert(s?.day === 10, "Day10 progression failed");
  assert(s.completedTownEventIds?.length >= 5, "town event completion history missing");
  assert(s.flags?.room_unlocked, "room unlock regressed");
  assert(s.flags?.firehouse_unlocked, "firehouse unlock regressed");
  assert(Array.isArray(s.playerActions) && s.playerActions.length >= 8, "player action history missing");
  assert(Array.isArray(s.decisionLogs) && s.decisionLogs.length >= 2, "decision logs missing");
  return s;
}

async function captureAreas(page, prefix) {
  // Capture the room before extra Day5 conversations can alter transient UI.
  await move(page, "部屋");
  await page.waitForSelector(".room-panel", { timeout: 5000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `qa-artifacts/${prefix}-room.png`, fullPage: false });
  await page.getByRole("button", { name: "町へ出る" }).evaluate((el) => el.click());

  const areas = [
    ["長屋前", "nagaya"],
    ["井戸端", "well"],
    ["商店通り", "market"],
    ["火消し小屋", "firehouse"],
  ];
  for (const [label, slug] of areas) {
    await move(page, label);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(80);
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
}

async function assertAccessibilityBasics(page) {
  const result = await page.evaluate(() => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const buttons = [...document.querySelectorAll("button, [role='button']")].filter(visible);
    const unnamedButtons = buttons
      .filter((el) => !(el.getAttribute("aria-label") || el.textContent || "").trim())
      .map((el) => el.outerHTML.slice(0, 160));
    const customButtonsWithoutKeyboard = buttons
      .filter((el) => el.getAttribute("role") === "button" && el.tagName !== "BUTTON")
      .filter((el) => !el.hasAttribute("tabindex"))
      .map((el) => el.outerHTML.slice(0, 160));
    const imagesWithoutAlt = [...document.querySelectorAll("img")]
      .filter((img) => !img.hasAttribute("alt"))
      .map((img) => img.getAttribute("src") || "(unknown)");
    return {
      lang: document.documentElement.lang,
      title: document.title,
      unnamedButtons,
      customButtonsWithoutKeyboard,
      imagesWithoutAlt,
    };
  });

  assert(result.lang.startsWith("ja"), `document language must be Japanese: ${JSON.stringify(result)}`);
  assert(Boolean(result.title.trim()), "document title is missing");
  assert(result.unnamedButtons.length === 0, `visible controls without accessible name: ${JSON.stringify(result.unnamedButtons)}`);
  assert(result.customButtonsWithoutKeyboard.length === 0, `custom buttons missing tabindex: ${JSON.stringify(result.customButtonsWithoutKeyboard)}`);
  assert(result.imagesWithoutAlt.length === 0, `images missing alt attribute: ${JSON.stringify(result.imagesWithoutAlt)}`);
  return result;
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

async function verifyLegacySaveMigration(page) {
  const current = await state(page);
  assert(current?.day === 10, "migration fixture requires completed Day10 state");
  await page.evaluate(({ key, legacy }) => {
    localStorage.setItem(key, JSON.stringify(legacy));
  }, { key: STORAGE_KEY, legacy: current });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".world-layout", { timeout: 10000 });
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const decoded = JSON.parse(raw);
    return decoded?.schemaVersion === 1 && decoded?.state?.day === 10;
  }, STORAGE_KEY);
  const migrated = await state(page);
  assert(migrated?.day === 10 && migrated.completedTownEventIds?.includes("day10_town_council"), "legacy save migration lost progression");
}

async function settleResultCapture(page) {
  const dayTransition = page.locator(".day-transition");
  if (await dayTransition.count()) {
    await dayTransition.waitFor({ state: "hidden", timeout: 2600 }).catch(() => {});
  }
  const rankTransition = page.locator(".rank-transition");
  if (await rankTransition.count()) {
    await rankTransition.waitFor({ state: "hidden", timeout: 2600 }).catch(() => {});
  }
  await page.waitForTimeout(280);
}

async function captureStatusBook(page, prefix) {
  await page.getByRole("button", { name: /メニュー/ }).click();
  await page.locator(".status-book").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `qa-artifacts/${prefix}-status-book.png`, fullPage: false });
  await page.getByRole("button", { name: "町へ戻る" }).click();
}

async function verifyPlaytestMode(page) {
  await page.goto(`${baseURL}?playtest=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /メニュー/ }).click();
  await page.getByRole("button", { name: "プレイ記録をコピー" }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "町へ戻る" }).click();
}

async function verifyPwaOfflineRestore(page, context) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10000 });
  const before = await state(page);
  assert(before?.day === 10, "offline restore fixture requires completed Day10 state");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".world-layout", { timeout: 10000 });
  const restored = await state(page);
  assert(restored?.day === 10, "offline reload lost saved Day10 progression");
  assert(restored.completedTownEventIds?.includes("day10_town_council"), "offline reload lost town-event history");
  await context.setOffline(false);
}

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay10(page, "desktop-1600");
  const accessibility = await assertAccessibilityBasics(page);
  await verifyLegacySaveMigration(page);
  await captureAreas(page, "desktop-1600");
  await captureStatusBook(page, "desktop-1600");
  await verifyPlaytestMode(page);
  await verifyPwaOfflineRestore(page, context);
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider, accessibility };
}

async function runMobileChromium() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    screen: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay10(page, "mobile-430");
  const accessibility = await assertAccessibilityBasics(page);
  const layout = await assertMobileLayout(page);
  await captureAreas(page, "mobile-430");
  await captureStatusBook(page, "mobile-430");
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider, layout, accessibility };
}

async function runIPhoneLandscapeWebKit() {
  const browser = await webkit.launch({ headless: true });
  const iphone = devices["iPhone 16 Pro Max"] ?? devices["iPhone 15 Pro Max"] ?? devices["iPhone 14 Pro Max"];
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: 844, height: 390 },
    screen: { width: 844, height: 390 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  await freshStart(page);
  const accessibility = await assertAccessibilityBasics(page);
  const layout = await assertMobileLayout(page);
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-landscape-world.png", fullPage: false });
  const talk = page.locator(".reference-talk-cta:visible");
  if (await talk.count()) {
    await talk.click();
    await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
    await page.screenshot({ path: "qa-artifacts/iphone-webkit-landscape-dialog.png", fullPage: false });
    await advanceDialogs(page);
  }
  assert((await state(page))?.screen === "town", "landscape WebKit conversation did not return to town");
  await browser.close();
  return { layout, accessibility };
}

async function runIPhoneWebKit() {
  const browser = await webkit.launch({ headless: true });
  const iphone = devices["iPhone 16 Pro Max"] ?? devices["iPhone 15 Pro Max"] ?? devices["iPhone 14 Pro Max"];
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: 430, height: 932 },
    screen: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  await freshStart(page);
  const accessibility = await assertAccessibilityBasics(page);
  const layout = await assertMobileLayout(page);
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-430-world.png", fullPage: false });
  if (!(await page.locator(".mock-dialog:visible").count())) {
    await page.locator(".reference-talk-cta:visible").click();
    await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  }
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-430-dialog.png", fullPage: false });
  await advanceDialogs(page);
  const s = await state(page);
  assert(s?.screen === "town", "WebKit conversation did not return to town");
  await browser.close();
  return { day: s.day, layout, accessibility };
}

// Run WebKit first while the runner is fresh. Long Chromium through-plays can
// leave enough transient memory pressure to destabilize WebKit on CI.
const iphone = await runIPhoneWebKit();
const iphoneLandscape = await runIPhoneLandscapeWebKit();
const desktop = await runDesktop();
const mobile = await runMobileChromium();
console.log(JSON.stringify({ ok: true, desktop, mobile, iphone, iphoneLandscape }, null, 2));
