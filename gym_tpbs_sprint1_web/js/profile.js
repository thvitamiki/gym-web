"use strict";
/* Trang hồ sơ hội viên (task 1.4) */

function viewProfile(errors = {}, form = null) {
  const u = currentUser();
  const f = form || { ho_ten: u.ho_ten, so_dien_thoai: u.so_dien_thoai || "", chieu_cao: u.chieu_cao ?? "", can_nang: u.can_nang ?? "" };
  const hist = db.history.filter((h) => h.uid === u.id).slice().reverse();
  const bmiBox = u.chi_so_bmi != null
    ? '<div class="bmi"><div>BMI: <b>' + u.chi_so_bmi.toFixed(2) + "</b> – " + classify(u.chi_so_bmi) +
      '</div><div class="mut">Chỉ mang tính tham khảo, không phải chẩn đoán y khoa.</div></div>' : "";
  $("#app").innerHTML = '<div class="grid"><form class="card" id="f" novalidate>' + flashHtml() + "<h1>Hồ sơ hội viên</h1>" +
    '<div class="mut">Email: ' + esc(u.email) + "</div>" +
    '<label>Họ tên<input name="ho_ten" maxlength="100" value="' + esc(f.ho_ten) + '"></label>' + fieldErr(errors, "ho_ten") +
    '<label>Số điện thoại<input name="so_dien_thoai" value="' + esc(f.so_dien_thoai) + '"></label>' + fieldErr(errors, "so_dien_thoai") +
    '<div class="row"><div><label>Chiều cao (cm)<input name="chieu_cao" inputmode="decimal" value="' + esc(f.chieu_cao) + '"></label>' + fieldErr(errors, "chieu_cao") +
    '</div><div><label>Cân nặng (kg)<input name="can_nang" inputmode="decimal" value="' + esc(f.can_nang) + '"></label>' + fieldErr(errors, "can_nang") + "</div></div>" +
    '<button class="btn" type="submit">Lưu hồ sơ</button>' + bmiBox + "</form>" +
    (hist.length ? '<div class="card wide"><h1>Lịch sử chỉ số</h1><div class="scroll"><table><tr><th>Thời gian</th><th>Cao (cm)</th><th>Nặng (kg)</th><th>BMI</th></tr>' +
      hist.map((h) => "<tr><td>" + fmtDate(h.t) + "</td><td>" + h.h + "</td><td>" + h.w + "</td><td>" + h.bmi.toFixed(2) + "</td></tr>").join("") +
      "</table></div></div>" : "") + "</div>";
  $("#f").onsubmit = (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target));
    const val = { ho_ten: d.ho_ten.trim(), so_dien_thoai: d.so_dien_thoai.trim(), chieu_cao: d.chieu_cao, can_nang: d.can_nang };
    const e = {};
    if (!val.ho_ten) e.ho_ten = "Vui lòng nhập họ tên.";
    if (val.so_dien_thoai && !PHONE_RE.test(val.so_dien_thoai)) e.so_dien_thoai = "Số điện thoại không hợp lệ (VD: 0912345678).";
    const h = parseMeasure(val.chieu_cao, "Chiều cao", H_RANGE, "cm");
    const w = parseMeasure(val.can_nang, "Cân nặng", W_RANGE, "kg");
    if (h.err) e.chieu_cao = h.err;
    if (w.err) e.can_nang = w.err;
    if (!h.err && !w.err && (h.v == null) !== (w.v == null)) e[h.v == null ? "chieu_cao" : "can_nang"] = "Vui lòng nhập đủ cả chiều cao và cân nặng.";
    if (Object.keys(e).length) return viewProfile(e, val);
    const changed = h.v !== u.chieu_cao || w.v !== u.can_nang;
    u.ho_ten = val.ho_ten; u.so_dien_thoai = val.so_dien_thoai || null;
    u.chieu_cao = h.v; u.can_nang = w.v; u.chi_so_bmi = calcBmi(h.v, w.v);
    if (changed && u.chi_so_bmi != null) db.history.push({ uid: u.id, h: h.v, w: w.v, bmi: u.chi_so_bmi, t: new Date().toISOString() });
    save(); flash = { t: "success", m: "Đã lưu hồ sơ." }; render();
  };
}
