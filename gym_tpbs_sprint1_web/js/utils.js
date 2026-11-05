"use strict";
/* Tiện ích: chọn phần tử, escape HTML, băm mật khẩu */

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => new Date(iso).toLocaleString("vi-VN");

async function hashPw(pw, salt) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const newSalt = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("");

/* Bảng xử lý sự kiện dùng chung (click / submit / change) và tiện ích định dạng */
const ACT = {}, FORM = {}, CHG = {};
const money = (n) => Number(n).toLocaleString("vi-VN") + "đ";
const today = () => new Date().toLocaleDateString("sv-SE");
const addDays = (d, n) => { const x = new Date(d + "T00:00:00"); x.setDate(x.getDate() + n); return x.toLocaleDateString("sv-SE"); };
