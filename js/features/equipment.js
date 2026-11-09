"use strict";
// ===== 機器の管理（ヒーター・サーモ・フィルター・ろ材など）：水槽の詳細の一覧と、追加・編集の画面 =====
let equipEditingId = null;
let eqKindPrev = null;   // 直前に選んでいた種類（間隔の初期値を入れ替えるため）

// 水槽の詳細に出す「機器」の欄
function equipSectionHtml(t) {
  const today = todayStr();
  const list = equipOfTank(t.id);
  const retired = equipOfTank(t.id, true).filter((e) => e.retired);
  const rows = list.map((e) => {
    const s = equipStatus(e);
    const cls = s.due ? " warn" : s.diff !== null && s.diff <= 7 ? " caution" : "";
    const sub = [e.name ? e.kind : "", s.last ? "最終 " + fmtSlash(s.last) : (e.since ? "使い始め " + fmtSlash(e.since) : "")].filter(Boolean).join(" ・ ");
    const next = s.next ? '<span class="care-next' + cls + '">次回 ' + fmtSlash(s.next) + '（' + equipDueText(s) + '）</span>' : '<span class="care-next">間隔の設定なし</span>';
    return '<div class="care-card">' +
      '<div class="care-top"><b>' + escapeHtml(equipName(e)) + '</b>' + next + '</div>' +
      (sub ? '<div class="hint" style="margin:2px 0 0;">' + escapeHtml(sub) + '</div>' : '') +
      (e.memo ? '<div class="hint" style="margin:2px 0 0;">' + escapeHtml(e.memo) + '</div>' : '') +
      '<div class="btn-row"><button class="primary" data-equip-done="' + e.id + '">今日 手入れ・交換した</button>' +
      '<button class="secondary" data-equip-edit="' + e.id + '">編集</button></div></div>';
  }).join("");
  return '<div class="section"><h3>機器（' + list.length + '）</h3>' +
    (rows || '<div class="hint">ヒーター・サーモ・フィルター・ろ材などを登録すると、手入れや交換の時期をお知らせします。</div>') +
    (retired.length ? '<div class="hint">使わなくなった機器：' + retired.map((e) =>
      '<button class="link-btn" data-equip-edit="' + e.id + '">' + escapeHtml(equipName(e)) + '</button>').join(" ") + '</div>' : '') +
    '<div class="btn-row"><button class="secondary" id="addEquipBtn">＋ 機器を追加</button></div></div>';
}

// 水槽の詳細の中のボタン。処理したら true
function handleEquipClick(el, t) {
  if (el.closest("#addEquipBtn")) { openEquipEdit(null, t.id); return true; }
  const edit = el.closest("[data-equip-edit]");
  if (edit) { const e = equipById(edit.dataset.equipEdit); if (e) openEquipEdit(e); return true; }
  const done = el.closest("[data-equip-done]");
  if (done) {
    const e = equipById(done.dataset.equipDone);
    if (!e) return true;
    state.logs.push({ id: uid(), date: todayStr(), tankId: e.tankId, fishId: null, action: "機器の手入れ", equipId: e.id, memo: "", photo: null, tags: [] });
    if (save()) { afterChange(); toast("「" + equipName(e) + "」の手入れを記録しました"); }
    return true;
  }
  return false;
}

// ---- 追加・編集 ----
function fillEquipKind(selected) {
  $("eqKind").innerHTML = EQUIP_KIND_NAMES.map((k) => '<option value="' + k + '">' + k + '</option>').join("");
  $("eqKind").value = EQUIP_KINDS[selected] ? selected : EQUIP_KIND_NAMES[0];
}
function showEquipHint() {
  const k = EQUIP_KINDS[$("eqKind").value];
  $("eqHint").textContent = k && k.hint ? "目安：" + k.hint : "";
}
function openEquipEdit(e, presetTankId) {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  equipEditingId = e ? e.id : null;
  $("eqTitle").textContent = e ? "機器を編集" : "機器を追加";
  $("eqTank").innerHTML = state.tanks.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join("");
  $("eqTank").value = e ? e.tankId : (presetTankId || state.tanks[0].id);
  fillEquipKind(e ? e.kind : null);
  eqKindPrev = $("eqKind").value;
  $("eqName").value = e && e.name ? e.name : "";
  $("eqSince").value = e ? e.since || "" : todayStr();
  $("eqInterval").value = e ? (e.interval || "") : (EQUIP_KINDS[$("eqKind").value].interval || "");
  $("eqMemo").value = e && e.memo ? e.memo : "";
  $("eqRetired").checked = !!(e && e.retired);
  $("eqRetiredBox").style.display = e ? "" : "none";
  $("eqDelete").style.display = e ? "" : "none";
  showEquipHint();
  openOverlay("equipEditOverlay");
}
function saveEquipEdit() {
  const iv = readNum("eqInterval", 1, 3650, true);
  if (!iv.ok) { toast("間隔は1〜3650の数字で入力してください"); return; }
  const kind = $("eqKind").value;
  const data = { tankId: $("eqTank").value, kind, name: $("eqName").value.trim(), since: $("eqSince").value || null,
    interval: iv.value, memo: $("eqMemo").value.trim(), retired: equipEditingId ? $("eqRetired").checked : false };
  if (equipEditingId) {
    const e = equipById(equipEditingId);
    if (e) {
      if (e.tankId !== data.tankId) state.logs.forEach((l) => { if (l.equipId === e.id) l.tankId = data.tankId; });
      Object.assign(e, data);
    }
    toast("更新しました");
  } else {
    state.equipment.push(Object.assign({ id: uid(), createdAt: todayStr() }, data));
    toast("登録しました");
  }
  if (!save()) return;
  closeOverlay("equipEditOverlay");
  afterChange();
}

$("eqKind").onchange = () => {
  // 間隔が空か、前の種類の初期値のままなら、新しい種類の目安に入れ替える
  const prev = EQUIP_KINDS[eqKindPrev] ? EQUIP_KINDS[eqKindPrev].interval : null;
  const cur = $("eqInterval").value.trim();
  if (cur === "" || Number(cur) === prev) $("eqInterval").value = EQUIP_KINDS[$("eqKind").value].interval || "";
  eqKindPrev = $("eqKind").value;
  showEquipHint();
};
$("eqCancel").onclick = () => closeOverlay("equipEditOverlay");
$("eqSave").onclick = saveEquipEdit;
$("eqDelete").onclick = () => {
  const e = equipById(equipEditingId);
  if (!e) return;
  askConfirm("「" + equipName(e) + "」を削除しますか？手入れの記録は残ります。", () => {
    state.equipment = state.equipment.filter((x) => x.id !== e.id);
    if (save()) { closeOverlay("equipEditOverlay"); afterChange(); toast("削除しました"); }
  });
};
