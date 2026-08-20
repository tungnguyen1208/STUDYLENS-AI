import {
  TranscriptSegment,
  DetectedConcept,
  ContextEvaluation,
  LearnedConcept,
  StudySegment,
  UserSettings,
  CheckpointFrequency,
} from "../types/index.ts";
import { StudyLensApiClient } from "../extension/services/api.ts";

export type ConceptReadyCallback = (
  concept: DetectedConcept,
  evaluation: ContextEvaluation,
  segment: StudySegment
) => void;

export type ContextProgressCallback = (
  bufferInfo: {
    bufferedSeconds: number;
    charCount: number;
    estimatedReadiness: number; // 0.0 - 1.0
    currentTopic?: string;
    detectedConcepts: DetectedConcept[];
    isEvaluating: boolean;
  }
) => void;

// Transition cues for local fast boundary detection (multi-language)
const TOPIC_TRANSITION_CUES = [
  // Vietnamese
  "tiếp theo",
  "bây giờ chúng ta",
  "bước tiếp theo",
  "như vậy",
  "tóm lại",
  "chuyển sang",
  "khái niệm tiếp theo",
  "đến phần",
  "mặt khác",
  "ngược lại",
  // English
  "next up",
  "now let's look at",
  "moving on to",
  "in summary",
  "to summarize",
  "another key aspect",
  "on the other hand",
  "therefore",
  "as a result",
  "the second step",
  "the next concept",
];

export class SemanticContextTracker {
  private videoId: string;
  private videoTitle: string;
  private transcript: TranscriptSegment[];
  private settings: UserSettings;

  // Buffer state
  private bufferStart: number = 0;
  private currentVideoTime: number = 0;
  private accumulatedWatchSeconds: number = 0;
  private lastCheckpointTime: number = 0;
  private isEvaluating: boolean = false;
  private lastEvaluatedAtTime: number = -100;

  // Tested & Learned Concepts
  private testedConceptNames: Set<string> = new Set();
  private learnedConcepts: Map<string, LearnedConcept> = new Map();
  private currentDetectedConcepts: DetectedConcept[] = [];
  private currentPrimaryConcept: string = "";

  // Callbacks
  private onConceptReadyCallbacks: ConceptReadyCallback[] = [];
  private onContextProgressCallbacks: ContextProgressCallback[] = [];

  constructor(
    videoId: string,
    videoTitle: string,
    transcript: TranscriptSegment[],
    settings: UserSettings
  ) {
    this.videoId = videoId;
    this.videoTitle = videoTitle;
    this.transcript = transcript;
    this.settings = settings;
    this.bufferStart = 0;
  }

  public updateSettings(settings: UserSettings): void {
    this.settings = settings;
  }

  public onConceptReady(cb: ConceptReadyCallback): void {
    this.onConceptReadyCallbacks.push(cb);
  }

  public onContextProgress(cb: ContextProgressCallback): void {
    this.onContextProgressCallbacks.push(cb);
  }

  /**
   * Process playback tick (called each second while playing)
   */
  public onPlaybackTick(currentTime: number, watchDelta: number): void {
    this.currentVideoTime = currentTime;
    this.accumulatedWatchSeconds += watchDelta;

    const slice = this.getCurrentTranscriptSlice();
    const totalChars = slice.reduce((acc, t) => acc + t.text.length, 0);
    const timeSinceLastCheckpoint = currentTime - this.lastCheckpointTime;

    // Minimum cooldown: at least 90s of video time or 60s of active watch time
    const minCooldown = this.settings.checkpointFrequency === "high" ? 75 : this.settings.checkpointFrequency === "low" ? 180 : 110;
    const minChars = this.settings.checkpointFrequency === "high" ? 220 : this.settings.checkpointFrequency === "low" ? 450 : 300;

    const readinessScore = Math.min(
      1.0,
      Math.max(
        0.1,
        totalChars >= minChars && timeSinceLastCheckpoint >= minCooldown
          ? 0.85
          : totalChars / minChars * 0.75
      )
    );

    // Notify UI of live buffer readiness
    this.notifyProgress(readinessScore, totalChars, timeSinceLastCheckpoint);

    // Check if local heuristic triggers AI Context Evaluation
    const hasTransitionCue = this.checkLocalTransitionCue(slice);
    const hasEnoughContent = totalChars >= minChars && timeSinceLastCheckpoint >= minCooldown;

    // Trigger AI evaluation only when local gates pass and not recently checked
    if (
      !this.isEvaluating &&
      (hasTransitionCue || hasEnoughContent) &&
      currentTime - this.lastEvaluatedAtTime >= 30
    ) {
      this.evaluateContext(false);
    }
  }

  /**
   * Check for transition phrases in recent transcript lines
   */
  private checkLocalTransitionCue(slice: TranscriptSegment[]): boolean {
    if (slice.length === 0) return false;
    const recentText = slice
      .slice(-3)
      .map((s) => s.text.toLowerCase())
      .join(" ");

    return TOPIC_TRANSITION_CUES.some((cue) => recentText.includes(cue));
  }

  /**
   * Get transcript slice from current bufferStart to currentVideoTime
   */
  public getCurrentTranscriptSlice(): TranscriptSegment[] {
    return this.transcript.filter(
      (t) => t.start >= Math.max(0, this.bufferStart - 10) && t.start <= this.currentVideoTime + 5
    );
  }

  /**
   * Trigger AI Context Evaluation
   * @param isManual true if triggered by user clicking "Ask Checkpoint"
   */
  public async evaluateContext(isManual: boolean = false): Promise<ContextEvaluation> {
    if (this.isEvaluating) {
      return {
        sufficient: false,
        score: 0.5,
        topicBoundaryDetected: false,
        concepts: this.currentDetectedConcepts,
        primaryConcept: this.currentPrimaryConcept,
        reasons: ["Evaluation already in progress"],
        suggestedQuestionTypes: ["definition"],
      };
    }

    this.isEvaluating = true;
    this.lastEvaluatedAtTime = this.currentVideoTime;

    const slice = this.getCurrentTranscriptSlice();
    const totalChars = slice.reduce((acc, t) => acc + t.text.length, 0);

    // Quick guard: if buffer has virtually no transcript, report insufficient
    if (totalChars < 120 && slice.length < 2) {
      this.isEvaluating = false;
      return {
        sufficient: false,
        score: 0.2,
        topicBoundaryDetected: false,
        concepts: [],
        primaryConcept: "",
        reasons: [
          this.settings.language === "vi"
            ? "StudyLens chưa có đủ nội dung để tạo một câu hỏi kiểm tra có ý nghĩa."
            : "StudyLens is still gathering enough context for a meaningful knowledge check.",
        ],
        suggestedQuestionTypes: ["definition"],
      };
    }

    try {
      const evaluation = await StudyLensApiClient.analyzeContext({
        videoId: this.videoId,
        videoTitle: this.videoTitle,
        startTime: this.bufferStart,
        endTime: Math.max(this.bufferStart + 60, this.currentVideoTime),
        transcript: slice,
        previousConcepts: Array.from(this.testedConceptNames),
        frequency: this.settings.checkpointFrequency || "balanced",
        targetLanguage: this.settings.language || "vi",
      });

      this.currentDetectedConcepts = evaluation.concepts || [];
      if (evaluation.primaryConcept) {
        this.currentPrimaryConcept = evaluation.primaryConcept;
      }

      // Check if concept is ready for quiz
      const untestConcepts = (evaluation.concepts || []).filter(
        (c) => !this.testedConceptNames.has(c.name.toLowerCase().trim())
      );

      const targetConcept = untestConcepts[0] || evaluation.concepts?.[0];

      if (evaluation.sufficient && targetConcept) {
        const segment: StudySegment = {
          id: `seg_${Date.now()}`,
          index: this.testedConceptNames.size,
          videoId: this.videoId,
          title: targetConcept.name,
          conceptName: targetConcept.name,
          conceptType: targetConcept.type,
          startTime: Math.round(this.bufferStart),
          endTime: Math.round(Math.max(this.bufferStart + 60, this.currentVideoTime)),
          watchedSeconds: this.accumulatedWatchSeconds,
          completed: true,
          quizGenerated: false,
          quizPassed: false,
        };

        // Advance buffer pointer & register tested concept
        this.testedConceptNames.add(targetConcept.name.toLowerCase().trim());
        this.lastCheckpointTime = this.currentVideoTime;
        this.bufferStart = this.currentVideoTime;
        this.accumulatedWatchSeconds = 0;

        // Fire callbacks
        this.onConceptReadyCallbacks.forEach((cb) => cb(targetConcept, evaluation, segment));
      }

      this.notifyProgress(
        evaluation.score,
        totalChars,
        this.currentVideoTime - this.lastCheckpointTime
      );

      return evaluation;
    } catch (err) {
      console.warn("Context evaluation error:", err);
      return {
        sufficient: false,
        score: 0.5,
        topicBoundaryDetected: false,
        concepts: [],
        primaryConcept: "",
        reasons: ["Evaluation failed temporarily"],
        suggestedQuestionTypes: ["definition"],
      };
    } finally {
      this.isEvaluating = false;
    }
  }

  /**
   * Record outcome of quiz for mastery tracking
   */
  public recordConceptResult(
    conceptName: string,
    isCorrect: boolean,
    questionSummary: string
  ): void {
    const key = conceptName.toLowerCase().trim();
    const existing = this.learnedConcepts.get(key) || {
      videoId: this.videoId,
      conceptId: `concept_${key}`,
      name: conceptName,
      firstSeenAt: this.currentVideoTime,
      checkpointAt: this.currentVideoTime,
      questionsAsked: [],
      correctCount: 0,
      incorrectCount: 0,
      masteryScore: 0.5,
    };

    existing.questionsAsked.push(questionSummary);
    if (isCorrect) {
      existing.correctCount += 1;
      existing.masteryScore = Math.min(1.0, existing.masteryScore + 0.25);
    } else {
      existing.incorrectCount += 1;
      existing.masteryScore = Math.max(0.1, existing.masteryScore - 0.3);
    }

    this.learnedConcepts.set(key, existing);
  }

  public getLearnedConcepts(): LearnedConcept[] {
    return Array.from(this.learnedConcepts.values());
  }

  public getDetectedConcepts(): DetectedConcept[] {
    return this.currentDetectedConcepts;
  }

  public getTestedConceptNames(): string[] {
    return Array.from(this.testedConceptNames);
  }

  public resetBuffer(newStartTime: number): void {
    this.bufferStart = newStartTime;
    this.currentVideoTime = newStartTime;
    this.lastCheckpointTime = newStartTime;
    this.accumulatedWatchSeconds = 0;
  }

  private notifyProgress(readiness: number, charCount: number, bufferedSecs: number): void {
    this.onContextProgressCallbacks.forEach((cb) =>
      cb({
        bufferedSeconds: bufferedSecs,
        charCount,
        estimatedReadiness: readiness,
        currentTopic: this.currentPrimaryConcept,
        detectedConcepts: this.currentDetectedConcepts,
        isEvaluating: this.isEvaluating,
      })
    );
  }
}
