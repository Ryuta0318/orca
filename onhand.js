/* ORCA on-hand panel for Home, modelled on the FHG on-hand screen:
   facility switcher (with ALL), budget / current (forecast) / vs budget / vs last year table,
   ADR · OCC · RevPAR tabs, a 1- or 3-month daily chart with a draggable day cursor.
   The chart is drawn at the panel's real width so it stays legible on phones.
   Shown only when turned on in Settings > Home. Sample data. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store;
  var WD = ["日", "月", "火", "水", "木", "金", "土"];

  O.onhandConfig = function () {
    var c = store.get("onhand", null) || {};
    return { on: !!c.on, facs: c.facs || [], metric: c.metric || "adr" };
  };
  var state = { fac: null, metric: null, month: 0, range: 1, show: { ty: true, ly: false, bud: false }, day: null };

  function rnd(s) { return O.rng(O.hash(String(s))); }
  // Japanese public holidays (fixed dates + "happy Monday" rules + substitute Monday)
  function isHoliday(d) {
    var m = d.getMonth() + 1, day = d.getDate(), wd = d.getDay(), nth = Math.ceil(day / 7);
    var fixed = { "1-1": 1, "2-11": 1, "2-23": 1, "3-20": 1, "4-29": 1, "5-3": 1, "5-4": 1, "5-5": 1, "8-11": 1, "9-23": 1, "11-3": 1, "11-23": 1 };
    if (fixed[m + "-" + day]) return true;
    if (wd === 1 && ((m === 1 && nth === 2) || (m === 7 && nth === 3) || (m === 9 && nth === 3) || (m === 10 && nth === 2))) return true;
    if (wd === 1) { var prev = new Date(d); prev.setDate(day - 1); if (fixed[(prev.getMonth() + 1) + "-" + prev.getDate()]) return true; }
    return false;
  }
  function red(d) { return d.getDay() === 0 || d.getDay() === 6 || isHoliday(d); }
  function openedOf(f) { var r = rnd("open" + f.id); return (2016 + Math.floor(r() * 9)) + "年" + String(1 + Math.floor(r() * 12)).padStart(2, "0") + "月開業"; }

  // Daily figures for one facility over one month
  function facMonth(f, y, m) {
    var days = new Date(y, m + 1, 0).getDate(), rooms = 30 + (O.hash(f.id) % 70), adr0 = 22000 + (O.hash(f.area) % 30) * 1700;
    var rb = rnd("bud" + f.id + y + m), budAdr = adr0 * (1.12 + rb() * 0.25), budOcc = 0.68 + rb() * 0.12, out = [];
    for (var i = 1; i <= days; i++) {
      var d = new Date(y, m, i), r = rnd("day" + f.id + O.iso(d));
      var peak = (d.getDay() === 6 ? 1.28 : d.getDay() === 5 ? 1.1 : 1) * (isHoliday(d) ? 1.18 : 1);
      var adr = adr0 * peak * (0.9 + r() * 0.24), ly = adr / (1.02 + r() * 0.3);
      var fc = Math.min(0.99, (0.55 + r() * 0.3) * (peak > 1 ? 1.15 : 1));
      var ahead = Math.round((d - O.TODAY) / 864e5), past = ahead < 0;
      var occ = past ? fc : Math.max(0.05, fc * Math.max(0.3, 1 - ahead / 75) * (0.92 + r() * 0.08));
      out.push({ d: d, past: past, rooms: rooms, adr: adr, adrLy: ly, adrBud: budAdr * peak * 0.95, occ: occ, occFc: fc, occLy: fc * (0.85 + r() * 0.25), occBud: Math.min(0.99, budOcc * (peak > 1 ? 1.15 : 0.97)) });
    }
    return out;
  }
  // Days for the shown range; several facilities are combined per day (rooms-weighted)
  function rangeDays(facs) {
    var start = new Date(O.TODAY.getFullYear(), O.TODAY.getMonth() + state.month, 1), all = [];
    for (var k = 0; k < state.range; k++) {
      var y = start.getFullYear(), m = start.getMonth() + k, per = facs.map(function (f) { return facMonth(f, new Date(y, m, 1).getFullYear(), new Date(y, m, 1).getMonth()); });
      per[0].forEach(function (_, i) {
        var rows = per.map(function (p) { return p[i]; }), R = 0, S = { occ: 0, occFc: 0, occLy: 0, occBud: 0 }, V = { adr: 0, adrLy: 0, adrBud: 0 };
        rows.forEach(function (x) { R += x.rooms; S.occ += x.rooms * x.occ; S.occFc += x.rooms * x.occFc; S.occLy += x.rooms * x.occLy; S.occBud += x.rooms * x.occBud; V.adr += x.rooms * x.occFc * x.adr; V.adrLy += x.rooms * x.occLy * x.adrLy; V.adrBud += x.rooms * x.occBud * x.adrBud; });
        all.push({ d: rows[0].d, past: rows[0].past, rooms: R, occ: S.occ / R, occFc: S.occFc / R, occLy: S.occLy / R, occBud: S.occBud / R, adr: V.adr / S.occFc, adrLy: V.adrLy / S.occLy, adrBud: V.adrBud / S.occBud });
      });
    }
    return all;
  }
  function summary(days) {
    var t = { cap: 0, sold: 0, fc: 0, ly: 0, bud: 0, rev: 0, revLy: 0, revBud: 0 };
    days.forEach(function (x) {
      t.cap += x.rooms; t.sold += x.rooms * x.occ; t.fc += x.rooms * x.occFc; t.ly += x.rooms * x.occLy; t.bud += x.rooms * x.occBud;
      t.rev += x.rooms * x.occFc * x.adr; t.revLy += x.rooms * x.occLy * x.adrLy; t.revBud += x.rooms * x.occBud * x.adrBud;
    });
    var adr = t.rev / t.fc, adrLy = t.revLy / t.ly, adrBud = t.revBud / t.bud;
    var occ = t.sold / t.cap, occFc = t.fc / t.cap, occLy = t.ly / t.cap, occBud = t.bud / t.cap;
    var rp = t.rev / t.cap, rpLy = t.revLy / t.cap, rpBud = t.revBud / t.cap;
    return {
      adr: { bud: adrBud, cur: adr, vb: adr / adrBud, vl: adr / adrLy },
      occ: { bud: occBud, cur: occ, fc: occFc, vb: occ / occBud, vbFc: occFc / occBud, vl: occ / occLy, vlFc: occFc / occLy },
      revpar: { bud: rpBud, cur: rp, vb: rp / rpBud, vl: rp / rpLy }
    };
  }
  function pctCls(v) { return v >= 1 ? "good" : "bad"; }
  function yen(v) { return Math.round(v).toLocaleString() + "<small>円</small>"; }
  function pc(v) { return Math.round(v * 100) + "<small>%</small>"; }
  var GET = {
    adr: [function (x) { return x.adr; }, function (x) { return x.adrLy; }, function (x) { return x.adrBud; }],
    occ: [function (x) { return x.occ * 100; }, function (x) { return x.occLy * 100; }, function (x) { return x.occBud * 100; }],
    revpar: [function (x) { return x.adr * x.occ; }, function (x) { return x.adrLy * x.occLy; }, function (x) { return x.adrBud * x.occBud; }]
  };

  function chart(days, metric, width) {
    var narrow = width < 560, W = Math.max(300, width), H = narrow ? 270 : 330, L = narrow ? 44 : 64, R = narrow ? 8 : 14, T = 14, B = 44, n = days.length, get = GET[metric];
    var vals = [];
    days.forEach(function (x) { vals.push(get[0](x)); if (state.show.ly) vals.push(get[1](x)); if (state.show.bud) vals.push(get[2](x)); });
    var top = metric === "occ" ? 100 : Math.ceil(Math.max.apply(null, vals) * 1.12 / 10000) * 10000, steps = metric === "occ" ? 5 : top / 10000;
    if (steps > 8) steps = steps / 2;
    function x(i) { return L + (W - L - R) * (n === 1 ? 0.5 : i / (n - 1)); }
    function y(v) { return T + (H - T - B) * (1 - v / top); }
    var every = n > 45 ? (narrow ? 7 : 3) : (narrow ? 3 : 1), g = "";
    for (var k = 0; k <= steps; k++) {
      var v = top * k / steps;
      g += '<line class="ohx-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ohx-axis" x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (metric === "occ" ? v + "%" : (narrow && v >= 1000 ? Math.round(v / 1000) + "k" : v.toLocaleString())) + "</text>";
    }
    days.forEach(function (dd, i) {
      if (n <= 45) g += '<line class="ohx-grid v" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
      var first = dd.d.getDate() === 1;
      if (first && i > 0) g += '<line class="ohx-grid m" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
      var dim = new Date(dd.d.getFullYear(), dd.d.getMonth() + 1, 0).getDate();
      if ((dd.d.getDate() - 1) % every === 0 && (every === 1 || dd.d.getDate() === 1 || dd.d.getDate() + every <= dim + 1)) g += '<text class="ohx-day' + (red(dd.d) ? " red" : "") + '" x="' + x(i) + '" y="' + (H - B + 17) + '" text-anchor="middle">' + dd.d.getDate() + "</text>";
      if (first) g += '<text class="ohx-axis" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + (dd.d.getMonth() + 1) + "月</text>";
    });
    function line(fn, cls) {
      var solid = "", dash = "";
      days.forEach(function (dd, i) {
        var pt = x(i).toFixed(1) + " " + y(fn(dd)).toFixed(1);
        if (cls === "ty") {
          if (dd.past) solid += (solid ? "L" : "M") + pt;
          if (!dd.past || (days[i + 1] && !days[i + 1].past)) dash += (dash ? "L" : "M") + pt;
        } else solid += (solid ? "L" : "M") + pt;
      });
      return (solid ? '<path class="ohx-line ' + cls + '" d="' + solid + '"/>' : "") + (dash ? '<path class="ohx-line ' + cls + ' dash" d="' + dash + '"/>' : "");
    }
    if (state.show.bud) g += line(get[2], "bud");
    if (state.show.ly) g += line(get[1], "ly");
    if (state.show.ty) g += line(get[0], "ty");
    var di = Math.max(0, Math.min(n - 1, state.day)), cur = days[di], cx = x(di);
    g += '<line class="ohx-cursor" x1="' + cx + '" x2="' + cx + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    if (state.show.ty) g += '<circle class="ohx-dot" cx="' + cx + '" cy="' + y(get[0](cur)) + '" r="' + (narrow ? 6 : 7) + '"/>';
    g += '<g class="ohx-handle" transform="translate(' + cx + "," + (H - B) + ')"><rect x="-22" y="-9" width="44" height="18" rx="9"/><circle r="6"/><path d="M-15 0l4-3v6zM15 0l-4-3v6z"/></g>';
    g += '<rect class="ohx-hit" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B + 22) + '"/>';
    // Tooltip: all three figures for the day, plus last year / budget for the open tab when shown
    var f = function (v, k) { return k === "occ" ? Math.round(v) + "%" : Math.round(v).toLocaleString() + "円"; };
    var dateTxt = (narrow ? "" : cur.d.getFullYear() + "年") + (cur.d.getMonth() + 1) + "月" + cur.d.getDate() + "日(" + WD[cur.d.getDay()] + ")";
    var tip = "<b>" + dateTxt + "<em>" + (cur.past ? "実績" : "オンハンド") + "</em></b>" +
      ["adr", "occ", "revpar"].map(function (k) { return '<span class="' + (k === metric ? "on" : "") + '"><i>' + { adr: "ADR", occ: "OCC", revpar: "RevPAR" }[k] + "</i>" + f(GET[k][0](cur), k) + "</span>"; }).join("") +
      (!cur.past ? '<span class="dim"><i>OCC 着地予測</i>' + Math.round(cur.occFc * 100) + "%</span>" : "") +
      (state.show.ly ? '<span class="dim"><i>前年 ' + { adr: "ADR", occ: "OCC", revpar: "RevPAR" }[metric] + "</i>" + f(get[1](cur), metric) + "</span>" : "") +
      (state.show.bud ? '<span class="dim"><i>予算 ' + { adr: "ADR", occ: "OCC", revpar: "RevPAR" }[metric] + "</i>" + f(get[2](cur), metric) + "</span>" : "");
    var tipW = narrow ? 190 : 210, side = cx > W / 2 ? cx - tipW - 14 : cx + 14;
    return '<div class="ohx-plot" tabindex="0" aria-label="グラフ。左右キーで日付を移動"><svg class="ohx-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" data-n="' + n + '" data-l="' + L + '" data-r="' + R + '" role="img" aria-label="日別の推移">' + g + "</svg>" +
      '<div class="ohx-tip" style="left:' + Math.max(0, Math.min(W - tipW, side)) + "px;width:" + tipW + 'px">' + tip + "</div></div>";
  }

  function render(el) {
    var cfg = O.onhandConfig(), facs = (O.FACILITIES || []).filter(function (f) { return cfg.facs.indexOf(f.id) > -1; });
    if (!state.fac || (state.fac !== "all" && cfg.facs.indexOf(state.fac) < 0) || (state.fac === "all" && facs.length < 2)) state.fac = facs.length > 1 ? "all" : facs[0].id;
    if (!state.metric) state.metric = cfg.metric;
    var sel = state.fac === "all" ? facs : facs.filter(function (x) { return x.id === state.fac; });
    var days = rangeDays(sel), S = summary(days);
    var todayIdx = days.findIndex(function (x) { return O.iso(x.d) === O.iso(O.TODAY); });
    if (state.day == null || state.day >= days.length) state.day = todayIdx > -1 ? todayIdx : 0;
    var start = days[0].d, end = days[days.length - 1].d;
    var label = start.getFullYear() + "年" + (start.getMonth() + 1) + "月" + (state.range > 1 ? "〜" + (end.getMonth() + 1) + "月" : "");
    var row = function (name, s, isOcc) {
      return '<tr><th scope="row">' + name + '</th><td class="num">' + (isOcc ? pc(s.bud) : yen(s.bud)) + '</td><td class="num">' + (isOcc ? pc(s.cur) + '<span class="sub">(' + Math.round(s.fc * 100) + "%)</span>" : yen(s.cur)) + "</td>" +
        '<td class="num ' + pctCls(s.vb) + '">' + pc(s.vb) + (isOcc ? '<span class="sub ' + pctCls(s.vbFc) + '">(' + Math.round(s.vbFc * 100) + "%)</span>" : "") + "</td>" +
        '<td class="num ' + pctCls(s.vl) + '">' + pc(s.vl) + (isOcc ? '<span class="sub ' + pctCls(s.vlFc) + '">(' + Math.round(s.vlFc * 100) + "%)</span>" : "") + "</td></tr>";
    };
    var width = Math.round((el.clientWidth || 900) - (el.clientWidth < 560 ? 28 : 48));
    el.innerHTML = '<div class="ohx-top"><span class="ohx-title">' + icon("chart") + ' オンハンド</span><span class="ohx-upd">' + O.TODAY.getFullYear() + "年" + (O.TODAY.getMonth() + 1) + "月" + O.TODAY.getDate() + '日更新・サンプル</span>' +
      '<button class="icon-btn ghost" type="button" data-open-settings="home" aria-label="オンハンドの設定">' + icon("sliders") + "</button></div>" +
      '<label class="ohx-select"><select data-ohx-fac aria-label="施設">' + (facs.length > 1 ? '<option value="all"' + (state.fac === "all" ? " selected" : "") + ">ALL（選択中の " + facs.length + " 施設）</option>" : "") +
      facs.map(function (x) { return '<option value="' + x.id + '"' + (x.id === state.fac ? " selected" : "") + ">" + esc(x.name) + "（" + openedOf(x) + "）</option>"; }).join("") + "</select>" + icon("down") + "</label>" +
      '<div class="ohx-pick"><span class="ohx-month"><button class="icon-btn ghost" type="button" data-ohx-month="-1" aria-label="前へ"' + (state.month <= -3 ? " disabled" : "") + ">" + icon("back") + "</button><b>" + label + '</b><button class="icon-btn ghost flip" type="button" data-ohx-month="1" aria-label="次へ"' + (state.month >= 5 ? " disabled" : "") + ">" + icon("back") + "</button></span>" +
      '<span class="seg" role="group" aria-label="期間"><button type="button" data-ohx-range="1" aria-pressed="' + (state.range === 1) + '">1か月</button><button type="button" data-ohx-range="3" aria-pressed="' + (state.range === 3) + '">3か月</button></span></div>' +
      '<div class="ohx-table-wrap"><table class="ohx-table"><thead><tr><th></th><th class="num">予算</th><th class="num">現在(予測)</th><th class="num">予算比</th><th class="num">前年比</th></tr></thead><tbody>' +
      row("ADR", S.adr) + row("OCC", S.occ, true) + row("RevPAR", S.revpar) + '</tbody></table><p class="ohx-note">OCC のかっこ内は着地予測。予算比・前年比は 100% 以上を緑、未満を赤。</p></div>' +
      '<div class="ohx-tabs" role="tablist">' + [["adr", "ADR"], ["occ", "OCC"], ["revpar", "RevPAR"]].map(function (t) { return '<button type="button" role="tab" data-ohx-metric="' + t[0] + '" aria-selected="' + (state.metric === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div class="ohx-series">' + [["ty", "当年"], ["ly", "前年"], ["bud", "予算"]].map(function (s) { return '<button type="button" class="ohx-chip ' + s[0] + '" data-ohx-series="' + s[0] + '" aria-pressed="' + state.show[s[0]] + '"><i></i>' + s[1] + "</button>"; }).join("") +
      '<span class="ohx-legend"><span class="solid"></span>実績<span class="dashed"></span>今日以降</span></div>' + chart(days, state.metric, width);
  }

  function wire(el) {
    el.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-ohx-metric]"))) { state.metric = t.getAttribute("data-ohx-metric"); return render(el); }
      if ((t = e.target.closest("[data-ohx-series]"))) { var k = t.getAttribute("data-ohx-series"); state.show[k] = !state.show[k]; if (!state.show.ty && !state.show.ly && !state.show.bud) state.show.ty = true; return render(el); }
      if ((t = e.target.closest("[data-ohx-month]"))) { state.month += +t.getAttribute("data-ohx-month") * state.range; state.month = Math.max(-3, Math.min(5, state.month)); state.day = null; return render(el); }
      if ((t = e.target.closest("[data-ohx-range]"))) { state.range = +t.getAttribute("data-ohx-range"); state.day = null; return render(el); }
    });
    el.addEventListener("change", function (e) { if (e.target.matches("[data-ohx-fac]")) { state.fac = e.target.value; render(el); } });
    // Drag or tap on the plot to move the day cursor; arrow keys work too
    var dragging = false;
    function pick(ev) {
      var svg = el.querySelector(".ohx-svg");
      if (!svg) return;
      var rc = svg.getBoundingClientRect(), vb = +svg.getAttribute("width"), n = +svg.getAttribute("data-n"), L = +svg.getAttribute("data-l"), R = +svg.getAttribute("data-r");
      var px = (ev.clientX - rc.left) / rc.width * vb, i = Math.round((px - L) / ((vb - L - R) / Math.max(1, n - 1)));
      i = Math.max(0, Math.min(n - 1, i));
      if (i !== state.day) { state.day = i; render(el); }
    }
    el.addEventListener("pointerdown", function (e) { if (e.target.closest(".ohx-svg")) { dragging = true; pick(e); } });
    window.addEventListener("pointermove", function (e) { if (dragging && el.isConnected) pick(e); });
    window.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("keydown", function (e) {
      if (!e.target.closest(".ohx-plot") || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); state.day += e.key === "ArrowLeft" ? -1 : 1; render(el); el.querySelector(".ohx-plot").focus();
    });
    // Redraw at the new width when the window or panel is resized
    var lastW = el.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () { if (el.isConnected && Math.abs(el.clientWidth - lastW) > 8) { lastW = el.clientWidth; render(el); } }).observe(el);
  }

  O.onhandPanel = function () {
    var cfg = O.onhandConfig();
    if (!cfg.on) return "";
    var has = (O.FACILITIES || []).some(function (f) { return cfg.facs.indexOf(f.id) > -1; });
    if (!has) return '<section class="ohx ohx-empty"><div><p class="ohx-title">' + icon("chart") + ' オンハンド</p><h2>表示する施設がまだありません</h2><p>設定の「ホーム」で、オンハンドを見たい施設を選んでください。</p></div><button class="btn btn-primary" type="button" data-open-settings="home">施設を選ぶ</button></section>';
    return '<section class="ohx" id="ohx" aria-label="オンハンド"></section>';
  };
  O.mountOnhand = function (root) {
    var el = root.querySelector("#ohx");
    if (!el) return;
    state.metric = null; state.day = null;
    render(el); wire(el);
  };
})();
