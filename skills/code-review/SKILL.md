---
name: project-skim
description: Đọc lướt và tóm tắt project một cách sơ lược, tiết kiệm token, đồng thời tuân theo quy ước của project (lệnh build/test/lint, coding rules, đường dẫn quan trọng). Hãy dùng skill này bất cứ khi nào người dùng nhờ "xem qua project", "tóm tắt repo", "project này làm gì", "cấu trúc thư mục", onboarding vào codebase mới, hoặc trước khi sửa code trong project mà chưa nắm tổng quan — kể cả khi họ không nói rõ là "tóm tắt".
---

# Project Skim

Mục tiêu: nắm tổng quan project nhanh nhất, tốn ít token nhất. **Không đọc sâu** trừ khi người dùng yêu cầu.

## Commands

- Build: `npm run build`
- Test: `npm test -- --runInBand`
- Lint: `npm run lint`

## Coding rules

- TypeScript strict mode.
- Do not edit generated files.
- Prefer small functions.
- Add tests for changed behavior.

## Important paths

- API clients: `src/api/`
- Payment logic: `src/payments/`
- Generated files: `src/generated/` (do not edit)

---

## Quy trình đọc tóm tắt (sơ lược, tối ưu token)

### F1. Quét cấu trúc — rẻ nhất, làm đầu tiên

- Liệt kê thư mục tối đa **2 cấp**, bỏ qua: `node_modules`, `dist`, `build`, `.git`, `coverage`, `src/generated/`, file lock.
- Chỉ ghi nhận tên thư mục/file, **không mở nội dung**.

### F2. Đọc file định danh — chỉ phần đầu

Đọc theo thứ tự, dừng ngay khi đã đủ thông tin:

1. `README.md` → chỉ **~30 dòng đầu**
2. `package.json` → chỉ các trường `name`, `description`, `scripts`, `dependencies` chính
3. `tsconfig.json` → chỉ xác nhận `strict`
4. Không đọc: lock file, file generated, file test, file > 300 dòng (trừ khi được yêu cầu)

### F3. Xác định điểm vào

- Tìm 1–3 file entry (ví dụ `src/index.ts`, `src/main.ts`, `src/app.ts`).
- Chỉ đọc **~40 dòng đầu** mỗi file để biết luồng khởi động.

### F4. Tóm tắt theo module, không theo file

Với mỗi thư mục lớn trong "Important paths", ghi **1 dòng**: module làm gì, phụ thuộc gì. Không liệt kê từng file.

### F5. Xuất kết quả theo mẫu cố định

```
**Project:** <tên> — <1 câu mô tả>
**Stack:** <ngôn ngữ / framework / DB chính>
**Entry:** <file điểm vào>
**Modules:**
- `src/api/` — <1 dòng>
- `src/payments/` — <1 dòng>
**Lệnh:** build / test / lint (xem phần Commands)
**Lưu ý:** <rủi ro, file không được sửa, điểm cần hỏi thêm>
```

---

## Quy tắc tiết kiệm token

- Ưu tiên `ls`/`tree`/`grep` hơn là mở file.
- Dùng `head`, `sed -n '1,40p'` hoặc khoảng dòng cụ thể thay vì đọc cả file.
- Tìm bằng `grep -rn "từ khóa" src/ | head -20` thay vì đọc nhiều file.
- Không lặp lại nội dung đã đọc; tóm tắt rồi bỏ qua.
- Tối đa **~10 lần đọc file** cho một lần skim. Nếu chưa đủ, hỏi người dùng muốn đào sâu phần nào.
- Câu trả lời cuối: **dưới ~200 từ**.

## Khi cần đào sâu

Chỉ đọc chi tiết khi người dùng chỉ rõ module/file. Khi đó:

1. Đọc đúng phần liên quan (theo hàm/khoảng dòng).
2. Tuân thủ **Coding rules** ở trên khi sửa code.
3. Chạy `npm run lint` và `npm test -- --runInBand` sau khi thay đổi; thêm test cho hành vi đã đổi.
4. Tuyệt đối **không sửa** `src/generated/`.
