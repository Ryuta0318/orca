/* ORCA core: helpers, icons, storage, sample data, small chart renderers. */
(function () {
  "use strict";

  var ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
    chats: '<path d="M14 9a5 5 0 0 1-7.3 4.4L3 14.5l1-3.2A5 5 0 1 1 14 9z"/><path d="M10 16.5a5 5 0 0 0 7.3 2l3.7 1.1-1-3.2A5 5 0 0 0 16 9.2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    agents: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    library: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    integrations: '<circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="4"/><path d="m10.8 12.2 2.4-2.4"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7L10.2 17a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    todo: '<path d="M4 6h2M4 12h2M4 18h2M10 6h10M10 12h10M10 18h10"/>',
    binoculars: '<circle cx="6.5" cy="16" r="3.5"/><circle cx="17.5" cy="16" r="3.5"/><path d="M10 16h4M4 13l2-8h3l1 8M20 13l-2-8h-3l-1 8"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M9 17v-3M12 17v-6M15 17v-4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a2 2 0 0 0-2 2"/><path d="m15 13 2 2 4-4"/>',
    ledger: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
    news: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    flat: '<path d="M5 12h14"/>',
    feedback: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v4M12 14h.01"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || "") + "</svg>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Storage (per browser; falls back to memory) ----------
  var mem = {};
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("orca." + k); return v == null ? d : JSON.parse(v); }
      catch (e) { return k in mem ? mem[k] : d; }
    },
    set: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem("orca." + k, JSON.stringify(v)); } catch (e) { /* memory only */ }
    },
    clear: function () {
      mem = {};
      try {
        Object.keys(localStorage).forEach(function (k) { if (k.indexOf("orca.") === 0) localStorage.removeItem(k); });
      } catch (e) { /* nothing stored */ }
    }
  };

  // ---------- Deterministic sample data ----------
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  var TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var WD = ["日", "月", "火", "水", "木", "金", "土"];
  function md(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }
  function mdw(d) { return md(d) + "(" + WD[d.getDay()] + ")"; }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yen(n) { return "¥" + Math.round(n).toLocaleString("ja-JP"); }
  function pct(n, digits) { return (n * 100).toFixed(digits == null ? 1 : digits) + "%"; }

  var PROPS = [
    { id: "yufuin", name: "由布院", base: 26000 },
    { id: "takayama", name: "高山", base: 21000 },
    { id: "ise", name: "伊勢", base: 19000 },
    { id: "kagoshima", name: "鹿児島", base: 17000 },
    { id: "sapporo", name: "札幌", base: 15000 }
  ];
  var COMPETITORS = ["競合A", "競合B", "競合C"];
  var CHANNELS = ["公式サイト", "楽天トラベル", "じゃらん", "Booking.com", "Expedia", "Agoda"];

  // ---------- Charts (inline SVG, colors from CSS tokens) ----------
  function niceTicks(min, max, n) {
    var span = max - min || 1;
    var step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(v);
    return out;
  }
  // series: [{name, values:[...], cls:"s1"}]; labels: x labels; fmt: y formatter
  function lineChart(series, labels, fmt) {
    var W = 680, H = 240, L = 58, R = 16, T = 16, B = 30;
    var all = [];
    series.forEach(function (s) { all = all.concat(s.values); });
    var ticks = niceTicks(Math.min.apply(null, all), Math.max.apply(null, all), 4);
    var y0 = ticks[0], y1 = ticks[ticks.length - 1];
    function x(i) { return L + (W - L - R) * (labels.length === 1 ? 0.5 : i / (labels.length - 1)); }
    function y(v) { return T + (H - T - B) * (1 - (v - y0) / (y1 - y0 || 1)); }
    var g = "";
    ticks.forEach(function (t) {
      g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
        '<text class="axis" x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + fmt(t) + "</text>";
    });
    var every = Math.ceil(labels.length / 7);
    labels.forEach(function (lb, i) {
      if (i % every === 0 || i === labels.length - 1) g += '<text class="axis" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(lb) + "</text>";
    });
    series.forEach(function (s) {
      var d = s.values.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join("");
      if (s.area) g += '<path class="area ' + s.cls + '" d="' + d + "L" + x(s.values.length - 1) + " " + y(y0) + "L" + x(0) + " " + y(y0) + 'Z"/>';
      g += '<path class="line ' + s.cls + '" d="' + d + '"/>';
      var li = s.values.length - 1;
      g += '<circle class="dot ' + s.cls + '" cx="' + x(li) + '" cy="' + y(s.values[li]) + '" r="3.5"/>';
    });
    return '<figure class="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(series.map(function (s) { return s.name; }).join("と")) + 'の推移">' + g + "</svg>" +
      '<figcaption class="legend">' + series.map(function (s) { return '<span><i class="sw ' + s.cls + '"></i>' + esc(s.name) + "</span>"; }).join("") + "</figcaption></figure>";
  }
  function barChart(values, labels, fmt, max) {
    var W = 680, H = 220, L = 46, R = 10, T = 12, B = 28;
    var top = max || Math.max.apply(null, values);
    var ticks = niceTicks(0, top, 4);
    var y1 = ticks[ticks.length - 1];
    var bw = (W - L - R) / values.length;
    function y(v) { return T + (H - T - B) * (1 - v / y1); }
    var g = "";
    ticks.forEach(function (t) {
      g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
        '<text class="axis" x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + fmt(t) + "</text>";
    });
    var every = Math.ceil(values.length / 10);
    values.forEach(function (v, i) {
      var bx = L + i * bw + bw * 0.18;
      g += '<rect class="bar" x="' + bx.toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + (y(0) - y(v)).toFixed(1) + '" rx="2"><title>' + esc(labels[i]) + " " + fmt(v) + "</title></rect>";
      if (i % every === 0) g += '<text class="axis" x="' + (bx + bw * 0.32) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + "</text>";
    });
    return '<figure class="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="日別の推移">' + g + "</svg></figure>";
  }
  function spark(values) {
    var W = 90, H = 26, mn = Math.min.apply(null, values), mx = Math.max.apply(null, values);
    var d = values.map(function (v, i) {
      return (i ? "L" : "M") + (i * (W - 4) / (values.length - 1) + 2).toFixed(1) + " " + (H - 3 - (H - 6) * (v - mn) / (mx - mn || 1)).toFixed(1);
    }).join("");
    return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  window.ORCA = {
    icon: icon, esc: esc, store: store, rng: rng, hash: hash,
    TODAY: TODAY, addDays: addDays, md: md, mdw: mdw, iso: iso, yen: yen, pct: pct, WD: WD,
    PROPS: PROPS, COMPETITORS: COMPETITORS, CHANNELS: CHANNELS,
    lineChart: lineChart, barChart: barChart, spark: spark,
    VIEWS: {}, AFTER: {}
  };
})();
