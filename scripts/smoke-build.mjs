import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url);
const indexPath = new URL("index.html", dist);
const index = await readFile(indexPath, "utf8");
if (!index.includes("./assets/")) {
  throw new Error("dist/index.html must use relative asset paths for Pages");
}


const manifestPath = new URL("manifest.webmanifest", dist);
const swPath = new URL("sw.js", dist);
const [manifestRaw, serviceWorker] = await Promise.all([
  readFile(manifestPath, "utf8"),
  readFile(swPath, "utf8"),
]);
const manifest = JSON.parse(manifestRaw);
if (manifest.display !== "standalone" || manifest.start_url !== "./") {
  throw new Error("PWA manifest must stay installable under the Pages subpath");
}
if (!serviceWorker.includes("oh-edo-v1")) {
  throw new Error("service worker cache version missing");
}



const generatedRuntimeAssets = [
  "assets/edo/ui/generated/runtime/logo-approved-mock.webp",
  "assets/edo/ui/generated/runtime/nav-icon-sprite.webp",
  "assets/edo/ui/generated/runtime/paper-panel-frame.svg",
  "assets/edo/ui/generated/runtime/nav-tab-frame.svg",
  "assets/edo/ui/generated/runtime/nav-tab-frame-active.svg",
  "assets/edo/ui/generated/runtime/dialog-frame.svg",
  "assets/edo/ui/generated/runtime/notice-frame.svg",
  "assets/edo/ui/generated/runtime/rail-icon-sprite.svg",
  "assets/edo/ui/generated/runtime/life-prop-sprite.svg",
  "assets/edo/ui/generated/runtime/consequence-prop-sprite.svg",
  "assets/edo/ui/generated/runtime/festival-garland.svg",
];
for (const relative of generatedRuntimeAssets) {
  const path = new URL(relative, dist);
  const info = await stat(path);
  if (info.size === 0) throw new Error(`empty generated runtime asset: ${relative}`);
}

const assetsDir = new URL("assets/", dist);
const files = await readdir(assetsDir);
const js = files.filter((name) => name.endsWith(".js"));
const css = files.filter((name) => name.endsWith(".css"));
if (js.length === 0 || css.length === 0) {
  throw new Error("expected JS and CSS assets in dist/assets");
}

let combined = "";
let totalJsBytes = 0;
let largestJsBytes = 0;
for (const name of js) {
  const path = new URL(`assets/${name}`, dist);
  const info = await stat(path);
  if (info.size === 0) throw new Error(`empty bundle: ${name}`);
  totalJsBytes += info.size;
  largestJsBytes = Math.max(largestJsBytes, info.size);
  combined += await readFile(path, "utf8");
}

let totalCssBytes = 0;
for (const name of css) {
  const path = new URL(`assets/${name}`, dist);
  const info = await stat(path);
  if (info.size === 0) throw new Error(`empty stylesheet: ${name}`);
  totalCssBytes += info.size;
}

const budgets = {
  totalJsBytes: 1024 * 1024,
  largestJsBytes: 600 * 1024,
  totalCssBytes: 300 * 1024,
};
if (totalJsBytes > budgets.totalJsBytes) {
  throw new Error(`JS budget exceeded: ${totalJsBytes} > ${budgets.totalJsBytes}`);
}
if (largestJsBytes > budgets.largestJsBytes) {
  throw new Error(`largest JS chunk budget exceeded: ${largestJsBytes} > ${budgets.largestJsBytes}`);
}
if (totalCssBytes > budgets.totalCssBytes) {
  throw new Error(`CSS budget exceeded: ${totalCssBytes} > ${budgets.totalCssBytes}`);
}

for (const token of ["OH！EDO！", "火消し小屋", "Decision"]) {
  if (!combined.includes(token)) {
    throw new Error(`production bundle missing expected token: ${token}`);
  }
}

console.log(
  `smoke-build: production bundle looks healthy (js=${totalJsBytes}B, largest=${largestJsBytes}B, css=${totalCssBytes}B)`
);
