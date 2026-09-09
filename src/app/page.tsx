import Link from "next/link";
import { DashboardSummary } from "@/components/dashboard-summary";
import { subjects } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">TESTAPP · MVP</p>
        <h1>Учебные тесты без потери ошибок</h1>
        <p>Единая база вопросов, тренировки по темам, история ответов и отдельная очередь повторения.</p>
      </header>

      <DashboardSummary />

      <section className="action-grid" aria-label="Быстрые действия">
        <Link className="primary-card" href="/practice">
          <span>Начать тренировку</span>
          <small>Демонстрационный набор вопросов</small>
        </Link>
        <Link className="secondary-card" href="/practice?mode=mistakes">
          <span>Повторить ошибки</span>
          <small>Ошибка закрывается после двух правильных повторений</small>
        </Link>
      </section>

      <section>
        <div className="section-title"><h2>Разделы</h2><span>демо-каталог</span></div>
        <div className="subject-list">
          {subjects.map((subject) => (
            <article className="subject-card" key={subject.id}>
              <div><h3>{subject.title}</h3><p>{subject.questionCount} вопросов в будущей базе</p></div>
              <span aria-hidden="true">›</span>
            </article>
          ))}
        </div>
      </section>

      <section className="info-card">
        <h2>Что уже заложено</h2>
        <p>Модель вопроса использует отдельный идентификатор редакции. Поэтому исправление ключа ответа в будущем не исказит старые попытки.</p>
      </section>
    </div>
  );
}
