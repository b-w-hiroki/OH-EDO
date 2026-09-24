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

  await startToTown(page);
  await page.screenshot({ path: `screenshots/${name}-world.png`, fullPage: false });

  const talk = page.locator(".nearby-talk:visible").first();
  if (await talk.count()) {
    await talk.click();
    await page.waitForSelector(".mock-dialog:visible", { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots/${name}-dialog.png`, fullPage: false });
  }

  await browser.close();
}

await capture("desktop-1600", { width: 1600, height: 900 });
await capture("mobile-430", { width: 430, height: 932 }, true);

console.log("Captured actual OH!EDO! browser screenshots.");
