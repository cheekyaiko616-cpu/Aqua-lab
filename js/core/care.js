"use strict";
// ===== 機器・薬浴の計算（次の手入れ日・薬浴の何日目か・今の経過など） =====
// 機器の「最後に手入れした日」と、薬浴の「経過」は、記録（logs）から求める。

// ---- 機器 ----
function equipById(id) { return state.equipment.find((e) => e.id === id) || null; }
function equipOfTank(tankId, withRetired) {
  return state.equipment.filter((e) => e.tankId === tankId && (withRetired || !e.retired));
}
function equipName(e) { return e.name || e.kind; }
function equipNameById(id) { const e = equipById(id); return e ? equipName(e) : "（削除済み）"; }
function lastEquipLog(equipId) {
  let best = null;
  state.logs.forEach((l) => { if (l.equipId === equipId && (!best || l.date >= best.date)) best = l; });
  return best;
}
// 手入れの状況： last=最後に手入れした日 / next=次の予定日 / diff=予定日まで（負なら超過） / due=今日以前
function equipStatus(e) {
  const today = todayStr();
  const lastLog = lastEquipLog(e.id);
  const last = lastLog ? lastLog.date : null;
  const interval = e.interval || null;
  const base = last || e.since || e.createdAt || null;
  const next = interval && base ? addDays(base, interval) : null;
  const diff = next ? daysBetween(today, next) : null;
  return { last, interval, next, diff, due: diff !== null && diff <= 0 };
}
function equipDueText(s) {
  if (s.diff === null) return "";
  if (s.diff < 0) return (-s.diff) + "日超過";
  if (s.diff === 0) return "今日";
  return "あと" + s.diff + "日";
}

// ---- 薬浴 ----
function treatById(id) { return state.treatments.find((t) => t.id === id) || null; }
function treatOfTank(tankId, activeOnly) {
  return state.treatments.filter((t) => t.tankId === tankId && (!activeOnly || t.status !== "done"))
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}
function treatTargetText(t) {
  const names = (t.fishIds || []).map((id) => fishById(id)).filter(Boolean).map(fishLabel);
  return names.length ? names.join("、") : "水槽全体";
}
function treatLabel(t) { return [t.reason, t.drug].filter(Boolean).join(" ・ ") || "薬浴"; }
function treatLogs(treatId) {
  return state.logs.filter((l) => l.treatmentId === treatId).sort(byDateDesc);
}
// 薬浴の状況： day=何日目 / days=予定日数 / over=予定日数を過ぎた / progress=最新の経過 / next=次の薬の追加・水換え予定日
function treatStatus(t) {
  const today = todayStr();
  const end = t.status === "done" && t.endDate ? t.endDate : today;
  const day = Math.max(1, daysBetween(t.startDate || today, end) + 1);
  const logs = treatLogs(t.id);
  const lastProg = logs.find((l) => l.progress) || null;
  const every = t.every || null;
  // 「薬の追加・水換え」をした日：薬浴の記録（薬を入れた）のほか、この水槽の「水換え」「投薬」の記録も数える
  //  （投薬は、水槽全体、またはこの薬浴の生体への記録のとき）
  let doseDate = null;
  const fishIds = t.fishIds || [];
  state.logs.forEach((l) => {
    if (l.date > today || (t.startDate && l.date < t.startDate)) return;
    const hit = (l.treatmentId === t.id && l.dosed) ||
      (l.tankId === t.tankId && l.action === "水換え") ||
      (l.tankId === t.tankId && l.action === "投薬" && (!fishIds.length || !logFishIds(l).length || logFishIds(l).some((id) => fishIds.includes(id))));
    if (hit && (!doseDate || l.date > doseDate)) doseDate = l.date;
  });
  const lastDose = doseDate ? { date: doseDate } : null;
  const doseBase = lastDose ? lastDose.date : (t.startDate || null);   // 始めた日に、1回目の薬を入れたとみなす
  const next = every && doseBase ? addDays(doseBase, every) : null;
  const diff = next ? daysBetween(today, next) : null;
  return {
    day, days: t.days || null, over: !!t.days && day > t.days, active: t.status !== "done",
    progress: lastProg ? lastProg.progress : null, progressDate: lastProg ? lastProg.date : null,
    lastLogDate: logs.length ? logs[0].date : null,
    next, diff, doseDue: diff !== null && diff <= 0
  };
}
// 記録に出す「どの薬浴の何日目か」
function treatLogText(l) {
  const t = treatById(l.treatmentId);
  if (!t) return "薬浴（削除済み）";
  return treatLabel(t) + "（" + (Math.max(1, daysBetween(t.startDate || l.date, l.date) + 1)) + "日目）";
}

// 水槽の一覧のカードに出す小さな印（薬浴中・機器の手入れ時期）
function careBadgeHtml(t) {
  const due = equipOfTank(t.id).filter((e) => equipStatus(e).due).length;
  return (due ? '<span class="badge caution">機器 ' + due + '件</span>' : '');
}

// カレンダー用：日付 → その日の「機器の手入れ」「薬浴」の予定（過ぎている予定は今日に出す）
//   機器の手入れ日 / 薬浴の薬の追加・水換え日 / 薬浴の終了予定日
function carePlanMap() {
  const today = todayStr(), map = new Map(), count = new Map();
  // 同じ水槽・同じ内容の予定は1つにまとめる（「（3件）」のように件数を付ける）
  const add = (day, item) => {
    const k = day + "|" + item.t.id + "|" + item.text, c = count.get(k);
    if (c) { c.n++; c.item.text = c.base + "（" + c.n + "件）"; return; }
    const o = { day, base: item.text, n: 1, item }; count.set(k, o); pushTo(map, day, item);
  };
  state.tanks.forEach((t) => {
    equipOfTank(t.id).forEach((e) => {
      const s = equipStatus(e);
      if (s.next) add(s.next < today ? today : s.next, { t, icon: "wrench", text: equipName(e) + "の手入れ" });
    });
    treatOfTank(t.id, true).forEach((tr) => {
      const s = treatStatus(tr);
      if (s.next) add(s.next < today ? today : s.next, { t, icon: "heal", text: treatLabel(tr) + "：薬の追加・水換え" });
      if (tr.days && tr.startDate) {
        const end = addDays(tr.startDate, tr.days - 1);
        add(end < today ? today : end, { t, icon: "heal", text: treatLabel(tr) + "：終了予定" });
      }
    });
  });
  return map;
}
