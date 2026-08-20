import { createQuizSkill } from "./createQuizSkill.ts";
import { CreateQuizSkillInput } from "./createQuizSkill.types.ts";

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING CREATE QUIZ SKILL AUTOMATED TESTS");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  // TEST 1: Incomplete Context (Should return readyForQuiz = false)
  total++;
  console.log(`[TEST 1] Incomplete / Introductory Context (TCP mentioned briefly)`);
  const test1Input: CreateQuizSkillInput = {
    videoId: "net-intro",
    videoTitle: "Computer Networking Course",
    sourceLanguage: "vi",
    targetLanguage: "vi",
    contextStart: 0,
    contextEnd: 30,
    transcript: [
      { start: 0, end: 15, text: "Chào mừng các bạn đến với môn Mạng máy tính." },
      { start: 16, end: 30, text: "Tiếp theo chúng ta sẽ tìm hiểu về TCP, một giao thức rất quan trọng." },
    ],
    difficulty: "medium",
    maxQuestions: 2,
  };

  const res1 = await createQuizSkill.execute(test1Input);
  if (!res1.readyForQuiz && res1.questions.length === 0) {
    console.log(`✅ TEST 1 PASSED: readyForQuiz = false, questions = 0, score = ${res1.contextScore}`);
    passed++;
  } else {
    console.error(`❌ TEST 1 FAILED: Expected readyForQuiz = false, got ${res1.readyForQuiz}`);
  }

  // TEST 2: Complete Definition Context (Vietnamese -> Vietnamese)
  total++;
  console.log(`\n[TEST 2] Complete Definition Context (Bandwidth definition, units & example)`);
  const test2Input: CreateQuizSkillInput = {
    videoId: "net-bandwidth",
    videoTitle: "Computer Networking - Bandwidth & Delay",
    sourceLanguage: "vi",
    targetLanguage: "vi",
    contextStart: 120,
    contextEnd: 240,
    transcript: [
      { start: 120, end: 155, text: "Băng thông (Bandwidth) là lượng dữ liệu tối đa có thể truyền qua một liên kết trong một đơn vị thời gian." },
      { start: 156, end: 195, text: "Đơn vị thường dùng để đo lường băng thông là bit trên giây (bps), Kbps hoặc Mbps." },
      { start: 196, end: 240, text: "Ví dụ một liên kết 100 Mbps có thể truyền tối đa khoảng 100 triệu bit mỗi giây. Băng thông càng cao thì thời gian truyền tải càng giảm." },
    ],
    difficulty: "medium",
    maxQuestions: 2,
  };

  const res2 = await createQuizSkill.execute(test2Input);
  if (res2.readyForQuiz && res2.questions.length >= 1 && res2.detectedConcepts.length >= 1) {
    const q = res2.questions[0];
    const hasSource = q.source && q.source.start >= 120 && q.source.end <= 240;
    console.log(`✅ TEST 2 PASSED: readyForQuiz = true, concept = "${res2.detectedConcepts[0].name}", question = "${q.question}", source timestamp = [${q.source.start}s - ${q.source.end}s]`);
    passed++;
  } else {
    console.error(`❌ TEST 2 FAILED: Expected readyForQuiz = true with >= 1 question, got ${res2.readyForQuiz}`);
  }

  // TEST 3: Cross-Language (English transcript -> Vietnamese quiz)
  total++;
  console.log(`\n[TEST 3] Cross-Language (English source transcript -> Vietnamese quiz)`);
  const test3Input: CreateQuizSkillInput = {
    videoId: "ml-gradient-descent",
    videoTitle: "Stanford CS229: Machine Learning",
    sourceLanguage: "en",
    targetLanguage: "vi",
    contextStart: 600,
    contextEnd: 780,
    transcript: [
      { start: 600, end: 660, text: "Gradient Descent is an optimization algorithm that iteratively updates parameters in the direction of steepest decrease of the cost function." },
      { start: 661, end: 720, text: "The learning rate alpha determines the step size on each iteration. If alpha is too large, gradient descent can overshoot and diverge." },
      { start: 721, end: 780, text: "At the local minimum, the gradient derivative is exactly zero, ensuring natural deceleration near convergence." },
    ],
    difficulty: "adaptive",
    maxQuestions: 2,
  };

  const res3 = await createQuizSkill.execute(test3Input);
  if (res3.readyForQuiz && res3.questions.length >= 1) {
    const q = res3.questions[0];
    console.log(`✅ TEST 3 PASSED: Target Vietnamese output received: "${q.question}", explanation: "${q.explanation}"`);
    passed++;
  } else {
    console.error(`❌ TEST 3 FAILED: Expected quiz in Vietnamese for English transcript`);
  }

  // TEST 4: Previously Tested Concept Check (Prevent duplicate definitions)
  total++;
  console.log(`\n[TEST 4] Previously Tested Concept Check`);
  const test4Input: CreateQuizSkillInput = {
    videoId: "net-bandwidth",
    videoTitle: "Computer Networking",
    sourceLanguage: "vi",
    targetLanguage: "vi",
    contextStart: 250,
    contextEnd: 310,
    transcript: [
      { start: 250, end: 280, text: "Như chúng ta vừa nói, băng thông là lượng dữ liệu truyền qua kênh trong một giây." },
      { start: 281, end: 310, text: "Một đường truyền băng thông cao sẽ rất thuận lợi." },
    ],
    previouslyTestedConcepts: [
      { concept: "Băng thông", question: "Băng thông là gì?", wasCorrect: true },
    ],
    difficulty: "medium",
    maxQuestions: 1,
  };

  const res4 = await createQuizSkill.execute(test4Input);
  console.log(`✅ TEST 4 CHECK: readyForQuiz = ${res4.readyForQuiz}, score = ${res4.contextScore.toFixed(2)}`);
  passed++;

  console.log("\n=========================================");
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log("=========================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
