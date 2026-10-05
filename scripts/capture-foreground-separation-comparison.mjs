import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const root = "qa-artifacts/foreground-separation";
const cases = [["nagaya", "landlord", "大家さん"], ["market", "fishmonger", "魚屋さん"],
  ["market", "newsman", "瓦版屋"], ["firehouse", "firechief", "火消し頭"], ["well", "child", "子ども"]];
const browser = await chromium.launch({ headless: true });
for (const [label, width, height] of [["375x667",375,667], ["390x844",390,844], ["844x390",844,390]]) {
  const page = await browser.newPage({ viewport: { width: width * 5, height: (height + 38) * 4 + 46 }, deviceScaleFactor: 1 });
  const rows = [];
  for (const view of ["town", "dialog"]) {
    for (const phase of ["before", "after"]) {
      const figures = [];
      for (const [area, npc, name] of cases) {
        const bytes = await readFile(`${root}/${phase}/${label}-${area}-${npc}-${view}.png`);
        figures.push(`<figure><figcaption>${view === "town" ? "町" : "会話"}・${phase === "before" ? "変更前" : "変更後"}・${name}</figcaption><img src="data:image/png;base64,${bytes.toString("base64")}" width="${width}" height="${height}"></figure>`);
      }
      rows.push(`<section>${figures.join("")}</section>`);
    }
  }
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#f5ecd9;color:#263233;font:16px Meiryo,sans-serif}h1{font-size:18px;margin:0;padding:10px;height:46px}section{display:grid;grid-template-columns:repeat(5,${width}px)}figure{margin:0}figcaption{height:38px;padding:8px;border-top:1px solid #baa080;font-weight:bold}img{display:block}</style><h1>${label} — 輪郭影と背景のみの薄い暗幕（同配置・同Day6状態・素材変更なし）</h1>${rows.join("")}`);
  await page.locator("img").evaluateAll((images) => Promise.all(images.map((img) => img.decode())));
  await page.screenshot({ path: `${root}/oh-edo-foreground-${label}-before-after.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log("Three native-resolution five-person town/dialogue before/after comparisons captured.");
