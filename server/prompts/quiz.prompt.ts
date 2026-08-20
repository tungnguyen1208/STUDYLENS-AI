export interface QuizPromptConcept {
  name: string;
  type?: string;
  keywords?: string[];
  evidence?: { start: number; end: number; textSnippet?: string };
  summary?: string;
}

export function buildQuizPrompt(params: {
  videoTitle: string;
  segmentStart: number;
  segmentEnd: number;
  transcriptText: string;
  difficulty: string;
  questionCount: number;
  adaptiveAccuracy?: number;
  language?: string;
  concepts?: QuizPromptConcept[];
  alreadyTestedConcepts?: string[];
}): string {
  const {
    videoTitle,
    segmentStart,
    segmentEnd,
    transcriptText,
    difficulty,
    questionCount,
    adaptiveAccuracy,
    language = "vi",
    concepts = [],
    alreadyTestedConcepts = [],
  } = params;

  const langInstruction =
    language === "vi"
      ? "IMPORTANT: Output all question text, options, and explanations in VIETNAMESE (Tiếng Việt) with natural, academic and engaging terminology."
      : language === "ja"
      ? "IMPORTANT: Output all question text, options, and explanations in JAPANESE (日本語)."
      : language === "es"
      ? "IMPORTANT: Output all question text, options, and explanations in SPANISH (Español)."
      : language === "fr"
      ? "IMPORTANT: Output all question text, options, and explanations in FRENCH (Français)."
      : language === "zh"
      ? "IMPORTANT: Output all question text, options, and explanations in CHINESE (简体中文)."
      : language === "de"
      ? "IMPORTANT: Output all question text, options, and explanations in GERMAN (Deutsch)."
      : language === "ko"
      ? "IMPORTANT: Output all question text, options, and explanations in KOREAN (한국어)."
      : "IMPORTANT: Output all question text, options, and explanations in ENGLISH.";

  const conceptsSection =
    concepts.length > 0
      ? `TARGET EDUCATIONAL CONCEPTS TO TEST:
${concepts
  .map(
    (c, i) =>
      `${i + 1}. [${c.type || "concept"}] **${c.name}** (${c.summary || "Core concept"})\n   Keywords: ${(c.keywords || []).join(", ") || "N/A"}\n   Evidence timestamp: [${c.evidence ? `${Math.floor(c.evidence.start / 60)}:${String(Math.floor(c.evidence.start % 60)).padStart(2, "0")} - ${Math.floor(c.evidence.end / 60)}:${String(Math.floor(c.evidence.end % 60)).padStart(2, "0")}` : "Within segment"}]`
  )
  .join("\n")}`
      : "Extract the primary completed educational concept from the transcript slice.";

  const prevTestedSection =
    alreadyTestedConcepts.length > 0
      ? `ALREADY TESTED CONCEPTS (DO NOT DUPLICATE THESE EXACT QUESTIONS):
${alreadyTestedConcepts.map((c) => `- ${c}`).join("\n")}`
      : "";

  return `
You are the AI Knowledge Check Engine for StudyLens AI.
Your job is to generate a meaningful, high-yield comprehension quiz reinforcing what the learner JUST learned in "${videoTitle}".

STUDY TIME SPAN:
From [${Math.floor(segmentStart / 60)}:${String(Math.floor(segmentStart % 60)).padStart(2, "0")}] (${segmentStart}s) to [${Math.floor(segmentEnd / 60)}:${String(Math.floor(segmentEnd % 60)).padStart(2, "0")}] (${segmentEnd}s).

${conceptsSection}

${prevTestedSection}

TRANSCRIPT SLICE WITH TIMESTAMPS:
"""
${transcriptText}
"""

LANGUAGE REQUIREMENT:
${langInstruction}

QUESTION DESIGN PRINCIPLES:
1. TEST ESSENTIAL UNDERSTANDING, NOT TRIVIA:
   - For a "definition" concept: Ask what it is, its core meaning, or units.
   - For a "function" concept: Ask its primary purpose or what problem it solves.
   - For a "mechanism" concept: Ask how it works, how parameters are updated, or internal logic.
   - For a "process" concept: Ask the sequence of steps or what comes after step X.
   - For a "cause_effect" concept: Ask what happens when parameter X increases or decreases.
   - For a "comparison" concept: Ask key differences or trade-offs between concept A and concept B.
   - NEVER ask trivia (e.g. "How many times did the speaker say word X?", "What minute was the example shown?").
2. GROUNDING & EVIDENCE:
   - Every correct answer MUST be directly verified in the transcript slice.
   - Attach the exact timestamp [start, end] in seconds where the concept is taught.
3. ADAPTIVE QUANTITY: Generate ${questionCount} questions (1 to ${questionCount}).
4. FORMAT: Multiple Choice (with 4 plausible options) or True/False with clear misconceptions addressed in explanation.
5. Target difficulty: ${difficulty}${adaptiveAccuracy !== undefined ? ` (Student recent accuracy: ${Math.round(adaptiveAccuracy * 100)}%)` : ""}.

Return STRICT JSON adhering to this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "conceptName": "Bandwidth",
      "conceptType": "definition",
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear educational explanation referencing why this option is correct...",
      "source": {
        "start": 165,
        "end": 238,
        "textSnippet": "Exact phrase or verified quote from transcript"
      },
      "difficulty": "medium",
      "confidence": 0.96
    }
  ]
}
`.trim();
}

