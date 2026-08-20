# Kỹ năng Sinh Quiz cho Hệ thống StudyLens AI (CreateQuizSkill)

Kỹ năng `CreateQuizSkill` là một module AI lõi chịu trách nhiệm phân tích luồng transcript theo thời gian thực từ video học tập, đánh giá mức độ đầy đủ của ngữ cảnh kiến thức (Context Completeness) và tự động tạo bài kiểm tra (Knowledge Check Quiz) được neo chính xác với mốc thời gian (Timestamp Grounding).

---

## 1. Mục tiêu và Nguyên tắc Lõi

1. **Không tạo quiz bừa bãi**:
   - Hệ thống **chỉ** tạo quiz khi người học đã tiếp nhận đủ thông tin hoàn chỉnh về ít nhất 1 khái niệm (Định nghĩa, Chức năng, Cơ chế hoạt động, Quy trình hoặc Quan hệ nhân quả).
   - Nếu giảng viên chỉ mới giới thiệu khái niệm (ví dụ: *"Tiếp theo chúng ta sẽ tìm hiểu về TCP"*), hệ thống trả về `readyForQuiz = false` kèm `contextScore` và lý do `reason`.

2. **Grounding & Evidence tuyệt đối**:
   - Mọi câu hỏi và đáp án đúng **bắt buộc** phải được chứng minh trực tiếp từ trích đoạn transcript.
   - Trả về `source.start` và `source.end` với timestamp hẹp (15s – 45s) để học viên có thể click nhảy trực tiếp tới đoạn video chứa kiến thức đó.

3. **Hỗ trợ Đa ngôn ngữ (Cross-Language Capability)**:
   - Hỗ trợ nguồn video bằng tiếng Anh hoặc tiếng Việt, và xuất câu hỏi, đáp án, giải thích sang ngôn ngữ mục tiêu của học viên (mặc định là Tiếng Việt `vi`).
   - Giữ nguyên các thuật ngữ kỹ thuật chuẩn quốc tế (ví dụ: *Gradient Descent*, *Cost Function*, *Overfitting*, *Backpropagation*, *TCP/UDP*).

4. **Thích ứng người học (Adaptive Learning)**:
   - Tiếp nhận `learnerWeakConcepts` và `previouslyTestedConcepts` để tránh lặp câu hỏi và tập trung củng cố các phần học viên làm sai.

---

## 2. Luồng Xử Lý (Execution Pipeline)

```
[Transcript Segments + Video Metadata]
                 │
                 ▼
      [1. Input Validation (Zod)]
                 │
                 ▼
        [2. Cache Lookup]
          ├── Hit ──► Trả về kết quả ngay
          └── Miss ─┐
                    ▼
     [3. Local Heuristic Pre-filter]
      (Kiểm tra độ dài buffer, transition cues)
                    │
                    ▼
   [4. Gemini 3.7 Flash Reasoning Engine]
      - Concept Extraction & Categorization
      - Completeness Score (0.0 -> 1.0)
      - Quiz-Worthiness Score (0.0 -> 1.0)
      - Decision: readyForQuiz (true/false)
      - Structured JSON Questions with Strict Grounding
                    │
                    ▼
      [5. Schema Normalization & Guard]
                    │
                    ▼
      [6. Cache Write & Return Result]
```

---

## 3. Cấu trúc Input & Output

### 3.1 Input Schema (`CreateQuizSkillInput`)

```typescript
interface CreateQuizSkillInput {
  videoId: string;
  videoTitle: string;
  sourceLanguage?: string; // "en" | "vi" | "auto"
  targetLanguage: string;   // "vi" | "en" | "ja" | ...
  contextStart: number;     // giây bắt đầu buffer
  contextEnd: number;       // giây kết thúc buffer
  transcript: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  previouslyTestedConcepts?: Array<string | {
    concept: string;
    question?: string;
    wasCorrect?: boolean;
  }>;
  learnerWeakConcepts?: string[];
  difficulty?: "easy" | "medium" | "hard" | "adaptive";
  maxQuestions?: number;    // 1 - 5 (mặc định: 3)
  frequency?: "low" | "balanced" | "high";
  adaptiveAccuracy?: number; // 0.0 - 1.0
}
```

### 3.2 Output Schema (`CreateQuizSkillResult`)

```typescript
interface CreateQuizSkillResult {
  readyForQuiz: boolean;     // true nếu đã đủ kiến thức hoàn chỉnh
  contextScore: number;     // 0.0 -> 1.0 (độ hoàn thiện ngữ cảnh)
  contextSummary: string;   // Tóm tắt nội dung bài học trong đoạn này
  detectedConcepts: Array<{
    id: string;
    name: string;
    type: "definition" | "function" | "mechanism" | "process" | "relationship" | "comparison" | "cause_effect";
    keywords: string[];
    summary: string;
    completenessScore: number;
    quizWorthinessScore: number;
    evidence: {
      start: number;
      end: number;
      textSnippet?: string;
    };
  }>;
  selectedConcepts: string[];
  questions: Array<{
    id: string;
    conceptId: string;
    concept: string;
    knowledgeType: string;
    type: "multiple_choice" | "true_false";
    question: string;
    options: string[];
    correctAnswer: number;   // Index 0, 1, 2, 3
    explanation: string;
    source: {
      start: number;
      end: number;
      textSnippet?: string;
    };
    difficulty: "easy" | "medium" | "hard";
    confidence: number;
  }>;
  reason?: string;          // Lý do nếu readyForQuiz = false
}
```

---

## 4. REST API Endpoint

Kỹ năng được tích hợp trực tiếp qua endpoint `/api/quiz/skill/create`:

- **Method**: `POST`
- **Path**: `/api/quiz/skill/create`
- **Request Body**: JSON theo định dạng `CreateQuizSkillInput`
- **Response**: JSON theo định dạng `CreateQuizSkillResult`
