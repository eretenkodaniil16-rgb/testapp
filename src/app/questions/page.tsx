"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuestionImageView } from "@/components/question-image";
import { getAllQuestions, getContentCatalogTree } from "@/lib/content-repository";
import { questionTypeLabel, scientificStatusLabel } from "@/lib/question-evaluator";
import type { ContentCatalogSubject, PracticeQuestion } from "@/types/domain";

function AnswerBlock({ question }: { question: PracticeQuestion }) {
  if (question.scientificStatus === "needs_revision") {
    return (
      <div className="source-defect-block">
        <strong>Ключ исходного банка требует проверки</strong>
        {question.sourceKey && question.sourceKey.length > 0 && <p><b>Ключ в исходнике:</b> {question.sourceKey.join(", ")}</p>}
        <div className="source-option-list">
          {question.options.map((option) => <p key={option.id}><b>{option.label}.</b> {option.text}</p>)}
        </div>
        <p>Этот вопрос сохранён для полноты исходной базы, но исключён из тренировок и экзаменов до исправления источника.</p>
      </div>
    );
  }

  if (question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false") {
    const correct = question.options.filter((option) => option.correct);
    return (
      <>
        <div className="correct-answer-block">
          <strong>{correct.length > 1 ? "Правильные ответы" : "Правильный ответ"}</strong>
          {correct.map((option) => <p key={option.id}><b>{option.label}.</b> {option.text}</p>)}
        </div>
        <div className="option-feedback-list">
          <h4>Разбор всех вариантов</h4>
          {question.options.map((option) => (
            <div className={`option-feedback-row ${option.correct ? "correct" : "incorrect"}`} key={option.id}>
              <div className="option-feedback-head"><strong>{option.label}. {option.text}</strong><span className="option-feedback-badge">{option.correct ? "Правильный" : "Неправильный"}</span></div>
              <p>{option.feedback || (option.correct ? "Правильный вариант." : "Неправильный вариант.")}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (question.type === "text" || question.type === "number") {
    return <div className="correct-answer-block"><strong>Правильный ответ</strong><p>{question.answerLabel ?? question.acceptedAnswers?.[0] ?? "—"}</p></div>;
  }

  if (question.type === "matching") {
    return (
      <div className="correct-answer-block">
        <strong>Правильные соответствия</strong>
        {(question.matchingPairs ?? []).map((pair) => <p key={pair.id}><b>{pair.left}</b> → {pair.right}{pair.explanation ? ` — ${pair.explanation}` : ""}</p>)}
      </div>
    );
  }

  if (question.type === "case") {
    return (
      <div className="correct-answer-block">
        <strong>Разбор ситуационной задачи</strong>
        {question.caseStem && <p>{question.caseStem}</p>}
        {(question.caseQuestions ?? []).map((item) => <p key={item.id}><b>{item.prompt}</b><br />{item.answerLabel}{item.explanation ? ` — ${item.explanation}` : ""}</p>)}
      </div>
    );
  }

  return null;
}

function ScientificBlock({ question }: { question: PracticeQuestion }) {
  const label = scientificStatusLabel(question);
  if (!label) return null;
  return (
    <div className={`scientific-note science-${question.scientificStatus}`}>
      <strong>{label}{question.verifiedAt ? ` · проверено ${question.verifiedAt}` : ""}</strong>
      {question.sourceKey && question.sourceKey.length > 0 && <p><b>Ключ исходного теста:</b> {question.sourceKey.join(", ")}</p>}
      {question.scientificAnswer && <p><b>Научный ответ:</b> {question.scientificAnswer}</p>}
      {question.scientificNote && <p>{question.scientificNote}</p>}
      {question.sources && question.sources.length > 0 && <div className="scientific-sources">{question.sources.map((source) => source.url ? <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.title}</a> : <span key={source.id}>{source.title}</span>)}</div>}
    </div>
  );
}

export default function QuestionsPage() {
  const [catalog, setCatalog] = useState<ContentCatalogSubject[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [query, setQuery] = useState("");
  const [scienceOnly, setScienceOnly] = useState(false);
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
      setScienceOnly(params.get("science") === "1");
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
    if (scienceOnly) result = result.filter((question) => !question.scientificStatus || question.scientificStatus === "verified");
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      result = result.filter((question) => {
        const answerText = [
          ...question.options.map((option) => option.text),
          ...(question.acceptedAnswers ?? []),
          ...(question.matchingPairs ?? []).flatMap((pair) => [pair.left, pair.right]),
          ...(question.caseQuestions ?? []).flatMap((item) => [item.prompt, item.answerLabel]),
          question.image?.alt ?? "",
        ].join(" ");
        return `${question.prompt} ${question.topic} ${answerText} ${question.scientificNote ?? ""}`.toLowerCase().includes(normalizedQuery);
      });
    }
    return result;
  }, [catalog, questions, query, scienceOnly, sectionId, subjectId, topicId]);

  const practiceSetupHref = useMemo(() => {
    const params = new URLSearchParams();
    if (subjectId) params.set("subject", subjectId);
    if (sectionId) params.set("section", sectionId);
    if (topicId) params.set("topic", topicId);
    if (scienceOnly) params.set("science", "1");
    const suffix = params.toString();
    return `/practice/setup${suffix ? `?${suffix}` : ""}`;
  }, [scienceOnly, sectionId, subjectId, topicId]);

  if (loading) return <div className="page"><div className="empty-state"><h1>Загрузка…</h1><p>Открываю локально закэшированную базу вопросов.</p></div></div>;

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">БАНК ВОПРОСОВ</p>
        <h1>Вопросы, ответы и научный разбор</h1>
        <p>Просмотр не изменяет статистику. Для научно размеченных банков показываются исходный ключ, статус проверки, объяснение каждого варианта и современные комментарии.</p>
      </header>

      <section className="filter-panel">
        <label><span>Дисциплина</span><select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setSectionId(""); setTopicId(""); }}><option value="">Все дисциплины</option>{catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label><span>Раздел</span><select value={sectionId} disabled={!subjectId} onChange={(event) => { setSectionId(event.target.value); setTopicId(""); }}><option value="">Все разделы</option>{sections.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label><span>Тема</span><select value={topicId} disabled={!subjectId} onChange={(event) => setTopicId(event.target.value)}><option value="">Все темы</option>{topics.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label className="filter-search"><span>Поиск</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Текст вопроса, ответа или комментария" /></label>
        <label className="toggle-row science-toggle"><input type="checkbox" checked={scienceOnly} onChange={(event) => setScienceOnly(event.target.checked)} /><span><strong>Только научно пригодные</strong><small>Скрыть учебные, неоднозначные и требующие исправления вопросы</small></span></label>
      </section>

      <div className="section-title"><h2>{filtered.length} вопросов</h2><Link href={practiceSetupHref}>Создать тренировку</Link></div>

      {filtered.length === 0 ? <div className="empty-state"><h2>Ничего не найдено</h2><p>Измени фильтры или поисковый запрос.</p></div> : (
        <div className="question-list">
          {filtered.map((question, index) => (
            <article className="answer-card" key={`${question.id}:${question.revisionId}`}>
              <div className="answer-card-meta"><span>#{question.sourceQuestionNumber ?? index + 1}</span><span>{question.subject} · {question.topic}</span></div>
              <div className="question-card-kickers"><span className="question-type">{questionTypeLabel(question)}</span>{question.scientificStatus && <span className={`science-badge science-${question.scientificStatus}`}>{scientificStatusLabel(question)}</span>}</div>
              <h3>{question.prompt}</h3>
              <QuestionImageView image={question.image} />
              <AnswerBlock question={question} />
              {question.explanation && <p className="answer-explanation">{question.explanation}</p>}
              <ScientificBlock question={question} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
