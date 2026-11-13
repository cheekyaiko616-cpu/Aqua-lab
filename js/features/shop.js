"use strict";
// ===== 買い物（タブ「買い物」）：名前を入れて、AmazonまたはRakutenで探す =====
// ホーム画面に追加したアプリからは、ふつうのリンクだとアプリが開かず、ブラウザ（web版）が開いてしまう。
// そのため「探す」ボタンは、アプリ専用のアドレスでアプリを直接起動する。
//   Amazon：検索結果までそのまま開く
//   楽天：アプリの起動のみ（検索したい言葉は自動でコピーするので、アプリの検索欄に貼り付ける）
// 開かないとき用に、web版へのリンクも下に出す。名前の候補は、登録した機器・使った餌と薬から出す。
const AMAZON_APP = "com.amazon.mobile.shopping.web://www.amazon.co.jp/";
const RAKUTEN_APP_SCHEMES = ["rakuten-ichiba-app://", "rakutenichiba://", "rakuten-ichiba://"];

const shopUrls = (q) => ({
  amazon: q ? "https://www.amazon.co.jp/s?k=" + encodeURIComponent(q) : "https://www.amazon.co.jp/",
  rakuten: q ? "https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(q) + "/" : "https://www.rakuten.co.jp/"
});
function updateShopLinks() {
  const q = $("shopQ").value.trim();
  const u = shopUrls(q);
  $("shopAmazon").href = u.amazon;
  $("shopRakuten").href = u.rakuten;
  $("shopAmazonWeb").href = u.amazon;
  $("shopRakutenWeb").href = u.rakuten;
  $("shopAmazon").textContent = q ? "Amazonで「" + (q.length > 8 ? q.slice(0, 8) + "…" : q) + "」を探す" : "Amazonを開く";
  $("shopRakuten").textContent = q ? "楽天で「" + (q.length > 8 ? q.slice(0, 8) + "…" : q) + "」を探す" : "楽天を開く";
}
function shopChips(title, names) {
  if (!names.length) return "";
  return '<div class="setting-group"><h3>' + title + '</h3><div class="tag-wrap">' +
    names.map((n) => '<button type="button" class="tag-chip pick" data-shop="' + escapeHtml(n) + '">' + escapeHtml(n) + '</button>').join("") +
    '</div></div>';
}
const uniq = (a) => [...new Set(a.filter(Boolean))];
function renderShop() {
  const equip = uniq(state.equipment.filter((e) => !e.retired).map((e) => e.name || e.kind));
  const foods = pastItems("給餌").slice(0, 12);
  const drugs = uniq(pastItems("薬浴").concat(pastItems("投薬")).concat(state.treatments.map((t) => t.drug))).slice(0, 12);
  const html = shopChips("使っている機器", equip) + shopChips("使った餌", foods) + shopChips("使った薬", drugs);
  setHtml($("shopSuggest"), html || '<div class="hint">機器を登録したり、餌・薬を記録したりすると、ここに名前が並びます。</div>');
  updateShopLinks();
}

$("shopQ").addEventListener("input", updateShopLinks);
$("shopSuggest").onclick = (e) => {
  const b = e.target.closest("[data-shop]");
  if (!b) return;
  $("shopQ").value = b.dataset.shop;
  updateShopLinks();
  window.scrollTo(0, 0);
};

// アプリを起動する（アプリが開いて、この画面が隠れたら、そこで止める）
function launchApp(urls) {
  let i = 0;
  const next = () => {
    if (document.hidden || i >= urls.length) return;
    location.href = urls[i++];
    setTimeout(next, 500);
  };
  next();
}
$("shopAmazon").addEventListener("click", (e) => {
  e.preventDefault();
  const q = $("shopQ").value.trim();
  launchApp([AMAZON_APP + (q ? "s?k=" + encodeURIComponent(q) : "")]);
});
$("shopRakuten").addEventListener("click", (e) => {
  e.preventDefault();
  const q = $("shopQ").value.trim();
  if (q && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(q).then(() => toast("「" + q + "」をコピーしました。楽天アプリの検索欄に貼り付けてください"), () => {});
  }
  launchApp(RAKUTEN_APP_SCHEMES);
});
