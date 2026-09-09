import Link from "next/link";
import { ContentCatalog } from "@/components/content-catalog";
import { DashboardSummary } from "@/components/dashboard-summary";

export default function HomePage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">TESTAPP · MVP</p>
        <h1>Учебные тесты без потери ошибок</h1>
        <p>Тренировки по темам, экзамены, локальная статистика, слабые темы и интервальное повторение без серверной учётной записи.</p>
      </header>

      <DashboardSummary />

      <section className="action-grid" aria-label="Быстрые действия">
        <Link className="primary-card" href="/practice/setup">
          <span>Настроить тренировку</span>
          <small>Выбрать дисциплину, темы, количество и режим</small>
        </Link>
        <Link className="secondary-card" href="/practice?mode=mistakes">
          <span>Повторить ошибки</span>
          <small>Ошибка закрывается после двух правильных повторений</small>
        </Link>
      </section>

      <section className="mode-grid" aria-label="Режимы обучения">
        <Link href="/practice/setup?mode=exam"><strong>Экзамен</strong><span>Без подсказок до окончания</span></Link>
        <Link href="/review"><strong>По расписанию</strong><span>Интервальное повторение</span></Link>
        <Link href="/weak-topics"><strong>Слабые темы</strong><span>Автоматически по статистике</span></Link>
        <Link href="/questions"><strong>Банк ответов</strong><span>Вопросы и правильные ответы</span></Link>
      </section>

      <section>
        <div className="section-title"><h2>Дисциплины</h2><span>статические пакеты</span></div>
        <ContentCatalog />
      </section>

      <section className="info-card">
        <h2>Как хранятся данные</h2>
        <p>Общая база вопросов публикуется как версионированные файлы вместе с приложением. Ответы, ошибки, интервалы повторения и статистика остаются только в IndexedDB текущего устройства.</p>
      </section>
    </div>
  );
}
