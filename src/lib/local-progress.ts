import type { ProgressStore, ReviewItem, StoredAnswer, TopicPerformance } from "@/types/domain";

const DB_NAME = "testapp";
const DB_VERSION = 1;
const STORE_NAME = "progress";
const RECORD_KEY = "main";
const LEGACY_STORAGE_KEY = "testapp.progress.v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY: ProgressStore = { schemaVersion: 3, answers: [], reviews: [] };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  const base = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

function nextReviewItem(current: ReviewItem | undefined, answer: StoredAnswer): ReviewItem {
  const currentEase = current?.easeFactor ?? 2.3;
  const currentInterval = current?.intervalDays ?? 0;
  const lastReviewedAt = answer.answeredAt;

  if (!answer.correct) {
    const intervalDays = 1;
    return {
      questionId: answer.questionId,
      dueAt: addDays(lastReviewedAt, intervalDays),
      intervalDays,
      easeFactor: Math.max(1.3, Number((currentEase - 0.2).toFixed(2))),
      repetitions: 0,
      lapses: (current?.lapses ?? 0) + 1,
      lastReviewedAt,
    };
  }

  const repetitions = (current?.repetitions ?? 0) + 1;
  const easeFactor = Math.min(3, Number((currentEase + 0.05).toFixed(2)));
  const intervalDays = repetitions === 1
    ? 2
    : repetitions === 2
      ? 5
      : Math.max(7, Math.round(Math.max(1, currentInterval) * easeFactor));

  return {
    questionId: answer.questionId,
    dueAt: addDays(lastReviewedAt, intervalDays),
    intervalDays,
    easeFactor,
    repetitions,
    lapses: current?.lapses ?? 0,
    lastReviewedAt,
  };
}

function applyAnswersToReviews(reviews: ReviewItem[], answers: StoredAnswer[]): ReviewItem[] {
  const map = new Map(reviews.map((item) => [item.questionId, item]));
  const ordered = [...answers].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
  for (const answer of ordered) map.set(answer.questionId, nextReviewItem(map.get(answer.questionId), answer));
  return [...map.values()];
}

function normalizeProgress(value: unknown): ProgressStore {
  if (!value || typeof value !== "object") return EMPTY;
  const candidate = value as { answers?: unknown; reviews?: unknown };
  if (!Array.isArray(candidate.answers)) return EMPTY;
  const answers = candidate.answers as StoredAnswer[];
  const reviews = Array.isArray(candidate.reviews)
    ? candidate.reviews as ReviewItem[]
    : applyAnswersToReviews([], answers);
  return { schemaVersion: 3, answers, reviews };
}

async function readIndexedProgress(): Promise<ProgressStore | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result ? normalizeProgress(request.result) : null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function writeIndexedProgress(progress: ProgressStore): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(progress, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function readLegacyProgress(): ProgressStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function readProgress(): Promise<ProgressStore> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const indexed = await readIndexedProgress();
    if (indexed) return indexed;
    const legacy = readLegacyProgress();
    if (legacy) {
      await writeIndexedProgress(legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
    return EMPTY;
  } catch {
    return readLegacyProgress() ?? EMPTY;
  }
}

export async function writeProgress(progress: ProgressStore): Promise<void> {
  if (typeof window === "undefined") return;
  await writeIndexedProgress(normalizeProgress(progress));
}

export async function appendAnswers(nextAnswers: StoredAnswer[]): Promise<void> {
  if (nextAnswers.length === 0) return;
  const progress = await readProgress();
  const answers = [...progress.answers, ...nextAnswers];
  const reviews = applyAnswersToReviews(progress.reviews ?? [], nextAnswers);
  await writeIndexedProgress({ schemaVersion: 3, answers, reviews });
}

export async function appendAnswer(answer: StoredAnswer): Promise<void> {
  await appendAnswers([answer]);
}

export function isAnswerCorrect(correctIds: string[], selectedIds: string[]): boolean {
  if (correctIds.length !== selectedIds.length) return false;
  const selected = new Set(selectedIds);
  return correctIds.every((id) => selected.has(id));
}

export function getUnresolvedMistakeIds(progress: ProgressStore): string[] {
  const byQuestion = new Map<string, StoredAnswer[]>();
  for (const answer of progress.answers) {
    const list = byQuestion.get(answer.questionId) ?? [];
    list.push(answer);
    byQuestion.set(answer.questionId, list);
  }

  const unresolved: string[] = [];
  for (const [questionId, history] of byQuestion) {
    const lastWrongIndex = history.map((item) => item.correct).lastIndexOf(false);
    if (lastWrongIndex < 0) continue;
    const correctAfter = history.slice(lastWrongIndex + 1).filter((item) => item.correct).length;
    if (correctAfter < 2) unresolved.push(questionId);
  }
  return unresolved;
}

export function getTopicPerformance(progress: ProgressStore): TopicPerformance[] {
  const map = new Map<string, { subjectId: string; topicId: string; total: number; correct: number }>();
  for (const answer of progress.answers) {
    const key = `${answer.subjectId}::${answer.topicId}`;
    const item = map.get(key) ?? { subjectId: answer.subjectId, topicId: answer.topicId, total: 0, correct: 0 };
    item.total += 1;
    if (answer.correct) item.correct += 1;
    map.set(key, item);
  }
  return [...map.values()].map((item) => ({
    ...item,
    accuracy: item.total === 0 ? 0 : Math.round((item.correct / item.total) * 100),
  }));
}

export function getWeakTopicKeys(progress: ProgressStore, threshold = 75, minAttempts = 2): string[] {
  return getTopicPerformance(progress)
    .filter((item) => item.total >= minAttempts && item.accuracy < threshold)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .map((item) => `${item.subjectId}::${item.topicId}`);
}

export function getDueReviewIds(progress: ProgressStore, now = new Date()): string[] {
  const nowMs = now.getTime();
  return (progress.reviews ?? [])
    .filter((item) => new Date(item.dueAt).getTime() <= nowMs)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .map((item) => item.questionId);
}

export function getReviewSummary(progress: ProgressStore, now = new Date()) {
  const reviews = progress.reviews ?? [];
  const due = getDueReviewIds(progress, now).length;
  const future = reviews.filter((item) => new Date(item.dueAt).getTime() > now.getTime());
  const nextDueAt = future.sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0]?.dueAt ?? null;
  return { scheduled: reviews.length, due, nextDueAt };
}

export function summarizeProgress(progress: ProgressStore) {
  const total = progress.answers.length;
  const correct = progress.answers.filter((answer) => answer.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const unresolvedMistakes = getUnresolvedMistakeIds(progress).length;
  const dueReviews = getDueReviewIds(progress).length;
  const weakTopics = getWeakTopicKeys(progress).length;
  return { total, correct, accuracy, unresolvedMistakes, dueReviews, weakTopics };
}

export async function exportProgressBackup(): Promise<string> {
  const progress = await readProgress();
  return JSON.stringify({
    format: "testapp-progress-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    progress,
  }, null, 2);
}

export async function importProgressBackup(raw: string): Promise<ProgressStore> {
  const parsed = JSON.parse(raw) as { format?: string; progress?: unknown };
  if (parsed.format !== "testapp-progress-backup" || !parsed.progress) {
    throw new Error("Некорректный файл резервной копии TestApp");
  }
  const progress = normalizeProgress(parsed.progress);
  await writeIndexedProgress(progress);
  return progress;
}
