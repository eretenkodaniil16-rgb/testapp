"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import { appendAnswer, getUnresolvedMistakeIds, isAnswerCorrect, readProgress } from "@/lib/local-progress";
import type { PracticeQuestion } from "@/types/domain";

function shuffled<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
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
  const [mistakesMode, setMistakesMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const subject = params.get("subject");
      const topics = new Set((params.get("topics") ?? "").split(",").filter(Boolean));
      const countRaw = Number(params.get("count"));
      const limit = Number.isInteger(countRaw) && countRaw > 0 ? countRaw : null;
      const shouldShuffle = params.get("shuffle") !== "0";

      const allQuestions = await getAllQuestions();
      let nextQuestions = subject ? allQuestions.filter((question) => question.subjectId === subject) : allQuestions;
      if (topics.size > 0) nextQuestions = nextQuestions.filter((question) => topics.has(question.topicId));

      if (mode === "mistakes") {
        const progress = await readProgress();
        const mistakeIds = new Set(getUnresolvedMistakeIds(progress));
        nextQuestions = nextQuestions.filter((question) => mistakeIds.has(question.id));
      }

      if (shouldShuffle) nextQuestions = shuffled(nextQuestions);
      if (limit) nextQuestions = nextQuestions.slice(0, limit);

      if (!cancelled) {
        setMistakesMode(mode === "mistakes");
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
    if (!question || selected.length === 0 || checked) return;
    const correct = isAnswerCorrect(correctIds, selected);
    await appendAnswer({
      questionId: question.id,
      revisionId: question.revisionId,
      subjectId: question.subjectId,
      topicId: question.topicId,
      selectedOptionIds: selected,
      correct,
      answeredAt: new Date().toISOString(),
    });
    setWasCorrect(correct);
    if (correct) setSessionCorrect((value) => value + 1);
    setChecked(true);
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected([]);
    setChecked(false);
    setWasCorrect(false);
  }

  if (loading) {
    return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Подготавливаю выбранный набор вопросов.</p></div></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="page"><div className="empty-state">
        <h1>{mistakesMode ? "Очередь ошибок пуста" : "Вопросов пока нет"}</h1>
        <p>{mistakesMode ? "Сначала реши несколько вопросов. Ошибочные ответы автоматически попадут сюда." : "Для выбранных тем пока нет опубликованных вопросов."}</p>
        <Link className="button" href="/practice/setup">Настроить другую тренировку</Link>
      </div></div>
    );
  }

  if (finished) {
    const percent = Math.round((sessionCorrect / questions.length) * 100);
    return (
      <div className="page"><div className="empty-state">
        <p className="eyebrow">ТРЕНИРОВКА ЗАВЕРШЕНА</p>
        <h1>{sessionCorrect} / {questions.length}</h1>
        <p>Точность: {percent}%. Результат сохранён локально в IndexedDB этого устройства и никуда не отправляется.</p>
        <div className="finish-actions">
          <Link className="button" href="/statistics">Открыть статистику</Link>
          <Link className="button button-secondary" href="/practice/setup">Новая тренировка</Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className="page practice-page">
      <header className="question-header">
        <div><p className="eyebrow">{question.subject}</p><h1>{question.topic}</h1></div>
        <span>{index + 1} / {questions.length}</span>
      </header>
      <div className="progress-track"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      <section className="question-card">
        <p className="question-type">{question.type === "multiple_choice" ? "Несколько правильных ответов" : "Один правильный ответ"}</p>
        <h2>{question.prompt}</h2>
        <div className="options">
          {question.options.map((option) => {
            const chosen = selected.includes(option.id);
            const state = checked ? option.correct ? "correct" : chosen ? "wrong" : "" : chosen ? "selected" : "";
            return (
              <button className={`option ${state}`} key={option.id} onClick={() => selectOption(option.id)} disabled={checked}>
                <strong>{option.label}</strong><span>{option.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {checked && <section className={`feedback ${wasCorrect ? "feedback-correct" : "feedback-wrong"}`}><h3>{wasCorrect ? "Правильно" : "Неправильно"}</h3><p>{question.explanation || "Объяснение для этого вопроса пока не добавлено."}</p></section>}

      <div className="sticky-actions">
        {!checked ? <button className="button" onClick={() => void checkAnswer()} disabled={selected.length === 0}>Проверить ответ</button> : <button className="button" onClick={nextQuestion}>Следующий вопрос</button>}
      </div>
    </div>
  );
}
