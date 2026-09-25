import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const staging = ".asset-staging";
const outDir = "public/assets/edo/backgrounds";
await mkdir(outDir, { recursive: true });

const names = ["nagaya", "well", "market", "firehouse", "room"];
for (const name of names) {
  const files = (await readdir(staging))
    .filter((file) => file.startsWith(name + ".part"))
    .sort();
  if (files.length === 0) throw new Error(`missing staged chunks for ${name}`);
  const chunks = [];
  for (const file of files) chunks.push((await readFile(join(staging, file), "utf8")).trim());
  const buffer = Buffer.from(chunks.join(""), "base64");
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error(`invalid WebP payload for ${name}`);
  }
  await writeFile(join(outDir, name + ".webp"), buffer);
  console.log(`${name}: ${buffer.length} bytes`);
}
