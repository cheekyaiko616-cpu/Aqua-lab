"use strict";
// ===== 状態タグ（水槽用・生体用の2種類。設定の中に保存し、どの記録でも共通で使う） =====
const DEFAULT_TAGS = {
  tank: ["透明", "白濁り", "緑の苔", "茶苔", "油膜", "においがある", "水草が元気", "泡が消えない"],
  fish: ["元気", "よく食べる", "食欲なし", "じっとしている", "白点", "ヒレが傷んでいる", "痩せてきた", "抱卵", "稚魚が生まれた", "脱皮"]
};
const TAG_MAX_COUNT = 60;   // それぞれ登録できるタグの数
const TAG_SETTING_KEY = { tank: "tankTags", fish: "fishTags" };

function tagList(kind) {
  const k = TAG_SETTING_KEY[kind];
  if (!Array.isArray(state.settings[k])) state.settings[k] = DEFAULT_TAGS[kind].slice();
  return state.settings[k];
}
function tagChipsHtml(tags) {
  return (tags || []).map((t) => '<span class="tag-chip">' + escapeHtml(t) + '</span>').join("");
}
