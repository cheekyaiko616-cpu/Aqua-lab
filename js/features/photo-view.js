"use strict";
// ===== 写真の拡大表示 =====
function openPhoto(ph) {
  if (!ph) return;
  $("photoImg").src = ph.src;
  $("photoCap").textContent = ph.cap;
  openOverlay("photoOverlay");
}
$("photoClose").onclick = () => closeOverlay("photoOverlay");
