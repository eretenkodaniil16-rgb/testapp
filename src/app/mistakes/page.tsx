"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoQuestions } from "@/lib/demo-data";
import { getUnresolvedMistakeIds, readProgress } from "@/lib/local-progress";

export default function MistakesPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void readProgress().then((progress) => {
      if (!cancelled) {
        setIds(getUnresolvedMistakeIds(progress));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const questions = demoQuestions.filter((question) => ids.includes(question.id));

  return (
    <div className="page">
      <header className="hero compact"><p className="eyebrow">ПОВТОРЕНИЕ</p><h1>Ошибки</h1><p>Вопрос остаётся в очереди, пока после последней ошибки не будет получено два правильных ответа. Очередь хранится только на этом устройстве.</p></header>
      {loading ? <div className="info-card"><p>Загружаю локальную очередь…</p></div> : questions.length === 0 ? <div className="empty-state"><h2>Пока нечего повторять</h2><p>Ошибочные вопросы появятся здесь автоматически.</p><Link className="button" href="/practice">Начать тренировку</Link></div> : <>
        <div className="subject-list">{questions.map((question) => <article className="subject-card" key={question.id}><div><h3>{question.topic}</h3><p>{question.prompt}</p></div></article>)}</div>
        <Link className="button full-width" href="/practice?mode=mistakes">Повторить {questions.length}</Link>
      </>}
    </div>
  );
}
