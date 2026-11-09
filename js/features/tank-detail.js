"use strict";
// ===== 水槽の詳細（水換え・水槽の状態・生体・写真・記録・メモ） =====
let tankDetailId = null;
let tankPhotos = [];
overlayOnClose.tankOverlay = () => { tankDetailId = null; };

// refresh=true：開いたまま中身だけ描き直す（重なり順を変えない）
function openTank(id, refresh) {
  const t = tankById(id);
  if (!t) { if (isOpen("tankOverlay")) closeOverlay("tankOverlay"); return; }
  tankDetailId = id;
  const s = wcStatus(t);
  const logs = logsOfTankNewestFirst(t.id);
  const fish = fishOfTank(t.id);
  const today = todayStr();

  // 見出し
  const facts = [];
  if (t.setupDate) facts.push("立ち上げ " + fmtSlash(t.setupDate) + "（" + (Math.max(0, daysBetween(t.setupDate, today)) + 1) + "日目）");
  if (t.tempMin != null || t.tempMax != null) facts.push("適温 " + fmtNum(t.tempMin) + "〜" + fmtNum(t.tempMax) + "℃");
  const head = '<div class="detail-head" style="' + tankStyle(t) + '"><div class="thumb">' + tankThumb(t) + '</div><div style="min-width:0;">' +
    '<h2 id="tankTitle">' + escapeHtml(t.name) + '</h2><span class="chip" style="' + tankStyle(t) + '">' + escapeHtml(tankLabel(t)) + '</span></div></div>' +
    (facts.length ? '<div class="facts">' + facts.map((f) => '<span>' + escapeHtml(f) + '</span>').join("") + '</div>' : '');

  // 水換え
  let wcNotice = "";
  if (s.recommend) {
    const why = (s.due ? [s.diff < 0 ? "予定から" + (-s.diff) + "日過ぎています" : "今日が予定日です"] : []).concat(s.reasons);
    wcNotice = '<div class="notice warn">' + svgIcon("bucket") + ' <b>水換えをおすすめします</b><br>' + why.map(escapeHtml).join("<br>") + '</div>';
  }
  const wcHtml = '<div class="section"><h3>水換え</h3>' + wcNotice +
    (s.interval
      ? '<div class="item"><span>' + s.interval + '日ごと' + (t.wcPercent ? '（1回 ' + t.wcPercent + '%）' : '') + '</span><small>次回 ' + fmtSlash(s.next) + '（' + wcDueText(s) + '）</small></div>'
      : '<div class="hint">水換え間隔は設定されていません（編集から設定できます）。</div>') +
    '<div class="item"><span>最後の水換え</span><small>' + (s.last ? fmtSlash(s.last) + '（' + daysBetween(s.last, today) + '日前）' : '未記録') + '</small></div>' +
    '<div class="btn-row"><button class="primary" id="wcNowBtn">今日水換えした</button></div></div>';

  // 水槽の状態（最新の水質・状態タグ）
  const tagLog = latestTankTags(t.id);
  const stateHtml = '<div class="section"><h3>水槽の状態</h3>' +
    (s.tempWarn ? '<div class="notice caution">' + svgIcon("thermo") + ' ' + escapeHtml(s.tempWarn) + '</div>' : '') +
    (s.test ? waterStatsHtml(s.test.water, t) + '<div class="hint">測定日 ' + fmtSlash(s.test.date) + '</div>' : '<div class="hint">まだ水質の記録はありません。</div>') +
    (tagLog ? '<div class="sub-tags">' + tagChipsHtml(tagLog.tags) + '<span class="hint" style="margin-left:4px;">' + fmtSlash(tagLog.date) + '</span></div>' : '') +
    '<div class="btn-row"><button class="secondary" id="testBtn">＋ 水質を記録</button><button class="secondary" id="tankStateBtn">＋ 様子を記録</button></div></div>';

  // 薬浴・機器
  const careHtml = treatSectionHtml(t) + equipSectionHtml(t);

  // 生体
  const fishHtml = '<div class="section"><h3>生体（' + fishCountOfTank(t.id) + '匹）</h3>' +
    '<div class="grid" id="fishList">' + fish.map((f) => {
      const tl = latestFishTags(f.id);
      return '<button class="card small" data-fish="' + f.id + '" style="' + fishStyle(f) + '">' +
        '<div class="thumb">' + fishThumb(f) + '</div><div class="info"><div class="name">' + escapeHtml(fishLabel(f)) + '</div>' +
        '<div class="sub">' + escapeHtml((f.name ? fishSpecies(f) + " ・ " : "") + (f.count || 1) + "匹" + (f.sex ? " ・ " + f.sex : "")) + '</div>' +
        (tl ? '<div>' + tagChipsHtml(tl.tags.slice(0, 3)) + '</div>' : '') + '</div></button>';
    }).join("") + '</div>' +
    (fish.length ? '' : '<div class="hint">まだ生体は登録されていません。</div>') +
    '<div class="btn-row"><button class="secondary" id="addFishBtn">＋ 生体を追加</button></div></div>';

  // 写真（水槽の写真と、記録の写真）
  tankPhotos = [];
  if (t.photo) tankPhotos.push({ src: t.photo, cap: "水槽の写真" });
  logs.forEach((l) => { if (l.photo) tankPhotos.push({ src: l.photo, cap: fmtSlash(l.date) + " ・ " + l.action + (l.fishId ? "（" + fishNameById(l.fishId) + "）" : "") }); });
  const photoHtml = '<div class="section"><h3>写真</h3>' + galleryHtml(tankPhotos, "data-tphoto") + '</div>';

  // 記録（内容ごと）
  const logHtml = '<div class="section"><h3>記録</h3>' +
    '<div style="margin-bottom:8px;"><button class="secondary" id="tankLogBtn">＋ 記録する</button></div>' +
    histButtonsHtml(ACTIONS, logs, "data-thist") + '</div>';

  const memoHtml = t.memo ? '<div class="section"><h3>メモ</h3><div class="memo-text">' + escapeHtml(t.memo) + '</div></div>' : '';

  $("tankBody").innerHTML = head + wcHtml + stateHtml + careHtml + fishHtml + photoHtml + logHtml + memoHtml;
  if (!refresh) openOverlay("tankOverlay");
}

// 詳細の中のボタンは、全体でまとめて受ける
$("tankBody").onclick = (e) => {
  const t = tankById(tankDetailId);
  if (!t) return;
  const el = e.target;
  if (el.closest("#wcNowBtn")) {
    state.logs.push({ id: uid(), date: todayStr(), tankId: t.id, fishId: null, action: "水換え", pct: t.wcPercent || null, memo: "", photo: null, tags: [] });
    if (save()) { afterChange(); toast("水換えを記録しました"); }
    return;
  }
  if (el.closest("#testBtn")) { openLog({ date: todayStr(), tankId: t.id, action: "水質測定" }); return; }
  if (el.closest("#tankStateBtn")) { openLog({ date: todayStr(), tankId: t.id, action: "様子メモ", openTags: true }); return; }
  if (el.closest("#tankLogBtn")) { openPicker(todayStr(), t.id); return; }
  if (handleTreatClick(el, t.id) || handleEquipClick(el, t)) return;
  if (el.closest("#addFishBtn")) { openFishEdit(null, t.id); return; }
  const fb = el.closest("[data-fish]");
  if (fb) { openFish(fb.dataset.fish); return; }
  const hist = el.closest("[data-thist]");
  if (hist) { openHistory({ tankId: t.id, action: hist.dataset.thist }); return; }
  const ph = el.closest("[data-tphoto]");
  if (ph) {
    const p = tankPhotos[Number(ph.dataset.tphoto)];
    if (p) getPhotoSrc(p.src).then((src) => { if (src) openPhoto({ src, cap: p.cap }); });
  }
};
$("tankClose").onclick = () => closeOverlay("tankOverlay");
$("tankEditBtn").onclick = () => { const t = tankById(tankDetailId); if (t) openTankEdit(t); };
$("tankDelete").onclick = () => {
  const t = tankById(tankDetailId);
  if (!t) return;
  askConfirm("「" + t.name + "」を削除しますか？生体・機器・薬浴・記録も一緒に消えます。", () => {
    state.tanks = state.tanks.filter((x) => x.id !== t.id);
    state.fish = state.fish.filter((x) => x.tankId !== t.id);
    state.logs = state.logs.filter((x) => x.tankId !== t.id);
    state.equipment = state.equipment.filter((x) => x.tankId !== t.id);
    state.treatments = state.treatments.filter((x) => x.tankId !== t.id);
    if (save()) { closeOverlay("tankOverlay"); afterChange(); toast("削除しました"); }
  });
};
