import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { VideoPlayer } from "./components/VideoPlayer.tsx";
import { SidePanel } from "./components/SidePanel.tsx";
import { ExtensionPackager } from "./components/ExtensionPackager.tsx";
import {
  VideoInfo,
  StudySegment,
  Question,
  QuizSubmission,
  ReviewItem,
  LearningStats,
  UserSettings,
  LearningSession,
  TranscriptSegment,
  YouTubeVideoInfo,
  ConnectionStatus,
  DetectedConcept,
} from "./types/index.ts";
import { StorageService } from "./extension/services/storage.ts";
import { generateStudySegments } from "./extension/utils/segmentation.ts";
import { StudyLensApiClient } from "./extension/services/api.ts";
import { ExtensionMessenger } from "./extension/services/messaging.ts";
import { SemanticContextTracker } from "./services/semanticTracker.ts";
import { useI18n } from "./i18n/index.tsx";
import { Sparkles, Youtube, Plus, X, BookOpen, Layers } from "lucide-react";

export interface AppProps {
  runtime?: "preview" | "extension";
}

export function App({ runtime = "preview" }: AppProps) {
  const { t, language, setLanguage } = useI18n();

  // Detect runtime mode (Extension Side Panel vs AI Studio Interactive Web Preview)
  const isExtensionMode =
    runtime === "extension" ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("mode=extension") ||
        window.location.pathname.endsWith("sidepanel.html") ||
        window.location.pathname.includes("/sidepanel/") ||
        document.body.classList.contains("extension-mode")));

  // Navigation View (Only active in Studio/Preview Mode)
  const [activeView, setActiveView] = useState<"studio" | "extension-export">("studio");

  // User Settings & Gamification Stats
  const [settings, setSettings] = useState<UserSettings>({
    quizIntervalMinutes: 10,
    difficulty: "adaptive",
    questionsPerQuiz: 3,
    autoPauseOnQuiz: true,
    learningMode: true,
    soundEffects: false,
    demoMode: !isExtensionMode,
    theme: "system",
    targetLanguage: "vi",
    sourceLanguage: "auto",
  });

  const [stats, setStats] = useState<LearningStats>({
    totalStudySeconds: 1420,
    quizzesCompleted: 4,
    correctAnswers: 10,
    questionsAnswered: 12,
    accuracyRate: 83,
    streakDays: 3,
    lastActiveDate: new Date().toISOString(),
    topicsMasteredCount: 8,
    topicsNeedingReviewCount: 1,
    xp: 280,
  });

  // Review Queue & Saved Sessions
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);

  // Video State (Studio Preview & Live Extension)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [lessons, setLessons] = useState<any[]>([]);
  const [liveVideoInfo, setLiveVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3600);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isExtensionMode ? "searching" : "synced"
  );
  const activeTabIdRef = useRef<number | null>(null);

  // Segment & Quiz State
  const [studySegments, setStudySegments] = useState<StudySegment[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{
    segment: StudySegment;
    questions: Question[];
    currentIndex: number;
    submissions: Record<string, QuizSubmission>;
    isCompleted: boolean;
  } | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [activeSeekNotice, setActiveSeekNotice] = useState<{ time: number; timestamp: number } | null>(null);

  // Semantic Context Tracking State
  const [semanticTracker, setSemanticTracker] = useState<SemanticContextTracker | null>(null);
  const [contextReadiness, setContextReadiness] = useState(0.5);
  const [activeConcept, setActiveConcept] = useState<DetectedConcept | null>(null);
  const [detectedConcepts, setDetectedConcepts] = useState<DetectedConcept[]>([]);
  const [insufficientContextMessage, setInsufficientContextMessage] = useState<string | null>(null);

  // Custom Video Modal State (Studio Preview only)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customTranscriptText, setCustomTranscriptText] = useState("");

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 1. Theme Management (System, Light, Dark)
  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.theme || "system";
      let isDark = false;
      if (mode === "dark") {
        isDark = true;
      } else if (mode === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    applyTheme();

    if (settings.theme === "system" || !settings.theme) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  // 2. Initial Load: Settings, Stats, Lessons, Reviews
  useEffect(() => {
    async function loadData() {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);

      const savedStats = await StorageService.getStats();
      if (savedStats.xp > 0) setStats(savedStats);

      const savedReviews = await StorageService.getReviewItems();
      if (savedReviews.length > 0) setReviewItems(savedReviews);

      const savedSessions = await StorageService.getSessions();
      setSessions(savedSessions);

      // In Studio Preview, fetch curated YouTube lessons from Express backend
      if (!isExtensionMode) {
        try {
          const res = await fetch("/api/demo/lessons");
          if (res.ok) {
            const data = await res.json();
            if (data.lessons && Array.isArray(data.lessons)) {
              setLessons(data.lessons);
            }
          }
        } catch (err) {
          console.warn("Could not fetch demo lessons from /api/demo/lessons:", err);
        }
      }
    }
    loadData();
  }, [isExtensionMode]);

  // 3. Fallback/Default Lesson for Studio Preview Mode
  const activeLesson = lessons[selectedLessonIndex] || {
    id: "ml-linear-regression",
    title: "Machine Learning - Linear Regression & Cost Functions",
    channel: "Stanford Online / CS229",
    platform: "youtube",
    duration: 3600,
    url: "https://www.youtube.com/watch?v=4b4MUYve_U8",
    sampleVideoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    transcript: [
      {
        start: 0,
        end: 45,
        text: "Chào mừng bạn đến với khóa học Machine Learning. Hôm nay chúng ta bắt đầu với học có giám sát (supervised learning) và hồi quy tuyến tính.",
      },
      {
        start: 45,
        end: 120,
        text: "Học có giám sát có nghĩa là chúng ta được cung cấp một tập dữ liệu gồm các đầu vào X và các nhãn đích thực tế Y.",
      },
      {
        start: 120,
        end: 210,
        text: "Trong bài toán hồi quy, đầu ra Y là một giá trị liên tục, ví dụ như dự đoán giá nhà hoặc biến động thị trường chứng khoán.",
      },
      {
        start: 210,
        end: 320,
        text: "Chúng ta mô hình hóa hàm giả thuyết h(x) dưới dạng theta_0 + theta_1 * x, biểu diễn một đường thẳng trong không gian 2D.",
      },
      {
        start: 320,
        end: 420,
        text: "Để xác định các tham số tối ưu theta_0 và theta_1, chúng ta cần một thước đo toán học gọi là Hàm mất mát hay Hàm chi phí (Cost Function / Loss Function).",
      },
      {
        start: 421,
        end: 462,
        text: "Hồi quy tuyến tính tìm cách mô hình hóa mối quan hệ bằng cách tối thiểu hóa Sai số bình phương trung bình (Mean Squared Error - MSE) giữa dự đoán và nhãn thực tế.",
      },
      {
        start: 463,
        end: 540,
        text: "Hàm mất mát đo lường sai số dự đoán: J(theta) = 1/(2m) * sum((h(x_i) - y_i)^2). Chúng ta nhân với hệ số 1/2 để thuận tiện triệt tiêu khi tính đạo hàm vi phân.",
      },
      {
        start: 541,
        end: 600,
        text: "Nhận thấy rằng vì hàm chi phí là một hàm bậc hai parabol lồi, nó đảm bảo luôn có một điểm cực tiểu toàn cục duy nhất.",
      },
      {
        start: 601,
        end: 720,
        text: "Bây giờ trong phần 2, làm thế nào để chúng ta tìm các giá trị theta làm tối thiểu hóa J(theta) một cách có hệ thống? Chúng ta sử dụng Thuật toán Gradient Descent.",
      },
      {
        start: 721,
        end: 810,
        text: "Gradient Descent bắt đầu với các ước lượng tham số ban đầu, tính đạo hàm riêng của hàm chi phí, và di chuyển từng bước theo hướng giảm dốc nhất.",
      },
      {
        start: 811,
        end: 900,
        text: "Tốc độ học alpha kiểm soát kích thước bước nhảy. Nếu alpha quá nhỏ, gradient descent hội tụ rất chậm. Nếu alpha quá lớn, nó có thể nhảy vượt qua cực tiểu và phân kỳ.",
      },
      {
        start: 901,
        end: 1050,
        text: "Tại điểm cực tiểu cục bộ, độ dốc hay đạo hàm bằng chính xác 0, điều này có nghĩa là gradient descent tự động thực hiện các bước nhỏ dần khi tiến gần điểm hội tụ.",
      },
    ],
  };

  // 4. Live Chrome Extension Connection & Real-Time Sync Loop
  const reconnectExtension = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      setConnectionStatus("not-youtube");
      return;
    }

    try {
      const res = await ExtensionMessenger.connectToActiveYouTubeTab({
        onStatusChange: (status) => setConnectionStatus(status),
        onVideoChanged: (video) => {
          setLiveVideoInfo(video);
          setDuration(video.duration || 3600);
        },
        onPlayerState: (playerState) => {
          if (playerState.currentTime !== undefined) {
            setCurrentTime(playerState.currentTime);
          }
          if (playerState.isPlaying !== undefined) {
            setIsPlaying(playerState.isPlaying);
          }
          if (playerState.duration && playerState.duration > 0) {
            setDuration(playerState.duration);
          }
        },
      });

      if (res.status === "synced" && res.video) {
        activeTabIdRef.current = res.tabId || null;
        setLiveVideoInfo(res.video);
        setDuration(res.video.duration || 3600);

        // Fetch real transcript if available from YouTube
        const transcript = await ExtensionMessenger.getTranscript(res.tabId);
        if (transcript && transcript.length > 0) {
          setLiveTranscript(transcript);
        }
      } else {
        activeTabIdRef.current = res.tabId || null;
      }
    } catch (err) {
      console.warn("[StudyLens App] Extension connection error:", err);
      setConnectionStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isExtensionMode) {
      reconnectExtension();

      // Listen to tab changes in Chrome
      if (typeof chrome !== "undefined" && chrome.tabs?.onActivated) {
        const onTabActivated = async (activeInfo: any) => {
          activeTabIdRef.current = activeInfo.tabId;
          try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (!tab || !ExtensionMessenger.isYouTubeWatchUrl(tab.url)) {
              setConnectionStatus("not-youtube");
              setLiveVideoInfo(null);
            } else {
              reconnectExtension();
            }
          } catch {
            setConnectionStatus("not-youtube");
          }
        };

        const onTabUpdated = (tabId: number, changeInfo: any, tab: any) => {
          if (tabId === activeTabIdRef.current && changeInfo.url) {
            if (!ExtensionMessenger.isYouTubeWatchUrl(changeInfo.url)) {
              setConnectionStatus("not-youtube");
              setLiveVideoInfo(null);
            } else {
              reconnectExtension();
            }
          }
        };

        chrome.tabs.onActivated.addListener(onTabActivated);
        chrome.tabs.onUpdated.addListener(onTabUpdated);

        return () => {
          chrome.tabs.onActivated.removeListener(onTabActivated);
          chrome.tabs.onUpdated.removeListener(onTabUpdated);
        };
      }
    }
  }, [isExtensionMode, reconnectExtension]);

  // Polling YouTube Player in Extension Mode
  useEffect(() => {
    if (!isExtensionMode) return;

    const interval = setInterval(async () => {
      if (activeTabIdRef.current && connectionStatus === "synced") {
        const state = await ExtensionMessenger.getPlayerState(activeTabIdRef.current);
        if (state) {
          if (typeof state.currentTime === "number") setCurrentTime(state.currentTime);
          if (typeof state.duration === "number" && state.duration > 0) setDuration(state.duration);
          if (typeof state.isPlaying === "boolean") setIsPlaying(state.isPlaying);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExtensionMode, connectionStatus]);

  // 5. Active Target Video & Transcript Definition
  const currentVideo: YouTubeVideoInfo = isExtensionMode
    ? liveVideoInfo || {
        videoId: "youtube-video",
        title: connectionStatus === "synced" ? "YouTube Video" : t("videoHeader.searchingForVideo"),
        channelName: connectionStatus === "synced" ? "YouTube Creator" : "",
        url: "",
        duration: duration || 3600,
        thumbnailUrl: "",
      }
    : {
        videoId: activeLesson.id,
        title: activeLesson.title,
        channelName: activeLesson.channel || "YouTube Creator",
        url: activeLesson.url,
        duration: activeLesson.duration || 3600,
        thumbnailUrl: `https://img.youtube.com/vi/${activeLesson.id}/hqdefault.jpg`,
      };

  const currentTranscript: TranscriptSegment[] = isExtensionMode
    ? liveTranscript.length > 0
      ? liveTranscript
      : activeLesson.transcript || []
    : activeLesson.transcript || [];

  // 6. Semantic Context Tracker & Segmentation Setup
  useEffect(() => {
    const effectiveDuration = duration || currentVideo.duration || 3600;
    const segs = generateStudySegments(
      effectiveDuration,
      settings.quizIntervalMinutes,
      currentVideo.videoId
    );
    setStudySegments(segs);
    setActiveQuiz(null);

    // Initialize Semantic Tracker for context-aware knowledge checkpoints
    const tracker = new SemanticContextTracker(
      currentVideo.videoId,
      currentVideo.title,
      currentTranscript,
      settings
    );

    tracker.onContextProgress((info) => {
      setContextReadiness(info.estimatedReadiness);
      setDetectedConcepts(info.detectedConcepts);
    });

    tracker.onConceptReady((concept, evaluation, segment) => {
      setActiveConcept(concept);
      if (settings.autoPauseOnQuiz) {
        if (isExtensionMode) {
          ExtensionMessenger.pauseVideo(activeTabIdRef.current || undefined);
        }
        setIsPlaying(false);
      }
      handleTriggerQuiz(segment, concept);
    });

    setSemanticTracker(tracker);
  }, [
    currentVideo.videoId,
    currentVideo.title,
    duration,
    settings.quizIntervalMinutes,
    settings.checkpointFrequency,
    isExtensionMode,
  ]);

  // Keep tracker updated with latest settings
  useEffect(() => {
    if (semanticTracker) {
      semanticTracker.updateSettings(settings);
    }
  }, [settings, semanticTracker]);

  // Current active study segment based on currentTime
  const currentSegment =
    studySegments.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
    studySegments[0] ||
    null;

  // Real-time playback tick & semantic buffer ticker
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchedSeconds((prev) => {
          const next = prev + 1;

          // Feed tick to Semantic Context Tracker
          if (semanticTracker) {
            semanticTracker.onPlaybackTick(currentTime, 1);
          }

          // Update segment watch seconds
          setStudySegments((segments) =>
            segments.map((seg) => {
              if (currentTime >= seg.startTime && currentTime <= seg.endTime) {
                return { ...seg, watchedSeconds: seg.watchedSeconds + 1 };
              }
              return seg;
            })
          );

          // Update total stats
          setStats((prevStats) => {
            const updated = {
              ...prevStats,
              totalStudySeconds: prevStats.totalStudySeconds + 1,
            };
            StorageService.saveStats(updated);
            return updated;
          });

          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, semanticTracker]);

  // Handle Seek (Synchronizes with YouTube Player in Extension & Studio)
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (isExtensionMode) {
      ExtensionMessenger.seekTo(seconds, activeTabIdRef.current || undefined);
    }
    setActiveSeekNotice({ time: seconds, timestamp: Date.now() });
    setTimeout(() => setActiveSeekNotice(null), 3500);
  };

  // Start or Trigger Quiz for a segment with Concept Grounding
  const handleTriggerQuiz = async (
    targetSegment?: StudySegment,
    readyConcept?: DetectedConcept
  ) => {
    const segment = targetSegment || currentSegment;
    if (!segment) return;

    if (settings.autoPauseOnQuiz) {
      if (isExtensionMode) {
        ExtensionMessenger.pauseVideo(activeTabIdRef.current || undefined);
      }
      setIsPlaying(false);
    }

    setIsLoadingQuiz(true);
    setInsufficientContextMessage(null);

    try {
      let conceptToUse = readyConcept || activeConcept;
      let alreadyTested: string[] = semanticTracker ? semanticTracker.getTestedConceptNames() : [];

      if (!conceptToUse && semanticTracker) {
        const evalRes = await semanticTracker.evaluateContext(true);
        if (!evalRes.sufficient) {
          setInsufficientContextMessage(
            evalRes.reasons?.[0] ||
              (language === "vi"
                ? "StudyLens chưa có đủ nội dung để tạo một câu hỏi kiểm tra có ý nghĩa."
                : "StudyLens is still gathering enough context for a meaningful knowledge check.")
          );
          setTimeout(() => setInsufficientContextMessage(null), 4500);
        }
        conceptToUse = evalRes.concepts?.[0] || null;
      }

      const conceptsPayload = conceptToUse ? [conceptToUse] : detectedConcepts.slice(0, 2);

      const targetLang = settings.targetLanguage || language || "vi";

      const quizRes = await StudyLensApiClient.generateQuiz({
        videoId: currentVideo.videoId,
        videoTitle: currentVideo.title,
        segment: { start: segment.startTime, end: segment.endTime },
        transcript: currentTranscript,
        difficulty: settings.difficulty,
        questionCount: settings.questionsPerQuiz,
        adaptiveAccuracy: stats.accuracyRate / 100,
        language: targetLang,
        concepts: conceptsPayload,
        alreadyTestedConcepts: alreadyTested,
      });

      if (quizRes.questions && quizRes.questions.length > 0) {
        setActiveQuiz({
          segment: {
            ...segment,
            conceptName: conceptToUse?.name || segment.conceptName,
            conceptType: conceptToUse?.type || segment.conceptType,
          },
          questions: quizRes.questions,
          currentIndex: 0,
          submissions: {},
          isCompleted: false,
        });
      }
    } catch (err) {
      console.error("Failed to trigger quiz:", err);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Handle Answer Submission
  const handleAnswerSubmit = async (
    questionId: string,
    answer: any,
    isCorrect: boolean,
    reviewTimestamp: number
  ) => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[activeQuiz.currentIndex];
    if (!currentQ) return;

    // Track concept mastery
    if (semanticTracker && currentQ.conceptName) {
      semanticTracker.recordConceptResult(
        currentQ.conceptName,
        isCorrect,
        currentQ.question
      );
    }

    const submission: QuizSubmission = {
      questionId,
      selectedAnswer: answer,
      isCorrect,
      reviewTimestamp,
      explanation: currentQ.explanation,
    };

    const newSubmissions = { ...activeQuiz.submissions, [questionId]: submission };

    setActiveQuiz({
      ...activeQuiz,
      submissions: newSubmissions,
    });

    // Update Stats & XP
    const newAnswered = stats.questionsAnswered + 1;
    const newCorrect = stats.correctAnswers + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newAnswered) * 100);
    const newXP = stats.xp + (isCorrect ? 10 : 2);

    const updatedStats: LearningStats = {
      ...stats,
      questionsAnswered: newAnswered,
      correctAnswers: newCorrect,
      accuracyRate: newAccuracy,
      xp: newXP,
    };
    setStats(updatedStats);
    await StorageService.saveStats(updatedStats);

    // If answer is incorrect, push to Review Queue
    if (!isCorrect) {
      const reviewItem: ReviewItem = {
        id: `rev_${Date.now()}`,
        videoId: currentVideo.videoId,
        videoTitle: currentVideo.title,
        topic: `Khái niệm kiểm tra: ${currentQ.question}`,
        timestamp: reviewTimestamp,
        timestampEnd: currentQ.source?.end,
        mistakes: 1,
        snippet: currentQ.source?.textSnippet || currentQ.explanation,
        questionSummary: currentQ.question,
        lastAttemptAt: new Date().toISOString(),
        mastered: false,
        status: "pending",
      };

      await StorageService.addReviewItem(reviewItem);
      const queue = await StorageService.getReviewItems();
      setReviewItems(queue);
    }
  };

  // Move to next question or complete
  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (activeQuiz.currentIndex + 1 < activeQuiz.questions.length) {
      setActiveQuiz({
        ...activeQuiz,
        currentIndex: activeQuiz.currentIndex + 1,
      });
    } else {
      const totalQ = activeQuiz.questions.length;
      const correctCount = activeQuiz.questions.filter(
        (q) => activeQuiz.submissions[q.id]?.isCorrect
      ).length;
      const isPassed = correctCount / totalQ >= 0.6;

      setActiveQuiz({
        ...activeQuiz,
        isCompleted: true,
      });

      // Update segment in timeline
      setStudySegments((prev) =>
        prev.map((s) =>
          s.id === activeQuiz.segment.id
            ? {
                ...s,
                completed: isPassed,
                quizGenerated: true,
                quizPassed: isPassed,
                quizScore: correctCount,
                quizTotal: totalQ,
                needsReview: !isPassed,
              }
            : s
        )
      );

      // Save session
      const updatedSession: LearningSession = {
        videoId: currentVideo.videoId,
        url: currentVideo.url,
        title: currentVideo.title,
        channel: currentVideo.channelName,
        duration: currentVideo.duration,
        transcriptCached: true,
        lastPosition: currentTime,
        totalStudySeconds: watchedSeconds,
        segments: studySegments,
        quizzes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveSession(updatedSession);
      StorageService.getSessions().then(setSessions);
    }
  };

  const handleContinueLearning = () => {
    setActiveQuiz(null);
    if (isExtensionMode) {
      ExtensionMessenger.playVideo(activeTabIdRef.current || undefined);
    }
    setIsPlaying(true);
  };

  const handleRetakeQuiz = () => {
    if (activeQuiz) {
      handleTriggerQuiz(activeQuiz.segment);
    }
  };

  const handleMasterReviewItem = async (id: string) => {
    await StorageService.markReviewMastered(id);
    const updated = await StorageService.getReviewItems();
    setReviewItems(updated);
    const statsUpdated = await StorageService.getStats();
    setStats(statsUpdated);
  };

  const handleCreateCustomLesson = () => {
    if (!customTitle) return;

    const rawLines = customTranscriptText
      .split("\n")
      .filter((l) => l.trim().length > 0);

    const parsedTranscript: TranscriptSegment[] = rawLines.map((line, idx) => {
      const match = line.match(/^\[?(\d+):(\d+)\]?\s*(.*)$/);
      if (match) {
        const sec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        return { start: sec, end: sec + 30, text: match[3] };
      }
      return { start: idx * 30, end: idx * 30 + 25, text: line };
    });

    const newLesson = {
      id: `custom_${Date.now()}`,
      title: customTitle,
      channel: "Bài giảng YouTube",
      platform: "youtube" as const,
      duration: 2400,
      url: customUrl || "https://www.youtube.com/watch?v=custom",
      transcript:
        parsedTranscript.length > 0
          ? parsedTranscript
          : [
              {
                start: 0,
                end: 60,
                text: "Chào mừng bạn đến với bài giảng kỹ thuật chuyên sâu này.",
              },
              {
                start: 61,
                end: 180,
                text: "Đầu tiên chúng ta thiết lập các phương trình lý thuyết và nguyên lý cốt lõi.",
              },
              {
                start: 181,
                end: 360,
                text: "Tiếp theo chúng ta đánh giá sự đánh đổi tính toán và đặc tính hiệu năng.",
              },
            ],
    };

    setLessons((prev) => [newLesson, ...prev]);
    setSelectedLessonIndex(0);
    setShowCustomModal(false);
    setCustomTitle("");
    setCustomUrl("");
    setCustomTranscriptText("");
  };

  // ==========================================
  // RENDER: CHROME EXTENSION SIDE PANEL MODE
  // ==========================================
  if (isExtensionMode) {
    return (
      <div className="h-screen w-full bg-[var(--bg-panel)] text-[var(--text-primary)] font-sans flex flex-col antialiased overflow-hidden select-none transition-colors">
        <SidePanel
          video={currentVideo}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          connectionStatus={connectionStatus}
          segments={studySegments}
          currentSegment={currentSegment}
          totalWatchedSeconds={watchedSeconds}
          stats={stats}
          settings={settings}
          reviewItems={reviewItems}
          sessions={sessions}
          activeQuiz={activeQuiz}
          isLoadingQuiz={isLoadingQuiz}
          contextReadiness={contextReadiness}
          activeConcept={activeConcept}
          detectedConcepts={detectedConcepts}
          insufficientContextMessage={insufficientContextMessage}
          onTriggerCheck={(seg) => handleTriggerQuiz(seg)}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={handleNextQuestion}
          onSeek={handleSeek}
          onRetakeQuiz={handleRetakeQuiz}
          onContinueLearning={handleContinueLearning}
          onMasterReviewItem={handleMasterReviewItem}
          onUpdateSettings={(newSettings) => {
            const merged = { ...settings, ...newSettings };
            setSettings(merged);
            StorageService.saveSettings(merged);
            if (newSettings.targetLanguage) {
              setLanguage(newSettings.targetLanguage as any);
            }
          }}
          onSelectSession={(sess) => {
            if (sess.url) {
              window.open(sess.url, "_blank");
            }
          }}
          onRefresh={reconnectExtension}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: AI STUDIO PREVIEW & INTERACTIVE LAB
  // ==========================================
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col antialiased transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        stats={stats}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isDemoMode={settings.demoMode}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === "extension-export" ? (
          <ExtensionPackager />
        ) : (
          <div className="space-y-6">
            {/* Active YouTube Video Selector Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-panel)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
                  <Youtube className="h-5 w-5" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    {t("videoHeader.activeLesson")}
                  </label>
                  <select
                    id="select-lesson-dropdown"
                    value={selectedLessonIndex}
                    onChange={(e) => setSelectedLessonIndex(Number(e.target.value))}
                    className="text-sm font-semibold text-[var(--text-primary)] bg-transparent pr-6 py-0.5 focus:outline-none cursor-pointer"
                  >
                    {lessons.map((lesson, idx) => (
                      <option key={lesson.id} value={idx} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                        {lesson.title} ({Math.floor(lesson.duration / 60)} {t("common.minutes")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Custom Video Button */}
              <button
                id="btn-add-custom-video"
                onClick={() => setShowCustomModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 text-red-500" />
                <span>{t("common.addCustomVideo")}</span>
              </button>
            </div>

            {/* 2-Column Split: YouTube Simulator on Left, Extension SidePanel on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Player & Transcript Sync (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <VideoPlayer
                  videoInfo={{
                    id: activeLesson.id,
                    title: activeLesson.title,
                    channel: activeLesson.channel,
                    platform: "youtube",
                    duration: activeLesson.duration,
                    url: activeLesson.url,
                  }}
                  transcript={activeLesson.transcript || []}
                  currentTime={currentTime}
                  onTimeUpdate={(t) => setCurrentTime(t)}
                  onSeek={handleSeek}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  studySegments={studySegments}
                  currentSegment={currentSegment}
                  activeSeekNotice={activeSeekNotice}
                  sampleVideoSrc={activeLesson.sampleVideoUrl}
                  onManualTriggerQuiz={() => handleTriggerQuiz(currentSegment || undefined)}
                  isGeneratingQuiz={isLoadingQuiz}
                />
              </div>

              {/* Right Column: Chrome SidePanel (5 cols) */}
              <div className="lg:col-span-5 h-[760px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl bg-[var(--bg-panel)]">
                <SidePanel
                  video={currentVideo}
                  currentTime={currentTime}
                  duration={activeLesson.duration || 3600}
                  isPlaying={isPlaying}
                  connectionStatus={connectionStatus}
                  segments={studySegments}
                  currentSegment={currentSegment}
                  totalWatchedSeconds={watchedSeconds}
                  stats={stats}
                  settings={settings}
                  reviewItems={reviewItems}
                  sessions={sessions}
                  activeQuiz={activeQuiz}
                  isLoadingQuiz={isLoadingQuiz}
                  contextReadiness={contextReadiness}
                  activeConcept={activeConcept}
                  detectedConcepts={detectedConcepts}
                  insufficientContextMessage={insufficientContextMessage}
                  onTriggerCheck={(seg) => handleTriggerQuiz(seg)}
                  onAnswerSubmit={handleAnswerSubmit}
                  onNextQuestion={handleNextQuestion}
                  onSeek={handleSeek}
                  onRetakeQuiz={handleRetakeQuiz}
                  onContinueLearning={handleContinueLearning}
                  onMasterReviewItem={handleMasterReviewItem}
                  onUpdateSettings={(newSettings) => {
                    const merged = { ...settings, ...newSettings };
                    setSettings(merged);
                    StorageService.saveSettings(merged);
                    if (newSettings.targetLanguage) {
                      setLanguage(newSettings.targetLanguage as any);
                    }
                  }}
                  onSelectSession={(sess) => {
                    const foundIdx = lessons.findIndex((l) => l.id === sess.videoId);
                    if (foundIdx !== -1) setSelectedLessonIndex(foundIdx);
                  }}
                  onRefresh={reconnectExtension}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Custom Video / Transcript */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-panel)] p-6 shadow-2xl border border-[var(--border-subtle)] space-y-4 animate-fadeIn text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-base text-[var(--text-primary)]">{t("common.addCustomVideo")}</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1">YouTube Video Title</label>
                <input
                  type="text"
                  placeholder="e.g. Stanford CS229: Machine Learning by Andrew Ng"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2.5 text-sm text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1">YouTube URL</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=4b4MUYve_U8"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2.5 text-sm text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1">
                  {t("videoPlayer.transcriptTitle")}
                </label>
                <textarea
                  rows={6}
                  placeholder={`[00:00] Chào mừng bạn đến với khóa học đại số tuyến tính...\n[05:30] Phép nhân ma trận và phân tích trị riêng...\n[12:45] Áp dụng SVD để giảm số chiều dữ liệu...`}
                  value={customTranscriptText}
                  onChange={(e) => setCustomTranscriptText(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCreateCustomLesson}
                disabled={!customTitle.trim()}
                className="rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)] text-white px-5 py-2 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-panel)] p-6 shadow-2xl border border-[var(--border-subtle)] space-y-4 animate-fadeIn text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-base text-[var(--text-primary)]">{t("settings.title")}</h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1.5">{t("settings.theme")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((th) => (
                    <button
                      key={th}
                      onClick={() => {
                        const updated = { ...settings, theme: th };
                        setSettings(updated);
                        StorageService.saveSettings(updated);
                      }}
                      className={`rounded-lg py-2 font-bold capitalize transition-all border cursor-pointer ${
                        settings.theme === th
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {t(`settings.${th}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1.5">{t("settings.quizInterval")}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        const updated = { ...settings, quizIntervalMinutes: m };
                        setSettings(updated);
                        StorageService.saveSettings(updated);
                      }}
                      className={`rounded-lg py-2 font-bold transition-all border cursor-pointer ${
                        settings.quizIntervalMinutes === m
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {m} {t("common.minutes")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-primary)] block mb-1.5">{t("settings.difficulty")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["easy", "medium", "hard", "adaptive"] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        const updated = { ...settings, difficulty: diff };
                        setSettings(updated);
                        StorageService.saveSettings(updated);
                      }}
                      className={`rounded-lg py-2 font-semibold capitalize transition-all border cursor-pointer ${
                        settings.difficulty === diff
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {diff === "adaptive" ? `⚡ ${t("settings.adaptive")}` : t(`settings.${diff}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-[var(--text-primary)]">{t("settings.autoPause")}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoPauseOnQuiz}
                    onChange={(e) => {
                      const updated = { ...settings, autoPauseOnQuiz: e.target.checked };
                      setSettings(updated);
                      StorageService.saveSettings(updated);
                    }}
                    className="h-4 w-4 rounded text-red-600 bg-[var(--bg-input)] border-[var(--border-subtle)]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-[var(--text-primary)]">{t("settings.learningMode")}</span>
                  <input
                    type="checkbox"
                    checked={settings.learningMode}
                    onChange={(e) => {
                      const updated = { ...settings, learningMode: e.target.checked };
                      setSettings(updated);
                      StorageService.saveSettings(updated);
                    }}
                    className="h-4 w-4 rounded text-red-600 bg-[var(--bg-input)] border-[var(--border-subtle)]"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs font-semibold cursor-pointer"
              >
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
