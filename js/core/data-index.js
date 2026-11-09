"use strict";
// ===== 検索用の索引（ID・日付・水槽ごと・生体ごとの記録を、変更のあるときだけ作り直して使い回す） =====
// 使い方：tankById(id) / fishById(id) / fishOfTank(tankId) / logsOnDate("2026-11-06")
//         logsOfTank(id) / logsOfTankNewestFirst(id) / logsOfFishNewestFirst(id)
// 注意：返された配列は読み取り専用。並べ替えるときは slice() で複製してから行う。
let dataRev = 1;
function touchData() { dataRev++; }   // save() の先頭で呼ぶ（データが変わった印）

const NO_LIST = Object.freeze([]);
let ix = null;
function pushTo(map, key, v) { const a = map.get(key); if (a) a.push(v); else map.set(key, [v]); }

function dataIndex() {
  if (ix && ix.rev === dataRev && ix.tRef === state.tanks && ix.fRef === state.fish && ix.lRef === state.logs &&
      ix.nT === state.tanks.length && ix.nF === state.fish.length && ix.nL === state.logs.length) return ix;
  const tanks = new Map(), fish = new Map(), fishByTank = new Map(), byDate = new Map(), byTank = new Map(), byFish = new Map();
  state.tanks.forEach((t) => { if (!tanks.has(t.id)) tanks.set(t.id, t); });
  state.fish.forEach((f) => { if (!fish.has(f.id)) { fish.set(f.id, f); pushTo(fishByTank, f.tankId, f); } });
  state.logs.forEach((l) => {
    pushTo(byDate, l.date, l);
    pushTo(byTank, l.tankId, l);
    logFishIds(l).forEach((id) => pushTo(byFish, id, l));
  });
  ix = {
    rev: dataRev, tRef: state.tanks, fRef: state.fish, lRef: state.logs,
    nT: state.tanks.length, nF: state.fish.length, nL: state.logs.length,
    tanks, fish, fishByTank, byDate, byTank, byFish,
    // あとから必要になったときだけ作るもの（aqua.js で使う）
    newest: new Map(), fishNewest: new Map(), lastWc: new Map(), lastTest: new Map(), photo: new Map()
  };
  return ix;
}
function tankById(id) { return dataIndex().tanks.get(id); }
function fishById(id) { return dataIndex().fish.get(id); }
function fishOfTank(tankId) { return dataIndex().fishByTank.get(tankId) || NO_LIST; }
function logsOnDate(date) { return dataIndex().byDate.get(date) || NO_LIST; }
function logsOfTank(id) { return dataIndex().byTank.get(id) || NO_LIST; }
function logsOfTankNewestFirst(id) {
  const x = dataIndex();
  let a = x.newest.get(id);
  // 同じ日の記録は、あとで記録したものが先
  if (!a) { a = logsOfTank(id).slice().reverse().sort(byDateDesc); x.newest.set(id, a); }
  return a;
}
function logsOfFishNewestFirst(id) {
  const x = dataIndex();
  let a = x.fishNewest.get(id);
  if (!a) { a = (x.byFish.get(id) || NO_LIST).slice().reverse().sort(byDateDesc); x.fishNewest.set(id, a); }
  return a;
}
