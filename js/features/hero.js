"use strict";
// ===== 今日のお知らせ（カレンダーの上の囲み：水換えのおすすめ・水温の注意・薬浴中・機器の手入れ時期） =====
let heroOpen = false;
function renderHero() {
  if (state.tanks.length === 0) {
    setHtml($("heroBig"), "ようこそ " + svgIcon("fish"));
    $("heroSmall").textContent = "水槽を登録して、記録を始めましょう。";
    $("heroDetail").style.display = "none";
    $("hero").setAttribute("aria-expanded", "false");
    return;
  }
  const rows = [];
  let wcCount = 0, treatCount = 0, equipCount = 0, tempCount = 0;
  state.tanks.forEach((t) => {
    const s = wcStatus(t);
    if (s.recommend) {
      wcCount++;
      const why = s.due ? (s.diff < 0 ? "予定から" + (-s.diff) + "日超過" : "今日が予定日") : s.reasons[0];
      rows.push({ t, text: "水換え：" + why });
    }
    if (s.tempWarn) { tempCount++; rows.push({ t, text: s.tempWarn }); }
    treatOfTank(t.id, true).forEach((tr) => {
      treatCount++;
      const ts = treatStatus(tr);
      const note = ts.doseDue ? "（薬の追加・水換えの日）" : ts.over ? "（予定日数を過ぎています）" : "";
      rows.push({ t, text: "薬浴 " + ts.day + "日目 " + treatLabel(tr) + note });
    });
    equipOfTank(t.id).forEach((e) => {
      const es = equipStatus(e);
      if (!es.due) return;
      equipCount++;
      rows.push({ t, text: "機器：" + equipName(e) + "の手入れ（" + equipDueText(es) + "）" });
    });
  });
  const todayLogs = logsOnDate(todayStr()).length;
  setHtml($("heroBig"), wcCount > 0 ? svgIcon("bucket") + " 水換えのおすすめ：" + wcCount + "槽"
    : treatCount > 0 ? svgIcon("heal") + " 薬浴中：" + treatCount + "件"
    : equipCount > 0 ? svgIcon("wrench") + " 機器の手入れ時期：" + equipCount + "件"
    : tempCount > 0 ? svgIcon("thermo") + " 水温を確認してください" : "今日の水換えはありません");
  $("heroSmall").textContent = "今日の記録 " + todayLogs + "件" + (rows.length ? "（タップで一覧）" : "");
  setHtml($("heroDetail"), rows.map(({ t, text }) =>
    '<div class="item" style="padding:6px 0;" data-hero-tank="' + t.id + '"><span>' + escapeHtml(t.name) + '</span><small>' + escapeHtml(text) + '</small></div>').join(""));
  const open = heroOpen && rows.length > 0;
  $("heroDetail").style.display = open ? "block" : "none";
  $("hero").setAttribute("aria-expanded", rows.length ? String(open) : "false");
}

$("hero").onclick = (e) => {
  // 一覧の行をタップしたら、その水槽の詳細を開く
  const row = e.target.closest("[data-hero-tank]");
  if (row) { openTank(row.dataset.heroTank); return; }
  heroOpen = !heroOpen;
  renderHero();
};
