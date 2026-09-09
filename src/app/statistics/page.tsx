"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllQuestions } from "@/lib/content-repository";
import { readProgress, summarizeProgress } from "@/lib/local-progress";
import type { PracticeQuestion, ProgressStore } from "@/types/domain";

export default function StatisticsPage() {
  const [progress, setProgress] = useState<ProgressStore>({ schemaVersion: 2, answers: [] });
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const [storedProgress, contentQuestions] = await Promise.all([readProgress(), getAllQuestions()]);
      if (!cancelled) {
        setProgress(storedProgress);
        setQuestions(contentQuestions);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  const summary = summarizeProgress(progress);

  const topics = useMemo(() => {
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const result = new Map<string, { title: string; total: number; correct: number }>();
    for (const answer of progress.answers) {
      const question = questionMap.get(answer.questionId);
      const title = question?.topic ?? answer.topicId;
      const item = result.get(answer.topicId) ?? { title, total: 0, correct: 0 };
      item.total += 1;
      if (answer.correct) item.correct += 1;
      result.set(answer.topicId, item);
    }
    return [...result.values()].sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
  }, [progress, questions]);

  return (
    <div className="page">
      <header className="hero compact"><p className="eyebrow">АНАЛИТИКА</p><h1>Статистика</h1><p>Все результаты хранятся локально на этом устройстве. Серверной учётной записи для статистики не требуется.</p></header>
      <div className="metric-grid"><div className="metric"><strong>{summary.total}</strong><span>ответов</span></div><div className="metric"><strong>{summary.correct}</strong><span>правильных</span></div><div className="metric"><strong>{summary.accuracy}%</strong><span>точность</span></div></div>
      <section><div className="section-title"><h2>Темы</h2><span>от слабых к сильным</span></div>
        {topics.length === 0 ? <div className="info-card"><p>Статистика появится после первой тренировки.</p></div> : <div className="topic-stats">{topics.map((topic) => { const percent = Math.round((topic.correct / topic.total) * 100); return <div className="topic-row" key={topic.title}><div><strong>{topic.title}</strong><span>{topic.correct}/{topic.total}</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></div>; })}</div>}
      </section>
    </div>
  );
}
