"use strict";
/* Cửa hàng TPBS: sản phẩm, giỏ hàng, đặt hàng, thanh toán mô phỏng, lịch sử (Sprint 3) */

let shopQ = "";
const findProduct = (id) => db.products.find((p) => p.id === id);
const cartOf = (u) => db.carts[u.id] || (db.carts[u.id] = []);

function viewShop() {
  const list = db.products.filter((p) => p.active && p.ten.toLowerCase().includes(shopQ.toLowerCase()));
  $("#app").innerHTML = flashHtml() + '<form class="card wide inl" data-form="search"><input name="q" placeholder="Tìm sản phẩm…" value="' + esc(shopQ) + '"><button class="sm" type="submit">Tìm</button></form><div class="cards">' +
    (list.map((p) => '<form class="card pl" data-form="addcart"><input type="hidden" name="id" value="' + p.id + '"><h2>' + esc(p.ten) + "</h2><p>" + esc(p.mo_ta) +
      "</p><div><b>" + money(p.gia) + '</b> <span class="mut">' + (p.ton > 0 ? "Còn " + p.ton : "Hết hàng") + "</span></div>" +
      (p.ton > 0 ? '<div class="inl"><input name="qty" type="number" min="1" max="' + p.ton + '" value="1"><button class="sm" type="submit">Thêm vào giỏ</button></div>' : "") + "</form>").join("") ||
      '<p class="mut">Không có sản phẩm phù hợp.</p>') + "</div>";
}
FORM.search = (d) => { shopQ = d.q.trim(); render(); };

FORM.addcart = (d) => {
  const u = currentUser(), p = findProduct(+d.id), q = Number(d.qty);
  if (!p || !p.active) return notify("error", "Sản phẩm không còn kinh doanh.");
  if (!Number.isInteger(q) || q < 1) return notify("error", "Số lượng phải là số nguyên từ 1 trở lên.");
  const cart = cartOf(u), it = cart.find((c) => c.pid === p.id), tot = (it ? it.qty : 0) + q;
  if (tot > p.ton) return notify("error", "Chỉ còn " + p.ton + " sản phẩm " + p.ten + ".");
  if (it) it.qty = tot; else cart.push({ pid: p.id, qty: q });
  save(); notify("success", "Đã thêm " + p.ten + " vào giỏ hàng.");
};

function viewCart() {
  const u = currentUser(), cart = cartOf(u).filter((c) => findProduct(c.pid));
  const total = cart.reduce((s, c) => s + findProduct(c.pid).gia * c.qty, 0);
  if (!cart.length) { $("#app").innerHTML = flashHtml() + '<div class="card"><h1>Giỏ hàng</h1><p class="mut">Giỏ hàng đang trống. <a href="#shop">Đến cửa hàng</a></p></div>'; return; }
  $("#app").innerHTML = flashHtml() + '<div class="card wide"><h1>Giỏ hàng</h1><div class="scroll"><table><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr>' +
    cart.map((c) => { const p = findProduct(c.pid);
      return "<tr><td>" + esc(p.ten) + "</td><td>" + money(p.gia) + '</td><td><button class="sm" data-act="cart-dec" data-pid="' + p.id + '">−</button> ' + c.qty +
        ' <button class="sm" data-act="cart-inc" data-pid="' + p.id + '">+</button></td><td>' + money(p.gia * c.qty) + '</td><td><button class="sm" data-act="cart-del" data-pid="' + p.id + '">Xóa</button></td></tr>'; }).join("") +
    '</table></div><h2>Tổng: ' + money(total) + '</h2></div><form class="card" data-form="checkout" novalidate><h1>Thông tin nhận hàng</h1>' +
    '<label>Địa chỉ nhận<input name="addr" maxlength="255"></label><label>Số điện thoại nhận<input name="phone" value="' + esc(u.so_dien_thoai || "") + '"></label>' +
    '<label>Thanh toán<select name="pay"><option value="cod">Thanh toán khi nhận hàng</option><option value="card-ok">Thẻ (mô phỏng, thành công)</option><option value="card-fail">Thẻ (mô phỏng, thất bại)</option></select></label>' +
    '<button class="btn" type="submit">Đặt hàng</button><p class="mut">Máy chủ tính lại giá, kiểm tra tồn kho khi đặt hàng.</p></form>';
}
const cartLine = (pid) => cartOf(currentUser()).find((c) => c.pid === +pid);
ACT["cart-inc"] = ({ pid }) => { const c = cartLine(pid), p = findProduct(+pid);
  if (c.qty + 1 > p.ton) return notify("error", "Chỉ còn " + p.ton + " sản phẩm " + p.ten + "."); c.qty++; save(); render(); };
ACT["cart-dec"] = ({ pid }) => { const c = cartLine(pid); c.qty--; if (c.qty < 1) ACT["cart-del"]({ pid }); else { save(); render(); } };
ACT["cart-del"] = ({ pid }) => { const u = currentUser(); db.carts[u.id] = cartOf(u).filter((c) => c.pid !== +pid); save(); render(); };

FORM.checkout = (d) => {
  const u = currentUser(), cart = cartOf(u), addr = d.addr.trim(), ph = d.phone.trim();
  if (!cart.length) return notify("error", "Giỏ hàng trống.");
  if (!addr) return notify("error", "Vui lòng nhập địa chỉ nhận hàng.");
  if (!PHONE_RE.test(ph)) return notify("error", "Số điện thoại nhận hàng không hợp lệ.");
  const items = [];
  for (const c of cart) {            // xác minh trước, chỉ trừ kho khi mọi dòng đều hợp lệ
    const p = findProduct(c.pid);
    if (!p || !p.active) return notify("error", "Có sản phẩm không còn kinh doanh, vui lòng xóa khỏi giỏ.");
    if (c.qty > p.ton) return notify("error", "Không đủ tồn kho cho " + p.ten + " (còn " + p.ton + ").");
    items.push({ pid: p.id, ten: p.ten, qty: c.qty, gia: p.gia });   // đơn giá chốt tại thời điểm mua
  }
  const total = items.reduce((s, i) => s + i.gia * i.qty, 0);
  items.forEach((i) => { findProduct(i.pid).ton -= i.qty; });
  const paid = d.pay === "card-ok";
  db.orders.push({ id: nid("orders"), uid: u.id, total, t: new Date().toISOString(), status: paid ? "Paid" : "Pending", addr, phone: ph, pay: d.pay, items });
  db.carts[u.id] = []; save();
  flash = d.pay === "card-fail" ? { t: "error", m: "Thanh toán thất bại, đơn ở trạng thái Pending (chưa Paid)." }
    : { t: "success", m: paid ? "Thanh toán thành công, đơn đã Paid." : "Đặt hàng thành công, thanh toán khi nhận hàng." };
  go("orders"); render();
};

const PAY = { cod: "Khi nhận hàng", "card-ok": "Thẻ (mô phỏng)", "card-fail": "Thẻ (mô phỏng)" };
function restoreStock(o) { o.items.forEach((i) => { const p = findProduct(i.pid); if (p) p.ton += i.qty; }); }

function viewOrders() {
  const u = currentUser(), list = db.orders.filter((o) => o.uid === u.id).reverse();
  $("#app").innerHTML = flashHtml() + "<h1>Lịch sử đơn hàng</h1>" + (list.map((o) =>
    '<div class="card wide"><div><b>Đơn #' + o.id + '</b> <span class="tag">' + o.status + '</span> <span class="mut">' + fmtDate(o.t) + " · " + PAY[o.pay] + "</span></div><ul>" +
    o.items.map((i) => "<li>" + esc(i.ten) + " × " + i.qty + " @ " + money(i.gia) + "</li>").join("") + "</ul><div>Tổng: <b>" + money(o.total) + "</b> · Giao tới: " + esc(o.addr) + "</div>" +
    (o.status === "Pending" ? '<button class="sm" data-act="order-cancel" data-id="' + o.id + '">Hủy đơn</button>' : "") + "</div>").join("") || '<p class="mut">Bạn chưa có đơn hàng nào.</p>');
}
ACT["order-cancel"] = ({ id }) => {
  const o = db.orders.find((x) => x.id === +id);
  if (!o || o.uid !== db.session || o.status !== "Pending") return notify("error", "Không thể hủy đơn này.");
  o.status = "Cancelled"; restoreStock(o); save(); notify("success", "Đã hủy đơn #" + o.id + " và hoàn lại tồn kho.");
};
