import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./learning-features.css";
import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "TestApp",
  description: "Тренажёр тестовых заданий с экзаменами, анализом слабых тем и интервальным повторением",
  applicationName: "TestApp",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

const themeBootstrap = `(() => {
  try {
    const saved = localStorage.getItem("testapp-theme");
    document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
  } catch {}
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <PwaRegister />
        <main className="app-shell">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
