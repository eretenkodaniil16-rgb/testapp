import type { ProgressStore, StoredAnswer } from "@/types/domain";

const STORAGE_KEY = "testapp.progress.v1";
const EMPTY: ProgressStore = { schemaVersion: 1, answers: [] };

export function readProgress(): ProgressStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressStore;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.answers)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

export function appendAnswer(answer: StoredAnswer): void {
  const progress = readProgress();
  const answers = [...progress.answers, answer].slice(-5000);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, answers } satisfies ProgressStore));
}

export function isAnswerCorrect(correctIds: string[], selectedIds: string[]): boolean {
  if (correctIds.length !== selectedIds.length) return false;
  const selected = new Set(selectedIds);
  return correctIds.every((id) => selected.has(id));
}

export function getUnresolvedMistakeIds(progress = readProgress()): string[] {
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

export function summarizeProgress(progress = readProgress()) {
  const total = progress.answers.length;
  const correct = progress.answers.filter((answer) => answer.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const unresolvedMistakes = getUnresolvedMistakeIds(progress).length;
  return { total, correct, accuracy, unresolvedMistakes };
}
