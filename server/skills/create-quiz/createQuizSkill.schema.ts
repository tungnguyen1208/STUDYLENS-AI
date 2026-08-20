import { z } from "zod";

export const TranscriptSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

export const TestedConceptSchema = z.object({
  concept: z.string(),
  question: z.string().optional(),
  wasCorrect: z.boolean().optional(),
  timestamp: z.number().optional(),
});

export const CreateQuizSkillInputSchema = z.object({
  videoId: z.string().default("video_default"),
  videoTitle: z.string().default("Educational Video"),
  sourceLanguage: z.string().optional().default("auto"),
  targetLanguage: z.string().default("vi"),
  contextStart: z.number().default(0),
  contextEnd: z.number().default(600),
  transcript: z.array(TranscriptSegmentSchema).min(1, "Transcript must contain at least 1 segment"),
  previouslyTestedConcepts: z.array(z.union([z.string(), TestedConceptSchema])).optional().default([]),
  learnerWeakConcepts: z.array(z.string()).optional().default([]),
  difficulty: z.enum(["easy", "medium", "hard", "adaptive"]).default("adaptive"),
  maxQuestions: z.number().min(1).max(5).default(3),
  frequency: z.enum(["low", "balanced", "high"]).optional().default("balanced"),
  adaptiveAccuracy: z.number().min(0).max(1).optional(),
});

export const DetectedConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "definition",
    "function",
    "purpose",
    "mechanism",
    "process",
    "relationship",
    "comparison",
    "cause_effect",
    "formula",
    "rule",
    "property",
    "application",
    "example",
  ]),
  keywords: z.array(z.string()).default([]),
  summary: z.string().default(""),
  completenessScore: z.number().min(0).max(1),
  quizWorthinessScore: z.number().min(0).max(1),
  evidence: z.object({
    start: z.number(),
    end: z.number(),
    textSnippet: z.string().optional(),
  }),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  conceptId: z.string(),
  concept: z.string(),
  knowledgeType: z.string().default("definition"),
  type: z.enum(["multiple_choice", "true_false"]).default("multiple_choice"),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number(),
  explanation: z.string(),
  source: z.object({
    start: z.number(),
    end: z.number(),
    textSnippet: z.string().optional(),
  }),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  confidence: z.number().min(0).max(1).default(0.95),
});

export const CreateQuizSkillResultSchema = z.object({
  readyForQuiz: z.boolean(),
  contextScore: z.number().min(0).max(1),
  contextSummary: z.string().default(""),
  detectedConcepts: z.array(DetectedConceptSchema).default([]),
  selectedConcepts: z.array(z.string()).default([]),
  questions: z.array(QuizQuestionSchema).default([]),
  reason: z.string().optional(),
});
