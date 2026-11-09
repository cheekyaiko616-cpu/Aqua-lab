"use strict";
// ===== 汎用ヘルパー（日付・ID・HTMLエスケープ・数字・写真の縮小） =====
const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => y + "-" + pad(m + 1) + "-" + pad(d);
const todayStr = () => { const d = new Date(); return ymd(d.getFullYear(), d.getMonth(), d.getDate()); };
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return ymd(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// 記録の並べ替え用：新しい日付が先／古い日付が先
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
const byDateAsc = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
// 「2026年11月6日（金）」の形
const fmtDateJa = (y, m, d) => y + "年" + m + "月" + d + "日（" + WD[new Date(y, m - 1, d).getDay()] + "）";
const fmtDateKey = (key) => { const [y, m, d] = key.split("-").map(Number); return fmtDateJa(y, m, d); };
const fmtSlash = (key) => (key || "").replace(/-/g, "/");
// 数字の表示（小数は2桁まで、余分な0は付けない）
function fmtNum(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
// 入力欄の数字を読む。空欄は null。範囲外・数字でなければ ok:false
function readNum(id, min, max, integer) {
  const raw = $(id).value.trim();
  if (raw === "") return { ok: true, value: null };
  let n = Number(raw.replace(",", "."));
  if (integer) n = Math.round(n);
  if (!Number.isFinite(n) || n < min || n > max) return { ok: false };
  return { ok: true, value: n };
}
// 中身が前回と同じなら、書き換えない（ちらつきと写真の読み直しを防ぐ）
function setHtml(el, html) {
  if (el._html === html) return false;
  el._html = html;
  el.innerHTML = html;
  return true;
}
// 絵のアイコン（icons.js の図柄を使う）
const svgIcon = (id, cls) => '<svg class="' + (cls || "ic") + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>';

// 写真を小さくしてから保存する
function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("img"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
