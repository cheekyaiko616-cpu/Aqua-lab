"use strict";
// ===== 選択欄（プルダウン）の選び方 =====
// iPhoneの標準のプルダウンは、選ぶ前や選んだ直後に勝手に閉じてしまうことがあるため、
// 選択欄をタップしたら、アプリ内の一覧（下から出る画面）で選ぶようにする。
// 選んだら、元の選択欄の値を入れ替えて、ふつうの「変更」の動きも同じように起こす。
(function selectPicker() {
  let target = null, lastTouchOpen = 0, sx = 0, sy = 0, moved = false, touching = null;

  const selectOf = (el) => { const s = el && el.closest ? el.closest("select") : null; return s && !s.disabled ? s : null; };
  function titleOf(sel) {
    const lab = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    return (lab && lab.textContent.trim()) || sel.getAttribute("aria-label") || "選ぶ";
  }
  function openSelect(sel) {
    target = sel;
    $("selTitle").textContent = titleOf(sel);
    $("selList").innerHTML = Array.from(sel.options).map((o, i) =>
      '<button type="button" class="sel-opt' + (i === sel.selectedIndex ? " on" : "") + '" role="option" aria-selected="' + (i === sel.selectedIndex) +
      '" data-i="' + i + '"' + (o.disabled ? " disabled" : "") + '><span>' + escapeHtml(o.textContent) + '</span><span class="ck" aria-hidden="true">✓</span></button>').join("");
    openOverlay("selOverlay");
    const on = $("selList").querySelector(".on");
    if (on) requestAnimationFrame(() => on.scrollIntoView({ block: "center" }));
  }
  function choose(i) {
    const sel = target;
    closeOverlay("selOverlay");
    if (!sel || !sel.options[i]) return;
    if (sel.selectedIndex !== i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // 指：動かさずに離した（タップ）ときに開く。標準のプルダウンは出さない
  document.addEventListener("touchstart", (e) => {
    touching = e.touches.length === 1 ? selectOf(e.target) : null;
    if (touching) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; moved = false; }
  }, { passive: true, capture: true });
  document.addEventListener("touchmove", (e) => {
    if (touching && Math.hypot(e.touches[0].clientX - sx, e.touches[0].clientY - sy) > 10) moved = true;
  }, { passive: true, capture: true });
  document.addEventListener("touchend", (e) => {
    const s = touching; touching = null;
    if (!s || moved || !e.cancelable || selectOf(e.target) !== s) return;
    e.preventDefault();                                       // 標準のプルダウンを出さない
    lastTouchOpen = Date.now();
    openSelect(s);
  }, { passive: false, capture: true });
  // マウス・キーボード
  document.addEventListener("mousedown", (e) => { if (selectOf(e.target)) e.preventDefault(); }, true);
  document.addEventListener("click", (e) => {
    const s = selectOf(e.target);
    if (!s) return;
    e.preventDefault();
    if (Date.now() - lastTouchOpen > 700) openSelect(s);
  }, true);
  document.addEventListener("keydown", (e) => {
    const s = selectOf(e.target);
    if (!s || !(e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp")) return;
    e.preventDefault();
    openSelect(s);
  }, true);

  $("selList").onclick = (e) => {
    const b = e.target.closest("[data-i]");
    if (b && !b.disabled) choose(Number(b.dataset.i));
  };
  $("selCancel").onclick = () => closeOverlay("selOverlay");
  overlayOnClose.selOverlay = () => { target = null; };
})();
