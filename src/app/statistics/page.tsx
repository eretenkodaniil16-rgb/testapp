"use client";

import { useEffect, useMemo, useState } from "react";
import { demoQuestions } from "@/lib/demo-data";
import { readProgress, summarizeProgress } from "@/lib/local-progress";
import type { ProgressStore } from "@/types/domain";

const EMPTY: ProgressStore = { schemaVersion: 2, answers: [] };

export default function StatisticsPage() {
  const [progress, setProgress] = useState<ProgressStore>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void readProgress().then((value) => {
      if (!cancelled) {
        setProgress(value);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const summary = summarizeProgress(progress);

  const topics = useMemo(() => {
    const result = new Map<string, { title: string; total: number; correct: number }>();
    for (const answer of progress.answers) {
      const question = demoQuestions.find((item) => item.id === answer.questionId);
      const title = question?.topic ?? answer.topicId;
      const item = result.get(answer.topicId) ?? { title, total: 0, correct: 0 };
      item.total += 1;
      if (answer.correct) item.correct += 1;
      result.set(answer.topicId, item);
    }
    return [...result.values()].sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
  }, [progress]);

  return (
    <div className="page">
      <header className="hero compact"><p className="eyebrow">АНАЛИТИКА</p><h1>Статистика</h1><p>Прогресс хранится локально в IndexedDB этого устройства. Он не отправляется в Supabase и не расходует серверную квоту.</p></header>
      <div className="metric-grid"><div className="metric"><strong>{summary.total}</strong><span>ответов</span></div><div className="metric"><strong>{summary.correct}</strong><span>правильных</span></div><div className="metric"><strong>{summary.accuracy}%</strong><span>точность</span></div></div>
      <section><div className="section-title"><h2>Темы</h2><span>от слабых к сильным</span></div>
        {loading ? <div className="info-card"><p>Загружаю локальную статистику…</p></div> : topics.length === 0 ? <div className="info-card"><p>Статистика появится после первой тренировки.</p></div> : <div className="topic-stats">{topics.map((topic) => { const percent = Math.round((topic.correct / topic.total) * 100); return <div className="topic-row" key={topic.title}><div><strong>{topic.title}</strong><span>{topic.correct}/{topic.total}</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></div>; })}</div>}
      </section>
    </div>
  );
}
