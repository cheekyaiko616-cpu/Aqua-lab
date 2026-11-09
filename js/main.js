"use strict";
// ===== 起動（起動画面 → データ読み込み → 最初の画面を描く） =====
(function boot() {
  setTimeout(() => $("splash").classList.add("hide"), SPLASH_MS);          // 長さは js/ui/splash.js
  setTimeout(() => { const sp = $("splash"); if (sp) sp.remove(); }, SPLASH_MS + 600);

  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  updateHeader("calendar");
  renderLegend();
  initPhotos();
  loadData().catch(() => {}).then(() => {
    tagList("tank"); tagList("fish");   // 状態タグの一覧を用意しておく
    applySettings();
    renderAll();
  });
})();
