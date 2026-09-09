import Link from "next/link";

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <Link href="/">Главная</Link>
      <Link href="/practice">Тренировка</Link>
      <Link href="/mistakes">Ошибки</Link>
      <Link href="/statistics">Статистика</Link>
    </nav>
  );
}
