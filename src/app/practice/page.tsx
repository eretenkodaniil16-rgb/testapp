"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import {
  appendAnswer,
  appendAnswers,
  getDueReviewIds,
  getUnresolvedMistakeIds,
  getWeakTopicKeys,
  isAnswerCorrect,
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

function OptionFeedbackList({ question, selectedIds }: { question: PracticeQuestion; selectedIds?: Set<string> }) {
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

export default function PracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<StudyMode>("learning");
  const [examSelections, setExamSelections] = useState<Record<string, string[]>>({});

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

      const allQuestions = await getAllQuestions();
      let nextQuestions = subject ? allQuestions.filter((question) => question.subjectId === subject) : allQuestions;
      if (topics.size > 0) nextQuestions = nextQuestions.filter((question) => topics.has(question.topicId));

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
  const correctIds = useMemo(() => question?.options.filter((option) => option.correct).map((option) => option.id) ?? [], [question]);

  function selectOption(optionId: string) {
    if (!question || checked) return;
    if (question.type === "single_choice") setSelected([optionId]);
    else setSelected((current) => current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]);
  }

  async function checkAnswer() {
    if (!question || selected.length === 0 || checked || mode === "exam") return;
    const correct = isAnswerCorrect(correctIds, selected);
    await appendAnswer({
      questionId: question.id,
      revisionId: question.revisionId,
      subjectId: question.subjectId,
      topicId: question.topicId,
      selectedOptionIds: selected,
      correct,
      answeredAt: new Date().toISOString(),
      mode,
    });
    setWasCorrect(correct);
    if (correct) setSessionCorrect((value) => value + 1);
    setChecked(true);
  }

  function resetForNext() {
    setIndex((value) => value + 1);
    setSelected([]);
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
    if (!question || selected.length === 0 || mode !== "exam") return;
    const nextSelections = { ...examSelections, [question.id]: [...selected] };
    setExamSelections(nextSelections);

    if (index + 1 < questions.length) {
      resetForNext();
      return;
    }

    const answeredAt = new Date().toISOString();
    const storedAnswers: StoredAnswer[] = questions.map((item) => {
      const selectedOptionIds = nextSelections[item.id] ?? [];
      const itemCorrectIds = item.options.filter((option) => option.correct).map((option) => option.id);
      return {
        questionId: item.id,
        revisionId: item.revisionId,
        subjectId: item.subjectId,
        topicId: item.topicId,
        selectedOptionIds,
        correct: isAnswerCorrect(itemCorrectIds, selectedOptionIds),
        answeredAt,
        mode: "exam",
      };
    });
    const score = storedAnswers.filter((answer) => answer.correct).length;
    await appendAnswers(storedAnswers);
    setSessionCorrect(score);
    setFinished(true);
  }

  if (loading) {
    return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Подготавливаю выбранный набор вопросов.</p></div></div>;
  }

  if (questions.length === 0) {
    const emptyCopy = mode === "mistakes"
      ? ["Очередь ошибок пуста", "Ошибочные вопросы автоматически появятся после тренировок."]
      : mode === "weak_topics"
        ? ["Слабых тем пока нет", "Для определения слабой темы нужно минимум две попытки и точность ниже 75%."]
        : mode === "review"
          ? ["Повторение пока не требуется", "Все запланированные вопросы ещё не достигли даты следующего повторения."]
          : ["Вопросов пока нет", "Для выбранных тем пока нет опубликованных вопросов."];
    return (
      <div className="page"><div className="empty-state">
        <h1>{emptyCopy[0]}</h1>
        <p>{emptyCopy[1]}</p>
        <Link className="button" href="/practice/setup">Настроить тренировку</Link>
      </div></div>
    );
  }

  if (finished) {
    const percent = Math.round((sessionCorrect / questions.length) * 100);
    return (
      <div className="page">
        <div className="empty-state">
          <p className="eyebrow">{modeTitle(mode)} ЗАВЕРШЁН</p>
          <h1>{sessionCorrect} / {questions.length}</h1>
          <p>Точность: {percent}%. Результат сохранён только на этом устройстве.</p>
          <div className="finish-actions">
            <Link className="button" href="/statistics">Открыть статистику</Link>
            <Link className="button button-secondary" href="/practice/setup">Новая тренировка</Link>
          </div>
        </div>

        {mode === "exam" && (
          <section className="exam-review">
            <div className="section-title"><h2>Разбор экзамена</h2><span>ответы открыты после завершения</span></div>
            {questions.map((item, questionIndex) => {
              const selectedIds = new Set(examSelections[item.id] ?? []);
              const correct = item.options.filter((option) => option.correct);
              const isCorrect = isAnswerCorrect(correct.map((option) => option.id), [...selectedIds]);
              return (
                <article className={`answer-card ${isCorrect ? "exam-card-correct" : "exam-card-wrong"}`} key={item.id}>
                  <div className="answer-card-meta"><span>#{questionIndex + 1}</span><span>{isCorrect ? "Правильно" : "Ошибка"}</span></div>
                  <h3>{item.prompt}</h3>
                  <p className="exam-selected"><strong>Ваш ответ:</strong> {item.options.filter((option) => selectedIds.has(option.id)).map((option) => `${option.label}. ${option.text}`).join("; ")}</p>
                  <div className="correct-answer-block"><strong>{correct.length > 1 ? "Правильные ответы" : "Правильный ответ"}</strong>{correct.map((option) => <p key={option.id}><b>{option.label}.</b> {option.text}</p>)}</div>
                  {item.explanation && <p className="answer-explanation">{item.explanation}</p>}
                  <OptionFeedbackList question={item} selectedIds={selectedIds} />
                </article>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="page practice-page">
      <header className="question-header">
        <div><p className="eyebrow">{modeTitle(mode)} · {question.subject}</p><h1>{question.topic}</h1></div>
        <span>{index + 1} / {questions.length}</span>
      </header>
      <div className="progress-track"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      {mode === "exam" && <div className="exam-notice">Правильный ответ и объяснение каждого варианта будут показаны только после завершения экзамена.</div>}

      <section className="question-card">
        <p className="question-type">{question.type === "multiple_choice" ? "Несколько правильных ответов" : "Один правильный ответ"}</p>
        <h2>{question.prompt}</h2>
        <div className="options">
          {question.options.map((option) => {
            const chosen = selected.includes(option.id);
            const state = mode === "exam"
              ? chosen ? "selected" : ""
              : checked ? option.correct ? "correct" : chosen ? "wrong" : "" : chosen ? "selected" : "";
            return (
              <button className={`option ${state}`} key={option.id} onClick={() => selectOption(option.id)} disabled={checked}>
                <strong>{option.label}</strong><span>{option.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {mode !== "exam" && checked && (
        <section className={`feedback ${wasCorrect ? "feedback-correct" : "feedback-wrong"}`}>
          <h3>{wasCorrect ? "Правильно" : "Неправильно"}</h3>
          <p>{question.explanation || "Общее объяснение для этого вопроса пока не добавлено."}</p>
          <OptionFeedbackList question={question} selectedIds={new Set(selected)} />
        </section>
      )}

      <div className="sticky-actions">
        {mode === "exam"
          ? <button className="button" onClick={() => void saveExamAnswer()} disabled={selected.length === 0}>{index + 1 === questions.length ? "Завершить экзамен" : "Сохранить и дальше"}</button>
          : !checked
            ? <button className="button" onClick={() => void checkAnswer()} disabled={selected.length === 0}>Проверить ответ</button>
            : <button className="button" onClick={nextQuestion}>Следующий вопрос</button>}
      </div>
    </div>
  );
}
