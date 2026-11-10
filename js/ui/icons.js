"use strict";
// ===== 絵のアイコン（SVGの図柄をまとめて画面に入れる。使うときは svgIcon("fish") など） =====
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    // 下のタブ
    calendar: '<rect x="6" y="9" width="36" height="33" rx="6" ' + S + ' stroke-width="3"/><path d="M6 19h36M16 5v8M32 5v8" ' + S + ' stroke-width="3"/><circle cx="16" cy="28" r="2.5"/><circle cx="24" cy="28" r="2.5"/><circle cx="32" cy="28" r="2.5"/><circle cx="16" cy="35" r="2.5"/><circle cx="24" cy="35" r="2.5"/>',
    tank: '<rect x="5" y="8" width="38" height="29" rx="3" ' + S + ' stroke-width="3"/><path d="M5 15.5c4-3 8 3 12 0s8 3 12 0 8 3 14 0" ' + S + ' stroke-width="2.2"/><path d="M14 28c3-3.5 7-4 10-2.5l3-2-.8 4 .8 4-3-2c-3 1.5-7 1-10-1.5z"/><path d="M35 34v-9M35 29c-3-1-4-3-4-5M35 27c3-1 4-3 4-6" ' + S + ' stroke-width="2"/><path d="M10 37v4M38 37v4M7 41.5h34" ' + S + ' stroke-width="3"/>',
    chart: '<path d="M8 6v34h34" ' + S + ' stroke-width="3"/><path d="M14 31l8-9 7 6 11-14" ' + S + ' stroke-width="3"/><circle cx="22" cy="22" r="2.6"/><circle cx="29" cy="28" r="2.6"/><circle cx="40" cy="14" r="2.6"/>',
    gear: '<path d="M24 4l3.5 5.2 6-1.8 1.4 6.1 6.1 1.4-1.8 6L44 24l-4.8 3.5 1.8 6-6.1 1.4-1.4 6.1-6-1.8L24 44l-3.5-4.8-6 1.8-1.4-6.1-6.1-1.4 1.8-6L4 24l4.8-3.5-1.8-6 6.1-1.4 1.4-6.1 6 1.8z" ' + S + ' stroke-width="3"/><circle cx="24" cy="24" r="6" ' + S + ' stroke-width="3"/>',
    // 生体
    fish: '<path fill-rule="evenodd" d="M4 24C9 15.5 18 12 26 13c4 .6 7 2.4 9 5l8.5-6-2.5 12 2.5 12-8.5-6c-2 2.6-5 4.4-9 5-8 1-17-2.5-22-11zM13 20.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z"/>',
    "fish-slim": '<path fill-rule="evenodd" d="M3 24c6-6 14-8.5 22-8 4 .3 7 1.6 9.6 3.6l9.4-5-2.6 9.4 2.6 9.4-9.4-5c-2.6 2-5.6 3.3-9.6 3.6-8 .5-16-2-22-8zM11 21.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
    goldfish: '<path fill-rule="evenodd" d="M4 25c0-8 6.5-13.5 14.5-13.5 6 0 10.5 3 12.5 7.5 3.5-5.5 8.5-8.5 13.5-8.5-2 5-3.5 9.5-3.5 14.5s1.5 9.5 3.5 14.5c-5 0-10-3-13.5-8.5-2 4.5-6.5 7.5-12.5 7.5C10.5 38.5 4 33 4 25zM12 21a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z"/><path d="M15 12c1.5-4 6-6 10-5-2 1.5-3 3.5-3 6z"/>',
    betta: '<path fill-rule="evenodd" d="M5 24c3-4.5 7.5-6.5 12.5-6.5 3.5 0 6.5 1 8.5 2.5C30 12 37 7 44 7c-1 6.5-3.5 11.5-7 17 3.5 5.5 6 10.5 7 17-7 0-14-5-18-13-2 1.5-5 2.5-8.5 2.5C12.5 30.5 8 28.5 5 24zM11 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><path d="M14 18c2-5 7-8 12-8-2 3-3 6-3 9z" opacity=".7"/><path d="M15 30c2 4 6 7 10 8-1-3-2-5-2-8z" opacity=".7"/>',
    angel: '<path fill-rule="evenodd" d="M5 24c3-5 7-9 12-11l7-11 2 10c5 2.5 8 7 9 12-1 5-4 9.5-9 12l-2 10-7-11c-5-2-9-6-12-11zM12 21.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><path d="M35 24l8-7v14z"/>',
    catfish: '<path fill-rule="evenodd" d="M4 30c1-6 6-11 14-12l5-7 3 7h5c3 0 6 1 8 3l7-4-2 8 2 8-7-3c-3 2-8 3-14 3-11 0-20-.5-21-3zM12 25.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><path d="M5 31l-2 5M8 32l-1 5" ' + S + ' stroke-width="1.8"/>',
    clownfish: '<path fill-rule="evenodd" d="M4 24C9 15.5 18 12 26 13c4 .6 7 2.4 9 5l8.5-6-2.5 12 2.5 12-8.5-6c-2 2.6-5 4.4-9 5-8 1-17-2.5-22-11zM11 20.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16.5 16.5h3.5v15h-3.5zM28 15h3v18h-3z"/>',
    shrimp: '<path d="M9 16c9-5 21-4 28 3 6 6 6 15.5 1 20.5l-3.5-3c3.5-4 3.5-10-1.5-14.5-5.5-5-13-6-20-3z"/><path d="M34.5 37.5l-5.5 7 7.5-1.5 3 5 1.5-8z"/><path d="M10 16C6 12 4 8 4 3M11 17C5 15 2 12 1 8M18 21l-2 6M24 22l-1 6M30 25l-2 5" ' + S + ' stroke-width="1.8"/>',
    snail: '<path d="M3 41c0-3 2-5 5-5h27c3 0 5-2 6-5l4 1c-1 6-5 9-10 9z"/><circle cx="21" cy="23" r="12" ' + S + ' stroke-width="3"/><path d="M21 23a3 3 0 1 1 3 3 6 6 0 1 1-6-6 9 9 0 1 1 9 9" ' + S + ' stroke-width="2.4"/><path d="M40 31l2-8M43 32l4-6" ' + S + ' stroke-width="2"/>',
    bubbles: '<circle cx="17" cy="30" r="9" ' + S + ' stroke-width="3"/><circle cx="32" cy="15" r="6" ' + S + ' stroke-width="3"/><circle cx="35" cy="35" r="4" ' + S + ' stroke-width="3"/><circle cx="13" cy="11" r="3" ' + S + ' stroke-width="3"/>',
    // 記録の種類
    drop: '<path d="M24 4c7 10 13 17.5 13 25.5a13 13 0 0 1-26 0C11 21.5 17 14 24 4z"/>',
    bucket: '<path d="M9 17h30l-3.2 24.5A3 3 0 0 1 32.8 44H15.2a3 3 0 0 1-3-2.5z"/><path d="M11 17c0-8 6-12 13-12s13 4 13 12" ' + S + ' stroke-width="2.6"/>',
    food: '<rect x="13" y="4" width="22" height="7" rx="2"/><path d="M12 13h24v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z"/><circle cx="17" cy="42" r="2.2"/><circle cx="25" cy="44" r="2"/><circle cx="32" cy="41.5" r="2.2"/>',
    pill: '<g transform="rotate(-45 24 24)"><path d="M24 15H15a9 9 0 0 0 0 18h9z"/><path d="M24 16.5h9a7.5 7.5 0 0 1 0 15h-9z" ' + S + ' stroke-width="3"/></g>',
    flask: '<path d="M12 5h10M14 5v31a3 3 0 0 0 6 0V5M26 5h10M28 5v31a3 3 0 0 0 6 0V5M7 43h34" ' + S + ' stroke-width="2.6"/><path d="M14 22h6v14a3 3 0 0 1-6 0zM28 27h6v9a3 3 0 0 1-6 0z"/>',
    filter: '<path fill-rule="evenodd" d="M10 9h28a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4zM15 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM27 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 24a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM33 25a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM13 29a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
    brush: '<path d="M33 4l7 7-11 11-7-7z"/><path d="M19 17l12 12-9 9.5c-2 2-5.5 2-7.5 0l-4.5-4.5c-2-2-2-5.5 0-7.5z"/><path d="M8 40l-3 4M13 43l-2 3M5 35l-2 2" ' + S + ' stroke-width="2"/>',
    note: '<path d="M12 4h17l9 9v27a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" ' + S + ' stroke-width="3"/><path d="M16 20h16M16 27h16M16 34h10" ' + S + ' stroke-width="3"/>',
    sparkle: '<path d="M24 4c1.5 9 5 12.5 14 14-9 1.5-12.5 5-14 14-1.5-9-5-12.5-14-14 9-1.5 12.5-5 14-14z"/><path d="M38 30c.7 4 2.3 5.6 6 6.3-3.7.7-5.3 2.3-6 6.3-.7-4-2.3-5.6-6-6.3 3.7-.7 5.3-2.3 6-6.3z"/>',
    search: '<circle cx="20" cy="20" r="13" ' + S + ' stroke-width="4"/><path d="M30 30l12 12" ' + S + ' stroke-width="4.5"/>',
    cart: '<path d="M3 6h6l5 24h24l5-17H12" ' + S + ' stroke-width="3.2"/><circle cx="18" cy="39" r="3.6"/><circle cx="34" cy="39" r="3.6"/>',
    wrench: '<path d="M33 5a11 11 0 0 0-10 15L6 37a4.2 4.2 0 0 0 6 6l17-17a11 11 0 0 0 15-10l-7 7-6-1-1-6 7-7a11 11 0 0 0-4-4z"/>',
    heal: '<path d="M18 4h12v14h14v12H30v14H18V30H4V18h14z"/>',
    thermo: '<path d="M20 8a4 4 0 0 1 8 0v20.5a8 8 0 1 1-8 0z" ' + S + ' stroke-width="3"/><circle cx="24" cy="35" r="4.5"/><path d="M24 17v18" ' + S + ' stroke-width="3"/>'
  };
  const body = Object.keys(ICONS).map((id) =>
    '<symbol id="i-' + id + '" viewBox="0 0 48 48" fill="currentColor">' + ICONS[id] + '</symbol>').join("");
  document.body.insertAdjacentHTML("afterbegin",
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + body + '</defs></svg>');
})();
