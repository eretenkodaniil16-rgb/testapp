"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getContentCatalogTree } from "@/lib/content-repository";
import type { ContentCatalogSubject } from "@/types/domain";

export default function SubjectPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = decodeURIComponent(params.subjectId ?? "");
  const [subject, setSubject] = useState<ContentCatalogSubject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getContentCatalogTree().then((catalog) => {
      if (!cancelled) {
        setSubject(catalog.find((item) => item.id === subjectId) ?? null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [subjectId]);

  if (loading) {
    return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Открываю структуру дисциплины.</p></div></div>;
  }

  if (!subject) {
    return <div className="page"><div className="empty-state"><h1>Дисциплина не найдена</h1><Link className="button" href="/">Вернуться на главную</Link></div></div>;
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">ДИСЦИПЛИНА</p>
        <h1>{subject.title}</h1>
        <p>{subject.questionCount} вопросов. Выбери раздел или тему либо открой всю базу сразу.</p>
      </header>

      <section className="action-grid">
        <Link className="primary-card" href={`/practice/setup?subject=${encodeURIComponent(subject.id)}`}>
          <span>Настроить тренировку</span>
          <small>Темы, количество и порядок вопросов</small>
        </Link>
        <Link className="secondary-card" href={`/questions?subject=${encodeURIComponent(subject.id)}`}>
          <span>Все вопросы и ответы</span>
          <small>Режим просмотра без записи результата</small>
        </Link>
      </section>

      <section>
        <div className="section-title"><h2>Разделы</h2><span>{subject.sections.length}</span></div>
        <div className="curriculum-list">
          {subject.sections.map((section) => (
            <article className="curriculum-section" key={section.id}>
              <div className="curriculum-section-head">
                <div><h3>{section.title}</h3><p>{section.questionCount} вопросов</p></div>
                <div className="inline-links">
                  <Link href={`/questions?subject=${encodeURIComponent(subject.id)}&section=${encodeURIComponent(section.id)}`}>Вопросы</Link>
                  <Link href={`/practice/setup?subject=${encodeURIComponent(subject.id)}&section=${encodeURIComponent(section.id)}`}>Тренировка</Link>
                </div>
              </div>

              <div className="topic-list">
                {section.topics.map((topic) => (
                  <div className="topic-item" key={topic.id}>
                    <div><strong>{topic.title}</strong><span>{topic.questionCount} вопросов</span></div>
                    <div className="inline-links">
                      <Link href={`/questions?subject=${encodeURIComponent(subject.id)}&topic=${encodeURIComponent(topic.id)}`}>Ответы</Link>
                      <Link href={`/practice/setup?subject=${encodeURIComponent(subject.id)}&topic=${encodeURIComponent(topic.id)}`}>Решать</Link>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
