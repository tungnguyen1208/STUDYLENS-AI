export function buildEvaluationPrompt(params: {
  question: string;
  expectedAnswerOrExplanation: string;
  userAnswer: string;
  transcriptText: string;
  sourceTimestamp: { start: number; end: number };
}): string {
  const { question, expectedAnswerOrExplanation, userAnswer, transcriptText, sourceTimestamp } = params;

  return `
You are the AI Evaluator for StudyLens AI.
A student was asked: "${question}"
Reference explanation: "${expectedAnswerOrExplanation}"
The student provided this answer: "${userAnswer}"

Reference transcript context:
"""
${transcriptText}
"""

Evaluate the student's answer fairly and constructively:
- Determine if the answer is conceptually correct or demonstrates solid understanding.
- Assign a score between 0.0 (completely incorrect) and 1.0 (fully accurate).
- Provide concise, friendly educational feedback.
- Confirm the review timestamp in seconds (default to ${sourceTimestamp.start} or adjust if the mistake specifically relates to a nearby timestamp).

Return strictly JSON in this format:
{
  "correct": true/false,
  "score": 0.85,
  "feedback": "Concise helpful feedback explaining strengths or what was missed...",
  "reviewTimestamp": ${sourceTimestamp.start}
}
`.trim();
}
