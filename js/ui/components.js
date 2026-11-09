"use strict";
// ===== 画面の部品（HTMLの文字列を作る小さな関数。複数の画面で同じ見た目にするための共通化） =====

/** PickRow ― 水槽を選ぶ1行（記録の選択・グラフの水槽選択で共通）
 *  { id, thumb, name, sub, style, selected, dataAttr, role } */
function pickRowHtml({ id, thumb, name, sub, style, selected, dataAttr, role }) {
  return '<div class="pick-row' + (selected ? ' selected' : '') + '" ' + dataAttr + '="' + id + '" style="' + style + '"' +
    ' role="' + role + '" aria-checked="' + (selected ? "true" : "false") + '" tabindex="0">' +
    '<div class="pick-avatar">' + thumb + '</div>' +
    '<div class="pick-name">' + escapeHtml(name) + (sub ? '<small>' + escapeHtml(sub) + '</small>' : '') + '</div>' +
    '<div class="radio" aria-hidden="true"></div></div>';
}
function tankPickRowHtml(t, selected, dataAttr, role) {
  return pickRowHtml({ id: t.id, thumb: tankThumb(t), name: t.name, sub: tankLabel(t), style: tankStyle(t), selected, dataAttr, role });
}

/** RowButton ― 一覧の各行の「編集」「削除」ボタン
 *  { kind: "secondary"|"danger", label, attr, value, ariaLabel } */
function rowButtonHtml({ kind, label, attr, value, ariaLabel }) {
  return '<button class="' + kind + ' row-btn" ' + attr + '="' + escapeHtml(value) + '"' +
    (ariaLabel ? ' aria-label="' + escapeHtml(ariaLabel) + '"' : '') + '>' + label + '</button>';
}

/** LogExtras ― 記録の中身（換水量・餌や薬・水質・状態タグ・メモ） */
function logExtrasHtml(l) {
  const parts = [];
  if (l.pct) parts.push("換水 " + fmtNum(l.pct) + "%");
  if (l.item || l.amount) parts.push([l.item, l.amount].filter(Boolean).join(" "));
  const w = waterText(l.water);
  const care = [];
  if (l.equipId) care.push("機器：" + equipNameById(l.equipId));
  if (l.treatmentId) care.push(treatLogText(l) + (l.progress ? " ・ " + l.progress : "") + (l.dosed ? " ・ 薬の追加・水換え" : ""));
  if (care.length) parts.push(care.join(" ・ "));
  return (parts.length ? '<br><span class="measure">' + escapeHtml(parts.join(" ・ ")) + '</span>' : '') +
    (w ? '<br><span class="measure">' + escapeHtml(w) + '</span>' : '') +
    (l.tags && l.tags.length ? '<br>' + tagChipsHtml(l.tags) : '') +
    (l.memo ? '<br><small>' + escapeHtml(l.memo) + '</small>' : '');
}

/** ActionIcon ― 記録の種類の小さな色付きアイコン */
function actionIconHtml(a) {
  const s = ACTION_STYLE[a] || ACTION_STYLE["その他"];
  return '<span class="ai" style="--c:' + s.c + ';">' + s.i + '</span>';
}

/** HistButtons ― 「内容ごとの記録」の一覧（最終日・件数つき。タップで履歴へ）
 *  actions: 出す内容の一覧 / logs: 新しい順の記録 / attr: タップ判定の属性名 */
function histButtonsHtml(actions, logs, attr) {
  const byAction = new Map();
  logs.forEach((l) => pushTo(byAction, l.action, l));
  return actions.map((a) => {
    const list = byAction.get(a) || [];
    const last = list[0];
    return '<button class="hist-btn" ' + attr + '="' + escapeHtml(a) + '">' +
      '<span style="display:flex;align-items:center;min-width:0;">' + actionIconHtml(a) + '<span><b>' + escapeHtml(a) + '</b><br>' +
      (last ? '<small>最終 ' + escapeHtml(fmtSlash(last.date)) + '</small>' : '<small style="color:var(--muted);">記録なし</small>') +
      '</span></span><span class="hint" style="margin:0;">' + (list.length ? list.length + '件 ›' : '›') + '</span></button>';
  }).join("");
}

/** Gallery ― 写真の一覧。photos: [{src, cap}] / attr: タップ判定の属性名 */
function galleryHtml(photos, attr) {
  return photos.length
    ? '<div class="gallery">' + photos.map((ph, i) =>
        '<button ' + attr + '="' + i + '" aria-label="' + escapeHtml(ph.cap) + 'の写真を拡大">' + photoImg(ph.src) + '</button>').join("") + '</div>'
    : '<div class="hint">まだ写真はありません。</div>';
}

/** WaterStats ― 水質の数値タイル。基準から外れている値は赤くする */
function waterStatsHtml(w, t) {
  const lim = (t && t.no3Limit) || DEFAULT_NO3_LIMIT;
  return '<div class="water-stats">' + WATER_KEYS.filter((k) => w[k.key] !== null && w[k.key] !== undefined).map((k) => {
    const v = w[k.key];
    let bad = false;
    if ((k.key === "nh3" || k.key === "no2") && v > 0) bad = true;
    if (k.key === "no3" && v >= lim) bad = true;
    if (k.key === "temp" && t && ((t.tempMin != null && v < t.tempMin) || (t.tempMax != null && v > t.tempMax))) bad = true;
    return '<div class="wstat' + (bad ? ' bad' : '') + '">' + k.label + '<b>' + fmtNum(v) + (k.unit ? '<small>' + k.unit + '</small>' : '') + '</b></div>';
  }).join("") + '</div>';
}
