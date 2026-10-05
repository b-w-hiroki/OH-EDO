import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const output = "qa-artifacts/character-art-integration";
const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4318";
await mkdir(`${output}/video`, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  recordVideo: { dir: `${output}/video`, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
async function pause(ms = 700) { await page.waitForTimeout(ms); }
async function dialogs() {
  for (let i = 0; i < 40 && await page.locator(".mock-dialog:visible").count(); i++) {
    await pause(800);
    await page.locator(".mock-dialog:visible .dialog-next-cue").click();
  }
}
async function move(label) {
  await page.locator(".reference-area-nav button").filter({ hasText: label }).first().click();
  await pause(1000);
}
await page.goto(baseURL, { waitUntil: "networkidle" });
await pause(1200);
await page.locator(".mock-title button").first().click();
await dialogs();
await pause();
await page.locator(".person-focus-talk").click();
await dialogs();
await move("商店通り");
await page.locator(".person-picker-toggle").click();
await pause();
await page.locator(".person-picker button").filter({ hasText: "熊さん" }).click();
await pause();
await page.locator(".person-focus-talk").click();
await dialogs();
await move("長屋前");
await dialogs();
await page.locator(".jobview").waitFor();
await pause(1400);
await page.reload({ waitUntil: "networkidle" });
await pause(1000);
await page.locator(".jobview .primary").first().click();
await page.locator(".resultview").waitFor();
await pause(1700);
await page.reload({ waitUntil: "networkidle" });
await pause(1000);
await page.locator(".resultview .status-actions .primary").click();
await dialogs();
await pause(1200);
const finalState = await page.evaluate(() => JSON.parse(localStorage.getItem("oh-edo-mvp-save-v2")).state);
if (finalState.day !== 2 || finalState.screen !== "town") throw new Error("Day1 operation loop did not return to town");
const video = page.video();
await context.close();
const source = await video.path();
await browser.close();
const ffmpeg = process.env.FFMPEG_PATH ?? resolve("../OH-EDO-ui-coherence/node_modules/ffmpeg-static/ffmpeg.exe");
await new Promise((ok, reject) => {
  const child = spawn(ffmpeg, ["-y", "-i", source, "-c:v", "libx264", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${output}/oh-edo-operation-390x844.mp4`]);
  let stderr = "";
  child.stderr.on("data", (data) => { stderr += data; });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? ok() : reject(new Error(stderr)));
});
console.log(JSON.stringify({ finalDay: finalState.day, screen: finalState.screen, video: `${output}/oh-edo-operation-390x844.mp4`, codec: "H.264", pixelFormat: "yuv420p" }));
