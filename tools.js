/* ORCA tools modelled on the production screens: TODO board, competitor rates, rate parity,
   AI Weekly reports and review rankings. All data is generated sample data. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store, kpi = O.kpi, trend = O.trend;
  var TAU = Math.PI * 2;

  // ---------- Shared sample master data (fictional names) ----------
  var BRANDS = [
    { brand: "ブランドA", props: [["ishigaki", "石垣"], ["itoshima", "糸島"], ["yufuin", "由布院"]] },
    { brand: "ブランドB", props: [["shodoshima", "小豆島"], ["gotemba", "富士御殿場"]] },
    { brand: "ブランドC", props: [["kagoshima", "鹿児島天文館"], ["nagasaki", "長崎"], ["sapporo", "札幌すすきの"], ["takayama", "飛騨高山"]] },
    { brand: "ブランドD", props: [["hakodate", "函館"], ["ryogoku", "東京両国"], ["nippori", "東京西日暮里"], ["hiroshima", "広島"], ["takamatsu", "高松"], ["ise", "伊勢"], ["kumamoto", "熊本"]] }
  ];
  var PROPS = [];
  BRANDS.forEach(function (b) { b.props.forEach(function (p) { PROPS.push({ id: p[0], area: p[1], brand: b.brand, name: b.brand + " " + p[1] }); }); });
  function propById(id) { return PROPS.filter(function (p) { return p.id === id; })[0]; }
  function rnd(seed) { return O.rng(O.hash(String(seed))); }
  function baseRate(p) { return 14000 + (O.hash(p.id) % 14) * 1000; }
  function hm(d) { return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); }

  // Keyboard sequences: G then P -> parity, G then K -> competitor (as in production)
  var gAt = 0;
  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (e.metaKey || e.ctrlKey || e.altKey || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var k = e.key.toLowerCase();
    if (k === "g") { gAt = Date.now(); return; }
    if (Date.now() - gAt < 1200 && (k === "p" || k === "k")) { e.preventDefault(); e.stopImmediatePropagation(); gAt = 0; location.hash = k === "p" ? "#parity" : "#competitor"; }
  }, true);
  function kbd(keys) { return keys.map(function (k) { return "<kbd>" + k + "</kbd>"; }).join(""); }

  // ---------- Sidebar used by parity and reviews ----------
  function sideList(id, title, countLabel, withCounts) {
    return '<aside class="tool-side" id="' + id + '"><div class="side-head"><span class="side-title">' + title + '</span><span class="side-count">' + countLabel + "</span></div>" +
      '<label class="side-search">' + icon("search") + '<input type="search" placeholder="' + title + 'を検索" aria-label="' + title + 'を検索" data-side-q></label>' +
      '<div class="side-items"><button class="side-item" type="button" data-pick="all" aria-current="true"><span>全' + (title === "エリア" ? "エリア" : "施設") + "</span>" + (withCounts ? "<b>" + PROPS.length + "</b>" : "") + "</button>" +
      BRANDS.map(function (b) {
        return '<p class="side-group">' + b.brand + "</p>" + b.props.map(function (p) {
          var label = title === "エリア" ? p[1] : b.brand + " " + p[1];
          return '<button class="side-item" type="button" data-pick="' + p[0] + '" data-label="' + esc(label) + '"><span>' + esc(label) + "</span>" + (withCounts ? "<b>1</b>" : "") + "</button>";
        }).join("");
      }).join("") + "</div></aside>";
  }
  function wireSide(root, sel, onPick) {
    var side = root.querySelector(sel);
    side.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (!b) return;
      side.querySelectorAll("[data-pick]").forEach(function (x) { x.removeAttribute("aria-current"); });
      b.setAttribute("aria-current", "true");
      onPick(b.getAttribute("data-pick"));
    });
    side.querySelector("[data-side-q]").addEventListener("input", function (e) {
      var q = e.target.value.trim();
      side.querySelectorAll(".side-item[data-label]").forEach(function (x) { x.hidden = q && x.getAttribute("data-label").indexOf(q) < 0; });
    });
  }

  // ================= TODO (board / list) =================
  var PROJECTS = ["グッズ制作PJ", "新プランLP", "伊勢開業PJ", "小豆島PJ", "由布院PJ"];
  var LABELS = ["制作", "販促", "OTA", "開業", "社内"];
  var TODO_SEED = [
    ["グッズ制作PJ", "イベントスペース用のグッズを取りまとめる", 0, "高", "制作", "Teams日次", -6, [], true],
    ["新プランLP", "新プランのLPを修正する", 1, "高", "販促", "議事録", -7, ["料金早見表の反映"], true],
    ["新プランLP", "LP用の手書きサイン素材を支給する", 3, "中", "制作", "Teams日次", -1, [], true],
    ["新プランLP", "LPの正式版制作を制作会社へ依頼する", 6, "中", "制作", "議事録", -8, [], true],
    ["新プランLP", "LPの公開日を関係者へ連絡する", 9, "低", "社内", "Teams日次", -2, [], false],
    ["伊勢開業PJ", "OTAベストワード（1行目）をまとめる", -2, "高", "OTA", "議事録", -3, [], true],
    ["伊勢開業PJ", "カルーセル・間取り図・KVの方向性を制作会社へ回答", 0, "高", "制作", "Teams日次", -1, [], true],
    ["伊勢開業PJ", "開業告知チラシ（A4・開業記念30%オフ）を作成", 5, "中", "販促", "議事録", -4, ["地元飲食店への設置を段取り"], false],
    ["伊勢開業PJ", "客室写真の撮影日程を確定する", 8, "中", "開業", "Teams日次", -2, [], false],
    ["小豆島PJ", "海外向け10%OFFページの一次納品を確認し返答", 2, "高", "OTA", "Teams日次", -5, [], true],
    ["小豆島PJ", "スーペリアツインのベッド表記を修正", 1, "中", "OTA", "Teams日次", -9, [], true],
    ["小豆島PJ", "島外向けチラシと島民割POPを作成する", 7, "中", "販促", "Teams日次", -12, ["島外向けを先に納品する"], true],
    ["小豆島PJ", "冬季の営業時間を公式サイトに反映", 12, "低", "社内", "議事録", -3, [], false],
    ["由布院PJ", "公式サイトの施設ページを公開前の内容に切り替える", 1, "高", "販促", "議事録", -8, [], true],
    ["由布院PJ", "空港の掲出物の最終版を確認する", 4, "中", "販促", "議事録", -8, [], true],
    ["由布院PJ", "PVのコピー表現を再検討する", 10, "低", "制作", "議事録", -16, [], true],
    ["由布院PJ", "サウナサインの設置有無を確認", -1, "中", "開業", "Teams日次", -4, [], false],
    ["グッズ制作PJ", "ノベルティの見積もりを3社から取る", 5, "中", "制作", "議事録", -3, [], false],
    ["グッズ制作PJ", "グッズ在庫の置き場所を決める", 14, "低", "社内", "Teams日次", -1, [], false],
    ["伊勢開業PJ", "開業日の取材対応者を決める", 11, "中", "開業", "議事録", -2, [], false],
    ["小豆島PJ", "フェリー会社との共同企画を相談", 16, "低", "販促", "議事録", -6, [], false],
    ["由布院PJ", "連泊プランの料金を見直す", 3, "中", "OTA", "Teams日次", -1, [], false],
    ["新プランLP", "LPのアクセス解析タグを設置", 6, "低", "社内", "議事録", -3, [], false]
  ];
  function todos() {
    var list = store.get("todos", null);
    if (!list || !list.length || !list[0].project) {
      list = TODO_SEED.map(function (x, i) {
        return { id: "s" + i, project: x[0], text: x[1], due: O.iso(O.addDays(O.TODAY, x[2])), pri: x[3], label: x[4],
          src: x[5] + " " + O.iso(O.addDays(O.TODAY, x[6])), subs: x[7].map(function (t) { return { t: t, done: false }; }), ai: x[8], done: false };
      });
      store.set("todos", list);
    }
    return list;
  }
  O.openTodoCount = function () { return todos().filter(function (t) { return !t.done; }).length; };

  O.VIEWS.todo = function () {
    return O.pageHead("todo") +
      '<div class="tool-bar"><span class="tool-bar-meta" id="tdOpen"></span><span class="seg" role="group" aria-label="表示"><button type="button" data-mode="list" aria-pressed="false">' + icon("todo") + 'リスト</button><button type="button" data-mode="board" aria-pressed="true">' + icon("library") + "看板</button></span></div>" +
      '<div class="filters"><span class="filter-ico">' + icon("search") + '</span><input class="f-input" id="tdQ" placeholder="題・説明・ラベル" aria-label="検索">' +
      '<label class="f-select"><select id="tdLabel" aria-label="ラベル"><option value="">ラベル</option>' + LABELS.map(function (l) { return "<option>" + l + "</option>"; }).join("") + "</select></label>" +
      '<label class="f-select"><select id="tdDue" aria-label="期限"><option value="">期限: すべて</option><option value="over">期限: 期限切れ</option><option value="today">期限: 今日</option><option value="week">期限: 7日以内</option></select></label>' +
      '<label class="f-select"><select id="tdPri" aria-label="優先度"><option value="">優先度: すべて</option><option>高</option><option>中</option><option>低</option></select></label>' +
      '<label class="f-check"><input type="checkbox" id="tdDone"> 完了済みも表示</label><span class="f-count" id="tdCount"></span></div>' +
      '<div id="tdBody"></div>';
  };
  O.AFTER.todo = function (root) {
    var mode = store.get("todoMode", "board");
    function dueInfo(t) {
      var diff = Math.round((new Date(t.due + "T00:00:00") - O.TODAY) / 864e5);
      var d = new Date(t.due + "T00:00:00");
      return { diff: diff, label: (d.getMonth() + 1) + "/" + d.getDate(), hot: !t.done && diff <= 1 };
    }
    function visible() {
      var q = root.querySelector("#tdQ").value.trim(), lb = root.querySelector("#tdLabel").value, du = root.querySelector("#tdDue").value,
        pr = root.querySelector("#tdPri").value, showDone = root.querySelector("#tdDone").checked;
      return todos().filter(function (t) {
        var di = dueInfo(t).diff;
        return (showDone || !t.done) && (!q || (t.text + t.label + t.project + t.subs.map(function (s) { return s.t; }).join("")).indexOf(q) > -1) &&
          (!lb || t.label === lb) && (!pr || t.pri === pr) &&
          (!du || (du === "over" ? di < 0 : du === "today" ? di === 0 : di >= 0 && di <= 7));
      });
    }
    function card(t) {
      var di = dueInfo(t);
      return '<article class="tcard' + (t.done ? " done" : "") + '" data-id="' + t.id + '">' +
        '<div class="tcard-main"><button class="tick" type="button" data-act="toggle" aria-pressed="' + t.done + '" aria-label="完了にする">' + icon("check") + "</button>" +
        '<div class="tcard-body"><p class="tcard-title">' + esc(t.text) + "</p>" +
        t.subs.map(function (s, i) { return '<label class="tsub"><input type="checkbox" data-sub="' + i + '"' + (s.done ? " checked" : "") + "> " + esc(s.t) + "</label>"; }).join("") +
        '<p class="tmeta"><span class="pill ' + (di.hot ? "bad" : di.diff < 0 ? "bad" : "") + '">' + icon("moon") + di.label + "</span>" +
        '<span class="tsrc">' + icon("agents") + esc(t.src) + '</span><span class="pri pri-' + t.pri + '">' + t.pri + "</span></p></div></div>" +
        (t.ai && !t.done ? '<div class="tcard-ai"><p>' + icon("agents") + 'AIがこのタスクを追加しました。</p><div><button class="btn-reject" type="button" data-act="reject">' + icon("x") + '追加を拒否</button><button class="btn-approve" type="button" data-act="approve">' + icon("check") + "承認</button></div></div>" : "") +
        "</article>";
    }
    function draw() {
      var list = visible(), open = todos().filter(function (t) { return !t.done; }).length;
      root.querySelector("#tdOpen").textContent = "未完了 " + open + " 件";
      root.querySelector("#tdCount").textContent = list.length + " 件";
      root.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode)); });
      var body = root.querySelector("#tdBody");
      if (mode === "board") {
        body.innerHTML = '<div class="board">' + PROJECTS.map(function (pj) {
          var items = list.filter(function (t) { return t.project === pj; });
          return '<section class="col"><header class="col-head"><h2>' + pj + '</h2><span class="col-count">' + items.length + '</span></header><div class="col-cards">' +
            items.map(card).join("") + '</div><form class="col-add" data-project="' + pj + '"><input placeholder="＋ カードを追加" aria-label="' + pj + 'にカードを追加"></form></section>';
        }).join("") + "</div>";
      } else {
        body.innerHTML = '<section class="card pad"><div class="table-wrap"><table class="todo-table"><thead><tr><th></th><th>タスク</th><th>プロジェクト</th><th>ラベル</th><th>優先度</th><th>期限</th><th>出典</th><th></th></tr></thead><tbody>' +
          list.sort(function (a, b) { return a.due.localeCompare(b.due); }).map(function (t) {
            var di = dueInfo(t);
            return '<tr data-id="' + t.id + '" class="' + (t.done ? "done" : "") + '"><td><button class="tick" type="button" data-act="toggle" aria-pressed="' + t.done + '" aria-label="完了にする">' + icon("check") + "</button></td>" +
              '<td class="wrap-cell">' + esc(t.text) + (t.ai && !t.done ? ' <span class="pill info">AI追加</span>' : "") + "</td><td>" + t.project + "</td><td>" + t.label + '</td><td><span class="pri pri-' + t.pri + '">' + t.pri + "</span></td>" +
              '<td><span class="pill ' + (di.hot || di.diff < 0 ? "bad" : "") + '">' + di.label + '</span></td><td class="muted">' + esc(t.src) + "</td>" +
              "<td>" + (t.ai && !t.done ? '<button class="btn-approve sm" type="button" data-act="approve">承認</button>' : "") + "</td></tr>";
          }).join("") + "</tbody></table></div></section>";
      }
      O.refreshBadges();
    }
    function update(id, fn) { var l = todos(); l.forEach(function (t) { if (t.id === id) fn(t); }); store.set("todos", l); }
    root.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mode]");
      if (m) { mode = m.getAttribute("data-mode"); store.set("todoMode", mode); return draw(); }
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var id = b.closest("[data-id]").getAttribute("data-id"), act = b.getAttribute("data-act");
      if (act === "toggle") update(id, function (t) { t.done = !t.done; });
      if (act === "approve") { update(id, function (t) { t.ai = false; }); O.toast("タスクを承認しました"); }
      if (act === "reject") { store.set("todos", todos().filter(function (t) { return t.id !== id; })); O.toast("AIが追加したタスクを取り消しました"); }
      draw();
    });
    root.addEventListener("change", function (e) {
      if (e.target.matches("[data-sub]")) { var id = e.target.closest("[data-id]").getAttribute("data-id"), i = +e.target.getAttribute("data-sub"), v = e.target.checked; update(id, function (t) { t.subs[i].done = v; }); return; }
      if (e.target.closest(".filters")) draw();
    });
    root.querySelector("#tdQ").addEventListener("input", draw);
    root.addEventListener("submit", function (e) {
      var f = e.target.closest(".col-add");
      if (!f) return;
      e.preventDefault();
      var input = f.querySelector("input"), text = input.value.trim();
      if (!text) return;
      var l = todos();
      l.push({ id: "u" + Date.now(), project: f.getAttribute("data-project"), text: text, due: O.iso(O.addDays(O.TODAY, 7)), pri: "中", label: "社内", src: "手入力 " + O.iso(O.TODAY), subs: [], ai: false, done: false });
      store.set("todos", l);
      draw();
      O.toast("カードを追加しました");
    });
    draw();
  };

  // ================= 競合調査 =================
  var AREAS = [
    { id: "ishigaki", name: "石垣島", own: "ブランドA 石垣", comps: ["近隣リゾートA", "シティホテルB", "近隣ホテルC（離島）", "リゾートD", "ホテルE", "アートホテルF", "ホテルG", "ホテルH", "ホテルI"] },
    { id: "yufuin", name: "由布院", own: "ブランドA 由布院", comps: ["温泉旅館A", "温泉旅館B", "ホテルC", "旅館D", "ホテルE"] },
    { id: "ise", name: "伊勢", own: "ブランドD 伊勢", comps: ["ホテルA", "旅館B", "ホテルC", "ホテルD"] },
    { id: "kagoshima", name: "鹿児島", own: "ブランドC 鹿児島天文館", comps: ["シティホテルA", "ホテルB", "ホテルC", "ホテルD", "ホテルE", "ホテルF"] },
    { id: "hakodate", name: "函館", own: "ブランドD 函館", comps: ["ホテルA", "ホテルB", "温泉ホテルC", "ホテルD"] }
  ];
  O.VIEWS.competitor = function () {
    var start = O.iso(O.addDays(O.TODAY, 31));
    return O.pageHead("competitor", { sub: "楽天トラベルの空室検索で、自社施設と競合の日別最安料金を比較（サンプル）", actions: '<a class="btn" href="#parity">' + icon("scale") + "パリティ判定へ " + kbd(["G", "P"]) + "</a>" }) +
      '<section class="cond card">' +
      '<div class="cond-row"><label class="field"><span>' + icon("integrations") + 'エリア</span><select id="ciArea">' + AREAS.map(function (a) { return '<option value="' + a.id + '">' + a.name + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span>開始日</span><input type="date" id="ciStart" value="' + start + '"></label>' +
      '<label class="field narrow"><span>日数</span><span class="unit-input"><input type="number" id="ciNights" min="1" max="14" value="5"><i>泊</i></span></label>' +
      '<label class="field narrow"><span>大人</span><span class="unit-input"><input type="number" id="ciAdults" min="1" max="6" value="2"><i>名</i></span></label>' +
      '<label class="field"><span>食事</span><select id="ciMeal"><option>最安プラン</option><option>素泊まり</option><option>朝食付き</option><option>2食付き</option></select></label>' +
      '<button class="btn btn-primary fetch" type="button" id="ciFetch">' + icon("search") + "料金を取得 <kbd>⌘Enter</kbd></button></div>" +
      '<p class="hint">' + icon("refresh") + 'OTA価格・部屋対応表は毎週月曜の朝に自動更新されます。 最終取得: <span id="ciLast"></span></p>' +
      '<div class="hotel-chips" id="ciChips"></div></section>' +
      '<div id="ciResult"></div>';
  };
  O.AFTER.competitor = function (root) {
    var off = {}, timer = null, loader = null;
    function area() { var id = root.querySelector("#ciArea").value; return AREAS.filter(function (a) { return a.id === id; })[0]; }
    function hotels() { var a = area(); return [a.own].concat(a.comps.filter(function (c) { return !off[a.id + c]; })); }
    function chips() {
      var a = area();
      root.querySelector("#ciChips").innerHTML = '<span class="hchip own">' + icon("star") + esc(a.own) + "</span>" +
        a.comps.map(function (c) { var on = !off[a.id + c]; return '<button class="hchip" type="button" data-hotel="' + esc(c) + '" aria-pressed="' + on + '">' + (on ? icon("check") : "") + esc(c) + "</button>"; }).join("");
      var last = store.get("ciLast_" + a.id, null);
      root.querySelector("#ciLast").textContent = last ? last : "まだありません";
    }
    function empty() {
      var n = hotels().length, nights = +root.querySelector("#ciNights").value || 1;
      root.querySelector("#ciResult").innerHTML = '<section class="empty-card">' + icon("search") + "<h2>料金を取得していません</h2><p>条件を選んで「料金を取得」を押すと、日別の最安を表示します。現在の条件（" + n + "施設 × " + nights + "泊）で約" + Math.round(n * nights * 1.7) + "秒かかります。</p></section>";
    }
    function results() {
      var a = area(), hs = hotels(), nights = +root.querySelector("#ciNights").value || 1, start = new Date(root.querySelector("#ciStart").value + "T00:00:00");
      var meal = root.querySelector("#ciMeal").value, mealK = { "最安プラン": 1, "素泊まり": 0.95, "朝食付き": 1.12, "2食付き": 1.38 }[meal];
      var rows = [];
      for (var i = 0; i < nights; i++) {
        var d = O.addDays(start, i), wk = d.getDay() === 6 ? 1.3 : d.getDay() === 5 ? 1.12 : 1;
        rows.push({ d: d, v: hs.map(function (h) { var r = rnd(a.id + h + O.iso(d)); return r() < 0.06 ? null : Math.round(18000 * wk * mealK * (0.75 + r() * 0.6) / 100) * 100; }) });
      }
      var own = rows.map(function (r) { return r.v[0]; }), mins = rows.map(function (r) { var c = r.v.slice(1).filter(function (x) { return x; }); return c.length ? Math.min.apply(null, c) : null; });
      var cheaper = rows.filter(function (r, i) { return own[i] && mins[i] && own[i] <= mins[i]; }).length;
      var avgDiff = rows.reduce(function (s, r, i) { return s + ((own[i] || 0) - (mins[i] || 0)); }, 0) / rows.length;
      root.querySelector("#ciResult").innerHTML =
        '<div class="kpis">' + kpi("対象", hs.length + "施設 × " + nights + "泊") + kpi("自社が最安の日", cheaper + " / " + nights + "日", cheaper ? "good" : "bad") +
        kpi("競合最安との平均差", (avgDiff > 0 ? "+" : "") + O.yen(avgDiff).replace("¥-", "-¥"), avgDiff > 0 ? "bad" : "good") + kpi("条件", esc(meal) + "・大人" + (+root.querySelector("#ciAdults").value) + "名") + "</div>" +
        (nights > 1 ? '<section class="card pad"><div class="section-head"><h2>最安料金の推移</h2>' + O.sampleNote() + "</div>" +
          O.lineChart([{ name: "自社", values: fill(own), cls: "s1" }, { name: "競合最安", values: fill(mins), cls: "s2" }], rows.map(function (r) { return O.md(r.d); }), function (v) { return "¥" + Math.round(v / 1000) + "k"; }) + "</section>" : "") +
        '<section class="card pad"><h2>日別の最安料金</h2><div class="table-wrap"><table class="rate-table"><thead><tr><th class="sticky">日付</th>' +
        hs.map(function (h, i) { return '<th class="num' + (i === 0 ? " own" : "") + '">' + (i === 0 ? icon("star") : "") + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (r, ri) {
          return '<tr><td class="sticky">' + O.mdw(r.d) + "</td>" + r.v.map(function (v, i) {
            if (!v) return '<td class="num muted">満室</td>';
            var cls = i === 0 ? (mins[ri] && v <= mins[ri] ? " good-cell" : " bad-cell") : (v === mins[ri] ? " min" : "");
            return '<td class="num' + cls + '">' + O.yen(v) + "</td>";
          }).join("") + "</tr>";
        }).join("") + '</tbody></table></div><p class="hint">自社の列は、競合最安以下なら緑、上回っていれば赤。競合の最安値は青で示します。</p></section>';
    }
    // Sold-out days have no price; carry the nearest known value so the line stays readable
    function fill(arr) {
      var out = arr.slice(), last = null, i;
      for (i = 0; i < out.length; i++) { if (out[i]) last = out[i]; else out[i] = last; }
      for (i = out.length - 1; i >= 0; i--) { if (out[i]) last = out[i]; else out[i] = last; }
      return out.map(function (v) { return v || 0; });
    }
    function fetch() {
      clearTimeout(timer);
      if (loader) loader.stop();
      var n = hotels().length, nights = +root.querySelector("#ciNights").value || 1, total = 3200, t0 = Date.now();
      root.querySelector("#ciResult").innerHTML = '<section class="empty-card loading"><canvas class="orca-loader" aria-hidden="true"></canvas><h2>料金を取得しています</h2><p>' + n + "施設 × " + nights + '泊を検索中（デモのため短縮しています）</p><div class="progress"><i id="ciBar"></i></div></section>';
      loader = O.loader(root.querySelector(".orca-loader"));
      (function tick() {
        var bar = root.querySelector("#ciBar");
        if (!bar) return;
        var p = Math.min(1, (Date.now() - t0) / total);
        bar.style.width = (p * 100).toFixed(1) + "%";
        if (p < 1) { timer = setTimeout(tick, 60); return; }
        loader.stop();
        var now = new Date();
        store.set("ciLast_" + area().id, (now.getMonth() + 1) + "/" + now.getDate() + " " + hm(now));
        chips();
        results();
      })();
    }
    root.querySelector("#ciArea").addEventListener("change", function () { chips(); empty(); });
    ["#ciNights", "#ciStart", "#ciAdults", "#ciMeal"].forEach(function (s) { root.querySelector(s).addEventListener("change", empty); });
    root.querySelector("#ciFetch").addEventListener("click", fetch);
    root.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); fetch(); } });
    root.querySelector("#ciChips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-hotel]");
      if (!b) return;
      var k = area().id + b.getAttribute("data-hotel");
      off[k] = !off[k];
      chips(); empty();
    });
    chips(); empty();
  };

  // ================= パリティ判定 =================
  var OTAS = ["Yahoo!トラベル", "楽天トラベル", "じゃらん", "一休", "Booking.com", "Expedia", "Agoda"];
  function parityData(scope) {
    var props = scope === "all" ? PROPS : [propById(scope)];
    var cells = [], days = 30;
    props.forEach(function (p) {
      var base = baseRate(p);
      for (var d = 1; d <= days; d++) {
        var r = rnd("par" + p.id + d);
        if (r() < 0.045) continue;                         // price not fetched for this cell
        var x = r(), kind = x < 0.72 ? "ng" : x < 0.87 ? "room" : x < 0.94 ? "ok" : "other";
        var off = Math.round(base * (0.9 + r() * 0.4) / 100) * 100, dev = kind === "ng" ? 0.01 + Math.pow(r(), 1.4) * 0.3 : 0;
        cells.push({ p: p, d: d, kind: kind, dev: dev, diff: Math.round(off * dev), ota: OTAS[Math.floor(Math.pow(r(), 1.6) * OTAS.length)] });
      }
    });
    return { props: props, cells: cells, planned: props.length * days };
  }
  function donut(parts) {
    var tot = parts.reduce(function (s, p) { return s + p.v; }, 0), a0 = -Math.PI / 2, R = 70, r = 48, out = "";
    parts.forEach(function (p) {
      var a1 = a0 + TAU * p.v / tot, large = a1 - a0 > Math.PI ? 1 : 0;
      var pt = function (rad, a) { return (100 + rad * Math.cos(a)).toFixed(2) + " " + (100 + rad * Math.sin(a)).toFixed(2); };
      out += '<path class="' + p.cls + '" d="M' + pt(R, a0) + " A" + R + " " + R + " 0 " + large + " 1 " + pt(R, a1) + " L" + pt(r, a1) + " A" + r + " " + r + " 0 " + large + " 0 " + pt(r, a0) + 'Z"/>';
      a0 = a1;
    });
    return '<svg class="donut" viewBox="0 0 200 200" role="img" aria-label="判定の内訳">' + out + '<text x="100" y="104" text-anchor="middle" class="donut-num">' + tot + '</text><text x="100" y="128" text-anchor="middle" class="donut-sub">チェック</text></svg>';
  }
  function hbars(rows, fmt) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; })) || 1;
    return '<div class="share">' + rows.map(function (r) {
      return '<div class="share-row"><span class="share-name">' + esc(r[0]) + '</span><span class="share-bar bad"><i style="width:' + (r[1] / mx * 100).toFixed(1) + '%"></i></span><span class="share-val">' + fmt(r) + "</span></div>";
    }).join("") + "</div>";
  }
  O.VIEWS.parity = function () {
    return O.pageHead("parity", { sub: "自社公式サイトが最安かを判定。ベストレート監視の Excel と同じ集計で書き出し（サンプル）", actions: '<a class="btn" href="#competitor">' + icon("binoculars") + "競合調査へ " + kbd(["G", "K"]) + "</a>" }) +
      '<div class="tool-layout">' + sideList("parSide", "エリア", PROPS.length + " / " + PROPS.length + " エリア", true) + '<div class="tool-main" id="parMain"></div></div>';
  };
  O.AFTER.parity = function (root) {
    var scope = "all", metric = "count", version = 0;
    function draw() {
      var D = parityData(scope + (version ? "v" + version : "")), cells = D.cells;
      if (version) D = parityData(scope); // versions differ only in timestamp in this demo
      cells = D.cells;
      var n = cells.length, ng = cells.filter(function (c) { return c.kind === "ng"; });
      var cnt = function (k) { return cells.filter(function (c) { return c.kind === k; }).length; };
      var avgDev = ng.reduce(function (s, c) { return s + c.dev; }, 0) / (ng.length || 1);
      var avgDiff = ng.reduce(function (s, c) { return s + c.diff; }, 0) / (ng.length || 1);
      var impact = ng.reduce(function (s, c) { return s + c.diff; }, 0);
      var max = ng.reduce(function (m, c) { return c.diff > m.diff ? c : m; }, { diff: 0 });
      var missing = D.props.filter(function (p) { return !cells.some(function (c) { return c.p === p; }); });
      var bins = [[0, .05], [.05, .1], [.1, .15], [.15, .2], [.2, 9]].map(function (b) { return ng.filter(function (c) { return c.dev >= b[0] && c.dev < b[1]; }).length; });
      var binMax = Math.max.apply(null, bins) || 1;
      var otaRows = OTAS.map(function (o) { var l = ng.filter(function (c) { return c.ota === o; }); return [o, metric === "count" ? l.length : l.reduce(function (s, c) { return s + c.dev; }, 0) / (l.length || 1) * 100]; })
        .sort(function (a, b) { return b[1] - a[1]; });
      var brandRows = BRANDS.map(function (b) { var all = cells.filter(function (c) { return c.p.brand === b.brand; }); var bad = all.filter(function (c) { return c.kind === "ng"; }).length; return [b.brand + "（" + bad + "/" + all.length + "）", all.length ? bad / all.length * 100 : 0]; })
        .filter(function (r) { return r[0].indexOf("/0）") < 0; });
      var now = new Date(O.TODAY); now.setHours(20 - version * 24 % 24, 32);
      var label = scope === "all" ? "全エリア" : propById(scope).area;
      root.querySelector("#parMain").innerHTML =
        '<div class="scope-bar"><span class="scope-name">' + icon("integrations") + "<b>" + label + "</b> 自社" + D.props.length + '施設</span><span class="scope-meta">集計 ' + (O.TODAY.getMonth() + 1) + "/" + (O.TODAY.getDate() - version) + " 20:32　価格取得 " + (O.TODAY.getMonth() + 1) + "/" + (O.TODAY.getDate() - version) + " 06:30〜</span>" +
        '<label class="f-select"><select id="parVer" aria-label="過去バージョン"><option value="0">最新の集計</option><option value="1">1日前の集計</option><option value="2">2日前の集計</option></select></label>' +
        '<button class="btn btn-primary" type="button" id="parXls">' + icon("down") + "Excel書き出し</button></div>" +
        '<p class="tool-note">対象は明日から30日分で、エリアを変えると自動で再集計します。OTA価格は毎週月曜の朝に自動更新され、判定は保存済みの価格を使います。</p>' +
        (n < D.planned ? '<p class="info-banner">' + icon("feedback") + "OTA価格が届いている " + n + "/" + D.planned + " セル分だけで集計しています。" + (missing.length ? "未取得の施設: " + missing.map(function (p) { return p.name; }).join("、") : "") + "</p>" : "") +
        '<div class="kpis five">' +
        kpi("真NG（同室でOTAが安い）", icon("feedback") + ng.length, "bad", "全" + n + "チェック中（" + (ng.length / n * 100).toFixed(1) + "%）") +
        kpi("平均乖離%", (avgDev * 100).toFixed(1) + "%", "", "真NGの日の平均") +
        kpi("平均差額", O.yen(avgDiff), "", "真NG 1件あたり") +
        kpi("期間中の合計インパクト", O.yen(impact), "", D.props.length + "施設 × 30日程") +
        kpi("最大差額", O.yen(max.diff), "", max.p ? esc(max.p.name) + "　" + O.md(O.addDays(O.TODAY, max.d)) : "") + "</div>" +
        '<div class="grid-2 tight"><section class="card pad"><h2>判定の内訳 <span class="muted">全' + n + 'チェック</span></h2><div class="donut-wrap">' +
        donut([{ v: cnt("ng"), cls: "c-ng" }, { v: cnt("room"), cls: "c-room" }, { v: cnt("ok"), cls: "c-ok" }, { v: cnt("other"), cls: "c-other" }]) +
        '<div class="legend-table">' + [["c-ng", "真NG（同室でOTA安）", cnt("ng")], ["c-room", "要確認（部屋相違）", cnt("room")], ["c-ok", "公式が最安", cnt("ok")], ["c-other", "その他", cnt("other")]].map(function (r) {
          return '<div><i class="sw-dot ' + r[0] + '"></i><span>' + r[1] + '</span><b>' + r[2] + '<small>/' + n + "</small></b><em>" + (r[2] / n * 100).toFixed(1) + "%</em></div>";
        }).join("") + "</div></div></section>" +
        '<section class="card pad"><h2>乖離率の分布 <span class="muted">真NG ' + ng.length + '件</span></h2><div class="hist">' +
        bins.map(function (v, i) { return '<div class="hist-col"><span class="hist-val">' + v + '</span><span class="hist-bar"><i style="height:' + (v / binMax * 100).toFixed(1) + '%"></i></span><span class="hist-lab">' + ["0-5%", "5-10%", "10-15%", "15-20%", "20%+"][i] + "</span></div>"; }).join("") + "</div></section></div>" +
        '<div class="grid-2 tight"><section class="card pad"><div class="section-head"><h2>公式を下回るOTA <span class="muted">全NG ' + ng.length + '件中</span></h2><span class="seg" role="group" aria-label="表示"><button type="button" data-metric="count" aria-pressed="' + (metric === "count") + '">真NG件数</button><button type="button" data-metric="dev" aria-pressed="' + (metric === "dev") + '">平均乖離%</button></span></div>' +
        hbars(otaRows, function (r) { return metric === "count" ? r[1] + "/" + ng.length + "件" : r[1].toFixed(1) + "%"; }) + "</section>" +
        '<section class="card pad"><h2>ブランド別 真NG率 <span class="muted">分母: 各ブランドのチェック数</span></h2>' + hbars(brandRows, function (r) { return Math.round(r[1]) + "%"; }) + "</section></div>";
      root.querySelector("#parVer").value = String(version);
      root.querySelector("#parVer").addEventListener("change", function (e) { version = +e.target.value; draw(); O.toast(version ? version + "日前の集計を表示しています" : "最新の集計に戻しました"); });
      root.querySelector("#parXls").addEventListener("click", function () { exportCsv(D, label); });
    }
    function exportCsv(D, label) {
      var kinds = { ng: "真NG", room: "要確認（部屋相違）", ok: "公式が最安", other: "その他" };
      var lines = [["施設", "宿泊日", "判定", "乖離率", "差額", "最安OTA"].join(",")].concat(D.cells.map(function (c) {
        return [c.p.name, O.iso(O.addDays(O.TODAY, c.d)), kinds[c.kind], (c.dev * 100).toFixed(1) + "%", c.diff, c.kind === "ng" ? c.ota : ""].join(",");
      }));
      var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ORCA_parity_" + (scope === "all" ? "all" : scope) + "_" + O.iso(O.TODAY) + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
      O.toast("Excel で開ける CSV を書き出しました（サンプル）");
    }
    root.addEventListener("click", function (e) {
      var m = e.target.closest("[data-metric]");
      if (m) { metric = m.getAttribute("data-metric"); draw(); }
    });
    wireSide(root, "#parSide", function (id) { scope = id; draw(); });
    draw();
  };

  // ================= AI Weekly レポート =================
  function weeks(n) {
    var out = [], end = O.addDays(O.TODAY, -((O.TODAY.getDay() + 2) % 7) - 5); // most recent Friday a week back
    for (var i = 0; i < n; i++) {
      var e = O.addDays(end, -7 * i), s = O.addDays(e, -6), wk = Math.ceil(e.getDate() / 7);
      out.push({ i: i, start: s, end: e, label: (e.getMonth() + 1) + "月W" + wk, year: e.getFullYear() });
    }
    return out;
  }
  function reportHtml(w) {
    var r = O.rng(4000 + w.i), occ = 0.7 + r() * 0.12, adr = 21000 + r() * 3000, occD = (r() - 0.4) * 0.06, adrD = (r() - 0.45) * 0.08;
    var best = PROPS[Math.floor(r() * PROPS.length)], weak = PROPS[Math.floor(r() * PROPS.length)];
    return { occ: occ, adr: adr, occD: occD, adrD: adrD,
      body: "<h3>今週のまとめ</h3><ul><li><strong>" + esc(best.name) + "</strong> は週末の稼働が伸び、全施設で最も高い RevPAR になりました。</li>" +
        "<li><strong>" + esc(weak.name) + "</strong> は平日の稼働が前週より下がっています。連泊割の露出を増やす余地があります。</li>" +
        "<li>レートパリティの真NGは " + (300 + Math.floor(r() * 200)) + " 件。Yahoo!トラベルと楽天トラベルが多くを占めます。</li>" +
        "<li>口コミの気になる点は「部屋・設備」「チェックイン」が上位でした。</li></ul>" +
        "<h3>来週のアクション</h3><ul><li>" + esc(weak.name) + " の平日向けプランを公式サイトで上位表示する</li><li>真NGの大きい施設から OTA 管理画面で料金を修正する</li><li>評価 3 以下の口コミへ返信する</li></ul>" };
  }
  O.VIEWS.weekly = function () { return O.pageHead("weekly") + '<div class="report-list" id="wkList"></div>'; };
  O.AFTER.weekly = function (root) {
    var W = weeks(10), list = root.querySelector("#wkList");
    function range(w) { return O.iso(w.start) + "〜" + O.iso(w.end); }
    function showList() {
      list.innerHTML = W.map(function (w) {
        return '<article class="report-card"><button class="report-open" type="button" data-open="' + w.i + '"><span class="report-ico">' + icon("library") + '</span><span class="row-body"><span class="report-title">' + w.label + '</span><span class="report-sub">' + w.year + ' 年 週次レポート</span><span class="row-sub">' + icon("moon") + range(w) + "　全" + PROPS.length + "施設</span></span>" + icon("chev", "chev") + "</button>" +
          '<button class="btn" type="button" data-word="' + w.i + '">' + icon("down") + "Word でダウンロード</button></article>";
      }).join("");
    }
    function showOne(i) {
      var w = W[i], R = reportHtml(w);
      list.innerHTML = '<button class="link-back" type="button" data-list>' + icon("back") + 'レポート一覧</button><article class="card pad report"><div class="section-head"><h2>' + w.label + "　" + w.year + ' 年 週次レポート</h2><button class="btn" type="button" data-word="' + i + '">' + icon("down") + "Word でダウンロード</button></div>" +
        '<p class="row-sub">' + range(w) + "　全" + PROPS.length + "施設（サンプル）</p>" +
        '<div class="kpis">' + kpi("稼働率", O.pct(R.occ), "", trend(R.occD) + (R.occD > 0 ? "+" : "") + (R.occD * 100).toFixed(1) + "pt 前週比") + kpi("ADR", O.yen(R.adr), "", trend(R.adrD) + (R.adrD > 0 ? "+" : "") + (R.adrD * 100).toFixed(1) + "% 前週比") +
        kpi("RevPAR", O.yen(R.adr * R.occ)) + kpi("新規口コミ", (40 + i * 3) + "件") + "</div>" + R.body + "</article>";
    }
    function word(i) {
      var w = W[i], R = reportHtml(w);
      var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + w.label + '</title></head><body style="font-family:Yu Gothic, sans-serif">' +
        "<h1>" + w.label + "　" + w.year + "年 週次レポート</h1><p>" + range(w) + "　全" + PROPS.length + "施設（サンプル）</p>" +
        "<p>稼働率 " + O.pct(R.occ) + "／ADR " + O.yen(R.adr) + "／RevPAR " + O.yen(R.adr * R.occ) + "</p>" + R.body + "</body></html>";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + html], { type: "application/msword" }));
      a.download = "ORCA_weekly_" + O.iso(w.start) + "_" + O.iso(w.end) + ".doc";
      document.body.appendChild(a); a.click(); a.remove();
      O.toast("Word ファイルを書き出しました（サンプル）");
    }
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-word]");
      if (b) return word(+b.getAttribute("data-word"));
      var o = e.target.closest("[data-open]");
      if (o) { showOne(+o.getAttribute("data-open")); document.querySelector(".main").scrollTop = 0; return; }
      if (e.target.closest("[data-list]")) showList();
    });
    showList();
  };

  // ================= 口コミ・ランキング分析 =================
  var CH = [["楽天", "#d64545"], ["じゃらん", "#e8892c"], ["一休", "#2b4bb8"], ["Google", "#1f9d68"], ["Booking.com", "#6e62e8"], ["Expedia", "#d9547a"]];
  var TOPICS = ["部屋・設備", "チェックイン・フロント", "食事", "清掃", "立地・アクセス", "その他"];
  var REVIEW_TEXT = {
    good: ["スタッフの対応が丁寧で、到着から気持ちよく過ごせました。", "客室が広く清潔で、窓からの景色も良かったです。", "朝食の地元食材がおいしく、また来たいと思いました。", "駅から近く、観光の拠点として便利でした。"],
    bad: ["チェックインに20分ほど待ちました。", "エアコンの音が気になって眠りが浅かったです。", "浴室の排水が遅く、清掃が行き届いていない印象でした。", "朝食会場が混雑していて席が見つかりませんでした。"]
  };
  function scoreOf(p, ch, wk) {
    var r = rnd("rv" + p.id + ch + (wk || 0));
    if (r() < 0.12) return null;
    var booking = ch === "Booking.com", s = (booking ? 4.25 : 4.1) + r() * 0.65, d = (r() - 0.5) * 0.24;
    return { s: s, d: Math.abs(d) < 0.04 ? 0 : d, n: 20 + Math.floor(r() * 700), rank: 1 + Math.floor(r() * 7), of: 2 + Math.floor(r() * 9), raw: booking ? (8.4 + r() * 0.9).toFixed(1) : null };
  }
  function issuesOf(p) {
    var r = rnd("iss" + p.id), k = 1 + Math.floor(r() * 3);
    if (r() < 0.12) return null;
    return TOPICS.slice(0, 4).sort(function () { return r() - 0.5; }).slice(0, k).map(function (t) { return [t, 15 + Math.floor(r() * 150)]; });
  }
  O.VIEWS.reviews = function () {
    return O.pageHead("reviews") +
      '<div class="tool-layout">' + sideList("rvSide", "施設", PROPS.length + " / " + PROPS.length + " 施設", false) +
      '<div class="tool-main"><div class="rv-top"><span class="seg tabs-seg" role="tablist" aria-label="表示">' +
      [["overview", "概要"], ["issues", "問題点"], ["list", "口コミ一覧"], ["form", "フォーム"]].map(function (t, i) { return '<button type="button" role="tab" data-rtab="' + t[0] + '" aria-pressed="' + (i === 0) + '">' + t[1] + "</button>"; }).join("") +
      '</span><span class="rv-desc">OTAの口コミ評価を自社と競合で比較。週次更新、本文の分析は自社のみ</span><span class="seg" role="group" aria-label="期間">' +
      ["最新", "直近4週", "直近12週", "直近1年", "全期間"].map(function (t, i) { return '<button type="button" data-period="' + i + '" aria-pressed="' + (i === 0) + '">' + t + "</button>"; }).join("") +
      '</span></div><div id="rvBody"></div></div></div>';
  };
  O.AFTER.reviews = function (root) {
    var tab = "overview", scope = "all", period = 0;
    var wkStart = O.addDays(O.TODAY, -((O.TODAY.getDay() + 6) % 7));
    function meta() {
      return '<p class="rv-meta"><span class="pill info">' + O.iso(wkStart) + " 週</span>スコア収集 " + O.md(wkStart) + " 07:55・本文収集 " + O.md(wkStart) + " 08:05・分析 " + O.md(wkStart) + " 08:30" + (period ? "　" + ["", "直近4週の平均", "直近12週の平均", "直近1年の平均", "全期間の平均"][period] : "") + "</p>";
    }
    function cell(v) {
      if (!v) return '<td class="muted">—</td>';
      var sc = v.s + (period ? (v.d * -period * 0.3) : 0);
      return '<td><span class="sc">' + sc.toFixed(2) + "</span>" + (v.d && !period ? '<span class="dl ' + (v.d > 0 ? "up" : "down") + '">' + icon(v.d > 0 ? "up" : "down") + Math.abs(v.d).toFixed(2) + "</span>" : "") +
        '<span class="row-sub">' + v.n + "件・" + v.rank + "位/" + v.of + "</span>" + (v.raw ? '<span class="row-sub">素点 ' + v.raw + "/10</span>" : "") + "</td>";
    }
    function overview() {
      var props = scope === "all" ? PROPS : [propById(scope)];
      var rows = props.map(function (p) {
        var vals = CH.map(function (c) { return scoreOf(p, c[0]); }), got = vals.filter(function (v) { return v; });
        var avg = got.length ? got.reduce(function (s, v) { return s + v.s; }, 0) / got.length : null, iss = issuesOf(p);
        return '<tr><th class="sticky own-row" scope="row">' + icon("star") + "<b>" + esc(p.name) + '</b><span class="muted">' + esc(p.area) + "</span></th>" +
          (avg ? '<td><span class="sc">' + avg.toFixed(2) + '</span><span class="row-sub">' + got.length + "チャネルの平均</span></td>" : '<td class="muted">—</td>') +
          vals.map(cell).join("") + "<td>" + (iss ? iss.map(function (x) { return '<span class="issue">' + x[0] + "<b>" + x[1] + "件</b></span>"; }).join("") : '<span class="issue ok">' + icon("check") + "ネガ言及なし</span>") + "</td></tr>";
      });
      var comp = "";
      if (scope !== "all") {
        var p = propById(scope);
        comp = '<section class="card pad"><h2>' + esc(p.area) + " エリアの競合比較</h2>" + '<div class="table-wrap"><table class="rv-table"><thead><tr><th class="sticky">施設</th>' + CH.map(function (c) { return '<th><i class="ch-dot" style="background:' + c[1] + '"></i>' + c[0] + "</th>"; }).join("") + "</tr></thead><tbody>" +
          ["自社", "競合A", "競合B", "競合C"].map(function (n, i) {
            return '<tr><th class="sticky' + (i === 0 ? " own-row" : "") + '" scope="row">' + (i === 0 ? icon("star") + "<b>" + esc(p.name) + "</b>" : esc(p.area) + " " + n) + "</th>" + CH.map(function (c) { return cell(scoreOf({ id: p.id + n }, c[0])); }).join("") + "</tr>";
          }).join("") + "</tbody></table></div></section>";
      }
      return meta() + '<p class="hint">' + icon("integrations") + "横にスクロールできます。全" + (CH.length + 3) + "列、施設名は左に固定</p>" +
        '<section class="card flush"><div class="table-wrap"><table class="rv-table"><thead><tr><th class="sticky">施設</th><th>平均</th>' +
        CH.map(function (c) { return '<th><i class="ch-dot" style="background:' + c[1] + '"></i>' + c[0] + "</th>"; }).join("") + "<th>今週の気になる点</th></tr></thead><tbody>" + rows.join("") + "</tbody></table></div></section>" + comp;
    }
    function issues() {
      var props = scope === "all" ? PROPS : [propById(scope)], r = rnd("issues" + scope + period);
      var rows = TOPICS.map(function (t) { var n = Math.round(props.length * (20 + r() * 120) / (scope === "all" ? 3 : 1)); return { t: t, n: n, d: Math.round((r() - 0.45) * 30) }; }).sort(function (a, b) { return b.n - a.n; });
      var mx = rows[0].n;
      return meta() + '<section class="card pad"><h2>トピック別のネガティブ言及</h2><div class="share">' + rows.map(function (x) {
        return '<div class="share-row wide"><span class="share-name">' + x.t + '</span><span class="share-bar bad"><i style="width:' + (x.n / mx * 100).toFixed(1) + '%"></i></span><span class="share-val">' + x.n + '件</span><span class="delta-txt ' + (x.d > 0 ? "bad" : "good") + '">' + (x.d > 0 ? "+" : "") + x.d + "% 前週比</span></div>";
      }).join("") + '</div></section><section class="card pad"><h2>代表的な声</h2>' + REVIEW_TEXT.bad.map(function (q, i) {
        return '<blockquote class="quote"><span class="pill bad">' + TOPICS[[1, 0, 3, 2][i]] + "</span>" + esc(q) + "</blockquote>";
      }).join("") + "</section>";
    }
    function reviewList() {
      var props = scope === "all" ? PROPS : [propById(scope)], out = [];
      for (var i = 0; i < 18; i++) {
        var r = rnd("rl" + scope + i), p = props[Math.floor(r() * props.length)], good = r() < 0.65, ch = CH[Math.floor(r() * CH.length)];
        out.push({ p: p, ch: ch, star: good ? 4 + Math.round(r()) : 2 + Math.round(r()), text: (good ? REVIEW_TEXT.good : REVIEW_TEXT.bad)[Math.floor(r() * 4)], d: O.addDays(O.TODAY, -Math.floor(r() * 28)) });
      }
      out.sort(function (a, b) { return b.d - a.d; });
      return '<div class="filter" role="group" aria-label="評価で絞り込み"><button class="chip" type="button" data-star="0" aria-pressed="true">すべて</button><button class="chip" type="button" data-star="low" aria-pressed="false">★3以下</button><button class="chip" type="button" data-star="high" aria-pressed="false">★4以上</button></div>' +
        '<div class="rows" id="rvList">' + out.map(function (x) {
          return '<article class="row review" data-s="' + x.star + '"><span class="row-body"><span class="row-title wrap"><span class="stars">' + "★★★★★".slice(0, x.star) + '<i>' + "★★★★★".slice(x.star) + "</i></span>" + esc(x.text) + '</span><span class="row-sub"><i class="ch-dot" style="background:' + x.ch[1] + '"></i>' + x.ch[0] + "・" + esc(x.p.name) + "・" + O.mdw(x.d) + "</span></span></article>";
        }).join("") + "</div>";
    }
    function form() {
      var n = 40 + (O.hash(scope) % 80);
      return '<section class="card pad"><div class="section-head"><h2>宿泊者アンケート</h2><span class="pill info">回答 ' + n + ' 件</span></div><p class="hint">チェックアウト後にメールで送るアンケートです。回答は口コミ分析に合算されます（サンプル）。</p>' +
        '<ol class="form-q"><li>総合的な満足度を教えてください（5段階）</li><li>客室・設備の満足度（5段階）</li><li>スタッフの対応の満足度（5段階）</li><li>朝食の満足度（5段階・朝食利用者のみ）</li><li>ご意見・ご要望（自由記述）</li></ol>' +
        '<div class="form-foot"><span class="hint">アンケートのURLを宿泊者向けメールに差し込みます。</span><button class="btn" type="button" data-copy>URLをコピー</button></div></section>';
    }
    function draw() {
      var body = root.querySelector("#rvBody");
      body.innerHTML = tab === "overview" ? overview() : tab === "issues" ? issues() : tab === "list" ? reviewList() : form();
    }
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-rtab]"), p = e.target.closest("[data-period]"), s = e.target.closest("[data-star]");
      if (t) { tab = t.getAttribute("data-rtab"); root.querySelectorAll("[data-rtab]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); }); return draw(); }
      if (p) { period = +p.getAttribute("data-period"); root.querySelectorAll("[data-period]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === p)); }); return draw(); }
      if (s) {
        var v = s.getAttribute("data-star");
        root.querySelectorAll("[data-star]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === s)); });
        root.querySelectorAll("#rvList .review").forEach(function (r) { var n = +r.getAttribute("data-s"); r.hidden = v === "low" ? n > 3 : v === "high" ? n < 4 : false; });
        return;
      }
      if (e.target.closest("[data-copy]")) {
        var url = location.origin + location.pathname + "#survey-" + scope;
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { O.toast("アンケートのURLをコピーしました"); }, function () { O.toast(url); });
        else O.toast(url);
      }
    });
    wireSide(root, "#rvSide", function (id) { scope = id; draw(); });
    draw();
  };
})();
