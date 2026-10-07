/* ORCA on-hand panel for Home: room nights already booked for the coming months, by channel.
   Shown only when the user turns it on and picks facilities in Settings > Home. Sample data. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store;

  var AXES = {
    channel: { label: "チャネル区分", keys: [["OTA海外", "#6b8cff"], ["OTA国内", "#f0915f"], ["公式", "#b08cff"], ["パッケージ", "#45c995"], ["未分類", "#e8bd45"]] },
    site: { label: "予約サイト", keys: [["Booking.com", "#6b8cff"], ["楽天トラベル", "#f07070"], ["じゃらん", "#f0a35f"], ["Expedia", "#e27bd0"], ["公式サイト", "#b08cff"], ["その他", "#8fa0b8"]] }
  };
  O.ONHAND_AXES = AXES;
  O.onhandConfig = function () { return store.get("onhand", { on: false, facs: [], months: 12, axis: "channel" }); };

  function rnd(s) { return O.rng(O.hash(String(s))); }
  function months(n) { var out = []; for (var k = 0; k < n; k++) out.push(new Date(O.TODAY.getFullYear(), O.TODAY.getMonth() + k, 1)); return out; }
  function label(d, i) { return i === 0 || d.getMonth() === 0 ? String(d.getFullYear()).slice(2) + "年" + (d.getMonth() + 1) + "月" : (d.getMonth() + 1) + "月"; }

  // On-hand room nights for one facility and month, split by the chosen axis
  function cell(f, d, k, axis) {
    var r = rnd("oh" + f.id + d.getFullYear() + d.getMonth()), rooms = 30 + (O.hash(f.id) % 70);
    var days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    var pace = Math.max(0.05, 0.92 - 0.14 * k + (r() - 0.5) * 0.08);          // further out = less booked yet
    var season = d.getMonth() === 7 || d.getMonth() === 11 || d.getMonth() === 2 ? 1.18 : 1;
    var total = Math.round(rooms * days * 0.72 * season * pace);
    var intl = 0.25 + (O.hash(f.area || f.name) % 40) / 100;                    // inbound-heavy facilities differ
    var w = axis === "site" ? [intl * 0.6, 0.28, 0.16, intl * 0.4, 0.14, 0.06] : [intl, 0.62 - intl * 0.6, 0.12, 0.025, 0.015];
    var sum = w.reduce(function (s, x) { return s + x; }, 0);
    var parts = w.map(function (x) { return Math.round(total * x / sum * (0.9 + r() * 0.2)); });
    return { parts: parts, total: parts.reduce(function (s, x) { return s + x; }, 0), ly: Math.round(total * (0.82 + r() * 0.3)) };
  }

  function bars(series, keys, labels) {
    var W = 760, H = 300, L = 48, R = 8, T = 26, B = 30, mx = 0;
    series.forEach(function (s) { mx = Math.max(mx, s.total); });
    var step = Math.pow(10, Math.floor(Math.log10(mx || 1))), top = Math.ceil(mx / step) * step || 1;
    if (top / step <= 2) top = Math.ceil(mx / (step / 2)) * (step / 2);
    var bw = (W - L - R) / series.length, g = "";
    function y(v) { return T + (H - T - B) * (1 - v / top); }
    [0, 0.25, 0.5, 0.75, 1].forEach(function (q) {
      var v = top * q;
      g += '<line class="oh-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="oh-axis" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + Math.round(v).toLocaleString() + "</text>";
    });
    series.forEach(function (s, i) {
      var x = L + i * bw + bw * 0.16, w = bw * 0.68, acc = 0;
      g += '<g class="oh-bar" style="animation-delay:' + (i * 45) + 'ms"><title>' + labels[i] + " " + s.total.toLocaleString() + " 室夜</title>";
      s.parts.forEach(function (v, j) {
        var y0 = y(acc), y1 = y(acc + v);
        g += '<rect x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0, y0 - y1).toFixed(1) + '" fill="' + keys[j][1] + '"' + (j === s.parts.length - 1 ? ' rx="3"' : "") + "/>";
        acc += v;
      });
      g += '<text class="oh-val" x="' + (x + w / 2).toFixed(1) + '" y="' + (y(acc) - 7).toFixed(1) + '" text-anchor="middle">' + s.total.toLocaleString() + "</text>";
      g += '<text class="oh-axis" x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + labels[i] + "</text></g>";
    });
    return '<svg class="oh-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="月別オンハンド室夜の内訳">' + g + "</svg>";
  }

  function donut(totals, keys, sum) {
    var C = 2 * Math.PI * 70, off = 0, g = "";
    totals.forEach(function (v, j) {
      var len = sum ? C * v / sum : 0;
      g += '<circle r="70" cx="100" cy="100" fill="none" stroke="' + keys[j][1] + '" stroke-width="26" stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 100 100)"/>';
      off += len;
    });
    return '<svg class="oh-donut" viewBox="0 0 200 200" role="img" aria-label="期間全体の内訳">' + g +
      '<text x="100" y="104" text-anchor="middle" class="oh-donut-num">' + sum.toLocaleString() + '</text><text x="100" y="126" text-anchor="middle" class="oh-donut-sub">室夜</text></svg>';
  }

  // Home section. Returns "" when the user has not turned it on.
  O.onhandPanel = function () {
    var cfg = O.onhandConfig();
    if (!cfg.on) return "";
    var facs = (O.FACILITIES || []).filter(function (f) { return cfg.facs.indexOf(f.id) > -1; });
    if (!facs.length) {
      return '<section class="oh oh-empty"><div><p class="oh-eyebrow">' + icon("chart") + ' オンハンド</p><h2>表示する施設がまだありません</h2><p>設定の「ホーム」で、オンハンドを見たい施設を選んでください。</p></div><button class="btn btn-light" type="button" data-open-settings="home">施設を選ぶ</button></section>';
    }
    var ax = AXES[cfg.axis] || AXES.channel, keys = ax.keys, M = months(cfg.months || 12);
    var series = M.map(function (d, k) {
      var parts = keys.map(function () { return 0; }), ly = 0;
      facs.forEach(function (f) { var c = cell(f, d, k, cfg.axis); c.parts.forEach(function (v, j) { parts[j] += v; }); ly += c.ly; });
      return { parts: parts, total: parts.reduce(function (s, v) { return s + v; }, 0), ly: ly };
    });
    var totals = keys.map(function (_, j) { return series.reduce(function (s, x) { return s + x.parts[j]; }, 0); });
    var sum = totals.reduce(function (s, v) { return s + v; }, 0), ly = series.reduce(function (s, x) { return s + x.ly; }, 0);
    var next3 = series.slice(0, 3).reduce(function (s, x) { return s + x.total; }, 0), next3ly = series.slice(0, 3).reduce(function (s, x) { return s + x.ly; }, 0);
    var yoy = (sum / ly - 1) * 100, yoy3 = (next3 / next3ly - 1) * 100;
    var share = function (name) { var j = keys.map(function (k) { return k[0]; }).indexOf(name); return j < 0 ? null : totals[j] / sum * 100; };
    var intl = cfg.axis === "channel" ? share("OTA海外") : (share("Booking.com") + share("Expedia"));
    var direct = cfg.axis === "channel" ? share("公式") : share("公式サイト");
    var labels = M.map(label);
    var names = facs.slice(0, 4).map(function (f) { return '<span class="oh-chip">' + esc(f.name) + "</span>"; }).join("") + (facs.length > 4 ? '<span class="oh-chip">ほか' + (facs.length - 4) + "施設</span>" : "");
    var stat = function (lab, val, note, cls) { return '<div class="oh-stat"><span class="oh-stat-label">' + lab + '</span><span class="oh-stat-value ' + (cls || "") + '">' + val + '</span><span class="oh-stat-note">' + note + "</span></div>"; };
    return '<section class="oh" aria-label="オンハンド">' +
      '<header class="oh-head"><div><p class="oh-eyebrow">' + icon("chart") + " オンハンド（予約済み室夜）・" + ax.label + '</p><h2>この先 ' + M.length + ' か月の予約の入り</h2><div class="oh-chips">' + names + "</div></div>" +
      '<div class="oh-head-actions"><span class="oh-asof">' + (O.TODAY.getMonth() + 1) + "/" + O.TODAY.getDate() + ' 時点・サンプル</span><button class="btn btn-light" type="button" data-open-settings="home">' + icon("sliders") + "表示を変更</button></div></header>" +
      '<div class="oh-stats">' + stat("オンハンド室夜", sum.toLocaleString(), M.length + "か月分の合計") +
      stat("前年同時期比", (yoy > 0 ? "+" : "") + yoy.toFixed(1) + "%", "同じ日数前時点との比較", yoy >= 0 ? "up" : "down") +
      stat("直近3か月", next3.toLocaleString(), "前年比 " + (yoy3 > 0 ? "+" : "") + yoy3.toFixed(1) + "%", yoy3 >= 0 ? "up" : "down") +
      stat("海外比率", intl.toFixed(1) + "%", cfg.axis === "channel" ? "OTA海外 ÷ 全体" : "Booking.com・Expedia ÷ 全体") +
      stat("公式比率", direct.toFixed(1) + "%", "公式 ÷ 全体") + "</div>" +
      '<div class="oh-body"><div class="oh-main">' + bars(series, keys, labels) + '<div class="oh-legend">' + keys.map(function (k) { return '<span><i style="background:' + k[1] + '"></i>' + k[0] + "</span>"; }).join("") + "</div></div>" +
      '<div class="oh-side"><p class="oh-side-title">期間全体</p>' + donut(totals, keys, sum) + '<div class="oh-table">' +
      keys.map(function (k, j) { return '<div><i style="background:' + k[1] + '"></i><span>' + k[0] + "</span><b>" + totals[j].toLocaleString() + "</b><em>" + (totals[j] / sum * 100).toFixed(1) + "%</em></div>"; }).join("") +
      "</div></div></div></section>";
  };
})();
