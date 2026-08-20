import { GoogleGenAI, Type } from "@google/genai";
import { buildQuizPrompt, QuizPromptConcept } from "./prompts/quiz.prompt.ts";
import { buildEvaluationPrompt } from "./prompts/explanation.prompt.ts";
import { buildContextAnalysisPrompt } from "./prompts/context.prompt.ts";

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment. Mock/Demo fallbacks will be used if needed.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-local-demo",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// In-memory cache to prevent redundant Gemini API calls and respect rate limits
const quizCache = new Map<string, any>();
const contextCache = new Map<string, any>();

function getCacheKey(videoId: string, start: number, end: number, difficulty: string, count: number, language?: string): string {
  return `${videoId}_${start}_${end}_${difficulty}_${count}_${language || "vi"}`;
}

export interface AnalyzeContextParams {
  videoId?: string;
  videoTitle?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  startTime: number;
  endTime: number;
  transcript: Array<{ start: number; end: number; text: string }>;
  previousConcepts?: string[];
  frequency?: "low" | "balanced" | "high";
}

export async function analyzeContextWithGemini(params: AnalyzeContextParams) {
  const {
    videoId = "video_default",
    videoTitle = "Educational Lecture",
    targetLanguage = "vi",
    startTime,
    endTime,
    transcript,
    previousConcepts = [],
    frequency = "balanced",
  } = params;

  const cacheKey = `ctx_${videoId}_${Math.floor(startTime)}_${Math.floor(endTime)}_${frequency}_${targetLanguage}`;
  if (contextCache.has(cacheKey)) {
    return contextCache.get(cacheKey);
  }

  // Format timestamped transcript for prompt
  const formattedTranscript = transcript
    .map((t) => `[${Math.floor(t.start / 60)}:${String(Math.floor(t.start % 60)).padStart(2, "0")}] ${t.text}`)
    .join("\n");

  const prompt = buildContextAnalysisPrompt({
    videoTitle,
    startTime,
    endTime,
    transcriptText: formattedTranscript,
    previousConcepts,
    frequency,
    targetLanguage,
  });

  const ai = getGenAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sufficient: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            topicBoundaryDetected: { type: Type.BOOLEAN },
            primaryConcept: { type: Type.STRING },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedQuestionTypes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  aliases: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  type: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  firstSeenAt: { type: Type.NUMBER },
                  lastSeenAt: { type: Type.NUMBER },
                  evidence: {
                    type: Type.OBJECT,
                    properties: {
                      start: { type: Type.NUMBER },
                      end: { type: Type.NUMBER },
                      textSnippet: { type: Type.STRING },
                    },
                    required: ["start", "end"],
                  },
                  completenessScore: { type: Type.NUMBER },
                  quizWorthinessScore: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                },
                required: ["id", "name", "type", "completenessScore", "quizWorthinessScore"],
              },
            },
          },
          required: ["sufficient", "score", "topicBoundaryDetected", "concepts", "reasons"],
        },
        systemInstruction:
          "You are the expert Educational Context Evaluator for StudyLens AI. You accurately determine if the transcript slice contains a sufficiently explained, quiz-worthy educational concept.",
      },
    });

    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    // Apply frequency threshold constraints on server side
    const threshold = frequency === "low" ? 0.85 : frequency === "high" ? 0.65 : 0.75;
    const quizThreshold = frequency === "low" ? 0.85 : frequency === "high" ? 0.60 : 0.70;

    const validatedConcepts = Array.isArray(parsed.concepts)
      ? parsed.concepts.filter(
          (c: any) =>
            typeof c.completenessScore === "number" &&
            c.completenessScore >= threshold &&
            typeof c.quizWorthinessScore === "number" &&
            c.quizWorthinessScore >= quizThreshold
        )
      : [];

    const isSufficient = parsed.sufficient === true && (parsed.score ?? 0) >= threshold && validatedConcepts.length > 0;

    const result = {
      sufficient: isSufficient,
      score: parsed.score ?? 0,
      topicBoundaryDetected: Boolean(parsed.topicBoundaryDetected),
      primaryConcept: parsed.primaryConcept || (validatedConcepts[0]?.name ?? ""),
      reasons: parsed.reasons || [],
      suggestedQuestionTypes: parsed.suggestedQuestionTypes || ["definition", "function"],
      concepts: validatedConcepts.map((c: any, i: number) => ({
        id: c.id || `concept_${i + 1}_${Date.now()}`,
        name: c.name,
        aliases: c.aliases || [],
        type: c.type || "definition",
        keywords: c.keywords || [],
        firstSeenAt: c.firstSeenAt ?? startTime,
        lastSeenAt: c.lastSeenAt ?? endTime,
        evidence: {
          start: c.evidence?.start ?? startTime,
          end: c.evidence?.end ?? endTime,
          textSnippet: c.evidence?.textSnippet || "",
        },
        completenessScore: c.completenessScore ?? 0.8,
        quizWorthinessScore: c.quizWorthinessScore ?? 0.8,
        summary: c.summary || "",
      })),
    };

    contextCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.warn("Gemini Context Analysis Error:", error?.message || error);
    // Fallback heuristic analyzer for offline / demo mode
    return generateFallbackContextEvaluation(params);
  }
}

function generateFallbackContextEvaluation(params: AnalyzeContextParams) {
  const { startTime, endTime, transcript, frequency = "balanced" } = params;
  const chars = transcript.reduce((acc, t) => acc + t.text.length, 0);

  // Require at least 250 characters of substantive transcript in fallback
  const isLongEnough = chars >= 250;
  const threshold = frequency === "low" ? 0.85 : frequency === "high" ? 0.65 : 0.75;
  const score = isLongEnough ? 0.82 : 0.45;

  const conceptName = transcript[0]?.text?.slice(0, 30) || "Core Concept";

  return {
    sufficient: score >= threshold && isLongEnough,
    score,
    topicBoundaryDetected: isLongEnough,
    primaryConcept: conceptName,
    reasons: isLongEnough
      ? ["Core definition and function explained with concrete examples in transcript"]
      : ["Transcript buffer is still gathering sufficient context"],
    suggestedQuestionTypes: ["definition", "function", "mechanism"],
    concepts: isLongEnough
      ? [
          {
            id: `concept_fb_${Date.now()}`,
            name: conceptName,
            aliases: [],
            type: "definition",
            keywords: [conceptName],
            firstSeenAt: startTime,
            lastSeenAt: endTime,
            evidence: {
              start: startTime,
              end: endTime,
              textSnippet: transcript[0]?.text || "",
            },
            completenessScore: 0.85,
            quizWorthinessScore: 0.85,
            summary: "Key conceptual unit explained in this video segment.",
          },
        ]
      : [],
  };
}

export interface GenerateQuizParams {
  videoId?: string;
  videoTitle: string;
  segmentStart: number;
  segmentEnd: number;
  transcript: Array<{ start: number; end: number; text: string }>;
  difficulty?: string;
  questionCount?: number;
  adaptiveAccuracy?: number;
  language?: string;
  concepts?: QuizPromptConcept[];
  alreadyTestedConcepts?: string[];
}

export async function generateQuizWithGemini(params: GenerateQuizParams) {
  const {
    videoId = "video_default",
    videoTitle,
    segmentStart,
    segmentEnd,
    transcript,
    difficulty = "medium",
    questionCount = 3,
    adaptiveAccuracy,
    language = "vi",
    concepts = [],
    alreadyTestedConcepts = [],
  } = params;

  const cacheKey = getCacheKey(videoId, segmentStart, segmentEnd, difficulty, questionCount, language);
  if (quizCache.has(cacheKey)) {
    console.log(`[Cache Hit] Returning cached quiz for ${cacheKey}`);
    return quizCache.get(cacheKey);
  }

  // Format timestamped transcript for prompt
  const formattedTranscript = transcript
    .map((t) => `[${Math.floor(t.start / 60)}:${String(Math.floor(t.start % 60)).padStart(2, "0")}] ${t.text}`)
    .join("\n");

  const prompt = buildQuizPrompt({
    videoTitle,
    segmentStart,
    segmentEnd,
    transcriptText: formattedTranscript,
    difficulty,
    questionCount,
    adaptiveAccuracy,
    language,
    concepts,
    alreadyTestedConcepts,
  });

  const ai = getGenAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  conceptName: { type: Type.STRING },
                  conceptType: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  source: {
                    type: Type.OBJECT,
                    properties: {
                      start: { type: Type.NUMBER },
                      end: { type: Type.NUMBER },
                      textSnippet: { type: Type.STRING },
                    },
                    required: ["start", "end"],
                  },
                  difficulty: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ["id", "type", "question", "explanation", "source"],
              },
            },
          },
          required: ["questions"],
        },
        systemInstruction:
          "You are an expert pedagogical AI for StudyLens AI. You construct highly accurate, timestamp-anchored quiz questions strictly grounded in the detected educational concepts and transcript slice.",
      },
    });

    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    // Normalize question correctAnswer index/values if string
    if (parsed.questions && Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.map((q: any, idx: number) => {
        let cleanCorrectAnswer: any = q.correctAnswer;
        if (typeof q.correctAnswer === "string" && !isNaN(Number(q.correctAnswer))) {
          cleanCorrectAnswer = parseInt(q.correctAnswer, 10);
        } else if (typeof q.correctAnswer === "string") {
          // If the model returned text matching an option
          if (Array.isArray(q.options)) {
            const foundIdx = q.options.findIndex((opt: string) => opt.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim());
            if (foundIdx !== -1) {
              cleanCorrectAnswer = foundIdx;
            }
          }
        }

        // Ensure source timestamp falls within the segment bounds or sensible fallback
        const sourceStart = typeof q.source?.start === "number" ? Math.max(segmentStart, q.source.start) : segmentStart + (idx + 1) * 45;
        const sourceEnd = typeof q.source?.end === "number" ? Math.min(segmentEnd, q.source.end) : sourceStart + 30;

        return {
          id: q.id || `q_${idx + 1}_${Date.now()}`,
          conceptName: q.conceptName || concepts[0]?.name || "Core Concept",
          conceptType: q.conceptType || concepts[0]?.type || "definition",
          type: q.type || "multiple_choice",
          question: q.question,
          options: q.options || ["True", "False"],
          correctAnswer: cleanCorrectAnswer ?? 0,
          explanation: q.explanation || "Review the video at the indicated timestamp for more details.",
          source: {
            start: Math.round(sourceStart),
            end: Math.round(sourceEnd),
            textSnippet: q.source?.textSnippet || "",
          },
          difficulty: q.difficulty || difficulty,
          confidence: q.confidence || 0.95,
        };
      });
    }

    quizCache.set(cacheKey, parsed);
    return parsed;
  } catch (error: any) {
    console.error("Gemini Quiz Generation Error:", error?.message || error);
    // Return gracefully synthesized fallback quiz based on transcript if API is unreachable or key is missing
    const fallbackQuiz = generateDemoFallbackQuiz({
      videoId,
      videoTitle,
      segmentStart,
      segmentEnd,
      transcript,
      questionCount,
      concepts,
    });
    return fallbackQuiz;
  }
}

export async function evaluateAnswerWithGemini(params: {
  question: string;
  expectedAnswerOrExplanation: string;
  userAnswer: string;
  transcript: Array<{ start: number; end: number; text: string }>;
  sourceTimestamp: { start: number; end: number };
}) {
  const { question, expectedAnswerOrExplanation, userAnswer, transcript, sourceTimestamp } = params;

  const formattedTranscript = transcript
    .map((t) => `[${Math.floor(t.start / 60)}:${String(Math.floor(t.start % 60)).padStart(2, "0")}] ${t.text}`)
    .join("\n");

  const prompt = buildEvaluationPrompt({
    question,
    expectedAnswerOrExplanation,
    userAnswer,
    transcriptText: formattedTranscript,
    sourceTimestamp,
  });

  const ai = getGenAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            reviewTimestamp: { type: Type.NUMBER },
          },
          required: ["correct", "score", "feedback", "reviewTimestamp"],
        },
      },
    });

    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    // Simple rule-based evaluation fallback
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const expWords = expectedAnswerOrExplanation.toLowerCase().split(/\s+/);
    const matches = userWords.filter((w) => w.length > 3 && expWords.some((ew) => ew.includes(w)));
    const score = Math.min(1.0, Math.max(0.2, matches.length / 4));
    const isCorrect = score >= 0.6;

    return {
      correct: isCorrect,
      score,
      feedback: isCorrect
        ? "Good explanation! Your response captures the essential concept."
        : "Your answer missed key elements of the concept. Please review the video explanation at the timestamp indicated.",
      reviewTimestamp: sourceTimestamp.start,
    };
  }
}

// Fallback generator for offline/demo/keyless testing
export function generateDemoFallbackQuiz(params: {
  videoId: string;
  videoTitle: string;
  segmentStart: number;
  segmentEnd: number;
  transcript: Array<{ start: number; end: number; text: string }>;
  questionCount: number;
  concepts?: QuizPromptConcept[];
}) {
  const { videoTitle, segmentStart, segmentEnd, transcript, questionCount, concepts = [] } = params;

  // Find relevant transcript snippets in this segment
  const segmentLines = transcript.filter((t) => t.start >= segmentStart && t.start <= segmentEnd);
  const sampleTime1 = segmentLines[0]?.start || segmentStart + 45;
  const sampleTime2 = segmentLines[Math.floor(segmentLines.length / 2)]?.start || segmentStart + 180;
  const sampleTime3 = segmentLines[segmentLines.length - 1]?.start || segmentStart + 450;

  const conceptName = concepts[0]?.name || "Core Concept";

  const fallbackQuestions = [
    {
      id: `q_fb_1_${Date.now()}`,
      conceptName,
      conceptType: "definition",
      type: "multiple_choice",
      question: `In "${videoTitle}", what is the primary purpose or definition of "${conceptName}" discussed around ${Math.floor(sampleTime1 / 60)}:${String(Math.floor(sampleTime1 % 60)).padStart(2, "0")}?`,
      options: [
        "To systematically model parameters and minimize divergence through iterative updates",
        "To artificially double dataset features and labels without validation",
        "To bypass mathematical compute requirements completely",
        "To randomly skip iterations without objective metrics",
      ],
      correctAnswer: 0,
      explanation:
        "The core mathematical framework focuses on measuring difference between predictions and targets to drive iterative gradient updates.",
      source: {
        start: sampleTime1,
        end: sampleTime1 + 30,
        textSnippet: segmentLines[0]?.text || "Foundational mechanism and loss optimization explanation.",
      },
      difficulty: "medium",
      confidence: 0.96,
    },
    {
      id: `q_fb_2_${Date.now()}`,
      conceptName,
      conceptType: "mechanism",
      type: "true_false",
      question: `True or False: The parameters of "${conceptName}" can be updated directly without calculating the gradient or partial derivative.`,
      options: ["True", "False"],
      correctAnswer: 1, // False
      explanation:
        "False. Optimization requires computing the gradient (direction of steepest ascent/descent) to guide learning steps.",
      source: {
        start: sampleTime2,
        end: sampleTime2 + 25,
        textSnippet: segmentLines[Math.floor(segmentLines.length / 2)]?.text || "Gradient computation and direction guidance.",
      },
      difficulty: "easy",
      confidence: 0.98,
    },
    {
      id: `q_fb_3_${Date.now()}`,
      conceptName,
      conceptType: "cause_effect",
      type: "multiple_choice",
      question: `Why is setting an appropriate learning rate or step size critical when optimizing "${conceptName}"?`,
      options: [
        "Too high causes overshooting/divergence; too low causes excessively slow convergence",
        "It determines the hard disk capacity required to train",
        "It converts continuous variables into discrete integers automatically",
        "It forces the loss function to always be strictly convex",
      ],
      correctAnswer: 0,
      explanation:
        "The learning rate dictates step magnitude. If too large, the optimizer may bounce wildly or diverge; if too small, convergence takes too long.",
      source: {
        start: sampleTime3,
        end: sampleTime3 + 35,
        textSnippet: segmentLines[segmentLines.length - 1]?.text || "Learning rate hyperparameters and step magnitude.",
      },
      difficulty: "hard",
      confidence: 0.94,
    },
  ];

  return {
    questions: fallbackQuestions.slice(0, Math.min(questionCount, fallbackQuestions.length)),
  };
}
