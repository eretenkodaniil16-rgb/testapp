import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./learning-features.css";
import "./theme.css";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

const themeBootstrapScript = `
(function () {
  try {
    var theme = localStorage.getItem("testapp-theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  } catch (_) {}
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <PwaRegister />
        <main className="app-shell">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
