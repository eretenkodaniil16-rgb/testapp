import { mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const payloadDir = path.join(root, "scripts", "surgery-payload");
const parts = (await readdir(payloadDir))
  .filter((name) => /^part\d+\.txt$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));
if (parts.length === 0) throw new Error("[surgery-import] payload parts are missing");

const encoded = (await Promise.all(parts.map((name) => readFile(path.join(payloadDir, name), "utf8")))).join("").replace(/\s+/gu, "");
const compressed = Buffer.from(encoded, "base64");
const decoded = execFileSync("xz", ["-dc"], { input: compressed, maxBuffer: 64 * 1024 * 1024 });
const files = JSON.parse(decoded.toString("utf8"));

for (const [relativePath, payload] of Object.entries(files)) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  if (typeof payload === "string") await writeFile(target, payload, "utf8");
  else if (payload && typeof payload.base64 === "string") await writeFile(target, Buffer.from(payload.base64, "base64"));
  else throw new Error(`[surgery-import] invalid payload for ${relativePath}`);
}

for (const name of await readdir(payloadDir)) {
  if (name !== "READY") await rm(path.join(payloadDir, name), { recursive: true, force: true });
}
console.log(`[surgery-import] wrote ${Object.keys(files).length} files from ${parts.length} payload parts`);
