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

export default function SettingsPage() {
  const [status, setStatus] = useState<string>("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [contentStatus, setContentStatus] = useState<string>("");
  const [contentBusy, setContentBusy] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<string>("");
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [storagePersistent, setStoragePersistent] = useState<boolean | null>(null);
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
    setContentStatus("Проверяю GitHub…");
    try {
      const result = await refreshContentFromRemote();
      setContentSummary({
        contentVersion: result.contentVersion,
        packageCount: result.packageCount,
        questionCount: result.questionCount,
      });
      setContentStatus(
        result.updated
          ? `База обновлена: v${result.previousVersion} → v${result.contentVersion}. Все пакеты проверены и сохранены на устройстве.`
          : `Установлена актуальная база v${result.contentVersion}.`,
      );
    } catch {
      setContentStatus("GitHub сейчас недоступен или обновление не прошло проверку. Приложение продолжит использовать последнюю целую сохранённую базу.");
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
        <p>Новая база сначала полностью скачивается и проверяется. Только после успешной проверки она заменяет установленную версию, поэтому незавершённое обновление не ломает офлайн-базу.</p>
        <label className="toggle-row">
          <input type="checkbox" checked={autoUpdates} onChange={(event) => applyAutoUpdates(event.target.checked)} />
          <span><strong>Автоматически проверять новые тесты</strong><small>По умолчанию не чаще одного раза в 6 часов при наличии интернета</small></span>
        </label>
        <div className="content-source">
          <strong>{contentSummary ? `База v${contentSummary.contentVersion} · ${contentSummary.questionCount} вопросов · ${contentSummary.packageCount} пакетов` : "Читаю версию базы…"}</strong>
          <span>{getRemoteContentSource()}</span>
          <a href="https://github.com/eretenkodaniil16-rgb/testapp/tree/content-live/public/content" target="_blank" rel="noreferrer">Открыть ветку тестов в GitHub</a>
        </div>
        <button className="button full-width" onClick={() => void checkContentUpdates()} disabled={contentBusy}>
          {contentBusy ? "Проверяю…" : "Проверить новые тесты сейчас"}
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
