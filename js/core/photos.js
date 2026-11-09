"use strict";
// ===== 写真の保存（記録とは別の場所に保存し、必要なときだけ読み込む） =====
// 水槽・生体・記録の中には、写真の代わりに「ph:番号」という目印だけを入れておく。
// 写真の本体は別の保存場所にあり、画面に出すときだけ読み込む。
const photoCache = new Map();   // 番号 → 写真のデータ（最近使ったものだけ覚える）
let pending = new Map();        // まだ保存していない新しい写真
let writingPhotos = null;       // 書き込み中の写真
const storedIds = new Set();    // 保存場所にある写真の番号一覧

function cacheGet(id) {
  const v = photoCache.get(id);
  if (v !== undefined) { photoCache.delete(id); photoCache.set(id, v); }
  return v;
}
function cacheSet(id, v) {
  photoCache.delete(id);
  photoCache.set(id, v);
  while (photoCache.size > PHOTO_CACHE_MAX) photoCache.delete(photoCache.keys().next().value);
}

// 写真が入る場所をすべてたどる
function eachPhotoSlot(data, fn) {
  (data.tanks || []).forEach((t) => { if (t.photo) fn(t); });
  (data.fish || []).forEach((f) => { if (f.photo) fn(f); });
  (data.logs || []).forEach((l) => { if (l.photo) fn(l); });
}

// 画像タグを作る。保存場所にある写真は、あとで fillPhotoImgs が本物に差し替える
function photoImg(ref, extra, alt) {
  if (!ref) return "";
  const attrs = extra ? " " + extra : "";
  const a = alt ? escapeHtml(alt) : "";
  if (ref.startsWith("ph:")) return '<img data-ph="' + ref.slice(3) + '" alt="' + a + '"' + attrs + '>';
  return '<img src="' + ref + '" alt="' + a + '"' + attrs + '>';
}

// 同じ瞬間に頼まれた読み込みは、1回にまとめる
let wanted = new Map();
let wantedScheduled = false;
function loadFromDb(id) {
  return new Promise((resolve) => {
    const w = wanted.get(id);
    if (w) { w.push(resolve); return; }
    wanted.set(id, [resolve]);
    if (!wantedScheduled) { wantedScheduled = true; queueMicrotask(runWanted); }
  });
}
function runWanted() {
  wantedScheduled = false;
  const batch = wanted;
  wanted = new Map();
  const done = (id, v) => { const rs = batch.get(id); if (rs) { batch.delete(id); rs.forEach((f) => f(v)); } };
  try {
    const tx = db.transaction(DB_PHOTOS, "readonly");
    const st = tx.objectStore(DB_PHOTOS);
    batch.forEach((_, id) => {
      const r = st.get(id);
      r.onsuccess = () => { if (r.result) cacheSet(id, r.result); done(id, r.result || null); };
      r.onerror = () => done(id, null);
    });
    tx.onabort = () => Array.from(batch.keys()).forEach((id) => done(id, null));
  } catch (e) { Array.from(batch.keys()).forEach((id) => done(id, null)); }
}

// 写真のデータを取り出す（覚えていなければ保存場所から読み込む）
function getPhotoSrc(ref) {
  if (!ref) return Promise.resolve(null);
  if (!ref.startsWith("ph:")) return Promise.resolve(ref);
  const id = ref.slice(3);
  const hit = cacheGet(id);
  if (hit !== undefined) return Promise.resolve(hit);
  const unsaved = pending.get(id) || (writingPhotos && writingPhotos.get(id));
  if (unsaved) { cacheSet(id, unsaved); return Promise.resolve(unsaved); }
  if (!db || useLS) return Promise.resolve(null);
  return loadFromDb(id);
}

// 画面に追加された写真の目印を、実際の写真に差し替える
function fillPhotoImgs(root) {
  if (!root || root.nodeType !== 1) return;
  const imgs = [];
  if (root.matches && root.matches("img[data-ph]")) imgs.push(root);
  root.querySelectorAll("img[data-ph]").forEach((i) => imgs.push(i));
  imgs.forEach((img) => {
    const id = img.dataset.ph;
    getPhotoSrc("ph:" + id).then((src) => {
      if (src && img.dataset.ph === id) { img.decoding = "async"; img.src = src; img.removeAttribute("data-ph"); }
    });
  });
}
function initPhotos() {
  new MutationObserver((list) => {
    list.forEach((m) => m.addedNodes.forEach((n) => fillPhotoImgs(n)));
  }).observe(document.body, { childList: true, subtree: true });
}

// 保存のときに、写真の本体を別の保存場所へ移し、記録側には目印だけを残す
function externalizePhotos() {
  eachPhotoSlot(state, (o) => {
    if (o.photo.startsWith("data:")) {
      const id = uid();
      pending.set(id, o.photo);
      cacheSet(id, o.photo);
      o.photo = "ph:" + id;
    }
  });
}
function usedPhotoIds() {
  const used = new Set();
  eachPhotoSlot(state, (o) => { if (o.photo.startsWith("ph:")) used.add(o.photo.slice(3)); });
  return used;
}
// バックアップ用：写真の本体を含んだ形でデータを作る
async function portableData() {
  const data = JSON.parse(JSON.stringify({ tanks: state.tanks, fish: state.fish, logs: state.logs, equipment: state.equipment, treatments: state.treatments, settings: state.settings }));
  const slots = [];
  eachPhotoSlot(data, (o) => slots.push(o));
  await Promise.all(slots.map(async (o) => {
    if (o.photo.startsWith("ph:")) o.photo = (await getPhotoSrc(o.photo)) || null;
  }));
  return data;
}
