"use strict";
// ===== 記録の追加・編集（日付・水槽・対象・内容ごとの入力・メモ・写真・状態タグ） =====
// 内容ごとに出す入力欄
//   水換え   → 換水量（%）
//   給餌/投薬 → 名前（過去に使った名前から選べる）・量
//   水質測定 → 水温・pH・アンモニア・亜硝酸・硝酸塩・KH
let logEditId = null, logPhotoData = null, logTags = [], logTagKind = "tank", logFromHistory = false;

// 水質の入力欄は WATER_KEYS から作る（項目を増やすときは constants.js だけ直せばよい）
$("lWaterGrid").innerHTML = WATER_KEYS.map((k) =>
  '<label>' + k.label + (k.unit ? '<small>' + k.unit + '</small>' : '') +
  '<input type="number" id="lw-' + k.key + '" min="0" max="' + k.max + '" step="any" inputmode="decimal"></label>').join("");
document.querySelectorAll("#lWaterGrid input").forEach((el) => { el.enterKeyHint = "done"; });

function setLogPhoto(data) { logPhotoData = data || null; showPickedPhoto("l", logPhotoData); }
function setLogDate(v) { $("lDate").value = v; $("lDateText").textContent = fmtDateKey(v); }

// 対象（水槽全体／生体）の選択肢
function fillTargets(selectedFishId) {
  const fish = fishOfTank($("lTank").value);
  $("lTarget").innerHTML = '<option value="">水槽全体</option>' +
    fish.map((f) => '<option value="' + f.id + '">' + escapeHtml(fishLabel(f)) + '</option>').join("");
  $("lTarget").value = selectedFishId && fish.some((f) => f.id === selectedFishId) ? selectedFishId : "";
}
// 内容に合わせて、出す入力欄を切り替える
function updateActionFields() {
  const a = $("lAction").value;
  const canFish = FISH_ACTIONS.includes(a) && fishOfTank($("lTank").value).length > 0;
  $("lTargetBox").style.display = canFish ? "" : "none";
  if (!canFish) $("lTarget").value = "";
  $("lWcBox").classList.toggle("show", a === "水換え");
  $("lItemBox").classList.toggle("show", a === "給餌" || a === "投薬");
  $("lWaterBox").classList.toggle("show", a === "水質測定");
  $("lEquipBox").classList.toggle("show", a === "機器の手入れ");
  $("lTreatBox").classList.toggle("show", a === "薬浴");
  if (a === "機器の手入れ" || a === "薬浴") fillCareChoices();
  if (a === "給餌" || a === "投薬") {
    $("lItemLabel").textContent = a === "給餌" ? "餌の名前" : "薬の名前";
    $("lAmount").placeholder = a === "給餌" ? "例：ひとつまみ" : "例：規定量";
    $("lItemList").innerHTML = pastItems(a).map((n) => '<option value="' + escapeHtml(n) + '">').join("");
  }
  updateTagKind();
}
// 機器・薬浴の選択肢（選んだ水槽のものだけ。編集中の記録のものは、使用をやめた・終わったものでも残す）
function fillCareChoices() {
  const tankId = $("lTank").value;
  const wantE = $("lEquip").dataset.want, wantT = $("lTreat").dataset.want;
  const eq = equipOfTank(tankId).concat(wantE && !equipOfTank(tankId).some((e) => e.id === wantE) && equipById(wantE) ? [equipById(wantE)] : []);
  $("lEquip").innerHTML = eq.length
    ? eq.map((e) => '<option value="' + e.id + '">' + escapeHtml(equipName(e) + (e.name ? "（" + e.kind + "）" : "")) + '</option>').join("")
    : '<option value="">この水槽には機器が登録されていません</option>';
  if (wantE && eq.some((e) => e.id === wantE)) $("lEquip").value = wantE;
  const tr = treatOfTank(tankId, true).concat(wantT && !treatOfTank(tankId, true).some((t) => t.id === wantT) && treatById(wantT) ? [treatById(wantT)] : []);
  $("lTreat").innerHTML = tr.length
    ? tr.map((t) => '<option value="' + t.id + '">' + escapeHtml(treatLabel(t) + "（" + treatTargetText(t) + "）") + '</option>').join("")
    : '<option value="">この水槽には薬浴中のものがありません</option>';
  if (wantT && tr.some((t) => t.id === wantT)) $("lTreat").value = wantT;
  delete $("lEquip").dataset.want; delete $("lTreat").dataset.want;
}
// 状態タグは、対象が生体なら「生体用」、それ以外は「水槽用」
function updateTagKind() {
  const kind = $("lTarget").value ? "fish" : "tank";
  if (kind !== logTagKind) { logTagKind = kind; logTags = []; setTagsOpen(false); }
  renderLogTags();
}
function setTagsOpen(open) {
  $("lTagsBody").style.display = open ? "" : "none";
  $("lTagsCaret").textContent = open ? "▲" : "▼";
  $("lTagsToggle").setAttribute("aria-expanded", String(open));
}
function renderLogTags() {
  const all = tagList(logTagKind);
  const names = all.concat(logTags.filter((t) => !all.includes(t)));
  $("lTagsBox").style.display = names.length ? "" : "none";
  $("lTagsSel").textContent = logTags.length ? logTags.length + "件選択中" : "";
  $("lTags").innerHTML = names.map((t) =>
    '<button type="button" class="tag-chip pick' + (logTags.includes(t) ? ' on' : '') + '" data-tag="' + escapeHtml(t) + '" aria-pressed="' + logTags.includes(t) + '">' +
    escapeHtml(t) + '</button>').join("");
}

/** 記録画面を開く
 *  { date, log(編集する記録), tankId, fishId, action, equipId, treatmentId, fromHistory, openTags } */
function openLog(o) {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  const log = o.log || null;
  logFromHistory = !!o.fromHistory;
  logEditId = log ? log.id : null;
  $("logTitle").textContent = log ? "記録を編集" : "記録する";
  setLogDate(o.date || todayStr());
  $("lTank").innerHTML = state.tanks.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join("");
  $("lTank").value = log ? log.tankId : (o.tankId || state.tanks[0].id);
  $("lAction").innerHTML = ACTIONS.map((a) => '<option value="' + a + '">' + a + '</option>').join("");
  $("lAction").value = log ? log.action : (o.action || "給餌");
  fillTargets(log ? log.fishId : o.fishId);
  const t = tankById($("lTank").value);
  $("lPct").value = log ? (log.pct || "") : (t && t.wcPercent ? t.wcPercent : "");
  $("lItem").value = log && log.item ? log.item : "";
  $("lAmount").value = log && log.amount ? log.amount : "";
  WATER_KEYS.forEach((k) => {
    const v = log && log.water ? log.water[k.key] : null;
    $("lw-" + k.key).value = v === null || v === undefined ? "" : v;
  });
  $("lEquip").dataset.want = log ? log.equipId || "" : (o.equipId || "");
  $("lTreat").dataset.want = log ? log.treatmentId || "" : (o.treatmentId || "");
  $("lProgress").innerHTML = '<option value="">選ばない</option>' + TREAT_PROGRESS.map((p) => '<option value="' + p + '">' + p + '</option>').join("");
  $("lProgress").value = log ? log.progress || "" : "変わらない";
  $("lDosed").checked = !!(log && log.dosed);
  $("lMemo").value = log ? log.memo || "" : "";
  $("lPhoto").value = "";
  setLogPhoto(log && log.photo ? log.photo : null);
  // タグ：先に種類を合わせてから、記録のタグを入れる
  logTagKind = $("lTarget").value ? "fish" : "tank";
  updateActionFields();
  logTags = log && Array.isArray(log.tags) ? log.tags.slice() : [];
  setTagsOpen(logTags.length > 0 || !!o.openTags);
  renderLogTags();
  openOverlay("logOverlay");
}

function saveLog() {
  const action = $("lAction").value;
  const tankId = $("lTank").value;
  if (!tankId) { toast("水槽を選んでください"); return; }
  const data = { date: $("lDate").value || todayStr(), tankId, fishId: $("lTarget").value || null, action,
    memo: $("lMemo").value.trim(), photo: logPhotoData || null, tags: logTags.slice() };
  if (action === "水換え") {
    const p = readNum("lPct", 1, 100, true);
    if (!p.ok) { toast("換水量は1〜100の数字で入力してください"); return; }
    if (p.value) data.pct = p.value;
  }
  if (action === "給餌" || action === "投薬") {
    const item = $("lItem").value.trim(), amount = $("lAmount").value.trim();
    if (item) data.item = item;
    if (amount) data.amount = amount;
  }
  if (action === "機器の手入れ") {
    if (!$("lEquip").value) { toast("先に、水槽の詳細から機器を登録してください"); return; }
    data.equipId = $("lEquip").value;
  }
  if (action === "薬浴") {
    if (!$("lTreat").value) { toast("先に、水槽の詳細から薬浴を始めてください"); return; }
    data.treatmentId = $("lTreat").value;
    if ($("lProgress").value) data.progress = $("lProgress").value;
    if ($("lDosed").checked) data.dosed = true;
  }
  if (action === "水質測定") {
    const w = {};
    for (const k of WATER_KEYS) {
      const r = readNum("lw-" + k.key, 0, k.max);
      if (!r.ok) { toast(k.label + "は0〜" + k.max + "の数字で入力してください"); return; }
      if (r.value !== null) w[k.key] = r.value;
    }
    if (!Object.keys(w).length) { toast("測った値を1つ以上入れてください"); return; }
    data.water = w;
  }
  if (logEditId) {
    const log = state.logs.find((x) => x.id === logEditId);
    if (log) {
      ["pct", "item", "amount", "water", "equipId", "treatmentId", "progress", "dosed"].forEach((k) => { delete log[k]; });   // 内容を変えたときに古い入力を残さない
      Object.assign(log, data);
    }
    toast("更新しました");
  } else {
    state.logs.push(Object.assign({ id: uid() }, data));
    toast("記録しました");
  }
  if (!save()) return;
  closeOverlay("logOverlay");
  closeOverlay("pickOverlay");
  dayKey = data.date;
  afterChange();
  // 詳細や履歴から開いたときは、その画面に戻る。カレンダーから開いたときは日ごとの記録を出す
  if (logFromHistory || isOpen("tankOverlay") || isOpen("fishOverlay")) return;
  if (!isOpen("dayOverlay")) openDay(data.date); else renderDay();
}

$("lTank").onchange = () => { fillTargets(null); updateActionFields(); const t = tankById($("lTank").value); if (t && t.wcPercent && !$("lPct").value) $("lPct").value = t.wcPercent; };
$("lAction").onchange = updateActionFields;
$("lTarget").onchange = updateTagKind;
$("lTags").onclick = (e) => {
  const b = e.target.closest("[data-tag]");
  if (!b) return;
  const name = b.dataset.tag;
  logTags = logTags.includes(name) ? logTags.filter((t) => t !== name) : logTags.concat(name);
  renderLogTags();
};
$("lTagsToggle").onclick = () => setTagsOpen($("lTagsBody").style.display === "none");
$("logCancel").onclick = () => closeOverlay("logOverlay");
$("lPrev").onclick = () => setLogDate(addDays($("lDate").value, -1));
$("lNext").onclick = () => setLogDate(addDays($("lDate").value, 1));
$("logSave").onclick = saveLog;
$("lPhoto").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try { setLogPhoto(await resizeImage(f, PHOTO_MAX, PHOTO_Q)); }
  catch (err) { toast("写真を読み込めませんでした"); }
};
$("lPhotoClear").onclick = () => { setLogPhoto(null); $("lPhoto").value = ""; };
