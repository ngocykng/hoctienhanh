# DUOVOCAB.AI

Ứng dụng học từ vựng đa ngôn ngữ bằng React, TypeScript, Express và Gemini AI.
Ứng dụng hỗ trợ học tiếng Anh, tiếng Trung, tiếng Nhật kèm giải nghĩa tiếng Việt.

## 1. Công nghệ sử dụng

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion.
- **Backend:** Node.js, Express, TypeScript (`tsx`).
- **AI:** Google Gemini API.
- **Xác thực:** PostgreSQL, `bcryptjs` và `jsonwebtoken` (JWT).
- **Lưu dữ liệu từ vựng:** file JSON cục bộ `vocab_database.json` thông qua module database store.

## 2. Clone dự án

Thay `<repository-url>` bằng URL repository của dự án:

```powershell
git clone <repository-url>
cd hoctienganh
```

Nếu dự án đã có sẵn trên máy:

```powershell
cd C:\duan\hoctienganh
```

## 3. Cài đặt

Yêu cầu:

- Node.js 18 trở lên.
- npm.
- PostgreSQL đang chạy.
- Gemini API key nếu muốn sử dụng các tính năng AI.

Cài dependency:

```powershell
npm install
```

## 4. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và điền thông tin:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://username:password@localhost:5000/hoctienganh_db"
JWT_SECRET="your_long_random_jwt_secret"
```

Ý nghĩa các biến:

- `GEMINI_API_KEY`: khóa gọi Gemini AI.
- `APP_URL`: địa chỉ ứng dụng.
- `DATABASE_URL`: chuỗi kết nối PostgreSQL.
- `JWT_SECRET`: khóa dùng để ký JWT. Không chia sẻ hoặc commit giá trị thật.

## 5. Chuẩn bị cơ sở dữ liệu

Tạo database PostgreSQL tương ứng với `DATABASE_URL`, sau đó chạy file schema:

```powershell
psql -U username -d hoctienganh_db -f server\db\schema.sql
```

File schema tạo bảng tài khoản `users` và các bảng dữ liệu từ vựng, video,
phụ đề. Tài khoản đăng ký được lưu trong PostgreSQL.

> Nếu máy dùng cổng PostgreSQL mặc định, đổi `5000` trong `DATABASE_URL` thành
> `5432`. PostgreSQL phải thực sự lắng nghe đúng cổng đã cấu hình.

## 6. Chạy dự án ở môi trường phát triển

```powershell
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

Lệnh `dev` chạy Express bằng `tsx`. Express đồng thời tích hợp Vite ở chế độ
development nên frontend và backend dùng chung cổng `3000`.

## 7. Build và chạy production

Kiểm tra TypeScript:

```powershell
npm run lint
```

Build frontend và backend:

```powershell
npm run build
```

Chạy bản build:

```powershell
npm start
```

Các lệnh được định nghĩa trong `package.json`:

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy development server |
| `npm run lint` | Kiểm tra TypeScript |
| `npm run build` | Build frontend và bundle backend |
| `npm start` | Chạy backend đã build |
| `npm run preview` | Preview bản build frontend |

## 8. Các chức năng chính

### 8.1. Đăng ký và đăng nhập

- Đăng ký bằng email, mật khẩu và họ tên.
- Mật khẩu được băm bằng `bcryptjs`, không lưu mật khẩu dạng thô.
- Đăng nhập kiểm tra email và mật khẩu.
- Backend tạo JWT bằng `jsonwebtoken`.
- Frontend lưu token ở `localStorage` với khóa `auth_token`.
- Thông tin người dùng được lưu ở `localStorage` với khóa `user_info`.
- Có thể đăng xuất để xóa phiên hiện tại.

API:

```text
POST /api/auth/register
POST /api/auth/login
```

### 8.2. Tạo flashcard theo chủ đề

Người dùng nhập chủ đề và trình độ CEFR. Backend gọi Gemini để tạo danh sách
từ vựng song ngữ, gồm từ, phiên âm, nghĩa tiếng Việt, ví dụ và độ khó.

API chính:

```text
POST /api/vocab/generate
GET  /api/vocab/topics
GET  /api/vocab/:topicId
```

### 8.3. Sổ tay từ vựng

- Xem toàn bộ từ đã lưu.
- Thêm từ thủ công.
- AI tự điền thông tin của từ.
- Sửa hoặc xóa thẻ.
- Đánh dấu đã học/chưa học.
- Tạo chủ đề mới.
- Kiểm tra câu ví dụ bằng AI.

API chính:

```text
GET    /api/vocab/notebook/all
POST   /api/vocab/cards
PUT    /api/vocab/cards/:cardId
DELETE /api/vocab/cards/:cardId
POST   /api/vocab/cards/:cardId/toggle-learned
POST   /api/vocab/autofill
POST   /api/vocab/check-sentence
```

### 8.4. Trích xuất từ vựng từ YouTube

- Nhập URL YouTube.
- Lấy transcript/phụ đề.
- Gọi AI để trích xuất từ vựng quan trọng.
- Hiển thị từ, nghĩa, câu theo ngữ cảnh và mốc thời gian.
- Cho phép cập nhật phụ đề của phiên học.

API chính:

```text
POST /api/video/extract
GET  /api/video/sessions
GET  /api/video/:sessionId
PUT  /api/video/sessions/:sessionId/subtitles
```

### 8.5. Tra cứu nhanh và luyện câu

- Tra cứu từ/cụm từ bằng Gemini.
- Hỗ trợ ngôn ngữ nguồn tự động hoặc chỉ định.
- Kiểm tra câu người học tự viết.
- Trả về điểm số, nhận xét, lỗi, câu sửa và các cách diễn đạt tốt hơn.

API:

```text
POST /api/translate/lookup
POST /api/vocab/check-sentence
```

## 9. Luồng hoạt động của hệ thống

### 9.1. Luồng khởi động

```text
npm run dev
    |
    v
server.ts
    |
    +--> dotenv nạp .env
    +--> Express tạo API server
    +--> đăng ký các route /api/auth, /api/vocab, /api/video, /api/translate
    +--> Vite middleware phục vụ React
```

### 9.2. Luồng đăng ký

```text
RegisterPage
    --> POST /api/auth/register
    --> chuẩn hóa email và kiểm tra dữ liệu
    --> kiểm tra email trong PostgreSQL
    --> bcrypt hash mật khẩu
    --> INSERT vào users
    --> tạo JWT
    --> trả user + token
    --> frontend lưu localStorage và mở ứng dụng
```

### 9.3. Luồng đăng nhập

```text
Login
    --> POST /api/auth/login
    --> tìm user theo email
    --> bcrypt.compare mật khẩu
    --> tạo JWT nếu hợp lệ
    --> frontend lưu token và user_info
    --> hiển thị giao diện học từ vựng
```

### 9.4. Luồng tạo từ vựng bằng AI

```text
Người dùng nhập chủ đề
    --> React gọi /api/vocab/generate
    --> Express controller/service xử lý
    --> Gemini tạo JSON từ vựng
    --> lưu dữ liệu vào store
    --> trả topic và cards
    --> React hiển thị flashcard/quiz
```

### 9.5. Luồng học qua YouTube

```text
URL YouTube
    --> /api/video/extract
    --> lấy transcript và thông tin video
    --> Gemini phân tích từ vựng
    --> lưu video session, subtitles, words
    --> frontend hiển thị video và từ theo timestamp
```

## 10. Cấu trúc thư mục quan trọng

```text
hoctienganh/
├── server.ts                         # Điểm khởi động Express + Vite
├── src/
│   ├── App.tsx                       # Điều hướng auth và màn hình chính
│   ├── pages/
│   │   ├── login.tsx                 # Đăng nhập
│   │   ├── register.tsx              # Đăng ký
│   │   ├── VocabByTopicPage.tsx      # Flashcard theo chủ đề
│   │   ├── VideoVocabPage.tsx        # Học qua YouTube
│   │   └── MyNotebookPage.tsx        # Sổ tay
│   ├── components/                   # Các component giao diện
│   └── services/api.ts               # Các hàm gọi API từ frontend
├── server/
│   ├── auth/auth.routes.ts            # API đăng ký/đăng nhập
│   ├── modules/vocab-by-topic/       # API chủ đề và flashcard
│   ├── modules/video-vocab/          # API transcript và video
│   ├── modules/translation/          # API tra cứu AI
│   ├── config/genai.client.ts        # Cấu hình Gemini
│   └── db/
│       ├── schema.sql                # Schema PostgreSQL
│       └── store.ts                  # Lưu dữ liệu từ vựng cục bộ
├── .env.example                      # Mẫu biến môi trường
└── package.json                      # Dependency và script
```

## 11. Xử lý lỗi thường gặp

### `ECONNREFUSED ...:5432` hoặc `...:5000`

Kiểm tra:

1. PostgreSQL đã khởi động chưa.
2. Port trong `DATABASE_URL` có đúng không.
3. Username, password và tên database có đúng không.
4. Đã chạy `server\db\schema.sql` chưa.

### `GEMINI_API_KEY` không hoạt động

Kiểm tra file `.env` có khóa hợp lệ và restart server sau khi thay đổi `.env`.

### JSX báo thiếu `JSX.IntrinsicElements`

Cài type React:

```powershell
npm install -D @types/react @types/react-dom
```

Sau đó chạy lại:

```powershell
npm run lint
```

### Thay đổi `.env` nhưng ứng dụng chưa nhận

Dừng server bằng `Ctrl+C`, sau đó chạy lại:

```powershell
npm run dev
```

## 12. Lưu ý bảo mật

- Không commit `.env`.
- Không đưa `DATABASE_URL`, mật khẩu database, `GEMINI_API_KEY` hoặc
  `JWT_SECRET` lên GitHub.
- Dùng `JWT_SECRET` ngẫu nhiên, đủ dài ở môi trường production.
- Nên dùng HTTPS khi triển khai thật.

## 13. Triển khai Cloudflare Pages + Workers + D1

Project có Worker API riêng trong `worker/src/index.ts`. Frontend Pages chỉ chứa
React/Vite; không chạy trực tiếp `server.ts`.

### Tạo D1 và cấu hình Worker

```powershell
npm install
npx wrangler login
npx wrangler d1 create hoctienganh-db
```

Copy `database_id` từ kết quả lệnh trên vào `wrangler.toml`, đồng thời thay
`APP_URL` bằng domain Pages production. Sau đó tạo bảng từ migration:

```powershell
npx wrangler d1 execute hoctienganh-db --remote --file=./worker/migrations/0001_initial.sql
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put JWT_SECRET
npm run deploy:api
```

Worker sẽ có URL dạng `https://hoctienganh-api.<subdomain>.workers.dev`.
Đặt URL đó làm biến `VITE_API_URL` trong Cloudflare Pages, rồi redeploy
frontend với build command `npm run build:client` và output directory `dist`.

`server.ts` và PostgreSQL vẫn được giữ để chạy local. API video YouTube hiện
chưa được chuyển sang Worker vì thư viện transcript hiện tại phụ thuộc Node;
các API auth, vocabulary CRUD và các API Gemini đã có trong Worker D1.
#   h o c t i e n h a n h  
 