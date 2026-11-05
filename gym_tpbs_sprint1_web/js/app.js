"use strict";
/* Điều hướng theo hash (#login, #plans, #admin-orders...) và khởi động ứng dụng */

const ROUTES = {
  profile: viewProfile, plans: viewPlans, shop: viewShop, cart: viewCart, orders: viewOrders, checkin: viewCheckin,
  admin: viewAdmin, "admin-plans": () => adminPage("admin-plans", crudHtml("plans")), "admin-products": () => adminPage("admin-products", crudHtml("products")),
  "admin-orders": viewAdminOrders, "admin-rewards": viewRewards,
};

function render() {
  const page = (location.hash || "#").slice(1), u = currentUser(), t = today();
  db.subs.forEach((s) => { if (s.status === "Active" && s.end < t) s.status = "Expired"; });   // tự cập nhật gói hết hạn
  renderNav();
  if (page === "register") return u ? go("profile") : viewRegister();
  if (page === "login") return u ? go("profile") : viewLogin();
  const view = ROUTES[page];
  if (!view) return viewHome();
  if (!u) { flash = { t: "error", m: "Vui lòng đăng nhập để tiếp tục." }; return go("login"); }
  if (page.startsWith("admin") && u.vai_tro !== "Admin") return viewForbidden();
  view();
}
window.addEventListener("hashchange", render);
document.addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b && ACT[b.dataset.act]) { e.preventDefault(); ACT[b.dataset.act](b.dataset, b); } });
document.addEventListener("submit", (e) => { const f = e.target.closest("[data-form]"); if (f && FORM[f.dataset.form]) { e.preventDefault(); FORM[f.dataset.form](Object.fromEntries(new FormData(f)), f); } });
document.addEventListener("change", (e) => { const s = e.target.closest("[data-change]"); if (s && CHG[s.dataset.change]) CHG[s.dataset.change](s.dataset, s.value); });

$("#reset").onclick = () => {
  if (!confirm("Xóa toàn bộ dữ liệu demo trong trình duyệt?")) return;
  try { localStorage.removeItem(KEY); } catch (e) {}
  location.hash = ""; location.reload();
};

(async function init() {
  if (!db.users.some((u) => u.vai_tro === "Admin")) {
    await addUser({ ho_ten: "Quản trị viên", email: "admin@gym.vn", password: "MatKhau123", vai_tro: "Admin" });
  }
  seedData();
  render();
})();
