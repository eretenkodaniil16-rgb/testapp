import Link from "next/link";
import { ContentCatalog } from "@/components/content-catalog";
import { DashboardSummary } from "@/components/dashboard-summary";

export default function HomePage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">TESTAPP · MVP</p>
        <h1>Учебные тесты без потери ошибок</h1>
        <p>Единая версия базы вопросов, тренировки по темам, локальная история ответов и отдельная очередь повторения.</p>
      </header>

      <DashboardSummary />

      <section className="action-grid" aria-label="Быстрые действия">
        <Link className="primary-card" href="/practice/setup">
          <span>Настроить тренировку</span>
          <small>Выбрать дисциплину, темы и количество вопросов</small>
        </Link>
        <Link className="secondary-card" href="/questions">
          <span>Список вопросов</span>
          <small>Просмотр вопросов сразу с правильными ответами</small>
        </Link>
        <Link className="secondary-card" href="/practice?mode=mistakes">
          <span>Повторить ошибки</span>
          <small>Ошибка закрывается после двух правильных повторений</small>
        </Link>
      </section>

      <section>
        <div className="section-title"><h2>Дисциплины</h2><span>разделы и темы</span></div>
        <ContentCatalog />
      </section>

      <section className="info-card">
        <h2>Как хранятся данные</h2>
        <p>Общая база вопросов публикуется как версионированные файлы вместе с приложением. Ответы, ошибки и статистика остаются только в IndexedDB текущего устройства.</p>
      </section>
    </div>
  );
}
