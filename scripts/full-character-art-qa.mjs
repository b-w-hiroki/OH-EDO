import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4317";
const output = process.env.OH_EDO_ART_QA_OUTPUT ?? "qa-artifacts/character-art-integration/after";
await mkdir(output, { recursive: true });

const cases = [
  ["nagaya", "landlord"],
  ["nagaya", "child"],
  ["market", "fishmonger"],
  ["market", "newsman"],
  ["well", "child"],
  ["firehouse", "firechief"],
];
const viewports = [
  ["375x667", 375, 667],
  ["390x844", 390, 844],
  ["844x390", 844, 390],
  ["1600x900", 1600, 900],
];
const expectedAsset = {
  landlord: "renewed/landlord.webp",
  child: "renewed/child.webp",
  fishmonger: "renewed/fishmonger.webp",
  newsman: "renewed/newsman.webp",
  firechief: "renewed/firechief.webp",
};
const expectedPortrait = {
  landlord: "renewed/portraits/landlord.webp",
  child: "renewed/portraits/child.webp",
  fishmonger: "portraits/fishmonger.png",
  newsman: "portraits/newsman.png",
  firechief: "renewed/portraits/firechief.webp",
};
const results = [];

async function loadFixture(page, area, selected) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(({ area, selected }) => {
    const relations = Object.fromEntries(
      ["landlord", "fishmonger", "child", "newsman", "firechief", "kumitori_master"]
        .map((id) => [id, { affinity: 3, caution: 0, familiarity: 3, attitude: "friendly" }])
    );
    const state = {
      screen: "town",
      day: 6,
      time: "afternoon",
      currentArea: area,
      flags: {
        intro_done: true,
        met_landlord: true,
        room_unlocked: true,
        met_fishmonger: true,
        met_child: true,
        met_newsman: true,
        met_firechief: true,
        firehouse_unlocked: true,
        rumor_heard_kumitori: true,
        kumitori_event_started: true,
        kumitori_job_done: true,
        day1_ended: true,
        day2_started: true,
        fire_intro_started: true,
        fire_event_done: true,
        day3_started: true,
        patrol_started: true,
        patrol_done: true,
        day4_started: true,
        episode_landlord_done: true,
        episode_fishmonger_done: true,
        episode_child_done: true,
        episode_newsman_done: true,
        festival_started: true,
        festival_done: true,
        day5_started: true,
        day6_started: true,
        day6_cleanup_done: false,
      },
      npcRelations: relations,
      completedTownEventIds: [],
      dialog: null,
    };
    localStorage.setItem("oh-edo-mvp-save-v2", JSON.stringify({
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      state,
    }));
    localStorage.setItem("oh-edo:npc-selection", JSON.stringify({ [area]: selected }));
  }, { area, selected });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".world-layout");
  await page.waitForSelector(".presentation-primary .presentation-character-image-default");
}

async function validateSeparation(page) {
  const separation = await page.evaluate(() => {
    const stage = document.querySelector(".town-art-stage");
    const frame = stage.getBoundingClientRect();
    const scene = stage.querySelector(".town-presentation");
    const background = scene.querySelector(".town-background");
    const dimmer = getComputedStyle(background, "::after");
    const cast = [...scene.querySelectorAll(".presentation-player, .presentation-primary")].map((actor) => {
      const image = actor.querySelector(".presentation-character-image-default");
      const style = getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      const match = style.filter.match(/^drop-shadow\((rgba?\([^)]*\))\s+([\d.-]+)px\s+([\d.-]+)px\s+([\d.-]+)px\)$/);
      const [x, y, blur] = match ? match.slice(2).map(Number) : [Infinity, Infinity, Infinity];
      const halo = blur * 3;
      return {
        filter: style.filter, singleAlphaShadow: Boolean(match), x, y, blur,
        opacity: style.opacity, actorOpacity: getComputedStyle(actor).opacity,
        actorFilter: getComputedStyle(actor).filter,
        aboveBackground: Number(getComputedStyle(actor).zIndex) > Number(getComputedStyle(background).zIndex),
        shadowContained: rect.left + Math.min(0, x) - halo >= frame.left - 1 &&
          rect.right + Math.max(0, x) + halo <= frame.right + 1 &&
          rect.top + Math.min(0, y) - halo >= frame.top - 1 &&
          rect.bottom + Math.max(0, y) + halo <= frame.bottom + 1,
      };
    });
    const alpha = Number(dimmer.backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1]);
    return {
      dimmerColor: dimmer.backgroundColor, dimmerAlpha: alpha,
      backgroundOnly: dimmer.content === '\"\"' && dimmer.pointerEvents === "none" &&
        getComputedStyle(stage).filter === "none" && getComputedStyle(scene).filter === "none",
      cast,
    };
  });
  if (!separation.backgroundOnly || !Number.isFinite(separation.dimmerAlpha) ||
      separation.dimmerAlpha < .12 || separation.dimmerAlpha > .2 ||
      !separation.cast.every((actor) => actor.singleAlphaShadow && actor.shadowContained && actor.aboveBackground &&
        actor.x >= 2 && actor.x <= 4 && actor.y >= 2 && actor.y <= 4 && actor.blur <= 1.25 &&
        actor.opacity === "1" && actor.actorOpacity === "1" && actor.actorFilter === "none")) {
    throw new Error(`foreground separation failed: ${JSON.stringify(separation)}`);
  }
  return separation;
}

async function validateCase(page, viewportLabel, area, selected) {
  await loadFixture(page, area, selected);
  await page.waitForTimeout(280);
  const town = await page.evaluate(({ selected, expected }) => {
    const stage = document.querySelector(".town-presentation");
    const character = document.querySelector(".presentation-primary");
    const image = character?.querySelector(".presentation-character-image-default");
    const talk = document.querySelector(".person-focus-talk");
    const picker = document.querySelector(".person-picker-toggle");
    const portraitFrame = document.querySelector(".person-focus-portrait")?.getBoundingClientRect();
    const portraitImage = document.querySelector(".person-focus-portrait img")?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    const charRect = character?.getBoundingClientRect();
    const talkStyle = talk ? getComputedStyle(talk) : null;
    const pickerStyle = picker ? getComputedStyle(picker) : null;
    const artStage = document.querySelector(".town-art-stage").getBoundingClientRect();
    const measure = (actor) => {
      const img = actor.querySelector(".presentation-character-image-default");
      const r = img.getBoundingClientRect();
      const scale = r.height / img.naturalHeight;
      return {
        bodyHeight: (Number(img.dataset.artFoot) - Number(img.dataset.artHead)) * scale,
        footY: r.top + Number(img.dataset.artFoot) * scale,
        wholeArtContained: r.left >= artStage.left - 1 && r.right <= artStage.right + 1 && r.top >= artStage.top - 1 && r.bottom <= artStage.bottom + 1,
      };
    };
    const primaryGeometry = measure(character);
    const playerGeometry = measure(document.querySelector(".presentation-player"));
    return {
      stageClass: stage?.className ?? "",
      asset: image?.getAttribute("src") ?? "",
      imageComplete: image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      stage: stageRect && { width: stageRect.width, height: stageRect.height },
      character: charRect && {
        left: charRect.left,
        top: charRect.top,
        right: charRect.right,
        bottom: charRect.bottom,
        width: charRect.width,
        height: charRect.height,
      },
      viewport: { width: innerWidth, height: innerHeight },
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      talkHeight: talk?.getBoundingClientRect().height ?? 0,
      talkFont: Number.parseFloat(talkStyle?.fontSize ?? "0"),
      pickerHeight: picker?.getBoundingClientRect().height ?? 0,
      pickerFont: Number.parseFloat(pickerStyle?.fontSize ?? "0"),
      matchesExpected: (image?.getAttribute("src") ?? "").includes(expected[selected]),
      primaryGeometry,
      playerGeometry,
      bodyRatio: primaryGeometry.bodyHeight / playerGeometry.bodyHeight,
      baselineDelta: Math.abs(primaryGeometry.footY - playerGeometry.footY),
      portraitContained: Boolean(portraitFrame && portraitImage &&
        portraitImage.left >= portraitFrame.left - 1 && portraitImage.right <= portraitFrame.right + 1 &&
        portraitImage.top >= portraitFrame.top - 1 && portraitImage.bottom <= portraitFrame.bottom + 1),
    };
  }, { selected, expected: expectedAsset });

  if (!town.imageComplete || !town.matchesExpected) throw new Error(`asset failed: ${viewportLabel} ${area} ${selected}`);
  if (!town.portraitContained) throw new Error(`town portrait escapes its frame: ${viewportLabel} ${area} ${selected}`);
  const expectedStature = selected === "child" ? .72 : 1;
  if (Math.abs(town.bodyRatio - expectedStature) > .015 || town.baselineDelta > 1 ||
      !town.primaryGeometry.wholeArtContained || !town.playerGeometry.wholeArtContained) {
    throw new Error(`unfair scale/baseline or clipped art: ${JSON.stringify(town)}`);
  }
  if (town.horizontalOverflow > 1) throw new Error(`horizontal overflow: ${JSON.stringify(town)}`);
  if (town.talkHeight < 44 || town.pickerHeight < 44 || town.talkFont < 16 || town.pickerFont < 14) {
    throw new Error(`control sizing failed: ${JSON.stringify(town)}`);
  }

  town.separation = await validateSeparation(page);
  await page.screenshot({ path: `${output}/${viewportLabel}-${area}-${selected}-town.png` });

  const toggle = page.locator(".person-picker-toggle:visible").first();
  await toggle.click();
  const picker = page.locator(".person-picker:visible");
  await picker.waitFor();
  await picker.press("End");
  const focusedPickerOption = await page.evaluate(() => document.activeElement?.closest(".person-picker") !== null);
  if (!focusedPickerOption) throw new Error("picker End key did not retain option focus");
  await picker.press("Escape");
  await page.waitForTimeout(80);
  const focusRestored = await toggle.evaluate((el) => document.activeElement === el);
  if (!focusRestored) throw new Error("picker Escape did not restore toggle focus");

  await page.locator(".person-focus-talk:visible").click();
  await page.waitForSelector(".mock-dialog:visible");
  await page.waitForTimeout(300);
  const dialog = await page.evaluate(({ selected, expected }) => {
    const text = document.querySelector(".mock-dialog .dialog-text");
    const next = document.querySelector(".mock-dialog .dialog-next-cue");
    const portrait = document.querySelector(".mock-dialog .dialog-portrait img");
    const style = text ? getComputedStyle(text) : null;
    const stage = document.querySelector(".town-art-stage").getBoundingClientRect();
    const actors = [...document.querySelectorAll(".presentation-primary, .presentation-player")].map((actor) => {
      const img = actor.querySelector(".presentation-character-image-default");
      const r = img.getBoundingClientRect();
      const scale = r.height / img.naturalHeight;
      return { bodyHeight: (Number(img.dataset.artFoot) - Number(img.dataset.artHead)) * scale,
        footY: r.top + Number(img.dataset.artFoot) * scale,
        contained: r.left >= stage.left - 1 && r.right <= stage.right + 1 && r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1 };
    });
    const panel = document.querySelector(".mock-dialog").getBoundingClientRect();
    return {
      textFont: Number.parseFloat(style?.fontSize ?? "0"),
      lineHeight: Number.parseFloat(style?.lineHeight ?? "0"),
      nextHeight: next?.getBoundingClientRect().height ?? 0,
      portrait: portrait?.getAttribute("src") ?? "",
      portraitComplete: portrait instanceof HTMLImageElement && portrait.complete && portrait.naturalWidth > 0,
      portraitMatches: (portrait?.getAttribute("src") ?? "").includes(expected[selected]),
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      artContained: actors.every((actor) => actor.contained),
      artBaselineDelta: Math.abs(actors[0].footY - actors[1].footY),
      artBodyRatio: actors[1].bodyHeight / actors[0].bodyHeight,
      noArtUiOverlap: panel.top >= stage.bottom - 1 || panel.left >= stage.right - 1,
    };
  }, { selected, expected: expectedPortrait });
  if (dialog.textFont < 16 || dialog.lineHeight < 22 || dialog.horizontalOverflow > 1) {
    throw new Error(`dialog sizing failed: ${JSON.stringify(dialog)}`);
  }
  if (!dialog.portraitComplete || !dialog.portraitMatches) {
    throw new Error(`portrait failed: ${viewportLabel} ${area} ${selected} ${JSON.stringify(dialog)}`);
  }
  if (!dialog.artContained || !dialog.noArtUiOverlap || dialog.artBaselineDelta > 1 ||
      Math.abs(dialog.artBodyRatio - expectedStature) > .015) {
    throw new Error(`dialog placement failed: ${JSON.stringify(dialog)}`);
  }
  dialog.separation = await validateSeparation(page);
  await page.screenshot({ path: `${output}/${viewportLabel}-${area}-${selected}-dialog.png` });

  if (viewportLabel === "390x844" && area === "nagaya" && selected === "landlord") {
    await page.evaluate(() => {
      const key = "oh-edo-mvp-save-v2";
      const save = JSON.parse(localStorage.getItem(key));
      save.state.dialog.lines[0].text = "長い会話も、本文をスクロールして最後まで読めます。".repeat(35);
      localStorage.setItem(key, JSON.stringify(save));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".dialog-text");
    await page.waitForTimeout(300);
    const text = page.locator(".dialog-text");
    await text.click();
    await text.press("Space");
    await text.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const readable = await text.evaluate((el) => el.scrollHeight > el.clientHeight && el.scrollTop > 0);
    const unchanged = await page.evaluate(() => JSON.parse(localStorage.getItem("oh-edo-mvp-save-v2")).state.dialog.index === 0);
    if (!readable || !unchanged) throw new Error("reading long text advanced the conversation or could not scroll");
    await page.screenshot({ path: `${output}/390x844-long-dialog-scrolled.png` });
    await page.locator(".dialog-next-cue").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    const nextIndex = await page.evaluate(() => JSON.parse(localStorage.getItem("oh-edo-mvp-save-v2")).state.dialog?.index);
    if (nextIndex !== 1) throw new Error(`focused Enter advanced more than once: ${nextIndex}`);
  }

  for (let i = 0; i < 12 && await page.locator(".mock-dialog:visible").count(); i += 1) {
    await page.locator(".mock-dialog:visible .dialog-next-cue").first().click();
    await page.waitForTimeout(50);
  }
  await page.waitForSelector(".presentation-stage.screen-town");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".presentation-stage.screen-town");
  const persisted = await page.locator(".presentation-primary").evaluate(
    (el, selected) => el.classList.contains(`art-${selected}`),
    selected
  );
  if (!persisted) throw new Error(`selected person did not persist: ${area} ${selected}`);

  results.push({ viewport: viewportLabel, area, selected, town, dialog, persisted });
}

const browser = await chromium.launch({ channel: process.platform === "win32" ? "msedge" : undefined, headless: true });
for (const [viewportLabel, width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const [area, selected] of cases) {
    await validateCase(page, viewportLabel, area, selected);
  }
  if (viewportLabel === "390x844") {
    await loadFixture(page, "nagaya", "landlord");
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(150);
    const rotatedOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (rotatedOverflow > 1) throw new Error(`rotation overflow: ${rotatedOverflow}`);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.close();
}
await browser.close();
await writeFile(`${output}/qa-report.json`, JSON.stringify({ results }, null, 2));
console.log(JSON.stringify({ passed: results.length, output }));
