import Link from "next/link";
import { ContentCatalog } from "@/components/content-catalog";
import { DashboardSummary } from "@/components/dashboard-summary";

function SparkIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 5v38M5 24h38" />
      <circle cx="24" cy="24" r="13" />
      <path d="m16 24 5 5 11-12" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="page home-page">
      <header className="hero home-hero">
        <div className="hero-copy">
          <div className="hero-badge"><span>●</span> TESTAPP · ЛОКАЛЬНЫЙ ПРОГРЕСС</div>
          <h1>Учись точнее.<br /><span>Ошибки работают на тебя.</span></h1>
          <p>Тренировки по темам, экзамены, разбор каждого варианта и интервальное повторение — без обязательной учётной записи.</p>
          <div className="hero-actions">
            <Link className="button hero-button" href="/practice/setup">Начать тренировку <span>→</span></Link>
            <Link className="hero-link" href="/questions">Открыть банк ответов</Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-symbol"><SparkIcon /></div>
          <span className="hero-chip hero-chip-a">97%</span>
          <span className="hero-chip hero-chip-b">+12 тем</span>
        </div>
      </header>

      <DashboardSummary />

      <section className="action-grid" aria-label="Быстрые действия">
        <Link className="primary-card action-card" href="/practice/setup">
          <div className="action-card-icon">✦</div>
          <div className="action-card-copy">
            <span>Настроить тренировку</span>
            <small>Дисциплина, темы, количество и режим</small>
          </div>
          <b aria-hidden="true">→</b>
        </Link>
        <Link className="secondary-card action-card" href="/practice?mode=mistakes">
          <div className="action-card-icon">↺</div>
          <div className="action-card-copy">
            <span>Повторить ошибки</span>
            <small>Закрепить вопросы, на которых были промахи</small>
          </div>
          <b aria-hidden="true">→</b>
        </Link>
      </section>

      <section className="mode-grid" aria-label="Режимы обучения">
        <Link href="/practice/setup?mode=exam"><i>01</i><strong>Экзамен</strong><span>Без подсказок до окончания</span></Link>
        <Link href="/review"><i>02</i><strong>По расписанию</strong><span>Интервальное повторение</span></Link>
        <Link href="/weak-topics"><i>03</i><strong>Слабые темы</strong><span>Автоматически по статистике</span></Link>
        <Link href="/questions"><i>04</i><strong>Банк ответов</strong><span>Вопросы и разбор вариантов</span></Link>
      </section>

      <section className="catalog-section">
        <div className="section-title">
          <div><span className="section-kicker">КАТАЛОГ</span><h2>Дисциплины</h2></div>
          <span>обновляются из GitHub</span>
        </div>
        <ContentCatalog />
      </section>

      <section className="info-card privacy-card">
        <div className="privacy-icon" aria-hidden="true">⌁</div>
        <div>
          <h2>Прогресс остаётся твоим</h2>
          <p>Ответы, ошибки, интервалы повторения и статистика хранятся только на текущем устройстве. Из GitHub загружается только общая база тестов.</p>
        </div>
      </section>
    </div>
  );
}
