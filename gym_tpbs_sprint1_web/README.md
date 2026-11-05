# Gym & TPBS – bản web demo (Sprint 1–4)

Mở `index.html` bằng trình duyệt là chạy (không cần server). Dữ liệu lưu trong localStorage của trình duyệt.
Tài khoản Admin demo: `admin@gym.vn` / `MatKhau123`. Hội viên tự đăng ký ở trang Đăng ký.

| Sprint | Chức năng | File |
|---|---|---|
| 1 | Đăng ký/đăng nhập, phân quyền, hồ sơ, BMI | `auth.js`, `profile.js`, `bmi.js` |
| 2 | Gói tập, gợi ý theo BMI, đăng ký, hạn gói; admin CRUD gói | `plans.js`, `admin.js` |
| 3 | Sản phẩm, giỏ hàng, đặt hàng, thanh toán mô phỏng, lịch sử; admin sản phẩm/đơn | `shop.js`, `admin.js` |
| 4 | Điểm danh, chuỗi, EXP, huy hiệu; admin cấu hình thưởng | `gamify.js`, `admin.js` |

Thứ tự nạp script trong `index.html` quan trọng (không dùng ES module để mở trực tiếp bằng file).
Đây là bản demo giao diện: mật khẩu chỉ băm SHA-256 + salt và việc kiểm tra quyền chạy ở trình duyệt.
Bản thật cần backend (xem dự án Flask ở Sprint 1) để kiểm tra giá, tồn kho, quyền phía máy chủ.
