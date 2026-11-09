"use strict";
// ===== キーボードまわり（「完了」ボタン・入力確定で閉じる・表示位置の戻し・Tab/Esc/Enter操作） =====
const isField = (el) => !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");

// 入力中だけ出る「完了」ボタン
document.querySelectorAll(".sheet").forEach((sh) => {
  sh.insertAdjacentHTML("afterbegin", '<div class="kb-row"><button class="kb-done" type="button">完了</button></div>');
});
document.querySelectorAll(".kb-done").forEach((b) => {
  b.addEventListener("click", () => { if (document.activeElement) document.activeElement.blur(); });
});
document.querySelectorAll("input, textarea").forEach((el) => { el.enterKeyHint = "done"; });
document.addEventListener("focusin", (e) => { if (isField(e.target)) document.body.classList.add("kb-open"); });
document.addEventListener("focusout", () => {
  setTimeout(() => { if (!isField(document.activeElement)) document.body.classList.remove("kb-open"); }, 50);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "file") e.target.blur();
});
// 入力欄の外をさわったらキーボードを閉じる
document.addEventListener("pointerdown", (e) => {
  const a = document.activeElement;
  if (isField(a) && !isField(e.target) && e.target.tagName !== "SELECT") a.blur();
}, true);
// iPhoneで、キーボードを閉じたあとも表示位置がずれたまま戻らないことがあるため、元の位置に戻す
function realignViewport() {
  if (isField(document.activeElement)) return;
  const vv = window.visualViewport;
  if (window.scrollX || window.scrollY || (vv && vv.offsetTop > 0.5)) window.scrollTo(0, 0);
}
document.addEventListener("focusout", () => { setTimeout(realignViewport, 120); setTimeout(realignViewport, 400); });
if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { setTimeout(realignViewport, 80); });

// ボタンではない部品（ヒーロー・選ぶ行）も、Enter／Spaceで押せるようにする
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const t = e.target;
  if (!t || t.tagName === "BUTTON" || !t.hasAttribute || !t.hasAttribute("tabindex")) return;
  const role = t.getAttribute("role");
  if (role === "button" || role === "checkbox" || role === "radio") { e.preventDefault(); t.click(); }
});
// 開いている画面の中だけで、Tabキーの移動を循環させる
document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || !overlayStack.length) return;
  const top = $(overlayStack[overlayStack.length - 1]);
  const box = top.querySelector(".sheet") || top.querySelector(".frame");
  if (!box) return;
  const items = Array.from(box.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!items.length) { e.preventDefault(); return; }
  const first = items[0], last = items[items.length - 1], cur = document.activeElement;
  if (!box.contains(cur)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (e.shiftKey && (cur === first || cur === box)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
});
// Escapeキー：いちばん上の画面を閉じる
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return;
  e.preventDefault();
  if (top === "askOverlay") closeAsk(); else closeOverlay(top);
});
