"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import { getUnresolvedMistakeIds, readProgress } from "@/lib/local-progress";
import type { PracticeQuestion } from "@/types/domain";

export default function MistakesPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const [progress, allQuestions] = await Promise.all([readProgress(), getAllQuestions()]);
      const ids = new Set(getUnresolvedMistakeIds(progress));
      if (!cancelled) {
        setQuestions(allQuestions.filter((question) => ids.has(question.id)));
        setLoading(false);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <header className="hero compact"><p className="eyebrow">ПОВТОРЕНИЕ</p><h1>Ошибки</h1><p>Вопрос остаётся в очереди, пока после последней ошибки не будет получено два правильных ответа.</p></header>
      {loading ? <div className="info-card"><p>Читаю локальную историю и базу вопросов…</p></div> : questions.length === 0 ? <div className="empty-state"><h2>Пока нечего повторять</h2><p>Ошибочные вопросы появятся здесь автоматически.</p><Link className="button" href="/practice">Начать тренировку</Link></div> : <>
        <div className="subject-list">{questions.map((question) => <article className="subject-card" key={question.id}><div><h3>{question.topic}</h3><p>{question.prompt}</p></div></article>)}</div>
        <Link className="button full-width" href="/practice?mode=mistakes">Повторить {questions.length}</Link>
      </>}
    </div>
  );
}
