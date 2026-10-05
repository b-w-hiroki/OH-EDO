import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4317";
const phase = process.env.OH_EDO_QA_PHASE ?? "before";
const output = `qa-artifacts/character-art-integration/${phase}`;
await mkdir(output, { recursive: true });

async function startToTown(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const start = page.locator(".mock-title button:visible").first();
  await start.click();
  for (let i = 0; i < 18; i += 1) {
    const dialog = page.locator(".mock-dialog:visible");
    if (await dialog.count()) {
      await dialog.first().click({ position: { x: 20, y: 20 } });
      await page.waitForTimeout(80);
      continue;
    }
    if (await page.locator(".world-layout").count()) break;
    await page.waitForTimeout(80);
  }
  await page.waitForSelector(".world-layout");
}

async function capture(label, viewport) {
  const browser = await chromium.launch({ channel: process.platform === "win32" ? "msedge" : undefined, headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await startToTown(page);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/${label}-town.png` });
  const talk = page.locator(".person-focus-talk:visible").first();
  if (await talk.count()) {
    await talk.click();
    await page.waitForSelector(".mock-dialog:visible");
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/${label}-dialog.png` });
  }
  await browser.close();
}

await capture("mobile-375x667", { width: 375, height: 667 });
await capture("mobile-390x844", { width: 390, height: 844 });
await capture("landscape-844x390", { width: 844, height: 390 });
await capture("desktop-1600x900", { width: 1600, height: 900 });
