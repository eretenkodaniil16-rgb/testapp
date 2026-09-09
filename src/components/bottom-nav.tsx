"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Главная", icon: <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z" /> },
  { href: "/practice/setup", label: "Тренировка", icon: <><path d="M7 5h10l2 4-7 10L5 9z" /><path d="M8.5 9h7" /></> },
  { href: "/questions", label: "Вопросы", icon: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></> },
  { href: "/mistakes", label: "Ошибки", icon: <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6m0-6-6 6" /></> },
  { href: "/statistics", label: "Статистика", icon: <><path d="M5 19V9m7 10V5m7 14v-7" /></> },
  { href: "/settings", label: "Настройки", icon: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /></> },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link className={active ? "active" : ""} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
