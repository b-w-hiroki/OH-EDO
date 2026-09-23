import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url);
const indexPath = new URL("index.html", dist);
const index = await readFile(indexPath, "utf8");
if (!index.includes("./assets/")) {
  throw new Error("dist/index.html must use relative asset paths for Pages");
}

const assetsDir = new URL("assets/", dist);
const files = await readdir(assetsDir);
const js = files.filter((name) => name.endsWith(".js"));
const css = files.filter((name) => name.endsWith(".css"));
if (js.length === 0 || css.length === 0) {
  throw new Error("expected JS and CSS assets in dist/assets");
}

let combined = "";
for (const name of js) {
  const path = new URL(`assets/${name}`, dist);
  const info = await stat(path);
  if (info.size === 0) throw new Error(`empty bundle: ${name}`);
  combined += await readFile(path, "utf8");
}

for (const token of ["OH！EDO！", "火消し小屋", "Decision"]) {
  if (!combined.includes(token)) {
    throw new Error(`production bundle missing expected token: ${token}`);
  }
}

console.log("smoke-build: production bundle looks healthy");
