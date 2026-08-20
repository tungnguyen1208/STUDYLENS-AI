export interface ContextPromptParams {
  videoTitle?: string;
  startTime: number;
  endTime: number;
  transcriptText: string;
  previousConcepts?: string[];
  frequency?: "low" | "balanced" | "high";
  targetLanguage?: string;
}

export function buildContextAnalysisPrompt(params: ContextPromptParams): string {
  const {
    videoTitle = "Educational Video",
    startTime,
    endTime,
    transcriptText,
    previousConcepts = [],
    frequency = "balanced",
    targetLanguage = "vi",
  } = params;

  const prevList = previousConcepts.length > 0
    ? previousConcepts.map((c) => `- ${c}`).join("\n")
    : "None (first analysis in this video)";

  // Threshold guidance based on user frequency setting
  let thresholdGuide = "Balanced mode: concept must have clear core explanation (definition, function, mechanism, or relationship) with concrete details.";
  if (frequency === "low") {
    thresholdGuide = "Low frequency mode: only trigger for major, comprehensive concepts that have complete definitions, mechanisms, and examples. High bar for sufficiency (score >= 0.85).";
  } else if (frequency === "high") {
    thresholdGuide = "High frequency mode: trigger as soon as a single distinct concept is completely defined and explained, even if brief (score >= 0.65).";
  }

  return `
You are the expert Educational Context Evaluator for StudyLens AI.

Your task is to analyze the timestamped transcript slice below and determine whether the learner has just received ENOUGH educational context to form a complete, testable unit of knowledge.

CRITICAL DIRECTIVES:
1. YOU ARE NOT GENERATING QUIZ QUESTIONS YET.
2. Analyze whether the transcript contains one or more sufficiently explained educational concepts that are worth testing.
3. DO NOT mark a concept ready merely because a keyword appears.
4. A concept is considered SUFFICIENTLY EXPLAINED when the learner has enough grounded information to answer a meaningful question about at least one of:
   - What it is (definition)
   - What it does / its purpose (function)
   - Why it exists or why it is needed
   - How it works (mechanism)
   - Its important properties / attributes
   - Its relationship or comparison with another concept
   - A causal relationship (cause and effect)
   - A procedure or sequence of steps (process)
5. INCOMPLETE CONTEXT: If the speaker has merely introduced a topic, or appears to still be mid-explanation without delivering the core intuition or key mechanism, you MUST return sufficient = false.
6. TOPIC BOUNDARY: Look for topic transition cues (e.g. "Tiếp theo...", "Bây giờ chuyển sang...", "Như vậy...", "Tóm lại...", "Next...", "Now let's move to...", "In summary...", "Another key aspect..."). Topic transitions signal that the preceding concept explanation is likely complete.
7. QUIZ-WORTHINESS: Focus on core knowledge, definitions, mechanisms, and processes. Ignore trivia, conversational filler, slide logistics, YouTube channel plugs, or date/time mentions.
8. AVOID DUPLICATES: Check the list of previously tested concepts. Do not flag a concept as ready if it was already thoroughly tested, unless a brand new advanced relationship or contrasting mechanism has just been taught.
9. STRICT TRANSCRIPT GROUNDING: Every concept must have exact evidence timestamps (start, end) and text snippets directly from the transcript. DO NOT hallucinate or assume external knowledge outside what is spoken.

LEARNING CONTEXT:
- Video Title: "${videoTitle}"
- Segment Time Span: [${Math.floor(startTime / 60)}:${String(Math.floor(startTime % 60)).padStart(2, "0")}] to [${Math.floor(endTime / 60)}:${String(Math.floor(endTime % 60)).padStart(2, "0")}]
- Knowledge Check Frequency: ${frequency} (${thresholdGuide})
- Analysis / Explanation Language: ${targetLanguage}
- Previously Tested Concepts in this video:
${prevList}

TIMESTAMPED TRANSCRIPT SLICE:
---
${transcriptText || "[No transcript provided]"}
---

EVALUATION OUTPUT FORMAT REQUIREMENTS:
Return a JSON object conforming to this exact structure:
{
  "sufficient": boolean, // true if at least one concept has completenessScore >= threshold and quizWorthinessScore >= threshold
  "score": number, // 0.0 to 1.0 overall context sufficiency score
  "topicBoundaryDetected": boolean, // true if instructor transitions or wraps up a concept
  "primaryConcept": string, // Name of the primary ready concept (e.g. "Bandwidth", "Gradient Descent", "useState")
  "reasons": string[], // List of reasons why context is or is not sufficient
  "suggestedQuestionTypes": string[], // e.g. ["definition", "function", "mechanism", "process", "cause_effect", "comparison"]
  "concepts": [
    {
      "id": string, // e.g. "concept_bandwidth_1"
      "name": string, // e.g. "Bandwidth"
      "aliases": string[],
      "type": string, // "definition" | "function" | "mechanism" | "process" | "relationship" | "comparison" | "formula" | "rule" | "example" | "cause_effect"
      "keywords": string[], // technical keywords found
      "firstSeenAt": number, // timestamp seconds
      "lastSeenAt": number, // timestamp seconds
      "evidence": {
        "start": number,
        "end": number,
        "textSnippet": string
      },
      "completenessScore": number, // 0.0 to 1.0 (how complete is the explanation)
      "quizWorthinessScore": number, // 0.0 to 1.0 (how important and educational is this concept)
      "summary": string // 1 sentence summary in ${targetLanguage}
    }
  ]
}
`.trim();
}
