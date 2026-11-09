"use strict";
// ===== 確認ダイアログ（はい／いいえ） =====
let askCb = null;
function askConfirm(msg, onYes) {
  $("askMsg").textContent = msg;
  askCb = onYes;
  overlayOpener.askOverlay = document.activeElement;
  $("askOverlay").classList.add("open");
  pushOverlay("askOverlay");
  focusDialog($("askOverlay"));
}
function closeAsk() {
  $("askOverlay").classList.remove("open");
  askCb = null;
  popOverlay("askOverlay");
  restoreFocus("askOverlay");
}
$("askNo").onclick = closeAsk;
$("askYes").onclick = () => { const cb = askCb; closeAsk(); if (cb) cb(); };
$("askOverlay").addEventListener("click", (e) => { if (e.target.id === "askOverlay") closeAsk(); });
