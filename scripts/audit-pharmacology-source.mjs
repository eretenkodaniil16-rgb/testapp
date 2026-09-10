import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packagesDir = path.join(root, "public", "content", "packages");
const expectedMax = Number.parseInt(process.argv[2] ?? "", 10);

function fail(message) {
  console.error(`[pharmacology-audit] ${message}`);
  process.exitCode = 1;
}

if (!Number.isInteger(expectedMax) || expectedMax < 1) {
  console.error("Usage: node scripts/audit-pharmacology-source.mjs <expected-max-source-question-number>");
  process.exit(2);
}

const files = (await readdir(packagesDir))
  .filter((name) => name.startsWith("pharmacology-") && /\.v\d+\.json$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));

const byNumber = new Map();
let questionCount = 0;
let packageCount = 0;

for (const filename of files) {
  const pkg = JSON.parse(await readFile(path.join(packagesDir, filename), "utf8"));
  if (pkg.subject?.id !== "pharmacology") continue;
  packageCount += 1;

  if (!Array.isArray(pkg.questions)) {
    fail(`${filename}: questions must be an array`);
    continue;
  }

  for (const question of pkg.questions) {
    questionCount += 1;
    const number = question.sourceQuestionNumber;

    if (!Number.isInteger(number) || number < 1) {
      fail(`${filename}: ${question.id ?? "<no-id>"} has no valid sourceQuestionNumber`);
      continue;
    }

    if (number > expectedMax) {
      fail(`${filename}: source question ${number} exceeds expected maximum ${expectedMax}`);
    }

    if (byNumber.has(number)) {
      const previous = byNumber.get(number);
      fail(`duplicate source question ${number}: ${previous.filename}/${previous.id} and ${filename}/${question.id}`);
    } else {
      byNumber.set(number, { filename, id: question.id });
    }

    const idMatch = String(question.id ?? "").match(/(\d{6})$/u);
    if (!idMatch || Number.parseInt(idMatch[1], 10) !== number) {
      fail(`${filename}: ${question.id ?? "<no-id>"} does not end with zero-padded source number ${number}`);
    }

    if (!Array.isArray(question.sourceKey) || question.sourceKey.length === 0) {
      fail(`${filename}: ${question.id} has no sourceKey`);
      continue;
    }

    if (!Array.isArray(question.options) || question.options.length === 0) {
      fail(`${filename}: ${question.id} has no options`);
      continue;
    }

    const sourceKey = [...question.sourceKey].map(String).sort();
    const markedCorrect = question.options
      .filter((option) => option.correct === true)
      .map((option) => String(option.label))
      .sort();

    if (JSON.stringify(sourceKey) !== JSON.stringify(markedCorrect)) {
      fail(
        `${filename}: ${question.id} sourceKey [${sourceKey.join(", ")}] does not match correct option labels [${markedCorrect.join(", ")}]`,
      );
    }
  }
}

const missing = [];
for (let number = 1; number <= expectedMax; number += 1) {
  if (!byNumber.has(number)) missing.push(number);
}

if (missing.length > 0) {
  const preview = missing.slice(0, 50).join(", ");
  const suffix = missing.length > 50 ? ` … (+${missing.length - 50})` : "";
  fail(`missing source questions: ${preview}${suffix}`);
}

if (byNumber.size !== expectedMax) {
  fail(`expected ${expectedMax} unique source questions, found ${byNumber.size}`);
}

if (process.exitCode) process.exit(process.exitCode);

console.log(
  `[pharmacology-audit] OK: ${packageCount} packages, ${questionCount} questions, complete source range 1-${expectedMax}, source keys consistent`,
);
