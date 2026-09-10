import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "public", "content");
const packagesDir = path.join(contentDir, "packages");
const manifestPath = path.join(contentDir, "manifest.json");

function fail(message) {
  throw new Error(`[manifest-sync] ${message}`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const manifest = await readJson(manifestPath);
if (manifest.schemaVersion !== 1) fail("unsupported manifest schemaVersion");
if (!Number.isInteger(manifest.contentVersion) || manifest.contentVersion < 1) {
  fail("contentVersion must be a positive integer");
}
if (!Array.isArray(manifest.packages)) fail("manifest.packages must be an array");

const files = (await readdir(packagesDir))
  .filter((name) => /\.v\d+\.json$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));

const latestById = new Map();
for (const filename of files) {
  const packagePath = path.join(packagesDir, filename);
  const pkg = await readJson(packagePath);

  if (pkg.schemaVersion !== 1) fail(`${filename}: unsupported schemaVersion`);
  if (!pkg.id || !Number.isInteger(pkg.version) || pkg.version < 1) {
    fail(`${filename}: package needs id and positive integer version`);
  }
  if (!pkg.subject?.id || !pkg.subject?.title) {
    fail(`${filename}: package subject metadata is incomplete`);
  }
  if (!Array.isArray(pkg.questions)) fail(`${filename}: questions must be an array`);

  const expectedSuffix = `.v${pkg.version}.json`;
  if (!filename.endsWith(expectedSuffix)) {
    fail(`${filename}: filename version does not match package version ${pkg.version}`);
  }

  const current = latestById.get(pkg.id);
  if (!current || pkg.version > current.pkg.version) {
    latestById.set(pkg.id, { filename, pkg });
  }
}

const manifestIndex = new Map(manifest.packages.map((entry, index) => [entry.id, index]));
const nextPackages = [...manifest.packages];
let changed = false;

for (const [id, { filename, pkg }] of latestById) {
  const entry = {
    id,
    subjectId: pkg.subject.id,
    title: pkg.subject.title,
    version: pkg.version,
    path: `/content/packages/${filename}`,
    questionCount: pkg.questions.length,
  };

  const index = manifestIndex.get(id);
  if (index === undefined) {
    manifestIndex.set(id, nextPackages.length);
    nextPackages.push(entry);
    changed = true;
    continue;
  }

  const previous = nextPackages[index];
  if (pkg.version > previous.version) {
    nextPackages[index] = entry;
    changed = true;
    continue;
  }

  if (pkg.version === previous.version) {
    const metadataMatches =
      previous.subjectId === entry.subjectId &&
      previous.title === entry.title &&
      previous.path === entry.path &&
      previous.questionCount === entry.questionCount;

    if (!metadataMatches) {
      fail(`${id}@${pkg.version}: manifest metadata differs from immutable package; publish a new package version instead`);
    }
  }
}

if (!changed) {
  console.log(`[manifest-sync] already synchronized at content v${manifest.contentVersion}`);
  process.exit(0);
}

const nextManifest = {
  ...manifest,
  contentVersion: manifest.contentVersion + 1,
  publishedAt: new Date().toISOString(),
  packages: nextPackages,
};

await writeFile(manifestPath, `${JSON.stringify(nextManifest)}\n`, "utf8");
console.log(
  `[manifest-sync] content v${manifest.contentVersion} -> v${nextManifest.contentVersion}; ${manifest.packages.length} -> ${nextPackages.length} packages`,
);
