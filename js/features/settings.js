"use strict";
// ===== 設定（テーマ・状態タグの件数・バックアップの状況・データ容量） =====
function applySettings() {
  const s = state.settings;
  document.documentElement.dataset.theme = s.theme === "system" ? "" : s.theme;
  document.querySelectorAll("[data-theme-set]").forEach((b) => {
    const on = b.dataset.themeSet === s.theme;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
function renderBackupInfo() {
  const last = state.settings.lastBackup;
  let text;
  if (!last) text = "まだバックアップしていません";
  else {
    const n = Math.max(0, daysBetween(last, todayStr()));
    text = "最終バックアップ：" + (n === 0 ? "今日" : n + "日前") + "（" + fmtSlash(last) + "）";
  }
  $("backupInfo").textContent = text;
}
function renderSettings() {
  const fishN = state.fish.reduce((s, f) => s + (Number(f.count) || 1), 0);
  const base = "水槽 " + state.tanks.length + "・生体 " + fishN + "匹・記録 " + state.logs.length + "件・保存容量 約" + storageKB() + "KB";
  $("dataInfo").textContent = base;
  renderTagCount();
  renderBackupInfo();
  try {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((e) => {
        if (e && e.usage) $("dataInfo").textContent = base + "（端末上の使用量 約" + (e.usage / 1048576).toFixed(1) + "MB）";
      }).catch(() => {});
    }
  } catch (err) { /* 未対応 */ }
  applySettings();
}
$("themeOpts").onclick = (e) => {
  const b = e.target.closest("[data-theme-set]");
  if (!b) return;
  state.settings.theme = b.dataset.themeSet;
  save(); applySettings();
};
