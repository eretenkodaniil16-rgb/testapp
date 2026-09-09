"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getContentSubjects } from "@/lib/content-repository";

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
    return <div className="info-card"><p>Загружаю каталог вопросов…</p></div>;
  }

  return (
    <div className="subject-list">
      {subjects.map((subject) => (
        <Link className="subject-card subject-card-link" href={`/subjects/${encodeURIComponent(subject.id)}`} key={subject.id}>
          <div>
            <h3>{subject.title}</h3>
            <p>{subject.questionCount} {subject.questionCount === 1 ? "вопрос" : "вопросов"} в опубликованном пакете</p>
          </div>
          <span aria-hidden="true">›</span>
        </Link>
      ))}
    </div>
  );
}
