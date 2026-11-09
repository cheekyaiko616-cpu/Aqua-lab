"use strict";
// ===== 水換えのおすすめ（予定日と水質の両方から判断する） =====
// 判断のしかた
//  1. 予定日：最後に水換えした日（なければ登録日）＋ 水換え間隔 が今日以前なら「おすすめ」
//  2. 水質：最後の水換えより後に測った値で、アンモニア・亜硝酸が出ている、または硝酸塩が上限以上なら「おすすめ」
//  3. 水温：直近7日以内に測った水温が、水槽の適温から外れていたら「注意」（水換えとは別に知らせる）
function wcStatus(t) {
  const today = todayStr();
  const lastLog = lastWaterChange(t.id);
  const last = lastLog ? lastLog.date : null;
  // まだ水換えの記録がない水槽は、登録した日から数える（昔に立ち上げた水槽が、いきなり大きく「超過」にならないように）
  const base = last || t.createdAt || t.setupDate || null;
  const interval = t.wcInterval || null;
  let next = null, diff = null;
  if (interval && base) { next = addDays(base, interval); diff = daysBetween(today, next); }

  const reasons = [];
  const test = latestWaterTest(t.id);
  // 水換えより後に測った値だけを見る（同じ日なら、記録した順で判断）
  const fresh = test && (!last || test.date > last ||
    (test.date === last && state.logs.indexOf(test) > state.logs.indexOf(lastLog)));
  if (fresh) {
    const w = test.water;
    if (w.nh3 > 0) reasons.push("アンモニアが出ています（" + fmtNum(w.nh3) + "mg/L）");
    if (w.no2 > 0) reasons.push("亜硝酸が出ています（" + fmtNum(w.no2) + "mg/L）");
    const lim = t.no3Limit || DEFAULT_NO3_LIMIT;
    if (w.no3 !== null && w.no3 !== undefined && w.no3 >= lim) reasons.push("硝酸塩が多めです（" + fmtNum(w.no3) + "mg/L）");
  }

  let tempWarn = "";
  const tempLog = logsOfTankNewestFirst(t.id).find((l) => l.water && l.water.temp !== null && l.water.temp !== undefined);
  if (tempLog && daysBetween(tempLog.date, today) <= 7) {
    const v = tempLog.water.temp;
    if (t.tempMin !== null && t.tempMin !== undefined && v < t.tempMin) tempWarn = "水温が低めです（" + fmtNum(v) + "℃）";
    else if (t.tempMax !== null && t.tempMax !== undefined && v > t.tempMax) tempWarn = "水温が高めです（" + fmtNum(v) + "℃）";
  }

  const due = diff !== null && diff <= 0;
  return { interval, last, next, diff, due, reasons, tempWarn, test, recommend: due || reasons.length > 0 };
}

// 予定の文字：「今日が予定日」「予定から3日超過」「あと4日」
function wcDueText(s) {
  if (s.diff === null) return "";
  if (s.diff < 0) return "予定から" + (-s.diff) + "日超過";
  if (s.diff === 0) return "今日が予定日";
  return "あと" + s.diff + "日";
}

// 一覧のカードに出すバッジ
function wcBadgeHtml(s) {
  if (s.due) return '<span class="badge warn">' + (s.diff < 0 ? "水換え " + (-s.diff) + "日超過" : "今日水換え") + '</span>';
  if (s.reasons.length) return '<span class="badge warn">水換え推奨</span>';
  if (s.tempWarn) return '<span class="badge caution">水温注意</span>';
  if (s.diff === 1) return '<span class="badge caution">明日水換え</span>';
  if (s.diff !== null) return '<span class="badge">水換えまで' + s.diff + '日</span>';
  return "";
}

// カレンダー用：日付 → その日に水換え予定の水槽（予定を過ぎている水槽は今日に出す）
function wcPlanMap() {
  const today = todayStr(), map = new Map();
  state.tanks.forEach((t) => {
    const s = wcStatus(t);
    if (!s.next) return;
    pushTo(map, s.next < today ? today : s.next, t);
  });
  return map;
}
