import type { ContentPackage, ContentSection, PracticeQuestion } from "@/types/domain";

export type ImportSeverity = "error" | "warning";

export interface ImportIssue {
  severity: ImportSeverity;
  row?: number;
  field?: string;
  message: string;
}

export interface XlsxImportOptions {
  packageId: string;
  packageVersion: number;
  subjectId?: string;
  subjectTitle?: string;
}

export interface XlsxImportResult {
  sheetName: string;
  rowsRead: number;
  questions: PracticeQuestion[];
  contentPackage: ContentPackage | null;
  issues: ImportIssue[];
}

type NormalizedRow = Record<string, string>;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

const CYRILLIC_OPTION_MAP: Record<string, string> = {
  "А": "A",
  "Б": "B",
  "В": "C",
  "Г": "D",
  "Д": "E",
  "Е": "F",
  "Ж": "G",
  "З": "H",
};

const FIELD_ALIASES = {
  id: ["id", "question_id", "questionid", "код", "код_вопроса", "идентификатор"],
  revisionId: ["revision_id", "revisionid", "revision", "ревизия", "версия_вопроса"],
  subjectId: ["subject_id", "subjectid", "discipline_id", "дисциплина_id", "код_дисциплины"],
  subject: ["subject", "discipline", "дисциплина", "предмет"],
  sectionId: ["section_id", "sectionid", "раздел_id", "код_раздела"],
  section: ["section", "раздел"],
  topicId: ["topic_id", "topicid", "тема_id", "код_темы"],
  topic: ["topic", "тема"],
  type: ["type", "question_type", "тип", "тип_вопроса"],
  prompt: ["prompt", "question", "question_text", "вопрос", "текст_вопроса", "формулировка"],
  correct: ["correct", "correct_answer", "correct_answers", "правильный", "правильный_ответ", "правильные_ответы", "ключ"],
  explanation: ["explanation", "comment", "объяснение", "пояснение", "комментарий", "разбор"],
} as const;

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\s./\\()-]+/g, "_")
    .replace(/[^\p{L}\p{N}_]+/gu, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeRow(row: Record<string, unknown>): NormalizedRow {
  const result: NormalizedRow = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    if (normalized) result[normalized] = text(value);
  }
  return result;
}

function readField(row: NormalizedRow, aliases: readonly string[]): string {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value) return value;
  }
  return "";
}

function readOption(row: NormalizedRow, label: string): string {
  const lower = label.toLowerCase();
  return readField(row, [
    lower,
    `answer_${lower}`,
    `option_${lower}`,
    `вариант_${lower}`,
    `ответ_${lower}`,
  ]);
}

function readOptionFeedback(row: NormalizedRow, label: string): string {
  const lower = label.toLowerCase();
  return readField(row, [
    `feedback_${lower}`,
    `comment_${lower}`,
    `пояснение_${lower}`,
    `комментарий_${lower}`,
  ]);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function generatedId(prefix: string, value: string): string {
  return `${prefix}-${stableHash(value.trim().toLowerCase())}`;
}

function normalizeCorrectToken(token: string): string | null {
  const upper = token.trim().toUpperCase().replace(/[.():]/g, "");
  if (!upper) return null;
  if (CYRILLIC_OPTION_MAP[upper]) return CYRILLIC_OPTION_MAP[upper];
  if (OPTION_LABELS.includes(upper as (typeof OPTION_LABELS)[number])) return upper;
  if (/^[1-8]$/.test(upper)) return OPTION_LABELS[Number(upper) - 1];
  return null;
}

function parseCorrectAnswers(value: string): { labels: string[]; unknown: string[] } {
  const rawTokens = value.split(/[,;+|/\s]+/).filter(Boolean);
  const labels: string[] = [];
  const unknown: string[] = [];
  for (const raw of rawTokens) {
    const normalized = normalizeCorrectToken(raw);
    if (!normalized) unknown.push(raw);
    else if (!labels.includes(normalized)) labels.push(normalized);
  }
  return { labels, unknown };
}

function normalizeQuestionType(value: string, correctCount: number): { type: "single_choice" | "multiple_choice"; recognized: boolean } {
  const normalized = normalizeHeader(value);
  if (["single_choice", "single", "one", "один", "один_ответ", "одиночный"].includes(normalized)) {
    return { type: "single_choice", recognized: true };
  }
  if (["multiple_choice", "multiple", "many", "несколько", "несколько_ответов", "множественный"].includes(normalized)) {
    return { type: "multiple_choice", recognized: true };
  }
  return { type: correctCount > 1 ? "multiple_choice" : "single_choice", recognized: !value };
}

function buildRevisionId(questionId: string, rawRevision: string): string {
  if (!rawRevision) return `${questionId}-r1`;
  if (/^\d+$/.test(rawRevision)) return `${questionId}-r${rawRevision}`;
  return rawRevision;
}

export function buildContentPackageFromRows(
  rawRows: Array<Record<string, unknown>>,
  sheetName: string,
  options: XlsxImportOptions,
): XlsxImportResult {
  const issues: ImportIssue[] = [];
  const questions: PracticeQuestion[] = [];
  const seenQuestionIds = new Set<string>();
  const sectionTopics = new Map<string, { id: string; title: string; topics: Map<string, string> }>();

  const packageId = options.packageId.trim();
  const packageVersion = Number(options.packageVersion);
  if (!packageId) issues.push({ severity: "error", field: "packageId", message: "Укажи ID пакета." });
  if (!Number.isInteger(packageVersion) || packageVersion < 1) {
    issues.push({ severity: "error", field: "packageVersion", message: "Версия пакета должна быть целым числом ≥ 1." });
  }

  let packageSubjectId = options.subjectId?.trim() ?? "";
  let packageSubjectTitle = options.subjectTitle?.trim() ?? "";

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = normalizeRow(rawRow);
    if (!Object.values(row).some(Boolean)) return;

    const prompt = readField(row, FIELD_ALIASES.prompt);
    if (!prompt) {
      issues.push({ severity: "error", row: rowNumber, field: "question", message: "Нет текста вопроса." });
      return;
    }

    const rowSubjectTitle = options.subjectTitle?.trim() || readField(row, FIELD_ALIASES.subject);
    let rowSubjectId = options.subjectId?.trim() || readField(row, FIELD_ALIASES.subjectId);
    if (!rowSubjectTitle && !packageSubjectTitle) {
      issues.push({ severity: "error", row: rowNumber, field: "subject", message: "Не указана дисциплина." });
      return;
    }
    const effectiveSubjectTitle = rowSubjectTitle || packageSubjectTitle;
    if (!rowSubjectId) rowSubjectId = generatedId("subject", effectiveSubjectTitle);

    if (!packageSubjectId) packageSubjectId = rowSubjectId;
    if (!packageSubjectTitle) packageSubjectTitle = effectiveSubjectTitle;
    if (rowSubjectId !== packageSubjectId || effectiveSubjectTitle !== packageSubjectTitle) {
      issues.push({ severity: "error", row: rowNumber, field: "subject", message: "Один JSON-пакет может содержать только одну дисциплину." });
      return;
    }

    const topicTitle = readField(row, FIELD_ALIASES.topic);
    if (!topicTitle) {
      issues.push({ severity: "error", row: rowNumber, field: "topic", message: "Не указана тема." });
      return;
    }
    const topicId = readField(row, FIELD_ALIASES.topicId) || generatedId("topic", `${packageSubjectId}|${topicTitle}`);

    const sectionTitle = readField(row, FIELD_ALIASES.section) || "Общий раздел";
    const sectionId = readField(row, FIELD_ALIASES.sectionId) || generatedId("section", `${packageSubjectId}|${sectionTitle}`);
    const section = sectionTopics.get(sectionId) ?? { id: sectionId, title: sectionTitle, topics: new Map<string, string>() };
    section.topics.set(topicId, topicTitle);
    sectionTopics.set(sectionId, section);

    const correctRaw = readField(row, FIELD_ALIASES.correct);
    if (!correctRaw) {
      issues.push({ severity: "error", row: rowNumber, field: "correct", message: "Не указан правильный ответ." });
      return;
    }
    const parsedCorrect = parseCorrectAnswers(correctRaw);
    if (parsedCorrect.unknown.length > 0) {
      issues.push({ severity: "error", row: rowNumber, field: "correct", message: `Не удалось распознать ключ: ${parsedCorrect.unknown.join(", ")}. Используй A-H, А-З или 1-8.` });
      return;
    }

    const typeRaw = readField(row, FIELD_ALIASES.type);
    const normalizedType = normalizeQuestionType(typeRaw, parsedCorrect.labels.length);
    if (typeRaw && !normalizedType.recognized) {
      issues.push({ severity: "warning", row: rowNumber, field: "type", message: `Неизвестный тип «${typeRaw}». Тип определён автоматически по числу правильных ответов.` });
    }

    const answerOptions = OPTION_LABELS.map((label) => {
      const optionText = readOption(row, label);
      if (!optionText) return null;
      const feedback = readOptionFeedback(row, label);
      return {
        id: label.toLowerCase(),
        label,
        text: optionText,
        correct: parsedCorrect.labels.includes(label),
        ...(feedback ? { feedback } : {}),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    if (answerOptions.length < 2) {
      issues.push({ severity: "error", row: rowNumber, field: "options", message: "Нужно минимум два непустых варианта ответа." });
      return;
    }

    const optionLabels = new Set(answerOptions.map((item) => item.label));
    const missingCorrect = parsedCorrect.labels.filter((label) => !optionLabels.has(label));
    if (missingCorrect.length > 0) {
      issues.push({ severity: "error", row: rowNumber, field: "correct", message: `Ключ ссылается на пустой вариант: ${missingCorrect.join(", ")}.` });
      return;
    }
    if (normalizedType.type === "single_choice" && parsedCorrect.labels.length !== 1) {
      issues.push({ severity: "error", row: rowNumber, field: "correct", message: "Для single_choice должен быть ровно один правильный ответ." });
      return;
    }
    if (normalizedType.type === "multiple_choice" && parsedCorrect.labels.length === 1) {
      issues.push({ severity: "warning", row: rowNumber, field: "type", message: "Тип multiple_choice содержит только один правильный вариант." });
    }

    let questionId = readField(row, FIELD_ALIASES.id);
    if (!questionId) {
      questionId = `q-${stableHash(`${packageSubjectId}|${topicId}|${prompt}`)}`;
      issues.push({ severity: "warning", row: rowNumber, field: "id", message: `ID не указан. Сгенерирован ${questionId}; для последующих редакций лучше сохранить этот ID в исходном XLSX.` });
    }
    if (seenQuestionIds.has(questionId)) {
      issues.push({ severity: "error", row: rowNumber, field: "id", message: `Дублирующийся ID вопроса: ${questionId}.` });
      return;
    }
    seenQuestionIds.add(questionId);

    const revisionId = buildRevisionId(questionId, readField(row, FIELD_ALIASES.revisionId));
    const explanation = readField(row, FIELD_ALIASES.explanation);

    questions.push({
      id: questionId,
      revisionId,
      subjectId: packageSubjectId,
      topicId,
      subject: packageSubjectTitle,
      topic: topicTitle,
      type: normalizedType.type,
      prompt,
      explanation,
      options: answerOptions,
    });
  });

  if (questions.length === 0) {
    issues.push({ severity: "error", message: "В файле не найдено ни одного валидного вопроса." });
  }

  const sections: ContentSection[] = [...sectionTopics.values()].map((section) => ({
    id: section.id,
    title: section.title,
    topics: [...section.topics].map(([id, title]) => ({ id, title })),
  }));

  const hasPackageError = !packageId || !Number.isInteger(packageVersion) || packageVersion < 1 || !packageSubjectId || !packageSubjectTitle || questions.length === 0;
  const contentPackage: ContentPackage | null = hasPackageError ? null : {
    schemaVersion: 1,
    id: packageId,
    version: packageVersion,
    subject: { id: packageSubjectId, title: packageSubjectTitle },
    sections,
    questions,
  };

  return {
    sheetName,
    rowsRead: rawRows.length,
    questions,
    contentPackage,
    issues,
  };
}

export async function parseXlsxFile(buffer: ArrayBuffer, options: XlsxImportOptions): Promise<XlsxImportResult> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      sheetName: "",
      rowsRead: 0,
      questions: [],
      contentPackage: null,
      issues: [{ severity: "error", message: "В книге Excel нет листов." }],
    };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  return buildContentPackageFromRows(rows, sheetName, options);
}

export async function createXlsxImportTemplate(): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  const questions = [
    {
      id: "pathology.necrosis.000001",
      revision: 1,
      subject_id: "pathology",
      subject: "Патологическая анатомия",
      section_id: "cell-injury",
      section: "Повреждение клетки",
      topic_id: "necrosis",
      topic: "Некроз",
      type: "single_choice",
      question: "Пример вопроса с одним правильным ответом",
      A: "Вариант A",
      B: "Вариант B",
      C: "Вариант C",
      D: "Вариант D",
      correct: "B",
      explanation: "Краткое объяснение правильного ответа",
    },
    {
      id: "pathology.necrosis.000002",
      revision: 1,
      subject_id: "pathology",
      subject: "Патологическая анатомия",
      section_id: "cell-injury",
      section: "Повреждение клетки",
      topic_id: "necrosis",
      topic: "Некроз",
      type: "multiple_choice",
      question: "Пример вопроса с несколькими правильными ответами",
      A: "Вариант A",
      B: "Вариант B",
      C: "Вариант C",
      D: "Вариант D",
      correct: "A;C",
      explanation: "Можно указывать ключи через точку с запятой, запятую или пробел",
    },
  ];
  const instructions = [
    ["Поле", "Обязательность", "Назначение"],
    ["id", "желательно", "Стабильный ID вопроса. Если пусто, TestApp создаст ID и покажет предупреждение."],
    ["revision", "нет", "Номер редакции; по умолчанию 1."],
    ["subject / subject_id", "да", "Дисциплина и её стабильный ID."],
    ["section / section_id", "нет", "Раздел. При отсутствии используется «Общий раздел»."],
    ["topic / topic_id", "да", "Тема и её стабильный ID."],
    ["type", "нет", "single_choice или multiple_choice. Если пусто, определяется по ключу."],
    ["question", "да", "Текст вопроса."],
    ["A...H", "минимум 2", "Варианты ответа."],
    ["correct", "да", "A-H, русские А-З или 1-8; несколько ключей разделяй ; , пробелом."],
    ["explanation", "нет", "Объяснение после проверки ответа."],
    ["feedback_A...H", "нет", "Пояснение к конкретному варианту ответа."],
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(questions), "Вопросы");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(instructions), "Инструкция");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}
