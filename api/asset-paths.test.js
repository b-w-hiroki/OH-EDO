import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.tsx?$/.test(entry.name) ? [target] : [];
  }));
  return files.flat();
}

test("runtime source does not use root-absolute public asset paths", async () => {
  const root = path.resolve("src");
  const offenders = [];

  for (const file of await sourceFiles(root)) {
    const source = await readFile(file, "utf8");
    if (/['"]\/assets\//.test(source)) {
      offenders.push(path.relative(process.cwd(), file));
    }
  }

  assert.deepEqual(offenders, [], `Use publicAsset() for runtime public assets: ${offenders.join(", ")}`);
});
