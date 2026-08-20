import { CreateQuizSkillInput } from "./createQuizSkill.types.ts";

export function buildCreateQuizSkillPrompt(input: CreateQuizSkillInput): string {
  const {
    videoTitle,
    sourceLanguage = "auto",
    targetLanguage = "vi",
    contextStart,
    contextEnd,
    transcript,
    previouslyTestedConcepts = [],
    learnerWeakConcepts = [],
    difficulty = "adaptive",
    maxQuestions = 3,
    frequency = "balanced",
    adaptiveAccuracy,
  } = input;

  // Format timestamped transcript for prompt
  const formattedTranscript = transcript
    .map((t) => `[${Math.floor(t.start / 60)}:${String(Math.floor(t.start % 60)).padStart(2, "0")}] ${t.text}`)
    .join("\n");

  const prevTestedList = previouslyTestedConcepts.length > 0
    ? previouslyTestedConcepts
        .map((p) => (typeof p === "string" ? `- ${p}` : `- ${p.concept}${p.question ? ` (Q: ${p.question})` : ""}${p.wasCorrect === false ? " [Learner was WRONG, candidate for deeper reinforcement]" : ""}`))
        .join("\n")
    : "None (first check in this video session)";

  const weakList = learnerWeakConcepts.length > 0
    ? learnerWeakConcepts.map((w) => `- ${w}`).join("\n")
    : "None";

  const langInstruction =
    targetLanguage === "vi"
      ? `TARGET LANGUAGE IS VIETNAMESE (Tiếng Việt):
- Output all questions, options, explanations, and concept summaries in natural, precise, academic Vietnamese.
- Preserve standard international technical terms when customary (e.g., TCP, UDP, Loss Function, Gradient Descent, Overfitting, SVD, ReLU, Backpropagation).
- Do NOT output questions in English when targetLanguage is Vietnamese.`
      : `TARGET LANGUAGE: ${targetLanguage.toUpperCase()}
- Output all learner-facing questions, options, and explanations in ${targetLanguage}.`;

  return `
You are the Knowledge Analysis and Quiz Generation Engine for StudyLens AI.

StudyLens is an educational intelligence system that analyzes timestamped transcripts from learning videos and creates knowledge-reinforcement quizzes.
Your job is NOT to generate a quiz every time you receive transcript text.

Your job is to:
1. Analyze the transcript slice as a continuous learning unit.
2. Detect educational concepts and meaningful technical keywords.
3. Determine whether ENOUGH context exists for the learner to understand at least one concept.
4. Select only important, quiz-worthy knowledge.
5. Generate quiz questions ONLY when the knowledge is sufficiently explained (readyForQuiz = true).
6. Strictly ground every question in the supplied transcript.
7. Provide exact, narrow source timestamps for review.

---
INPUT CONTEXT:
- Video Title: "${videoTitle}"
- Context Window: [${Math.floor(contextStart / 60)}:${String(Math.floor(contextStart % 60)).padStart(2, "0")}] to [${Math.floor(contextEnd / 60)}:${String(Math.floor(contextEnd % 60)).padStart(2, "0")}] (${contextStart}s - ${contextEnd}s)
- Source Transcript Language: ${sourceLanguage}
- Target Learner Language: ${targetLanguage}
- Configured Difficulty: ${difficulty}${adaptiveAccuracy !== undefined ? ` (Learner recent accuracy: ${Math.round(adaptiveAccuracy * 100)}%)` : ""}
- Max Questions Requested: ${maxQuestions} (Only generate up to this amount if distinct concepts justify it!)
- Knowledge Check Frequency: ${frequency}

PREVIOUSLY TESTED CONCEPTS (Avoid repeating identical questions):
${prevTestedList}

LEARNER WEAK CONCEPTS (Prioritize if present in transcript):
${weakList}

TIMESTAMPED TRANSCRIPT SLICE:
"""
${formattedTranscript}
"""

---
LANGUAGE REQUIREMENT:
${langInstruction}

---
CRITICAL RULES & PIPELINE:

STEP 1 — ANALYZE TRANSCRIPT & EXTRACT CONCEPTS:
- Identify genuine educational concepts (definition, function, purpose, mechanism, process, relationship, comparison, cause_effect, formula, rule, property).
- DO NOT treat conversational filler words (e.g., "video", "today", "slide", "teacher", "next", "okay") as concepts.

STEP 2 — EVALUATE CONTEXT COMPLETENESS (completenessScore: 0.0 -> 1.0):
- A concept is NOT ready merely because it was mentioned or introduced (e.g. "Next we will learn about TCP" is NOT complete).
- A concept is SUFFICIENTLY EXPLAINED when the learner has enough information from the transcript to answer:
  * What is it? (Definition)
  * What does it do / Why is it needed? (Function/Purpose)
  * How does it work? (Mechanism/Process)
  * How does X affect Y? (Cause & Effect)
  * How does A compare to B? (Comparison)

STEP 3 — EVALUATE QUIZ-WORTHINESS (quizWorthinessScore: 0.0 -> 1.0):
- Prioritize fundamental, mechanism-heavy, or easy-to-misunderstand concepts.
- BAN trivia questions (e.g. "How many times was the word said?", "What color was the slide?", "What timestamp was it?").

STEP 4 — DECIDE readyForQuiz:
- Return readyForQuiz = true ONLY IF at least one concept has completenessScore >= 0.70 and quizWorthinessScore >= 0.70 and is grounded.
- If context is still incomplete or speaker is mid-explanation, return readyForQuiz = false with empty questions [].

STEP 5 — QUESTION GENERATION & GROUNDING:
- Generate 1 to ${maxQuestions} questions based on how many distinct, complete concepts exist. Quality > Quantity.
- Multiple Choice (4 plausible options) or True/False.
- One unambiguously correct answer.
- Plausible distractors representing common misconceptions.
- source timestamp [start, end] must be the exact narrow range (e.g. 15-45 seconds) in the transcript that proves the correct answer.

OUTPUT FORMAT:
Return STRICT, VALID JSON conforming exactly to this structure (NO MARKDOWN WRAPPERS, NO CODE FENCES):
{
  "readyForQuiz": true,
  "contextScore": 0.85,
  "contextSummary": "Brief summary of knowledge taught in this slice",
  "detectedConcepts": [
    {
      "id": "concept_1",
      "name": "Concept Name",
      "type": "definition",
      "keywords": ["keyword1", "keyword2"],
      "summary": "Summary of what was taught about this concept",
      "completenessScore": 0.92,
      "quizWorthinessScore": 0.88,
      "evidence": {
        "start": 120,
        "end": 185,
        "textSnippet": "Short supporting quote from transcript"
      }
    }
  ],
  "selectedConcepts": ["concept_1"],
  "questions": [
    {
      "id": "q1",
      "conceptId": "concept_1",
      "concept": "Concept Name",
      "knowledgeType": "definition",
      "type": "multiple_choice",
      "question": "Clear question testing core understanding?",
      "options": ["Option A (Correct)", "Option B (Distractor)", "Option C (Distractor)", "Option D (Distractor)"],
      "correctAnswer": 0,
      "explanation": "Concise educational explanation citing what was taught in the transcript",
      "source": {
        "start": 120,
        "end": 185,
        "textSnippet": "Exact phrase from transcript"
      },
      "difficulty": "medium",
      "confidence": 0.95
    }
  ]
}

IF NOT READY FOR QUIZ (readyForQuiz = false):
{
  "readyForQuiz": false,
  "contextScore": 0.45,
  "contextSummary": "The explanation is in progress and not yet complete for a high-yield quiz.",
  "detectedConcepts": [
    {
      "id": "concept_1",
      "name": "Concept Name",
      "type": "definition",
      "keywords": ["keyword1"],
      "summary": "Concept was introduced but not yet fully defined or elaborated.",
      "completenessScore": 0.42,
      "quizWorthinessScore": 0.85,
      "evidence": {
        "start": 120,
        "end": 150
      }
    }
  ],
  "selectedConcepts": [],
  "questions": [],
  "reason": "The main concept is still being introduced and lacks sufficient grounding details."
}
`.trim();
}
