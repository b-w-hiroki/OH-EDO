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
  const brand = buffer.subarray(4, 12).toString("ascii");
  if (!brand.includes("ftyp")) throw new Error(`invalid AVIF payload for ${name}`);
  await writeFile(join(outDir, name + ".avif"), buffer);
  console.log(`${name}: ${buffer.length} bytes`);
}
