"use strict";
// ===== 生体の追加・編集（水槽・分類と種類・呼び名・数・迎えた日・オスメス・写真・メモ） =====
let fishEditingId = null;
let fishEditPhoto = null;
function setFishEditPhoto(data) { fishEditPhoto = data || null; showPickedPhoto("fe", fishEditPhoto); }

// 選んだ水槽の種類に合う分類だけを出す（すでに登録済みの分類は、編集中だけ残す）
function fillFishCat(selected, keepSelected) {
  const t = tankById($("feTank").value);
  const names = fishCatNamesFor(t ? tankTypeOf(t) : OTHER);
  if (keepSelected && FISH_CATS[selected] && !names.includes(selected)) names.push(selected);
  $("feCat").innerHTML = names.map((c) => '<option value="' + c + '">' + c + '</option>').join("");
  $("feCat").value = FISH_CATS[selected] && names.includes(selected) ? selected : names[0];
}
function fillFishVar(selectedVar) {
  const items = FISH_CATS[$("feCat").value].items;
  $("feVar").innerHTML = items.map((v) => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join("") +
    '<option value="' + OTHER_VAR + '">その他（自由入力）</option>';
  $("feVarOther").value = "";
  if (selectedVar && items.includes(selectedVar)) $("feVar").value = selectedVar;
  else if (selectedVar) { $("feVar").value = OTHER_VAR; $("feVarOther").value = selectedVar; }
  else $("feVar").value = items[0] || OTHER_VAR;
  $("feVarOther").style.display = $("feVar").value === OTHER_VAR ? "block" : "none";
}
function setFishTypeMode(mode) {
  const sel = mode === "select";
  $("feSelectTab").classList.toggle("active", sel);
  $("feTextTab").classList.toggle("active", !sel);
  $("feSelectTab").setAttribute("aria-pressed", String(sel));
  $("feTextTab").setAttribute("aria-pressed", String(!sel));
  $("feSelectMode").style.display = sel ? "block" : "none";
  $("feTextMode").style.display = sel ? "none" : "block";
}

function openFishEdit(f, presetTankId) {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  fishEditingId = f ? f.id : null;
  $("feTitle").textContent = f ? "生体を編集" : "生体を追加";
  $("feTank").innerHTML = state.tanks.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join("");
  $("feTank").value = f ? f.tankId : (presetTankId || state.tanks[0].id);
  if (f && fishCatOf(f) !== OTHER) {
    fillFishCat(fishCatOf(f), true); fillFishVar(f.type || null); $("feTypeText").value = ""; setFishTypeMode("select");
  } else if (f && f.type) {
    fillFishCat(null); fillFishVar(null); $("feTypeText").value = f.type; setFishTypeMode("text");
  } else {
    fillFishCat(null); fillFishVar(null); $("feTypeText").value = ""; setFishTypeMode("select");
  }
  $("feName").value = f && f.name ? f.name : "";
  $("feCount").value = f ? (f.count || 1) : 1;
  $("feAcquired").value = f && f.acquired ? f.acquired : (f ? "" : todayStr());
  $("feSex").value = f && f.sex ? f.sex : "";
  $("feMemo").value = f && f.memo ? f.memo : "";
  $("fePhoto").value = "";
  setFishEditPhoto(f && f.photo ? f.photo : null);
  openOverlay("fishEditOverlay");
}
function saveFishEdit() {
  let category, type;
  if ($("feSelectTab").classList.contains("active")) {
    category = $("feCat").value;
    type = $("feVar").value === OTHER_VAR ? $("feVarOther").value.trim() : $("feVar").value;
    if (category === OTHER && !type) { toast("種類の名前を入力してください"); return; }
  } else {
    category = OTHER;
    type = $("feTypeText").value.trim();
    if (!type && !$("feName").value.trim()) { toast("種類か呼び名を入力してください"); return; }
  }
  const cnt = readNum("feCount", 1, 9999, true);
  if (!cnt.ok) { toast("数は1〜9999で入力してください"); return; }
  const data = {
    tankId: $("feTank").value, name: $("feName").value.trim(), category, type,
    count: cnt.value || 1, acquired: $("feAcquired").value || null, sex: $("feSex").value,
    memo: $("feMemo").value.trim(), photo: fishEditPhoto
  };
  if (fishEditingId) {
    const f = fishById(fishEditingId);
    if (f) {
      // 別の水槽へ移したときは、この生体の記録も新しい水槽に付け替える
      if (f.tankId !== data.tankId) state.logs.forEach((l) => { if (l.fishId === f.id && !(l.fishIds && l.fishIds.length > 1)) l.tankId = data.tankId; });
      Object.assign(f, data);
    }
    toast("更新しました");
  } else {
    state.fish.push(Object.assign({ id: uid(), createdAt: todayStr() }, data));
    toast("登録しました");
  }
  if (!save()) return;
  closeOverlay("fishEditOverlay");
  afterChange();
}

$("feCat").onchange = () => fillFishVar(null);
$("feTank").onchange = () => {
  const keep = $("feCat").value;
  fillFishCat(keep);
  if ($("feCat").value !== keep) fillFishVar(null);
};
$("feVar").onchange = () => { $("feVarOther").style.display = $("feVar").value === OTHER_VAR ? "block" : "none"; };
$("feSelectTab").onclick = () => setFishTypeMode("select");
$("feTextTab").onclick = () => setFishTypeMode("text");
$("feCancel").onclick = () => closeOverlay("fishEditOverlay");
$("feSave").onclick = saveFishEdit;
$("fePhoto").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try { setFishEditPhoto(await resizeImage(f, PHOTO_MAX, PHOTO_Q)); }
  catch (err) { toast("写真を読み込めませんでした"); }
};
$("fePhotoClear").onclick = () => { setFishEditPhoto(null); $("fePhoto").value = ""; };
