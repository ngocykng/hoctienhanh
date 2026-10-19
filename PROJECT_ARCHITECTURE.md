# BẢN ĐẶC TẢ KIẾN TRÚC & HƯỚNG DẪN CHUYỂN ĐỔI SANG APP (PC & MOBILE)
**Dự án:** Song ngữ Anh - Trung qua Flashcard & Video YouTube (Bilingual Vocab & Video Learning)

---

## MỤC LỤC
1. [Tổng quan hệ thống & Kiến trúc](#1-tổng-quan-hệ-thống--kiến-trúc)
2. [Cấu trúc thư mục & Modules](#2-cấu-trúc-thư-mục--modules)
3. [Mô hình Dữ liệu (Data Models & Schemas)](#3-mô-hình-dữ-liệu-data-models--schemas)
4. [Đặc tả API RESTful Backend](#4-đặc-tả-api-restful-backend)
5. [Thuật toán & Prompt Engineering (AI Gemini Engine)](#5-thuật-toán--prompt-engineering-ai-gemini-engine)
6. [Logic Xử lý Giao diện (Frontend & UX Mechanics)](#6-logic-xử-lý-giao-diện-frontend--ux-mechanics)
7. [Hướng dẫn Chuyển đổi sang App Đa nền tảng (PC & Mobile)](#7-hướng-dẫn-chuyển-đổi-sang-app-đa-nền-tảng-pc--mobile)
8. [Các lưu ý quan trọng về Bảo mật & Hiệu năng](#8-các-lưu-ý-quan-trọng-về-bảo-mật--hiệu-năng)

---

## 1. TỔNG QUAN HỆ THỐNG & KIẾN TRÚC

Hệ thống được xây dựng theo mô hình **Client - Server (Full-stack)**:
- **Client (Frontend)**: Ứng dụng giao diện người dùng đa nền tảng (Web, Mobile, Desktop PC), xử lý tương tác trực quan (Lật thẻ 3D Flashcard, phát âm giọng đọc TTS song ngữ, đồng bộ phụ đề video thời gian thực, chế độ làm bài trắc nghiệm tính điểm).
- **Server (Backend Proxy & AI Core)**: Xử lý định tuyến RESTful API, bảo mật khóa `GEMINI_API_KEY`, bóc tách Transcript từ YouTube, gọi mô hình AI Gemini bằng Structured JSON Output, và cơ chế chống lặp từ khi tạo nhiều đợt (Anti-repetition multi-batch).

### Sơ đồ kiến trúc (Architecture Diagram)
```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (PC & MOBILE)                      │
│                                                                        │
│  ┌─────────────────────────────┐     ┌──────────────────────────────┐  │
│  │   Vocab By Topic Module     │     │     Video Vocab Module       │  │
│  │ - Topic & CEFR Level Input  │     │ - YouTube Player Controller  │  │
│  │ - 3D Flip Flashcard Deck    │     │ - Realtime Subtitle Sync     │  │
│  │ - Quiz Mode (4 choices)     │     │ - Active Keyword Popup       │  │
│  │ - Full Vocabulary List View │     │ - Click-to-lookup Dictionary │  │
│  └──────────────┬──────────────┘     └──────────────┬───────────────┘  │
│                 │                                   │                  │
│                 └─────────────────┬─────────────────┘                  │
│                                   │ HTTP/REST API                      │
└───────────────────────────────────┼────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER (Node.js/Express)                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints:                                             │  │
│  │  - /api/vocab/*       (Generate, list topics, get cards)         │  │
│  │  - /api/video/*       (Extract video, parse transcript, subs)    │  │
│  │  - /api/translate/*   (Quick word lookup)                        │  │
│  └──────────────────┬───────────────────────┬───────────────────────┘  │
│                     │                       │                          │
│                     ▼                       ▼                          │
│     ┌─────────────────────────┐   ┌──────────────────────────────┐     │
│     │ Database / Store Layer  │   │ Gemini AI Service Engine     │     │
│     │ (Topics, Cards, Subs)   │   │ - Structured JSON Schema     │     │
│     │                         │   │ - Multi-Model Fallback       │     │
│     │                         │   │ - Anti-repetition Generator  │     │
│     └─────────────────────────┘   └──────────────┬───────────────┘     │
└──────────────────────────────────────────────────┼─────────────────────┘
                                                   ▼
                              ┌──────────────────────────────────────────┐
                              │     Google Gemini AI (Cloud API)         │
                              │ - gemini-2.5-flash / gemini-3.7-flash    │
                              └──────────────────────────────────────────┘
```

---

## 2. CẤU TRÚC THƯ MỤC & MODULES

```text
├── server/                               # BACKEND LAYER
│   ├── config/
│   │   └── genai.client.ts              # Khởi tạo Gemini Client, cơ chế Retry và Fallback model
│   ├── db/
│   │   └── store.ts                     # In-memory Store / Repository lưu dữ liệu
│   └── modules/
│       ├── vocab-by-topic/              # Mô-đun 1: Từ vựng theo chủ đề & CEFR
│       │   ├── vocab.controller.ts      # Controller xử lý Request/Response
│       │   ├── vocab.routes.ts          # Routes /api/vocab/*
│       │   └── vocab.service.ts         # Prompt & AI Service sinh từ vựng chuẩn IPA/Pinyin
│       ├── video-vocab/                 # Mô-đun 2: Học qua Video YouTube
│       │   ├── video.controller.ts      # Controller xử lý Video
│       │   ├── video.routes.ts          # Routes /api/video/*
│       │   ├── youtube-transcript.service.ts # Bóc tách Transcript gốc từ YouTube
│       │   └── word-extractor.service.ts     # Trích xuất phụ đề song ngữ và từ vựng trọng tâm
│       └── translation/
│           └── translate.service.ts     # Dịch & tra cứu từ điển nhanh
│
├── src/                                 # FRONTEND LAYER
│   ├── types/
│   │   └── index.ts                     # Toàn bộ Interface & Type Definitions
│   ├── services/
│   │   └── api.ts                       # Fetch client giao tiếp Backend
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx               # Thanh điều hướng và logo
│   │   │   └── SpeechButton.tsx         # Phát âm Text-to-Speech (TTS) cho Tiếng Anh/Trung
│   │   ├── TopicInput/
│   │   │   └── TopicInput.tsx           # Form nhập chủ đề, chọn cấp độ CEFR A1-C2, nút tạo ngẫu nhiên
│   │   ├── Flashcard/
│   │   │   ├── FlashcardDeck.tsx        # Quản lý bộ thẻ (Chuyển chế độ Card / Quiz / List)
│   │   │   ├── Flashcard.tsx            # Thẻ Flashcard 3D flip có IPA, Hanzi, Pinyin, Ví dụ
│   │   │   └── QuizMode.tsx             # Chế độ làm bài trắc nghiệm tính điểm
│   │   ├── VideoInput/
│   │   │   └── VideoInput.tsx           # Nhập URL Youtube hoặc dán transcript
│   │   └── VideoPlayer/
│   │       └── VideoPlayer.tsx          # IFrame Youtube + Sync Subtitle + Word Drawer + Tra từ
│   ├── pages/
│   │   ├── VocabByTopicPage.tsx         # Trang chính Chức năng 1
│   │   └── VideoVocabPage.tsx           # Trang chính Chức năng 2
│   ├── App.tsx                          # Root component
│   └── main.tsx
```

---

## 3. MÔ HÌNH DỮ LIỆU (DATA MODELS & SCHEMAS)

Khi xây dựng trên Mobile/PC App, sử dụng các Schema sau cho Cơ sở dữ liệu cục bộ (SQLite / Room / CoreData / Hive / Realm):

```typescript
// 1. Thẻ từ vựng (VocabCard)
export interface VocabCard {
  id: string;                  // Khóa chính (UUID)
  topic_id: string;            // Khóa ngoại liên kết bảng Topic
  word_en: string;             // Từ tiếng Anh (ví dụ: "Serendipity")
  ipa_en?: string;             // Phiên âm quốc tế IPA (ví dụ: "/ˌser.ənˈdɪp.ə.ti/")
  word_zh: string;             // Chữ Hán (ví dụ: "机缘巧合")
  pinyin: string;              // Pinyin có thanh điệu (ví dụ: "jī yuán qiǎo hé")
  meaning_vi: string;          // Nghĩa tiếng Việt
  example_en: string;          // Câu ví dụ tiếng Anh
  example_zh: string;          // Câu ví dụ tiếng Trung
  example_meaning_vi: string;  // Dịch nghĩa câu ví dụ
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | string;
  learned?: boolean;           // Đã thuộc (true/false)
}

// 2. Chủ đề từ vựng (Topic)
export interface Topic {
  id: string;                  // Khóa chính
  name: string;                // Tên chủ đề (ví dụ: "Công nghệ thông tin")
  created_at: string;          // ISO Timestamp
  card_count?: number;         // Tổng số lượng thẻ từ trong chủ đề
  level?: string;              // Cấp độ CEFR (ALL, A1, A2, B1, B2, C1, C2)
  batch?: number;              // Đợt tạo (#1, #2, #3...)
}

// 3. Phụ đề Video (SubtitleItem)
export interface SubtitleItem {
  id: string;                  // Khóa chính
  start: number;               // Mốc giây bắt đầu trong video (ví dụ: 14.5)
  duration?: number;           // Thời lượng hiển thị (ví dụ: 3.5)
  text_original: string;       // Lời thoại gốc (Tiếng Anh hoặc Tiếng Trung)
  text_vi: string;             // Bản dịch tiếng Việt
  pinyin?: string;             // Pinyin (nếu câu gốc là tiếng Trung)
}

// 4. Từ vựng trọng tâm trong Video (VideoWord)
export interface VideoWord {
  id: string;                  // Khóa chính
  session_id: string;          // Khóa ngoại liên kết VideoSession
  word: string;                // Từ vựng xuất hiện trong video
  language: 'en' | 'zh';       // Ngôn ngữ từ vựng
  ipa_en?: string;             // Phiên âm IPA nếu là tiếng Anh
  pinyin?: string;             // Pinyin nếu là tiếng Trung
  timestamp_sec: number;       // Mốc giây xuất hiện trong video
  meaning_vi: string;          // Giải nghĩa tiếng Việt
  context_sentence?: string;   // Câu ngữ cảnh thực tế trong video
  difficulty?: string;         // Cấp độ (B1, B2, HSK3...)
}

// 5. Phiên học Video (VideoSession)
export interface VideoSession {
  id: string;                  // Khóa chính
  youtube_url: string;         // Link gốc YouTube
  video_id: string;            // ID 11 ký tự YouTube (ví dụ: "dQw4w9WgXcQ")
  title: string;               // Tiêu đề video
  duration_sec?: number;       // Tổng thời lượng video
  created_at: string;          // ISO Timestamp
  words_count?: number;        // Số lượng từ vựng trích xuất
  subtitles?: SubtitleItem[];  // Danh sách phụ đề song ngữ
}
```

---

## 4. ĐẶC TẢ API RESTFUL BACKEND

### A. Mô-đun Từ vựng theo Chủ đề & Sổ Tay Cá Nhân (User Notebook)
* **POST `/api/vocab/generate`**
  - **Mục đích**: Gọi AI tạo 15 thẻ từ vựng song ngữ theo chủ đề & cấp độ.
  - **Request Body**:
    ```json
    {
      "topic": "Trí tuệ nhân tạo (AI)",
      "level": "B2",
      "excludeWords": ["Algorithm", "Neural Network"],
      "batchIndex": 2
    }
    ```
  - **Response (200 OK)**: Trả về `{ success: true, topic, cards }`.

* **POST `/api/vocab/autofill`** (Tính năng AI Điền Thông Tin Thẻ)
  - **Mục đích**: Người dùng nhập 1 từ bất kỳ (Anh/Trung/Việt), AI Gemini tự động phân tích và sinh ra đầy đủ bộ dữ liệu thẻ (IPA, Pinyin, nghĩa tiếng Việt, câu ví dụ song ngữ ngữ cảnh và dịch nghĩa).
  - **Request Body**: `{ "word": "Meticulous", "existingCard": { ... } }`
  - **Response (200 OK)**: `{ "success": true, "data": { "word_en": "Meticulous", "ipa_en": "/məˈtɪk.jə.ləs/", "word_zh": "一丝不苟", "pinyin": "yī sī bù gǒu", "meaning_vi": "Tỉ mỉ, cẩn thận", "example_en": "...", "example_zh": "...", "example_meaning_vi": "...", "difficulty": "B2" } }`

* **POST `/api/vocab/cards`** (Thêm thẻ từ vựng thủ công vào Sổ tay)
  - **Mục đích**: Lưu thẻ từ vựng mới do người dùng nhập hoặc lưu từ video vào cơ sở dữ liệu.
  - **Request Body**: `{ "word_en": "...", "ipa_en": "...", "word_zh": "...", "pinyin": "...", "meaning_vi": "...", "example_en": "...", "example_zh": "...", "example_meaning_vi": "...", "difficulty": "B1", "topic_id": "...", "topicName": "Sổ tay cá nhân" }`
  - **Response (201 Created)**: `{ "success": true, "card": { ... }, "topic": { ... } }`

* **PUT `/api/vocab/cards/:id`** (Cập nhật thông tin thẻ)
  - **Mục đích**: Chỉnh sửa phiên âm, nghĩa, câu ví dụ hoặc đổi chủ đề cho thẻ đã lưu.

* **DELETE `/api/vocab/cards/:id`** (Xóa thẻ khỏi Sổ tay)

* **PATCH `/api/vocab/cards/:id/learned`** (Đánh dấu đã thuộc / chưa thuộc)

* **GET `/api/vocab/notebook/all`** (Lấy toàn bộ từ vựng đã lưu trong Sổ tay)
  - **Response (200 OK)**: `{ "success": true, "cards": [ ... ], "topics": [ ... ] }`
    }
    ```
* **GET `/api/vocab/topics`** -> Trả về danh sách tất cả các chủ đề đã tạo.
* **GET `/api/vocab/:topicId`** -> Trả về thông tin chủ đề kèm toàn bộ danh sách `cards`.
* **DELETE `/api/vocab/:topicId`** -> Xóa chủ đề và các thẻ liên quan.

### B. Mô-đun Học từ vựng qua Video
* **POST `/api/video/extract`**
  - **Mục đích**: Bóc tách transcript hoặc phân tích video YouTube để tạo phụ đề song ngữ kèm 10-16 từ vựng trọng tâm.
  - **Request Body**:
    ```json
    {
      "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "title": "Never Gonna Give You Up",
      "custom_transcript": "..." // Tùy chọn nếu người dùng tự dán phụ đề
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "session": {
        "id": "session-456",
        "video_id": "dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up",
        "subtitles": [
          { "id": "sub-1", "start": 0, "duration": 4.5, "text_original": "We're no strangers to love", "text_vi": "Chúng ta chẳng còn xa lạ gì với tình yêu", "pinyin": "" }
        ]
      },
      "words": [
        {
          "id": "vword-1",
          "session_id": "session-456",
          "word": "strangers",
          "language": "en",
          "ipa_en": "/ˈstreɪn.dʒəz/",
          "timestamp_sec": 0,
          "meaning_vi": "Người xa lạ",
          "context_sentence": "We're no strangers to love",
          "difficulty": "A2"
        }
      ]
    }
    ```
* **GET `/api/video/sessions`** -> Lấy danh sách video đã lưu.
* **GET `/api/video/:sessionId`** -> Lấy chi tiết video kèm phụ đề và danh sách từ vựng.
* **PUT `/api/video/sessions/:sessionId/subtitles`** -> Cập nhật/chỉnh sửa nội dung phụ đề.

### C. Mô-đun Tra từ điển nhanh
* **POST `/api/translate/lookup`**
  - **Request Body**: `{ "text": "fascinating", "sourceLang": "en" }`
  - **Response**: `{ "success": true, "data": { "word_en": "fascinating", "ipa_en": "/ˈfæs.ən.eɪ.tɪŋ/", "word_zh": "迷人的", "pinyin": "mí rén de", "meaning_vi": "Hấp dẫn, lôi cuốn" } }`

---

## 5. THUẬT TOÁN & PROMPT ENGINEERING (AI GEMINI ENGINE)

Hệ thống sử dụng `@google/genai` với cơ chế **Response Schema JSON** bắt buộc để đảm bảo cấu trúc dữ liệu luôn chuẩn xác 100%.

### A. Cơ chế Retry & Model Fallback thông minh
Khi có lưu lượng cao (mã lỗi 503) hoặc mô hình cập nhật (404/429):
1. Thử `gemini-2.5-flash` (Tối ưu tốc độ và độ ổn định).
2. Nếu gặp lỗi, chuyển ngay sang `gemini-3.7-flash`.
3. Nếu tiếp tục lỗi, chuyển sang `gemini-3.1-flash-lite`.

### B. Prompt tạo từ vựng theo Chủ đề (System Instruction & Content)
```text
System Instruction:
You are an expert bilingual lexicographer, linguist, and curriculum designer specializing in paired English–Chinese learning with Vietnamese explanations.
You generate pedagogically balanced vocabulary sets strictly matched to CEFR levels (A1-C2) and HSK levels (HSK1-6+).
Always ensure:
- English words include accurate IPA phonetics in slashes (e.g. /ˈhæp.i/).
- Chinese words include standard simplified characters with tone-marked Pinyin.
- Vietnamese meanings are accurate, natural, and concise.
- Examples are natural, contextual, and paired accurately.
- Always output valid JSON strictly matching the response schema.
```

### C. Cơ chế chống lặp từ (Anti-Repetition Engine)
Khi người dùng bấm "Tạo thêm từ đợt #2, #3":
```typescript
const antiRepeatClause = excludeWords.length > 0
  ? `CRITICAL EXCLUSION LIST: Do NOT include any of these ${excludeWords.length} words: ${excludeWords.join(', ')}. Pick 15 completely distinct, fresh vocabulary items.`
  : '';
```

---

## 6. LOGIC XỬ LÝ GIAO DIỆN (FRONTEND & UX MECHANICS)

### A. Phát âm giọng đọc đa ngôn ngữ (Text-To-Speech)
- Sử dụng API Web Speech hoặc Native OS Speech Engine.
- Tiếng Anh: mã ngôn ngữ `'en-US'` hoặc `'en-GB'`.
- Tiếng Trung: mã ngôn ngữ `'zh-CN'` (Mandarin).
- Tốc độ đọc (Rate): `0.9` (hơi chậm để người học dễ bắt chước ngữ âm).

### B. Đồng bộ Phụ đề Video & Từ vựng theo thời gian thực (Subtitle & Word Sync)
- Sử dụng cơ chế lắng nghe thời gian phát của Video Player với chu kỳ `250ms`:
  ```typescript
  // Tìm câu phụ đề khớp với thời gian hiện tại
  const currentSub = subtitles.find(s => currentTime >= s.start && currentTime <= (s.start + (s.duration || 4.5)));

  // Tìm từ vựng trọng tâm đang xuất hiện
  const activeWord = words.find(w => Math.abs(currentTime - w.timestamp_sec) < 3.5);
  ```
- **Tương tác**: Bấm vào câu phụ đề -> Tua video tới `start` giây. Bấm vào từ vựng -> Tua tới `timestamp_sec` giây.

### C. Chế độ Trắc nghiệm (Quiz Mode Engine)
- Tạo 4 phương án lựa chọn ngẫu nhiên (1 đáp án đúng + 3 đáp án sai lấy từ các thẻ khác trong bộ).
- Đa dạng loại câu hỏi:
  1. Cho Từ tiếng Anh/Trung -> Chọn Nghĩa tiếng Việt.
  2. Cho Nghĩa tiếng Việt -> Chọn Từ tiếng Anh/Trung tương ứng.

---

## 7. HƯỚNG DẪN CHUYỂN ĐỔI SANG APP ĐA NỀN TẢNG (PC & MOBILE)

### Hướng 1: Dùng Flutter (1 Codebase duy nhất cho iOS, Android, Windows, macOS)
- **Ưu điểm**: Hiệu năng native 60fps cực mượt, biên dịch trực tiếp ra file `.apk`/`.ipa` cho Mobile và `.exe`/`.dmg` cho PC.
- **Thư viện tương ứng**:
  - Video Player: `youtube_player_iframe` hoặc `pod_player`.
  - Giọng đọc TTS: `flutter_tts` (Hỗ trợ tốt cả desktop và mobile).
  - Database Local: `Isar` hoặc `Hive` (Lưu offline tốc độ cao).
  - 3D Flip Card: Dùng widget `Transform` kết hợp `Matrix4.rotationY()`.

### Hướng 2: Dùng Capacitor + Electron (Tái sử dụng 90% Code Web hiện tại)
- **Mobile (iOS/Android)**: Sử dụng **Capacitor**:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
  npx cap init
  npx cap add android
  npx cap add ios
  ```
- **Desktop PC (Windows/macOS/Linux)**: Sử dụng **Electron** hoặc **Tauri**:
  - Dùng **Tauri (Rust + React)**: Dung lượng bộ cài chỉ ~5MB, tiêu tốn ít RAM hơn nhiều so với Electron.

---

## 8. CÁC LƯU Ý QUAN TRỌNG VỀ BẢO MẬT & HIỆU NĂNG

1. **Bảo vệ API Key**: Tuyệt đối **không nhúng `GEMINI_API_KEY` trực tiếp vào mã nguồn App Client**. Phải luôn thông qua Backend Server trung gian (hoặc Serverless / Cloud Functions / Cloudflare Workers).
2. **Offline-First (Học khi không có mạng)**:
   - Lưu trữ các bộ từ vựng đã tạo và các bài học video vào SQLite/Local DB trên thiết bị.
   - Khi không có Internet, người dùng vẫn có thể ôn tập Flashcard, làm bài Quiz và nghe TTS offline.
3. **Tối ưu chi phí AI**:
   - Sử dụng In-Memory Caching hoặc Database Caching cho các chủ đề phổ biến để tránh gọi lại API Gemini nhiều lần cho cùng một yêu cầu giống nhau.
