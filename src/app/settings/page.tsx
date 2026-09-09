"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getContentSummary } from "@/lib/content-repository";
import { exportProgressBackup, importProgressBackup } from "@/lib/local-progress";

export default function SettingsPage() {
  const [status, setStatus] = useState<string>("");
  const [contentInfo, setContentInfo] = useState({ contentVersion: 0, packageCount: 0, questionCount: 0 });

  useEffect(() => {
    void getContentSummary().then(setContentInfo);
  }, []);

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
        <p>Ответы, ошибки и статистика хранятся только в IndexedDB этого устройства. Общая база вопросов публикуется как статические версионированные пакеты.</p>
      </header>

      <section className="info-card">
        <h2>База вопросов</h2>
        <p>Версия контента: {contentInfo.contentVersion}. Пакетов: {contentInfo.packageCount}. Опубликовано вопросов: {contentInfo.questionCount}.</p>
        <p>При появлении новой версии приложение получает новый manifest и скачивает только обновлённые пакеты.</p>
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
        <h2>Приватность</h2>
        <p>Пользовательский прогресс не отправляется в GitHub или какой-либо сервер. Если удалить данные сайта в браузере без резервной копии, локальный прогресс будет потерян.</p>
      </section>
    </div>
  );
}
