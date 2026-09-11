import { mkdir, readFile, writeFile, readdir, rm, unlink } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const root = process.cwd();
const payloadDir = path.join(root, "scripts", ".surgery-payload");
const parts = (await readdir(payloadDir)).filter((name) => /^part\d+\.txt$/u.test(name)).sort();
const encoded = (await Promise.all(parts.map((name) => readFile(path.join(payloadDir, name), "utf8")))).join("");
const files = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));
for (const [relativePath, content] of Object.entries(files)) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}
await writeFile(path.join(root, ".github", "workflows", "content.yml"), "name: Validate and publish live test content\n\non:\n  push:\n    branches: [content-live]\n    paths:\n      - \"public/content/**\"\n      - \"scripts/sync-content-manifest.mjs\"\n      - \"scripts/validate-content.mjs\"\n      - \".github/workflows/content.yml\"\n      - \"package.json\"\n      - \"package-lock.json\"\n  workflow_dispatch:\n\npermissions:\n  contents: write\n\nconcurrency:\n  group: content-live-publish\n  cancel-in-progress: false\n\njobs:\n  validate-content:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: content-live\n          fetch-depth: 0\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - name: Synchronize manifest\n        run: node scripts/sync-content-manifest.mjs\n      - run: npm install --no-audit --no-fund\n      - run: npm run validate:content\n      - name: Publish synchronized manifest\n        shell: bash\n        run: |\n          if git diff --quiet -- public/content/manifest.json; then\n            echo \"Manifest already synchronized.\"\n            exit 0\n          fi\n          git config user.name \"github-actions[bot]\"\n          git config user.email \"41898282+github-actions[bot]@users.noreply.github.com\"\n          git add public/content/manifest.json\n          git commit -m \"content: sync manifest\"\n          git push origin HEAD:content-live\n", "utf8");
await rm(payloadDir, { recursive: true, force: true });
await unlink(new URL(import.meta.url));
console.log(`[surgery-import] wrote ${Object.keys(files).length} files from ${parts.length} payload parts`);
