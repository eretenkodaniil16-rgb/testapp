"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  getContentSummary,
  getRemoteContentSource,
  primeOfflineContent,
  refreshContentFromRemote,
} from "@/lib/content-repository";
import { exportProgressBackup, importProgressBackup } from "@/lib/local-progress";

const THEME_KEY = "testapp-theme";
const AUTO_UPDATE_KEY = "testapp-auto-content-updates";
type ThemeMode = "light" | "dark";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallWindow = Window & {
  __testAppInstallPrompt?: InstallPromptEvent;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

function isApplicationInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as StandaloneNavigator).standalone === true;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<string>("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [contentStatus, setContentStatus] = useState<string>("");
  const [contentBusy, setContentBusy] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<string>("");
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [storagePersistent, setStoragePersistent] = useState<boolean | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<string>("");
  const [contentSummary, setContentSummary] = useState<{ contentVersion: number; packageCount: number; questionCount: number } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const next: ThemeMode = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    setAutoUpdates(window.localStorage.getItem(AUTO_UPDATE_KEY) !== "0");

    getContentSummary()
      .then(setContentSummary)
      .catch(() => setContentStatus("Не удалось прочитать сведения о базе тестов."));

    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setStoragePersistent).catch(() => setStoragePersistent(null));
    }

    const syncInstallState = () => {
      const installed = isApplicationInstalled();
      setAppInstalled(installed);
      setInstallAvailable(!installed && Boolean((window as InstallWindow).__testAppInstallPrompt));
    };
    const handleInstalled = () => {
      setAppInstalled(true);
      setInstallAvailable(false);
      setInstallStatus("TestApp установлен. Теперь его можно запускать с экрана приложений как отдельную программу.");
    };

    syncInstallState();
    window.addEventListener("testapp-install-available", syncInstallState);
    window.addEventListener("testapp-installed", handleInstalled);

    return () => {
      window.removeEventListener("testapp-install-available", syncInstallState);
      window.removeEventListener("testapp-installed", handleInstalled);
    };
  }, []);

  function applyTheme(next: ThemeMode) {
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  function applyAutoUpdates(enabled: boolean) {
    window.localStorage.setItem(AUTO_UPDATE_KEY, enabled ? "1" : "0");
    setAutoUpdates(enabled);
  }

  async function installApplication() {
    if (isApplicationInstalled()) {
      setAppInstalled(true);
      setInstallStatus("TestApp уже установлен на этом устройстве.");
      return;
    }

    const installWindow = window as InstallWindow;
    const prompt = installWindow.__testAppInstallPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        delete installWindow.__testAppInstallPrompt;
        setInstallAvailable(false);
        if (choice.outcome === "accepted") {
          setAppInstalled(true);
          setInstallStatus("Установка подтверждена. TestApp появится среди приложений устройства.");
        } else {
          setInstallStatus("Установка отменена. Кнопку можно использовать повторно, когда браузер снова предложит установку.");
        }
      } catch {
        setInstallStatus("Браузер не смог запустить установку. Используй пункт «Установить приложение» или «Добавить на главный экран» в меню браузера.");
      }
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setInstallStatus("На iPhone/iPad: открой меню «Поделиться» в Safari → «На экран Домой» → «Добавить». После этого TestApp будет запускаться как отдельное приложение.");
    } else {
      setInstallStatus("Браузер пока не передал системное окно установки. Открой меню браузера и выбери «Установить приложение» или «Добавить на главный экран», затем вернись сюда.");
    }
  }

  async function prepareOfflineMode() {
    setOfflineBusy(true);
    setOfflineStatus("Сохраняю все опубликованные тесты на устройстве…");
    try {
      const result = await primeOfflineContent();
      let persistenceText = "";
      if (navigator.storage?.persist) {
        const persistent = await navigator.storage.persist().catch(() => false);
        setStoragePersistent(persistent);
        persistenceText = persistent
          ? " Браузер также разрешил постоянное локальное хранение."
          : " База сохранена локально; браузер не гарантировал постоянное хранение.";
      }
      setOfflineStatus(`Автономная база готова: v${result.contentVersion}, ${result.questionCount} вопросов, ${result.packageCount} пакетов.${persistenceText}`);
    } catch {
      setOfflineStatus("Не удалось полностью подготовить автономную базу. Подключись к интернету и повтори попытку.");
    } finally {
      setOfflineBusy(false);
    }
  }

  async function checkContentUpdates() {
    setContentBusy(true);
    setContentStatus("Выполняю полную проверку: приложение, manifest и каждый пакет тестов…");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      }

      // Manual verification intentionally bypasses the local package cache so every published package is fetched and validated again.
      const result = await refreshContentFromRemote(true);
      setContentSummary({
        contentVersion: result.contentVersion,
        packageCount: result.packageCount,
        questionCount: result.questionCount,
      });
      setContentStatus(
        result.updated
          ? `Полная проверка завершена. База обновлена: v${result.previousVersion} → v${result.contentVersion}. Проверены manifest, ${result.packageCount} пакетов и обновление приложения.`
          : `Полная проверка завершена. База v${result.contentVersion} актуальна: заново проверены manifest, все ${result.packageCount} пакетов и обновление приложения.`,
      );
    } catch {
      setContentStatus("Полная проверка не завершилась: GitHub или один из пакетов сейчас недоступен либо пакет не прошёл проверку. Старая целая база остаётся активной.");
    } finally {
      setContentBusy(false);
    }
  }

  async function downloadBackup() {
    try {
      const raw = await exportProgressBackup();
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `testapp-progress-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Резервная копия создана.");
    } catch {
      setStatus("Не удалось создать резервную копию.");
    }
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importProgressBackup(await file.text());
      setStatus("Прогресс восстановлен. Обнови страницы статистики и ошибок.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось восстановить резервную копию.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">ЛОКАЛЬНЫЕ ДАННЫЕ</p>
        <h1>Настройки</h1>
        <p>Прогресс остаётся на этом устройстве. TestApp может полностью сохранить базу заданий для работы без сети и самостоятельно получать проверенные обновления из GitHub.</p>
      </header>

      <section className="info-card">
        <h2>Тема оформления</h2>
        <p>Выбор сохраняется в браузере и применяется ко всему приложению.</p>
        <div className="theme-choice" role="group" aria-label="Тема оформления">
          <button className={`mode-option ${theme === "light" ? "active" : ""}`} onClick={() => applyTheme("light")}>
            <strong>Светлая</strong>
            <span>Светлый фон и тёмный текст</span>
          </button>
          <button className={`mode-option ${theme === "dark" ? "active" : ""}`} onClick={() => applyTheme("dark")}>
            <strong>Тёмная</strong>
            <span>Тёмный фон для вечерней работы</span>
          </button>
        </div>
      </section>

      <section className="info-card">
        <h2>Установить приложение</h2>
        <p>Скачай TestApp на устройство как PWA. После установки он появится среди приложений, откроется в отдельном окне и сможет работать автономно.</p>
        <div className="content-source">
          <strong>{appInstalled ? "TestApp уже установлен" : installAvailable ? "Приложение готово к установке" : "Установка зависит от возможностей браузера"}</strong>
          <span>Переустанавливать TestApp при добавлении новых тестов не потребуется — база обновляется отдельно.</span>
        </div>
        <button className="button full-width" type="button" onClick={() => void installApplication()} disabled={appInstalled}>
          {appInstalled ? "Приложение установлено" : "Скачать / установить TestApp"}
        </button>
        {installStatus && <p>{installStatus}</p>}
      </section>

      <section className="info-card">
        <h2>Автономная работа</h2>
        <p>Один раз сохрани всю текущую базу на устройство. После этого вопросы, ответы, статистика, ошибки и интервальные повторения доступны без подключения к интернету.</p>
        <div className="content-source">
          <strong>{storagePersistent === true ? "Постоянное локальное хранение разрешено" : storagePersistent === false ? "Используется обычное локальное хранилище браузера" : "Проверяю режим хранения…"}</strong>
          <span>Пользовательский прогресс и расписание повторений не отправляются на сервер.</span>
        </div>
        <button className="button full-width" onClick={() => void prepareOfflineMode()} disabled={offlineBusy}>
          {offlineBusy ? "Сохраняю базу…" : "Подготовить автономный режим"}
        </button>
        {offlineStatus && <p>{offlineStatus}</p>}
      </section>

      <section className="info-card">
        <h2>Обновления тестов из GitHub</h2>
        <p>Ручная проверка теперь проходит полностью: приложение проверяет manifest, заново обращается ко всем опубликованным пакетам тестов, валидирует их и одновременно проверяет обновление самого TestApp.</p>
        <label className="toggle-row">
          <input type="checkbox" checked={autoUpdates} onChange={(event) => applyAutoUpdates(event.target.checked)} />
          <span><strong>Автоматически проверять новые тесты</strong><small>Фоновая проверка остаётся экономной — не чаще одного раза в 6 часов; полная проверка запускается кнопкой ниже</small></span>
        </label>
        <div className="content-source">
          <strong>{contentSummary ? `База v${contentSummary.contentVersion} · ${contentSummary.questionCount} вопросов · ${contentSummary.packageCount} пакетов` : "Читаю версию базы…"}</strong>
          <span>{getRemoteContentSource()}</span>
          <a href="https://github.com/eretenkodaniil16-rgb/testapp/tree/content-live/public/content" target="_blank" rel="noreferrer">Открыть ветку тестов в GitHub</a>
        </div>
        <button className="button full-width" onClick={() => void checkContentUpdates()} disabled={contentBusy}>
          {contentBusy ? "Проверяю всё…" : "Проверить все тесты и обновления"}
        </button>
        {contentStatus && <p>{contentStatus}</p>}
      </section>

      <section className="info-card">
        <h2>Резервная копия прогресса</h2>
        <p>Экспортируй прогресс в файл, чтобы перенести его на другое устройство или сохранить перед очисткой браузера.</p>
        <button className="button full-width" onClick={() => void downloadBackup()}>Скачать резервную копию</button>
        <label className="button full-width" style={{ cursor: "pointer" }}>
          Восстановить из файла
          <input type="file" accept="application/json,.json" onChange={(event) => void restoreBackup(event)} hidden />
        </label>
        {status && <p>{status}</p>}
      </section>

      <section className="info-card">
        <h2>Импорт тестов</h2>
        <p>Административный импортёр читает XLSX локально, проверяет строки и формирует готовый JSON-пакет. Для каждого варианта ответа можно добавить собственное пояснение.</p>
        <Link className="button full-width" href="/admin/import">Открыть XLSX-импорт</Link>
      </section>

      <section className="info-card">
        <h2>Приватность</h2>
        <p>GitHub раздаёт только общую версионированную базу тестов и обновления самого приложения. Ответы пользователей, ошибки, статистика и интервальное расписание остаются только в IndexedDB устройства.</p>
      </section>
    </div>
  );
}
