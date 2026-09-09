import type { PracticeQuestion, StoredAnswer } from "@/types/domain";

export interface QuestionDraft {
  selectedOptionIds: string[];
  textAnswer: string;
  matchingAnswer: Record<string, string>;
  caseAnswers: Record<string, string>;
}

export const EMPTY_QUESTION_DRAFT: QuestionDraft = {
  selectedOptionIds: [],
  textAnswer: "",
  matchingAnswer: {},
  caseAnswers: {},
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[.,;:!?()\[\]{}«»"']/g, " ")
    .replace(/\s+/g, " ");
}

function acceptedText(actual: string, accepted: string[] | undefined): boolean {
  const normalized = normalizeText(actual);
  if (!normalized) return false;
  return (accepted ?? []).some((value) => normalizeText(value) === normalized);
}

export function isDraftComplete(question: PracticeQuestion, draft: QuestionDraft): boolean {
  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    return draft.selectedOptionIds.length > 0;
  }
  if (question.type === "text" || question.type === "number") return draft.textAnswer.trim().length > 0;
  if (question.type === "matching") {
    const pairs = question.matchingPairs ?? [];
    return pairs.length > 0 && pairs.every((pair) => Boolean(draft.matchingAnswer[pair.id]));
  }
  if (question.type === "case") {
    const items = question.caseQuestions ?? [];
    return items.length > 0 && items.every((item) => (draft.caseAnswers[item.id] ?? "").trim().length > 0);
  }
  return false;
}

export function isDraftCorrect(question: PracticeQuestion, draft: QuestionDraft): boolean {
  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    const correctIds = question.options.filter((option) => option.correct).map((option) => option.id);
    if (correctIds.length !== draft.selectedOptionIds.length) return false;
    const selected = new Set(draft.selectedOptionIds);
    return correctIds.every((id) => selected.has(id));
  }
  if (question.type === "text" || question.type === "number") {
    return acceptedText(draft.textAnswer, question.acceptedAnswers);
  }
  if (question.type === "matching") {
    return (question.matchingPairs ?? []).every((pair) => draft.matchingAnswer[pair.id] === pair.right);
  }
  if (question.type === "case") {
    return (question.caseQuestions ?? []).every((item) => acceptedText(draft.caseAnswers[item.id] ?? "", item.acceptedAnswers));
  }
  return false;
}

export function toStoredAnswer(
  question: PracticeQuestion,
  draft: QuestionDraft,
  correct: boolean,
  answeredAt: string,
  mode: StoredAnswer["mode"],
): StoredAnswer {
  return {
    questionId: question.id,
    revisionId: question.revisionId,
    subjectId: question.subjectId,
    topicId: question.topicId,
    selectedOptionIds: [...draft.selectedOptionIds],
    textAnswer: draft.textAnswer || undefined,
    matchingAnswer: Object.keys(draft.matchingAnswer).length ? { ...draft.matchingAnswer } : undefined,
    caseAnswers: Object.keys(draft.caseAnswers).length ? { ...draft.caseAnswers } : undefined,
    correct,
    answeredAt,
    mode,
  };
}

export function questionTypeLabel(question: PracticeQuestion): string {
  if (question.type === "multiple_choice") return "Несколько правильных ответов";
  if (question.type === "single_choice") return "Один правильный ответ";
  if (question.type === "true_false") return "Верно / неверно";
  if (question.type === "matching") return "Установите соответствие";
  if (question.type === "case") return "Ситуационная задача";
  if (question.type === "number") return "Числовой ответ";
  if (question.type === "text") return "Короткий ответ";
  return "Задание";
}

export function scientificStatusLabel(question: PracticeQuestion): string | null {
  if (!question.scientificStatus) return null;
  if (question.scientificStatus === "verified") return "Научно проверено";
  if (question.scientificStatus === "legacy") return "Учебный / исторический ключ";
  if (question.scientificStatus === "ambiguous") return "Неоднозначная формулировка";
  return "Требует исправления";
}
