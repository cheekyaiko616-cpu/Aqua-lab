"use strict";
// ===== 日ごとの記録（カレンダーの日付をタップ。左右スワイプで前後の日へ） =====
let dayKey = null;
function openDay(key) {
  dayKey = key;
  renderDay();
  openOverlay("dayOverlay");
}
function renderDay() {
  $("dayTitle").textContent = fmtDateKey(dayKey);
  // その日に水換え予定の水槽
  const planned = wcPlanMap().get(dayKey) || [];
  // 機器の手入れ・薬浴の予定も、まとめて1回で描く（あとから付け足すと、開くたびに増えてしまう）
  const cared = carePlanMap().get(dayKey) || [];
  setHtml($("dayPlan"),
    (planned.length ? '<div class="notice ok">' + svgIcon("bucket") + ' 水換え予定：' + planned.map((t) => escapeHtml(t.name)).join("、") + '</div>' : "") +
    (cared.length ? '<div class="notice caution">' + cared.map((c) =>
      svgIcon(c.icon) + ' ' + escapeHtml(c.t.name) + '：' + escapeHtml(c.text)).join("<br>") + '</div>' : ""));
  const list = logsOnDate(dayKey);
  setHtml($("dayBody"), list.length
    ? list.map((l) => {
        const who = logTargetText(l) + "の" + l.action;
        return '<div class="item"><span>' + (ACTION_STYLE[l.action] || ACTION_STYLE["その他"]).i + ' <b>' + escapeHtml(logTargetText(l)) + '</b> ・ ' + escapeHtml(l.action) +
          logExtrasHtml(l) +
          (l.photo ? '<br>' + photoImg(l.photo, 'class="day-photo"', who + "の写真") : '') +
          '</span><span class="row-btns">' +
          rowButtonHtml({ kind: "secondary", label: "編集", attr: "data-edit-log", value: l.id, ariaLabel: who + "を編集" }) +
          rowButtonHtml({ kind: "danger", label: "削除", attr: "data-del-log", value: l.id, ariaLabel: who + "を削除" }) + '</span></div>';
      }).join("")
    : '<div class="hint">この日の記録はまだありません。</div>');
}
function shiftDay(delta) {
  dayKey = addDays(dayKey, delta);
  renderDay();
  const box = $("dayOverlay").querySelector(".sheet");
  box.scrollTop = 0;
  slideIn(box, delta);
}

$("dayBody").onclick = (e) => {
  const edit = e.target.closest("[data-edit-log]");
  if (edit) {
    const log = state.logs.find((x) => x.id === edit.dataset.editLog);
    if (log) openLog({ date: log.date, log });
    return;
  }
  const del = e.target.closest("[data-del-log]");
  if (del) {
    const id = del.dataset.delLog;
    askConfirm("この記録を削除しますか？", () => {
      state.logs = state.logs.filter((x) => x.id !== id);
      if (save()) { afterChange(); toast("削除しました"); }
    });
  }
};
onHSwipe($("dayOverlay"), shiftDay);
$("dayClose").onclick = () => closeOverlay("dayOverlay");
$("dayAdd").onclick = () => openPicker(dayKey, null);
