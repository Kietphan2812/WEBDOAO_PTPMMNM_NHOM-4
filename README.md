# AURA FASHION - WEBSITE BÁN QUẦN ÁO THỜI TRANG TRỰC TUYẾN
### Đề tài môn học: Phát triển phần mềm mã nguồn mở (PTPMMNM) - Nhóm 4

---
THÀNH VIÊN: .
PHAN TẤN KIỆT .
NGUYỄN NỮ HỒNG NHUNG .
NGUYỄN NHƯ HỒNG HẠNH .
DƯƠNG QUỐC BẢO .
NGUYỄN THẾ NHẤT
 PHÂN CHIA VAI TRÒ
 
  1 Admin ,Maintain (Maintainer / Người duy trì): PHAN TẤN KIỆT
  2 Write (Contributor / Developer / Người ghi):NGUYỄN THẾ NHẤT , NGUYỄN NHƯ HỒNG HẠNH
  3 Community Contributor : DƯƠNG QUỐC BẢO, NGUYỄN NỮ HỒNG NHUNG

## 🌟 Giới Thiệu
Dự án **AURA FASHION** là hệ thống website thương mại điện tử chuyên ngành thời trang được xây dựng hoàn toàn bằng các công nghệ mã nguồn mở (Node.js, Express.js, SQLite, Vanilla CSS/JS, Nodemailer, JWT, bcryptjs).

Hệ thống đáp ứng trọn vẹn và hoàn chỉnh tất cả các yêu cầu theo đề bài:
1. **Đăng ký tài khoản:** Xác thực thông tin, mã hóa mật khẩu bằng bcrypt.
2. **Gửi mail xác nhận:** Tích hợp Nodemailer tự động tạo mã OTP 6 số và gửi email HTML kích hoạt tài khoản.
3. **Đăng nhập:** Cấp phát token bảo mật JWT, ghi nhớ phiên làm việc.
4. **Quên mật khẩu & Tạo lại mật khẩu mới:** Gửi mã xác thực qua email, cho phép nhập OTP và tạo mật khẩu mới an toàn.
5. **Quản lý bài viết thời trang (CRUD & Tìm kiếm):**
   - Tạo bài viết mới (kèm ảnh bìa URL hoặc tải file ảnh).
   - Xem danh sách và xem chi tiết bài viết (tự động đếm lượt xem).
   - Tìm kiếm bài viết theo từ khóa theo thời gian thực và lọc theo chủ đề.
   - Cập nhật bài viết (dành cho tác giả hoặc Admin).
   - Xóa bài viết (có hộp thoại xác nhận).
6. **Quản lý trang cá nhân & Cập nhật thông tin:**
   - Cập nhật họ tên, số điện thoại, địa chỉ giao hàng.
   - Tải lên ảnh đại diện (Avatar).
   - Đổi mật khẩu tài khoản.
   - Xem lịch sử đơn hàng đã mua.
   - Quản lý các bài viết do mình đăng tải.
7. **Thương mại điện tử & Quản trị (Admin):**
   - Danh mục sản phẩm đa dạng (Áo, Quần, Blazer, Váy đầm, Phụ kiện).
   - Lọc sản phẩm, sắp xếp giá, tìm kiếm sản phẩm.
   - Xem chi tiết sản phẩm: chọn Size (S, M, L, XL), chọn Màu sắc, số lượng.
   - Giỏ hàng trực quan, tính toán giá trị đơn hàng.
   - Đặt hàng hỗ trợ phương thức COD hoặc Chuyển khoản QR ngân hàng (VietQR).
   - Trang quản trị (Admin Dashboard) với thống kê doanh thu, đơn hàng, sản phẩm, bài viết và cập nhật trạng thái đơn hàng.
8. **Giao diện hiện đại (Wow factor):** Hỗ trợ chuyển đổi giao diện Sáng / Tối (Light / Dark mode), responsive mượt mà trên máy tính và điện thoại.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (phiên bản 18 trở lên).

### 2. Khởi chạy hệ thống
Tại thư mục dự án `c:\Users\DELL\Desktop\WEBDOAO_PTPMMNM_NHOM 4`, chạy câu lệnh:
```bash
npm start
```
*(Hoặc `npm run dev`)*

### 3. Truy cập website
Mở trình duyệt web và truy cập vào địa chỉ:
👉 **http://localhost:5000**

---

## 👤 Tài Khoản Thử Nghiệm

Hệ thống đã nạp sẵn dữ liệu mẫu cùng 2 tài khoản thử nghiệm:

| Loại tài khoản | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@fashionhub.vn` | `Admin@123` | Quản trị toàn hệ thống, xem thống kê, quản lý sản phẩm, bài viết & đơn hàng |
| **Khách hàng (User)** | `khachhang@fashionhub.vn` | `User@123` | Mua sắm, quản lý trang cá nhân, viết bài thời trang |

*(💡 Tại hộp thoại Đăng Nhập, có sẵn các nút bấm chọn nhanh tài khoản thử nghiệm giúp đăng nhập tức thì mà không cần gõ phím).*

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
WEBDOAO_PTPMMNM_NHOM 4/
├── server/
│   ├── config/
│   │   ├── db.js                # Kết nối SQLite, tự động tạo bảng & nạp dữ liệu mẫu
│   │   └── mailer.js            # Cấu hình Nodemailer gửi email OTP & kích hoạt
│   ├── middleware/
│   │   ├── auth.js              # Middleware xác thực JWT & phân quyền Admin
│   │   └── upload.js            # Middleware Multer upload ảnh đại diện và bài viết
│   └── routes/
│       ├── auth.js              # API: Đăng ký, đăng nhập, xác nhận email, quên/đặt lại pass
│       ├── user.js              # API: Trang cá nhân, cập nhật thông tin, avatar, đổi pass
│       ├── posts.js             # API: CRUD bài viết, tìm kiếm bài viết, đếm view
│       ├── products.js          # API: Danh sách sản phẩm, bộ lọc, chi tiết, CRUD sản phẩm
│       ├── orders.js            # API: Đặt hàng, đơn hàng cá nhân, quản trị đơn hàng
│       └── stats.js             # API: Thống kê doanh thu, đơn hàng cho Admin
├── public/
│   ├── css/
│   │   ├── style.css            # Hệ thống Design System, typography, header, modal, toast
│   │   ├── shop.css             # Banner hero, danh mục, lưới sản phẩm, giỏ hàng, checkout
│   │   ├── blog.css             # Giao diện bài viết thời trang, tìm kiếm, đọc bài, tạo bài
│   │   ├── auth.css             # Giao diện đăng nhập, đăng ký, OTP xác thực email
│   │   ├── profile.css          # Giao diện quản lý trang cá nhân, avatar, đơn hàng
│   │   └── admin.css            # Giao diện quản trị, thống kê số liệu kinh doanh
│   ├── js/
│   │   ├── api.js               # Thư viện gọi API với JWT token tự động & thông báo toast
│   │   ├── auth.js              # Xử lý nghiệp vụ đăng nhập, đăng ký, kích hoạt email, quên mật khẩu
│   │   ├── shop.js              # Xử lý duyệt sản phẩm, lọc danh mục, giỏ hàng, đặt hàng
│   │   ├── blog.js              # Xử lý CRUD bài viết thời trang, tìm kiếm, xem chi tiết
│   │   ├── profile.js           # Xử lý cập nhật thông tin cá nhân, avatar, đổi mật khẩu
│   │   ├── admin.js             # Xử lý bảng điều khiển quản trị, cập nhật trạng thái đơn
│   │   └── app.js               # Điều hướng SPA (Hash router), quản lý modal, Dark/Light mode
│   ├── uploads/                 # Thư mục lưu trữ hình ảnh upload
│   └── index.html               # Trang ứng dụng Single Page Application chính
├── docs/
│   ├── BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.md    # Báo cáo chi tiết phân tích thiết kế hệ thống
│   └── BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.html  # Bản HTML chuẩn in ấn / xuất PDF báo cáo
├── database.sqlite              # Cơ sở dữ liệu SQLite độc lập
├── server.js                    # Tệp khởi chạy máy chủ Express
├── package.json
└── README.md
```

---

## 📄 Tài Liệu Bàn Giao Kèm Theo
1. **Mã nguồn hoàn chỉnh:** Toàn bộ source code của dự án chạy trực tiếp không cần cấu hình phức tạp.
2. **Tài liệu phân tích & thiết kế hệ thống:**
   - Xem định dạng Markdown: [BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.md](docs/BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.md)
   - Xem định dạng HTML có thể mở trên trình duyệt hoặc in ra PDF: [BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.html](docs/BAO_CAO_PHAN_TICH_THIET_KE_HE_THONG.html)

---
© 2026 - **Nhóm 4 - Phát triển phần mềm mã nguồn mở**.
