"use strict";
// ===== 生体の詳細（今の状態・写真・記録・メモ） =====
let fishDetailId = null;
let fishPhotos = [];
overlayOnClose.fishOverlay = () => { fishDetailId = null; };

// refresh=true：開いたまま中身だけ描き直す（重なり順を変えない）
function openFish(id, refresh) {
  const f = fishById(id);
  if (!f) { if (isOpen("fishOverlay")) closeOverlay("fishOverlay"); return; }
  fishDetailId = id;
  const logs = logsOfFishNewestFirst(f.id);
  const today = todayStr();
  const facts = ["水槽：" + tankName(f.tankId), (f.count || 1) + "匹"];
  if (f.sex) facts.push(f.sex);
  if (f.acquired) facts.push("迎えた日 " + fmtSlash(f.acquired) + "（" + (Math.max(0, daysBetween(f.acquired, today)) + 1) + "日目）");

  const head = '<div class="detail-head" style="' + fishStyle(f) + '"><div class="thumb">' + fishThumb(f) + '</div><div style="min-width:0;">' +
    '<h2 id="fishTitle">' + escapeHtml(fishLabel(f)) + '</h2><span class="chip" style="' + fishStyle(f) + '">' + FISH_CATS[fishCatOf(f)].icon + ' ' + escapeHtml(fishSpecies(f)) + '</span></div></div>' +
    '<div class="facts">' + facts.map((x) => '<span>' + escapeHtml(x) + '</span>').join("") + '</div>';

  // 今の状態（いちばん新しい状態タグ）
  const tl = latestFishTags(f.id);
  const stateHtml = '<div class="section"><h3>今の状態</h3>' +
    (tl ? '<div>' + tagChipsHtml(tl.tags) + '</div><div class="hint">' + fmtSlash(tl.date) + 'の記録' + (tl.memo ? '：' + escapeHtml(tl.memo) : '') + '</div>'
        : '<div class="hint">まだ状態の記録はありません。</div>') +
    '<div class="btn-row"><button class="secondary" id="fishStateBtn">＋ 状態を記録</button></div></div>';

  const treatHtml = fishTreatHtml(f);

  fishPhotos = [];
  if (f.photo) fishPhotos.push({ src: f.photo, cap: "登録時の写真" });
  logs.forEach((l) => { if (l.photo) fishPhotos.push({ src: l.photo, cap: fmtSlash(l.date) + " ・ " + l.action }); });
  const photoHtml = '<div class="section"><h3>写真</h3>' + galleryHtml(fishPhotos, "data-fphoto") + '</div>';

  const logHtml = '<div class="section"><h3>記録</h3>' +
    '<div style="margin-bottom:8px;"><button class="secondary" id="fishLogBtn">＋ 記録する</button></div>' +
    histButtonsHtml(FISH_ACTIONS, logs, "data-fhist") + '</div>';
  const memoHtml = f.memo ? '<div class="section"><h3>メモ</h3><div class="memo-text">' + escapeHtml(f.memo) + '</div></div>' : '';

  $("fishBody").innerHTML = head + treatHtml + stateHtml + photoHtml + logHtml + memoHtml;
  if (!refresh) openOverlay("fishOverlay");
}

$("fishBody").onclick = (e) => {
  const f = fishById(fishDetailId);
  if (!f) return;
  const el = e.target;
  if (el.closest("#fishStateBtn")) { openLog({ date: todayStr(), tankId: f.tankId, fishId: f.id, action: "様子メモ", openTags: true }); return; }
  if (el.closest("#fishLogBtn")) { openLog({ date: todayStr(), tankId: f.tankId, fishId: f.id, action: "給餌" }); return; }
  if (handleTreatClick(el, f.tankId)) return;
  const hist = el.closest("[data-fhist]");
  if (hist) { openHistory({ tankId: f.tankId, fishId: f.id, action: hist.dataset.fhist }); return; }
  const ph = el.closest("[data-fphoto]");
  if (ph) {
    const p = fishPhotos[Number(ph.dataset.fphoto)];
    if (p) getPhotoSrc(p.src).then((src) => { if (src) openPhoto({ src, cap: p.cap }); });
  }
};
$("fishClose").onclick = () => closeOverlay("fishOverlay");
$("fishEditBtn").onclick = () => { const f = fishById(fishDetailId); if (f) openFishEdit(f); };
$("fishDelete").onclick = () => {
  const f = fishById(fishDetailId);
  if (!f) return;
  askConfirm("「" + fishLabel(f) + "」を削除しますか？この生体の記録も一緒に消えます。", () => {
    state.fish = state.fish.filter((x) => x.id !== f.id);
    state.logs = state.logs.filter((x) => x.fishId !== f.id);
    state.treatments.forEach((tr) => { if (tr.fishIds) tr.fishIds = tr.fishIds.filter((id) => id !== f.id); });
    if (save()) { closeOverlay("fishOverlay"); afterChange(); toast("削除しました"); }
  });
};
