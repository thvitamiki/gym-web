"use strict";
/* Gamification: điểm danh, chuỗi, EXP, huy hiệu (Sprint 4) */

const badgeFor = (exp) => db.badges.filter((b) => b.moc <= exp).sort((a, b) => b.moc - a.moc)[0] || null;
const streakNow = (u) => (u.last === today() || u.last === addDays(today(), -1)) ? u.streak : 0;

function doCheckin(u) {
  const d = today();
  if (db.checkins.some((c) => c.uid === u.id && c.date === d)) return { err: "Hôm nay bạn đã điểm danh rồi, không cộng thưởng lần nữa." };
  u.streak = u.last === addDays(d, -1) ? u.streak + 1 : 1;   // bỏ lỡ ngày thì chuỗi đặt lại về 1
  u.last = d;
  const exp = db.config.expBase + db.config.bonus * Math.min(u.streak - 1, db.config.cap);
  const before = badgeFor(u.exp);
  u.exp += exp;
  db.checkins.push({ uid: u.id, date: d, exp });
  db.expLog.push({ uid: u.id, exp, reason: "Điểm danh ngày " + d + " (chuỗi " + u.streak + ")", t: new Date().toISOString() });
  save();
  const after = badgeFor(u.exp);
  return { exp, streak: u.streak, up: after && (!before || before.id !== after.id) ? after : null };
}
ACT.checkin = () => {
  const r = doCheckin(currentUser());
  if (r.err) return notify("error", r.err);
  notify("success", "Điểm danh thành công: +" + r.exp + " EXP, chuỗi " + r.streak + " ngày." + (r.up ? " Bạn đạt huy hiệu " + r.up.ten + "!" : ""));
};

function viewCheckin() {
  const u = currentUser(), done = u.last === today(), b = badgeFor(u.exp);
  const next = db.badges.filter((x) => x.moc > u.exp).sort((a, c) => a.moc - c.moc)[0];
  const base = b ? b.moc : 0, pct = next ? Math.round(((u.exp - base) / (next.moc - base)) * 100) : 100;
  const log = db.expLog.filter((l) => l.uid === u.id).slice(-10).reverse();
  $("#app").innerHTML = flashHtml() + '<div class="card wide"><h1>Điểm danh và thành tích</h1><div class="stats">' +
    '<div class="stat"><b>' + u.exp + '</b><span>EXP</span></div><div class="stat"><b>' + streakNow(u) + '</b><span>Chuỗi (ngày)</span></div>' +
    '<div class="stat"><b>' + (b ? esc(b.ten) : "–") + "</b><span>Huy hiệu</span></div></div>" +
    '<div class="bar"><i style="width:' + pct + '%"></i></div><div class="mut">' + (next ? "Còn " + (next.moc - u.exp) + " EXP để đạt " + esc(next.ten) : "Bạn đã đạt huy hiệu cao nhất.") + "</div>" +
    '<button class="btn" data-act="checkin"' + (done ? " disabled" : "") + ">" + (done ? "Hôm nay đã điểm danh" : "Điểm danh hôm nay") + "</button></div>" +
    (log.length ? '<div class="card wide"><h1>Lịch sử thưởng</h1><div class="scroll"><table><tr><th>Thời gian</th><th>EXP</th><th>Lý do</th></tr>' +
      log.map((l) => "<tr><td>" + fmtDate(l.t) + "</td><td>+" + l.exp + "</td><td>" + esc(l.reason) + "</td></tr>").join("") + "</table></div></div>" : "");
}
