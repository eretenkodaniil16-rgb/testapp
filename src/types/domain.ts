export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "text"
  | "number"
  | "matching"
  | "ordering"
  | "case";

export type StudyMode = "learning" | "exam" | "mistakes" | "weak_topics";

export interface AnswerOption {
  id: string;
  label: string;
  text: string;
  correct: boolean;
  feedback?: string;
}

export interface PracticeQuestion {
  id: string;
  revisionId: string;
  subjectId: string;
  topicId: string;
  subject: string;
  topic: string;
  type: "single_choice" | "multiple_choice";
  prompt: string;
  explanation: string;
  options: AnswerOption[];
}

export interface StoredAnswer {
  questionId: string;
  revisionId: string;
  subjectId: string;
  topicId: string;
  selectedOptionIds: string[];
  correct: boolean;
  answeredAt: string;
}

export interface ProgressStore {
  schemaVersion: 2;
  answers: StoredAnswer[];
}

export interface ContentManifestPackage {
  id: string;
  subjectId: string;
  title: string;
  version: number;
  path: string;
  questionCount: number;
}

export interface ContentManifest {
  schemaVersion: 1;
  contentVersion: number;
  publishedAt: string;
  packages: ContentManifestPackage[];
}

export interface ContentTopic {
  id: string;
  title: string;
}

export interface ContentSection {
  id: string;
  title: string;
  topics: ContentTopic[];
}

export interface ContentPackage {
  schemaVersion: 1;
  id: string;
  version: number;
  subject: {
    id: string;
    title: string;
  };
  sections: ContentSection[];
  questions: PracticeQuestion[];
}

export interface ContentCatalogTopic extends ContentTopic {
  questionCount: number;
}

export interface ContentCatalogSection {
  id: string;
  title: string;
  questionCount: number;
  topics: ContentCatalogTopic[];
}

export interface ContentCatalogSubject {
  id: string;
  title: string;
  questionCount: number;
  sections: ContentCatalogSection[];
}
