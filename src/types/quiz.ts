import { TranscriptSegment } from "./transcript.ts";
import { ThemeMode } from "./video.ts";

export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type DifficultyLevel = "easy" | "medium" | "hard" | "adaptive";
export type CheckpointFrequency = "low" | "balanced" | "high";

export type ConceptType =
  | "definition"
  | "function"
  | "mechanism"
  | "process"
  | "relationship"
  | "comparison"
  | "formula"
  | "rule"
  | "example"
  | "cause_effect";

export interface DetectedConcept {
  id: string;
  name: string;
  aliases?: string[];
  type: ConceptType;
  keywords: string[];
  firstSeenAt: number;
  lastSeenAt: number;
  evidence?: {
    start: number;
    end: number;
    textSnippet?: string;
  };
  completenessScore: number; // 0.0 - 1.0
  quizWorthinessScore: number; // 0.0 - 1.0
  summary?: string;
}

export interface ConceptRelation {
  fromConcept: string;
  relation:
    | "affects"
    | "causes"
    | "part_of"
    | "contrasts_with"
    | "requires"
    | "used_for";
  toConcept: string;
}

export interface LearnedConcept {
  videoId: string;
  conceptId: string;
  name: string;
  firstSeenAt: number;
  checkpointAt: number;
  questionsAsked: string[];
  correctCount: number;
  incorrectCount: number;
  masteryScore: number; // 0.0 - 1.0 (Weak < 0.4, Learning 0.4-0.7, Good 0.7-0.9, Mastered > 0.9)
}

export interface ContextEvaluation {
  sufficient: boolean;
  score: number; // 0.0 - 1.0
  topicBoundaryDetected: boolean;
  concepts: DetectedConcept[];
  primaryConcept?: string;
  reasons: string[];
  suggestedQuestionTypes: string[];
}

export interface LearningContextBuffer {
  videoId: string;
  startTime: number;
  endTime: number;
  transcript: TranscriptSegment[];
  detectedConcepts: DetectedConcept[];
  contextScore: number;
  readyForQuiz: boolean;
  lastAnalyzedTime?: number;
}

export interface QuestionSource {
  start: number; // in seconds
  end: number;   // in seconds
  textSnippet?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple_choice & true_false
  correctAnswer: number | string | boolean;
  explanation: string;
  source: QuestionSource;
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
  conceptName?: string;
  conceptType?: ConceptType;
}

export interface QuizSubmission {
  questionId: string;
  selectedAnswer: number | string | boolean;
  isCorrect: boolean;
  reviewTimestamp: number;
  explanation: string;
  feedback?: string;
}

export interface QuizResult {
  id: string;
  videoId: string;
  segmentId: string;
  segmentStart: number;
  segmentEnd: number;
  conceptName?: string;
  questions: Question[];
  submissions: Record<string, QuizSubmission>;
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
}

export interface StudySegment {
  id: string;
  index: number;
  videoId: string;
  title?: string;
  conceptName?: string;
  conceptType?: ConceptType;
  startTime: number;      // e.g. 0
  endTime: number;        // e.g. 210
  watchedSeconds: number; // genuine active watch seconds
  completed: boolean;
  quizGenerated: boolean;
  quizPassed: boolean;
  quizScore?: number;
  quizTotal?: number;
  needsReview?: boolean;
}

export interface ReviewItem {
  id: string;
  videoId: string;
  videoTitle: string;
  topic: string;
  conceptId?: string;
  timestamp: number;      // seek target seconds
  timestampEnd?: number;
  mistakes: number;
  snippet?: string;
  questionSummary?: string;
  lastAttemptAt: string;
  mastered: boolean;
  status?: "pending" | "reviewed" | "mastered";
}

export interface LearningStats {
  videosStudied: number;
  totalStudySeconds: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracyRate: number; // 0 - 100
  streakDays: number;
  xp: number;
  lastStudyDate: string;
  topicsNeedingReviewCount: number;
  masteredConceptsCount?: number;
}

export interface UserSettings {
  theme: ThemeMode;
  language?: string;           // 'en' | 'vi' | 'ja' | 'es' | 'fr' | 'zh' | 'de' | 'ko'
  checkpointFrequency: CheckpointFrequency; // 'low' | 'balanced' | 'high'
  quizIntervalMinutes?: number; // legacy fallback
  questionsPerQuiz: number;     // 1, 2, 3
  difficulty: DifficultyLevel; // 'easy' | 'medium' | 'hard' | 'adaptive'
  autoPauseOnQuiz: boolean;
  learningMode: boolean;       // Require timestamp review before revealing answers
  soundEffects: boolean;
  apiBaseUrl: string;
  demoMode: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  language: "vi",
  checkpointFrequency: "balanced",
  quizIntervalMinutes: 10,
  questionsPerQuiz: 3,
  difficulty: "adaptive",
  autoPauseOnQuiz: true,
  learningMode: true,
  soundEffects: true,
  apiBaseUrl: "",
  demoMode: false,
};

export interface LearningSession {
  videoId: string;
  url: string;
  title: string;
  channel?: string;
  duration: number;
  transcriptCached: boolean;
  lastPosition: number;
  totalStudySeconds: number;
  segments: StudySegment[];
  quizzes: QuizResult[];
  learnedConcepts?: LearnedConcept[];
  createdAt: string;
  updatedAt: string;
}
