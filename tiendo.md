# Nhật ký tiến độ dự án DUOVOCAB.AI

## 📅 Ngày 20/10/2026

### 🛠 Các vấn đề đã xử lý

#### 1. Lỗi Giao diện & Trải nghiệm (Frontend)
- **Vấn đề:** Trình duyệt báo lỗi `[DOM] Input elements should have autocomplete attributes`.
- **Giải pháp:** Cập nhật thuộc tính `autoComplete` cho các ô nhập liệu trong `RegisterPage` và `LoginPage`.
    - Đăng ký: `name`, `email`, `new-password`.
    - Đăng nhập: `username`, `current-password`.
- **Kết quả:** Xóa bỏ cảnh báo trong Console, hỗ trợ trình quản lý mật khẩu hoạt động chính xác.

#### 2. Lỗi API 405 Method Not Allowed & Failed to fetch
- **Vấn đề:** Không thể đăng ký tài khoản, API trả về lỗi 405.
- **Nguyên nhân:** 
    - Thiếu cấu hình biến môi trường `VITE_API_URL` trên Cloudflare Pages dẫn đến gọi sai địa chỉ API.
    - Database D1 chưa có bảng dữ liệu, gây crash Worker khi thực hiện truy vấn.
- **Giải pháp:**
    - Hướng dẫn cấu hình `VITE_API_URL` và `APP_URL` trên Cloudflare Dashboard.
    - Khởi tạo cấu trúc Database D1 bằng file `schema.sql`.
- **Kết quả:** Hệ thống định tuyến đúng từ Frontend sang Backend và Backend có nơi lưu trữ dữ liệu.

#### 3. Lỗi Database `D1_ERROR: no such table: users`
- **Vấn đề:** Worker báo lỗi không tìm thấy bảng `users` khi đăng ký.
- **Giải pháp:** Tạo file `schema.sql` chứa toàn bộ cấu trúc các bảng (`users`, `topics`, `vocab_cards`) và thực thi lên Cloudflare D1 bằng lệnh:
  `npx wrangler d1 execute hoctienganh-db --remote --file=./schema.sql`
- **Kết quả:** Database đã sẵn sàng, cho phép thực hiện các thao tác Đăng ký/Đăng nhập.

#### 4. Cấu hình AI (Gemini API)
- **Vấn đề:** Cần tích hợp AI để xử lý từ vựng.
- **Giải pháp:** Cấu hình `GEMINI_API_KEY` dưới dạng **Secret** trong Cloudflare Workers thông qua Dashboard hoặc lệnh `wrangler secret put`.
- **Kết quả:** Kích hoạt các tính năng thông minh như Tự động điền từ và Kiểm tra câu.

#### 5. Chuyển đổi Database từ D1 (SQLite) sang Neon (PostgreSQL) & Hyperdrive
- **Vấn đề:** Cần nâng cấp database để hỗ trợ PostgreSQL và giảm độ trễ qua Cloudflare Hyperdrive.
- **Giải pháp:**
    - Thay đổi toàn bộ cú pháp query từ SQLite (`.prepare().bind()`) sang PostgreSQL (`client.query()`).
    - Cài đặt thư viện `pg` để kết nối với Neon DB.
    - Cấu hình **Hyperdrive Binding** trên Cloudflare Dashboard để tối ưu kết nối.
    - Cập nhật `schema.sql` cho PostgreSQL và bổ sung các cột thiếu (`role`, `status`) trong bảng `users`.
- **Kết quả:** Hệ thống vận hành ổn định trên PostgreSQL, tốc độ truy vấn nhanh hơn nhờ Hyperdrive.

---

### 🚀 Trạng thái hiện tại
- [x] Cấu hình Frontend (Pages) $\checkmark$
- [x] Cấu hình Backend (Workers) $\checkmark$
- [x] Khởi tạo Database (Neon PostgreSQL) $\checkmark$
- [x] Kết nối Hyperdrive (Cloudflare) $\checkmark$
- [x] Kết nối AI (Gemini) $\checkmark$
- [x] Deployment trên Cloudflare (Hoàn tất cấu hình biến môi trường và Secret) $\checkmark$
- [x] Kiểm tra luồng Đăng ký $\rightarrow$ Đăng nhập $\rightarrow$ Học từ (Đang tiến hành)

### 📝 Ghi chú cho lần tới
- Kiểm tra lại tính năng `Auto-fill` xem Gemini có trả về đúng định dạng JSON không.
- Kiểm tra tính năng `Check-sentence` để đảm bảo AI đánh giá chính xác.
Để bạn dễ theo dõi, tôi xin tóm tắt lại toàn bộ những thay đổi tôi đã thực hiện để sửa lỗi "không cập nhật số lượng học
  viên" và lỗi "crash server".

  Tôi đã thực hiện thay đổi trên 4 file chính:

  1. server/modules/admin/admin.routes.ts (Tạo mới)

  - Thay đổi: Tạo file này để tách biệt các API quản trị.
  - Mục đích: Định nghĩa route /status cho admin. Khi kết hợp với prefix ở server.ts, nó tạo ra endpoint
    /api/admin/status.

  2. server.ts (Sửa đổi)

  - Thay đổi:
    - Import adminRoutes từ file vừa tạo.
    - Thêm dòng: app.use('/api/admin', adminRoutes);.
  - Mục đích: Kích hoạt đường dẫn /api/admin/... cho toàn bộ ứng dụng. Trước đó, API này bị đặt nhầm trong /api/auth/...
    khiến Frontend không gọi được.

  3. server/auth/auth.routes.ts (Sửa đổi)

  - Thay đổi: Xóa bỏ dòng router.get('/admin/status', getadminstatus); và các import liên quan đến admin.
  - Mục đích: Dọn dẹp code, tránh xung đột route và loại bỏ những import không sử dụng (giảm cảnh báo TypeScript).

  4. src/services/api.ts (Sửa đổi)

  - Thay đổi:
    - Thay thế fetch() trực tiếp bằng apiRequest().
    - Sửa tên hàm từ fetchAdminstatus $\rightarrow$ fetchAdminStats (để khớp với Admin.tsx).
    - Thêm ép kiểu as { data: { totalUsers: number } }.
  - Mục đích:
    - Đảm bảo gọi đúng URL (bao gồm cả domain/port từ API_BASE_URL).
    - Xóa bỏ lỗi TypeScript 'result' is of type 'unknown'.
    - Đảm bảo trả về đúng object dữ liệu cho giao diện.

  ---

  - Thay đổi:
    - Import adminRoutes từ file vừa tạo.
    - Thêm dòng: app.use('/api/admin', adminRoutes);.
  - Mục đích: Kích hoạt đường dẫn /api/admin/... cho toàn bộ ứng dụng. Trước đó, API này bị đặt nhầm trong /api/auth/...
    khiến Frontend không gọi được.

  3. server/auth/auth.routes.ts (Sửa đổi)

  - Thay đổi: Xóa bỏ dòng router.get('/admin/status', getadminstatus); và các import liên quan đến admin.
  - Mục đích: Dọn dẹp code, tránh xung đột route và loại bỏ những import không sử dụng (giảm cảnh báo TypeScript).

  4. src/services/api.ts (Sửa đổi)

  - Thay đổi:
    - Thay thế fetch() trực tiếp bằng apiRequest().
    - Sửa tên hàm từ fetchAdminstatus $\rightarrow$ fetchAdminStats (để khớp với Admin.tsx).
    - Thêm ép kiểu as { data: { totalUsers: number } }.
  - Mục đích:
    - Đảm bảo gọi đúng URL (bao gồm cả domain/port từ API_BASE_URL).
    - Xóa bỏ lỗi TypeScript 'result' is of type 'unknown'.
    - Đảm bảo trả về đúng object dữ liệu cho giao diện.

  ---

  $\rightarrow$ admin.routes.ts $\rightarrow$ admin.controller.ts $\rightarrow$ Database (PostgreSQL) $\rightarrow$ Trả về
    - Đảm bảo gọi đúng URL (bao gồm cả domain/port từ API_BASE_URL).
    - Xóa bỏ lỗi TypeScript 'result' is of type 'unknown'.
    - Đảm bảo trả về đúng object dữ liệu cho giao diện.

  ---

  Tóm lại luồng chạy mới:
  Admin.tsx $\rightarrow$ gọi fetchAdminStats() $\rightarrow$ apiRequest('/api/admin/status') $\rightarrow$ server.ts
  $\rightarrow$ admin.routes.ts $\rightarrow$ admin.controller.ts $\rightarrow$ Database (PostgreSQL) $\rightarrow$ Trả về
  số lượng học viên $\rightarrow$ Hiển thị lên màn hình.