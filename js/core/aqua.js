"use strict";
// ===== 水槽・生体に関する共通ヘルパー（表示名・サムネイル・最新の水質や状態など） =====

// ---- 水槽 ----
function tankTypeOf(t) { const n = TANK_TYPE_LEGACY[t.type] || t.type; return TANK_TYPES[n] ? n : OTHER; }
function tankStyle(t) { return "--c:" + TANK_TYPES[tankTypeOf(t)].color + ";"; }
function tankName(id) { const t = tankById(id); return t ? t.name : "（削除済み）"; }
// 「淡水 ・ 60L」の形
function tankLabel(t) {
  const parts = [tankTypeOf(t)];
  if (t.volume) parts.push(fmtNum(t.volume) + "L");
  return parts.join(" ・ ");
}
// 水槽の生体の合計匹数
function fishCountOfTank(tankId) {
  return fishOfTank(tankId).reduce((s, f) => s + (Number(f.count) || 1), 0);
}

// ---- 生体 ----
function fishCatOf(f) { const c = FISH_CAT_LEGACY[f.category] || f.category; return FISH_CATS[c] ? c : OTHER; }
function fishStyle(f) { return "--c:" + FISH_CATS[fishCatOf(f)].color + ";"; }
function fishSpecies(f) {
  const c = fishCatOf(f);
  if (f.type) return f.type;
  return c === OTHER ? "種類未設定" : c;
}
// 呼び名があれば呼び名、なければ種類名
function fishLabel(f) { return f.name || fishSpecies(f); }
function fishNameById(id) { const f = fishById(id); return f ? fishLabel(f) : "（削除済み）"; }

// ---- 記録から分かること（索引に覚えておき、データが変わったら作り直す） ----
// いちばん新しい水換えの記録
function lastWaterChange(tankId) {
  const x = dataIndex();
  if (!x.lastWc.has(tankId)) x.lastWc.set(tankId, logsOfTankNewestFirst(tankId).find((l) => l.action === "水換え") || null);
  return x.lastWc.get(tankId);
}
function hasWater(l) { return !!l.water && WATER_KEYS.some((k) => l.water[k.key] !== null && l.water[k.key] !== undefined); }
// いちばん新しい水質の記録
function latestWaterTest(tankId) {
  const x = dataIndex();
  if (!x.lastTest.has(tankId)) x.lastTest.set(tankId, logsOfTankNewestFirst(tankId).find(hasWater) || null);
  return x.lastTest.get(tankId);
}
// いちばん新しい「状態タグ」付きの記録（水槽全体 or 生体）
function latestTankTags(tankId) {
  return logsOfTankNewestFirst(tankId).find((l) => !l.fishId && l.tags && l.tags.length) || null;
}
function latestFishTags(fishId) {
  return logsOfFishNewestFirst(fishId).find((l) => l.tags && l.tags.length) || null;
}
// サムネイル（登録写真 → 最新の記録写真 → 絵の順）
function latestPhotoOf(key, list) {
  const x = dataIndex();
  if (!x.photo.has(key)) { const l = list.find((q) => q.photo); x.photo.set(key, l ? l.photo : null); }
  return x.photo.get(key);
}
function tankThumb(t) {
  const ph = t.photo || latestPhotoOf("t:" + t.id, logsOfTankNewestFirst(t.id).filter((l) => !l.fishId));
  return ph ? photoImg(ph) : TANK_TYPES[tankTypeOf(t)].icon;
}
function fishThumb(f) {
  const ph = f.photo || latestPhotoOf("f:" + f.id, logsOfFishNewestFirst(f.id));
  return ph ? photoImg(ph) : FISH_CATS[fishCatOf(f)].icon;
}

// ---- 記録の表示用の文字 ----
function waterText(w) {
  if (!w) return "";
  return WATER_KEYS.filter((k) => w[k.key] !== null && w[k.key] !== undefined)
    .map((k) => k.label + " " + fmtNum(w[k.key]) + k.unit).join(" ・ ");
}
// 記録の「何に対して」：「60cm水槽」または「60cm水槽 / ネオンテトラ」
function logTargetText(l) {
  return tankName(l.tankId) + (l.fishId ? " / " + fishNameById(l.fishId) : "");
}
// これまでに使った餌・薬の名前（新しい順・重複なし）
function pastItems(action) {
  const seen = new Set(), out = [];
  state.logs.slice().sort(byDateDesc).forEach((l) => {
    if (l.action === action && l.item && !seen.has(l.item)) { seen.add(l.item); out.push(l.item); }
  });
  return out.slice(0, 30);
}
