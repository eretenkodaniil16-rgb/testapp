"use client";

import { useEffect, useRef, useState } from "react";
import { primeOfflineContent, refreshContentFromRemote } from "@/lib/content-repository";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const AUTO_UPDATE_KEY = "testapp-auto-content-updates";
const LAST_CONTENT_CHECK_KEY = "testapp-last-content-check";
const CONTENT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [appUpdateReady, setAppUpdateReady] = useState(false);
  const [contentMessage, setContentMessage] = useState("");
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event: Event) => {
      const promptEvent = event as InstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPrompt(promptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    let registration: ServiceWorkerRegistration | null = null;
    let updateTimer = 0;

    const markWaiting = (worker: ServiceWorker | null) => {
      if (!worker || !navigator.serviceWorker.controller) return;
      waitingWorker.current = worker;
      setAppUpdateReady(true);
    };

    const watchRegistration = (next: ServiceWorkerRegistration) => {
      registration = next;
      markWaiting(next.waiting);
      next.addEventListener("updatefound", () => {
        const worker = next.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") markWaiting(next.waiting ?? worker);
        });
      });
    };

    const checkAppUpdate = () => {
      if (navigator.onLine) void registration?.update().catch(() => undefined);
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
        .then((next) => {
          watchRegistration(next);
          checkAppUpdate();
          updateTimer = window.setInterval(checkAppUpdate, CONTENT_CHECK_INTERVAL_MS);
        })
        .catch(() => {
          // The app remains usable online if service-worker registration is unavailable.
        });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading.current) return;
        reloading.current = true;
        window.location.reload();
      });
    }

    async function prepareOfflineAndCheckContent() {
      try {
        await primeOfflineContent();
      } catch {
        // Existing bundled/cached content is still usable.
      }

      const autoUpdate = window.localStorage.getItem(AUTO_UPDATE_KEY) !== "0";
      if (!autoUpdate || !navigator.onLine) return;

      const last = Number(window.localStorage.getItem(LAST_CONTENT_CHECK_KEY) ?? "0");
      if (Number.isFinite(last) && Date.now() - last < CONTENT_CHECK_INTERVAL_MS) return;

      window.localStorage.setItem(LAST_CONTENT_CHECK_KEY, String(Date.now()));
      try {
        const result = await refreshContentFromRemote();
        if (result.updated) {
          setContentMessage(`База тестов автоматически обновлена до v${result.contentVersion}.`);
          window.setTimeout(() => setContentMessage(""), 7000);
        }
      } catch {
        // Offline-first: update failure must never block the installed app.
      }
    }

    const startTimer = window.setTimeout(() => void prepareOfflineAndCheckContent(), 1200);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAppUpdate();
        void prepareOfflineAndCheckContent();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearTimeout(startTimer);
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  function applyAppUpdate() {
    const worker = waitingWorker.current;
    if (!worker) return;
    worker.postMessage({ type: "SKIP_WAITING" });
  }

  if (online && !installPrompt && !appUpdateReady && !contentMessage) return null;

  return (
    <div className="pwa-status-stack" aria-live="polite">
      {!online && (
        <div className="pwa-status-card offline">
          <div><strong>Автономный режим</strong><span>Интернет недоступен — использую сохранённое приложение, тесты и локальный прогресс.</span></div>
        </div>
      )}

      {appUpdateReady && (
        <div className="pwa-status-card update">
          <div><strong>Доступно обновление TestApp</strong><span>Новая версия уже загружена. Применение перезапустит приложение.</span></div>
          <button type="button" onClick={applyAppUpdate}>Обновить</button>
        </div>
      )}

      {installPrompt && !appUpdateReady && (
        <div className="pwa-status-card install">
          <div><strong>Установить TestApp</strong><span>После установки приложение откроется как обычная программа и сможет работать без сети.</span></div>
          <button type="button" onClick={() => void installApp()}>Установить</button>
        </div>
      )}

      {contentMessage && (
        <div className="pwa-status-card content">
          <div><strong>Тесты обновлены</strong><span>{contentMessage}</span></div>
        </div>
      )}
    </div>
  );
}
