"use strict";
// ===== 起動画面：アイコンを、ポケストップのようにコマ回しする =====
// 平らな絵を薄い板（厚みのある円盤）として立体にし、回転の勢い・摩擦・はずみを計算して動かす。
//   ・板は同じ絵を奥行き方向に何枚も重ねて作る（真横から見ると厚みが見える）
//   ・ゆっくり回り続ける（回り始めは勢いが付くまで少し遅い）。画面が切り替わった時点で終わる
//   ・ゆるやかに傾き、浮き沈みする
const SPLASH_MS = 2400;          // 起動画面を出している時間
(function splashSpin() {
  const host = document.getElementById("splashIc");
  if (!host) return;
  const SRC = "icons/icon-1024.png", SIZE = 180, LAYERS = 18, THICK = 16;
  host.innerHTML = '<div class="splash-disc" id="splashDisc"></div><div class="splash-shadow" id="splashShadow"></div>';
  const disc = document.getElementById("splashDisc"), shadow = document.getElementById("splashShadow");
  for (let i = 0; i < LAYERS; i++) {
    const z = (i / (LAYERS - 1) - 0.5) * THICK;                  // -THICK/2 〜 +THICK/2
    const edge = Math.abs(z) / (THICK / 2);                      // 表裏の面=1、真ん中=0
    const im = document.createElement("img");
    im.src = SRC; im.alt = ""; im.draggable = false;
    im.style.transform = "translateZ(" + z.toFixed(2) + "px)";
    im.style.filter = "brightness(" + (0.62 + 0.38 * Math.pow(edge, 3)).toFixed(3) + ")";   // 側面は少し暗く
    disc.appendChild(im);
  }

  // ゆっくり回り続ける（起動画面が消えるまで）。回り始めだけ、勢いが少しずつ付く
  const W = 150;         // 回る速さ（度/秒）…2.4秒の間に1回転ほど
  const SPIN_UP = 3.2;   // 勢いの付きやすさ（大きいほど早く回り出す）
  let th = 0, w = 0, t0 = null, last = null;

  function frame(ts) {
    if (!disc.isConnected) return;                              // 起動画面が消えたら終わり
    if (t0 === null) { t0 = ts; last = ts; }
    const dt = Math.min(0.033, (ts - last) / 1000); last = ts;
    const t = (ts - t0) / 1000;
    w += (W - w) * Math.min(1, SPIN_UP * dt);                   // 目標の速さへ、なめらかに近づく
    th += w * dt;
    const tilt = 7 * Math.sin(t * 2.4);                         // ゆるやかなふらつき
    const lift = -6 + 3 * Math.sin(t * 2.0);                    // 水に浮くような上下
    disc.style.transform = "translateY(" + lift.toFixed(1) + "px) rotateX(" + tilt.toFixed(1) + "deg) rotateY(" + th.toFixed(2) + "deg)";
    // 影：真横を向くと細くなる
    const face = Math.abs(Math.cos(th * Math.PI / 180));
    shadow.style.transform = "translateX(-50%) scale(" + (0.25 + 0.75 * face).toFixed(3) + ", 1)";
    shadow.style.opacity = "0.3";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
