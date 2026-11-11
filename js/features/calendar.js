"use strict";
// ===== カレンダー（記録の点・水換え予定の輪・年月ホイール・左右スワイプで月を移動） =====

function fillMonthPick() {
  $("pickYear").textContent = viewYear + "年";
  $("pickMonth").textContent = (viewMonth + 1) + "月";
}
// 1日分のマス。other=true は前の月・次の月の日（薄く表示。押すとその月に切り替わる）
function calCellHtml(y, m, d, today, plan, care, other) {
  const key = ymd(y, m, d);
  const wd = new Date(y, m, d).getDay();
  const cls = ["cal-cell"];
  if (other) cls.push("other");
  if (key === today) cls.push("today");
  if (wd === 0) cls.push("sun");
  if (wd === 6) cls.push("sat");
  // 記録の点は、内容の色で最大3つ。4件以上は「+」
  const logs = logsOnDate(key).slice().sort((a, b) => ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action));
  let dotHtml = "";
  const planned = plan.get(key);
  const cared = care.get(key);
  if (planned) dotHtml += '<span class="dot plan"></span>';
  if (cared) dotHtml += '<span class="dot plan care"></span>';
  logs.slice(0, 3).forEach((l) => { dotHtml += '<span class="dot" style="background:' + (ACTION_STYLE[l.action] || ACTION_STYLE["その他"]).dot + '"></span>'; });
  if (logs.length > 3) dotHtml += '<span class="plus">+</span>';
  const label = (other ? "前後の月の日：" : "") + (m + 1) + "月" + d + "日（" + WD[wd] + "）" + (key === today ? "、今日" : "") +
    (logs.length ? "、記録" + logs.length + "件" : "") + (planned ? "、水換え予定" + planned.length + "槽" : "") + (cared ? "、手入れ・薬浴の予定" + cared.length + "件" : "") + (other ? "、押すとその月を表示" : "");
  return '<button class="' + cls.join(" ") + '" data-date="' + key + '"' + (other ? ' data-other="1"' : '') + ' aria-label="' + label + '">' +
    '<span class="num">' + d + '</span><span class="dots">' + dotHtml + '</span></button>';
}
function renderCalendar() {
  fillMonthPick();
  const first = new Date(viewYear, viewMonth, 1).getDay();
  const days = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayStr();
  const plan = wcPlanMap(), care = carePlanMap();
  let html = "";
  // 1日の前の空き：前の月の日を並べる
  const prev = new Date(viewYear, viewMonth, 0);               // 前の月の最後の日
  for (let i = first - 1; i >= 0; i--) html += calCellHtml(prev.getFullYear(), prev.getMonth(), prev.getDate() - i, today, plan, care, true);
  for (let d = 1; d <= days; d++) html += calCellHtml(viewYear, viewMonth, d, today, plan, care, false);
  // 月末のあとの空き：次の月の日を並べる（最後の週を埋めるところまで）
  const rest = (7 - ((first + days) % 7)) % 7;
  const next = new Date(viewYear, viewMonth + 1, 1);
  for (let d = 1; d <= rest; d++) html += calCellHtml(next.getFullYear(), next.getMonth(), d, today, plan, care, true);
  setHtml($("calGrid"), html);
}
// 点の色の見本
function renderLegend() {
  const shown = ["水換え", "給餌", "薬浴", "水質測定"];
  $("calLegend").innerHTML = shown.map((a) => '<span><span class="dot" style="background:' + ACTION_STYLE[a].dot + '"></span>' + a + '</span>').join("") +
    '<span><span class="dot plan"></span>水換え予定</span><span><span class="dot plan care"></span>手入れ・薬浴の予定</span>';
}
function moveMonth(delta) {
  const d = new Date(viewYear, viewMonth + delta, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderCalendar();
}

$("prevM").onclick = () => moveMonth(-1);
$("nextM").onclick = () => moveMonth(1);
$("todayBtn").onclick = () => { const n = new Date(); viewYear = n.getFullYear(); viewMonth = n.getMonth(); renderCalendar(); };
$("calGrid").onclick = (e) => {
  const c = e.target.closest("[data-date]");
  if (!c) return;
  if (c.dataset.other) {                                       // 前後の月の日：その月の画面に切り替える
    const [y, m] = c.dataset.date.split("-").map(Number);
    const delta = (y - viewYear) * 12 + (m - 1 - viewMonth);
    moveMonth(delta);
    slideIn($("calGrid"), delta);
    return;
  }
  openDay(c.dataset.date);
};
onHSwipe($("view-calendar"), (delta) => { moveMonth(delta); slideIn($("calGrid"), delta); });

// ---- 年月のホイール選択 ----
function fillWheel(id, from, to, suffix) {
  const el = $(id);
  el.dataset.from = from;
  let html = "";
  for (let v = from; v <= to; v++) html += '<div class="wi">' + v + suffix + '</div>';
  el.innerHTML = html;
}
function wheelValue(id) {
  const el = $(id);
  const idx = Math.round(el.scrollTop / 40);
  const max = el.children.length - 1;
  return Number(el.dataset.from) + Math.max(0, Math.min(max, idx));
}
const wheelOn = {};
function markWheel(id) {
  const el = $(id);
  const idx = wheelValue(id) - Number(el.dataset.from);
  if (wheelOn[id] === idx && el.children[idx] && el.children[idx].classList.contains("on")) return;
  const prev = el.querySelector(".wi.on");
  if (prev) prev.classList.remove("on");
  if (el.children[idx]) el.children[idx].classList.add("on");
  wheelOn[id] = idx;
}
const wheelTick = {};
function markWheelSoon(id) {
  if (wheelTick[id]) return;
  wheelTick[id] = requestAnimationFrame(() => { wheelTick[id] = 0; markWheel(id); });
}
function scrollWheelTo(id, value) {
  const el = $(id);
  el.scrollTop = (value - Number(el.dataset.from)) * 40;
  markWheel(id);
}
function openWheel() {
  fillWheel("wheelY", 2000, 2099, "年");
  fillWheel("wheelM", 1, 12, "月");
  openOverlay("wheelOverlay");
  scrollWheelTo("wheelY", viewYear);
  scrollWheelTo("wheelM", viewMonth + 1);
}
$("pickBtn").onclick = openWheel;
$("wheelCancel").onclick = () => closeOverlay("wheelOverlay");
$("wheelOk").onclick = () => {
  viewYear = wheelValue("wheelY");
  viewMonth = wheelValue("wheelM") - 1;
  closeOverlay("wheelOverlay");
  renderCalendar();
};
$("wheelY").addEventListener("scroll", () => markWheelSoon("wheelY"), { passive: true });
$("wheelM").addEventListener("scroll", () => markWheelSoon("wheelM"), { passive: true });
