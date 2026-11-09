"use strict";
// ===== 重ねて出す画面（オーバーレイ）を開く・閉じる共通処理 =====
// 開いている画面は overlayStack に積む（いちばん上＝最後）。
//  ・Escapeキーで、いちばん上の画面を閉じる
//  ・Tabキーの移動を、いちばん上の画面の中に閉じ込める（keyboard.js）
//  ・閉じたら、開く前に触っていたボタンへフォーカスを戻す
// mode: 省略＝下へ滑り落ちて閉じる／"right"＝右へ滑って閉じる／"instant"＝すぐ消す
const OVERLAY_IDS = ["tankOverlay", "fishOverlay", "historyOverlay", "dayOverlay", "pickOverlay", "wheelOverlay",
  "tankPickOverlay", "tankEditOverlay", "fishEditOverlay", "equipEditOverlay", "treatEditOverlay", "logOverlay", "photoOverlay", "tagOverlay"];
const overlayStack = [];
const overlayOpener = {};
const overlayOnClose = {};   // 画面ごとの「閉じたときの後片付け」。各画面のファイルで登録する

function pushOverlay(id) {
  const i = overlayStack.indexOf(id);
  if (i >= 0) overlayStack.splice(i, 1);
  overlayStack.push(id);
}
function popOverlay(id) {
  const i = overlayStack.indexOf(id);
  if (i >= 0) overlayStack.splice(i, 1);
}
function isOpen(id) { return $(id).classList.contains("open"); }
// 画面の枠にフォーカスを移す（読み上げ・キーボード操作の起点）
function focusDialog(el) {
  requestAnimationFrame(() => {
    if (!el.classList.contains("open") || overlayStack[overlayStack.length - 1] !== el.id) return;
    const box = el.querySelector(".sheet") || el.querySelector(".frame");
    if (!box) return;
    if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
    box.focus({ preventScroll: true });
  });
}
function restoreFocus(id) {
  const o = overlayOpener[id];
  delete overlayOpener[id];
  // 文字入力欄に戻すとキーボードが出てしまうので、ボタンなどだけに戻す
  if (o && o.isConnected && o !== document.body && !isField(o) && o.focus) o.focus({ preventScroll: true });
}
function openOverlay(id) {
  const el = $(id);
  if (el._cancelClose) el._cancelClose();
  const already = el.classList.contains("open");
  if (!already) overlayOpener[id] = document.activeElement;
  el.classList.add("open");
  pushOverlay(id);
  if (!already || !el.contains(document.activeElement)) focusDialog(el);
}
function blurInside(el) {
  const a = document.activeElement;
  if (a && a !== document.body && el.contains(a) && a.blur) a.blur();
}
function closeOverlay(id, mode) {
  const el = $(id);
  const sheet = el.querySelector(".sheet");
  if (overlayOnClose[id]) overlayOnClose[id]();
  if (el.dataset.closing) return;
  popOverlay(id);
  if (!sheet || mode === "instant" || !el.classList.contains("open")) { blurInside(el); el.classList.remove("open"); restoreFocus(id); return; }
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  el.dataset.closing = "1";
  el.style.pointerEvents = "none";
  el.style.transition = "background-color .24s ease";
  el.style.backgroundColor = "transparent";
  sheet.style.transition = "transform .24s cubic-bezier(.4,0,1,1)";
  sheet.style.transform = mode === "right" ? "translate3d(100%,0,0)" : "translate3d(0," + (window.innerHeight + 40) + "px,0)";
  let done = false;
  const reset = () => {
    delete el.dataset.closing;
    el._cancelClose = null;
    el.style.pointerEvents = "";
    el.style.transition = "";
    el.style.backgroundColor = "";
  };
  el._cancelClose = () => {
    if (done) return;
    done = true;
    sheet.style.transition = "none";
    sheet.style.transform = "";
    reset();
    void sheet.offsetWidth;
    sheet.style.transition = "";
  };
  const finish = () => {
    if (done) return;
    done = true;
    blurInside(el);
    el.classList.remove("open");
    sheet.style.transition = "none";
    sheet.style.transform = "";
    reset();
    void sheet.offsetWidth;
    sheet.style.transition = "";
    restoreFocus(id);
  };
  sheet.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 320);
}

// 画面の外側（暗い部分）をタップすると閉じる
OVERLAY_IDS.forEach((id) => {
  $(id).addEventListener("click", (e) => { if (e.target.id === id) closeOverlay(id); });
});
