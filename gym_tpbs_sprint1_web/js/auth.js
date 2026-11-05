"use strict";
/* Đăng ký và đăng nhập (task 1.2, 1.3) */

function viewRegister(errors = {}, v = {}) {
  $("#app").innerHTML = '<form class="card" id="f" novalidate>' + flashHtml() + "<h1>Đăng ký</h1>" +
    '<label>Họ tên<input name="ho_ten" maxlength="100" value="' + esc(v.ho_ten) + '"></label>' + fieldErr(errors, "ho_ten") +
    '<label>Email<input name="email" type="email" maxlength="150" value="' + esc(v.email) + '"></label>' + fieldErr(errors, "email") +
    '<label>Số điện thoại (tùy chọn)<input name="so_dien_thoai" value="' + esc(v.so_dien_thoai) + '"></label>' + fieldErr(errors, "so_dien_thoai") +
    '<label>Mật khẩu<input name="mat_khau" type="password" autocomplete="new-password"></label>' + fieldErr(errors, "mat_khau") +
    '<label>Xác nhận mật khẩu<input name="xac_nhan" type="password" autocomplete="new-password"></label>' + fieldErr(errors, "xac_nhan") +
    '<button class="btn" type="submit">Đăng ký</button></form>';
  $("#f").onsubmit = async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target));
    const val = { ho_ten: d.ho_ten.trim(), email: d.email.trim().toLowerCase(), so_dien_thoai: d.so_dien_thoai.trim() };
    const e = {};
    if (!val.ho_ten) e.ho_ten = "Vui lòng nhập họ tên.";
    if (!val.email) e.email = "Vui lòng nhập email.";
    else if (!EMAIL_RE.test(val.email)) e.email = "Email không hợp lệ.";
    else if (db.users.some((u) => u.email === val.email)) e.email = "Email này đã được đăng ký.";
    if (val.so_dien_thoai && !PHONE_RE.test(val.so_dien_thoai)) e.so_dien_thoai = "Số điện thoại không hợp lệ (VD: 0912345678).";
    if (d.mat_khau.length < 8) e.mat_khau = "Mật khẩu tối thiểu 8 ký tự.";
    else if (d.mat_khau !== d.xac_nhan) e.xac_nhan = "Mật khẩu xác nhận không khớp.";
    if (Object.keys(e).length) return viewRegister(e, val);
    await addUser({ ...val, password: d.mat_khau, vai_tro: "Member" });
    flash = { t: "success", m: "Đăng ký thành công. Hãy đăng nhập." };
    go("login"); render();
  };
}

function viewLogin(email = "") {
  $("#app").innerHTML = '<form class="card" id="f">' + flashHtml() + "<h1>Đăng nhập</h1>" +
    '<label>Email<input name="email" type="email" value="' + esc(email) + '"></label>' +
    '<label>Mật khẩu<input name="mat_khau" type="password" autocomplete="current-password"></label>' +
    '<button class="btn" type="submit">Đăng nhập</button>' +
    '<p class="mut">Tài khoản Admin demo: admin@gym.vn / MatKhau123</p></form>';
  $("#f").onsubmit = async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target));
    const em = d.email.trim().toLowerCase();
    const u = db.users.find((x) => x.email === em);
    const hash = await hashPw(d.mat_khau, u ? u.salt : "x");
    if (u && hash === u.mat_khau) { db.session = u.id; save(); go(u.vai_tro === "Admin" ? "admin" : "profile"); render(); return; }
    flash = { t: "error", m: "Email hoặc mật khẩu không đúng." };
    viewLogin(em);
  };
}
