"use strict";
// ===== 水質グラフ（水槽ごとの水温・pH・亜硝酸・硝酸塩の移り変わり） =====
// 水温は「適温の範囲」を帯で、硝酸塩は「上限」を点線で表示。下の青い点は水換えした日。
let gTankId = null, gMetric = "temp", gRange = 6, gShift = 0, gSel = null, gHit = null;

// きりのよい目盛りを作る（小数にも対応。例：6.6〜7.4 → 6.6, 6.8, 7.0, 7.2, 7.4）
function niceTicks(lo, hi) {
  const span = Math.max(hi - lo, 1e-6);
  const raw = span / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = [];
  for (let i = 0; a + i * step <= b + step * 1e-6; i++) t.push(Math.round((a + i * step) * 1e6) / 1e6);
  return { ticks: t, step };
}
function tickLabel(v, step) { return step >= 1 ? String(Math.round(v)) : v.toFixed(step >= 0.1 ? 1 : 2); }
function metricInfo() { return WATER_KEYS.find((k) => k.key === gMetric); }

function renderGraphSelect() {
  if (!state.tanks.some((t) => t.id === gTankId)) gTankId = state.tanks.length ? state.tanks[0].id : null;
  const t = tankById(gTankId);
  $("gTankBtn").innerHTML = t ? svgIcon("tank") + " " + escapeHtml(t.name) + ' <span class="caret">▼</span>' : '水槽を選ぶ <span class="caret">▼</span>';
  document.querySelectorAll("#gMetric button").forEach((b) => { const on = b.dataset.metric === gMetric; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  document.querySelectorAll("#gRange button").forEach((b) => { const on = Number(b.dataset.range) === gRange; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  $("gNext").disabled = gShift >= 0;
}
function renderGraphDetail(l, m) {
  setHtml($("gDetail"),
    '<div class="g-d-top"><b>' + fmtDateKey(l.date) + '</b><span class="g-d-act">' + m.label + '</span></div>' +
    '<div class="g-d-data">' + fmtNum(l.water[m.key]) + (m.unit ? ' ' + m.unit : '') + '</div>' +
    '<div class="g-d-sub">' + escapeHtml(waterText(l.water)) + '</div>');
}

function renderGraph() {
  renderGraphSelect();
  const t = tankById(gTankId);
  const m = metricInfo();
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + gShift * gRange, now.getDate());
  const cutDate = new Date(endDate.getFullYear(), endDate.getMonth() - gRange, endDate.getDate());
  const endS = ymd(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const cutS = ymd(cutDate.getFullYear(), cutDate.getMonth(), cutDate.getDate());
  $("gPeriodLabel").textContent = fmtSlash(cutS) + " 〜 " + fmtSlash(endS);

  if (!t) {
    setHtml($("chart"), '<div class="empty">水槽を登録すると、ここで水質の移り変わりを確認できます。</div>');
    setHtml($("gDetail"), ""); gHit = null;
    return;
  }
  const inRange = (l) => l.date >= cutS && l.date <= endS;
  const pts = logsOfTank(t.id).filter((l) => l.water && l.water[m.key] !== null && l.water[m.key] !== undefined && inRange(l)).sort(byDateAsc);
  if (!pts.length) {
    setHtml($("chart"), '<div class="empty" style="padding:30px 0;">この期間の「' + m.label + '」の記録はありません。<br>記録の「水質測定」で' + m.label + 'を入れると、ここにグラフが出ます。</div>');
    setHtml($("gDetail"), ""); gHit = null;
    return;
  }
  const wcDays = logsOfTank(t.id).filter((l) => l.action === "水換え" && inRange(l)).map((l) => l.date);

  // 目安の線・帯（水温＝適温の範囲、硝酸塩＝上限）
  let bandLo = null, bandHi = null, limit = null;
  if (m.key === "temp") { bandLo = t.tempMin ?? null; bandHi = t.tempMax ?? null; }
  if (m.key === "no3") limit = t.no3Limit || DEFAULT_NO3_LIMIT;

  const W = 320, padL = 44, padR = 14, padT = 16, plotH = 160;
  const vals = pts.map((l) => l.water[m.key]);
  const refs = vals.concat([bandLo, bandHi, limit].filter((v) => v !== null));
  const minV = Math.min.apply(null, refs), maxV = Math.max.apply(null, refs);
  const padV = (maxV - minV) * 0.15 || Math.max(0.5, Math.abs(maxV) * 0.1);
  const { ticks, step } = niceTicks(Math.max(0, minV - padV), maxV + padV);
  const yLo = ticks[0], yHi = ticks[ticks.length - 1];
  const t0 = cutDate.getTime(), t1 = new Date(endS + "T00:00:00").getTime();
  const xOf = (ms) => padL + (W - padL - padR) * ((ms - t0) / Math.max(1, t1 - t0));
  const yOf = (v) => padT + plotH * (1 - (v - yLo) / Math.max(1e-6, yHi - yLo));
  const msOf = (d) => new Date(d + "T00:00:00").getTime();
  const axisY = padT + plotH + 4, H = axisY + 22;

  const summary = m.label + "の推移グラフ。" + pts.length + "件、" + fmtNum(Math.min.apply(null, vals)) + "から" + fmtNum(Math.max.apply(null, vals)) + m.unit + "。点をタップすると詳細を表示します。";
  let svg = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" id="gSvg" role="img" aria-label="' + summary + '">';
  // 適温の帯
  if (bandLo !== null || bandHi !== null) {
    const top = yOf(bandHi !== null ? Math.min(bandHi, yHi) : yHi), bot = yOf(bandLo !== null ? Math.max(bandLo, yLo) : yLo);
    svg += '<rect x="' + padL + '" y="' + top.toFixed(1) + '" width="' + (W - padL - padR) + '" height="' + Math.max(0, bot - top).toFixed(1) + '" style="fill:var(--accent-soft)"/>';
  }
  ticks.forEach((v) => {
    const y = yOf(v);
    svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke:var(--border)" stroke-width="1"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="10" style="fill:var(--muted)">' + tickLabel(v, step) + '</text>';
  });
  if (m.unit) svg += '<text x="' + padL + '" y="' + (padT - 5) + '" font-size="10" style="fill:var(--muted)">' + m.unit + '</text>';
  // 硝酸塩の上限
  if (limit !== null) {
    const y = yOf(limit).toFixed(1);
    svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--danger)" stroke-width="1.2" stroke-dasharray="4 3"/>';
    svg += '<text x="' + (W - padR) + '" y="' + (Number(y) - 4) + '" text-anchor="end" font-size="9" style="fill:var(--danger)">上限 ' + fmtNum(limit) + '</text>';
  }
  // 横軸：1ヶ月は週ごと、6・12ヶ月は月の初めごと
  const xt = [];
  if (gRange === 1) {
    for (let ms = t0; ms <= t1; ms += 7 * 86400000) { const d = new Date(ms); xt.push({ ms, label: (d.getMonth() + 1) + "/" + d.getDate() }); }
  } else {
    const d = new Date(cutDate.getFullYear(), cutDate.getMonth() + 1, 1);
    while (d.getTime() <= t1) { xt.push({ ms: d.getTime(), label: (d.getMonth() + 1) + "月" }); d.setMonth(d.getMonth() + 1); }
  }
  let lastX = -1e9;
  xt.forEach((k) => {
    const x = xOf(k.ms);
    svg += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + padT + '" y2="' + (padT + plotH) + '" style="stroke:var(--border)" stroke-width="1" stroke-dasharray="2 3"/>';
    if (x - lastX >= 34 && x >= padL + 12 && x <= W - padR - 12) {
      svg += '<text x="' + x.toFixed(1) + '" y="' + (axisY + 17) + '" text-anchor="middle" font-size="10" style="fill:var(--muted)">' + k.label + '</text>';
      lastX = x;
    }
  });
  svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + axisY + '" y2="' + axisY + '" style="stroke:var(--border)" stroke-width="1"/>';
  // 水換えした日（下の青い点）
  wcDays.forEach((d) => { svg += '<circle cx="' + xOf(msOf(d)).toFixed(1) + '" cy="' + axisY + '" r="3" fill="#3b8fd1"/>'; });

  // 選んだ点・折れ線・点
  const sel = pts.find((l) => l.id === gSel) || pts[pts.length - 1];
  gSel = sel.id;
  const selX = xOf(msOf(sel.date));
  svg += '<line x1="' + selX.toFixed(1) + '" x2="' + selX.toFixed(1) + '" y1="' + padT + '" y2="' + axisY + '" style="stroke:var(--accent)" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>';
  const coords = pts.map((l) => xOf(msOf(l.date)).toFixed(1) + "," + yOf(l.water[m.key]).toFixed(1));
  if (pts.length > 1) svg += '<polyline points="' + coords.join(" ") + '" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--accent)"/>';
  pts.forEach((l) => {
    const x = xOf(msOf(l.date)), y = yOf(l.water[m.key]);
    if (l.id === sel.id) svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" style="fill:var(--accent-soft);stroke:var(--accent)" stroke-width="1.5"/>';
    svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" style="fill:var(--accent);stroke:var(--surface)" stroke-width="2"/>';
  });
  svg += "</svg>";
  const note = "点をタップすると詳細を表示 ・ 青い点＝水換えした日" + (m.key === "temp" && (bandLo !== null || bandHi !== null) ? " ・ 色の帯＝適温" : "");
  setHtml($("chart"), svg + '<div class="hint g-note">' + note + '</div>');
  gHit = { W, H, pts: pts.map((l) => ({ id: l.id, x: xOf(msOf(l.date)), y: yOf(l.water[m.key]) })) };
  renderGraphDetail(sel, m);
}

function openTankPick() {
  if (!state.tanks.length) { toast("先に水槽を登録してください"); return; }
  setHtml($("gPickList"), state.tanks.map((t) => tankPickRowHtml(t, t.id === gTankId, "data-gp", "radio")).join(""));
  openOverlay("tankPickOverlay");
}
$("gTankBtn").onclick = openTankPick;
$("gPickList").onclick = (e) => {
  const r = e.target.closest("[data-gp]");
  if (!r) return;
  gTankId = r.dataset.gp; gShift = 0; gSel = null;
  closeOverlay("tankPickOverlay");
  renderGraph();
};
$("gPickCancel").onclick = () => closeOverlay("tankPickOverlay");
$("gPrev").onclick = () => { gShift -= 1; renderGraph(); };
$("gNext").onclick = () => { if (gShift < 0) { gShift += 1; renderGraph(); } };
$("gRange").onclick = (e) => { gShift = 0; const b = e.target.closest("[data-range]"); if (b) gRange = Number(b.dataset.range); renderGraph(); };
$("gMetric").onclick = (e) => { const b = e.target.closest("[data-metric]"); if (!b) return; gMetric = b.dataset.metric; gSel = null; renderGraph(); };
// グラフをタップすると、いちばん近い点を選ぶ
$("chart").addEventListener("click", (e) => {
  const svg = $("gSvg");
  if (!svg || !gHit) return;
  const r = svg.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (gHit.W / r.width), my = (e.clientY - r.top) * (gHit.H / r.height);
  let best = null, bd = 1e9;
  gHit.pts.forEach((q) => { const dd = Math.hypot(q.x - mx, q.y - my); if (dd < bd) { bd = dd; best = q; } });
  if (best && bd <= 44 && best.id !== gSel) { gSel = best.id; renderGraph(); }
});
