"use strict";
/* Trang quản trị: hội viên, gói tập, sản phẩm, đơn hàng, phần thưởng; báo lỗi 403 */

const ADMIN_TABS = [
  ["admin", "Hội viên"],
  ["admin-plans", "Gói tập"],
  ["admin-products", "Sản phẩm"],
  ["admin-orders", "Đơn hàng"],
  ["admin-rewards", "Phần thưởng"],
];
function adminPage(cur, html) {
  $("#app").innerHTML =
    '<div class="tabs">' +
    ADMIN_TABS.map(
      ([h, t]) =>
        '<a href="#' +
        h +
        '"' +
        (h === cur ? ' class="on"' : "") +
        ">" +
        t +
        "</a>",
    ).join("") +
    "</div>" +
    flashHtml() +
    html;
}
function viewForbidden() {
  $("#app").innerHTML =
    '<div class="card"><h1>403 – Không đủ quyền</h1><p>Chức năng này chỉ dành cho Admin.</p></div>';
}

function viewAdmin() {
  const rows = db.users
    .map((u) => {
      const s = mySub(u),
        b = badgeFor(u.exp);
      return (
        "<tr><td>" +
        u.id +
        "</td><td>" +
        esc(u.ho_ten) +
        "</td><td>" +
        esc(u.email) +
        "</td><td>" +
        esc(u.so_dien_thoai || "–") +
        "</td><td>" +
        u.vai_tro +
        "</td><td>" +
        (u.chi_so_bmi != null ? u.chi_so_bmi.toFixed(2) : "–") +
        "</td><td>" +
        (s ? esc(s.ten) + " (đến " + s.end + ")" : "–") +
        "</td><td>" +
        u.exp +
        (b ? " · " + esc(b.ten) : "") +
        "</td></tr>"
      );
    })
    .join("");
  adminPage(
    "admin",
    '<div class="card wide"><h1>Danh sách hội viên</h1><div class="scroll"><table><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>BMI</th><th>Gói tập</th><th>EXP</th></tr>' +
      rows +
      "</table></div></div>",
  );
}

/* ---- CRUD dùng chung cho gói tập, sản phẩm, huy hiệu ---- */
const num = (v) => (v === "" ? null : Number(v));
const CRUD = {
  plans: {
    coll: "plans",
    title: "Quản lý gói tập",
    active: true,
    cols: [
      ["ten", "Tên"],
      ["gia", "Giá", (r) => money(r.gia)],
      ["thoi_han", "Ngày"],
      ["bmi", "BMI gợi ý", rangeTxt],
    ],
    fields: [
      ["ten", "Tên gói"],
      ["mo_ta", "Mô tả"],
      ["gia", "Giá (đ)", "number"],
      ["thoi_han", "Thời hạn (ngày)", "number"],
      ["bmi_min", "BMI tối thiểu", "number"],
      ["bmi_max", "BMI tối đa", "number"],
    ],
    build(d) {
      const gia = Number(d.gia),
        th = Number(d.thoi_han),
        a = num(d.bmi_min),
        b = num(d.bmi_max);
      if (!d.ten.trim()) return { err: "Vui lòng nhập tên gói." };
      if (d.gia === "" || !(gia >= 0)) return { err: "Giá không hợp lệ." };
      if (!Number.isInteger(th) || th <= 0)
        return { err: "Thời hạn phải là số nguyên dương." };
      if (
        (a != null && !(a >= 0)) ||
        (b != null && !(b >= 0)) ||
        (a != null && b != null && a > b)
      )
        return { err: "Khoảng BMI không hợp lệ." };
      return {
        obj: {
          ten: d.ten.trim(),
          mo_ta: d.mo_ta.trim(),
          gia,
          thoi_han: th,
          bmi_min: a,
          bmi_max: b,
        },
      };
    },
  },
  products: {
    coll: "products",
    title: "Quản lý sản phẩm",
    active: true,
    cols: [
      ["ten", "Tên"],
      ["gia", "Giá", (r) => money(r.gia)],
      ["ton", "Tồn kho"],
    ],
    fields: [
      ["ten", "Tên sản phẩm"],
      ["mo_ta", "Mô tả"],
      ["gia", "Giá bán (đ)", "number"],
      ["ton", "Tồn kho", "number"],
    ],
    build(d) {
      const gia = Number(d.gia),
        ton = Number(d.ton);
      if (!d.ten.trim()) return { err: "Vui lòng nhập tên sản phẩm." };
      if (d.gia === "" || !(gia >= 0)) return { err: "Giá bán không hợp lệ." };
      if (d.ton === "" || !Number.isInteger(ton) || ton < 0)
        return { err: "Tồn kho phải là số nguyên không âm." };
      return { obj: { ten: d.ten.trim(), mo_ta: d.mo_ta.trim(), gia, ton } };
    },
  },
  badges: {
    coll: "badges",
    title: "Huy hiệu và mốc EXP",
    active: false,
    cols: [
      ["ten", "Huy hiệu"],
      ["moc", "EXP yêu cầu"],
    ],
    fields: [
      ["ten", "Tên huy hiệu"],
      ["moc", "EXP tối thiểu", "number"],
    ],
    build(d, id) {
      const moc = Number(d.moc);
      if (!d.ten.trim()) return { err: "Vui lòng nhập tên huy hiệu." };
      if (d.moc === "" || !Number.isInteger(moc) || moc < 0)
        return { err: "Mốc EXP phải là số nguyên không âm." };
      if (db.badges.some((b) => b.ten === d.ten.trim() && b.id !== id))
        return { err: "Tên huy hiệu đã tồn tại." };
      return { obj: { ten: d.ten.trim(), moc } };
    },
  },
};
const editing = {};
const fld = (n, l, v, t) =>
  "<label>" +
  l +
  '<input name="' +
  n +
  '" type="' +
  (t || "text") +
  '"' +
  (t === "number" ? ' step="any"' : "") +
  ' value="' +
  esc(v ?? "") +
  '"></label>';

function crudHtml(kind) {
  const c = CRUD[kind],
    e = editing[kind],
    rec = e === "new" ? {} : db[c.coll].find((x) => x.id === e) || {};
  const form = e
    ? '<form class="card wide" data-form="crud" novalidate><input type="hidden" name="kind" value="' +
      kind +
      '"><input type="hidden" name="id" value="' +
      (rec.id || "") +
      '"><h2>' +
      (rec.id ? "Sửa" : "Thêm mới") +
      '</h2><div class="row">' +
      c.fields.map(([k, l, t]) => fld(k, l, rec[k], t)).join("") +
      '</div><button class="btn" type="submit">Lưu</button></form>'
    : "";
  const rows = db[c.coll]
    .map(
      (r) =>
        "<tr>" +
        c.cols
          .map(([k, , f]) => "<td>" + esc(f ? f(r) : r[k]) + "</td>")
          .join("") +
        (c.active ? "<td>" + (r.active ? "Đang bán" : "Đã ẩn") + "</td>" : "") +
        '<td><button class="sm" data-act="crud-edit" data-kind="' +
        kind +
        '" data-id="' +
        r.id +
        '">Sửa</button> <button class="sm" data-act="crud-' +
        (c.active ? "toggle" : "del") +
        '" data-kind="' +
        kind +
        '" data-id="' +
        r.id +
        '">' +
        (c.active ? (r.active ? "Ẩn" : "Hiện") : "Xóa") +
        "</button></td></tr>",
    )
    .join("");
  return (
    form +
    '<div class="card wide"><h1>' +
    c.title +
    ' <button class="sm" data-act="crud-edit" data-kind="' +
    kind +
    '" data-id="new">+ Thêm</button></h1><div class="scroll"><table><tr>' +
    c.cols.map(([, l]) => "<th>" + l + "</th>").join("") +
    (c.active ? "<th>Trạng thái</th>" : "") +
    "<th></th></tr>" +
    rows +
    "</table></div></div>"
  );
}
ACT["crud-edit"] = ({ kind, id }) => {
  editing[kind] = id === "new" ? "new" : +id;
  render();
};
ACT["crud-toggle"] = ({ kind, id }) => {
  const r = db[CRUD[kind].coll].find((x) => x.id === +id);
  r.active = !r.active;
  save();
  render();
};
ACT["crud-del"] = ({ kind, id }) => {
  const c = CRUD[kind];
  db[c.coll] = db[c.coll].filter((x) => x.id !== +id);
  if (kind === "badges") {
    /* huy hiệu tính theo EXP nên tự cập nhật */
  }
  save();
  render();
};
FORM.crud = (d) => {
  const c = CRUD[d.kind],
    id = d.id ? +d.id : null,
    r = c.build(d, id);
  if (r.err) return notify("error", r.err);
  if (id)
    Object.assign(
      db[c.coll].find((x) => x.id === id),
      r.obj,
    );
  else
    db[c.coll].push(
      Object.assign(
        { id: nid(c.coll) },
        r.obj,
        c.active ? { active: true } : {},
      ),
    );
  editing[d.kind] = null;
  save();
  notify("success", "Đã lưu.");
};

/* ---- Đơn hàng ---- */
const STATUSES = ["Pending", "Paid", "Shipping", "Done", "Cancelled"];
function viewAdminOrders() {
  const rows = db.orders
    .slice()
    .reverse()
    .map((o) => {
      const u = db.users.find((x) => x.id === o.uid);
      return (
        "<tr><td>#" +
        o.id +
        "</td><td>" +
        esc(u ? u.email : "?") +
        "</td><td>" +
        fmtDate(o.t) +
        "</td><td>" +
        o.items.map((i) => esc(i.ten) + "×" + i.qty).join(", ") +
        "</td><td>" +
        money(o.total) +
        "</td><td>" +
        PAY[o.pay] +
        '</td><td><select data-change="order-status" data-id="' +
        o.id +
        '">' +
        STATUSES.map(
          (s) =>
            "<option" +
            (s === o.status ? " selected" : "") +
            ">" +
            s +
            "</option>",
        ).join("") +
        "</select></td></tr>"
      );
    })
    .join("");
  adminPage(
    "admin-orders",
    '<div class="card wide"><h1>Quản lý đơn hàng</h1>' +
      (rows
        ? '<div class="scroll"><table><tr><th>Mã</th><th>Khách</th><th>Thời gian</th><th>Sản phẩm</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th></tr>' +
          rows +
          "</table></div>"
        : '<p class="mut">Chưa có đơn hàng.</p>') +
      "</div>",
  );
}
CHG["order-status"] = ({ id }, val) => {
  const o = db.orders.find((x) => x.id === +id);
  if (o.status === "Cancelled")
    return notify("error", "Đơn đã hủy không thể mở lại.");
  if (val === "Cancelled") restoreStock(o);
  o.status = val;
  save();
  notify("success", "Đã cập nhật đơn #" + o.id + " thành " + val + ".");
};

/* ---- Phần thưởng ---- */
function viewRewards() {
  const c = db.config,
    log = db.expLog.slice(-10).reverse();
  adminPage(
    "admin-rewards",
    '<form class="card wide" data-form="config" novalidate><h1>Cấu hình EXP điểm danh</h1><div class="row">' +
      fld("expBase", "EXP cơ bản mỗi lần", c.expBase, "number") +
      fld("bonus", "Thưởng thêm mỗi ngày trong chuỗi", c.bonus, "number") +
      fld("cap", "Số ngày chuỗi tối đa được thưởng thêm", c.cap, "number") +
      '</div><button class="btn" type="submit">Lưu cấu hình</button></form>' +
      crudHtml("badges") +
      (log.length
        ? '<div class="card wide"><h1>Lịch sử thưởng gần đây</h1><div class="scroll"><table><tr><th>Thời gian</th><th>Hội viên</th><th>EXP</th><th>Lý do</th></tr>' +
          log
            .map((l) => {
              const u = db.users.find((x) => x.id === l.uid);
              return (
                "<tr><td>" +
                fmtDate(l.t) +
                "</td><td>" +
                esc(u ? u.email : "?") +
                "</td><td>+" +
                l.exp +
                "</td><td>" +
                esc(l.reason) +
                "</td></tr>"
              );
            })
            .join("") +
          "</table></div></div>"
        : ""),
  );
}
FORM.config = (d) => {
  const v = ["expBase", "bonus", "cap"].map((k) => Number(d[k]));
  if (
    ["expBase", "bonus", "cap"].some((k) => d[k] === "") ||
    v.some((x) => !Number.isInteger(x) || x < 0)
  )
    return notify("error", "Các giá trị phải là số nguyên không âm.");
  [db.config.expBase, db.config.bonus, db.config.cap] = v;
  save();
  notify("success", "Đã lưu cấu hình thưởng.");
};
