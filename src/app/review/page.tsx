"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import { getDueReviewIds, getReviewSummary, readProgress } from "@/lib/local-progress";
import type { PracticeQuestion, ProgressStore } from "@/types/domain";

export default function ReviewPage() {
  const [progress, setProgress] = useState<ProgressStore>({ schemaVersion: 3, answers: [], reviews: [] });
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [stored, content] = await Promise.all([readProgress(), getAllQuestions()]);
      if (cancelled) return;
      setProgress(stored);
      setQuestions(content);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const summary = getReviewSummary(progress);
  const dueIds = useMemo(() => new Set(getDueReviewIds(progress)), [progress]);
  const questionMap = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const upcoming = useMemo(() => (progress.reviews ?? [])
    .filter((item) => !dueIds.has(item.questionId))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 12), [dueIds, progress.reviews]);

  function formatDue(iso: string) {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">ИНТЕРВАЛЬНОЕ ПОВТОРЕНИЕ</p>
        <h1>Повторение по расписанию</h1>
        <p>После каждого ответа TestApp локально назначает следующую дату. Ошибочный ответ возвращает вопрос через 1 день; последовательные правильные ответы постепенно увеличивают интервал.</p>
      </header>

      {loading ? (
        <div className="info-card"><p>Читаю локальное расписание…</p></div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric"><strong>{summary.due}</strong><span>нужно сегодня</span></div>
            <div className="metric"><strong>{summary.scheduled}</strong><span>в расписании</span></div>
            <div className="metric"><strong>{summary.nextDueAt ? formatDue(summary.nextDueAt) : "—"}</strong><span>следующее</span></div>
          </div>

          {summary.due > 0 ? (
            <section className="review-due-card">
              <div><p className="eyebrow">ГОТОВО К ПОВТОРЕНИЮ</p><h2>{summary.due} вопросов</h2><p>Сначала будут показаны вопросы с самой ранней датой повторения.</p></div>
              <Link className="button" href="/practice?mode=review&shuffle=0">Начать повторение</Link>
            </section>
          ) : (
            <div className="info-card"><h2>На сегодня всё</h2><p>Просроченных вопросов нет. Можно продолжить обычную тренировку — она автоматически пополняет расписание.</p></div>
          )}

          <section>
            <div className="section-title"><h2>Ближайшие повторения</h2><span>до 12 вопросов</span></div>
            {upcoming.length === 0 ? (
              <div className="info-card"><p>Расписание появится после первых ответов.</p></div>
            ) : (
              <div className="review-list">
                {upcoming.map((item) => {
                  const question = questionMap.get(item.questionId);
                  return (
                    <article className="review-row" key={item.questionId}>
                      <div><strong>{question?.topic ?? item.questionId}</strong><span>{question?.prompt ?? "Вопрос отсутствует в текущей версии базы"}</span></div>
                      <div><b>{formatDue(item.dueAt)}</b><small>{item.intervalDays} дн.</small></div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
