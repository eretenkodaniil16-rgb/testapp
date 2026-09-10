import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "public", "content");
const packagesDir = path.join(contentDir, "packages");
const manifestPath = path.join(contentDir, "manifest.json");

const SUBJECT_ID = "hygiene";
const SECTION_ID = "occupational-hygiene";
const SECTION_TITLE = "Гигиена труда";
const TOPIC_ID = "occupational-hygiene";
const TOPIC_TITLE = "Гигиена труда";

function fail(message) {
  throw new Error(`[hygiene-topic-migration] ${message}`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const manifest = await readJson(manifestPath);
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.packages)) {
  fail("unsupported content manifest");
}

const activeIds = new Set(
  manifest.packages
    .filter((entry) => entry.subjectId === SUBJECT_ID)
    .map((entry) => entry.id),
);

if (activeIds.size === 0) {
  console.log("[hygiene-topic-migration] no active hygiene packages");
  process.exit(0);
}

const latestById = new Map();
const files = (await readdir(packagesDir))
  .filter((name) => /\.v\d+\.json$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));

for (const filename of files) {
  const filePath = path.join(packagesDir, filename);
  const pkg = await readJson(filePath);
  if (!activeIds.has(pkg.id) || pkg.subject?.id !== SUBJECT_ID) continue;
  if (!Number.isInteger(pkg.version) || pkg.version < 1) {
    fail(`${filename}: invalid package version`);
  }

  const current = latestById.get(pkg.id);
  if (!current || pkg.version > current.pkg.version) {
    latestById.set(pkg.id, { filename, pkg });
  }
}

for (const id of activeIds) {
  if (!latestById.has(id)) fail(`active package ${id} was not found`);
}

let created = 0;
let questionCount = 0;
for (const [id, { filename, pkg }] of latestById) {
  questionCount += pkg.questions.length;

  const alreadyUnified =
    pkg.sections?.length === 1 &&
    pkg.sections[0]?.id === SECTION_ID &&
    pkg.sections[0]?.title === SECTION_TITLE &&
    pkg.sections[0]?.topics?.length === 1 &&
    pkg.sections[0]?.topics[0]?.id === TOPIC_ID &&
    pkg.sections[0]?.topics[0]?.title === TOPIC_TITLE &&
    pkg.questions.every((question) => question.topicId === TOPIC_ID && question.topic === TOPIC_TITLE);

  if (alreadyUnified) continue;

  const nextVersion = pkg.version + 1;
  const expectedSuffix = `.v${pkg.version}.json`;
  if (!filename.endsWith(expectedSuffix)) {
    fail(`${filename}: filename version does not match package version ${pkg.version}`);
  }

  const nextFilename = `${filename.slice(0, -expectedSuffix.length)}.v${nextVersion}.json`;
  const nextPath = path.join(packagesDir, nextFilename);
  const nextPackage = {
    ...pkg,
    version: nextVersion,
    sections: [
      {
        id: SECTION_ID,
        title: SECTION_TITLE,
        topics: [{ id: TOPIC_ID, title: TOPIC_TITLE }],
      },
    ],
    questions: pkg.questions.map((question) => ({
      ...question,
      topicId: TOPIC_ID,
      topic: TOPIC_TITLE,
    })),
  };

  await writeFile(nextPath, `${JSON.stringify(nextPackage)}\n`, { encoding: "utf8", flag: "wx" });
  created += 1;
  console.log(`[hygiene-topic-migration] ${id}: v${pkg.version} -> v${nextVersion}`);
}

console.log(
  `[hygiene-topic-migration] ${created} package(s) created; ${questionCount} active hygiene question(s) mapped to ${TOPIC_TITLE}`,
);
