"use strict";
// ===== 水槽一覧（タブ「水槽」） =====
function renderTanks() {
  $("tankCount").textContent = "水槽 " + state.tanks.length + "・生体 " + state.fish.reduce((s, f) => s + (Number(f.count) || 1), 0) + "匹";
  $("tankEmpty").style.display = state.tanks.length ? "none" : "block";
  setHtml($("tankGrid"), state.tanks.map((t) => {
    const n = fishCountOfTank(t.id);
    const sub = tankLabel(t) + (n ? " ・ 生体" + n + "匹" : "");
    return '<button class="card" data-tank="' + t.id + '" style="' + tankStyle(t) + '">' +
      '<div class="thumb">' + tankThumb(t) + '</div>' +
      '<div class="info"><div class="name">' + escapeHtml(t.name) + '</div>' +
      '<div class="sub">' + escapeHtml(sub) + '</div></div>' + '<div class="badges">' + wcBadgeHtml(wcStatus(t)) + careBadgeHtml(t) + '</div></button>';
  }).join(""));
}

$("addTankBtn").onclick = () => openTankEdit(null);
$("tankGrid").onclick = (e) => {
  const card = e.target.closest("[data-tank]");
  if (card) openTank(card.dataset.tank);
};
