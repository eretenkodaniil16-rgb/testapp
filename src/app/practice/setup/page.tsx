"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getContentCatalogTree } from "@/lib/content-repository";
import type { ContentCatalogSubject } from "@/types/domain";

export default function PracticeSetupPage() {
  const [catalog, setCatalog] = useState<ContentCatalogSubject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState("20");
  const [shuffle, setShuffle] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const nextCatalog = await getContentCatalogTree();
      if (cancelled) return;

      const requestedSubject = params.get("subject") ?? nextCatalog[0]?.id ?? "";
      const requestedSection = params.get("section") ?? "";
      const requestedTopic = params.get("topic") ?? "";
      const selectedSubject = nextCatalog.find((item) => item.id === requestedSubject) ?? nextCatalog[0];
      const selectedSection = selectedSubject?.sections.find((item) => item.id === requestedSection);
      const initialTopics = requestedTopic
        ? [requestedTopic]
        : selectedSection
          ? selectedSection.topics.map((topic) => topic.id)
          : selectedSubject?.sections.flatMap((section) => section.topics.map((topic) => topic.id)) ?? [];

      setCatalog(nextCatalog);
      setSubjectId(selectedSubject?.id ?? "");
      setSectionId(selectedSection?.id ?? "");
      setSelectedTopics(new Set(initialTopics));
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const subject = catalog.find((item) => item.id === subjectId);
  const sections = subject?.sections ?? [];
  const visibleTopics = sectionId
    ? sections.find((item) => item.id === sectionId)?.topics ?? []
    : sections.flatMap((section) => section.topics);

  const selectedQuestionCount = useMemo(() => {
    const counts = new Map(visibleTopics.map((topic) => [topic.id, topic.questionCount]));
    return [...selectedTopics].reduce((sum, id) => sum + (counts.get(id) ?? 0), 0);
  }, [selectedTopics, visibleTopics]);

  function selectSubject(nextSubjectId: string) {
    const nextSubject = catalog.find((item) => item.id === nextSubjectId);
    setSubjectId(nextSubjectId);
    setSectionId("");
    setSelectedTopics(new Set(nextSubject?.sections.flatMap((section) => section.topics.map((topic) => topic.id)) ?? []));
  }

  function selectSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    const nextTopics = nextSectionId
      ? sections.find((item) => item.id === nextSectionId)?.topics ?? []
      : sections.flatMap((section) => section.topics);
    setSelectedTopics(new Set(nextTopics.map((topic) => topic.id)));
  }

  function toggleTopic(topicId: string) {
    setSelectedTopics((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  const startHref = useMemo(() => {
    const params = new URLSearchParams();
    if (subjectId) params.set("subject", subjectId);
    if (selectedTopics.size > 0) params.set("topics", [...selectedTopics].join(","));
    if (questionCount !== "all") params.set("count", questionCount);
    params.set("shuffle", shuffle ? "1" : "0");
    return `/practice?${params.toString()}`;
  }, [questionCount, selectedTopics, shuffle, subjectId]);

  if (loading) {
    return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Подготавливаю структуру тем.</p></div></div>;
  }

  if (!subject) {
    return <div className="page"><div className="empty-state"><h1>Нет опубликованных дисциплин</h1><Link className="button" href="/">На главную</Link></div></div>;
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">КОНСТРУКТОР</p>
        <h1>Настройка тренировки</h1>
        <p>Выбери дисциплину, разделы и темы. Вопросы берутся только из опубликованных пакетов и результат сохраняется локально.</p>
      </header>

      <section className="setup-card">
        <label className="field-label">
          <span>Дисциплина</span>
          <select value={subjectId} onChange={(event) => selectSubject(event.target.value)}>
            {catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>

        <label className="field-label">
          <span>Раздел</span>
          <select value={sectionId} onChange={(event) => selectSection(event.target.value)}>
            <option value="">Все разделы</option>
            {sections.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.questionCount}</option>)}
          </select>
        </label>
      </section>

      <section className="setup-card">
        <div className="setup-card-head">
          <div><h2>Темы</h2><p>{selectedTopics.size} выбрано · {selectedQuestionCount} вопросов доступно</p></div>
          <div className="inline-links">
            <button type="button" onClick={() => setSelectedTopics(new Set(visibleTopics.map((topic) => topic.id)))}>Все</button>
            <button type="button" onClick={() => setSelectedTopics(new Set())}>Снять</button>
          </div>
        </div>
        <div className="topic-check-list">
          {visibleTopics.map((topic) => (
            <label className="topic-check" key={topic.id}>
              <input type="checkbox" checked={selectedTopics.has(topic.id)} onChange={() => toggleTopic(topic.id)} />
              <span><strong>{topic.title}</strong><small>{topic.questionCount} вопросов</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="setup-card setup-options-grid">
        <label className="field-label">
          <span>Количество вопросов</span>
          <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">Все доступные</option>
          </select>
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} />
          <span><strong>Перемешивать вопросы</strong><small>Если выключить — порядок будет как в пакете</small></span>
        </label>
      </section>

      {selectedTopics.size === 0 ? (
        <div className="info-card"><p>Выбери хотя бы одну тему, чтобы начать тренировку.</p></div>
      ) : (
        <Link className="button full-width" href={startHref}>Начать тренировку</Link>
      )}

      <Link className="text-link" href={`/questions?subject=${encodeURIComponent(subjectId)}`}>Сначала посмотреть вопросы с правильными ответами</Link>
    </div>
  );
}
