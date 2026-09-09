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
  schemaVersion: 1;
  answers: StoredAnswer[];
}
