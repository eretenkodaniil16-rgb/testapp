"use client";

import { useEffect, useState } from "react";
import { summarizeProgress } from "@/lib/local-progress";

export function DashboardSummary() {
  const [summary, setSummary] = useState({ total: 0, correct: 0, accuracy: 0, unresolvedMistakes: 0 });

  useEffect(() => setSummary(summarizeProgress()), []);

  return (
    <div className="metric-grid">
      <div className="metric"><strong>{summary.total}</strong><span>ответов</span></div>
      <div className="metric"><strong>{summary.accuracy}%</strong><span>точность</span></div>
      <div className="metric"><strong>{summary.unresolvedMistakes}</strong><span>на повтор</span></div>
    </div>
  );
}
