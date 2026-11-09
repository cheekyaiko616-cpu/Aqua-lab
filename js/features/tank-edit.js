"use strict";
// ===== 水槽の追加・編集 =====
let tankEditingId = null;
let tankEditPhoto = null;

// 写真の選択欄（追加・編集画面で共通の動き）。prefix: "te" / "fe" / "l"
async function showPickedPhoto(prefix, data) {
  const prev = $(prefix + "PhotoPreview"), clear = $(prefix + "PhotoClear");
  if (data) {
    const src = await getPhotoSrc(data);
    if (src) prev.src = src;
    prev.style.display = "block";
    clear.style.display = "inline-block";
  } else {
    prev.removeAttribute("src");
    prev.style.display = "none";
    clear.style.display = "none";
  }
}
function setTankEditPhoto(data) { tankEditPhoto = data || null; showPickedPhoto("te", tankEditPhoto); }

function openTankEdit(t) {
  tankEditingId = t ? t.id : null;
  $("teTitle").textContent = t ? "水槽を編集" : "水槽を追加";
  $("teType").innerHTML = TANK_TYPE_NAMES.map((n) => '<option value="' + n + '">' + n + '</option>').join("");
  $("teType").value = t ? tankTypeOf(t) : TANK_TYPE_NAMES[0];
  $("teName").value = t ? t.name : "";
  const v = (x) => (x === null || x === undefined ? "" : x);
  $("teVolume").value = t ? v(t.volume) : "";
  $("teSetup").value = t && t.setupDate ? t.setupDate : "";
  $("teInterval").value = t ? v(t.wcInterval) : 7;
  $("tePercent").value = t ? v(t.wcPercent) : 30;
  $("teMemo").value = t && t.memo ? t.memo : "";
  $("tePhoto").value = "";
  setTankEditPhoto(t && t.photo ? t.photo : null);
  openOverlay("tankEditOverlay");
}
function saveTankEdit() {
  const name = $("teName").value.trim();
  if (!name) { toast("水槽の名前を入力してください"); return; }
  const vol = readNum("teVolume", 0, 99999), iv = readNum("teInterval", 1, 365, true), pct = readNum("tePercent", 1, 100, true);
  if (!vol.ok) { toast("水量は0〜99999の数字で入力してください"); return; }
  if (!iv.ok) { toast("水換え間隔は1〜365の数字で入力してください"); return; }
  if (!pct.ok) { toast("換水量は1〜100の数字で入力してください"); return; }
  const data = {
    name, type: $("teType").value, volume: vol.value, setupDate: $("teSetup").value || null,
    wcInterval: iv.value, wcPercent: pct.value, no3Limit: null, tempMin: null, tempMax: null,
    memo: $("teMemo").value.trim(), photo: tankEditPhoto
  };
  if (tankEditingId) {
    const t = tankById(tankEditingId);
    if (t) Object.assign(t, data);
    toast("更新しました");
  } else {
    state.tanks.push(Object.assign({ id: uid(), createdAt: todayStr() }, data));
    toast("登録しました");
  }
  if (!save()) return;
  closeOverlay("tankEditOverlay");
  afterChange();
}

$("teCancel").onclick = () => closeOverlay("tankEditOverlay");
$("teSave").onclick = saveTankEdit;
$("tePhoto").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try { setTankEditPhoto(await resizeImage(f, PHOTO_MAX, PHOTO_Q)); }
  catch (err) { toast("写真を読み込めませんでした"); }
};
$("tePhotoClear").onclick = () => { setTankEditPhoto(null); $("tePhoto").value = ""; };
