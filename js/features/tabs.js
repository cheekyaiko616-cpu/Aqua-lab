"use strict";
// ===== 下のタブの切り替えと、画面の描き直し（必要な画面だけ描く） =====
const TITLES = { calendar: "カレンダー", tanks: "水槽", graph: "水質グラフ", shop: "買い物", settings: "設定" };
const VIEW_RENDER = {
  calendar: () => { renderHero(); renderCalendar(); },
  tanks: () => renderTanks(),
  graph: () => renderGraph(),
  shop: () => renderShop(),
  settings: () => renderSettings()
};
let currentView = "calendar";
const staleViews = new Set(Object.keys(VIEW_RENDER));   // 描き直しが必要な画面
let renderedDay = "";                                   // 最後に描いた日（日付が変わったら描き直す）

function renderView(name) {
  staleViews.delete(name);
  VIEW_RENDER[name]();
}
// データが変わったとき：開いている画面だけ今すぐ描き、他の画面は開いたときに描く
function renderAll() {
  Object.keys(VIEW_RENDER).forEach((n) => staleViews.add(n));
  renderedDay = todayStr();
  renderView(currentView);
}
// データが変わったときに、開いている重ねた画面も最新にする
function afterChange() {
  renderAll();
  if (isOpen("tankOverlay") && tankDetailId) openTank(tankDetailId, true);
  if (isOpen("fishOverlay") && fishDetailId) openFish(fishDetailId, true);
  if (isOpen("historyOverlay")) refreshHistory();
  if (isOpen("dayOverlay") && dayKey) renderDay();
}
function refreshIfDayChanged() {
  if (todayStr() === renderedDay) return false;
  renderAll();
  return true;
}
function updateHeader(name) {
  $("pageTitle").style.display = name === "calendar" ? "none" : "";
  $("monthPickWrap").style.display = name === "calendar" ? "flex" : "none";
  $("pageTitle").textContent = TITLES[name];
  document.querySelector("header").classList.toggle("calendar-head", name === "calendar");
}
function showTab(name) {
  currentView = name;
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".tabbar button").forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  updateHeader(name);
  window.scrollTo(0, 0);
  if (!refreshIfDayChanged() && staleViews.has(name)) renderView(name);
}

document.querySelector(".tabbar").onclick = (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) showTab(b.dataset.tab);
};
// ホーム画面のアプリを開き直したとき、日付が変わっていれば表示を新しくする
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshIfDayChanged(); });
