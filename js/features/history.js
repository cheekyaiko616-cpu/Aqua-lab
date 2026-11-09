"use strict";
// ===== 内容ごとの記録履歴（水槽または生体の、ある内容の記録を新しい順に） =====
let histQuery = null;   // { tankId, fishId, action }
function refreshHistory() { if (histQuery) openHistory(histQuery, true); }

function openHistory(q, refresh) {
  histQuery = q;
  const title = q.fishId ? fishNameById(q.fishId) : tankName(q.tankId);
  const source = q.fishId ? logsOfFishNewestFirst(q.fishId) : logsOfTankNewestFirst(q.tankId);
  const list = source.filter((l) => l.action === q.action);
  $("historyTitle").textContent = title + " ・ " + q.action + "の履歴";
  setHtml($("historyBody"), list.length
    ? list.map((l) =>
        '<div class="item"><span><b>' + escapeHtml(fmtSlash(l.date)) + '</b>' +
          (!q.fishId && l.fishId ? ' <small>（' + escapeHtml(fishNameById(l.fishId)) + '）</small>' : '') +
          logExtrasHtml(l) + '</span>' +
          (l.photo ? photoImg(l.photo, 'class="hist-thumb" data-hphoto="' + escapeHtml(l.date) + '"', l.date + "の写真（拡大する）") : '') +
          rowButtonHtml({ kind: "secondary", label: "編集", attr: "data-hedit", value: l.id, ariaLabel: l.date + "の" + q.action + "を編集" }) +
          '</div>').join("")
    : '<div class="hint">この内容の記録はありません。</div>');
  if (!refresh) openOverlay("historyOverlay");
}

$("historyBody").onclick = (e) => {
  const img = e.target.closest("img[data-hphoto]");
  if (img) { openPhoto({ src: img.src, cap: img.dataset.hphoto + " ・ " + histQuery.action }); return; }
  const b = e.target.closest("[data-hedit]");
  if (b) {
    const log = state.logs.find((x) => x.id === b.dataset.hedit);
    if (log) openLog({ date: log.date, log, fromHistory: true });
  }
};
$("historyClose").onclick = () => closeOverlay("historyOverlay");
overlayOnClose.historyOverlay = () => { histQuery = null; };
