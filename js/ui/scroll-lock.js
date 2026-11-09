"use strict";
// ===== 画面全体を固定する（上下にスワイプしても、ヘッダー・下のタブ・画面全体が動かないようにする） =====
// 動かせるのは、中身がはみ出している「スクロールできる場所」だけ（本文・重ねた画面・年月の選択など）。
// ・スクロールできない場所をなぞったときは、動きを止める
// ・スクロールできる場所でも、いちばん上でさらに下へ／いちばん下でさらに上へ引っぱったとき（画面ごと伸びる動き）は止める
(function scrollLock() {
  let startY = 0, startX = 0, box = null;

  // 指で触れた場所から外側へたどって、縦にスクロールできる要素を探す
  function scrollableAncestor(el) {
    for (; el && el !== document.documentElement; el = el.parentElement) {
      if (!(el instanceof HTMLElement)) continue;
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) return el;
    }
    return null;
  }
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { box = null; return; }
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    box = scrollableAncestor(e.target);
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1 || !e.cancelable) return;       // 2本指（拡大など）は触らない
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;
    if (Math.abs(dx) > Math.abs(dy)) return;                   // 横の動き（月の切り替え・戻るスワイプ）は邪魔しない
    if (!box) { e.preventDefault(); return; }                  // スクロールできない場所
    const atTop = box.scrollTop <= 0, atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
    if ((dy > 0 && atTop) || (dy < 0 && atBottom)) e.preventDefault();   // 端でさらに引っぱる動き
  }, { passive: false });
})();
