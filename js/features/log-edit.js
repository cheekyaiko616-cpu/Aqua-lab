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
// 選んでいる生体（logFishSel）を、画面の選択肢に反映する。給餌は複数選べ、それ以外は1匹まで
let logFishSel = [];
function fillTargets() {
  const fish = fishOfTank($("lTank").value);
  logFishSel = logFishSel.filter((id) => fish.some((f) => f.id === id));
  $("lTarget").innerHTML = '<option value="">水槽全体</option>' +
    fish.map((f) => '<option value="' + f.id + '">' + escapeHtml(fishLabel(f)) + '</option>').join("");
  $("lTargetMulti").innerHTML = fish.map((f) =>
    '<label class="chk"><input type="checkbox" value="' + f.id + '"' + (logFishSel.includes(f.id) ? ' checked' : '') + '> ' + escapeHtml(fishLabel(f)) + '</label>').join("");
  syncTargetUi();
}
function syncTargetUi() {
  const a = $("lAction").value;
  if (a !== "給餌" && !BATH_ACTIONS.includes(a) && logFishSel.length > 1) logFishSel = [logFishSel[0]];   // 給餌以外は1匹まで
  $("lTarget").value = logFishSel[0] || "";
  $("lTargetMulti").querySelectorAll("input").forEach((i) => { i.checked = logFishSel.includes(i.value); });
}
// 内容に合わせて、出す入力欄を切り替える
function updateActionFields() {
  const a = $("lAction").value;
  const hasFish = fishOfTank($("lTank").value).length > 0;
  const multi = (a === "給餌" || BATH_ACTIONS.includes(a)) && hasFish;                 // 給餌・薬浴：複数の生体を選べる
  const single = (FISH_ACTIONS.includes(a) || a === "投薬") && a !== "給餌" && !BATH_ACTIONS.includes(a) && hasFish;   // 様子メモなど：1匹まで
  $("lTargetBox").style.display = single ? "" : "none";
  $("lTargetMultiBox").style.display = multi ? "" : "none";
  if (!single && !multi) logFishSel = [];
  syncTargetUi();
  $("lWcBox").classList.toggle("show", a === "水換え");
  $("lItemBox").classList.toggle("show", a === "給餌" || a === "投薬");
  $("lWaterBox").classList.toggle("show", a === "水質測定");
  $("lEquipBox").classList.toggle("show", a === "機器の手入れ");
  $("lTreatBox").classList.toggle("show", BATH_ACTIONS.includes(a));
  if (a === "機器の手入れ" || BATH_ACTIONS.includes(a)) fillCareChoices();
  if (BATH_ACTIONS.includes(a)) { syncBathWords(a); syncTreatNew(); }
  syncSaltCalc();
  if (a === "給餌" || a === "投薬") {
    $("lItemLabel").textContent = a === "給餌" ? "餌の名前" : "薬の名前";
    $("lAmount").placeholder = a === "給餌" ? "例：ひとつまみ" : "例：規定量";
    $("lItemList").innerHTML = pastItems(a).map((n) => '<option value="' + escapeHtml(n) + '">').join("");
    prefillLastFeed(a);
  }
  updateTagKind();
}
// 新しい給餌の記録では、その水槽の前回の餌と量を最初から入れておく（自分で入力した内容は上書きしない）
let logAutoItem = null;
function prefillLastFeed(a) {
  const mine = logAutoItem && $("lItem").value === logAutoItem.item && $("lAmount").value === logAutoItem.amount;
  if (mine) { $("lItem").value = ""; $("lAmount").value = ""; }          // 前に自動で入れた分は、いったん消す
  logAutoItem = null;
  if (logEditId || a !== "給餌" || $("lItem").value || $("lAmount").value) return;
  const tankId = $("lTank").value;
  const last = state.logs.filter((l) => l.action === "給餌" && l.tankId === tankId && l.item).sort(byDateDesc)[0];
  if (!last) return;
  logAutoItem = { item: last.item, amount: last.amount || "" };
  $("lItem").value = logAutoItem.item; $("lAmount").value = logAutoItem.amount;
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
  const bath = $("lAction").value;                                    // 薬浴か塩浴か（選んだ種類のものだけ並べる）
  const ofKind = (t) => !BATH_ACTIONS.includes(bath) || treatKind(t) === bath;
  const tr = treatOfTank(tankId, true).filter(ofKind).concat(wantT && !treatOfTank(tankId, true).some((t) => t.id === wantT) && treatById(wantT) ? [treatById(wantT)] : []);
  const keepT = $("lTreat").value;
  $("lTreat").innerHTML = (logEditId ? "" : '<option value="">新しく' + (BATH_ACTIONS.includes(bath) ? bath : "薬浴") + 'を始める</option>') +
    tr.map((t) => '<option value="' + t.id + '">' + escapeHtml(treatLabel(t) + "（" + treatTargetText(t) + "）" + (t.status === "done" ? "・終了" : "")) + '</option>').join("");
  const want = wantT || keepT;
  if (want && tr.some((t) => t.id === want)) $("lTreat").value = want;
  const salt = bath === "塩浴";
  const drugs = salt ? SALT_CONCS : [...new Set(pastItems("薬浴").concat(pastItems("投薬"), state.treatments.filter((x) => treatKind(x) !== "塩浴").map((x) => x.drug).filter(Boolean), TREAT_DRUGS))].slice(0, 40);
  $("lTrDrugList").innerHTML = drugs.map((x) => '<option value="' + escapeHtml(x) + '">').join("");
  $("lTrReasonList").innerHTML = (salt ? SALT_REASONS : TREAT_REASONS).map((x) => '<option value="' + escapeHtml(x) + '">').join("");
  delete $("lEquip").dataset.want; delete $("lTreat").dataset.want;
}
// 塩の量の自動計算（塩浴の開始時／塩浴中の水換え時）
function syncSaltCalc() {
  const tank = tankById($("lTank").value);
  const salt = $("lAction").value === "塩浴" && !$("lTreat").value;
  const calc = salt ? saltCalcText(tank, $("lTrDrug").value) : "";
  $("lTrSalt").style.display = calc ? "" : "none";
  $("lTrSalt").textContent = calc;
  const wc = $("lAction").value === "水換え" ? saltForWaterChange(tank, Number($("lPct").value)) : null;
  $("lWcSalt").style.display = wc ? "" : "none";
  if (wc) $("lWcSalt").textContent = "塩 " + fmtG(wc.grams) + "（入れ替え " + fmtNum(Math.round(wc.liters * 10) / 10) + "L × " + fmtNum(wc.pct) + "%）";
}
// 薬浴と塩浴で、入力欄の言葉を切り替える
function syncBathWords(a) {
  const salt = a === "塩浴";
  $("lTreatLabel").textContent = a;
  $("lTrDrugLabel").textContent = salt ? "塩の濃度" : "薬・処置";
  $("lTrDrug").placeholder = salt ? "例：0.5%（水1Lに塩5g）" : "例：グリーンF";
  $("lTrReason").placeholder = salt ? "例：体力回復" : "例：白点病";
  $("lTrEveryLabel").textContent = (salt ? "水換え・塩の調整" : "薬の追加・水換え") + "（日おき）";
  $("lTrHint").style.display = salt ? "none" : "";                     // 塩浴には説明文を出さない
  $("lDosedLabel").textContent = "今日、" + (salt ? "水換え・塩の調整" : "薬の追加・水換え") + "をした";
}
// 薬浴・塩浴：「新しく始める」ときは薬・期間の入力欄を、すでにある薬浴のときは経過の欄を出す
function syncTreatNew() {
  const isNew = !$("lTreat").value;
  $("lTreatNew").style.display = isNew ? "" : "none";
  $("lTreatOld").style.display = isNew ? "none" : "";
}
// 状態タグは、対象が生体なら「生体用」、それ以外は「水槽用」
function updateTagKind() {
  const kind = logFishSel.length ? "fish" : "tank";
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
  $("lAction").innerHTML = ACTIONS.concat(log && !ACTIONS.includes(log.action) ? [log.action] : []).map((a) => '<option value="' + a + '">' + a + '</option>').join("");
  $("lAction").value = log ? log.action : (o.action || "給餌");
  logFishSel = log ? logFishIds(log).slice() : (o.fishId ? [o.fishId] : []);
  fillTargets();
  const t = tankById($("lTank").value);
  $("lPct").value = log ? (log.pct || "") : (t && t.wcPercent ? t.wcPercent : "");
  logAutoItem = null;
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
  ["lTrDrug", "lTrReason", "lTrDays", "lTrEvery"].forEach((id) => { $(id).value = ""; });
  $("lTrDays").value = log ? "" : "7"; $("lTrEvery").value = log ? "" : "3";
  $("lTreat").innerHTML = "";
  $("lMemo").value = log ? log.memo || "" : "";
  $("lPhoto").value = "";
  setLogPhoto(log && log.photo ? log.photo : null);
  // タグ：先に種類を合わせてから、記録のタグを入れる
  logTagKind = logFishSel.length ? "fish" : "tank";
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
  const data = { date: $("lDate").value || todayStr(), tankId, fishId: logFishSel[0] || null, action,
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
  if (logFishSel.length > 1) data.fishIds = logFishSel.slice();
  if (action === "機器の手入れ") {
    if (!$("lEquip").value) { toast("先に、水槽の詳細から機器を登録してください"); return; }
    data.equipId = $("lEquip").value;
  }
  let newTreat = null;
  if (BATH_ACTIONS.includes(action)) {
    if ($("lTreat").value) {
      data.treatmentId = $("lTreat").value;
      if ($("lProgress").value) data.progress = $("lProgress").value;
      if ($("lDosed").checked) data.dosed = true;
    } else {
      // 新しく始める：薬浴／塩浴を作り、その1日目の記録として残す
      const days = readNum("lTrDays", 1, 365, true), every = readNum("lTrEvery", 1, 60, true);
      if (!days.ok) { toast("期間は1〜365日の数字で入力してください"); return; }
      if (!every.ok) { toast("間隔は1〜60日の数字で入力してください"); return; }
      const drug = $("lTrDrug").value.trim(), reason = $("lTrReason").value.trim();
      if (!drug && !reason) { toast(action === "塩浴" ? "目的か、塩の濃度を入力してください" : "薬・処置か、症状・目的を入力してください"); return; }
      newTreat = { id: uid(), createdAt: todayStr(), kind: action, tankId, fishIds: logFishSel.slice(), reason, drug, dose: "", startDate: data.date,
        days: days.value, every: every.value, memo: "", status: "active", endDate: null, result: "" };
      if (action === "塩浴" && saltPctOf(drug)) { const tk = tankById(tankId); if (tk && Number(tk.volume) > 0) newTreat.dose = "塩 " + fmtG(saltGrams(Number(tk.volume), saltPctOf(drug))); }
      data.treatmentId = newTreat.id; data.dosed = true;
      if (drug) data.item = drug;
    }
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
  if (newTreat) state.treatments.push(newTreat);
  if (logEditId) {
    const log = state.logs.find((x) => x.id === logEditId);
    if (log) {
      ["pct", "item", "amount", "water", "equipId", "treatmentId", "progress", "dosed", "fishIds"].forEach((k) => { delete log[k]; });   // 内容を変えたときに古い入力を残さない
      Object.assign(log, data);
    }
    toast("更新しました");
  } else {
    state.logs.push(Object.assign({ id: uid() }, data));
    toast(newTreat ? action + "を始めました" : "記録しました");
  }
  if (!save()) return;
  closeOverlay("logOverlay");
  closeOverlay("pickOverlay");
  dayKey = data.date;
  afterChange();
  // 詳細や履歴から開いたときは、その画面に戻る。カレンダーから開いたときは日ごとの記録を出す
  if (logFromHistory || isOpen("searchOverlay") || isOpen("tankOverlay") || isOpen("fishOverlay")) return;
  if (!isOpen("dayOverlay")) openDay(data.date); else renderDay();
}

$("lTank").onchange = () => { logFishSel = []; fillTargets(); updateActionFields(); const t = tankById($("lTank").value); if (t && t.wcPercent && !$("lPct").value) $("lPct").value = t.wcPercent; };
$("lAction").onchange = updateActionFields;
$("lTreat").onchange = () => { syncTreatNew(); syncSaltCalc(); };
$("lTrDrug").addEventListener("input", syncSaltCalc);
$("lPct").addEventListener("input", syncSaltCalc);
$("lTarget").onchange = () => { logFishSel = $("lTarget").value ? [$("lTarget").value] : []; updateTagKind(); };
$("lTargetMulti").onchange = () => {
  logFishSel = [...$("lTargetMulti").querySelectorAll("input:checked")].map((i) => i.value);
  updateTagKind();
};
$("lTargetAll").onclick = () => { logFishSel = fishOfTank($("lTank").value).map((f) => f.id); syncTargetUi(); updateTagKind(); };
$("lTargetNone").onclick = () => { logFishSel = []; syncTargetUi(); updateTagKind(); };
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
