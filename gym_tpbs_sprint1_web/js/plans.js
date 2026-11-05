"use strict";
/* Gói tập: danh sách, gợi ý theo BMI, đăng ký và hạn gói (Sprint 2) */

const mySub = (u) => db.subs.find((s) => s.uid === u.id && s.status === "Active");
const planFit = (p, bmi) => bmi != null && (p.bmi_min == null || bmi >= p.bmi_min) && (p.bmi_max == null || bmi <= p.bmi_max);
const rangeTxt = (p) => p.bmi_min == null && p.bmi_max == null ? "Mọi mức BMI" : (p.bmi_min ?? 0) + " – " + (p.bmi_max ?? "∞");
const daysLeft = (end) => Math.ceil((new Date(end) - new Date(today())) / 864e5);

function viewPlans() {
  const u = currentUser(), bmi = u.chi_so_bmi, sub = mySub(u);
  const hint = bmi == null
    ? 'Cập nhật chiều cao/cân nặng ở <a href="#profile">Hồ sơ</a> để nhận gợi ý gói tập.'
    : "BMI của bạn là <b>" + bmi.toFixed(2) + "</b> (" + classify(bmi) + "). Gói phù hợp được đánh dấu; bạn vẫn tự chọn gói mong muốn. Gợi ý chỉ mang tính tham khảo.";
  const cards = db.plans.filter((p) => p.active).map((p) => {
    const fit = planFit(p, bmi);
    return '<div class="card pl' + (fit ? " fit" : "") + '"><h2>' + esc(p.ten) + (fit ? ' <span class="tag">Phù hợp BMI</span>' : "") + "</h2><p>" + esc(p.mo_ta) +
      "</p><div><b>" + money(p.gia) + "</b> · " + p.thoi_han + ' ngày</div><div class="mut">BMI gợi ý: ' + rangeTxt(p) + "</div>" +
      '<button class="btn" data-act="subscribe" data-id="' + p.id + '">Đăng ký gói</button></div>';
  }).join("");
  const mine = db.subs.filter((s) => s.uid === u.id).reverse();
  $("#app").innerHTML = flashHtml() + '<div class="card wide"><h1>Gói tập</h1><p>' + hint + "</p>" +
    (sub ? '<div class="msg success">Gói đang dùng: <b>' + esc(sub.ten) + "</b>, hết hạn " + sub.end + " (còn " + daysLeft(sub.end) + " ngày).</div>" : "") +
    '</div><div class="cards">' + (cards || '<p class="mut">Chưa có gói tập nào đang bán.</p>') + "</div>" +
    (mine.length ? '<div class="card wide"><h1>Lịch sử đăng ký</h1><div class="scroll"><table><tr><th>Gói</th><th>Bắt đầu</th><th>Hết hạn</th><th>Giá đã chốt</th><th>Trạng thái</th></tr>' +
      mine.map((s) => "<tr><td>" + esc(s.ten) + "</td><td>" + s.start + "</td><td>" + s.end + "</td><td>" + money(s.gia) + "</td><td>" + s.status + "</td></tr>").join("") + "</table></div></div>" : "");
}

ACT.subscribe = ({ id }) => {
  const u = currentUser(), p = db.plans.find((x) => x.id === +id);
  if (!p || !p.active) return notify("error", "Gói này không còn được bán.");
  if (mySub(u)) return notify("error", "Bạn đang có gói còn hạn, chưa thể đăng ký thêm.");
  const t = today();
  db.subs.push({ id: nid("subs"), uid: u.id, pid: p.id, ten: p.ten, start: t, end: addDays(t, p.thoi_han), gia: p.gia, status: "Active" });
  save(); notify("success", "Đăng ký " + p.ten + " thành công. Giá đã được chốt tại thời điểm mua.");
};
