"use strict";
// ===== 記録を探す（キーワード・水槽・生体・内容・期間で絞り込み。新しい順） =====
const SEARCH_MAX = 200;   // 一度に出す件数の上限

// 記録の中で、キーワードで探す文字（メモ・餌や薬・タグ・水槽や生体の名前・機器・薬浴など）
function logSearchText(l) {
  const x = dataIndex();
  if (!x.stext) x.stext = new Map();
  let s = x.stext.get(l);
  if (s === undefined) { s = buildSearchText(l); x.stext.set(l, s); }
  return s;
}
function buildSearchText(l) {
  const parts = [l.action, l.memo, l.item, l.amount, (l.tags || []).join(" "), tankName(l.tankId), logFishNames(l)];
  if (l.equipId) parts.push(equipNameById(l.equipId));
  if (l.treatmentId) parts.push(treatLogText(l));
  if (l.progress) parts.push(l.progress);
  return parts.filter(Boolean).join(" ").toLowerCase();
}
function fillSearchTank() {
  const keep = $("sTank").value;
  $("sTank").innerHTML = '<option value="">すべての水槽</option>' +
    state.tanks.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join("");
  $("sTank").value = tankById(keep) ? keep : "";
  fillSearchFish();
}
function fillSearchFish() {
  const keep = $("sFish").value;
  const tankId = $("sTank").value;
  const list = tankId ? fishOfTank(tankId) : state.fish;
  $("sFish").innerHTML = '<option value="">すべての生体</option>' +
    list.map((f) => '<option value="' + f.id + '">' + escapeHtml(fishLabel(f)) + (tankId ? "" : "（" + escapeHtml(tankName(f.tankId)) + "）") + '</option>').join("");
  $("sFish").value = list.some((f) => f.id === keep) ? keep : "";
}
function openSearch() {
  if (!$("sAction").options.length) {
    $("sAction").innerHTML = '<option value="">すべての内容</option>' + ACTIONS.concat(LEGACY_ACTIONS).map((a) => '<option value="' + a + '">' + a + '</option>').join("");
  }
  fillSearchTank();
  renderSearch();
  openOverlay("searchOverlay");
}
// キーワードの部分に色を付ける（安全のため、先に文字を無害化してから印を付ける）
function markHit(text, words) {
  let html = escapeHtml(text);
  words.forEach((w) => {
    const e = escapeHtml(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (e) html = html.replace(new RegExp("(" + e + ")", "gi"), "<mark>$1</mark>");
  });
  return html;
}
function renderSearch() {
  const words = $("sQ").value.trim().toLowerCase().split(/[\s　]+/).filter(Boolean);
  const tankId = $("sTank").value, fishId = $("sFish").value, action = $("sAction").value, period = Number($("sPeriod").value) || 0;
  const since = period ? addDays(todayStr(), -period) : null;
  const hits = state.logs.filter((l) =>
    (!tankId || l.tankId === tankId) &&
    (!fishId || logFishIds(l).includes(fishId)) &&
    (!action || l.action === action) &&
    (!since || l.date >= since) &&
    (!words.length || (() => { const s = logSearchText(l); return words.every((w) => s.includes(w)); })())
  ).sort(byDateDesc);
  const any = words.length || tankId || fishId || action || period;
  $("sCount").textContent = hits.length + "件" + (hits.length > SEARCH_MAX ? "（新しい" + SEARCH_MAX + "件を表示）" : "");
  $("sReset").style.visibility = any ? "visible" : "hidden";
  setHtml($("searchBody"), hits.length
    ? hits.slice(0, SEARCH_MAX).map((l) => {
        const st = ACTION_STYLE[l.action] || ACTION_STYLE["その他"];
        return '<div class="item search-hit"><span><span class="s-date">' + escapeHtml(fmtSlash(l.date)) + '</span><br>' +
          st.i + ' <b>' + markHit(logTargetText(l), words) + '</b> ・ ' + escapeHtml(l.action) +
          logExtrasHtml(l) + '</span>' +
          rowButtonHtml({ kind: "secondary", label: "編集", attr: "data-sedit", value: l.id, ariaLabel: l.date + "の" + l.action + "を編集" }) +
          '</div>';
      }).join("")
    : '<div class="hint">' + (state.logs.length ? "条件に合う記録はありません。" : "記録はまだありません。") + '</div>');
}

$("searchOpen").onclick = openSearch;
$("sQ").oninput = renderSearch;
$("sTank").onchange = () => { fillSearchFish(); renderSearch(); };
$("sFish").onchange = renderSearch;
$("sAction").onchange = renderSearch;
$("sPeriod").onchange = renderSearch;
$("sReset").onclick = () => { $("sQ").value = ""; $("sTank").value = ""; fillSearchFish(); $("sFish").value = ""; $("sAction").value = ""; $("sPeriod").value = ""; renderSearch(); };
$("searchBody").onclick = (e) => {
  const b = e.target.closest("[data-sedit]");
  if (!b) return;
  const log = state.logs.find((x) => x.id === b.dataset.sedit);
  if (log) openLog({ date: log.date, log, fromHistory: true });
};
$("searchClose").onclick = () => closeOverlay("searchOverlay");
