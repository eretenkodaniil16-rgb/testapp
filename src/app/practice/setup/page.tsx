"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestions, getContentCatalogTree } from "@/lib/content-repository";
import type { ContentCatalogSubject, PracticeQuestion } from "@/types/domain";

export default function PracticeSetupPage() {
  const [catalog, setCatalog] = useState<ContentCatalogSubject[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState("20");
  const [shuffle, setShuffle] = useState(true);
  const [scienceOnly, setScienceOnly] = useState(false);
  const [studyMode, setStudyMode] = useState<"learning" | "exam">("learning");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const [nextCatalog, nextQuestions] = await Promise.all([getContentCatalogTree(), getAllQuestions()]);
      if (cancelled) return;

      const requestedSubject = params.get("subject") ?? nextCatalog[0]?.id ?? "";
      const requestedSection = params.get("section") ?? "";
      const requestedTopic = params.get("topic") ?? "";
      const requestedMode = params.get("mode") === "exam" ? "exam" : "learning";
      const selectedSubject = nextCatalog.find((item) => item.id === requestedSubject) ?? nextCatalog[0];
      const selectedSection = selectedSubject?.sections.find((item) => item.id === requestedSection);
      const initialTopics = requestedTopic
        ? [requestedTopic]
        : selectedSection
          ? selectedSection.topics.map((topic) => topic.id)
          : selectedSubject?.sections.flatMap((section) => section.topics.map((topic) => topic.id)) ?? [];

      setCatalog(nextCatalog);
      setQuestions(nextQuestions);
      setSubjectId(selectedSubject?.id ?? "");
      setSectionId(selectedSection?.id ?? "");
      setSelectedTopics(new Set(initialTopics));
      setStudyMode(requestedMode);
      setScienceOnly(params.get("science") === "1");
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const subject = catalog.find((item) => item.id === subjectId);
  const sections = subject?.sections ?? [];
  const visibleTopics = sectionId ? sections.find((item) => item.id === sectionId)?.topics ?? [] : sections.flatMap((section) => section.topics);

  const availableCountByTopic = useMemo(() => {
    const counts = new Map<string, number>();
    for (const question of questions) {
      if (question.subjectId !== subjectId || question.scientificStatus === "needs_revision") continue;
      if (scienceOnly && question.scientificStatus && question.scientificStatus !== "verified") continue;
      counts.set(question.topicId, (counts.get(question.topicId) ?? 0) + 1);
    }
    return counts;
  }, [questions, scienceOnly, subjectId]);

  const selectedQuestionCount = useMemo(() => [...selectedTopics].reduce((sum, id) => sum + (availableCountByTopic.get(id) ?? 0), 0), [availableCountByTopic, selectedTopics]);

  function sectionAvailableCount(sectionTopicIds: string[]): number {
    return sectionTopicIds.reduce((sum, topicId) => sum + (availableCountByTopic.get(topicId) ?? 0), 0);
  }

  function selectSubject(nextSubjectId: string) {
    const nextSubject = catalog.find((item) => item.id === nextSubjectId);
    setSubjectId(nextSubjectId);
    setSectionId("");
    setSelectedTopics(new Set(nextSubject?.sections.flatMap((section) => section.topics.map((topic) => topic.id)) ?? []));
  }

  function selectSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    const nextTopics = nextSectionId ? sections.find((item) => item.id === nextSectionId)?.topics ?? [] : sections.flatMap((section) => section.topics);
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
    if (scienceOnly) params.set("science", "1");
    if (studyMode === "exam") params.set("mode", "exam");
    return `/practice?${params.toString()}`;
  }, [questionCount, scienceOnly, selectedTopics, shuffle, studyMode, subjectId]);

  if (loading) return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Подготавливаю структуру тем.</p></div></div>;
  if (!subject) return <div className="page"><div className="empty-state"><h1>Нет опубликованных дисциплин</h1><Link className="button" href="/">На главную</Link></div></div>;

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">КОНСТРУКТОР</p>
        <h1>Настройка тренировки</h1>
        <p>Выбери дисциплину, темы и формат. Вопросы с повреждённым исходным ключом доступны для просмотра в банке, но автоматически исключаются из тренировок и экзаменов.</p>
      </header>

      <section className="setup-card mode-selector">
        <button type="button" className={studyMode === "learning" ? "mode-option active" : "mode-option"} onClick={() => setStudyMode("learning")}><strong>Учебный режим</strong><span>Сразу показывает правильность и полный разбор</span></button>
        <button type="button" className={studyMode === "exam" ? "mode-option active" : "mode-option"} onClick={() => setStudyMode("exam")}><strong>Экзамен</strong><span>Ответы и разбор открываются только в конце</span></button>
      </section>

      <section className="setup-card">
        <label className="field-label"><span>Дисциплина</span><select value={subjectId} onChange={(event) => selectSubject(event.target.value)}>{catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label className="field-label"><span>Раздел</span><select value={sectionId} onChange={(event) => selectSection(event.target.value)}><option value="">Все разделы</option>{sections.map((item) => <option value={item.id} key={item.id}>{item.title} · {sectionAvailableCount(item.topics.map((topic) => topic.id))}</option>)}</select></label>
      </section>

      <section className="setup-card">
        <div className="setup-card-head"><div><h2>Темы</h2><p>{selectedTopics.size} выбрано · {selectedQuestionCount} вопросов доступно</p></div><div className="inline-links"><button type="button" onClick={() => setSelectedTopics(new Set(visibleTopics.map((topic) => topic.id)))}>Все</button><button type="button" onClick={() => setSelectedTopics(new Set())}>Снять</button></div></div>
        <div className="topic-check-list">{visibleTopics.map((topic) => <label className="topic-check" key={topic.id}><input type="checkbox" checked={selectedTopics.has(topic.id)} onChange={() => toggleTopic(topic.id)} /><span><strong>{topic.title}</strong><small>{availableCountByTopic.get(topic.id) ?? 0} вопросов</small></span></label>)}</div>
      </section>

      <section className="setup-card setup-options-grid">
        <label className="field-label"><span>Количество вопросов</span><select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all">Все доступные</option></select></label>
        <label className="toggle-row"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} /><span><strong>Перемешивать вопросы</strong><small>Если выключить — порядок будет как в исходном пакете</small></span></label>
        <label className="toggle-row science-toggle"><input type="checkbox" checked={scienceOnly} onChange={(event) => setScienceOnly(event.target.checked)} /><span><strong>Научная тренировка</strong><small>Оставить только проверенные и не отмеченные как устаревшие/неоднозначные задания</small></span></label>
      </section>

      {selectedTopics.size === 0 || selectedQuestionCount === 0 ? <div className="info-card"><p>Выбери хотя бы одну тему с доступными вопросами, чтобы начать.</p></div> : <Link className="button full-width" href={startHref}>{studyMode === "exam" ? "Начать экзамен" : "Начать тренировку"}</Link>}

      <div className="study-shortcuts"><Link className="text-link" href={`/questions?subject=${encodeURIComponent(subjectId)}${scienceOnly ? "&science=1" : ""}`}>Посмотреть вопросы с правильными ответами</Link><Link className="text-link" href="/weak-topics">Тренировать слабые темы</Link><Link className="text-link" href="/review">Интервальное повторение</Link></div>
    </div>
  );
}
