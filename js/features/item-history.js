"use strict";
// ===== 餌・薬の履歴から選ぶ（水槽ごと）（記録画面の「履歴」ボタン） =====
// 入力欄はそのまま新しく入力できる。「履歴」を押すと、これまでに記録した餌（薬）を新しい順に出し、
// 選ぶと名前と、前回の量を入れる（量をすでに入力していれば、そのまま残す）。

// 選んでいる水槽の、内容（給餌／投薬）ごとに、使った名前・回数・最後の日付と量をまとめる（新しい順）。他の水槽の記録は含めない
function itemHistory(action, tankId) {
  const map = new Map();
  state.logs.slice().sort(byDateDesc).forEach((l) => {
    if (l.action !== action || l.tankId !== tankId || !l.item) return;
    const e = map.get(l.item);
    if (e) e.count++;
    else map.set(l.item, { item: l.item, count: 1, date: l.date, amount: l.amount || "" });   // 最初に出会う＝いちばん新しい記録
  });
  return [...map.values()].slice(0, 50);
}

function openItemHist() {
  const a = $("lAction").value;
  const word = a === "投薬" ? "薬" : "餌";
  const list = itemHistory(a, $("lTank").value);
  $("ihTitle").textContent = tankName($("lTank").value) + "の" + word + "の履歴";
  $("ihList").innerHTML = list.length
    ? list.map((e, i) => '<button type="button" class="sel-opt" data-i="' + i + '"><span>' + escapeHtml(e.item) + '</span>' +
        '<small>' + e.count + '回 ・ 最後 ' + fmtSlash(e.date) + (e.amount ? ' ・ ' + escapeHtml(e.amount) : '') + '</small></button>').join("")
    : '<div class="hint">この水槽には、まだ' + word + 'の記録がありません。入力欄に直接入力してください。</div>';
  $("ihList")._items = list;
  openOverlay("itemHistOverlay");
}

$("lItemHist").onclick = openItemHist;
$("ihList").onclick = (e) => {
  const b = e.target.closest("[data-i]");
  const e2 = b && $("ihList")._items[Number(b.dataset.i)];
  if (!e2) return;
  $("lItem").value = e2.item;
  if (!$("lAmount").value.trim() || (logAutoItem && $("lAmount").value === logAutoItem.amount)) $("lAmount").value = e2.amount;
  logAutoItem = null;   // 自分で選んだので、自動入力の扱いは終わり
  closeOverlay("itemHistOverlay");
};
$("ihCancel").onclick = () => closeOverlay("itemHistOverlay");
