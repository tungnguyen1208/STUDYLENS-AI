# 📜 Lịch Sử Cập Nhật & Thay Đổi Hệ Thống (StudyLens AI)

Tài liệu này ghi lại toàn bộ lịch sử cập nhật, tóm tắt các tính năng/nâng cấp mới và danh sách các file được tạo mới hoặc chỉnh sửa trong hệ thống StudyLens AI for YouTube.

---

## 📌 [Phiên bản 2.3.1] - 2026-08-21
### 🎯 Tóm tắt nội dung nâng cấp:
- **Chuẩn hóa & Mở rộng Tài liệu Context Hệ thống (`AGENTS.md`)**:
  - Bổ sung toàn diện bối cảnh dự án, ý tưởng cốt lõi, triết lý sư phạm (Active Recall, Context Completeness, Timestamp Grounding).
  - Liệt kê chi tiết 6 phân hệ chức năng (Learning, Review Queue, History, Analytics, Settings, Chrome Extension Packager).
  - Cập nhật đầy đủ sơ đồ cây thư mục (Project Structure) từ Frontend, Backend, AI Skills cho tới Chrome Extension Manifest V3.
  - Vẽ chi tiết sơ đồ luồng hoạt động End-to-End từ trích xuất transcript, đánh giá ngữ cảnh, sinh quiz và lưu trữ hàng đợi ôn tập.
  - Chuẩn hóa tài liệu API Contract (`POST /api/quiz/skill/create`) kèm payload mẫu chuẩn xác.
  - Bổ sung các nguyên tắc phát triển & chỉ dẫn lập trình an toàn dành cho CODEX và các AI Coding Agents.

### 📁 Danh sách file thay đổi & tạo mới:
- **Tạo mới**: Không có
- **Chỉnh sửa**:
  - `/AGENTS.md` (bổ sung toàn bộ tài liệu context dự án)
  - `/CHANGELOG.md` (ghi nhận mốc phiên bản 2.3.1)

---

## 📌 [Phiên bản 2.3.0] - 2026-08-20
### 🎯 Tóm tắt nội dung nâng cấp:
- **Xây dựng Kỹ năng AI Lõi (`CreateQuizSkill`)**:
  - Triển khai toàn bộ quy trình phân tích transcript đa ngôn ngữ, tự động nhận diện thực thể tri thức (khái niệm, định nghĩa, cơ chế, quy trình, quan hệ nhân quả, so sánh).
  - Tích hợp bộ đánh giá độ đầy đủ ngữ cảnh (`completenessScore`) và mức độ đáng kiểm tra (`quizWorthinessScore`), chỉ kích hoạt bài kiểm tra khi người học đã được cung cấp đủ dữ kiện có ý nghĩa (`readyForQuiz: true`).
  - Hỗ trợ học tập thích ứng (Adaptive Learning) thông qua `previouslyTestedConcepts` và `learnerWeakConcepts` nhằm chống lặp câu hỏi và tăng cường củng cố phần kiến thức yếu.
  - Neo bằng chứng thời gian chính xác (`Timestamp Grounding`) với dải thời gian hẹp (15s – 45s) để người học click xem lại trực tiếp trên YouTube.
  - Tích hợp cơ chế Structured Output với schema Zod nghiêm ngặt, cơ chế Caching và giải pháp dự phòng có kiểm soát.
- **Mở rộng API Endpoint**:
  - Bổ sung route `POST /api/quiz/skill/create` kết nối với `CreateQuizSkill`.
- **Tài liệu hóa**:
  - Khởi tạo file theo dõi lịch sử cập nhật (`CHANGELOG.md`).

### 📁 Danh sách file thay đổi & tạo mới:
- **Tạo mới**:
  - `/server/skills/create-quiz/createQuizSkill.types.ts`
  - `/server/skills/create-quiz/createQuizSkill.schema.ts`
  - `/server/skills/create-quiz/createQuizSkill.prompt.ts`
  - `/server/skills/create-quiz/createQuizSkill.ts`
  - `/server/skills/create-quiz/createQuizSkill.test.ts`
  - `/server/skills/create-quiz/README.md`
  - `/CHANGELOG.md`
- **Chỉnh sửa**:
  - `/server/routes/quiz.ts` (thêm route `POST /quiz/skill/create`)
  - `/package.json` (bổ sung dependency `zod`)

---

## 📌 [Phiên bản 2.2.0] - 2026-08-20
### 🎯 Tóm tắt nội dung nâng cấp:
- **Đồng bộ hóa môi trường Chrome Extension & Web Preview**:
  - Hỗ trợ chạy song song 2 chế độ: Chế độ Web Interactive Studio Preview (mô phỏng người học và bài giảng) và Chế độ Side Panel thật trên Google Chrome / Edge (`sidepanel.html`).
  - Tự động đóng gói Bundle Extension (Manifest V3) qua script `build-extension-files.js`, biên dịch Content Script, Service Worker, và biểu tượng PNG độ nét cao vào file `.zip` sẵn sàng tải lên `chrome://extensions`.
- **Bộ theo dõi ngữ cảnh ngữ nghĩa (`SemanticContextTracker`)**:
  - Theo dõi liên tục mức độ tích lũy thông tin theo thời gian thực (real-time playback ticks).
  - Đánh giá chỉ số sẵn sàng kiến thức (`contextReadiness`) và tự động tạm dừng video khi xuất hiện mốc kiểm tra kiến thức quan trọng.

### 📁 Danh sách file thay đổi & tạo mới:
- **Tạo mới**:
  - `/sidepanel.html`
  - `/src/sidepanel.tsx`
  - `/scripts/build-extension-files.js`
- **Chỉnh sửa**:
  - `/vite.config.ts` (cấu hình multi-page input cho `index.html` và `sidepanel.html`)
  - `/src/App.tsx` (tích hợp phát hiện runtime extension / web preview, đồng bộ hóa 5 tab)
  - `/server.ts` (hỗ trợ phục vụ các route demo và tài nguyên mở rộng)

---

## 📌 [Phiên bản 2.1.0] - 2026-08-19
### 🎯 Tóm tắt nội dung nâng cấp:
- **Giao diện 5 Tab chuyên nghiệp & Chuẩn hóa Tiếng Việt**:
  - Hoàn thiện 5 tab chức năng: **Học tập (Learning)**, **Ôn tập (Review Queue)**, **Lịch sử (History)**, **Thống kê (Analytics)**, và **Cài đặt (Settings)**.
  - Hỗ trợ đổi giao diện Linh hoạt: Sáng (Light), Tối (Dark), và Theo hệ thống (System Theme).
  - Tích hợp hệ thống Gamification: Tích lũy điểm kinh nghiệm (XP), chuỗi ngày học liên tục (Streak), và đo lường độ chính xác (Accuracy Rate).
- **Hàng đợi ôn tập lặp lại ngắt quãng (Spaced Repetition Review Queue)**:
  - Tự động lưu các câu trả lời sai vào hàng đợi kèm timestamp và đoạn văn bản giải thích.
  - Cho phép người học nhấn "Xem lại trên video" để nhảy thẳng đến đúng mốc thời gian bài giảng.

### 📁 Danh sách file thay đổi & tạo mới:
- **Tạo mới**:
  - `/src/i18n/index.tsx`
  - `/src/components/Navbar.tsx`
  - `/src/components/VideoPlayer.tsx`
  - `/src/components/SidePanel.tsx`
  - `/src/components/QuizCard.tsx`
  - `/src/components/ReviewQueue.tsx`
  - `/src/components/AnalyticsTab.tsx`
  - `/src/components/HistoryTab.tsx`
  - `/src/components/ExtensionPackager.tsx`
- **Chỉnh sửa**:
  - `/src/index.css` (định nghĩa biến màu sắc CSS variables cho Light/Dark/System)
  - `/src/types/index.ts` (bổ sung các interface dữ liệu toàn cục)

---

## 📌 [Phiên bản 1.0.0] - 2026-08-18
### 🎯 Tóm tắt nội dung khởi tạo:
- Khởi tạo kiến trúc ứng dụng StudyLens AI kết hợp Express backend và React + Tailwind CSS client.
- Tích hợp Google Gemini API qua `@google/genai` để sinh câu hỏi trắc nghiệm từ transcript video.
- Xây dựng giao diện đồng bộ transcript thời gian thực và trình phát video mô phỏng bài giảng kỹ thuật.

### 📁 Danh sách file thay đổi & tạo mới:
- `/server.ts`
- `/server/gemini.ts`
- `/server/routes/quiz.ts`
- `/server/prompts/quiz.prompt.ts`
- `/server/prompts/context.prompt.ts`
- `/src/main.tsx`
- `/src/App.tsx`
- `/package.json`
- `/metadata.json`
