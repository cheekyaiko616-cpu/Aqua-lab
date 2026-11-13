"use strict";
// ===== カタログ（水槽の種類・生体の分類→種類・記録の種類の見た目） =====

// 水槽の種類（water＝入れられる生体の水：fresh=淡水 / salt=海水 / brackish=汽水 / any=すべて）
const TANK_TYPES = {
  "淡水":     { icon: svgIcon("tank"), color: "#d6ecf7", water: "fresh" },
  "水草水槽": { icon: svgIcon("tank"), color: "#d7f0dc", water: "fresh" },
  "海水":     { icon: svgIcon("tank"), color: "#d3e3fb", water: "salt" },
  "汽水":     { icon: svgIcon("tank"), color: "#dcefee", water: "brackish" },
  "その他":   { icon: svgIcon("tank"), color: "#e6e9ef", water: "any" }
};
const TANK_TYPE_NAMES = Object.keys(TANK_TYPES);
// 以前の名前で保存されたデータの読み替え
const TANK_TYPE_LEGACY = { "淡水（熱帯魚）": "淡水", "淡水（メダカ・金魚）": "淡水", "ビオトープ・屋外": "淡水" };

// 生体の分類（分類→種類）。water は入れられる水槽の水
const FISH_CATS = {
  // ---- 淡水 ----
  "カラシン": { water: "fresh", icon: svgIcon("fish-slim"), color: "#d6ecf7", items: [
    "ネオンテトラ", "カージナルテトラ", "グリーンネオンテトラ", "ラミーノーズテトラ", "ブラックネオンテトラ",
    "レモンテトラ", "ペンギンテトラ", "グローライトテトラ", "ブラックファントムテトラ", "エンバーテトラ",
    "ピラニア・ナッテリー", "パクー", "メチニス", "ブリコン", "タライロン"
  ]},
  "コイ科・ラスボラ": { water: "fresh", icon: svgIcon("fish-slim"), color: "#dcefee", items: [
    "ラスボラ・ヘテロモルファ", "ラスボラ・エスペイ", "ミクロラスボラ・ハナビ", "アカヒレ", "ゼブラダニオ",
    "チェリーバルブ", "スマトラ", "ボララス・ブリジッタエ"
  ]},
  "卵胎生メダカ": { water: "fresh", icon: svgIcon("fish"), color: "#fde9c9", items: [
    "グッピー", "エンドラーズ", "プラティ", "モーリー", "ソードテール"
  ]},
  "メダカ": { water: "fresh", icon: svgIcon("fish-slim"), color: "#fff3c4", items: [
    "黒メダカ", "白メダカ", "楊貴妃メダカ", "幹之メダカ", "オロチ", "三色メダカ", "ヒメダカ"
  ]},
  "金魚": { water: "fresh", icon: svgIcon("goldfish"), color: "#ffe1cc", items: [
    "和金", "コメット", "琉金", "オランダ獅子頭", "らんちゅう", "出目金", "ピンポンパール", "東錦"
  ]},
  "ベタ・グラミー": { water: "fresh", icon: svgIcon("betta"), color: "#f8dcef", items: [
    "ベタ", "ドワーフグラミー", "ハニーグラミー", "パールグラミー", "チョコレートグラミー", "ゴールデングラミー"
  ]},
  "シクリッド": { water: "fresh", icon: svgIcon("angel"), color: "#e6dcff", items: [
    "エンゼルフィッシュ", "ディスカス", "ラミレジィ", "アピストグラマ", "オスカー", "ペルヴィカクロミス"
  ]},
  "ナマズ・プレコ・ドジョウ": { water: "fresh", icon: svgIcon("catfish"), color: "#efe3d3", items: [
    "コリドラス", "オトシンクルス", "ブッシープレコ", "セルフィンプレコ", "クーリーローチ", "シマドジョウ", "サイアミーズフライングフォックス"
  ]},
  "古代魚": { water: "fresh", icon: svgIcon("fish"), color: "#e3dcc6", items: [
    "シルバーアロワナ", "アジアアロワナ", "ポリプテルス", "スネークヘッド"
  ]},
  // ---- 汽水 ----
  "汽水魚": { water: "brackish", icon: svgIcon("fish"), color: "#dcefee", items: [
    "ミドリフグ", "アーチャーフィッシュ", "モーリー", "スカット", "ベンケイハゼ"
  ]},
  // ---- 海水 ----
  "クマノミ": { water: "salt", icon: svgIcon("clownfish"), color: "#ffe0cc", items: [
    "カクレクマノミ", "ハマクマノミ", "ハナビラクマノミ", "トマトクラウン", "セジロクマノミ"
  ]},
  "スズメダイ": { water: "salt", icon: svgIcon("fish"), color: "#d3e3fb", items: [
    "デバスズメダイ", "ルリスズメダイ", "アオバスズメダイ", "ミスジリュウキュウスズメダイ", "ネッタイスズメダイ", "クロスズメダイ"
  ]},
  "ハギ・ニザダイ": { water: "salt", icon: svgIcon("angel"), color: "#cfe6fb", items: [
    "ナンヨウハギ", "キイロハギ", "ヒレナガハギ", "クロハギ", "ゴマハギ", "ヒフキアイゴ"
  ]},
  "ヤッコ": { water: "salt", icon: svgIcon("angel"), color: "#fbe3c3", items: [
    "ニシキヤッコ", "ナメラヤッコ", "ルリヤッコ", "アカハラヤッコ", "レモンピールエンゼル", "ゴールデンエンゼル"
  ]},
  "チョウチョウウオ": { water: "salt", icon: svgIcon("angel"), color: "#fff0b8", items: [
    "チョウチョウウオ", "フウライチョウチョウウオ", "トゲチョウチョウウオ", "ミカドチョウチョウウオ", "ハタタテダイ"
  ]},
  "ハゼ・ギンポ": { water: "salt", icon: svgIcon("fish-slim"), color: "#d9ecd4", items: [
    "ハタタテハゼ", "ヤシャハゼ", "ネジリンボウ", "ホタテツノハゼ", "ミジンベニハゼ", "ネオンハゼ", "カエルウオ"
  ]},
  "ベラ": { water: "salt", icon: svgIcon("fish-slim"), color: "#d4efe6", items: [
    "ホンソメワケベラ", "ニシキベラ", "ヤマブキベラ", "カンムリベラ", "キュウセン"
  ]},
  "ハナダイ・ゴンベ": { water: "salt", icon: svgIcon("fish"), color: "#fbd9de", items: [
    "ケラマハナダイ", "ハナゴンベ", "ベニゴンベ", "ホシゴンベ"
  ]},
  "テンジクダイ": { water: "salt", icon: svgIcon("fish"), color: "#e4dcf7", items: [
    "バンガイカーディナルフィッシュ", "スジオテンジクダイ", "ネンブツダイ"
  ]},
  "フグ・ハコフグ・カワハギ": { water: "salt", icon: svgIcon("fish"), color: "#fff1c9", items: [
    "ミナミハコフグ", "ハコフグ", "ハリセンボン", "ヒトヅラハリセンボン", "サザナミフグ", "アミメハギ", "ソウシハギ"
  ]},
  "ミノカサゴ・カサゴ": { water: "salt", icon: svgIcon("fish"), color: "#f6d6cf", items: [
    "ミノカサゴ", "ハナミノカサゴ", "ヒレナガカサゴ", "カサゴ", "ハオコゼ"
  ]},
  "ウツボ・タツノオトシゴ": { water: "salt", icon: svgIcon("catfish"), color: "#dfe6d1", items: [
    "タツノオトシゴ", "ハナタツ", "ヨウジウオ", "ハナヒゲウツボ", "ニセゴイシウツボ"
  ]},
  "日本近海・磯の魚": { water: "salt", icon: svgIcon("fish"), color: "#d6e9f2", items: [
    "イソギンポ", "ダンゴウオ", "ムラソイ", "メジナ", "イシダイ", "アイゴ"
  ]},
  "エビ・カニ・ヤドカリ": { water: "salt", icon: svgIcon("shrimp"), color: "#ffd9d4", items: [
    "スカンクシュリンプ", "ペパーミントシュリンプ", "ブルーレッグハーミット", "ソメンヤドカリ", "ホンヤドカリ"
  ]},
  "貝・ウニ・ヒトデ": { water: "salt", icon: svgIcon("snail"), color: "#ece4d6", items: [
    "シッタカガイ", "タカラガイ", "ハナビラウニ", "タコノマクラ", "ベニヒトデ", "ナマコ"
  ]},
  "サンゴ・イソギンチャク": { water: "salt", icon: svgIcon("bubbles"), color: "#f9d3e6", items: [
    "ミドリイシ", "ハナサンゴ", "ディスクコーラル", "ウミキノコ", "ウミアザミ",
    "サンゴイソギンチャク", "センジュイソギンチャク", "タマイタダキイソギンチャク"
  ]},
  "その他": { water: "any", icon: svgIcon("bubbles"), color: "#e6e9ef", items: [] }
};
// 以前の名前で保存されたデータの読み替え
const FISH_CAT_LEGACY = { "小型カラシン": "カラシン" };
const FISH_CAT_NAMES = Object.keys(FISH_CATS);
// 水槽の種類に合う分類だけを返す（淡水の水槽には淡水の生体、海水の水槽には海水の生体）
function fishCatNamesFor(tankType) {
  const w = (TANK_TYPES[tankType] || TANK_TYPES["その他"]).water;
  return FISH_CAT_NAMES.filter((n) => w === "any" || FISH_CATS[n].water === "any" || FISH_CATS[n].water === w);
}

// 記録の種類ごとの絵と色（c=ボタンの色、dot=カレンダーの点の色）
const ACTION_STYLE = {
  "水換え":         { i: svgIcon("bucket"), c: "#cfe8ff", dot: "#3b8fd1" },
  "給餌":           { i: svgIcon("food"), c: "#ffe7c2", dot: "#e39a2d" },
  "投薬":           { i: svgIcon("pill"), c: "#ffd9e4", dot: "#d1557a" },
  "水質測定":       { i: svgIcon("flask"), c: "#e6dcff", dot: "#7d62c9" },
  "フィルター掃除": { i: svgIcon("filter"), c: "#d6f5ea", dot: "#2f9f7d" },
  "機器の手入れ":   { i: svgIcon("wrench"), c: "#dfe6f2", dot: "#5b78a8" },
  "薬浴":           { i: svgIcon("heal"), c: "#ffd6d6", dot: "#d9534f" },
  "塩浴":           { i: svgIcon("bubbles"), c: "#d5f1ee", dot: "#2a9d8f" },
  "掃除":           { i: svgIcon("brush"), c: "#e1f0d7", dot: "#6a9e3f" },
  "様子メモ":       { i: svgIcon("note"), c: "#fdf0c7", dot: "#c9a227" },
  "その他":         { i: svgIcon("sparkle"), c: "#e6e9ef", dot: "#8a96a3" }
};

// ---- 機器（種類ごとの、手入れ・交換の間隔の目安：日） ----
const EQUIP_KINDS = {
  "ヒーター":                 { interval: 365, hint: "交換の目安は1年ほど" },
  "サーモスタット":           { interval: 365, hint: "交換の目安は1年ほど" },
  "外部フィルター":           { interval: 30,  hint: "ろ過槽の掃除は月1回ほど" },
  "上部フィルター":           { interval: 30,  hint: "マットの交換・掃除は月1回ほど" },
  "スポンジ・投げ込み式フィルター": { interval: 14, hint: "スポンジのもみ洗いは2週間ほど" },
  "ろ材":                     { interval: 90,  hint: "一部の交換・洗浄は3か月ほど" },
  "ライト":                   { interval: 365, hint: "交換の目安は1年ほど" },
  "エアポンプ":               { interval: 180, hint: "ダイヤフラムの点検は半年ほど" },
  "水流ポンプ":               { interval: 60,  hint: "羽根の掃除は2か月ほど" },
  "CO2機器":                  { interval: 90,  hint: "点検は3か月ほど" },
  "殺菌灯（UV）":             { interval: 180, hint: "ランプ交換は半年ほど" },
  "クーラー・ファン":         { interval: 90,  hint: "ほこりの掃除は3か月ほど" },
  "その他":                   { interval: null, hint: "" }
};
const EQUIP_KIND_NAMES = Object.keys(EQUIP_KINDS);

// ---- 薬浴 ----
// 塩浴：塩の濃度の目安と、目的の候補（塩浴は 0.5%＝水1Lに塩5g が基本。水換えのときは、入れ替えた水の量に合わせて塩を足す）
const SALT_CONCS = ["0.5%（水1Lに塩5g）", "0.3%（水1Lに塩3g）", "0.7%（水1Lに塩7g）"];
const SALT_REASONS = ["体力回復", "病気の予防", "新しい魚の導入後", "輸送後の回復", "白点病の初期", "尾ぐされ・ヒレぐされの初期", "ストレスの軽減"];
const TREAT_REASONS = ["白点病", "尾ぐされ・ヒレぐされ", "水カビ病", "エラ病", "松かさ病", "穴あき病", "寄生虫", "体表の傷", "新しい魚のトリートメント", "塩浴（体力回復）", "予防"];
const TREAT_DRUGS = ["グリーンFゴールド", "グリーンFリキッド", "メチレンブルー", "エルバージュエース", "ニューグリーンF", "観パラD", "ネオパラD", "塩（0.5%）"];
const TREAT_PROGRESS = ["良くなった", "変わらない", "悪くなった"];
const TREAT_RESULTS = ["回復した", "様子を見る", "改善しなかった", "中止した"];
