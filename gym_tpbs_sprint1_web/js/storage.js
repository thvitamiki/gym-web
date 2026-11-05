"use strict";
/* Lưu trữ dữ liệu (localStorage), người dùng và dữ liệu mẫu */

const fresh = () => ({ users: [], history: [], session: null, nextId: 1,
  plans: [], subs: [], products: [], carts: {}, orders: [], checkins: [], expLog: [], badges: [],
  config: { expBase: 10, bonus: 2, cap: 10 }, seeded: false });
let db = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) db = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
// Mỗi bảng tự tăng id riêng: lấy id lớn nhất hiện có + 1
const nid = (coll) => Math.max(0, ...db[coll].map((x) => x.id)) + 1;

async function addUser({ ho_ten, email, so_dien_thoai, password, vai_tro }) {
  const salt = newSalt();
  db.users.push({ id: nid("users"), ho_ten, email, so_dien_thoai: so_dien_thoai || null, salt,
    mat_khau: await hashPw(password, salt), vai_tro, chieu_cao: null, can_nang: null, chi_so_bmi: null,
    exp: 0, streak: 0, last: null });
  save();
}

/* Dữ liệu mẫu cho gói tập, sản phẩm, huy hiệu (chỉ nạp một lần) */
function seedData() {
  db.users.forEach((u) => { u.exp ??= 0; u.streak ??= 0; u.last ??= null; });
  if (db.seeded) return;
  const P = (ten, mo_ta, gia, thoi_han, bmi_min, bmi_max) => db.plans.push({ id: nid("plans"), ten, mo_ta, gia, thoi_han, bmi_min, bmi_max, active: true });
  P("Gói Tăng cơ", "Giáo án tăng cơ, có huấn luyện viên hướng dẫn.", 500000, 30, null, 18.49);
  P("Gói Duy trì", "Tập tự do toàn bộ phòng gym, khung giờ linh hoạt.", 600000, 90, 18.5, 24.99);
  P("Gói Giảm cân", "Cardio kết hợp lớp nhóm và tư vấn dinh dưỡng.", 450000, 30, 25, null);
  P("Gói Tự do 6 tháng", "Dành cho mọi thể trạng, tập không giới hạn.", 2400000, 180, null, null);
  const S = (ten, mo_ta, gia, ton) => db.products.push({ id: nid("products"), ten, mo_ta, gia, ton, active: true });
  S("Whey Protein 2kg", "Bổ sung đạm sau tập, vị chocolate.", 850000, 20);
  S("Creatine 300g", "Hỗ trợ sức mạnh và hiệu suất tập.", 350000, 15);
  S("BCAA 30 lần dùng", "Axit amin chuỗi nhánh, vị cam.", 420000, 10);
  S("Vitamin tổng hợp", "Bổ sung vi chất hằng ngày.", 250000, 30);
  [["Đồng", 0], ["Bạc", 100], ["Vàng", 300]].forEach(([ten, moc]) => db.badges.push({ id: nid("badges"), ten, moc }));
  db.seeded = true; save();
}
