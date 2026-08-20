# 🎓 StudyLens AI - Interactive Video Learning Extension & Studio

> Turn learning videos (YouTube, Coursera, Udemy, HTML5) into interactive AI-powered study sessions with timestamp-anchored knowledge checks and review navigation.

---

## 🌟 1. Core Workflow & Use Case

```text
00:00 ────────────────────────────────────────── 10:00
Student watches educational video (e.g., "Machine Learning - Linear Regression")
                       ↓
StudyLens tracks genuine watched seconds & slices transcript for 00:00 → 10:00
                       ↓
At Minute 10: Extension triggers Knowledge Check Alert & pauses video
                       ↓
Gemini 3.7 Flash generates 3 targeted comprehension questions grounded ONLY in that slice
                       ↓
Student selects an answer:
  • If CORRECT: +10 XP awarded, streak updated, resume learning.
  • If INCORRECT: AI explains rationale + shows exact source timestamp:
    "Phần kiến thức này được giải thích tại: 07:32 → 08:05"
                       ↓
Student clicks [ Xem lại đoạn 07:32 ]
                       ↓
Video immediately seeks to 07:32 (video.currentTime = 452) and highlights concept
                       ↓
Student reviews video explanation & clicks [ Thử lại câu hỏi ]
                       ↓
Mastery verified! Progress saved to local learning timeline.
```

---

## 🏗️ 2. Architecture & Tech Stack

- **Extension Framework**: Chrome Extension Manifest V3 (TypeScript, React, Tailwind CSS, Lucide Icons)
- **Video Adapters**:
  - `YouTubeAdapter` (handles YouTube HTML5 player, URL videoId, transcript scraper & textTracks)
  - `CourseraAdapter` (handles Coursera video player & subtitle container cues)
  - `GenericHTML5VideoAdapter` (universal `<video>` and WebVTT track reader)
- **Backend API Engine**: Node.js + Express (`server.ts`) with Gemini 3.7 Flash via `@google/genai` SDK
- **Data Persistence**: `chrome.storage.local` with fallback to `localStorage` in web preview
- **Gamification**: XP points, daily study streak, accuracy metrics, and canvas confetti

---

## 🚀 3. Chạy Local (Local Development)

### Bước 1: Cài đặt và cấu hình
```bash
npm install
cp .env.example .env
```

### Bước 2: Thiết lập GEMINI_API_KEY
Trong file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Bước 3: Khởi chạy Full-stack Applet & Backend
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

---

## 🧩 4. Cài đặt Extension trên Google Chrome & Microsoft Edge

1. Mở StudyLens AI Web Applet tại tab **Extension Package**.
2. Nhấp nút **Download Unpacked Extension (.zip)** và giải nén file zip vào một thư mục trên máy tính.
3. Mở trình duyệt:
   - **Google Chrome**: Truy cập `chrome://extensions`
   - **Microsoft Edge**: Truy cập `edge://extensions`
4. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển).
5. Nhấp vào nút **Load unpacked** (Tải tiện ích đã giải nén).
6. Chọn thư mục extension vừa giải nén.
7. Mở YouTube hoặc bất kỳ video học tập nào để trải nghiệm StudyLens AI!

---

## ☁️ 5. Production Deployment (Google Cloud Run)

Ứng dụng được tối ưu hóa sẵn sàng cho Cloud Run:
```bash
# Build production bundle
npm run build

# Start production server
npm start
```
`server.ts` tự động phục vụ API backend `/api/*` và SPA frontend static files từ thư mục `dist/` trên port 3000.
