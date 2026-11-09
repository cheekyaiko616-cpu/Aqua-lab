"use strict";
// ===== 保存・読み込み（IndexedDB／使えない場合は localStorage） =====
let db = null, useLS = false, writing = false, dirty = false;

// 古い形や欠けた項目を整える（読み込み・バックアップ復元のあとに呼ぶ）
function normalize() {
  if (!Array.isArray(state.tanks)) state.tanks = [];
  if (!Array.isArray(state.fish)) state.fish = [];
  if (!Array.isArray(state.logs)) state.logs = [];
  if (!Array.isArray(state.equipment)) state.equipment = [];
  if (!Array.isArray(state.treatments)) state.treatments = [];
  state.logs.forEach((l) => { if (l.fishId === undefined) l.fishId = null; if (!Array.isArray(l.tags)) l.tags = []; });
  state.fish.forEach((f) => { if (!f.count) f.count = 1; });
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("noidb")); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(DB_STORE)) d.createObjectStore(DB_STORE);
      if (!d.objectStoreNames.contains(DB_PHOTOS)) d.createObjectStore(DB_PHOTOS);
    };
    req.onsuccess = () => {
      const d = req.result;
      d.onversionchange = () => d.close();
      resolve(d);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => {};
  });
}
function dbReadAll() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE, DB_PHOTOS], "readonly");
    const st = tx.objectStore(DB_STORE);
    const out = {};
    DATA_KEYS.forEach((k) => { const r = st.get(k); r.onsuccess = () => { out[k] = r.result; }; });
    // 写真は中身を読まず、番号の一覧だけ覚えておく（起動を軽くするため）
    tx.objectStore(DB_PHOTOS).getAllKeys().onsuccess = (e) => {
      storedIds.clear();
      e.target.result.forEach((id) => storedIds.add(String(id)));
    };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
function dbWriteAll(photos, removeIds) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE, DB_PHOTOS], "readwrite");
    const st = tx.objectStore(DB_STORE);
    DATA_KEYS.forEach((k) => st.put(state[k], k));
    const ps = tx.objectStore(DB_PHOTOS);
    photos.forEach((v, id) => ps.put(v, id));
    removeIds.forEach((id) => ps.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
// 書き込み中に次の保存が来たら、終わってから最新の内容でもう一度書く
function flush() {
  if (!db) return;
  if (writing) { dirty = true; return; }
  writing = true;
  dirty = false;
  externalizePhotos();
  const used = usedPhotoIds();
  const batch = new Map();
  pending.forEach((v, id) => { if (used.has(id)) batch.set(id, v); });
  pending = new Map();
  const removeIds = [...storedIds].filter((id) => !used.has(id));
  writingPhotos = batch;
  dbWriteAll(batch, removeIds)
    .then(() => {
      removeIds.forEach((id) => storedIds.delete(id));
      batch.forEach((_, id) => storedIds.add(id));
      writingPhotos = null;
      writing = false;
      if (dirty) flush();
    })
    .catch(() => {
      batch.forEach((v, id) => pending.set(id, v));
      writingPhotos = null;
      writing = false;
      toast("保存できませんでした。空き容量や設定をご確認ください");
    });
}
function save() {
  touchData();
  if (useLS) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); return true; }
    catch (e) { toast("容量がいっぱいです。写真を減らすか、古い記録を整理してください"); return false; }
  }
  flush();
  return true;
}
async function loadData() {
  let d = null;
  try { db = await openDB(); } catch (e) { db = null; useLS = true; }
  if (db) {
    try { const r = await dbReadAll(); if (Array.isArray(r.tanks)) d = r; } catch (e) { /* 読めない場合は空で開始 */ }
  } else {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) d = JSON.parse(raw); } catch (e) { /* 空で開始 */ }
  }
  if (d && Array.isArray(d.tanks)) {
    state.tanks = d.tanks;
    state.fish = Array.isArray(d.fish) ? d.fish : [];
    state.logs = Array.isArray(d.logs) ? d.logs : [];
    state.equipment = Array.isArray(d.equipment) ? d.equipment : [];
    state.treatments = Array.isArray(d.treatments) ? d.treatments : [];
    if (d.settings) state.settings = Object.assign(state.settings, d.settings);
  }
  normalize();
  touchData();
  // ブラウザに、保存データを勝手に消さないよう依頼する
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* 未対応 */ }
}
// 保存容量の目安（データが変わったときだけ数え直す）
let kbRev = -1, kbValue = 0;
function storageKB() {
  if (kbRev !== dataRev) { kbValue = Math.round(JSON.stringify(state).length / 1024); kbRev = dataRev; }
  return kbValue;
}
