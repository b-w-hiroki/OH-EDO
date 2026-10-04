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
      const portrait = dialog.locator(".dialog-portrait:visible:has(img)").first();
      if (await portrait.count()) {
        const portraitState = await portrait.evaluate((frame) => {
          const image = frame.querySelector("img");
          const frameRect = frame.getBoundingClientRect();
          const imageRect = image?.getBoundingClientRect();
          return {
            loaded: Boolean(image && image.complete && image.naturalWidth > 0),
            frameWidth: frameRect.width,
            frameHeight: frameRect.height,
            coversFrame: Boolean(
              imageRect &&
              imageRect.width >= frameRect.width - 1 &&
              imageRect.height >= frameRect.height - 1
            ),
          };
        });
        assert(portraitState.loaded, `dialog portrait failed to load: ${JSON.stringify(portraitState)}`);
        assert(portraitState.frameWidth >= 44 && portraitState.frameHeight >= 44, `dialog portrait is too small: ${JSON.stringify(portraitState)}`);
        assert(portraitState.coversFrame, `dialog portrait does not cover its frame: ${JSON.stringify(portraitState)}`);
      }
      const readability = await dialog.locator(".dialog-text").evaluate((el) => ({
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
        clipped: el.scrollHeight > el.clientHeight + 2,
        overflowY: getComputedStyle(el).overflowY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }));
      assert(
        !readability.clipped || ["auto", "scroll"].includes(readability.overflowY),
        `dialog text is clipped without scrolling: ${JSON.stringify(readability)}`
      );
      const minimumFontSize =
        readability.viewportHeight <= 500 || readability.viewportWidth <= 599 ? 16 : 18;
      assert(
        readability.fontSize >= minimumFontSize,
        `dialog text is too small: ${JSON.stringify(readability)}`
      );
      const composition = await dialog.evaluate((el) => {
        const stage = el.closest(".presentation-stage")?.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return stage
          ? {
              clearSceneRatio: (rect.top - stage.top) / stage.height,
              targetHeight: rect.height,
              viewportWidth: innerWidth,
              viewportHeight: innerHeight,
            }
          : null;
      });
      if (composition) {
        const minimumClearScene = composition.viewportWidth <= 599 && composition.viewportHeight > composition.viewportWidth
          ? .41
          : .34;
        assert(composition.clearSceneRatio >= minimumClearScene, `dialog hides too much of the scene: ${JSON.stringify(composition)}`);
        assert(composition.targetHeight >= 44, `dialog action target is too small: ${JSON.stringify(composition)}`);
      }
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
  if (await page.locator(".nearby-avatar.avatar-newsman").count()) {
    await assertNewsmanPortrait(page);
  }
  await card.click();
  await page.waitForTimeout(80);
  const dockTalk = page.locator(".reference-talk-cta:visible");
  if (await dockTalk.count()) {
    await dockTalk.click();
  } else {
    const railTalk = card.locator(".nearby-talk:visible");
    assert((await railTalk.count()) > 0, `no visible talk affordance for ${name}`);
    await railTalk.click();
  }
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  await advanceDialogs(page);
}

async function assertNewsmanPortrait(page) {
  const portrait = await page.locator(".nearby-avatar.avatar-newsman").evaluate((frame) => {
    const image = frame.querySelector("img");
    const frameRect = frame.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    const style = image ? getComputedStyle(image) : null;
    return {
      loaded: Boolean(image && image.complete && image.naturalWidth > 0),
      objectPosition: style?.objectPosition ?? "",
      transformed: style?.transform !== "none",
      clippedToFrame: getComputedStyle(frame).overflow === "hidden",
      coversFrame: Boolean(
        imageRect && imageRect.left <= frameRect.left + 1 && imageRect.right >= frameRect.right - 1 &&
        imageRect.top <= frameRect.top + 1 && imageRect.bottom >= frameRect.bottom - 1
      ),
    };
  });
  assert(
    portrait.loaded && portrait.objectPosition === "37% 18%" && portrait.transformed &&
      portrait.clippedToFrame && portrait.coversFrame,
    `newsman portrait crop is not production-ready: ${JSON.stringify(portrait)}`
  );
}

async function completeDay1ToDay10(page, prefix, { captureMilestones = true } = {}) {
  await freshStart(page);

  const initialNav = await page.evaluate(() => {
    const width = window.innerWidth;
    const buttons = [...document.querySelectorAll(".reference-area-nav button")];
    const visible = buttons.filter((el) => getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0);
    return {
      width,
      total: buttons.length,
      visible: visible.length,
      lockedVisible: visible.filter((el) => el.disabled).length,
    };
  });
  if (initialNav.width <= 599 || initialNav.width >= 900) {
    assert(initialNav.total === 6 && initialNav.visible === 6, `Day1 should preserve six navigation slots: ${JSON.stringify(initialNav)}`);
    assert(initialNav.lockedVisible >= 1, `Day1 locked destination should remain visible: ${JSON.stringify(initialNav)}`);
  }

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
  const choiceReadability = await page.locator(".jobview").evaluate((panel) => {
    const description = panel.querySelector(".area-desc");
    const cardBody = panel.querySelector(".legacy-choice-card > p:not(.choice-effects)");
    const effects = panel.querySelector(".choice-effects");
    const action = panel.querySelector(".primary");
    const panelRect = panel.getBoundingClientRect();
    const actionRect = action?.getBoundingClientRect();
    const effectsRect = effects?.getBoundingClientRect();
    return {
      width: innerWidth,
      descriptionFont: description ? Number.parseFloat(getComputedStyle(description).fontSize) : 0,
      bodyFont: cardBody ? Number.parseFloat(getComputedStyle(cardBody).fontSize) : 0,
      effectsFont: effects ? Number.parseFloat(getComputedStyle(effects).fontSize) : 0,
      actionHeight: actionRect?.height ?? 0,
      actionVisible: Boolean(actionRect && actionRect.top >= panelRect.top && actionRect.bottom <= panelRect.bottom + 1),
      effectsVisible: Boolean(effectsRect && effectsRect.top >= panelRect.top && effectsRect.bottom <= panelRect.bottom + 1),
    };
  });
  if (choiceReadability.width <= 599) {
    assert(choiceReadability.descriptionFont >= 13, `choice context is too small: ${JSON.stringify(choiceReadability)}`);
    assert(choiceReadability.bodyFont >= 14, `choice description is too small: ${JSON.stringify(choiceReadability)}`);
    assert(choiceReadability.effectsFont >= 11, `choice effects are too small: ${JSON.stringify(choiceReadability)}`);
  }
  assert(choiceReadability.actionHeight >= 44, `choice action target is too small: ${JSON.stringify(choiceReadability)}`);
  assert(choiceReadability.actionVisible && choiceReadability.effectsVisible, `choice hierarchy starts clipped: ${JSON.stringify(choiceReadability)}`);
  if (prefix === "desktop-1600") {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".jobview", { timeout: 5000 });
    assert((await state(page))?.screen === "job", "reload lost the active Day1 choice");
  }
  if (captureMilestones) {
    await page.waitForTimeout(280);
    await page.screenshot({ path: `qa-artifacts/${prefix}-day1-choice.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "これで行く" }).first().click();
  await page.waitForSelector(".resultview", { timeout: 5000 });
  const resultReadability = await page.locator(".resultview").evaluate((panel) => {
    const summary = panel.querySelector(".area-desc");
    const metric = panel.querySelector(".card li");
    const action = panel.querySelector(".status-actions .primary");
    const panelRect = panel.getBoundingClientRect();
    const actionRect = action?.getBoundingClientRect();
    return {
      width: innerWidth,
      summaryFont: summary ? Number.parseFloat(getComputedStyle(summary).fontSize) : 0,
      metricFont: metric ? Number.parseFloat(getComputedStyle(metric).fontSize) : 0,
      actionHeight: actionRect?.height ?? 0,
      actionVisible: Boolean(actionRect && actionRect.top >= panelRect.top && actionRect.bottom <= panelRect.bottom + 1),
    };
  });
  if (resultReadability.width <= 599) {
    assert(resultReadability.summaryFont >= 14, `result summary is too small: ${JSON.stringify(resultReadability)}`);
    assert(resultReadability.metricFont >= 12, `result metrics are too small: ${JSON.stringify(resultReadability)}`);
  }
  assert(resultReadability.actionHeight >= 44, `result action target is too small: ${JSON.stringify(resultReadability)}`);
  assert(resultReadability.actionVisible, `result action starts clipped: ${JSON.stringify(resultReadability)}`);
  if (prefix === "desktop-1600") {
    const resultBeforeReload = await state(page);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".resultview", { timeout: 5000 });
    const resultAfterReload = await state(page);
    assert(resultAfterReload?.screen === "result", "reload lost the Day1 reward screen");
    assert(
      resultAfterReload.playerActions.length === resultBeforeReload.playerActions.length,
      "reload duplicated the Day1 reward"
    );
  }
  await settleResultCapture(page);
  if (captureMilestones) {
    await page.screenshot({ path: `qa-artifacts/${prefix}-day1-result.png`, fullPage: false });
  }
  await page.getByRole("button", { name: "夜へ進む" }).click();
  await advanceDialogs(page);

  let s = await state(page);
  assert(s?.day === 2 && s.flags?.day2_started, "Day2 did not start");
  assert(s.lastDecision?.provider === "local" || s.lastDecision?.provider === "jev", "Decision provider missing after night");

  const dayTwoTransition = page.locator(".day-transition");
  if (await dayTwoTransition.count()) {
    await dayTwoTransition.waitFor({ state: "hidden", timeout: 5000 });
  }

  if (captureMilestones) {
    await page.waitForTimeout(250);
    await page.screenshot({ path: `qa-artifacts/${prefix}-fire-lead.png`, fullPage: false });
  }
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
  const beforeFireChoice = await state(page);
  await page.locator(".fire-choice").first().evaluate((el) => {
    el.click();
    el.click();
    el.click();
  });
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const decoded = JSON.parse(raw);
    const s = decoded?.state ?? decoded;
    return s.screen === "fire_result";
  }, STORAGE_KEY, { timeout: 30000 });
  await page.waitForSelector(".fire-aftermath", { timeout: 5000 });
  const afterFireChoice = await state(page);
  assert(
    afterFireChoice.playerActions.length === beforeFireChoice.playerActions.length + 1,
    "rapid fire-choice taps created duplicate actions"
  );
  assert(
    afterFireChoice.decisionLogs.length === beforeFireChoice.decisionLogs.length + 1,
    "rapid fire-choice taps created duplicate decisions"
  );
  if (prefix === "desktop-1600") {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".fire-aftermath", { timeout: 5000 });
    assert((await state(page))?.screen === "fire_result", "reload lost the fire reward screen");
  }
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
  {
    const className = await page.locator(".town-presentation").getAttribute("class");
    assert(className?.includes("is-festival-prep"), `Day4 festival prep dressing missing: ${className}`);
  }
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
  {
    const className = await page.locator(".town-presentation").getAttribute("class");
    assert(className?.includes("is-festival-after"), `Day5 festival-after dressing missing: ${className}`);
  }
  if (captureMilestones) {
    await page.waitForTimeout(2300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `qa-artifacts/${prefix}-day5-finale.png`, fullPage: false });
  }

  const chapterEvents = [
    { day: 6, button: "六日目へ", id: "day6_festival_cleanup", memoryClass: null, relations: { fishmonger: 2, newsman: 1 } },
    { day: 7, button: "7日目へ", id: "day7_well_order", memoryClass: "has-cleanup-memory", relations: { landlord: 2, child: 1 } },
    { day: 8, button: "8日目へ", id: "day8_market_shortage", memoryClass: "has-well-memory", relations: { fishmonger: 2, landlord: 1, newsman: 1 } },
    { day: 9, button: "9日目へ", id: "day9_firehouse_watch", memoryClass: "has-market-memory", relations: { firechief: 2, fishmonger: 1 } },
    { day: 10, button: "10日目へ", id: "day10_town_council", memoryClass: "has-watch-memory", relations: { fishmonger: 2, newsman: 1, firechief: -1 } },
  ];

  for (const chapter of chapterEvents) {
    await page.getByRole("button", { name: chapter.button }).click();
    await page.waitForSelector(".town-event-panel", { timeout: 5000 });
    if (chapter.day === 6) {
      const className = await page.locator(".town-presentation").getAttribute("class");
      assert(className?.includes("is-festival-leftover"), `Day6 leftover festival dressing missing: ${className}`);
    }
    if (chapter.memoryClass) {
      const townScene = page.locator(".town-presentation");
      await townScene.waitFor({ state: "visible", timeout: 5000 });
      const className = await townScene.getAttribute("class");
      assert(
        className?.includes(chapter.memoryClass),
        `Day${chapter.day} missing visual consequence memory ${chapter.memoryClass}: ${className}`
      );
    }
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
    if (chapter.day === 10) {
      const firstChoiceText = (await page.locator(".town-event-panel .fire-choice").first().textContent()) ?? "";
      assert(firstChoiceText.includes("熊さん +2"), `Day10 trade relationship gain missing: ${firstChoiceText}`);
      assert(firstChoiceText.includes("火消し頭 -1"), `Day10 trade relationship cost missing: ${firstChoiceText}`);
    }
    const relationsBeforeChoice = Object.fromEntries(
      Object.entries(s.npcRelations).map(([npcId, relation]) => [npcId, relation.affinity])
    );
    await page.locator(".town-event-panel .fire-choice").first().evaluate((el) => el.click());
    await page.waitForSelector(".town-event-result", { timeout: 5000 });
    await page.getByRole("button", { name: "町へ戻る" }).click();
    s = await state(page);
    assert(
      s.completedTownEventIds?.includes(chapter.id),
      `Day${chapter.day} event did not complete`
    );
    for (const [npcId, expectedDelta] of Object.entries(chapter.relations)) {
      const before = relationsBeforeChoice[npcId];
      const after = s.npcRelations?.[npcId]?.affinity;
      assert(
        typeof before === "number" && typeof after === "number" && after - before === expectedDelta,
        `Day${chapter.day} relation ripple mismatch for ${npcId}: before=${before} after=${after} expected=${expectedDelta}`
      );
    }
    if (chapter.day === 6) {
      assert(s.flags?.day6_started && s.flags?.day6_cleanup_done, "Day6 compatibility flags missing");
      const className = await page.locator(".town-presentation").getAttribute("class");
      assert(className?.includes("is-festival-cleaned"), `Day6 cleanup dressing did not clear: ${className}`);
    }
    if (captureMilestones && chapter.day === 7) {
      await page.waitForTimeout(280);
      await page.screenshot({ path: `qa-artifacts/${prefix}-day7-memory-world.png`, fullPage: false });
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
  const nextChapterText = (await page.locator(".next-chapter-card").textContent()) ?? "";
  assert(nextChapterText.includes("河岸・船着場"), `Day10 first-choice next chapter hook missing: ${nextChapterText}`);
  return s;
}

async function captureAreas(page, prefix) {
  // Capture the room before extra Day5 conversations can alter transient UI.
  await move(page, "部屋");
  await page.waitForSelector(".room-panel", { timeout: 5000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const roomBounds = await page.evaluate(() => {
    const panel = document.querySelector(".room-panel")?.getBoundingClientRect();
    const content = document.querySelector(".room-content")?.getBoundingClientRect();
    const stage = document.querySelector(".presentation-stage")?.getBoundingClientRect();
    return panel && content && stage
      ? {
          viewportWidth: window.innerWidth,
          panelTop: panel.top,
          panelBottom: panel.bottom,
          contentTop: content.top,
          contentBottom: content.bottom,
          stageTop: stage.top,
          stageBottom: stage.bottom,
        }
      : null;
  });
  assert(roomBounds, "room bounds missing");
  if (roomBounds.viewportWidth <= 599) {
    assert(roomBounds.panelTop >= roomBounds.stageTop - 2, `room panel clipped above stage: ${JSON.stringify(roomBounds)}`);
    assert(roomBounds.panelBottom <= roomBounds.stageBottom + 2, `room panel exceeds stage: ${JSON.stringify(roomBounds)}`);
    assert(roomBounds.contentBottom <= roomBounds.stageBottom + 2, `room controls exceed stage: ${JSON.stringify(roomBounds)}`);
  }
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
    if (slug === "market") {
      const fishmonger = await page.locator(".presentation-primary.art-fishmonger").evaluate((actor) => {
        const image = actor.querySelector(".presentation-character-image-default");
        const stageRect = actor.closest(".presentation-stage")?.getBoundingClientRect();
        const actorRect = actor.getBoundingClientRect();
        const imageRect = image?.getBoundingClientRect();
        return {
          loaded: Boolean(image && image.complete && image.naturalWidth > 0),
          source: image?.currentSrc ?? "",
          actor: { x: actorRect.x, y: actorRect.y, width: actorRect.width, height: actorRect.height },
          image: imageRect ? { x: imageRect.x, y: imageRect.y, width: imageRect.width, height: imageRect.height } : null,
          containedInStage: Boolean(
            stageRect &&
            actorRect.top >= stageRect.top - 1 &&
            actorRect.bottom <= stageRect.bottom + 1
          ),
        };
      });
      assert(fishmonger.loaded, `fishmonger stage art failed to load: ${JSON.stringify(fishmonger)}`);
      assert(fishmonger.actor.width >= 110 && fishmonger.actor.height >= 180, `fishmonger stage art is too small: ${JSON.stringify(fishmonger)}`);
      assert(fishmonger.source.includes("fishmonger-clean.png"), `clean fishmonger source is missing: ${JSON.stringify(fishmonger)}`);
      assert(fishmonger.containedInStage, `fishmonger is clipped by the stage: ${JSON.stringify(fishmonger)}`);
    }
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

  let postAreaState = await state(page);
  if ((postAreaState?.day ?? 0) >= 10) {
    if (!postAreaState.completedTownEventIds?.includes("bond_newsman")) {
      const newsmanAreaLabel = areas.find(([, slug]) => slug === "market")?.[0];
      assert(newsmanAreaLabel, "market area label missing");
      await move(page, newsmanAreaLabel);
      await talk(page, "瓦版屋");
      postAreaState = await state(page);
    }
    for (const marker of ["bond_landlord", "bond_child", "bond_fishmonger", "bond_firechief", "bond_newsman"]) {
      assert(
        postAreaState.completedTownEventIds?.includes(marker),
        `Day10 area sweep should complete ${marker}: ${JSON.stringify(postAreaState.completedTownEventIds)}`
      );
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
    const nearbyTalk = [...document.querySelectorAll(".nearby-talk")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.getBoundingClientRect());
    const nearbyCards = [...document.querySelectorAll(".nearby-person")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.getBoundingClientRect());
    const navButtons = [...document.querySelectorAll(".reference-area-nav button:not(:disabled)")].map((el) => el.getBoundingClientRect());
    const navIcons = [...document.querySelectorAll(".reference-area-nav .area-nav-icon")].map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        backgroundImage: getComputedStyle(el).backgroundImage,
      };
    });
    const people = document.querySelector(".town-side-panel > .side-card:first-child")?.getBoundingClientRect();
    const dock = document.querySelector(".reference-action-dock")?.getBoundingClientRect();
    const rumor = document.querySelector(".town-side-panel > .rumor-card")?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      stageTop: stage?.top ?? null,
      stageHeight: stage?.height ?? null,
      talkWidth: talk?.width ?? null,
      talkHeight: talk?.height ?? null,
      nearbyTalkCount: nearbyTalk.length,
      nearbyCardMinHeight: nearbyCards.length ? Math.min(...nearbyCards.map((r) => r.height)) : 0,
      navMinHeight: navButtons.length ? Math.min(...navButtons.map((r) => r.height)) : 0,
      navOverflow: navButtons.some((r) => r.left < -1 || r.right > window.innerWidth + 1),
      navIcons,
      peopleBottom: people ? people.bottom + scrollY : null,
      dockTop: dock ? dock.top + scrollY : null,
      dockBottom: dock ? dock.bottom + scrollY : null,
      rumorTop: rumor ? rumor.top + scrollY : null,
    };
  });

  assert(result.scrollWidth <= result.viewportWidth + 1, `horizontal overflow: ${JSON.stringify(result)}`);
  assert(result.stageTop !== null && result.stageTop < 220, `scene starts too low: ${JSON.stringify(result)}`);
  const hasLargeDockTalk = (result.talkHeight ?? 0) >= 44;
  const hasPeopleTalk = result.nearbyTalkCount > 0 && result.nearbyCardMinHeight >= 44;
  assert(hasLargeDockTalk || hasPeopleTalk, `no mobile talk affordance with a 44px touch region: ${JSON.stringify(result)}`);
  assert(result.navMinHeight >= 44, `nav touch targets too small: ${JSON.stringify(result)}`);
  assert(!result.navOverflow, `nav overflows viewport: ${JSON.stringify(result)}`);
  if (result.viewportWidth <= 599) {
    if (result.viewportWidth < (result.stageHeight ?? 0) * 2) {
      assert(
        result.navIcons.length === 6 && result.navIcons.every((icon) =>
          icon.backgroundImage.includes("nav-icon-sprite.webp") &&
          icon.width >= 30 && icon.height >= 26 && icon.width / icon.height > 1 && icon.width / icon.height < 1.25
        ),
        `portrait navigation art is missing or distorted: ${JSON.stringify(result.navIcons)}`
      );
    }
    assert(
      result.peopleBottom !== null && result.dockTop !== null && result.dockTop >= result.peopleBottom - 2,
      `mobile travel controls should follow the people rail: ${JSON.stringify(result)}`
    );
    if (result.rumorTop !== null && result.dockBottom !== null) {
      assert(result.dockBottom <= result.rumorTop + 2, `secondary rumor content should follow travel controls: ${JSON.stringify(result)}`);
    }
  }
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


async function verifyAudioPreferencePersistence(page) {
  await page.evaluate(() => localStorage.setItem("oh-edo-muted", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".world-layout", { timeout: 10000 });
  const mutedLabel = (await page.locator(".sound-toggle").textContent())?.trim();
  assert(mutedLabel === "音 OFF", `muted audio preference was not restored: ${mutedLabel}`);

  await page.evaluate(() => localStorage.setItem("oh-edo-muted", "0"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".world-layout", { timeout: 10000 });
  const liveLabel = (await page.locator(".sound-toggle").textContent())?.trim();
  assert(liveLabel === "音 ON", `unmuted audio preference was not restored: ${liveLabel}`);
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


async function assertGeneratedSurfaceStyles(page, { desktop = false } = {}) {
  const surfaces = await page.evaluate((isDesktop) => {
    const side = document.querySelector(".side-card");
    const activeTab = document.querySelector(".reference-area-nav button.active");
    const lifeProp = [...document.querySelectorAll(".scene-life-prop")]
      .find((el) => getComputedStyle(el).display !== "none");
    const statIcon = document.querySelector(".reference-stat-icon");
    const logo = document.querySelector(".reference-logo-image");
    const ambientAccent = [...document.querySelectorAll(".scene-ambient-accent")]
      .find((el) => getComputedStyle(el).display !== "none");
    const crowd = getComputedStyle(document.querySelector(".town-presentation"), "::before").backgroundImage;
    const background = (el) => el ? getComputedStyle(el).backgroundImage : "";
    return {
      sidePanel: background(side),
      activeTab: isDesktop ? background(activeTab) : "",
      lifeProp: background(lifeProp),
      ambientAccent: background(ambientAccent),
      crowd,
      statIcon: isDesktop ? background(statIcon) : "",
      logoSrc: logo?.getAttribute("src") ?? "",
    };
  }, desktop);

  assert(
    surfaces.sidePanel.includes("paper-panel-frame.svg") ||
      surfaces.sidePanel.includes("nearby-panel-frame.png"),
    `approved side-panel surface missing: ${JSON.stringify(surfaces)}`
  );
  assert(
    surfaces.lifeProp.includes("life-prop-sprite.svg"),
    `generated lived-in prop sprite missing: ${JSON.stringify(surfaces)}`
  );
  assert(
    surfaces.ambientAccent.includes("ambient-area-sprite.svg"),
    `generated area ambient accent missing: ${JSON.stringify(surfaces)}`
  );
  assert(
    surfaces.crowd.includes("background-crowd-sprite.svg"),
    `background crowd sprite missing: ${JSON.stringify(surfaces)}`
  );
  assert(
    surfaces.logoSrc.includes("logo-oh-edo-approved.svg"),
    `approved OH EDO logo missing: ${JSON.stringify(surfaces)}`
  );
  if (desktop) {
    assert(
      surfaces.activeTab.includes("nav-tab-frame-active.svg"),
      `generated active navigation surface missing: ${JSON.stringify(surfaces)}`
    );
    assert(
      surfaces.statIcon.includes("hud-stat-icons.svg"),
      `generated HUD stat icon sprite missing: ${JSON.stringify(surfaces)}`
    );
  }
}

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay10(page, "desktop-1600");
  const accessibility = await assertAccessibilityBasics(page);
  await assertGeneratedSurfaceStyles(page, { desktop: true });
  const mockParity = await page.evaluate(() => {
    const visible = (el) => Boolean(el) && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0;
    return {
      navButtons: [...document.querySelectorAll(".reference-area-nav button")].filter(visible).length,
      talkCtaVisible: visible(document.querySelector(".reference-talk-cta")),
      topStats: [...document.querySelectorAll(".reference-stat")].filter(visible).length,
      storyVisible: visible(document.querySelector(".town-flavor-card")),
      rumorVisible: visible(document.querySelector(".rumor-card")),
    };
  });
  assert(mockParity.navButtons >= 5, `approved mock travel tabs missing: ${JSON.stringify(mockParity)}`);
  assert(mockParity.talkCtaVisible, `approved desktop talk CTA missing: ${JSON.stringify(mockParity)}`);
  assert(mockParity.topStats === 6, `desktop HUD should expose six approved-mock stats: ${JSON.stringify(mockParity)}`);
  assert(mockParity.storyVisible && mockParity.rumorVisible, `approved mock side rail hierarchy missing: ${JSON.stringify(mockParity)}`);
  await verifyLegacySaveMigration(page);
  await captureAreas(page, "desktop-1600");
  await captureStatusBook(page, "desktop-1600");
  await verifyPlaytestMode(page);
  await verifyAudioPreferencePersistence(page);
  await verifyPwaOfflineRestore(page, context);
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider, accessibility };
}

async function runMobileChromium() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay10(page, "mobile-390");
  const accessibility = await assertAccessibilityBasics(page);
  const layout = await assertMobileLayout(page);
  await assertGeneratedSurfaceStyles(page);
  await captureAreas(page, "mobile-390");
  await captureStatusBook(page, "mobile-390");
  await browser.close();
  return { day: finalState.day, provider: finalState.fireAftermath?.provider ?? finalState.lastDecision?.provider, layout, accessibility };
}

async function runCompactMobileChromium() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    screen: { width: 375, height: 667 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const finalState = await completeDay1ToDay10(page, "mobile-375", { captureMilestones: false });
  const accessibility = await assertAccessibilityBasics(page);
  const layout = await assertMobileLayout(page);
  const dayTransition = page.locator(".day-transition");
  if (await dayTransition.count()) {
    await dayTransition.waitFor({ state: "hidden", timeout: 5000 });
  }
  await page.screenshot({ path: "qa-artifacts/mobile-375-day10-world.png", fullPage: false });
  await move(page, "商店通り");
  const compactFishmonger = await page.locator(".presentation-primary.art-fishmonger").evaluate((actor) => {
    const image = actor.querySelector(".presentation-character-image-default");
    const stageRect = actor.closest(".presentation-stage")?.getBoundingClientRect();
    const actorRect = actor.getBoundingClientRect();
    return {
      source: image?.currentSrc ?? "",
      containedInStage: Boolean(
        stageRect &&
        actorRect.top >= stageRect.top - 1 &&
        actorRect.bottom <= stageRect.bottom + 1
      ),
    };
  });
  assert(compactFishmonger.source.includes("fishmonger-clean.png"), `compact clean fishmonger source is missing: ${JSON.stringify(compactFishmonger)}`);
  assert(compactFishmonger.containedInStage, `compact fishmonger is clipped: ${JSON.stringify(compactFishmonger)}`);
  await page.screenshot({ path: "qa-artifacts/mobile-375-market-world.png", fullPage: false });
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
  const landscapeBounds = await page.evaluate(() => {
    const stage = document.querySelector(".presentation-stage")?.getBoundingClientRect();
    const dock = document.querySelector(".reference-action-dock")?.getBoundingClientRect();
    return stage && dock
      ? { viewportHeight: window.innerHeight, stageTop: stage.top, stageBottom: stage.bottom, dockTop: dock.top, dockBottom: dock.bottom }
      : null;
  });
  assert(landscapeBounds, "landscape bounds missing");
  assert(landscapeBounds.stageBottom <= landscapeBounds.viewportHeight + 2, `landscape stage exceeds viewport: ${JSON.stringify(landscapeBounds)}`);
  assert(landscapeBounds.dockTop < landscapeBounds.viewportHeight, `landscape action dock is below fold: ${JSON.stringify(landscapeBounds)}`);
  assert(landscapeBounds.dockBottom <= landscapeBounds.viewportHeight + 2, `landscape action dock is clipped: ${JSON.stringify(landscapeBounds)}`);
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-landscape-world.png", fullPage: false });
  const landscapeTalk = page.locator(".reference-talk-cta:visible");
  const railTalk = page.locator(".nearby-talk:visible").first();
  if (await landscapeTalk.count()) {
    await landscapeTalk.click();
  } else {
    assert((await railTalk.count()) > 0, "landscape WebKit has no visible talk affordance");
    await railTalk.click();
  }
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const decoded = JSON.parse(raw);
    return (decoded?.state ?? decoded).screen === "dialog";
  }, STORAGE_KEY);
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  const dialogBounds = await page.locator(".mock-dialog:visible").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewportHeight: window.innerHeight };
  });
  assert(dialogBounds.top >= 0, `landscape dialog is clipped above viewport: ${JSON.stringify(dialogBounds)}`);
  assert(dialogBounds.bottom <= dialogBounds.viewportHeight + 2, `landscape dialog is clipped below viewport: ${JSON.stringify(dialogBounds)}`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-landscape-dialog.png", fullPage: false });
  await advanceDialogs(page);
  assert((await state(page))?.screen === "town", "landscape WebKit conversation did not return to town");
  await move(page, "商店通り");
  const landscapeFishmonger = await page.locator(".presentation-primary.art-fishmonger").evaluate((actor) => {
    const image = actor.querySelector(".presentation-character-image-default");
    const stageRect = actor.closest(".presentation-stage")?.getBoundingClientRect();
    const actorRect = actor.getBoundingClientRect();
    return {
      loaded: Boolean(image && image.complete && image.naturalWidth > 0),
      source: image?.currentSrc ?? "",
      containedInStage: Boolean(
        stageRect &&
        actorRect.top >= stageRect.top - 1 &&
        actorRect.bottom <= stageRect.bottom + 1
      ),
    };
  });
  assert(landscapeFishmonger.loaded, `landscape fishmonger failed to load: ${JSON.stringify(landscapeFishmonger)}`);
  assert(landscapeFishmonger.source.includes("fishmonger-clean.png"), `landscape clean fishmonger source is missing: ${JSON.stringify(landscapeFishmonger)}`);
  assert(landscapeFishmonger.containedInStage, `landscape fishmonger is clipped: ${JSON.stringify(landscapeFishmonger)}`);
  await page.waitForTimeout(260);
  await page.screenshot({ path: "qa-artifacts/iphone-webkit-landscape-market-world.png", fullPage: false });

  await browser.close();
  return { layout, accessibility };
}

async function runLandscapeChromiumChoiceResult() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    screen: { width: 844, height: 390 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  await freshStart(page);
  const initial = await state(page);
  if (!initial?.flags?.met_landlord) {
    await talk(page, "おかみさん");
  }
  await move(page, "商店通り");
  await talk(page, "熊さん");
  await move(page, "長屋前");
  await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
  await advanceDialogs(page);
  await page.waitForSelector(".jobview", { timeout: 5000 });
  const choice = await page.locator(".jobview").evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    const cards = [...panel.querySelectorAll(".legacy-choice-card")].map((card) => {
      const cardRect = card.getBoundingClientRect();
      const title = card.querySelector("h3")?.getBoundingClientRect();
      const effectsElement = card.querySelector(".choice-effects");
      const effects = effectsElement?.getBoundingClientRect();
      const action = card.querySelector(".primary")?.getBoundingClientRect();
      return {
        title: card.querySelector("h3")?.textContent?.trim() ?? "",
        effectCount: effectsElement?.children.length ?? 0,
        effectsClipped: Boolean(effectsElement && effectsElement.scrollHeight > effectsElement.clientHeight + 1),
        contentContained: Boolean(
          title && effects &&
          title.top >= cardRect.top - 1 && title.bottom <= cardRect.bottom + 1 &&
          effects.top >= cardRect.top - 1 && effects.bottom <= cardRect.bottom + 1
        ),
        actionCoversCard: Boolean(
          action && action.height >= cardRect.height - 2 && action.width >= cardRect.width - 2
        ),
      };
    });
    return {
      horizontalOverflow: panel.scrollWidth > panel.clientWidth + 2,
      verticalOverflow: panel.scrollHeight > panel.clientHeight + 2,
      panelContained: rect.top >= -1 && rect.bottom <= innerHeight + 1,
      cards,
    };
  });
  await page.screenshot({ path: "qa-artifacts/chromium-landscape-choice.png", fullPage: false });
  assert(!choice.horizontalOverflow, `landscape choice overflows horizontally: ${JSON.stringify(choice)}`);
  assert(
    !choice.verticalOverflow && choice.panelContained &&
      choice.cards.every((card) => card.contentContained && card.actionCoversCard && !card.effectsClipped),
    `landscape choice hierarchy starts clipped: ${JSON.stringify(choice)}`
  );
  const effectCounts = await page.locator(".jobview .choice-effects").evaluateAll((elements) =>
    elements.map((element) => element.children.length)
  );
  const maxEffectIndex = effectCounts.indexOf(Math.max(...effectCounts));
  await page.locator(".jobview .primary").nth(maxEffectIndex).click();
  await page.waitForSelector(".resultview", { timeout: 5000 });
  await settleResultCapture(page);
  const result = await page.locator(".resultview").evaluate((panel) => {
    const action = panel.querySelector(".status-actions .primary")?.getBoundingClientRect();
    const changesElement = panel.querySelector(".result-change-list");
    const changes = changesElement?.getBoundingClientRect();
    const items = [...panel.querySelectorAll(".result-change-list li")].map((item) => item.getBoundingClientRect());
    const rect = panel.getBoundingClientRect();
    const semanticChildren = [...panel.querySelectorAll(":scope > .area-card, :scope > .card")]
      .filter((element) => getComputedStyle(element).display !== "none")
      .map((element) => element.getBoundingClientRect());
    const summary = panel.querySelector(".area-desc");
    const overlaps = items.some((item, index) => items.slice(index + 1).some((other) =>
      item.left < other.right - 1 && item.right > other.left + 1 &&
      item.top < other.bottom - 1 && item.bottom > other.top + 1
    ));
    return {
      horizontalOverflow: panel.scrollWidth > panel.clientWidth + 2,
      verticalOverflow: panel.scrollHeight > panel.clientHeight + 2,
      overflowPixels: panel.scrollHeight - panel.clientHeight,
      actionVisible: Boolean(action && action.top >= rect.top && action.bottom <= rect.bottom + 1),
      changesVisible: Boolean(
        changes && changesElement && changes.top >= rect.top && changes.bottom <= rect.bottom + 1 &&
        changesElement.scrollHeight <= changesElement.clientHeight + 1
      ),
      itemCount: items.length,
      itemsContained: Boolean(changes && items.every((item) =>
        item.left >= changes.left - 1 && item.right <= changes.right + 1 &&
        item.top >= changes.top - 1 && item.bottom <= changes.bottom + 1
      )),
      itemsOverlap: overlaps,
      semanticContentContained: semanticChildren.every((child) =>
        child.left >= rect.left - 1 && child.right <= rect.right + 1 &&
        child.top >= rect.top - 1 && child.bottom <= rect.bottom + 1
      ),
      summaryClipped: Boolean(summary && summary.scrollHeight > summary.clientHeight + 1),
    };
  });
  await page.screenshot({ path: "qa-artifacts/chromium-landscape-result.png", fullPage: false });
  assert(!result.horizontalOverflow, `landscape result overflows horizontally: ${JSON.stringify(result)}`);
  assert(
    result.actionVisible && result.changesVisible && result.semanticContentContained && !result.summaryClipped &&
      result.itemCount === Math.max(...effectCounts) && result.itemsContained && !result.itemsOverlap,
    `landscape result hierarchy starts clipped: ${JSON.stringify(result)}`
  );
  const beforeReload = await state(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".resultview", { timeout: 5000 });
  const afterReload = await state(page);
  assert(afterReload?.screen === "result", "landscape reload lost the reward screen");
  assert(
    afterReload.playerActions.length === beforeReload.playerActions.length,
    "landscape reload duplicated the reward"
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  const portraitResult = await page.locator(".resultview").evaluate((panel) => ({
    horizontalOverflow: panel.scrollWidth > panel.clientWidth + 2,
    viewportOverflow: panel.getBoundingClientRect().right > innerWidth + 1,
    itemCount: panel.querySelectorAll(".result-change-list li").length,
  }));
  assert(
    !portraitResult.horizontalOverflow && !portraitResult.viewportOverflow &&
      portraitResult.itemCount === Math.max(...effectCounts),
    `rotated reward layout is clipped: ${JSON.stringify(portraitResult)}`
  );
  await browser.close();
  return { choice, result, portraitResult };
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
    const dockTalk = page.locator(".reference-talk-cta:visible");
    if (await dockTalk.count()) {
      await dockTalk.click();
    } else {
      const peopleTalk = page.locator(".nearby-talk:visible").first();
      assert((await peopleTalk.count()) > 0, "portrait WebKit has no visible talk affordance");
      await peopleTalk.click();
    }
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
const landscapeChoiceResult = await runLandscapeChromiumChoiceResult();
const desktop = await runDesktop();
const mobile = await runMobileChromium();
const compactMobile = await runCompactMobileChromium();
console.log(JSON.stringify({ ok: true, desktop, mobile, compactMobile, iphone, iphoneLandscape, landscapeChoiceResult }, null, 2));
