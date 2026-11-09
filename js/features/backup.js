"use strict";
// ===== バックアップの書き出し・読み込み（写真も含めた1つのファイル） =====
function markBackup() {
  state.settings.lastBackup = todayStr();
  save();
  renderBackupInfo();
}
async function exportData() {
  const payload = { app: "aquaLog", version: 1, exportedAt: new Date().toISOString(), data: await portableData() };
  const json = JSON.stringify(payload);
  const filename = "aqua-lab-" + todayStr() + ".json";
  const file = new File([json], filename, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Aqua-lab のバックアップ" });
      markBackup();
      toast("書き出しました");
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    markBackup();
  } catch (e) { /* 次の表示で対応 */ }
  $("exportText").value = json;
  $("exportFallback").style.display = "block";
  toast("保存できない場合は、下の「内容をコピー」を使ってください");
}
async function copyExport() {
  const t = $("exportText");
  try { await navigator.clipboard.writeText(t.value); toast("コピーしました"); }
  catch (e) {
    t.focus(); t.select();
    try { document.execCommand("copy"); toast("コピーしました"); }
    catch (err) { toast("長押しで選択してコピーしてください"); }
  }
}
async function importFile(e) {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  let obj;
  try { obj = JSON.parse(await f.text()); } catch (err) { toast("ファイルを読み込めませんでした"); return; }
  const d = obj && obj.data;
  if (!d || !Array.isArray(d.tanks) || !Array.isArray(d.logs)) { toast("Aqua-lab のバックアップファイルではありません"); return; }
  askConfirm("現在のデータを、選んだファイルの内容に置き換えます。よろしいですか？", () => {
    state.tanks = d.tanks;
    state.fish = Array.isArray(d.fish) ? d.fish : [];
    state.logs = d.logs;
    state.equipment = Array.isArray(d.equipment) ? d.equipment : [];
    state.treatments = Array.isArray(d.treatments) ? d.treatments : [];
    if (d.settings) state.settings = Object.assign({ theme: "system" }, d.settings);
    normalize();
    if (save()) { applySettings(); afterChange(); toast("読み込みました"); }
  });
}
$("exportBtn").onclick = exportData;
$("copyExport").onclick = copyExport;
$("importFile").onchange = importFile;
