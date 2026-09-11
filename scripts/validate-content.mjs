import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "public", "content", "manifest.json");
const choiceTypes = new Set(["single_choice", "multiple_choice", "true_false"]);
const supportedTypes = new Set(["single_choice", "multiple_choice", "true_false", "text", "number", "matching", "ordering", "case"]);
const scientificStatuses = new Set(["verified", "legacy", "ambiguous", "needs_revision"]);

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
    if (!supportedTypes.has(question.type)) fail(`${question.id}: unsupported question type ${question.type}`);
    if (!Array.isArray(question.options)) fail(`${question.id}: options must be an array (empty for non-choice questions)`);
    if (question.scientificStatus && !scientificStatuses.has(question.scientificStatus)) fail(`${question.id}: invalid scientificStatus`);

    const optionIds = new Set();
    let correctCount = 0;
    for (const option of question.options) {
      if (!option.id || !option.label || !option.text) fail(`${question.id}: invalid option`);
      if (optionIds.has(option.id)) fail(`${question.id}: duplicate option id ${option.id}`);
      optionIds.add(option.id);
      if (option.correct === true) correctCount += 1;
    }

    if (choiceTypes.has(question.type)) {
      if (question.options.length < 2) fail(`${question.id}: choice question requires at least two options`);
      if (correctCount < 1) fail(`${question.id}: no correct answer`);
      if ((question.type === "single_choice" || question.type === "true_false") && correctCount !== 1) fail(`${question.id}: ${question.type} must have exactly one correct answer`);
    } else if (question.type === "text" || question.type === "number") {
      if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length < 1) fail(`${question.id}: text/number question requires acceptedAnswers`);
    } else if (question.type === "matching") {
      if (!Array.isArray(question.matchingPairs) || question.matchingPairs.length < 2) fail(`${question.id}: matching question requires at least two pairs`);
      const pairIds = new Set();
      for (const pair of question.matchingPairs) {
        if (!pair.id || !pair.left || !pair.right) fail(`${question.id}: invalid matching pair`);
        if (pairIds.has(pair.id)) fail(`${question.id}: duplicate matching pair id ${pair.id}`);
        pairIds.add(pair.id);
      }
    } else if (question.type === "case") {
      if (!Array.isArray(question.caseQuestions) || question.caseQuestions.length < 1) fail(`${question.id}: case question requires caseQuestions`);
      for (const item of question.caseQuestions) {
        if (!item.id || !item.prompt || !item.answerLabel || !Array.isArray(item.acceptedAnswers) || item.acceptedAnswers.length < 1) fail(`${question.id}: invalid case subquestion`);
      }
    }
  }
}

console.log(`[content] OK: ${manifest.packages.length} packages, ${totalQuestions} questions, content v${manifest.contentVersion}`);
