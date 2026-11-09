"use strict";
// ===== 記録の選択画面（水槽と内容を選ぶ。複数の水槽をまとめて記録もできる） =====
let pickDate = null, pickTankIds = [], pickAction = null;

function openPicker(date, presetTankId) {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  pickDate = date;
  pickTankIds = presetTankId ? [presetTankId] : (state.tanks.length === 1 ? [state.tanks[0].id] : []);
  pickAction = null;
  $("pickTanks").innerHTML = state.tanks.map((t) => tankPickRowHtml(t, pickTankIds.includes(t.id), "data-pick", "checkbox")).join("");
  renderPickActions();
  openOverlay("pickOverlay");
  $("pickTanks").scrollTop = 0;
}
// 内容のボタンと保存ボタン：選択が変わるたびに更新する
function renderPickActions() {
  const multi = pickTankIds.length > 1;
  if (multi && MULTI_HIDDEN.includes(pickAction)) pickAction = null;
  $("pickSave").disabled = !(pickAction && pickTankIds.length >= 1);
  $("pickActions").innerHTML = ACTIONS.filter((a) => !(multi && MULTI_HIDDEN.includes(a))).map((a) =>
    '<button class="action-tile' + (pickAction === a ? ' on' : '') + '" data-action="' + a + '" aria-pressed="' + (pickAction === a) + '" style="--c:' + ACTION_STYLE[a].c + ';">' +
    '<span class="ei" aria-hidden="true">' + ACTION_STYLE[a].i + '</span>' + a + '</button>').join("");
}

$("pickCancel").onclick = () => { pickAction = null; closeOverlay("pickOverlay"); };
$("pickTanks").onclick = (e) => {
  const r = e.target.closest("[data-pick]");
  if (!r) return;
  const id = r.dataset.pick;
  pickTankIds = pickTankIds.includes(id) ? pickTankIds.filter((x) => x !== id) : pickTankIds.concat(id);
  const on = pickTankIds.includes(id);
  r.classList.toggle("selected", on);
  r.setAttribute("aria-checked", String(on));
  renderPickActions();
};
$("pickActions").onclick = (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const action = b.dataset.action;
  // タップは「選ぶだけ」。選び直しもできる（記録画面へ進むのは下のボタン）
  pickAction = action;
  renderPickActions();
};
$("pickSave").onclick = () => {
  if (!pickAction || !pickTankIds.length) return;
  if (pickTankIds.length === 1) { openLog({ date: pickDate, tankId: pickTankIds[0], action: pickAction }); return; }
  // 複数の水槽：日付と内容だけをまとめて記録（換水量は各水槽の設定値）
  const action = pickAction;
  pickTankIds.forEach((id) => {
    const t = tankById(id);
    const log = { id: uid(), date: pickDate, tankId: id, fishId: null, action, memo: "", photo: null, tags: [] };
    if (action === "水換え" && t && t.wcPercent) log.pct = t.wcPercent;
    state.logs.push(log);
  });
  const n = pickTankIds.length;
  if (!save()) return;
  pickAction = null;
  closeOverlay("pickOverlay");
  dayKey = pickDate;
  afterChange();
  if (!isOpen("dayOverlay")) openDay(pickDate);
  toast(n + "槽に記録しました");
};
