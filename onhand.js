/* ORCA on-hand panel for Home, modelled on the FHG on-hand screen:
   facility switcher, budget / current (forecast) / vs budget / vs last year table,
   ADR · OCC · RevPAR tabs and a daily line chart with a draggable day cursor.
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
  var state = { fac: null, metric: null, month: 0, show: { ty: true, ly: false, bud: false }, day: null };

  function rnd(s) { return O.rng(O.hash(String(s))); }
  // Japanese public holidays (fixed dates + "happy Monday" rules; enough for colouring the axis)
  function isHoliday(d) {
    var m = d.getMonth() + 1, day = d.getDate(), wd = d.getDay(), nth = Math.ceil(day / 7);
    var fixed = { "1-1": 1, "2-11": 1, "2-23": 1, "3-20": 1, "4-29": 1, "5-3": 1, "5-4": 1, "5-5": 1, "8-11": 1, "9-23": 1, "11-3": 1, "11-23": 1 };
    if (fixed[m + "-" + day]) return true;
    if (wd === 1 && ((m === 1 && nth === 2) || (m === 7 && nth === 3) || (m === 9 && nth === 3) || (m === 10 && nth === 2))) return true;
    if (wd === 1) { var prev = new Date(d); prev.setDate(day - 1); if (fixed[(prev.getMonth() + 1) + "-" + prev.getDate()]) return true; } // substitute holiday
    return false;
  }
  function red(d) { return d.getDay() === 0 || d.getDay() === 6 || isHoliday(d); }

  // One facility-month of daily figures
  function monthData(f, base) {
    var y = base.getFullYear(), m = base.getMonth(), days = new Date(y, m + 1, 0).getDate();
    var rooms = 30 + (O.hash(f.id) % 70), adr0 = 22000 + (O.hash(f.area) % 30) * 1700;
    var rb = rnd("bud" + f.id + y + m), budAdr = adr0 * (1.12 + rb() * 0.25), budOcc = 0.68 + rb() * 0.12;
    var out = [];
    for (var i = 1; i <= days; i++) {
      var d = new Date(y, m, i), r = rnd("day" + f.id + O.iso(d));
      var peak = (d.getDay() === 6 ? 1.28 : d.getDay() === 5 ? 1.1 : 1) * (isHoliday(d) ? 1.18 : 1);
      var adr = adr0 * peak * (0.9 + r() * 0.24), ly = adr / (1.02 + r() * 0.3);
      var finalOcc = Math.min(0.99, (0.55 + r() * 0.3) * (peak > 1 ? 1.15 : 1));
      var ahead = Math.round((d - O.TODAY) / 864e5), past = ahead < 0;
      var onOcc = past ? finalOcc : Math.max(0.05, finalOcc * Math.max(0.3, 1 - ahead / 75) * (0.92 + r() * 0.08));
      out.push({ d: d, past: past, rooms: rooms, adr: adr, adrLy: ly, adrBud: budAdr * peak * 0.95, occ: onOcc, occFc: finalOcc, occLy: finalOcc * (0.85 + r() * 0.25), occBud: Math.min(0.99, budOcc * (peak > 1 ? 1.15 : 0.97)) });
    }
    return { days: out, budAdr: budAdr, budOcc: budOcc, rooms: rooms };
  }
  function summary(M) {
    var cap = 0, sold = 0, soldFc = 0, rev = 0, revFc = 0, soldLy = 0, revLy = 0;
    M.days.forEach(function (x) {
      cap += x.rooms; var s = x.rooms * x.occ, sf = x.rooms * x.occFc, sl = x.rooms * x.occLy;
      sold += s; soldFc += sf; soldLy += sl; rev += s * x.adr; revFc += sf * x.adr; revLy += sl * x.adrLy;
    });
    var adr = revFc / soldFc, occ = sold / cap, occFc = soldFc / cap, revpar = revFc / cap;
    var lyAdr = revLy / soldLy, lyOcc = soldLy / cap, lyRevpar = revLy / cap;
    return {
      adr: { bud: M.budAdr, cur: adr, vb: adr / M.budAdr, vl: adr / lyAdr },
      occ: { bud: M.budOcc, cur: occ, fc: occFc, vb: occ / M.budOcc, vbFc: occFc / M.budOcc, vl: occ / lyOcc, vlFc: occFc / lyOcc },
      revpar: { bud: M.budAdr * M.budOcc, cur: revpar, vb: revpar / (M.budAdr * M.budOcc), vl: revpar / lyRevpar }
    };
  }
  function pctCls(v) { return v >= 1 ? "good" : "bad"; }
  function yen(v) { return Math.round(v).toLocaleString() + "<small>円</small>"; }
  function pc(v) { return Math.round(v * 100) + "<small>%</small>"; }

  function chart(M, metric) {
    var W = 900, H = 330, L = 64, R = 14, T = 18, B = 46, n = M.days.length;
    var get = {
      adr: [function (x) { return x.adr; }, function (x) { return x.adrLy; }, function (x) { return x.adrBud; }],
      occ: [function (x) { return (x.past ? x.occ : x.occ) * 100; }, function (x) { return x.occLy * 100; }, function (x) { return x.occBud * 100; }],
      revpar: [function (x) { return x.adr * x.occ; }, function (x) { return x.adrLy * x.occLy; }, function (x) { return x.adrBud * x.occBud; }]
    }[metric];
    var vals = [];
    M.days.forEach(function (x) { vals.push(get[0](x)); if (state.show.ly) vals.push(get[1](x)); if (state.show.bud) vals.push(get[2](x)); });
    var top = metric === "occ" ? 100 : Math.ceil(Math.max.apply(null, vals) * 1.12 / 10000) * 10000;
    var steps = metric === "occ" ? 5 : top / 10000;
    function x(i) { return L + (W - L - R) * i / (n - 1); }
    function y(v) { return T + (H - T - B) * (1 - v / top); }
    var g = "";
    for (var k = 0; k <= steps; k++) { var v = top * k / steps; g += '<line class="ohx-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ohx-axis" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (metric === "occ" ? v + "%" : v.toLocaleString()) + "</text>"; }
    M.days.forEach(function (dd, i) {
      g += '<line class="ohx-grid v" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
      g += '<text class="ohx-day' + (red(dd.d) ? " red" : "") + '" x="' + x(i) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + dd.d.getDate() + "</text>";
    });
    g += '<text class="ohx-axis" x="' + x(0) + '" y="' + (H - 6) + '" text-anchor="middle">' + (M.days[0].d.getMonth() + 1) + "月</text>";
    function line(fn, cls) {
      var solid = "", dash = "";
      M.days.forEach(function (dd, i) {
        var pt = x(i).toFixed(1) + " " + y(fn(dd)).toFixed(1);
        if (cls === "ty") {
          if (dd.past) solid += (solid ? "L" : "M") + pt;
          if (!dd.past || (M.days[i + 1] && !M.days[i + 1].past)) dash += (dash ? "L" : "M") + pt;
        } else solid += (solid ? "L" : "M") + pt;
      });
      return (solid ? '<path class="ohx-line ' + cls + '" d="' + solid + '"/>' : "") + (dash ? '<path class="ohx-line ' + cls + ' dash" d="' + dash + '"/>' : "");
    }
    if (state.show.bud) g += line(get[2], "bud");
    if (state.show.ly) g += line(get[1], "ly");
    if (state.show.ty) g += line(get[0], "ty");
    var di = Math.max(0, Math.min(n - 1, state.day == null ? 0 : state.day));
    var cur = M.days[di], cx = x(di);
    g += '<line class="ohx-cursor" x1="' + cx + '" x2="' + cx + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    if (state.show.ty) g += '<circle class="ohx-dot" cx="' + cx + '" cy="' + y(get[0](cur)) + '" r="7"/>';
    g += '<g class="ohx-handle" transform="translate(' + cx + "," + (H - B) + ')"><rect x="-22" y="-9" width="44" height="18" rx="9"/><circle r="6"/><path d="M-15 0l4-3v6zM15 0l-4-3v6z"/></g>';
    g += '<rect class="ohx-hit" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B + 20) + '"/>';
    var fmt = function (v) { return metric === "occ" ? v.toFixed(1) + "%" : Math.round(v).toLocaleString() + "円"; };
    var tip = '<b>' + (cur.d.getMonth() + 1) + "/" + cur.d.getDate() + "(" + WD[cur.d.getDay()] + ")" + (cur.past ? " 実績" : " オンハンド") + "</b>" +
      (state.show.ty ? '<span><i class="ty"></i>当年 ' + fmt(get[0](cur)) + "</span>" : "") +
      (!cur.past && metric === "occ" && state.show.ty ? '<span class="muted-dark">着地予測 ' + fmt(cur.occFc * 100) + "</span>" : "") +
      (state.show.ly ? '<span><i class="ly"></i>前年 ' + fmt(get[1](cur)) + "</span>" : "") + (state.show.bud ? '<span><i class="bud"></i>予算 ' + fmt(get[2](cur)) + "</span>" : "");
    var left = (cx / W * 100);
    return '<div class="ohx-plot" tabindex="0" aria-label="グラフ。左右キーで日付を移動"><svg class="ohx-svg" viewBox="0 0 ' + W + " " + H + '" data-n="' + n + '" data-l="' + L + '" data-r="' + R + '" role="img" aria-label="日別の推移">' + g + "</svg>" +
      '<div class="ohx-tip" style="left:' + Math.min(82, Math.max(2, left - 9)) + '%">' + tip + "</div></div>";
  }

  function render(el) {
    var cfg = O.onhandConfig(), facs = (O.FACILITIES || []).filter(function (f) { return cfg.facs.indexOf(f.id) > -1; });
    if (!state.fac || cfg.facs.indexOf(state.fac) < 0) state.fac = facs[0].id;
    if (!state.metric) state.metric = cfg.metric;
    var f = facs.filter(function (x) { return x.id === state.fac; })[0];
    var base = new Date(O.TODAY.getFullYear(), O.TODAY.getMonth() + state.month, 1), M = monthData(f, base), S = summary(M);
    if (state.day == null || state.day >= M.days.length) state.day = state.month === 0 ? O.TODAY.getDate() - 1 : 0;
    var r = rnd("open" + f.id), opened = (2016 + Math.floor(r() * 9)) + "年" + String(1 + Math.floor(r() * 12)).padStart(2, "0") + "月開業";
    var row = function (name, s, isOcc) {
      return '<tr><th scope="row">' + name + '</th><td class="num">' + (isOcc ? pc(s.bud) : yen(s.bud)) + '</td><td class="num">' + (isOcc ? pc(s.cur) + '<span class="sub">(' + Math.round(s.fc * 100) + "%)</span>" : yen(s.cur)) + "</td>" +
        '<td class="num ' + pctCls(s.vb) + '">' + pc(s.vb) + (isOcc ? '<span class="sub ' + pctCls(s.vbFc) + '">(' + Math.round(s.vbFc * 100) + "%)</span>" : "") + "</td>" +
        '<td class="num ' + pctCls(s.vl) + '">' + pc(s.vl) + (isOcc ? '<span class="sub ' + pctCls(s.vlFc) + '">(' + Math.round(s.vlFc * 100) + "%)</span>" : "") + "</td></tr>";
    };
    el.innerHTML = '<div class="ohx-top"><span class="ohx-title">' + icon("chart") + ' オンハンド</span><span class="ohx-upd">' + O.TODAY.getFullYear() + "年" + (O.TODAY.getMonth() + 1) + "月" + O.TODAY.getDate() + '日更新・サンプル</span>' +
      '<button class="icon-btn ghost" type="button" data-open-settings="home" aria-label="オンハンドの設定">' + icon("sliders") + "</button></div>" +
      '<div class="ohx-pick"><label class="ohx-select"><select data-ohx-fac aria-label="施設">' + facs.map(function (x) { var rr = rnd("open" + x.id); return '<option value="' + x.id + '"' + (x.id === f.id ? " selected" : "") + ">" + esc(x.name) + "（" + (2016 + Math.floor(rr() * 9)) + "年" + String(1 + Math.floor(rr() * 12)).padStart(2, "0") + "月開業）</option>"; }).join("") + "</select>" + icon("down") + "</label>" +
      '<span class="ohx-month"><button class="icon-btn ghost" type="button" data-ohx-month="-1" aria-label="前の月"' + (state.month <= -3 ? " disabled" : "") + ">" + icon("back") + "</button><b>" + base.getFullYear() + "年" + (base.getMonth() + 1) + '月</b><button class="icon-btn ghost flip" type="button" data-ohx-month="1" aria-label="次の月"' + (state.month >= 5 ? " disabled" : "") + ">" + icon("back") + "</button></span></div>" +
      '<div class="ohx-table-wrap"><table class="ohx-table"><thead><tr><th></th><th class="num">予算</th><th class="num">現在(予測)</th><th class="num">予算比</th><th class="num">前年比</th></tr></thead><tbody>' +
      row("ADR", S.adr) + row("OCC", S.occ, true) + row("RevPAR", S.revpar) + '</tbody></table><p class="ohx-note">OCC のかっこ内は月末の着地予測。予算比・前年比は 100% 以上を緑、未満を赤で表示。</p></div>' +
      '<div class="ohx-tabs" role="tablist">' + [["adr", "ADR"], ["occ", "OCC"], ["revpar", "RevPAR"]].map(function (t) { return '<button type="button" role="tab" data-ohx-metric="' + t[0] + '" aria-selected="' + (state.metric === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div class="ohx-series">' + [["ty", "当年"], ["ly", "前年"], ["bud", "予算"]].map(function (s) { return '<button type="button" class="ohx-chip ' + s[0] + '" data-ohx-series="' + s[0] + '" aria-pressed="' + state.show[s[0]] + '"><i></i>' + s[1] + "</button>"; }).join("") +
      '<span class="ohx-legend"><span class="solid"></span>実績<span class="dashed"></span>オンハンド（今日以降）</span></div>' + chart(M, state.metric);
    el.setAttribute("data-opened", opened);
  }

  function wire(el) {
    el.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-ohx-metric]"))) { state.metric = t.getAttribute("data-ohx-metric"); return render(el); }
      if ((t = e.target.closest("[data-ohx-series]"))) { var k = t.getAttribute("data-ohx-series"); state.show[k] = !state.show[k]; if (!state.show.ty && !state.show.ly && !state.show.bud) state.show.ty = true; return render(el); }
      if ((t = e.target.closest("[data-ohx-month]"))) { state.month += +t.getAttribute("data-ohx-month"); state.day = null; return render(el); }
    });
    el.addEventListener("change", function (e) { if (e.target.matches("[data-ohx-fac]")) { state.fac = e.target.value; render(el); } });
    // Drag (or click) anywhere on the plot to move the day cursor; arrow keys work too
    var dragging = false;
    function pick(ev) {
      var svg = el.querySelector(".ohx-svg");
      if (!svg) return;
      var rc = svg.getBoundingClientRect(), vb = 900, n = +svg.getAttribute("data-n"), L = +svg.getAttribute("data-l"), R = +svg.getAttribute("data-r");
      var px = (ev.clientX - rc.left) / rc.width * vb, i = Math.round((px - L) / ((vb - L - R) / (n - 1)));
      i = Math.max(0, Math.min(n - 1, i));
      if (i !== state.day) { state.day = i; render(el); }
    }
    el.addEventListener("pointerdown", function (e) { if (e.target.closest(".ohx-svg")) { dragging = true; el.setPointerCapture && el.setPointerCapture(e.pointerId); pick(e); } });
    el.addEventListener("pointermove", function (e) { if (dragging) pick(e); });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("keydown", function (e) {
      if (!e.target.closest(".ohx-plot") || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); state.day += e.key === "ArrowLeft" ? -1 : 1; render(el); el.querySelector(".ohx-plot").focus();
    });
  }

  // Home section; "" unless turned on in Settings > Home
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
    state.metric = null;
    render(el); wire(el);
  };
})();
