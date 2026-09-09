"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions, getContentCatalogTree } from "@/lib/content-repository";
import type { ContentCatalogSubject, PracticeQuestion } from "@/types/domain";

export default function QuestionsPage() {
  const [catalog, setCatalog] = useState<ContentCatalogSubject[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const [nextCatalog, nextQuestions] = await Promise.all([getContentCatalogTree(), getAllQuestions()]);
      if (cancelled) return;
      setCatalog(nextCatalog);
      setQuestions(nextQuestions);
      setSubjectId(params.get("subject") ?? "");
      setSectionId(params.get("section") ?? "");
      setTopicId(params.get("topic") ?? "");
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const subject = catalog.find((item) => item.id === subjectId);
  const sections = subject?.sections ?? [];
  const section = sections.find((item) => item.id === sectionId);
  const topics = section ? section.topics : subject?.sections.flatMap((item) => item.topics) ?? [];

  const filtered = useMemo(() => {
    let result = questions;
    if (subjectId) result = result.filter((question) => question.subjectId === subjectId);
    if (sectionId) {
      const selectedSubject = catalog.find((item) => item.id === subjectId);
      const selectedSection = selectedSubject?.sections.find((item) => item.id === sectionId);
      const topicIds = new Set(selectedSection?.topics.map((topic) => topic.id) ?? []);
      result = result.filter((question) => topicIds.has(question.topicId));
    }
    if (topicId) result = result.filter((question) => question.topicId === topicId);
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      result = result.filter((question) => {
        const correctText = question.options.filter((option) => option.correct).map((option) => option.text).join(" ");
        return `${question.prompt} ${question.topic} ${correctText}`.toLowerCase().includes(normalizedQuery);
      });
    }
    return result;
  }, [catalog, questions, query, sectionId, subjectId, topicId]);

  const practiceSetupHref = useMemo(() => {
    const params = new URLSearchParams();
    if (subjectId) params.set("subject", subjectId);
    if (sectionId) params.set("section", sectionId);
    if (topicId) params.set("topic", topicId);
    const suffix = params.toString();
    return `/practice/setup${suffix ? `?${suffix}` : ""}`;
  }, [sectionId, subjectId, topicId]);

  if (loading) {
    return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Открываю локально закэшированную базу вопросов.</p></div></div>;
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">БАНК ВОПРОСОВ</p>
        <h1>Вопросы и правильные ответы</h1>
        <p>Режим просмотра не изменяет статистику и не считается попыткой. Используй фильтры, чтобы открыть конкретную дисциплину, раздел или тему.</p>
      </header>

      <section className="filter-panel">
        <label>
          <span>Дисциплина</span>
          <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setSectionId(""); setTopicId(""); }}>
            <option value="">Все дисциплины</option>
            {catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>

        <label>
          <span>Раздел</span>
          <select value={sectionId} disabled={!subjectId} onChange={(event) => { setSectionId(event.target.value); setTopicId(""); }}>
            <option value="">Все разделы</option>
            {sections.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>

        <label>
          <span>Тема</span>
          <select value={topicId} disabled={!subjectId} onChange={(event) => setTopicId(event.target.value)}>
            <option value="">Все темы</option>
            {topics.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>

        <label className="filter-search">
          <span>Поиск</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Текст вопроса или ответа" />
        </label>
      </section>

      <div className="section-title">
        <h2>{filtered.length} вопросов</h2>
        <Link href={practiceSetupHref}>Создать тренировку</Link>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h2>Ничего не найдено</h2><p>Измени фильтры или поисковый запрос.</p></div>
      ) : (
        <div className="question-list">
          {filtered.map((question, index) => {
            const correct = question.options.filter((option) => option.correct);
            return (
              <article className="answer-card" key={`${question.id}:${question.revisionId}`}>
                <div className="answer-card-meta"><span>#{index + 1}</span><span>{question.subject} · {question.topic}</span></div>
                <h3>{question.prompt}</h3>
                <div className="correct-answer-block">
                  <strong>{correct.length > 1 ? "Правильные ответы" : "Правильный ответ"}</strong>
                  {correct.map((option) => <p key={option.id}><b>{option.label}.</b> {option.text}</p>)}
                </div>
                {question.explanation && <p className="answer-explanation">{question.explanation}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
