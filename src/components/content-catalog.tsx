"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getContentSubjects } from "@/lib/content-repository";

function visualForSubject(subjectId: string, index: number) {
  const normalized = subjectId.toLowerCase();
  if (normalized.includes("path")) return { glyph: "PA", tone: "violet" };
  if (normalized.includes("phys")) return { glyph: "Φ", tone: "blue" };
  if (normalized.includes("histol")) return { glyph: "H", tone: "teal" };
  const glyphs = ["A", "B", "C", "D", "E"];
  const tones = ["blue", "teal", "violet", "amber", "rose"];
  return { glyph: glyphs[index % glyphs.length], tone: tones[index % tones.length] };
}

export function ContentCatalog() {
  const [subjects, setSubjects] = useState<Array<{ id: string; title: string; questionCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getContentSubjects().then((items) => {
      if (!cancelled) {
        setSubjects(items);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="info-card catalog-loading"><span className="loading-dot" /><p>Загружаю каталог вопросов…</p></div>;
  }

  return (
    <div className="subject-list">
      {subjects.map((subject, index) => {
        const visual = visualForSubject(subject.id, index);
        return (
          <Link className="subject-card subject-card-link" href={`/subjects/${encodeURIComponent(subject.id)}`} key={subject.id}>
            <div className={`subject-icon subject-icon-${visual.tone}`} aria-hidden="true">{visual.glyph}</div>
            <div className="subject-card-copy">
              <span className="subject-label">ДИСЦИПЛИНА</span>
              <h3>{subject.title}</h3>
              <p>{subject.questionCount} {subject.questionCount === 1 ? "вопрос" : "вопросов"} доступно</p>
            </div>
            <span className="subject-arrow" aria-hidden="true">→</span>
          </Link>
        );
      })}
    </div>
  );
}
