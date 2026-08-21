# Project Instructions & Conventions — StudyLens AI

Tài liệu này cung cấp toàn bộ bối cảnh kiến trúc, ý tưởng cốt lõi, công nghệ, cấu trúc thư mục, luồng dữ liệu và quy chuẩn phát triển dành cho CODEX, AI Coding Agents và các kỹ sư phát triển tiếp nối dự án **StudyLens AI for YouTube**.

---

## 1. Quy định cập nhật lịch sử thay đổi (Changelog Protocol)

> ⚠️ **BẮT BUỘC TUÂN THỦ (MANDATORY RULE)**:
> Mỗi khi thực hiện sửa lỗi, tối ưu mã nguồn, bổ sung tính năng hoặc nâng cấp hệ thống:
> 1. **Luôn cập nhật file `/CHANGELOG.md`**.
> 2. **Ghi rõ phiên bản / mốc thời gian, tóm tắt các điểm cải tiến / tính năng mới**.
> 3. **Liệt kê danh sách các file được tạo mới (`Tạo mới`) và danh sách các file được chỉnh sửa (`Chỉnh sửa`)**.
> 4. Giữ phong cách trình bày chuyên nghiệp, rõ ràng bằng tiếng Việt.

---

## 2. Ý tưởng Cốt lõi & Tầm nhìn Dự án (Vision & Core Concept)

**StudyLens AI** là một hệ thống trợ lý học tập thông minh thời gian thực dành cho video bài giảng trên YouTube (dưới dạng Web Application mô phỏng và Google Chrome Extension Manifest V3).

### Vấn đề giải quyết:
- Học qua video YouTube thường mang tính chất **thụ động (Passive Consumption)**: Người học xem liên tục hàng chục phút nhưng dễ mất tập trung, không tự kiểm tra được mức độ hiểu bài và nhanh chóng quên kiến thức (đường cong quên lãng Ebbinghaus).
- Các công cụ tạo trắc nghiệm AI truyền thống thường sinh câu hỏi toàn bài một cách máy móc, hỏi những chi tiết vụn vặt (trivia) hoặc hỏi trước khi giảng viên kịp giải thích xong khái niệm.

### Giải pháp của StudyLens AI:
1. **Chủ động hóa việc học (Active Recall & Real-time Checkpoints)**: Lắng nghe dòng transcript của video theo thời gian thực, đánh giá mức độ tích lũy tri thức và tự động tạm dừng video để đưa ra câu hỏi trắc nghiệm tương tác đúng lúc.
2. **Nguyên tắc Sư phạm & Ngữ cảnh đầy đủ (Context Completeness)**: Hệ thống **chỉ tạo quiz** khi giảng viên đã giải thích trọn vẹn ít nhất một đơn vị tri thức (Định nghĩa, Chức năng, Cơ chế hoạt động, Quy trình, Quan hệ nhân quả, hoặc So sánh). Nếu chỉ mới giới thiệu tên khái niệm, hệ thống trả về `readyForQuiz: false`.
3. **Neo bằng chứng thời gian (Timestamp Grounding)**: Mọi câu hỏi và đáp án đều được gắn với dải thời gian hẹp (15s – 45s) trong bài giảng, cho phép người học bấm xem lại trực tiếp đoạn video chứng minh.
4. **Lặp lại ngắt quãng (Spaced Repetition Review Queue)**: Tự động gom các câu trả lời sai vào hàng đợi ôn tập thông minh kèm trích đoạn giải thích.

---

## 3. Các Chức Năng Chính (Key Features)

| Phân hệ / Tab | Chức năng chi tiết |
| :--- | :--- |
| **Học tập (Learning Tab)** | • Trình phát video bài giảng tích hợp thanh theo dõi tiến độ tri thức.<br>• Bộ theo dõi ngữ cảnh ngữ nghĩa (`SemanticContextTracker`) hiển thị chỉ số sẵn sàng (`contextReadiness`).<br>• Hiển thị Transcript đồng bộ theo thời gian thực với chức năng dịch và highlight.<br>• Thẻ câu hỏi trắc nghiệm tương tác (`QuizCard`) kèm phản hồi giải thích chi tiết và nút "Xem lại đoạn video này". |
| **Hàng đợi Ôn tập (Review Queue)** | • Tự động lưu trữ các câu hỏi học viên trả lời sai hoặc cần củng cố.<br>• Hỗ trợ lọc theo video, tìm kiếm khái niệm, gắn nhãn độ khó.<br>• Nút "Xem lại trên video" tự động chuyển đến đúng mốc giây phát sinh kiến thức. |
| **Lịch sử Học tập (History Tab)** | • Nhật ký chi tiết các phiên học, video đã xem, số câu hỏi đã trả lời.<br>• Xem lại toàn bộ câu hỏi, đáp án đã chọn và độ chính xác của từng phiên. |
| **Thống kê & Gamification (Analytics)** | • Chỉ số tổng quan: Điểm kinh nghiệm (XP), Chuỗi ngày học (Streak), Tỷ lệ chính xác (Accuracy %).<br>• Biểu đồ phân bổ mức độ hiểu bài theo thời gian (Recharts).<br>• Radar Chart phân tích năng lực theo 6 nhóm tri thức (Định nghĩa, Cơ chế, Ứng dụng, v.v.). |
| **Cài đặt (Settings Tab)** | • Tùy chỉnh tần suất xuất hiện quiz (Thấp / Cân bằng / Dày đặc).<br>• Độ khó câu hỏi (Dễ / Trung bình / Nâng cao / Tự thích ứng - Adaptive).<br>• Chế độ hiển thị: Sáng (Light), Tối (Dark), Theo hệ thống (System).<br>• Tùy chọn ngôn ngữ mục tiêu (Tiếng Việt `vi` / Tiếng Anh `en`). |
| **Chrome Extension Packager** | • Trình xuất gói cài đặt Chrome Extension (Manifest V3) dạng `.zip`.<br>• Hướng dẫn cài đặt trực tiếp vào trình duyệt qua chế độ Developer Mode (`chrome://extensions`). |

---

## 4. Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Web UI & Side Panel Extension)
- **Framework**: React 18+ với TypeScript (Vite bundler).
- **Styling**: Tailwind CSS (chế độ Theme động Light/Dark/System qua CSS variables).
- **Icons**: `lucide-react`.
- **Biểu đồ**: `recharts`.
- **Animations**: `motion` (Framer Motion).
- **Đa ngôn ngữ (i18n)**: Module dịch thuật nội bộ hỗ trợ Tiếng Việt và Tiếng Anh.

### Backend & AI Engine
- **Runtime**: Node.js với Express.
- **AI SDK**: `@google/genai` (Google Gen AI SDK chính thức), sử dụng model `gemini-3.7-flash`.
- **Validation**: `zod` (Xác thực dữ liệu đầu vào và runtime schema đầu ra).
- **Kỹ năng Lõi (`CreateQuizSkill`)**:
  - Prompt Engineering theo cấu trúc sư phạm chuyên sâu.
  - Phân tích ngữ cảnh đa ngôn ngữ (chuyển ngữ câu hỏi tiếng Anh sang tiếng Việt tự nhiên nhưng giữ nguyên thuật ngữ kỹ thuật quốc tế).
  - Hệ thống Cache nội bộ (In-memory caching) và bộ lọc Heuristic giúp tiết kiệm chi phí gọi API.
  - Chế độ Offline Rule-based fallback an toàn khi mất kết nối.
- **Khả năng Mở rộng (Alternative Backend)**: Tương thích với server suy luận **vLLM** tự host (OpenAI-compatible format) chạy các mô hình mã nguồn mở như `Qwen2.5-7B-Instruct` hoặc `Qwen2.5-14B-Instruct`.

### Chrome Extension (Manifest V3)
- **Manifest V3 Architecture**:
  - `sidepanel.html` & `sidepanel.tsx`: Giao diện điều khiển chạy bên cạnh YouTube.
  - `background.js` (Service Worker): Quản lý vòng đời extension, lắng nghe tab YouTube và mở Side Panel khi click icon.
  - `content.js`: Trích xuất transcript từ trình phát YouTube (`ytd-transcript-renderer` / player captions API), đồng bộ playback ticks và gửi message về Side Panel.

---

## 5. Cấu Trúc Thư Mục Dự Án (Project Structure)

```
/
├── AGENTS.md                  # Tài liệu hướng dẫn quy chuẩn cho AI & Developers
├── CHANGELOG.md               # Lịch sử cập nhật phiên bản & danh sách file thay đổi
├── metadata.json              # Cấu hình định danh ứng dụng Google AI Studio
├── package.json               # Quản lý dependencies và scripts (dev, build, start)
├── tsconfig.json              # Cấu hình TypeScript
├── vite.config.ts             # Cấu hình Vite build (hỗ trợ multi-page: index.html & sidepanel.html)
├── server.ts                  # Điểm khởi chạy backend Express và middleware Vite
├── sidepanel.html             # Entry point HTML cho Chrome Extension Side Panel
├── index.html                 # Entry point HTML cho Web Preview App
│
├── server/                    # MÃ NGUỒN BACKEND
│   ├── gemini.ts              # Adapter tương tác Gemini API qua @google/genai
│   ├── routes/                # Các API routes (Express Routers)
│   │   ├── quiz.ts            # Route xử lý quiz, context analysis và skill endpoint
│   │   └── transcript.ts      # Route quản lý và nạp transcript video mẫu
│   ├── prompts/               # Thư viện prompt phụ trợ
│   │   ├── quiz.prompt.ts     # Prompt sinh câu hỏi đơn lẻ
│   │   ├── context.prompt.ts  # Prompt đánh giá độ chín của ngữ cảnh
│   │   └── explanation.prompt.ts # Prompt giải thích chi tiết
│   └── skills/                # KIẾN TRÚC KỸ NĂNG AI (AI SKILLS MODULE)
│       └── create-quiz/       # Module CreateQuizSkill lõi
│           ├── createQuizSkill.types.ts   # Khai báo TypeScript types (Input, Output, Concepts)
│           ├── createQuizSkill.schema.ts  # Khai báo Zod runtime schemas
│           ├── createQuizSkill.prompt.ts  # Prompt chuyên sâu phân tích ngữ cảnh & tri thức
│           ├── createQuizSkill.ts         # Engine thực thi AI + Cache + Validation
│           ├── createQuizSkill.test.ts    # Bộ kịch bản kiểm thử tự động
│           └── README.md                  # Hướng dẫn kỹ thuật cho CreateQuizSkill
│
├── src/                       # MÃ NGUỒN FRONTEND (REACT + TYPESCRIPT)
│   ├── main.tsx               # Entry point cho Web Studio App
│   ├── sidepanel.tsx          # Entry point cho Chrome Side Panel App
│   ├── App.tsx                # Component gốc điều phối 5 tab và môi trường runtime
│   ├── index.css              # CSS toàn cục (Tailwind + CSS Variables theming)
│   ├── types/                 # Kiểu dữ liệu TypeScript dùng chung cho Frontend
│   │   └── index.ts           # Interfaces cho Quiz, Question, Session, Transcript, UserStats
│   ├── i18n/                  # Hệ thống từ điển đa ngôn ngữ (vi / en)
│   │   └── index.tsx          # Hook useTranslation và bộ từ điển hoàn chỉnh
│   ├── services/              # Các service xử lý nghiệp vụ phía client
│   │   ├── api.ts             # Client gọi API backend Express (/api/quiz, /api/context)
│   │   ├── storage.ts         # Quản lý localStorage / chrome.storage cho lịch sử & thống kê
│   │   └── semanticTracker.ts # SemanticContextTracker theo dõi luồng thời gian thực
│   └── components/            # Các UI Components được module hóa
│       ├── Navbar.tsx         # Thanh điều hướng trên cùng kèm thông số Streak/XP/Level
│       ├── VideoPlayer.tsx    # Trình phát video bài giảng với thanh tiến trình tri thức
│       ├── SidePanel.tsx      # Bảng điều khiển học tập và danh sách câu hỏi
│       ├── QuizCard.tsx       # Thẻ trắc nghiệm tương tác thời gian thực
│       ├── ReviewQueue.tsx    # Giao diện hàng đợi ôn tập ngắt quãng
│       ├── HistoryTab.tsx     # Giao diện xem lại lịch sử các buổi học
│       ├── AnalyticsTab.tsx   # Dashboard phân tích chỉ số và biểu đồ năng lực
│       └── ExtensionPackager.tsx # Giao diện đóng gói và hướng dẫn cài đặt Extension
│
├── extension/                 # TÀI NGUYÊN CHROME EXTENSION (MANIFEST V3)
│   ├── manifest.json          # Khai báo permissions (sidePanel, storage, activeTab)
│   ├── background.js          # Service Worker mở Side Panel khi click extension icon
│   ├── content.js             # Content Script inject vào tab youtube.com
│   └── icons/                 # Bộ biểu tượng extension (16x16, 48x48, 128x128)
│
└── scripts/                   # CÁC SCRIPT TIỆN ÍCH
    └── build-extension-files.js # Script tự động biên dịch và nén file extension.zip
```

---

## 6. Luồng Hoạt Động Của Hệ Thống (End-to-End Workflow)

```
[1. Người học phát video YouTube]
               │
               ▼
[2. Content Script / Web Video Player]
  - Trích xuất timestamp và các đoạn phụ đề (transcript stream).
  - Gửi sự kiện Playback Tick (mỗi 1 - 2 giây) về SemanticContextTracker.
               │
               ▼
[3. SemanticContextTracker (Client)]
  - Tích lũy buffer ngữ cảnh [contextStart -> contextEnd].
  - Đánh giá từ khóa, độ dày thông tin và xác định ngưỡng sẵn sàng.
  - Khi đạt điểm mốc (checkpoint) ──► Gửi yêu cầu tới Backend API.
               │
               ▼
[4. Backend API: POST /api/quiz/skill/create]
  - CreateQuizSkill xác thực schema qua Zod.
  - Kiểm tra Cache; nếu chưa có, gọi Gemini 3.7 Flash.
  - Gemini thực hiện:
      a) Nhận diện thực thể tri thức (Định nghĩa, Cơ chế, Quy trình, v.v.).
      b) Tính completenessScore & quizWorthinessScore.
      c) Quyết định readyForQuiz (true/false).
      d) Tạo câu hỏi trắc nghiệm, 3 phương án nhiễu, đáp án đúng & timestamp bằng chứng.
               │
               ▼
[5. Phản hồi về Frontend]
  ├── readyForQuiz = false ──► Tiếp tục xem video, cập nhật thanh tiến trình ngữ cảnh.
  └── readyForQuiz = true  ──► Tự động TẠM DỪNG VIDEO & Hiển thị QuizCard.
               │
               ▼
[6. Người học tương tác với QuizCard]
  - Chọn đáp án ──► Hiển thị giải thích & timestamp nguồn [Start - End].
  - Bấm "Xem lại đoạn này" ──► Trình phát nhảy về đúng mốc thời gian bài giảng.
  - Nếu làm ĐÚNG ──► Cộng điểm XP, cập nhật Streak, lưu lịch sử.
  - Nếu làm SAI  ──► Tự động thêm vào Review Queue để ôn tập lại ngắt quãng.
```

---

## 7. Quy Chuẩn API Contracts

### Endpoint chính: `POST /api/quiz/skill/create`

#### Request Body (`CreateQuizSkillInput`):
```json
{
  "videoId": "ml-lecture-01",
  "videoTitle": "Stanford CS229: Machine Learning - Gradient Descent",
  "sourceLanguage": "en",
  "targetLanguage": "vi",
  "contextStart": 300,
  "contextEnd": 480,
  "transcript": [
    { "start": 300, "end": 340, "text": "Gradient descent is an iterative optimization algorithm..." },
    { "start": 341, "end": 390, "text": "The learning rate alpha dictates the step size..." }
  ],
  "previouslyTestedConcepts": ["Loss Function"],
  "learnerWeakConcepts": ["Learning Rate Divergence"],
  "difficulty": "adaptive",
  "maxQuestions": 2,
  "frequency": "balanced"
}
```

#### Response Body (`CreateQuizSkillResult`):
```json
{
  "readyForQuiz": true,
  "contextScore": 0.88,
  "contextSummary": "Giảng viên đã giải thích trọn vẹn thuật toán Gradient Descent và vai trò của tốc độ học (Learning Rate).",
  "detectedConcepts": [
    {
      "id": "concept_1",
      "name": "Gradient Descent",
      "type": "mechanism",
      "keywords": ["optimization", "iteration", "learning rate"],
      "summary": "Thuật toán cập nhật tham số để cực tiểu hóa hàm mất mát.",
      "completenessScore": 0.95,
      "quizWorthinessScore": 0.92,
      "evidence": { "start": 300, "end": 390, "textSnippet": "Gradient descent is an iterative optimization algorithm..." }
    }
  ],
  "selectedConcepts": ["concept_1"],
  "questions": [
    {
      "id": "q_1",
      "conceptId": "concept_1",
      "concept": "Gradient Descent",
      "knowledgeType": "mechanism",
      "type": "multiple_choice",
      "question": "Trong thuật toán Gradient Descent, điều gì sẽ xảy ra nếu tốc độ học (learning rate α) được đặt quá lớn?",
      "options": [
        "Thuật toán có thể vượt quá điểm cực tiểu và phân kỳ (diverge)",
        "Thuật toán sẽ luôn hội tụ nhanh hơn về điểm tối ưu toàn cục",
        "Hàm mất mát sẽ tự động giảm về 0 ngay sau vòng lặp đầu tiên",
        "Số lượng tham số mô hình sẽ bị giảm đi một nửa"
      ],
      "correctAnswer": 0,
      "explanation": "Theo bài giảng, nếu tốc độ học alpha quá lớn, các bước cập nhật sẽ bị nhảy qua điểm cực tiểu và làm thuật toán phân kỳ thay vì hội tụ.",
      "source": { "start": 341, "end": 390, "textSnippet": "If alpha is too large, gradient descent can overshoot and diverge." },
      "difficulty": "medium",
      "confidence": 0.96
    }
  ]
}
```

---

## 8. Nguyên Tắc Thiết Kế & Lập Trình Dành Cho CODEX / AI Assistants

1. **Tuân thủ TypeScript & Type Safety**:
   - Mọi interface phải được import từ `/src/types/index.ts` hoặc `/server/skills/create-quiz/createQuizSkill.types.ts`.
   - Tránh sử dụng `any` bừa bãi.
2. **Không phá vỡ Timestamp Grounding**:
   - Mọi câu hỏi sinh ra từ AI bắt buộc phải có trường `source: { start: number, end: number }` hợp lệ để người học có thể click xem lại video.
3. **Giữ nguyên thuật ngữ kỹ thuật khi chuyển ngữ**:
   - Khi dịch câu hỏi sang Tiếng Việt (`targetLanguage: "vi"`), giữ nguyên các danh từ kỹ thuật quốc tế (ví dụ: *Backpropagation, Overfitting, Cache, TCP Handshake, SVD, Gradient Descent*).
4. **Bảo toàn giao diện Clean & Responsive**:
   - Thiết kế chuẩn Mobile-first và Desktop-responsive với Tailwind CSS.
   - Hỗ trợ đầy đủ trạng thái Light / Dark Mode.
   - Tránh các cliché thiết kế AI kém chất lượng (AI Slop).
5. **Cập nhật CHANGELOG.md sau mỗi lần chỉnh sửa**:
   - Luôn thực hiện cập nhật `/CHANGELOG.md` theo quy định tại Mục 1.
