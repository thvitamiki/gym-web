"use strict";
/* Thuật toán BMI và kiểm tra số đo (task 1.5, 1.6) */

function parseMeasure(raw, label, [lo, hi], unit) {
  const s = (raw || "").trim().replace(",", ".");
  if (!s) return { v: null };
  if (!/^\d+(\.\d+)?$/.test(s)) return { err: label + " phải là một số dương." };
  const v = Math.round(Number(s) * 100) / 100;
  if (v < lo || v > hi) return { err: label + " phải nằm trong khoảng " + lo + " – " + hi + " " + unit + "." };
  return { v };
}
const calcBmi = (h, w) => (h && w) ? Math.round((w / Math.pow(h / 100, 2)) * 100) / 100 : null;
function classify(b) {
  if (b == null) return "";
  return b < 18.5 ? "Thiếu cân" : b < 25 ? "Bình thường" : b < 30 ? "Thừa cân" : "Béo phì";
}
