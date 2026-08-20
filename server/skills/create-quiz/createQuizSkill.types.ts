export interface TestedConcept {
  concept: string;
  question?: string;
  wasCorrect?: boolean;
  timestamp?: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export type ConceptType =
  | "definition"
  | "function"
  | "purpose"
  | "mechanism"
  | "process"
  | "relationship"
  | "comparison"
  | "cause_effect"
  | "formula"
  | "rule"
  | "property"
  | "application"
  | "example";

export interface DetectedConcept {
  id: string;
  name: string;
  type: ConceptType;
  keywords: string[];
  summary: string;
  completenessScore: number; // 0.0 -> 1.0
  quizWorthinessScore: number; // 0.0 -> 1.0
  evidence: {
    start: number;
    end: number;
    textSnippet?: string;
  };
}

export interface QuizQuestion {
  id: string;
  conceptId: string;
  concept: string;
  knowledgeType: string;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  source: {
    start: number;
    end: number;
    textSnippet?: string;
  };
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
}

export interface CreateQuizSkillInput {
  videoId: string;
  videoTitle: string;
  sourceLanguage?: string;
  targetLanguage: string;
  contextStart: number;
  contextEnd: number;
  transcript: TranscriptSegment[];
  previouslyTestedConcepts?: (string | TestedConcept)[];
  learnerWeakConcepts?: string[];
  difficulty?: "easy" | "medium" | "hard" | "adaptive";
  maxQuestions?: number;
  frequency?: "low" | "balanced" | "high";
  adaptiveAccuracy?: number;
}

export interface CreateQuizSkillResult {
  readyForQuiz: boolean;
  contextScore: number;
  contextSummary: string;
  detectedConcepts: DetectedConcept[];
  selectedConcepts: string[];
  questions: QuizQuestion[];
  reason?: string;
}
