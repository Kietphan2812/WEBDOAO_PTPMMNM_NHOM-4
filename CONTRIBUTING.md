# Hướng dẫn đóng góp - AURA FASHION

Cảm ơn bạn đã tham gia phát triển dự án AURA FASHION (Nhóm 4, môn PTPMMNM). Vui lòng đọc kỹ hướng dẫn này trước khi gửi code.

## Vai trò trong nhóm

| Vai trò | Quyền GitHub | Thành viên |
|---|---|---|
| Quản trị viên | Admin | Nguyễn Nữ Hồng Nhung |
| Người duy trì | Maintain | Phan Tấn Kiệt |
| Người đóng góp | Write | Nguyễn Thế Nhất |
| Người phân loại | Triage | Dương Quốc Bảo |
| Người xem | Read | Nguyễn Như Hồng Hạnh |

## Cài đặt môi trường

Yêu cầu: **Node.js** (phiên bản LTS) và **Git**.

```bash
git clone https://github.com/NHOM4-WEBDOAO/WEBDOAO_PTPMMNM_NHOM-4.git
cd WEBDOAO_PTPMMNM_NHOM-4
npm install
node server.js
```

Sau đó mở trình duyệt tại địa chỉ hiển thị trong terminal (thường là `http://localhost:3000`).

## Quy trình làm việc

1. Cập nhật nhánh `main` mới nhất:
```bash
   git checkout main
   git pull
```
2. Tạo nhánh mới cho công việc của bạn:
```bash
   git checkout -b feat/ten-chuc-nang
```
3. Viết code, tự chạy thử trước khi commit.
4. Commit và push:
```bash
   git add .
   git commit -m "feat: thêm giỏ hàng"
   git push -u origin feat/ten-chuc-nang
```
5. Mở **Pull Request** vào nhánh `main` và mô tả rõ bạn đã làm gì.
6. Chờ ít nhất **1 thành viên** review và duyệt trước khi merge.

**Không commit trực tiếp vào `main`.**

## Quy ước đặt tên nhánh

- `feat/...`: chức năng mới
- `fix/...`: sửa lỗi
- `docs/...`: tài liệu
- `refactor/...`: tái cấu trúc code

## Quy ước commit

Dùng dạng `loại: mô tả ngắn`:

- `feat: thêm chức năng đăng nhập`
- `fix: sửa lỗi hiển thị giỏ hàng`
- `docs: cập nhật README`
- `style:`, `refactor:`, `chore:`

## Quy ước code

- Đặt tên biến, hàm rõ nghĩa, nhất quán.
- Không đưa file nhạy cảm (`.env`, mật khẩu, khóa JWT, thông tin Nodemailer) lên GitHub.
- Không commit thư mục `node_modules/`.
- Mỗi Pull Request chỉ nên làm một việc.

## Báo lỗi và đề xuất

Tạo **Issue** mới trên GitHub, ghi rõ:
- Các bước tái hiện lỗi
- Kết quả mong đợi và kết quả thực tế
- Ảnh chụp màn hình (nếu có)

## Quy tắc ứng xử

Tôn trọng, lịch sự và hỗ trợ lẫn nhau trong nhóm.