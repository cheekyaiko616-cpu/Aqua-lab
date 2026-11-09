"use strict";
// ===== 指の操作（スワイプで戻る・下へ引っ張って閉じる・左右スワイプ・拡大の無効化） =====

// 動き始めの向きを決める：縦の動きが横の1.3倍より大きければ縦、そうでなければ横
function swipeAxis(dx, dy) { return Math.abs(dy) > Math.abs(dx) * 1.3 ? "v" : "h"; }

// 左右スワイプを受け取る共通処理（cb(1)=左へスワイプ＝次、cb(-1)=右へスワイプ＝前）
function onHSwipe(el, cb) {
  let sx = 0, sy = 0, st = 0, active = false, axis = "";
  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { active = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); active = true; axis = "";
  }, { passive: true });
  el.addEventListener("touchmove", (e) => {
    if (!active || axis) return;
    const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (Math.hypot(dx, dy) >= 12) axis = swipeAxis(dx, dy);
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (axis === "h" && Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.6 && Date.now() - st < 700) cb(dx < 0 ? 1 : -1);
  }, { passive: true });
  el.addEventListener("touchcancel", () => { active = false; }, { passive: true });
}
// 左右に動かしたときの、横から滑り込む動き
function slideIn(el, delta) {
  el.classList.remove("day-from-right", "day-from-left");
  void el.offsetWidth;
  el.classList.add(delta > 0 ? "day-from-right" : "day-from-left");
}

// ---- 左から右へのスワイプで1つ前の画面へ戻る（入力画面） ----
["tankEditOverlay", "fishEditOverlay", "pickOverlay", "logOverlay"].forEach((id) => {
  const el = $(id);
  let sx = 0, sy = 0, st = 0, active = false;
  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { active = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); active = true;
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (dx > 80 && Math.abs(dy) < 60 && Date.now() - st < 700) {
      if (isField(document.activeElement)) document.activeElement.blur();
      closeOverlay(id, "right");
    }
  }, { passive: true });
});

// ---- 画面の一番上で下へ引っ張ると閉じる（見る画面） ----
["tankOverlay", "fishOverlay", "historyOverlay", "dayOverlay", "tankPickOverlay", "tagOverlay"].forEach((id) => {
  const sheet = $(id).querySelector(".sheet");
  const CLOSE_AT = 120;
  let sx = 0, sy = 0, atTop = false, pulling = false, pullY = 0, raf = 0, axis = "";
  function snapBack() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    sheet.style.transition = "transform .2s ease";
    sheet.style.transform = "";
    setTimeout(() => { if (!pulling) sheet.style.willChange = ""; }, 260);
  }
  sheet.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { atTop = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    atTop = sheet.scrollTop <= 0; pulling = false; axis = "";
  }, { passive: true });
  sheet.addEventListener("touchmove", (e) => {
    if (!atTop) return;
    if (sheet.querySelector(".sorting")) { atTop = false; return; }   // タグの並べ替え中は閉じない
    const dy = e.touches[0].clientY - sy, dx = e.touches[0].clientX - sx;
    if (!axis && Math.hypot(dx, dy) >= 12) axis = swipeAxis(dx, dy);
    if (!pulling) {
      if (axis !== "v" || dy <= 8) return;
      pulling = true;
      if (isField(document.activeElement)) document.activeElement.blur();
    }
    if (e.cancelable) e.preventDefault();
    pullY = Math.max(0, (dy - 8) * 0.6);
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      sheet.style.willChange = "transform";
      sheet.style.transition = "none";
      sheet.style.transform = "translate3d(0," + pullY + "px,0)";
    });
  }, { passive: false });
  sheet.addEventListener("touchend", (e) => {
    if (!pulling) return;
    pulling = false; atTop = false;
    const dy = e.changedTouches[0].clientY - sy;
    if (dy - 8 >= CLOSE_AT) {
      sheet.style.transition = "transform .24s cubic-bezier(.4,0,1,1)";
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      sheet.style.transform = "translate3d(0," + (window.innerHeight + 40) + "px,0)";
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        sheet.style.transition = "none"; sheet.style.transform = ""; sheet.style.willChange = "";
        closeOverlay(id, "instant");
      };
      sheet.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 320);
    } else {
      snapBack();
    }
  }, { passive: true });
  sheet.addEventListener("touchcancel", () => { pulling = false; atTop = false; snapBack(); }, { passive: true });
});

// ---- 拡大・縮小の無効化 ----
["gesturestart", "gesturechange", "gestureend"].forEach((t) => {
  document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
});
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
