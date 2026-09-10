import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./learning-features.css";
import "./scientific-features.css";
import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "TestApp",
  description: "Тренажёр тестовых заданий с экзаменами, научным разбором, анализом слабых тем и интервальным повторением",
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

const staticBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const staticNavigationBootstrap = staticBasePath
  ? `(() => {
  const BASE = ${JSON.stringify(staticBasePath.replace(/\/$/, ""))};
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (!(url.pathname === BASE || url.pathname.startsWith(BASE + "/"))) return;

    if (url.pathname === BASE || url.pathname === BASE + "/") {
      url.pathname = BASE + "/index.html";
    } else if (url.pathname.endsWith("/") && !url.pathname.endsWith("/index.html")) {
      url.pathname += "index.html";
    } else {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(url.toString());
  }, true);
})();`
  : "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {staticNavigationBootstrap ? <script dangerouslySetInnerHTML={{ __html: staticNavigationBootstrap }} /> : null}
      </head>
      <body>
        <PwaRegister />
        <main className="app-shell">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
