"use strict";
// ===== アプリ全体のデータ（水槽・生体・記録・設定） =====
// tanks : { id, name, type, volume, setupDate, wcInterval, wcPercent, no3Limit, tempMin, tempMax, photo, memo, createdAt }
// fish  : { id, tankId, name, category, type, count, sex, acquired, photo, memo, createdAt }
// logs  : { id, date, tankId, fishId(null=水槽全体), action, memo, photo, tags,
//           pct(水換えの量%), item/amount(餌・薬の名前と量), water{temp,ph,nh3,no2,no3,kh},
//           equipId(機器の手入れ), treatmentId/progress/dosed(薬浴の経過) }
// equipment : { id, tankId, kind, name, since, interval(手入れ・交換の間隔・日), memo, retired, createdAt }
//             ※最後に手入れした日は、記録（action:"機器の手入れ", equipId）から求める
// treatments: { id, tankId, fishIds(空=水槽全体), reason(症状・目的), drug, dose, startDate, days(予定日数),
//               every(薬の追加・水換えの間隔・日), memo, status("active"|"done"), endDate, result, createdAt }
//             ※経過は記録（action:"薬浴", treatmentId, progress, dosed）で残す
let state = { tanks: [], fish: [], logs: [], equipment: [], treatments: [], settings: { theme: "system" } };

// カレンダーで表示中の年月
let viewYear, viewMonth;
