import { demoQuestions } from "@/lib/demo-data";
import type {
  ContentCatalogSection,
  ContentCatalogSubject,
  ContentManifest,
  ContentManifestPackage,
  ContentPackage,
  PracticeQuestion,
} from "@/types/domain";

const DB_NAME = "testapp-content";
const DB_VERSION = 1;
const MANIFEST_STORE = "manifest";
const PACKAGE_STORE = "packages";
const MANIFEST_KEY = "current";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const REMOTE_CONTENT_BASE = (process.env.NEXT_PUBLIC_CONTENT_BASE_URL ?? "https://raw.githubusercontent.com/eretenkodaniil16-rgb/testapp/content-live/public").replace(/\/$/, "");
const REMOTE_MANIFEST_URL = `${REMOTE_CONTENT_BASE}/content/manifest.json`;

const FALLBACK_MANIFEST: ContentManifest = {
  schemaVersion: 1,
  contentVersion: 0,
  publishedAt: "embedded-fallback",
  packages: [
    { id: "pathology-core", subjectId: "pathology", title: "Патологическая анатомия", version: 0, path: "", questionCount: 2 },
    { id: "physiology-core", subjectId: "physiology", title: "Физиология", version: 0, path: "", questionCount: 1 },
    { id: "histology-core", subjectId: "histology", title: "Гистология", version: 0, path: "", questionCount: 1 },
  ],
};

function withBasePath(path: string): string {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

function remotePath(path: string): string {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${REMOTE_CONTENT_BASE}${normalized}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) db.createObjectStore(MANIFEST_STORE);
      if (!db.objectStoreNames.contains(PACKAGE_STORE)) db.createObjectStore(PACKAGE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readRecord<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function writeRecord(storeName: string, key: IDBValidKey, value: unknown): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function fetchJson<T>(path: string, cacheBust = false): Promise<T> {
  const baseUrl = withBasePath(path);
  const url = cacheBust
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}testapp_refresh=${Date.now()}`
    : baseUrl;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function validateManifest(value: ContentManifest): ContentManifest {
  if (value.schemaVersion !== 1 || !Number.isInteger(value.contentVersion) || !Array.isArray(value.packages)) {
    throw new Error("Unsupported TestApp content manifest");
  }
  return value;
}

function normalizeRemoteManifest(value: ContentManifest): ContentManifest {
  return {
    ...value,
    packages: value.packages.map((entry) => ({
      ...entry,
      path: remotePath(entry.path),
    })),
  };
}

async function fetchRemoteManifest(cacheBust = false): Promise<ContentManifest> {
  return normalizeRemoteManifest(validateManifest(await fetchJson<ContentManifest>(REMOTE_MANIFEST_URL, cacheBust)));
}

async function fetchBundledManifest(): Promise<ContentManifest> {
  return validateManifest(await fetchJson<ContentManifest>("/content/manifest.json"));
}

function validatePackage(value: ContentPackage, entry: ContentManifestPackage): ContentPackage {
  if (
    value.schemaVersion !== 1 ||
    value.id !== entry.id ||
    value.version !== entry.version ||
    !Array.isArray(value.questions)
  ) {
    throw new Error(`Invalid content package: ${entry.id}`);
  }
  return value;
}

function fallbackPackage(entry: ContentManifestPackage): ContentPackage {
  const questions = demoQuestions.filter((question) => question.subjectId === entry.subjectId);
  const subjectTitle = questions[0]?.subject ?? entry.title;
  const topics = new Map<string, string>();
  for (const question of questions) topics.set(question.topicId, question.topic);
  return {
    schemaVersion: 1,
    id: entry.id,
    version: entry.version,
    subject: { id: entry.subjectId, title: subjectTitle },
    sections: [
      {
        id: `${entry.subjectId}-fallback`,
        title: subjectTitle,
        topics: [...topics].map(([id, title]) => ({ id, title })),
      },
    ],
    questions,
  };
}

export async function getContentManifest(): Promise<ContentManifest> {
  try {
    const cached = await readRecord<ContentManifest>(MANIFEST_STORE, MANIFEST_KEY);
    if (cached) return validateManifest(cached);
  } catch {
    // Continue to the bundled manifest.
  }

  try {
    const bundled = await fetchBundledManifest();
    await writeRecord(MANIFEST_STORE, MANIFEST_KEY, bundled);
    return bundled;
  } catch {
    try {
      const remote = await fetchRemoteManifest();
      await writeRecord(MANIFEST_STORE, MANIFEST_KEY, remote);
      return remote;
    } catch {
      return FALLBACK_MANIFEST;
    }
  }
}

export async function getContentPackage(entry: ContentManifestPackage): Promise<ContentPackage> {
  const cacheKey = `${entry.id}@${entry.version}`;
  try {
    const cached = await readRecord<ContentPackage>(PACKAGE_STORE, cacheKey);
    if (cached) return validatePackage(cached, entry);
  } catch {
    // A failed local cache read must not prevent loading bundled or remote content.
  }

  if (entry.path) {
    try {
      const contentPackage = validatePackage(await fetchJson<ContentPackage>(entry.path), entry);
      await writeRecord(PACKAGE_STORE, cacheKey, contentPackage);
      return contentPackage;
    } catch {
      // Embedded starter questions keep the app usable if both cache and package source are unavailable.
    }
  }

  return fallbackPackage(entry);
}

async function getAllContentPackages(): Promise<ContentPackage[]> {
  const manifest = await getContentManifest();
  return Promise.all(manifest.packages.map((entry) => getContentPackage(entry)));
}

export async function primeOfflineContent(): Promise<{
  contentVersion: number;
  packageCount: number;
  questionCount: number;
}> {
  const manifest = await getContentManifest();
  const packages = await Promise.all(manifest.packages.map((entry) => getContentPackage(entry)));
  return {
    contentVersion: manifest.contentVersion,
    packageCount: packages.length,
    questionCount: packages.reduce((sum, item) => sum + item.questions.length, 0),
  };
}

export async function refreshContentFromRemote(): Promise<{
  previousVersion: number;
  contentVersion: number;
  packageCount: number;
  questionCount: number;
  updated: boolean;
}> {
  const currentManifest = await getContentManifest();
  const previousVersion = currentManifest.contentVersion;
  const manifest = await fetchRemoteManifest(true);

  if (manifest.contentVersion < previousVersion) {
    throw new Error(`Remote content v${manifest.contentVersion} is older than installed v${previousVersion}`);
  }

  const downloaded: Array<{ key: string; value: ContentPackage }> = [];
  for (const entry of manifest.packages) {
    const cacheKey = `${entry.id}@${entry.version}`;
    let contentPackage: ContentPackage | null = null;
    try {
      const cached = await readRecord<ContentPackage>(PACKAGE_STORE, cacheKey);
      if (cached) contentPackage = validatePackage(cached, entry);
    } catch {
      contentPackage = null;
    }

    if (!contentPackage) {
      contentPackage = validatePackage(await fetchJson<ContentPackage>(entry.path, true), entry);
    }
    downloaded.push({ key: cacheKey, value: contentPackage });
  }

  // Commit only after every package has been validated. A partial download never replaces the installed manifest.
  for (const item of downloaded) await writeRecord(PACKAGE_STORE, item.key, item.value);
  await writeRecord(MANIFEST_STORE, MANIFEST_KEY, manifest);

  return {
    previousVersion,
    contentVersion: manifest.contentVersion,
    packageCount: manifest.packages.length,
    questionCount: manifest.packages.reduce((sum, entry) => sum + entry.questionCount, 0),
    updated: manifest.contentVersion > previousVersion,
  };
}

export function getRemoteContentSource(): string {
  return REMOTE_MANIFEST_URL;
}

export async function getAllQuestions(): Promise<PracticeQuestion[]> {
  const packages = await getAllContentPackages();
  return packages.flatMap((contentPackage) => contentPackage.questions);
}

export async function getContentSubjects(): Promise<Array<{ id: string; title: string; questionCount: number }>> {
  const manifest = await getContentManifest();
  const subjects = new Map<string, { id: string; title: string; questionCount: number }>();
  for (const entry of manifest.packages) {
    const current = subjects.get(entry.subjectId) ?? { id: entry.subjectId, title: entry.title, questionCount: 0 };
    current.questionCount += entry.questionCount;
    subjects.set(entry.subjectId, current);
  }
  return [...subjects.values()];
}

export async function getContentCatalogTree(): Promise<ContentCatalogSubject[]> {
  const packages = await getAllContentPackages();
  const subjects = new Map<string, {
    id: string;
    title: string;
    sections: Map<string, {
      id: string;
      title: string;
      topics: Map<string, { id: string; title: string }>;
    }>;
    questions: PracticeQuestion[];
  }>();

  for (const contentPackage of packages) {
    const current = subjects.get(contentPackage.subject.id) ?? {
      id: contentPackage.subject.id,
      title: contentPackage.subject.title,
      sections: new Map<string, { id: string; title: string; topics: Map<string, { id: string; title: string }> }>(),
      questions: [] as PracticeQuestion[],
    };
    current.questions.push(...contentPackage.questions);

    for (const section of contentPackage.sections) {
      const sectionEntry = current.sections.get(section.id) ?? {
        id: section.id,
        title: section.title,
        topics: new Map<string, { id: string; title: string }>(),
      };
      for (const topic of section.topics) sectionEntry.topics.set(topic.id, topic);
      current.sections.set(section.id, sectionEntry);
    }
    subjects.set(contentPackage.subject.id, current);
  }

  return [...subjects.values()].map((subject): ContentCatalogSubject => {
    const topicCounts = new Map<string, number>();
    for (const question of subject.questions) {
      topicCounts.set(question.topicId, (topicCounts.get(question.topicId) ?? 0) + 1);
    }

    const sections: ContentCatalogSection[] = [...subject.sections.values()].map((section) => {
      const topics = [...section.topics.values()].map((topic) => ({
        ...topic,
        questionCount: topicCounts.get(topic.id) ?? 0,
      }));
      return {
        id: section.id,
        title: section.title,
        questionCount: topics.reduce((sum, topic) => sum + topic.questionCount, 0),
        topics,
      };
    });

    return {
      id: subject.id,
      title: subject.title,
      questionCount: subject.questions.length,
      sections,
    };
  });
}

export async function getContentSummary(): Promise<{ contentVersion: number; packageCount: number; questionCount: number }> {
  const manifest = await getContentManifest();
  return {
    contentVersion: manifest.contentVersion,
    packageCount: manifest.packages.length,
    questionCount: manifest.packages.reduce((sum, entry) => sum + entry.questionCount, 0),
  };
}
