import type { ProgressStore, StoredAnswer } from "@/types/domain";

const DB_NAME = "testapp";
const DB_VERSION = 1;
const STORE_NAME = "progress";
const RECORD_KEY = "main";
const LEGACY_STORAGE_KEY = "testapp.progress.v1";
const EMPTY: ProgressStore = { schemaVersion: 2, answers: [] };

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

function normalizeProgress(value: unknown): ProgressStore {
  if (!value || typeof value !== "object") return EMPTY;
  const candidate = value as { schemaVersion?: number; answers?: unknown };
  if (!Array.isArray(candidate.answers)) return EMPTY;
  return { schemaVersion: 2, answers: candidate.answers as StoredAnswer[] };
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

export async function appendAnswer(answer: StoredAnswer): Promise<void> {
  const progress = await readProgress();
  const answers = [...progress.answers, answer];
  await writeProgress({ schemaVersion: 2, answers });
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

export function summarizeProgress(progress: ProgressStore) {
  const total = progress.answers.length;
  const correct = progress.answers.filter((answer) => answer.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const unresolvedMistakes = getUnresolvedMistakeIds(progress).length;
  return { total, correct, accuracy, unresolvedMistakes };
}

export async function exportProgressBackup(): Promise<string> {
  const progress = await readProgress();
  return JSON.stringify({
    format: "testapp-progress-backup",
    version: 1,
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
  await writeProgress(progress);
  return progress;
}
