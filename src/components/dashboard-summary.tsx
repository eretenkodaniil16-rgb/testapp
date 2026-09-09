"use client";

import { useEffect, useState } from "react";
import { readProgress, summarizeProgress } from "@/lib/local-progress";

export function DashboardSummary() {
  const [summary, setSummary] = useState({ total: 0, correct: 0, accuracy: 0, unresolvedMistakes: 0 });

  useEffect(() => {
    let cancelled = false;
    void readProgress().then((progress) => {
      if (!cancelled) setSummary(summarizeProgress(progress));
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="metric-grid" aria-label="Личная статистика">
      <div className="metric metric-blue">
        <span className="metric-icon" aria-hidden="true">✓</span>
        <div><span className="metric-kicker">РЕШЕНО</span><strong>{summary.total}</strong><span>ответов</span></div>
      </div>
      <div className="metric metric-teal">
        <span className="metric-icon" aria-hidden="true">%</span>
        <div><span className="metric-kicker">ТОЧНОСТЬ</span><strong>{summary.accuracy}%</strong><span>за всё время</span></div>
      </div>
      <div className="metric metric-rose">
        <span className="metric-icon" aria-hidden="true">↺</span>
        <div><span className="metric-kicker">ПОВТОРИТЬ</span><strong>{summary.unresolvedMistakes}</strong><span>ошибок</span></div>
      </div>
    </div>
  );
}
