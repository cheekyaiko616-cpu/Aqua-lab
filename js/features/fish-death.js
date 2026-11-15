"use strict";
// ===== 生体の死亡の記録 =====
// 死亡した生体は記録として残す（fish.deceased に死亡日、fish.deathNote にメモ）。
// 以降、その生体を対象にした新しい記録は追加できない（記録画面・薬浴の対象に出ない／詳細の記録ボタンも消える）。
// 数が複数の生体（例：ネオンテトラ 5匹）は、亡くなった数だけを別の「死亡」の記録に分ける。
let fishDeadId = null;
overlayOnClose.fishDeadOverlay = () => { fishDeadId = null; };

function openFishDead(id) {
  const f = fishById(id);
  if (!f) return;
  fishDeadId = id;
  const dead = !!f.deceased;
  const n = Number(f.count) || 1;
  $("fdTitle").textContent = dead ? "死亡日・メモを直す" : "死亡を記録";
  $("fdHint").textContent = dead
    ? "「" + fishLabel(f) + "」の死亡日やメモを直せます。"
    : "「" + fishLabel(f) + "」を死亡として記録します。これまでの記録は残り、これから新しい記録は追加できなくなります。";
  $("fdCountBox").style.display = !dead && n > 1 ? "" : "none";
  $("fdCount").max = n;
  $("fdCount").value = n;
  $("fdDate").max = todayStr();
  $("fdDate").value = dead ? f.deceased : todayStr();
  $("fdNote").value = dead && f.deathNote ? f.deathNote : "";
  $("fdRevive").style.display = dead ? "" : "none";
  openOverlay("fishDeadOverlay");
}

function saveFishDead() {
  const f = fishById(fishDeadId);
  if (!f) return;
  const date = $("fdDate").value;
  if (!date) { toast("亡くなった日を入力してください"); return; }
  if (date > todayStr()) { toast("今日より先の日付は入れられません"); return; }
  if (f.acquired && date < f.acquired) { toast("迎えた日（" + fmtSlash(f.acquired) + "）より前の日付は入れられません"); return; }
  const note = $("fdNote").value.trim();
  if (f.deceased) {
    f.deceased = date;
    f.deathNote = note;
    toast("更新しました");
  } else {
    const total = Number(f.count) || 1;
    let n = total;
    if (total > 1) {
      const r = readNum("fdCount", 1, total, true);
      if (!r.ok || !r.value) { toast("亡くなった数は1〜" + total + "で入力してください"); return; }
      n = r.value;
    }
    if (n < total) {
      // 一部だけ亡くなった：亡くなった分を別の記録に分ける（過去の記録は、残った生体のほうに残る）
      state.fish.push(Object.assign({}, f, { id: uid(), count: n, deceased: date, deathNote: note, createdAt: todayStr() }));
      f.count = total - n;
      toast(n + "匹の死亡を記録しました");
    } else {
      f.deceased = date;
      f.deathNote = note;
      toast("死亡を記録しました");
    }
  }
  if (!save()) return;
  closeOverlay("fishDeadOverlay");
  afterChange();
}

function reviveFish() {
  const f = fishById(fishDeadId);
  if (!f) return;
  askConfirm("「" + fishLabel(f) + "」を生存に戻しますか？また新しい記録を追加できるようになります。", () => {
    delete f.deceased;
    delete f.deathNote;
    if (save()) { closeOverlay("fishDeadOverlay"); afterChange(); toast("生存に戻しました"); }
  });
}

$("fdCancel").onclick = () => closeOverlay("fishDeadOverlay");
$("fdSave").onclick = saveFishDead;
$("fdRevive").onclick = reviveFish;
