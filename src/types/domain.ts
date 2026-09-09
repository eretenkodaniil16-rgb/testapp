export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "text"
  | "number"
  | "matching"
  | "ordering"
  | "case";

export type StudyMode = "learning" | "exam" | "mistakes" | "weak_topics" | "review";
export type ScientificStatus = "verified" | "legacy" | "ambiguous" | "needs_revision";

export interface ContentSource {
  id: string;
  title: string;
  url?: string;
  note?: string;
}

export interface AnswerOption {
  id: string;
  label: string;
  text: string;
  correct: boolean;
  feedback?: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  explanation?: string;
}

export interface CaseSubquestion {
  id: string;
  prompt: string;
  acceptedAnswers: string[];
  answerLabel: string;
  explanation?: string;
}

export interface PracticeQuestion {
  id: string;
  revisionId: string;
  subjectId: string;
  topicId: string;
  subject: string;
  topic: string;
  type: QuestionType;
  prompt: string;
  explanation: string;
  options: AnswerOption[];
  acceptedAnswers?: string[];
  answerLabel?: string;
  matchingPairs?: MatchingPair[];
  caseStem?: string;
  caseQuestions?: CaseSubquestion[];
  sourceQuestionNumber?: number;
  sourceKey?: string[];
  scientificStatus?: ScientificStatus;
  scientificAnswer?: string;
  scientificNote?: string;
  sources?: ContentSource[];
  verifiedAt?: string;
}

export interface StoredAnswer {
  questionId: string;
  revisionId: string;
  subjectId: string;
  topicId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
  matchingAnswer?: Record<string, string>;
  caseAnswers?: Record<string, string>;
  correct: boolean;
  answeredAt: string;
  mode?: StudyMode;
}

export interface ReviewItem {
  questionId: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: string;
}

export interface ProgressStore {
  schemaVersion: 2 | 3;
  answers: StoredAnswer[];
  reviews?: ReviewItem[];
}

export interface TopicPerformance {
  subjectId: string;
  topicId: string;
  total: number;
  correct: number;
  accuracy: number;
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
