"use strict";
// ===== 定数（保存名・記録の種類・水質の項目・写真サイズなど） =====
const LS_KEY = "aquaLog.v1";        // IndexedDBが使えない場合の予備の保存名
const DB_NAME = "aquaLog";
const DB_STORE = "kv";
const DB_PHOTOS = "photos";          // 写真だけを別に保存する場所（記録の読み書きを軽くするため）
const DB_VERSION = 1;
const DATA_KEYS = ["tanks", "fish", "logs", "equipment", "treatments", "settings"];

const OTHER = "その他";
const OTHER_VAR = "__other";
const WD = ["日", "月", "火", "水", "木", "金", "土"];

// 記録の種類
const ACTIONS = ["水換え", "給餌", "投薬", "薬浴", "水質測定", "フィルター掃除", "機器の手入れ", "掃除", "様子メモ", "その他"];
// 生体ごとに記録できる内容（それ以外は水槽全体の記録）
const FISH_ACTIONS = ["給餌", "投薬", "様子メモ", "その他"];
// 複数の水槽をまとめて記録するときは出さない内容（細かい入力が必要なもの）
const MULTI_HIDDEN = ["投薬", "薬浴", "機器の手入れ", "水質測定", "様子メモ", "その他"];

// 水質の項目（記録・表示・グラフで共通）
const WATER_KEYS = [
  { key: "temp", label: "水温", unit: "℃", max: 45 },
  { key: "ph", label: "pH", unit: "", max: 14 },
  { key: "nh3", label: "アンモニア", unit: "mg/L", max: 99 },
  { key: "no2", label: "亜硝酸", unit: "mg/L", max: 99 },
  { key: "no3", label: "硝酸塩", unit: "mg/L", max: 999 },
  { key: "kh", label: "KH", unit: "°dH", max: 99 }
];

const DEFAULT_NO3_LIMIT = 40;        // 硝酸塩の上限の目安（水槽ごとに変更可）

const PHOTO_MAX = 480;               // 写真の最大辺(px)
const PHOTO_Q = 0.7;
const PHOTO_CACHE_MAX = 200;         // 読み込み済みの写真をメモリに覚えておく最大枚数
