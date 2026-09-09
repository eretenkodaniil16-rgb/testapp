"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import { getTopicPerformance, readProgress } from "@/lib/local-progress";
import type { PracticeQuestion, TopicPerformance } from "@/types/domain";

export default function WeakTopicsPage() {
  const [performance, setPerformance] = useState<TopicPerformance[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [progress, contentQuestions] = await Promise.all([readProgress(), getAllQuestions()]);
      if (cancelled) return;
      setPerformance(getTopicPerformance(progress));
      setQuestions(contentQuestions);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const weakTopics = useMemo(() => {
    const metadata = new Map<string, { subject: string; topic: string }>();
    for (const question of questions) {
      metadata.set(`${question.subjectId}::${question.topicId}`, { subject: question.subject, topic: question.topic });
    }
    return performance
      .filter((item) => item.total >= 2 && item.accuracy < 75)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
      .map((item) => ({ ...item, ...(metadata.get(`${item.subjectId}::${item.topicId}`) ?? { subject: item.subjectId, topic: item.topicId }) }));
  }, [performance, questions]);

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">АДАПТИВНАЯ ПРАКТИКА</p>
        <h1>Слабые темы</h1>
        <p>Тема попадает сюда после минимум двух ответов, если локальная точность ниже 75%. Рейтинг автоматически меняется после каждой попытки.</p>
      </header>

      {loading ? (
        <div className="info-card"><p>Анализирую локальную историю ответов…</p></div>
      ) : weakTopics.length === 0 ? (
        <div className="empty-state">
          <h2>Слабые темы пока не определены</h2>
          <p>Нужно ответить хотя бы два раза в одной теме. Если точность окажется ниже 75%, она появится здесь.</p>
          <Link className="button" href="/practice/setup">Обычная тренировка</Link>
        </div>
      ) : (
        <>
          <div className="topic-stats">
            {weakTopics.map((item) => (
              <article className="weak-topic-card" key={`${item.subjectId}:${item.topicId}`}>
                <div>
                  <span>{item.subject}</span>
                  <h3>{item.topic}</h3>
                  <p>{item.correct} правильных из {item.total} ответов</p>
                </div>
                <strong>{item.accuracy}%</strong>
                <div className="progress-track"><span style={{ width: `${item.accuracy}%` }} /></div>
                <Link href={`/practice?mode=weak_topics&subject=${encodeURIComponent(item.subjectId)}&topics=${encodeURIComponent(item.topicId)}&shuffle=1`}>Тренировать тему</Link>
              </article>
            ))}
          </div>
          <Link className="button full-width" href="/practice?mode=weak_topics&shuffle=1">Тренировать все слабые темы</Link>
        </>
      )}
    </div>
  );
}
