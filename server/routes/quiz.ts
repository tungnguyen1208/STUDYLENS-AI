import { Router } from "express";
import fs from "fs";
import path from "path";
import { generateQuizWithGemini, evaluateAnswerWithGemini, analyzeContextWithGemini } from "../gemini.ts";
import { createQuizSkill } from "../skills/create-quiz/createQuizSkill.ts";

export const quizRouter = Router();

// Health Check
quizRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "StudyLens AI Core Engine",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Create Quiz Skill Endpoint
quizRouter.post("/quiz/skill/create", async (req, res) => {
  try {
    const result = await createQuizSkill.execute(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("API /quiz/skill/create error:", error);
    res.status(500).json({
      error: "Failed to execute CreateQuizSkill",
      message: error?.message || "Internal server error",
    });
  }
});

// Analyze Educational Context & Concept Sufficiency
quizRouter.post("/context/analyze", async (req, res) => {
  try {
    const {
      videoId,
      videoTitle,
      startTime = 0,
      endTime = 300,
      transcript = [],
      previousConcepts = [],
      frequency = "balanced",
      targetLanguage = "vi",
    } = req.body;

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({
        error: "Missing or empty transcript array",
      });
    }

    const evaluation = await analyzeContextWithGemini({
      videoId: videoId || "video_default",
      videoTitle: videoTitle || "Educational Video",
      startTime: Number(startTime) || 0,
      endTime: Number(endTime) || 300,
      transcript,
      previousConcepts: Array.isArray(previousConcepts) ? previousConcepts : [],
      frequency: frequency === "low" || frequency === "high" ? frequency : "balanced",
      targetLanguage: String(targetLanguage || "vi"),
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error("API /context/analyze error:", error);
    res.status(500).json({
      error: "Failed to analyze context",
      message: error?.message || "Internal server error",
    });
  }
});

// Generate Quiz for a Video Segment
quizRouter.post("/quiz/generate", async (req, res) => {
  try {
    const {
      videoId,
      videoTitle,
      segment,
      transcript,
      difficulty = "medium",
      questionCount = 3,
      adaptiveAccuracy,
      language = "vi",
      concepts = [],
      alreadyTestedConcepts = [],
    } = req.body;

    if (!videoTitle || !segment || !Array.isArray(transcript)) {
      return res.status(400).json({
        error: "Missing required fields: videoTitle, segment: {start, end}, transcript: []",
      });
    }

    const start = Number(segment.start) || 0;
    const end = Number(segment.end) || 600;

    // Filter transcript strictly within segment bounds
    const segmentTranscript = transcript.filter(
      (t: any) => t.start >= Math.max(0, start - 15) && t.start <= end + 15
    );

    const result = await generateQuizWithGemini({
      videoId: videoId || "video_default",
      videoTitle,
      segmentStart: start,
      segmentEnd: end,
      transcript: segmentTranscript.length > 0 ? segmentTranscript : transcript.slice(0, 20),
      difficulty,
      questionCount: Math.max(1, Math.min(5, Number(questionCount) || 3)),
      adaptiveAccuracy: typeof adaptiveAccuracy === "number" ? adaptiveAccuracy : undefined,
      language: String(language || "vi"),
      concepts: Array.isArray(concepts) ? concepts : [],
      alreadyTestedConcepts: Array.isArray(alreadyTestedConcepts) ? alreadyTestedConcepts : [],
    });

    res.json(result);
  } catch (error: any) {
    console.error("API /quiz/generate error:", error);
    res.status(500).json({
      error: "Failed to generate quiz",
      message: error?.message || "Internal server error",
    });
  }
});

// Evaluate Short-Answer Response
quizRouter.post("/quiz/evaluate", async (req, res) => {
  try {
    const { question, expectedAnswerOrExplanation, userAnswer, transcript, sourceTimestamp } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({
        error: "Missing question or userAnswer",
      });
    }

    const evaluation = await evaluateAnswerWithGemini({
      question,
      expectedAnswerOrExplanation: expectedAnswerOrExplanation || "",
      userAnswer,
      transcript: Array.isArray(transcript) ? transcript : [],
      sourceTimestamp: sourceTimestamp || { start: 0, end: 60 },
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error("API /quiz/evaluate error:", error);
    res.status(500).json({
      error: "Failed to evaluate answer",
      message: error?.message || "Internal server error",
    });
  }
});

// Pre-packaged Curated High Quality Demo Lessons with real transcripts & timestamps
quizRouter.get("/demo/lessons", (req, res) => {
  res.json({
    lessons: [
      {
        id: "ml-linear-regression",
        title: "Machine Learning - Linear Regression & Cost Functions",
        channel: "Stanford Online / CS229",
        platform: "youtube",
        duration: 3600, // 60 minutes
        url: "https://www.youtube.com/watch?v=4b4MUYve_U8",
        thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=640&q=80",
        sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        transcript: [
          { start: 0, end: 45, text: "Welcome to Machine Learning. Today we start with supervised learning and linear regression." },
          { start: 45, end: 120, text: "Supervised learning means we are given a dataset of inputs X and true ground truth labels Y." },
          { start: 120, end: 210, text: "In regression, our output Y is continuous, such as predicting housing prices or stock market indices." },
          { start: 210, end: 320, text: "We model our hypothesis function h(x) as theta_0 + theta_1 * x, which describes a straight 2D line." },
          { start: 320, end: 420, text: "To determine the optimal parameters theta_0 and theta_1, we need a mathematical metric called the Loss Function or Cost Function." },
          { start: 421, end: 462, text: "Linear regression attempts to model the relationship by minimizing the Mean Squared Error (MSE) between our predictions and target values." },
          { start: 463, end: 540, text: "The loss function measures prediction error: J(theta) = 1/(2m) * sum((h(x_i) - y_i)^2). We multiply by 1/2 for convenient calculus derivative cancellation." },
          { start: 541, end: 600, text: "Notice that because the cost function is a quadratic parabola, it is guaranteed to be strictly convex with a single global minimum." },
          { start: 601, end: 720, text: "Now in segment 2, how do we systematically find the theta values that minimize J(theta)? We use Gradient Descent." },
          { start: 721, end: 810, text: "Gradient descent starts with initial parameter guesses, calculates the derivative of the cost function, and takes steps in the direction of steepest decrease." },
          { start: 811, end: 900, text: "The learning rate alpha controls step size. If alpha is too small, gradient descent converges very slowly. If alpha is too large, it can overshoot and diverge." },
          { start: 901, end: 1050, text: "At the local minimum, the slope or derivative is exactly zero, which means gradient descent automatically takes smaller steps as it nears convergence." },
          { start: 1051, end: 1200, text: "Batch gradient descent looks at every single training example in the dataset on each iteration step." },
          { start: 1201, end: 1500, text: "In segment 3, we extend to multiple features: Multivariate Linear Regression with vector matrix notation X*theta." },
          { start: 1501, end: 1800, text: "Feature scaling (normalization) ensures all variables have similar ranges, speeding up gradient descent convergence dramatically." }
        ]
      },
      {
        id: "react-hooks-state",
        title: "React Architecture: Modern Hooks, State & Re-render Optimization",
        channel: "Frontend Masters",
        platform: "youtube",
        duration: 2400, // 40 minutes
        url: "https://www.youtube.com/watch?v=dpw9EHDh2bM",
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=640&q=80",
        sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        transcript: [
          { start: 0, end: 60, text: "Welcome to advanced React patterns. Today we demystify hooks, fiber rendering, and performance bottlenecks." },
          { start: 61, end: 180, text: "useState provides local component state that triggers a schedule pass whenever setter functions are called with new references." },
          { start: 181, end: 320, text: "Remember that React compares previous and next states using Object.is shallow reference equality." },
          { start: 321, end: 450, text: "useEffect handles side effects after paint. The dependency array acts as an optimization guard." },
          { start: 451, end: 540, text: "If you omit the dependency array, the effect runs after every single render pass, which can cause severe memory or network leaks." },
          { start: 541, end: 600, text: "A cleanup function returned by useEffect runs right before the component unmounts or prior to the next effect execution." },
          { start: 601, end: 780, text: "useMemo caches computed values, whereas useCallback caches function reference definitions between re-renders." },
          { start: 781, end: 950, text: "Premature optimization with useMemo has memory overhead; use it primarily for expensive transformations or referential stability in context." },
          { start: 951, end: 1200, text: "Custom hooks allow extracting reusable stateful logic into isolated, testable JavaScript functions." }
        ]
      },
      {
        id: "neural-nets-deep-learning",
        title: "Deep Learning: Neural Network Backpropagation & Activation Functions",
        channel: "DeepMind Learning",
        platform: "youtube",
        duration: 3000, // 50 minutes
        url: "https://www.youtube.com/watch?v=Ilg3gGewQ5U",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=640&q=80",
        sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        transcript: [
          { start: 0, end: 90, text: "In this lecture we explore deep multi-layer perceptrons, forward propagation, and the backpropagation algorithm." },
          { start: 91, end: 240, text: "Each artificial neuron computes an affine transformation z = w dot x + b, followed by a non-linear activation function sigma(z)." },
          { start: 241, end: 420, text: "Without non-linear activation functions, a network with 100 hidden layers collapses mathematically into a single linear regression model." },
          { start: 421, end: 560, text: "ReLU (Rectified Linear Unit), defined as max(0, z), solves the vanishing gradient problem inherent in sigmoid and tanh activations for positive inputs." },
          { start: 561, end: 600, text: "However, ReLU can suffer from the 'Dying ReLU' problem when activations become permanently zero and gradients vanish for negative inputs." },
          { start: 601, end: 750, text: "Backpropagation is the computational application of the chain rule from calculus, propagating errors backwards from output to inputs." },
          { start: 751, end: 900, text: "By caching intermediate layer activations during the forward pass, backpropagation avoids recalculating identical sub-expressions." },
          { start: 901, end: 1100, text: "Regularization techniques such as Dropout and Weight Decay (L2 penalty) prevent overfitting on complex training patterns." }
        ]
      }
    ]
  });
});

// Serve verified Chrome Extension ZIP package
quizRouter.get("/extension/download", (req, res) => {
  const zipPath = path.resolve(process.cwd(), "public/studylens-ai-youtube-extension.zip");
  if (fs.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="studylens-ai-youtube-extension.zip"');
    return res.sendFile(zipPath);
  }
  res.status(404).json({ error: "Extension zip not found. Please generate it first." });
});
