import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packagesDir = path.join(root, "public", "content", "packages");
const expected = new Map([
  ["asepsis-airborne", 17],
  ["asepsis-contact-implant", 30],
  ["antisepsis-mechanical-physical", 24],
  ["antisepsis-chemical-biological", 23],
  ["hemorrhage-blood-loss", 72],
  ["blood-components-transfusion", 69],
  ["blood-substitutes-transfusion", 24],
  ["transfusion-complications", 24],
  ["desmurgy", 36],
  ["surgical-treatment-stages", 34],
  ["surgical-patient-examination", 27],
  ["trauma-soft-tissue", 50],
  ["wounds", 28],
  ["wound-treatment", 24],
  ["fractures-dislocations", 111],
  ["transport-immobilization-casts", 40],
  ["head-chest-abdomen-trauma", 86],
  ["burns", 34],
  ["electrical-cold-injury", 45],
  ["purulent-surgical-infection-local", 141],
  ["sepsis", 41],
  ["purulent-serous-cavities", 38],
  ["osteomyelitis-purulent-arthritis", 50],
  ["anaerobic-putrid-specific-infection", 59],
  ["necrosis-gangrene-ulcers-fistulas", 40],
  ["oncology", 51],
  ["congenital-plastic-surgery", 60],
  ["parasitic-diseases", 52],
]);

function fail(message) {
  throw new Error(`[general-surgery-audit] ${message}`);
}

const files = (await readdir(packagesDir)).filter((name) => /\.v\d+\.json$/u.test(name));
const latestById = new Map();
for (const filename of files) {
  const pkg = JSON.parse(await readFile(path.join(packagesDir, filename), "utf8"));
  if (pkg.subject?.id !== "general-surgery") continue;
  const current = latestById.get(pkg.id);
  if (!current || pkg.version > current.version) latestById.set(pkg.id, pkg);
}

const questions = [...latestById.values()].flatMap((pkg) => pkg.questions ?? []);
const byTopic = new Map();
for (const q of questions) {
  const list = byTopic.get(q.topicId) ?? [];
  list.push(q);
  byTopic.set(q.topicId, list);
}

if (questions.length !== 1330) fail(`expected 1330 questions, found ${questions.length}`);
if (byTopic.size !== expected.size) fail(`expected ${expected.size} topics, found ${byTopic.size}`);

for (const [topicId, count] of expected) {
  const qs = byTopic.get(topicId);
  if (!qs) fail(`missing topic ${topicId}`);
  if (qs.length !== count) fail(`${topicId}: expected ${count}, found ${qs.length}`);

  const numbers = qs.map((q) => q.sourceQuestionNumber);
  if (numbers.some((n) => !Number.isInteger(n) || n < 1)) fail(`${topicId}: invalid sourceQuestionNumber`);

  if (topicId === "purulent-surgical-infection-local") {
    const freq = new Map();
    for (const n of numbers) freq.set(n, (freq.get(n) ?? 0) + 1);
    const duplicates = [...freq.entries()].filter(([, n]) => n > 1);
    if (duplicates.length !== 1 || duplicates[0][0] !== 104 || duplicates[0][1] !== 2) {
      fail(`${topicId}: expected only duplicated source number 104`);
    }
    for (let n = 1; n <= 140; n += 1) if (!freq.has(n)) fail(`${topicId}: missing source number ${n}`);
  } else {
    const sorted = [...numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i] !== i + 1) fail(`${topicId}: expected source number ${i + 1}, found ${sorted[i]}`);
    }
  }
}

let damagedKeys = 0;
let imageCount = 0;
let missingFigureQuestions = 0;
for (const q of questions) {
  if (q.image) imageCount += 1;

  const correctLabels = new Set((q.options ?? []).filter((o) => o.correct).map((o) => String(o.label)));
  const sourceKey = new Set((q.sourceKey ?? []).map(String));
  const same = correctLabels.size === sourceKey.size && [...correctLabels].every((x) => sourceKey.has(x));
  if (!same && !(q.sourceIntegrityIssue === "missing_option" && q.scientificStatus === "needs_revision")) fail(`${q.id}: sourceKey does not match marked correct options`);

  if (q.sourceIntegrityIssue === "missing_option") {
    damagedKeys += 1;
    if (q.scientificStatus !== "needs_revision") fail(`${q.id}: damaged source key must be marked needs_revision`);
    if (!(q.options ?? []).some((o) => /^\[Вариант \d+ отсутствует/u.test(o.text))) {
      fail(`${q.id}: missing source option must be represented explicitly`);
    }
  }

  if (/рисунк/u.test(q.prompt.toLowerCase()) && !q.image) {
    missingFigureQuestions += 1;
    if (q.scientificStatus !== "needs_revision") fail(`${q.id}: missing source figure must be marked needs_revision`);
  }
}

if (damagedKeys !== 2) fail(`expected exactly 2 damaged source keys, found ${damagedKeys}`);
if (imageCount !== 125) fail(`expected 125 illustrated questions, found ${imageCount}`);
if (missingFigureQuestions !== 4) fail(`expected 4 questions with missing source figures, found ${missingFigureQuestions}`);

console.log(`[general-surgery-audit] OK: ${questions.length} questions, ${byTopic.size} topics, ${imageCount} illustrated, ${damagedKeys} damaged keys, ${missingFigureQuestions} missing source figures`);
