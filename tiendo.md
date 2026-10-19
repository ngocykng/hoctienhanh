# Nhật ký Tiến độ Phát triển Dự án Học Tiếng Anh

## Ngày 19/10/2026

### 1. Nâng cấp Giao diện Quản trị (Admin)
- **Tích hợp Tổng quan:** Chuyển nội dung từ `AdminOverview.tsx` trực tiếp vào `Admin.tsx` để hiển thị thông số thống kê ngay khi truy cập vào trang quản trị.
- **Thêm Thẻ Thống kê (Stat Cards):** Xây dựng giao diện hiển thị các chỉ số chính:
  - Tổng số học viên.
  - Tổng thời gian học.
  - Tỷ lệ hoàn thành bài học.
  - Tỷ lệ tăng trưởng tháng.
- **Cải thiện UI/UX:** Sử dụng `lucide-react` cho icon và `motion/react` cho hiệu ứng chuyển động của Sidebar.

### 2. Chuyển đổi Hệ thống Lưu trữ (Database Migration)
- **Thay đổi kiến trúc:** Chuyển từ lưu trữ file JSON cục bộ (`vocab_database.json`) sang cơ sở dữ liệu quan hệ **PostgreSQL**.
- **Kết nối Database:** 
  - Thiết lập `DATABASE_URL` trong file `.env`.
  - Tạo module `server/db/pool.ts` để quản lý kết nối (connection pool) thông qua thư viện `pg`.
- **Viết lại Lớp Database (`server/db/store.ts`):**
  - Chuyển toàn bộ các hàm thao tác dữ liệu (`getTopics`, `addTopic`, `addCard`, v.v.) sang dạng bất đồng bộ (`async/await`).
  - Thay thế các lệnh đọc/ghi file bằng các câu lệnh SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
  - Triển khai cơ chế `ON CONFLICT` để xử lý cập nhật dữ liệu tránh trùng lặp ID.

### 3. Sửa lỗi và Tối ưu hóa (Bug Fixes)
- **Khắc phục lỗi Bất đồng bộ (Async/Await):**
  - Cập nhật toàn bộ `server/modules/vocab-by-topic/vocab.controller.ts` để hỗ trợ `async/await`, sửa lỗi `TypeError` khi gọi các hàm database.
  - Sửa lỗi `TransformError` do thiếu từ khóa `async` trong các hàm handler của Express.
- **Xử lý lỗi Render Frontend:**
  - Sửa lỗi `topics.map is not a function` và `topics.reduce is not a function` trong `VocabByTopicPage.tsx` bằng cách thêm kiểm tra `Array.isArray()`.
  - Đảm bảo `src/services/api.ts` luôn trả về một mảng (`[]`) ngay cả khi API gặp lỗi hoặc trả về dữ liệu trống.
- **Quản lý Thư viện:** Cài đặt bổ sung thư viện `uuid` và `@types/uuid` để tạo ID duy nhất cho các bản ghi trong PostgreSQL.

---
**Trạng thái hiện tại:** Hệ thống đã kết nối thành công với PostgreSQL, dữ liệu Topic và Vocab được lưu trữ bền vững, giao diện quản trị đã hiển thị các thông số tổng quan.
