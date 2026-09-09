import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "public", "content", "manifest.json");

function fail(message) {
  throw new Error(`[content] ${message}`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const manifest = await readJson(manifestPath);
if (manifest.schemaVersion !== 1) fail("unsupported manifest schemaVersion");
if (!Number.isInteger(manifest.contentVersion) || manifest.contentVersion < 1) fail("contentVersion must be a positive integer");
if (!Array.isArray(manifest.packages)) fail("manifest.packages must be an array");

const packageIds = new Set();
const questionIds = new Set();
let totalQuestions = 0;

for (const entry of manifest.packages) {
  if (!entry.id || !entry.subjectId || !entry.title || !entry.path) fail("every package entry needs id, subjectId, title and path");
  if (packageIds.has(entry.id)) fail(`duplicate package id: ${entry.id}`);
  packageIds.add(entry.id);

  if (!entry.path.startsWith("/content/")) fail(`package path must start with /content/: ${entry.path}`);
  const filePath = path.join(root, "public", entry.path.replace(/^\/content\//, "content/"));
  if (!existsSync(filePath)) fail(`missing package file: ${entry.path}`);

  const pkg = await readJson(filePath);
  if (pkg.schemaVersion !== 1) fail(`${entry.id}: unsupported schemaVersion`);
  if (pkg.id !== entry.id) fail(`${entry.id}: package id mismatch`);
  if (pkg.version !== entry.version) fail(`${entry.id}: package version mismatch`);
  if (pkg.subject?.id !== entry.subjectId) fail(`${entry.id}: subject id mismatch`);
  if (!Array.isArray(pkg.questions)) fail(`${entry.id}: questions must be an array`);
  if (pkg.questions.length !== entry.questionCount) fail(`${entry.id}: manifest questionCount=${entry.questionCount}, package has ${pkg.questions.length}`);

  totalQuestions += pkg.questions.length;

  for (const question of pkg.questions) {
    if (!question.id || !question.revisionId) fail(`${entry.id}: question missing id or revisionId`);
    if (questionIds.has(question.id)) fail(`duplicate question id: ${question.id}`);
    questionIds.add(question.id);
    if (question.subjectId !== entry.subjectId) fail(`${question.id}: subjectId does not match package`);
    if (!question.prompt || !question.topicId || !question.topic) fail(`${question.id}: missing prompt/topic metadata`);
    if (!Array.isArray(question.options) || question.options.length < 2) fail(`${question.id}: at least two options are required`);

    const optionIds = new Set();
    let correctCount = 0;
    for (const option of question.options) {
      if (!option.id || !option.label || !option.text) fail(`${question.id}: invalid option`);
      if (optionIds.has(option.id)) fail(`${question.id}: duplicate option id ${option.id}`);
      optionIds.add(option.id);
      if (option.correct === true) correctCount += 1;
    }

    if (correctCount < 1) fail(`${question.id}: no correct answer`);
    if (question.type === "single_choice" && correctCount !== 1) fail(`${question.id}: single_choice must have exactly one correct answer`);
    if (question.type === "multiple_choice" && correctCount < 1) fail(`${question.id}: multiple_choice must have at least one correct answer`);
  }
}

console.log(`[content] OK: ${manifest.packages.length} packages, ${totalQuestions} questions, content v${manifest.contentVersion}`);
