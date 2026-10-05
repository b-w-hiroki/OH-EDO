import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4173";
await mkdir("screenshots", { recursive: true });

async function startToTown(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const start = page.getByRole("button", { name: /大江戸町へ|つづきから/ });
  if (await start.count()) await start.click();

  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(180);
    const dialog = page.locator(".mock-dialog:visible");
    if (await dialog.count()) {
      await dialog.first().evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
      continue;
    }
    if (await page.locator(".world-layout").count()) break;
  }

  await page.waitForTimeout(500);
  for (let i = 0; i < 8; i++) {
    const dialog = page.locator(".mock-dialog:visible");
    if (!(await dialog.count())) break;
    await dialog.first().evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    await page.waitForTimeout(160);
  }
  await page.waitForSelector(".world-layout", { timeout: 10000 });
}

async function capture(name, viewport, mobile = false) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".mock-title", { timeout: 10000 });
  await page.waitForTimeout(300);
  const titleBounds = await page.evaluate(() => {
    const title = document.querySelector(".mock-title")?.getBoundingClientRect();
    return title ? { top: title.top, bottom: title.bottom, height: title.height, viewportHeight: window.innerHeight } : null;
  });
  if (!titleBounds) throw new Error("title bounds missing");
  if (viewport.width <= 599 && titleBounds.height < titleBounds.viewportHeight * 0.82) {
    throw new Error(`mobile title under-fills viewport: ${JSON.stringify(titleBounds)}`);
  }
  const titleControlsVisible = await page.evaluate(() => {
    const hero = document.querySelector(".title-hero")?.getBoundingClientRect();
    const start = document.querySelector(".title-start")?.getBoundingClientRect();
    return Boolean(hero && hero.height > 100 && start && start.top >= 0 && start.bottom <= innerHeight + 1);
  });
  if (!titleControlsVisible) throw new Error(`title image or start action is outside the first screen: ${name}`);
  await page.screenshot({ path: `screenshots/${name}-title.png`, fullPage: false });

  await startToTown(page);
  await page.screenshot({ path: `screenshots/${name}-world.png`, fullPage: false });

  const rowTalk = page.locator(".nearby-talk:visible").first();
  const mainTalk = page.locator(".reference-talk-cta:visible").first();
  if (await rowTalk.count()) {
    // Dispatch directly so viewport screenshots stay anchored to the top.
    await rowTalk.evaluate((el) =>
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    );
  } else if (await mainTalk.count()) {
    await mainTalk.click();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  if (await page.locator(".mock-dialog:visible").count()) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots/${name}-dialog.png`, fullPage: false });
  }

  await browser.close();
}

await capture("desktop-1600", { width: 1600, height: 900 });
await capture("mobile-430", { width: 430, height: 932 }, true);
await capture("mobile-375", { width: 375, height: 667 }, true);
await capture("mobile-390", { width: 390, height: 844 }, true);
await capture("landscape-844", { width: 844, height: 390 }, true);

console.log("Captured actual OH!EDO! browser screenshots.");
