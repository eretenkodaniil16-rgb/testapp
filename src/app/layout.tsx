import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "TestApp",
  description: "Тренажёр тестовых заданий с повторением ошибок и статистикой",
  applicationName: "TestApp",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <PwaRegister />
        <main className="app-shell">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
