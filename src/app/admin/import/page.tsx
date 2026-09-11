"use client";

import { useMemo, useState } from "react";
import {
  createXlsxImportTemplate,
  parseXlsxFile,
  type XlsxImportResult,
} from "@/lib/xlsx-import";
import styles from "./page.module.css";

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function XlsxImportPage() {
  const [packageId, setPackageId] = useState("pathology-import");
  const [packageVersion, setPackageVersion] = useState(1);
  const [subjectId, setSubjectId] = useState("");
  const [subjectTitle, setSubjectTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<XlsxImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [fatalError, setFatalError] = useState("");

  const errors = useMemo(() => result?.issues.filter((issue) => issue.severity === "error") ?? [], [result]);
  const warnings = useMemo(() => result?.issues.filter((issue) => issue.severity === "warning") ?? [], [result]);

  async function analyze(selectedFile = file) {
    if (!selectedFile) return;
    setBusy(true);
    setFatalError("");
    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = await parseXlsxFile(buffer, {
        packageId,
        packageVersion,
        subjectId: subjectId || undefined,
        subjectTitle: subjectTitle || undefined,
      });
      setResult(parsed);
    } catch (error) {
      setResult(null);
      setFatalError(error instanceof Error ? error.message : "Не удалось прочитать XLSX-файл.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    setBusy(true);
    setFatalError("");
    try {
      const buffer = await createXlsxImportTemplate();
      saveBlob(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "testapp-import-template.xlsx",
      );
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : "Не удалось создать шаблон.");
    } finally {
      setBusy(false);
    }
  }

  function downloadPackage() {
    if (!result?.contentPackage || errors.length > 0) return;
    const pkg = result.contentPackage;
    const raw = JSON.stringify(pkg, null, 2);
    saveBlob(new Blob([raw], { type: "application/json" }), `${pkg.id}.v${pkg.version}.json`);
  }

  function downloadManifestEntry() {
    if (!result?.contentPackage || errors.length > 0) return;
    const pkg = result.contentPackage;
    const entry = {
      id: pkg.id,
      subjectId: pkg.subject.id,
      title: pkg.subject.title,
      version: pkg.version,
      path: `/content/packages/${pkg.id}.v${pkg.version}.json`,
      questionCount: pkg.questions.length,
    };
    saveBlob(new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" }), `${pkg.id}.manifest-entry.json`);
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="eyebrow">ЛОКАЛЬНЫЙ ИМПОРТ</p>
        <h1>XLSX → TestApp</h1>
        <p>
          Файл читается прямо в браузере и никуда не загружается. После проверки можно скачать готовый versioned JSON-пакет для публикации в GitHub.
        </p>
      </header>

      <section className={styles.grid}>
        <div className="info-card">
          <h2>1. Параметры пакета</h2>
          <label className={styles.field}>
            <span>ID пакета</span>
            <input value={packageId} onChange={(event) => setPackageId(event.target.value)} placeholder="pathology-core" />
          </label>
          <label className={styles.field}>
            <span>Версия пакета</span>
            <input type="number" min={1} value={packageVersion} onChange={(event) => setPackageVersion(Number(event.target.value))} />
          </label>
          <label className={styles.field}>
            <span>ID дисциплины — необязательно</span>
            <input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="pathology" />
          </label>
          <label className={styles.field}>
            <span>Название дисциплины — необязательно</span>
            <input value={subjectTitle} onChange={(event) => setSubjectTitle(event.target.value)} placeholder="Патологическая анатомия" />
          </label>
          <p className={styles.hint}>Если дисциплина не задана здесь, импортёр возьмёт её из таблицы.</p>
        </div>

        <div className="info-card">
          <h2>2. XLSX-файл</h2>
          <button className="button full-width" onClick={() => void downloadTemplate()} disabled={busy}>
            Скачать шаблон XLSX
          </button>
          <label className={styles.filePicker}>
            <span>{file ? file.name : "Выбрать XLSX-файл"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setResult(null);
                if (selected) void analyze(selected);
              }}
              hidden
            />
          </label>
          {file && (
            <button className="button full-width" onClick={() => void analyze()} disabled={busy}>
              {busy ? "Проверяю…" : "Проверить заново"}
            </button>
          )}
          <p className={styles.hint}>Используется первый лист книги. В шаблоне он называется «Вопросы».</p>
        </div>
      </section>

      {fatalError && <section className={styles.fatal}>{fatalError}</section>}

      {result && (
        <>
          <section className="info-card">
            <div className={styles.summaryHeader}>
              <div>
                <h2>Результат проверки</h2>
                <p>Лист: {result.sheetName || "—"} · строк: {result.rowsRead} · валидных вопросов: {result.questions.length}</p>
              </div>
              <div className={styles.badges}>
                <span className={errors.length ? styles.badgeError : styles.badgeOk}>Ошибок: {errors.length}</span>
                <span className={warnings.length ? styles.badgeWarning : styles.badgeOk}>Предупреждений: {warnings.length}</span>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className={styles.issueList}>
                {result.issues.slice(0, 100).map((issue, index) => (
                  <div className={issue.severity === "error" ? styles.issueError : styles.issueWarning} key={`${issue.row ?? 0}-${issue.field ?? ""}-${index}`}>
                    <strong>{issue.severity === "error" ? "Ошибка" : "Предупреждение"}</strong>
                    <span>{issue.row ? `Строка ${issue.row}. ` : ""}{issue.field ? `[${issue.field}] ` : ""}{issue.message}</span>
                  </div>
                ))}
                {result.issues.length > 100 && <p>Показаны первые 100 замечаний из {result.issues.length}.</p>}
              </div>
            )}
          </section>

          <section className="info-card">
            <h2>Предпросмотр</h2>
            {result.questions.length === 0 ? (
              <p>Нет вопросов для предпросмотра.</p>
            ) : (
              <div className={styles.previewList}>
                {result.questions.slice(0, 12).map((question, index) => (
                  <article className={styles.previewCard} key={question.id}>
                    <p className={styles.previewMeta}>{index + 1}. {question.topic} · {question.type}</p>
                    <h3>{question.prompt}</h3>
                    <ul>
                      {question.options.map((option) => (
                        <li key={option.id}><strong>{option.label}.</strong> {option.text}{option.correct ? " ✓" : ""}</li>
                      ))}
                    </ul>
                    <small>{question.id} · {question.revisionId}</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="info-card">
            <h2>3. Сформировать пакет</h2>
            {errors.length > 0 || !result.contentPackage ? (
              <p>Скачивание заблокировано, пока есть ошибки. Предупреждения публикации не мешают.</p>
            ) : (
              <>
                <p>
                  Пакет готов: <strong>{result.contentPackage.id}.v{result.contentPackage.version}.json</strong>, {result.contentPackage.questions.length} вопросов.
                </p>
                <button className="button full-width" onClick={downloadPackage}>Скачать JSON-пакет</button>
                <button className="button full-width" onClick={downloadManifestEntry}>Скачать запись для manifest</button>
              </>
            )}
          </section>
        </>
      )}

      <section className="info-card">
        <h2>Поддерживаемые столбцы</h2>
        <p>
          Основные: <code>id</code>, <code>revision</code>, <code>subject_id</code>, <code>subject</code>, <code>section</code>, <code>topic</code>, <code>type</code>, <code>question</code>, <code>A…H</code>, <code>correct</code>, <code>explanation</code>. Русские названия вроде «вопрос», «дисциплина», «тема», «правильный ответ» тоже распознаются.
        </p>
      </section>
    </div>
  );
}
