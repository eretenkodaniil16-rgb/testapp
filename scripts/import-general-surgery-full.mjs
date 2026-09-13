import { mkdir, readFile, writeFile, readdir, rm, unlink } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const root = process.cwd();
const payloadDir = path.join(root, "scripts", "surgery-payload");
const parts = (await readdir(payloadDir))
  .filter((name) => /^part\d+\.txt$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));
if (parts.length === 0) throw new Error("[surgery-import] payload parts are missing");

const encoded = (await Promise.all(parts.map((name) => readFile(path.join(payloadDir, name), "utf8")))).join("");
const files = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));

for (const [relativePath, payload] of Object.entries(files)) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  if (typeof payload === "string") {
    await writeFile(target, payload, "utf8");
  } else if (payload && typeof payload.base64 === "string") {
    await writeFile(target, Buffer.from(payload.base64, "base64"));
  } else {
    throw new Error(`[surgery-import] invalid payload for ${relativePath}`);
  }
}

await rm(payloadDir, { recursive: true, force: true });
await rm(path.join(root, ".github", "workflows", "general-surgery-full-import.yml"), { force: true });
await unlink(new URL(import.meta.url));
console.log(`[surgery-import] wrote ${Object.keys(files).length} files from ${parts.length} payload parts`);
