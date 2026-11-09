"use strict";
// ===== 状態タグの管理（設定から開く。水槽用・生体用を切り替えて、追加・削除・長押しで並べ替え） =====
let tagKind = "tank";

function renderTagCount() {
  $("tagCount").textContent = "水槽 " + tagList("tank").length + "件・生体 " + tagList("fish").length + "件";
}
function renderTagManager() {
  document.querySelectorAll("#tagKind button").forEach((b) => { const on = b.dataset.kind === tagKind; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  $("tagList").innerHTML = tagList(tagKind).map((t) =>
    '<div class="item tag-row" data-tag="' + escapeHtml(t) + '"><span>' + escapeHtml(t) + '</span>' +
    rowButtonHtml({ kind: "danger", label: "削除", attr: "data-del-tag", value: t, ariaLabel: "タグ「" + t + "」を削除" }) + '</div>').join("");
  renderTagCount();
}
function openTagManager() {
  $("tagNew").value = "";
  renderTagManager();
  openOverlay("tagOverlay");
}
function addTagFromInput() {
  const name = $("tagNew").value.trim();
  if (!name) return;
  const all = tagList(tagKind);
  if (all.includes(name)) { toast("すでにあります"); return; }
  if (all.length >= TAG_MAX_COUNT) { toast("タグが多すぎます。整理してください"); return; }
  all.push(name);
  if (!save()) { all.pop(); return; }
  $("tagNew").value = "";
  renderTagManager();
}

$("tagManageBtn").onclick = openTagManager;
$("tagKind").onclick = (e) => { const b = e.target.closest("[data-kind]"); if (b) { tagKind = b.dataset.kind; renderTagManager(); } };
$("tagAdd").onclick = addTagFromInput;
$("tagNew").addEventListener("keydown", (e) => { if (e.key === "Enter") addTagFromInput(); });
$("tagClose").onclick = () => closeOverlay("tagOverlay");
$("tagList").onclick = (e) => {
  const b = e.target.closest("[data-del-tag]");
  if (!b) return;
  const name = b.dataset.delTag;
  askConfirm("「" + name + "」を削除しますか？記録に付けたタグは残ります。", () => {
    const all = tagList(tagKind);
    const i = all.indexOf(name);
    if (i >= 0) all.splice(i, 1);
    if (save()) renderTagManager();
  });
};

// 長押しして上下にドラッグすると順番を入れ替えられる
(function () {
  const box = $("tagList");
  let row = null, timer = null, active = false, startY = 0, baseTop = 0, pid = null;
  function end(commit) {
    clearTimeout(timer);
    if (row && active) {
      row.classList.remove("dragging");
      row.style.transform = "";
      box.classList.remove("sorting");
      if (commit) {
        const order = Array.from(box.querySelectorAll(".tag-row")).map((r) => r.dataset.tag);
        const all = tagList(tagKind);
        const before = all.slice();
        if (order.length === all.length && order.join("\n") !== before.join("\n")) {
          all.splice(0, all.length, ...order);
          if (!save()) all.splice(0, all.length, ...before);
        }
      }
      renderTagManager();
    }
    row = null; active = false; pid = null;
  }
  box.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || !e.isPrimary) return;
    const r = e.target.closest(".tag-row");
    if (!r) return;
    row = r; startY = e.clientY; pid = e.pointerId; active = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!row) return;
      active = true;
      baseTop = row.offsetTop;
      row.classList.add("dragging");
      box.classList.add("sorting");
      try { row.setPointerCapture(pid); } catch (_) {}
      if (navigator.vibrate) navigator.vibrate(12);
    }, 380);
  });
  box.addEventListener("pointermove", (e) => {
    if (!row || e.pointerId !== pid) return;
    if (!active) { if (Math.abs(e.clientY - startY) > 8) { clearTimeout(timer); row = null; } return; }
    e.preventDefault();
    const prev = row.previousElementSibling, next = row.nextElementSibling;
    const rc = row.getBoundingClientRect(), mid = rc.top + rc.height / 2;
    if (prev) { const pr = prev.getBoundingClientRect(); if (mid < pr.top + pr.height / 2) box.insertBefore(row, prev); }
    if (next) { const nr = next.getBoundingClientRect(); if (mid > nr.top + nr.height / 2) box.insertBefore(next, row); }
    row.style.transform = "translateY(" + (e.clientY - startY - (row.offsetTop - baseTop)) + "px)";
    const sc = box.closest(".sheet");
    if (sc) { const sr = sc.getBoundingClientRect(); if (e.clientY < sr.top + 50) sc.scrollTop -= 8; else if (e.clientY > sr.bottom - 50) sc.scrollTop += 8; }
  });
  box.addEventListener("pointerup", () => end(true));
  box.addEventListener("pointercancel", () => end(false));
  box.addEventListener("contextmenu", (e) => { if (e.target.closest(".tag-row")) e.preventDefault(); });
  box.addEventListener("touchmove", (e) => { if (active) e.preventDefault(); }, { passive: false });
})();
