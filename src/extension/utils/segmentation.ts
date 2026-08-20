import { StudySegment } from "../../types/index.ts";

export function generateStudySegments(
  durationSeconds: number,
  intervalMinutes: number = 10,
  videoId: string = "video"
): StudySegment[] {
  if (!durationSeconds || durationSeconds <= 0) {
    return [
      {
        id: `${videoId}_seg_0`,
        videoId,
        index: 0,
        startTime: 0,
        endTime: 600,
        title: "Introduction & Fundamentals",
        completed: false,
        watchedSeconds: 0,
        quizGenerated: false,
        quizPassed: false,
        quizScore: 0,
        quizTotal: 0,
        needsReview: false,
      },
    ];
  }

  const intervalSeconds = Math.max(60, intervalMinutes * 60);
  const totalSegments = Math.max(1, Math.ceil(durationSeconds / intervalSeconds));
  const segments: StudySegment[] = [];

  const segmentTitles = [
    "Introduction & Core Concepts",
    "Deep Dive & Methodologies",
    "Detailed Formulations & Analysis",
    "Practical Implementation & Applications",
    "Edge Cases & Complex Scenarios",
    "Advanced Topics & Optimizations",
    "Summary & Key Takeaways",
  ];

  for (let i = 0; i < totalSegments; i++) {
    const start = i * intervalSeconds;
    const end = Math.min(durationSeconds, (i + 1) * intervalSeconds);
    const title =
      i < segmentTitles.length
        ? segmentTitles[i]
        : `Part ${i + 1}: Conceptual Mastery`;

    segments.push({
      id: `${videoId}_seg_${i}`,
      videoId,
      index: i,
      startTime: start,
      endTime: end,
      title,
      completed: false,
      watchedSeconds: 0,
      quizGenerated: false,
      quizPassed: false,
      quizScore: 0,
      quizTotal: 0,
      needsReview: false,
    });
  }

  return segments;
}
