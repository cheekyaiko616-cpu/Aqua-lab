"use strict";
// ===== 薬浴の経過管理：水槽・生体の詳細の表示と、薬浴の開始・編集の画面 =====
// 経過は、記録（内容＝薬浴）として残す。何日目か・次の薬の追加日・今の様子は、そこから求める。
let treatEditingId = null;

// 1件ぶんのカード
function treatCardHtml(tr) {
  const s = treatStatus(tr);
  const pct = s.days ? Math.min(100, Math.round(s.day / s.days * 100)) : 0;
  const lines = [];
  lines.push("対象：" + treatTargetText(tr));
  if (tr.dose) lines.push("量：" + tr.dose);
  lines.push("始めた日 " + fmtSlash(tr.startDate));
  let warn = "";
  if (s.over) warn += '<div class="notice caution">' + svgIcon("heal") + ' 予定の' + s.days + '日を過ぎています。終了するか、日数を延ばしてください。</div>';
  if (s.doseDue) warn += '<div class="notice warn">' + svgIcon("pill") + ' ' + (s.diff < 0 ? treatDoseWord(tr) + "の予定日を" + (-s.diff) + "日過ぎています" : "今日は" + treatDoseWord(tr) + "の日です") + '</div>';
  return '<div class="care-card' + (s.over || s.doseDue ? ' alert' : '') + '">' +
    '<div class="care-top"><b>' + escapeHtml(treatLabel(tr)) + '</b><span class="care-next">' + s.day + '日目' + (s.days ? ' / ' + s.days + '日' : '') + '</span></div>' +
    (s.days ? '<div class="care-bar" role="img" aria-label="' + s.days + '日中' + s.day + '日目"><span style="width:' + pct + '%"></span></div>' : '') +
    '<div class="hint" style="margin:4px 0 0;">' + escapeHtml(lines.join(" ・ ")) + '</div>' +
    '<div class="care-line">今の様子：' + (s.progress ? '<b class="prog p' + TREAT_PROGRESS.indexOf(s.progress) + '">' + s.progress + '</b>（' + fmtSlash(s.progressDate) + '）' : '<span class="hint" style="margin:0;">まだ記録がありません</span>') + '</div>' +
    (s.next ? '<div class="care-line">次の' + treatDoseWord(tr) + '：' + fmtSlash(s.next) + '（' + (s.diff < 0 ? (-s.diff) + '日超過' : s.diff === 0 ? '今日' : 'あと' + s.diff + '日') + '）</div>' : '') +
    (tr.memo ? '<div class="hint" style="margin:4px 0 0;">' + escapeHtml(tr.memo) + '</div>' : '') +
    warn +
    '<div class="btn-row"><button class="primary" data-treat-log="' + tr.id + '">今日の経過を記録</button>' +
    '<button class="secondary" data-treat-end="' + tr.id + '">終了する</button>' +
    '<button class="secondary" data-treat-edit="' + tr.id + '">編集</button></div></div>';
}
// 水槽の詳細に出す「薬浴」の欄
function treatSectionHtml(t) {
  const act = treatOfTank(t.id, true);
  const past = treatOfTank(t.id).filter((x) => x.status === "done");
  return '<div class="section"><h3>薬浴・塩浴' + (act.length ? '（実施中 ' + act.length + '）' : '') + '</h3>' +
    (act.length ? act.map(treatCardHtml).join("") : '<div class="hint">実施中のものはありません。始めると、何日目か・次の薬の追加日（塩浴は水換え日）・魚の様子を管理できます。</div>') +
    (past.length ? '<div class="hint" style="margin-top:10px;">過去の薬浴・塩浴</div>' + past.map((x) => {
      const s = treatStatus(x);
      return '<div class="item"><span><b>' + escapeHtml(treatLabel(x)) + '</b><br><small>' + escapeHtml(fmtSlash(x.startDate) + "〜" + fmtSlash(x.endDate || x.startDate) + "（" + s.day + "日間）・" + treatTargetText(x) + (x.result ? " ・ " + x.result : "")) + '</small></span>' +
        rowButtonHtml({ kind: "secondary", label: "編集", attr: "data-treat-edit", value: x.id, ariaLabel: treatLabel(x) + "を編集" }) + '</div>';
    }).join("") : '') +
    '<div class="btn-row"><button class="secondary" id="addTreatBtn">＋ 薬浴を始める</button><button class="secondary" id="addSaltBtn">＋ 塩浴を始める</button></div></div>';
}
// 生体の詳細に出す「薬浴中」の欄（その生体が対象のもの。水槽全体の薬浴も含む）
function fishTreatHtml(f) {
  const act = treatOfTank(f.tankId, true).filter((x) => !(x.fishIds || []).length || x.fishIds.includes(f.id));
  if (!act.length) return "";
  return '<div class="section"><h3>薬浴・塩浴中</h3>' + act.map(treatCardHtml).join("") + '</div>';
}

// 詳細の中のボタン。処理したら true
function handleTreatClick(el, tankId) {
  if (el.closest("#addTreatBtn")) { openTreatEdit(null, tankId); return true; }
  if (el.closest("#addSaltBtn")) { openTreatEdit(null, tankId, false, "塩浴"); return true; }
  const log = el.closest("[data-treat-log]");
  if (log) { const tr = treatById(log.dataset.treatLog); if (tr) openLog({ date: todayStr(), tankId: tr.tankId, action: treatKind(tr), treatmentId: tr.id }); return true; }
  const end = el.closest("[data-treat-end]");
  if (end) { const tr = treatById(end.dataset.treatEnd); if (tr) openTreatEdit(tr, null, true); return true; }
  const edit = el.closest("[data-treat-edit]");
  if (edit) { const tr = treatById(edit.dataset.treatEdit); if (tr) openTreatEdit(tr); return true; }
  return false;
}

// ---- 開始・編集 ----
function fillTreatFish(tankId, selected) {
  const fish = fishOfTank(tankId);
  $("trFishBox").innerHTML = fish.length
    ? fish.map((f) => '<label class="chk"><input type="checkbox" value="' + f.id + '"' + (selected.includes(f.id) ? ' checked' : '') + '> ' + escapeHtml(fishLabel(f)) + '</label>').join("")
    : '<div class="hint" style="margin:0;">この水槽には生体が登録されていません（水槽全体が対象になります）</div>';
}
function showTreatEnd() { $("trEndBox").style.display = $("trStatus").value === "done" ? "" : "none"; }
// 薬浴か塩浴かで、見出しや入力欄の言葉を切り替える
let treatEditKind = "薬浴", trDoseManual = false;
// 塩浴：濃度と水槽の容量から、塩の量を自動で入れる（自分で書き換えたら、そのまま残す）
function autoSaltDose() {
  const hint = $("trSaltCalc");
  const salt = treatEditKind === "塩浴";
  const tank = tankById($("trTank").value);
  const calc = salt ? saltCalcText(tank, $("trDrug").value) : "";
  hint.textContent = calc;
  hint.style.display = calc ? "" : "none";
  if (!salt) return;
  const pct = saltPctOf($("trDrug").value);
  if (!trDoseManual && pct && tank && Number(tank.volume) > 0) $("trDose").value = "塩 " + fmtG(saltGrams(Number(tank.volume), pct));
}
function applyTreatKind(kind) {
  treatEditKind = kind;
  const salt = kind === "塩浴";
  $("trTank").previousElementSibling.textContent = "水槽（" + kind + "する水槽）";
  $("trReason").placeholder = salt ? "例：体力回復" : "例：白点病";
  $("trDrug").previousElementSibling.textContent = salt ? "塩の濃度" : "薬・処置";
  $("trDrug").placeholder = salt ? "例：0.5%（水1Lに塩5g）" : "例：メチレンブルー";
  $("trDose").previousElementSibling.textContent = salt ? "塩の量" : "量・濃度";
  $("trDose").placeholder = salt ? "例：60Lに塩300g" : "例：規定量";
  $("trEvery").previousElementSibling.textContent = (salt ? "水換え・塩の調整" : "薬の追加・水換え") + "の間隔（日）";
  $("trMemo").placeholder = salt ? "水温・餌を止めたか・塩を足した量など" : "水温・塩分・餌を止めたかなど";
  $("trStatus").options[0].textContent = kind + "中";
  $("trReasonList").innerHTML = (salt ? SALT_REASONS : TREAT_REASONS).map((x) => '<option value="' + escapeHtml(x) + '">').join("");
}
function openTreatEdit(tr, presetTankId, ending, kind) {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  treatEditingId = tr ? tr.id : null;
  const k = tr ? treatKind(tr) : (kind || "薬浴");
  applyTreatKind(k);
  trDoseManual = !!(tr && tr.dose);
  $("trTitle").textContent = tr ? (ending ? k + "を終了する" : k + "を編集") : k + "を始める";
  $("trTank").innerHTML = state.tanks.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join("");
  $("trTank").value = tr ? tr.tankId : (presetTankId || state.tanks[0].id);
  fillTreatFish($("trTank").value, tr ? tr.fishIds || [] : []);
  const drugs = k === "塩浴" ? SALT_CONCS.concat(state.treatments.filter((x) => treatKind(x) === "塩浴").map((x) => x.drug).filter(Boolean))
    : pastItems("薬浴").concat(pastItems("投薬")).concat(state.treatments.filter((x) => treatKind(x) !== "塩浴").map((x) => x.drug).filter(Boolean)).concat(TREAT_DRUGS);
  $("trDrugList").innerHTML = [...new Set(drugs)].slice(0, 40).map((x) => '<option value="' + escapeHtml(x) + '">').join("");
  $("trReason").value = tr ? tr.reason || "" : "";
  $("trDrug").value = tr ? tr.drug || "" : "";
  $("trDose").value = tr ? tr.dose || "" : "";
  $("trStart").value = tr ? tr.startDate || "" : todayStr();
  $("trDays").value = tr && tr.days ? tr.days : "";
  $("trEvery").value = tr && tr.every ? tr.every : "";
  $("trMemo").value = tr ? tr.memo || "" : "";
  $("trEditBox").style.display = tr ? "" : "none";
  $("trResult").innerHTML = '<option value="">選ばない</option>' + TREAT_RESULTS.map((x) => '<option value="' + x + '">' + x + '</option>').join("");
  $("trStatus").value = tr && (tr.status === "done" || ending) ? "done" : "active";
  $("trEnd").value = tr && tr.endDate ? tr.endDate : todayStr();
  $("trResult").value = tr && tr.result ? tr.result : "";
  $("trDelete").style.display = tr ? "" : "none";
  showTreatEnd();
  autoSaltDose();
  openOverlay("treatEditOverlay");
}
function saveTreatEdit() {
  const days = readNum("trDays", 1, 365, true), every = readNum("trEvery", 1, 60, true);
  if (!days.ok) { toast("予定の日数は1〜365の数字で入力してください"); return; }
  if (!every.ok) { toast("間隔は1〜60の数字で入力してください"); return; }
  const reason = $("trReason").value.trim(), drug = $("trDrug").value.trim();
  if (!reason && !drug) { toast(treatEditKind === "塩浴" ? "目的か、塩の濃度を入力してください" : "症状・目的か、薬・処置を入力してください"); return; }
  const fishIds = [...$("trFishBox").querySelectorAll("input:checked")].map((i) => i.value);
  const done = treatEditingId && $("trStatus").value === "done";
  const data = { kind: treatEditKind, tankId: $("trTank").value, fishIds, reason, drug, dose: $("trDose").value.trim(),
    startDate: $("trStart").value || todayStr(), days: days.value, every: every.value, memo: $("trMemo").value.trim(),
    status: done ? "done" : "active", endDate: done ? ($("trEnd").value || todayStr()) : null, result: done ? $("trResult").value : "" };
  if (done && data.endDate < data.startDate) { toast("終わった日は、始めた日より後にしてください"); return; }
  if (treatEditingId) {
    const tr = treatById(treatEditingId);
    if (tr) {
      if (tr.tankId !== data.tankId) state.logs.forEach((l) => { if (l.treatmentId === tr.id) l.tankId = data.tankId; });
      Object.assign(tr, data);
    }
    toast(done ? treatEditKind + "を終了しました" : "更新しました");
  } else {
    state.treatments.push(Object.assign({ id: uid(), createdAt: todayStr() }, data));
    toast(treatEditKind + "を始めました");
  }
  if (!save()) return;
  closeOverlay("treatEditOverlay");
  afterChange();
}

$("trTank").onchange = () => { fillTreatFish($("trTank").value, []); autoSaltDose(); };
$("trDrug").addEventListener("input", autoSaltDose);
$("trDose").addEventListener("input", () => { trDoseManual = true; });
$("trStatus").onchange = showTreatEnd;
$("trCancel").onclick = () => closeOverlay("treatEditOverlay");
$("trSave").onclick = saveTreatEdit;
$("trDelete").onclick = () => {
  const tr = treatById(treatEditingId);
  if (!tr) return;
  askConfirm("この" + treatKind(tr) + "を削除しますか？経過の記録も一緒に消えます。", () => {
    state.treatments = state.treatments.filter((x) => x.id !== tr.id);
    state.logs = state.logs.filter((l) => l.treatmentId !== tr.id);
    if (save()) { closeOverlay("treatEditOverlay"); afterChange(); toast("削除しました"); }
  });
};
