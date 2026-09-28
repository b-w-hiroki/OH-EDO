import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.OH_EDO_URL ?? "http://127.0.0.1:4173";
await mkdir("qa-artifacts", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  screen: { width: 430, height: 932 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: 1_600_000 / 8,
  uploadThroughput: 750_000 / 8,
  connectionType: "cellular4g",
});

const responseBytes = new Map();
client.on("Network.loadingFinished", (event) => {
  responseBytes.set(event.requestId, event.encodedDataLength ?? 0);
});

const startedAt = Date.now();
await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
const wallMs = Date.now() - startedAt;

const timing = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const resources = performance.getEntriesByType("resource");
  const paints = performance.getEntriesByType("paint");
  const firstPaint = paints.find((entry) => entry.name === "first-paint");
  const firstContentfulPaint = paints.find((entry) => entry.name === "first-contentful-paint");
  return {
    domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
    loadEventMs: nav ? nav.loadEventEnd : null,
    responseEndMs: nav ? nav.responseEnd : null,
    firstPaintMs: firstPaint?.startTime ?? null,
    firstContentfulPaintMs: firstContentfulPaint?.startTime ?? null,
    resourceCount: resources.length,
    transferSizeFromPerformance: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    decodedBodySize: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
    bodyTextLength: document.body.innerText.length,
    domNodes: document.querySelectorAll("*").length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  };
});

const cdpEncodedBytes = [...responseBytes.values()].reduce((sum, value) => sum + value, 0);
const report = {
  generatedAt: new Date().toISOString(),
  profile: "CI Chromium 430x932 / emulated cellular4g",
  baseURL,
  wallMs,
  cdpEncodedBytes,
  ...timing,
};

if (report.scrollWidth > report.viewportWidth + 1) {
  throw new Error(`performance profile detected horizontal overflow: ${report.scrollWidth} > ${report.viewportWidth}`);
}
if (report.wallMs > 20000) {
  throw new Error(`local slow-network load exceeded 20s: ${report.wallMs}ms`);
}

await writeFile("qa-artifacts/perf-local.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
