"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import {
  EMPTY_QUESTION_DRAFT,
  isDraftComplete,
  isDraftCorrect,
  questionTypeLabel,
  scientificStatusLabel,
  toStoredAnswer,
  type QuestionDraft,
} from "@/lib/question-evaluator";
import {
  appendAnswer,
  appendAnswers,
  getDueReviewIds,
  getUnresolvedMistakeIds,
  getWeakTopicKeys,
  readProgress,
} from "@/lib/local-progress";
import type { PracticeQuestion, StoredAnswer, StudyMode } from "@/types/domain";

function shuffled<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function cloneDraft(draft: QuestionDraft): QuestionDraft {
  return {
    selectedOptionIds: [...draft.selectedOptionIds],
    textAnswer: draft.textAnswer,
    matchingAnswer: { ...draft.matchingAnswer },
    caseAnswers: { ...draft.caseAnswers },
  };
}

function parseMode(value: string | null): StudyMode {
  if (value === "exam" || value === "mistakes" || value === "weak_topics" || value === "review") return value;
  return "learning";
}

function modeTitle(mode: StudyMode): string {
  if (mode === "exam") return "ЭКЗАМЕН";
  if (mode === "mistakes") return "РАБОТА НАД ОШИБКАМИ";
  if (mode === "weak_topics") return "СЛАБЫЕ ТЕМЫ";
  if (mode === "review") return "ИНТЕРВАЛЬНОЕ ПОВТОРЕНИЕ";
  return "ТРЕНИРОВКА";
}

function ScientificBadge({ question }: { question: PracticeQuestion }) {
  const label = scientificStatusLabel(question);
  if (!label) return null;
  return <span className={`science-badge science-${question.scientificStatus}`}>{label}</span>;
}

function ScientificDetails({ question }: { question: PracticeQuestion }) {
  if (!question.scientificStatus || question.scientificStatus === "verified") return null;
  return (
    <div className={`scientific-note science-${question.scientificStatus}`}>
      <strong>{scientificStatusLabel(question)}</strong>
      {question.scientificAnswer && <p><b>Научный ответ:</b> {question.scientificAnswer}</p>}
      {question.scientificNote && <p>{question.scientificNote}</p>}
      {question.sources && question.sources.length > 0 && (
        <div className="scientific-sources">
          {question.sources.map((source) => source.url
            ? <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.title}</a>
            : <span key={source.id}>{source.title}</span>)}
        </div>
      )}
    </div>
  );
}

function OptionFeedbackList({ question, selectedIds }: { question: PracticeQuestion; selectedIds?: Set<string> }) {
  if (question.options.length === 0) return null;
  return (
    <div className="option-feedback-list">
      <h4>Разбор всех вариантов</h4>
      {question.options.map((option) => {
        const selected = selectedIds?.has(option.id) ?? false;
        const fallback = option.correct
          ? "Это правильный вариант. Для него пока не добавлено отдельное пояснение."
          : "Этот вариант неправильный. Для него пока не добавлено отдельное пояснение.";
        return (
          <div className={`option-feedback-row ${option.correct ? "correct" : "incorrect"} ${selected ? "selected" : ""}`} key={option.id}>
            <div className="option-feedback-head">
              <strong>{option.label}. {option.text}</strong>
              <span className="option-feedback-badge">{option.correct ? "Правильный" : "Неправильный"}{selected ? " · выбран" : ""}</span>
            </div>
            <p>{option.feedback || fallback}</p>
          </div>
        );
      })}
    </div>
  );
}

function AnswerKey({ question }: { question: PracticeQuestion }) {
  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    const correct = question.options.filter((option) => option.correct);
    return (
      <div className="correct-answer-block">
        <strong>{correct.length > 1 ? "Правильные ответы" : "Правильный ответ"}</strong>
        {correct.map((option) => <p key={option.id}><b>{option.label}.</b> {option.text}</p>)}
      </div>
    );
  }
  if (question.type === "text" || question.type === "number") {
    return <div className="correct-answer-block"><strong>Правильный ответ</strong><p>{question.answerLabel ?? question.acceptedAnswers?.[0] ?? "—"}</p></div>;
  }
  if (question.type === "matching") {
    return (
      <div className="correct-answer-block">
        <strong>Правильные соответствия</strong>
        {(question.matchingPairs ?? []).map((pair) => <p key={pair.id}><b>{pair.left}</b> → {pair.right}</p>)}
      </div>
    );
  }
  if (question.type === "case") {
    return (
      <div className="correct-answer-block">
        <strong>Разбор задачи</strong>
        {(question.caseQuestions ?? []).map((item) => <p key={item.id}><b>{item.prompt}</b><br />{item.answerLabel}</p>)}
      </div>
    );
  }
  return null;
}

function DraftInput({ question, draft, disabled, onChange }: { question: PracticeQuestion; draft: QuestionDraft; disabled: boolean; onChange: (next: QuestionDraft) => void }) {
  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    return (
      <div className="options">
        {question.options.map((option) => {
          const chosen = draft.selectedOptionIds.includes(option.id);
          return (
            <button className={`option ${chosen ? "selected" : ""}`} key={option.id} onClick={() => {
              if (disabled) return;
              const selectedOptionIds = question.type === "multiple_choice"
                ? chosen ? draft.selectedOptionIds.filter((id) => id !== option.id) : [...draft.selectedOptionIds, option.id]
                : [option.id];
              onChange({ ...draft, selectedOptionIds });
            }} disabled={disabled}>
              <strong>{option.label}</strong><span>{option.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "text" || question.type === "number") {
    return <textarea className="text-answer-input" rows={3} value={draft.textAnswer} disabled={disabled} onChange={(event) => onChange({ ...draft, textAnswer: event.target.value })} placeholder="Введите ответ" />;
  }

  if (question.type === "matching") {
    const pairs = question.matchingPairs ?? [];
    const rightOptions = [...new Set(pairs.map((pair) => pair.right))];
    return (
      <div className="matching-input">
        {pairs.map((pair) => (
          <label key={pair.id}>
            <span>{pair.left}</span>
            <select disabled={disabled} value={draft.matchingAnswer[pair.id] ?? ""} onChange={(event) => onChange({ ...draft, matchingAnswer: { ...draft.matchingAnswer, [pair.id]: event.target.value } })}>
              <option value="">Выберите соответствие</option>
              {rightOptions.map((right) => <option value={right} key={right}>{right}</option>)}
            </select>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "case") {
    return (
      <div className="case-input">
        {question.caseStem && <div className="case-stem">{question.caseStem}</div>}
        {(question.caseQuestions ?? []).map((item) => (
          <label key={item.id}>
            <span>{item.prompt}</span>
            <textarea rows={2} disabled={disabled} value={draft.caseAnswers[item.id] ?? ""} onChange={(event) => onChange({ ...draft, caseAnswers: { ...draft.caseAnswers, [item.id]: event.target.value } })} placeholder="Короткий ответ" />
          </label>
        ))}
      </div>
    );
  }

  return <div className="empty-state"><p>Этот тип задания пока не поддерживается в интерактивном режиме.</p></div>;
}

function UserAnswer({ question, draft }: { question: PracticeQuestion; draft: QuestionDraft }) {
  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    const text = question.options.filter((option) => draft.selectedOptionIds.includes(option.id)).map((option) => `${option.label}. ${option.text}`).join("; ");
    return <p className="exam-selected"><strong>Ваш ответ:</strong> {text || "нет ответа"}</p>;
  }
  if (question.type === "text" || question.type === "number") return <p className="exam-selected"><strong>Ваш ответ:</strong> {draft.textAnswer || "нет ответа"}</p>;
  if (question.type === "matching") return <div className="exam-selected"><strong>Ваши соответствия:</strong>{(question.matchingPairs ?? []).map((pair) => <p key={pair.id}>{pair.left} → {draft.matchingAnswer[pair.id] || "—"}</p>)}</div>;
  if (question.type === "case") return <div className="exam-selected"><strong>Ваши ответы:</strong>{(question.caseQuestions ?? []).map((item) => <p key={item.id}>{item.prompt}: {draft.caseAnswers[item.id] || "—"}</p>)}</div>;
  return null;
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<QuestionDraft>(cloneDraft(EMPTY_QUESTION_DRAFT));
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<StudyMode>("learning");
  const [examDrafts, setExamDrafts] = useState<Record<string, QuestionDraft>>({});

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const nextMode = parseMode(params.get("mode"));
      const subject = params.get("subject");
      const topics = new Set((params.get("topics") ?? "").split(",").filter(Boolean));
      const countRaw = Number(params.get("count"));
      const limit = Number.isInteger(countRaw) && countRaw > 0 ? countRaw : null;
      const shouldShuffle = params.get("shuffle") !== "0";
      const scienceOnly = params.get("science") === "1";

      const allQuestions = await getAllQuestions();
      let nextQuestions = subject ? allQuestions.filter((question) => question.subjectId === subject) : allQuestions;
      if (topics.size > 0) nextQuestions = nextQuestions.filter((question) => topics.has(question.topicId));
      if (scienceOnly) nextQuestions = nextQuestions.filter((question) => !question.scientificStatus || question.scientificStatus === "verified");

      if (nextMode !== "learning" && nextMode !== "exam") {
        const progress = await readProgress();
        if (nextMode === "mistakes") {
          const ids = new Set(getUnresolvedMistakeIds(progress));
          nextQuestions = nextQuestions.filter((question) => ids.has(question.id));
        } else if (nextMode === "weak_topics") {
          const weakKeys = new Set(getWeakTopicKeys(progress));
          nextQuestions = nextQuestions.filter((question) => weakKeys.has(`${question.subjectId}::${question.topicId}`));
        } else if (nextMode === "review") {
          const dueIds = new Set(getDueReviewIds(progress));
          nextQuestions = nextQuestions.filter((question) => dueIds.has(question.id));
        }
      }

      if (shouldShuffle) nextQuestions = shuffled(nextQuestions);
      if (limit) nextQuestions = nextQuestions.slice(0, limit);

      if (!cancelled) {
        setMode(nextMode);
        setQuestions(nextQuestions);
        setLoading(false);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  const question = questions[index];

  async function checkAnswer() {
    if (!question || checked || mode === "exam" || !isDraftComplete(question, draft)) return;
    const correct = isDraftCorrect(question, draft);
    await appendAnswer(toStoredAnswer(question, draft, correct, new Date().toISOString(), mode));
    setWasCorrect(correct);
    if (correct) setSessionCorrect((value) => value + 1);
    setChecked(true);
  }

  function resetForNext() {
    setIndex((value) => value + 1);
    setDraft(cloneDraft(EMPTY_QUESTION_DRAFT));
    setChecked(false);
    setWasCorrect(false);
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    resetForNext();
  }

  async function saveExamAnswer() {
    if (!question || mode !== "exam" || !isDraftComplete(question, draft)) return;
    const nextDrafts = { ...examDrafts, [question.id]: cloneDraft(draft) };
    setExamDrafts(nextDrafts);

    if (index + 1 < questions.length) {
      resetForNext();
      return;
    }

    const answeredAt = new Date().toISOString();
    const storedAnswers: StoredAnswer[] = questions.map((item) => {
      const itemDraft = nextDrafts[item.id] ?? cloneDraft(EMPTY_QUESTION_DRAFT);
      return toStoredAnswer(item, itemDraft, isDraftCorrect(item, itemDraft), answeredAt, "exam");
    });
    const score = storedAnswers.filter((answer) => answer.correct).length;
    await appendAnswers(storedAnswers);
    setSessionCorrect(score);
    setFinished(true);
  }

  if (loading) return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Подготавливаю выбранный набор вопросов.</p></div></div>;

  if (questions.length === 0) {
    const emptyCopy = mode === "mistakes"
      ? ["Очередь ошибок пуста", "Ошибочные вопросы автоматически появятся после тренировок."]
      : mode === "weak_topics"
        ? ["Слабых тем пока нет", "Для определения слабой темы нужно минимум две попытки и точность ниже 75%."]
        : mode === "review"
          ? ["Повторение пока не требуется", "Все запланированные вопросы ещё не достигли даты следующего повторения."]
          : ["Вопросов пока нет", "Для выбранных тем пока нет опубликованных вопросов."];
    return <div className="page"><div className="empty-state"><h1>{emptyCopy[0]}</h1><p>{emptyCopy[1]}</p><Link className="button" href="/practice/setup">Настроить тренировку</Link></div></div>;
  }

  if (finished) {
    const percent = Math.round((sessionCorrect / questions.length) * 100);
    return (
      <div className="page">
        <div className="empty-state">
          <p className="eyebrow">{modeTitle(mode)} ЗАВЕРШЁН</p>
          <h1>{sessionCorrect} / {questions.length}</h1>
          <p>Точность: {percent}%. Результат сохранён только на этом устройстве.</p>
          <div className="finish-actions"><Link className="button" href="/statistics">Открыть статистику</Link><Link className="button button-secondary" href="/practice/setup">Новая тренировка</Link></div>
        </div>

        {mode === "exam" && (
          <section className="exam-review">
            <div className="section-title"><h2>Разбор экзамена</h2><span>ответы открыты после завершения</span></div>
            {questions.map((item, questionIndex) => {
              const itemDraft = examDrafts[item.id] ?? cloneDraft(EMPTY_QUESTION_DRAFT);
              const correct = isDraftCorrect(item, itemDraft);
              return (
                <article className={`answer-card ${correct ? "exam-card-correct" : "exam-card-wrong"}`} key={item.id}>
                  <div className="answer-card-meta"><span>#{questionIndex + 1}</span><span>{correct ? "Правильно" : "Ошибка"}</span></div>
                  <ScientificBadge question={item} />
                  <h3>{item.prompt}</h3>
                  <UserAnswer question={item} draft={itemDraft} />
                  <AnswerKey question={item} />
                  {item.explanation && <p className="answer-explanation">{item.explanation}</p>}
                  <OptionFeedbackList question={item} selectedIds={new Set(itemDraft.selectedOptionIds)} />
                  <ScientificDetails question={item} />
                </article>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  const complete = isDraftComplete(question, draft);

  return (
    <div className="page practice-page">
      <header className="question-header">
        <div><p className="eyebrow">{modeTitle(mode)} · {question.subject}</p><h1>{question.topic}</h1></div>
        <span>{index + 1} / {questions.length}</span>
      </header>
      <div className="progress-track"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      {mode === "exam" && <div className="exam-notice">Правильный ответ, научный комментарий и разбор вариантов будут показаны только после завершения экзамена.</div>}

      <section className="question-card">
        <div className="question-card-kickers"><p className="question-type">{questionTypeLabel(question)}</p><ScientificBadge question={question} /></div>
        {question.sourceQuestionNumber && <p className="source-question-number">Исходный вопрос №{question.sourceQuestionNumber}</p>}
        <h2>{question.prompt}</h2>
        <DraftInput question={question} draft={draft} disabled={checked} onChange={setDraft} />
      </section>

      {mode !== "exam" && checked && (
        <section className={`feedback ${wasCorrect ? "feedback-correct" : "feedback-wrong"}`}>
          <h3>{wasCorrect ? "Правильно" : "Неправильно"}</h3>
          <AnswerKey question={question} />
          <p>{question.explanation || "Общее объяснение для этого вопроса пока не добавлено."}</p>
          <OptionFeedbackList question={question} selectedIds={new Set(draft.selectedOptionIds)} />
          <ScientificDetails question={question} />
        </section>
      )}

      <div className="sticky-actions">
        {mode === "exam"
          ? <button className="button" onClick={() => void saveExamAnswer()} disabled={!complete}>{index + 1 === questions.length ? "Завершить экзамен" : "Сохранить и дальше"}</button>
          : !checked
            ? <button className="button" onClick={() => void checkAnswer()} disabled={!complete}>Проверить ответ</button>
            : <button className="button" onClick={nextQuestion}>Следующий вопрос</button>}
      </div>
    </div>
  );
}
