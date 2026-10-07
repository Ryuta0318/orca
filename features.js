/* ORCA features: the eleven tools from the current ORCA home, running on sample data. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store;

  // Order and number keys follow the current ORCA home
  O.FEATURES = [
    { id: "chat", key: 1, title: "ORCA チャット", sub: "社内のナレッジから質問に回答", icon: "chats", group: "agents", tone: "blue" },
    { id: "todo", key: 2, title: "TODO", sub: "チャットから拾ったタスクの管理とリマインド", icon: "todo", group: "agents", tone: "blue" },
    { id: "competitor", key: 3, title: "競合調査", sub: "自社と競合の日別最安料金を比較", icon: "binoculars", group: "agents", tone: "coral" },
    { id: "parity", key: 4, title: "パリティ判定", sub: "公式サイトの料金が最安かを OTA と照合", icon: "scale", group: "agents", tone: "mint" },
    { id: "weekly", key: 5, title: "AI Weekly レポート", sub: "1週間の動きをまとめた週次レポート", icon: "report", group: "library", tone: "rose" },
    { id: "reviews", key: 6, title: "口コミ・ランキング分析", sub: "OTA の口コミ評価とランキングの推移を競合と比較", icon: "star", group: "agents", tone: "blue" },
    { id: "bc", key: 7, title: "BC画像検索", sub: "Brand&Creative の素材画像をタグで検索", icon: "image", group: "library", tone: "violet" },
    { id: "manual", key: 8, title: "オペマニュアル", sub: "清掃手順や緊急時対応など現場向けの手順書", icon: "book", group: "library", tone: "coral" },
    { id: "rm", key: 9, title: "RM ポリシー・台帳", sub: "販売価格・プラン・OTA 掲載の決まりと台帳", icon: "ledger", group: "library", tone: "mint" },
    { id: "dashboard", title: "ダッシュボード", sub: "施設別の室夜・稼働率・ADR・RevPAR", icon: "chart", group: "agents", tone: "rose" },
    { id: "night", title: "夜タスク依頼", sub: "依頼を夜間に実行し、翌朝に結果を受け取る", icon: "moon", group: "agents", tone: "blue" },
    { id: "news", title: "今日のホテルニュース", sub: "業界ニュースの要約", icon: "news", group: "library", tone: "violet" }
  ];
  O.feature = function (id) { return O.FEATURES.filter(function (f) { return f.id === id; })[0]; };

  function sampleNote() { return '<span class="sample-chip">サンプルデータ</span>'; }
  function propSelect(id, withAll, value) {
    return '<label class="field"><span>施設</span><select id="' + id + '">' +
      (withAll ? '<option value="all">全施設</option>' : "") +
      O.PROPS.map(function (p) { return '<option value="' + p.id + '"' + (p.id === value ? " selected" : "") + ">" + p.name + "</option>"; }).join("") +
      "</select></label>";
  }
  function prop(id) { return O.PROPS.filter(function (p) { return p.id === id; })[0] || O.PROPS[0]; }
  function trend(delta, goodWhenUp) {
    var up = delta > 0, flat = Math.abs(delta) < 1e-9;
    var good = flat ? "" : (up === (goodWhenUp !== false) ? "good" : "bad");
    return '<span class="delta ' + good + '">' + icon(flat ? "flat" : up ? "up" : "down") + "</span>";
  }

  // ================= TODO =================
  var TODO_SEED = [
    { t: "由布院の秋プラン、公式サイトの掲載文を更新", due: 0, src: "チャット", done: false },
    { t: "高山の清掃チェックリストを新フォーマットに差し替え", due: 1, src: "チャット", done: false },
    { t: "伊勢のレートパリティ NG（Agoda）を確認", due: 0, src: "パリティ判定", done: false },
    { t: "週次レポートの競合コメントを追記", due: 2, src: "AI Weekly", done: false },
    { t: "鹿児島の口コミ返信（3件）", due: 3, src: "口コミ分析", done: false },
    { t: "札幌の冬季料金を RM 台帳に記録", due: -1, src: "チャット", done: true }
  ];
  function todos() {
    var list = store.get("todos", null);
    if (!list) {
      list = TODO_SEED.map(function (x, i) { return { id: "s" + i, text: x.t, due: O.iso(O.addDays(O.TODAY, x.due)), src: x.src, done: x.done }; });
      store.set("todos", list);
    }
    return list;
  }
  O.openTodoCount = function () { return todos().filter(function (t) { return !t.done; }).length; };
  function todoItem(t) {
    var due = new Date(t.due + "T00:00:00");
    var diff = Math.round((due - O.TODAY) / 864e5);
    var label = diff === 0 ? "今日" : diff === 1 ? "明日" : diff < 0 ? Math.abs(diff) + "日超過" : O.mdw(due);
    var cls = t.done ? "" : diff < 0 ? "bad" : diff === 0 ? "warn" : "";
    return '<li class="todo' + (t.done ? " done" : "") + '" data-id="' + t.id + '">' +
      '<button class="tick" type="button" data-act="toggle" aria-pressed="' + t.done + '" aria-label="完了にする">' + icon("check") + "</button>" +
      '<span class="row-body"><span class="todo-text">' + esc(t.text) + '</span><span class="row-sub">' + esc(t.src) + "</span></span>" +
      '<span class="pill ' + cls + '">' + label + "</span>" +
      '<button class="icon-btn ghost" type="button" data-act="del" aria-label="削除">' + icon("trash") + "</button></li>";
  }
  O.VIEWS.todo = function () {
    return O.pageHead("todo") +
      '<form class="toolbar card" id="todoForm">' +
      '<label class="field grow"><span>タスク</span><input id="todoText" required placeholder="例: 由布院の連泊プランを見直す" autocomplete="off"></label>' +
      '<label class="field"><span>期限</span><input id="todoDue" type="date" value="' + O.iso(O.TODAY) + '"></label>' +
      '<button class="btn btn-primary" type="submit">' + icon("plus") + "追加</button></form>" +
      '<div class="filter" role="group" aria-label="表示"><button class="chip" type="button" data-f="open" aria-pressed="true">未完了</button><button class="chip" type="button" data-f="done" aria-pressed="false">完了</button><button class="chip" type="button" data-f="all" aria-pressed="false">すべて</button></div>' +
      '<ul class="todo-list card" id="todoList"></ul>';
  };
  O.AFTER.todo = function (root) {
    var filter = "open";
    function draw() {
      var list = todos().filter(function (t) { return filter === "all" || (filter === "done" ? t.done : !t.done); })
        .sort(function (a, b) { return a.done - b.done || a.due.localeCompare(b.due); });
      root.querySelector("#todoList").innerHTML = list.length ? list.map(todoItem).join("") :
        '<li class="empty">' + (filter === "done" ? "完了したタスクはまだありません。" : "未完了のタスクはありません。上の入力欄から追加できます。") + "</li>";
      O.refreshBadges();
    }
    root.querySelector("#todoForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = root.querySelector("#todoText");
      var list = todos();
      list.unshift({ id: "t" + Date.now(), text: text.value.trim(), due: root.querySelector("#todoDue").value || O.iso(O.TODAY), src: "手入力", done: false });
      store.set("todos", list);
      text.value = "";
      filter = "open";
      root.querySelectorAll("[data-f]").forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-f") === "open")); });
      draw();
      O.toast("タスクを追加しました");
    });
    root.addEventListener("click", function (e) {
      var f = e.target.closest("[data-f]");
      if (f) {
        filter = f.getAttribute("data-f");
        root.querySelectorAll("[data-f]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === f)); });
        return draw();
      }
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var id = b.closest("li").getAttribute("data-id");
      var list = todos();
      if (b.getAttribute("data-act") === "toggle") {
        list.forEach(function (t) { if (t.id === id) t.done = !t.done; });
      } else {
        list = list.filter(function (t) { return t.id !== id; });
        O.toast("タスクを削除しました");
      }
      store.set("todos", list);
      draw();
    });
    draw();
  };

  // ================= 競合調査 =================
  function rates(p, days) {
    var out = [];
    for (var i = 0; i < days; i++) {
      var d = O.addDays(O.TODAY, i);
      var r = O.rng(O.hash(p.id + O.iso(d)));
      var wk = d.getDay() === 6 ? 1.28 : d.getDay() === 5 ? 1.12 : d.getDay() === 0 ? 1.05 : 1;
      var own = Math.round(p.base * wk * (0.92 + r() * 0.16) / 100) * 100;
      var comp = O.COMPETITORS.map(function () { return Math.round(p.base * wk * (0.86 + r() * 0.26) / 100) * 100; });
      out.push({ date: d, own: own, comp: comp, min: Math.min.apply(null, comp) });
    }
    return out;
  }
  O.VIEWS.competitor = function () {
    return O.pageHead("competitor") +
      '<div class="toolbar">' + propSelect("cProp", false, "yufuin") +
      '<label class="field"><span>期間</span><select id="cDays"><option value="14">14日間</option><option value="30">30日間</option></select></label></div>' +
      '<div id="cBody"></div>';
  };
  O.AFTER.competitor = function (root) {
    function draw() {
      var p = prop(root.querySelector("#cProp").value), data = rates(p, +root.querySelector("#cDays").value);
      var t = data[0], cheaper = data.filter(function (d) { return d.own <= d.min; }).length;
      root.querySelector("#cBody").innerHTML =
        '<div class="kpis">' +
        kpi("本日の自社最安", O.yen(t.own)) + kpi("本日の競合最安", O.yen(t.min)) +
        kpi("差額", (t.own - t.min > 0 ? "+" : "") + O.yen(t.own - t.min).replace("¥-", "-¥"), t.own > t.min ? "bad" : "good") +
        kpi("自社が最安の日", cheaper + " / " + data.length + "日") + "</div>" +
        '<section class="card pad">' + '<div class="section-head"><h2>最安料金の推移</h2>' + sampleNote() + "</div>" +
        O.lineChart([{ name: "自社", values: data.map(function (d) { return d.own; }), cls: "s1" }, { name: "競合最安", values: data.map(function (d) { return d.min; }), cls: "s2" }],
          data.map(function (d) { return O.md(d.date); }), function (v) { return "¥" + (v / 1000).toFixed(0) + "k"; }) + "</section>" +
        '<section class="card pad"><h2>日別の比較</h2><div class="table-wrap"><table><thead><tr><th>日付</th><th class="num">自社</th>' +
        O.COMPETITORS.map(function (c) { return '<th class="num">' + c + "</th>"; }).join("") + '<th class="num">競合最安との差</th></tr></thead><tbody>' +
        data.map(function (d) {
          var diff = d.own - d.min;
          return "<tr><td>" + O.mdw(d.date) + '</td><td class="num strong">' + O.yen(d.own) + "</td>" +
            d.comp.map(function (c) { return '<td class="num' + (c === d.min ? " min" : "") + '">' + O.yen(c) + "</td>"; }).join("") +
            '<td class="num"><span class="pill ' + (diff > 0 ? "bad" : "good") + '">' + (diff > 0 ? "+" + O.yen(diff) : diff === 0 ? "同額" : "-" + O.yen(-diff)) + "</span></td></tr>";
        }).join("") + "</tbody></table></div></section>";
    }
    root.querySelector("#cProp").addEventListener("change", draw);
    root.querySelector("#cDays").addEventListener("change", draw);
    draw();
  };
  function kpi(label, value, state, note) {
    return '<div class="kpi"><span class="kpi-label">' + label + '</span><span class="kpi-value ' + (state || "") + '">' + value + "</span>" + (note ? '<span class="kpi-note">' + note + "</span>" : "") + "</div>";
  }

  // ================= パリティ判定 =================
  var PLANS = ["素泊まり", "朝食付き", "2食付き", "連泊割"];
  O.VIEWS.parity = function () {
    var opts = "";
    for (var i = 0; i < 14; i++) { var d = O.addDays(O.TODAY, i); opts += '<option value="' + i + '">' + O.mdw(d) + "</option>"; }
    return O.pageHead("parity") +
      '<div class="toolbar">' + propSelect("pProp", false, "ise") +
      '<label class="field"><span>宿泊日</span><select id="pDay">' + opts + "</select></label>" +
      '<button class="btn" type="button" id="pRun">' + icon("refresh") + "再チェック</button></div><div id=\"pBody\"></div>";
  };
  O.AFTER.parity = function (root) {
    var checkedAt = new Date();
    function draw() {
      var p = prop(root.querySelector("#pProp").value), day = +root.querySelector("#pDay").value;
      var ng = 0, rows = PLANS.map(function (plan, pi) {
        var r = O.rng(O.hash(p.id + day + plan));
        var off = Math.round(p.base * (1 + pi * 0.18) / 100) * 100;
        var cells = O.CHANNELS.slice(1).map(function () {
          var v = Math.round(off * (r() < 0.18 ? 0.95 + r() * 0.03 : 1 + r() * 0.08) / 100) * 100;
          return v;
        });
        var lower = cells.filter(function (v) { return v < off; }).length;
        if (lower) ng++;
        return "<tr><td>" + plan + '</td><td class="num strong">' + O.yen(off) + "</td>" +
          cells.map(function (v) { return '<td class="num' + (v < off ? " ng" : "") + '">' + O.yen(v) + "</td>"; }).join("") +
          '<td><span class="pill ' + (lower ? "bad" : "good") + '">' + (lower ? "要確認（" + lower + "件）" : "公式が最安") + "</span></td></tr>";
      });
      root.querySelector("#pBody").innerHTML =
        '<div class="kpis">' + kpi("チェックしたプラン", PLANS.length + "件") + kpi("公式が最安", (PLANS.length - ng) + "件", "good") +
        kpi("要確認", ng + "件", ng ? "bad" : "") + kpi("最終チェック", checkedAt.getHours() + ":" + String(checkedAt.getMinutes()).padStart(2, "0")) + "</div>" +
        '<section class="card pad"><div class="section-head"><h2>' + p.name + "・" + O.mdw(O.addDays(O.TODAY, day)) + " の照合結果</h2>" + sampleNote() + "</div>" +
        '<div class="table-wrap"><table><thead><tr><th>プラン</th>' + O.CHANNELS.map(function (c) { return '<th class="num">' + c + "</th>"; }).join("") + "<th>判定</th></tr></thead><tbody>" +
        rows.join("") + '</tbody></table></div><p class="hint">赤字は公式サイトより安く掲載されている OTA です。</p></section>';
    }
    root.querySelector("#pProp").addEventListener("change", draw);
    root.querySelector("#pDay").addEventListener("change", draw);
    root.querySelector("#pRun").addEventListener("click", function () { checkedAt = new Date(); draw(); O.toast("照合し直しました"); });
    draw();
  };

  // ================= 口コミ・ランキング =================
  O.VIEWS.reviews = function () {
    return O.pageHead("reviews") + '<div class="toolbar">' + propSelect("rProp", false, "kagoshima") + '</div><div id="rBody"></div>';
  };
  O.AFTER.reviews = function (root) {
    function draw() {
      var p = prop(root.querySelector("#rProp").value);
      var ota = ["楽天トラベル", "じゃらん", "Booking.com", "Expedia", "Google"];
      var who = ["自社"].concat(O.COMPETITORS);
      var rows = ota.map(function (o) {
        var r = O.rng(O.hash(p.id + o));
        var scale = o === "Booking.com" ? 10 : 5;
        var hist = [];
        var s = scale === 10 ? 8.2 + r() * 1.2 : 4.1 + r() * 0.6;
        for (var m = 0; m < 6; m++) { s += (r() - 0.45) * (scale === 10 ? 0.15 : 0.06); hist.push(+s.toFixed(scale === 10 ? 1 : 2)); }
        var rank = 1 + Math.floor(r() * 12), prev = Math.max(1, rank + Math.round((r() - 0.5) * 6));
        var comps = O.COMPETITORS.map(function () { return +(scale === 10 ? 7.8 + r() * 1.4 : 3.9 + r() * 0.7).toFixed(scale === 10 ? 1 : 2); });
        return { o: o, scale: scale, hist: hist, now: hist[5], d: hist[5] - hist[4], rank: rank, prev: prev, count: 120 + Math.floor(r() * 900), comps: comps };
      });
      root.querySelector("#rBody").innerHTML =
        '<section class="card pad"><div class="section-head"><h2>' + p.name + " の口コミとエリア内ランキング</h2>" + sampleNote() + "</div>" +
        '<div class="table-wrap"><table><thead><tr><th>サイト</th><th class="num">評価</th><th>前月比</th><th>6か月の推移</th><th class="num">件数</th><th class="num">エリア順位</th>' +
        O.COMPETITORS.map(function (c) { return '<th class="num">' + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (x) {
          return "<tr><td>" + x.o + '</td><td class="num strong">' + x.now + '<span class="unit">/' + x.scale + "</span></td><td>" + trend(x.d) + (x.d > 0 ? "+" : "") + x.d.toFixed(x.scale === 10 ? 1 : 2) +
            "</td><td>" + O.spark(x.hist) + '</td><td class="num">' + x.count.toLocaleString() + '</td><td class="num">' + x.rank + "位 " + trend(x.prev - x.rank) + "</td>" +
            x.comps.map(function (c) { return '<td class="num' + (c > x.now ? " ng" : "") + '">' + c + "</td>"; }).join("") + "</tr>";
        }).join("") + '</tbody></table></div><p class="hint">競合の評価が自社を上回っている箇所を赤字で示しています。</p></section>';
    }
    root.querySelector("#rProp").addEventListener("change", draw);
    draw();
  };

  // ================= AI Weekly レポート =================
  O.VIEWS.weekly = function () {
    var opts = "";
    for (var w = 0; w < 4; w++) {
      var end = O.addDays(O.TODAY, -((O.TODAY.getDay() + 6) % 7) - 1 - w * 7), start = O.addDays(end, -6);
      opts += '<option value="' + w + '">' + O.md(start) + "〜" + O.md(end) + (w === 0 ? "（先週）" : "") + "</option>";
    }
    return O.pageHead("weekly") + '<div class="toolbar"><label class="field"><span>対象週</span><select id="wWeek">' + opts + '</select></label></div><div id="wBody"></div>';
  };
  O.AFTER.weekly = function (root) {
    function draw() {
      var w = +root.querySelector("#wWeek").value, r = O.rng(1000 + w);
      var occ = 0.71 + r() * 0.12, adr = 21000 + r() * 3000, occD = (r() - 0.4) * 0.06, adrD = (r() - 0.45) * 0.08;
      var best = O.PROPS[Math.floor(r() * O.PROPS.length)], weak = O.PROPS[(O.PROPS.indexOf(best) + 2) % O.PROPS.length];
      root.querySelector("#wBody").innerHTML =
        '<div class="kpis">' + kpi("稼働率", O.pct(occ), "", trend(occD) + (occD > 0 ? "+" : "") + (occD * 100).toFixed(1) + "pt 前週比") +
        kpi("ADR", O.yen(adr), "", trend(adrD) + (adrD > 0 ? "+" : "") + (adrD * 100).toFixed(1) + "% 前週比") +
        kpi("RevPAR", O.yen(adr * occ)) + kpi("新規口コミ", (40 + Math.floor(r() * 30)) + "件") + "</div>" +
        '<article class="card pad report"><div class="section-head"><h2>今週のまとめ</h2>' + sampleNote() + "</div>" +
        "<ul><li><strong>" + best.name + "</strong> は週末の稼働が伸び、全施設で最も高い RevPAR になりました。</li>" +
        "<li><strong>" + weak.name + "</strong> は平日の稼働が前週より下がっています。連泊割の露出を増やす余地があります。</li>" +
        "<li>レートパリティで要確認が " + (1 + Math.floor(r() * 4)) + " 件ありました。いずれも Agoda の朝食付きプランです。</li>" +
        "<li>競合Bが週末料金を約 " + (5 + Math.floor(r() * 8)) + "% 引き上げました。</li></ul>" +
        "<h3>来週のアクション</h3><ul><li>" + weak.name + " の平日向けプランを公式サイトで上位表示する</li><li>パリティ要確認分を OTA 管理画面で修正する</li><li>評価 3 以下の口コミへ返信する</li></ul></article>";
    }
    root.querySelector("#wWeek").addEventListener("change", draw);
    draw();
  };

  // ================= BC画像検索 =================
  var BC_TAGS = ["外観", "客室", "料理", "温泉", "夜景", "ロビー", "季節", "ロゴ"];
  var BC_HUES = { "外観": [205, 30], "客室": [30, 25], "料理": [15, 45], "温泉": [190, 35], "夜景": [230, 40], "ロビー": [40, 20], "季節": [340, 35], "ロゴ": [215, 15] };
  function bcImages() {
    var out = [];
    O.PROPS.forEach(function (p) {
      BC_TAGS.forEach(function (t, i) {
        var r = O.rng(O.hash(p.id + t));
        if (r() < 0.25) return;
        var extra = BC_TAGS[(i + 1 + Math.floor(r() * 6)) % BC_TAGS.length];
        out.push({ id: p.id + "-" + i, title: p.name + " " + t + (r() < 0.5 ? "（横）" : "（縦）"), prop: p.name, tags: [t, extra], hue: BC_HUES[t], tall: r() < 0.4 });
      });
    });
    return out;
  }
  function bcArt(img) {
    var h = img.hue[0], s = img.hue[1];
    return 'style="background:radial-gradient(circle at 70% 25%, hsl(' + (h + 20) + " " + s + "% 88%), transparent 55%), linear-gradient(160deg, hsl(" + h + " " + s + "% 72%), hsl(" + (h + 15) + " " + (s + 10) + '% 34%))"';
  }
  O.VIEWS.bc = function () {
    return O.pageHead("bc") +
      '<div class="toolbar"><label class="field grow"><span>キーワード</span><input id="bcQ" placeholder="施設名やタグで検索（例: 由布院 温泉）" autocomplete="off"></label>' + propSelect("bcProp", true, "all") + "</div>" +
      '<div class="filter" role="group" aria-label="タグ">' + BC_TAGS.map(function (t) { return '<button class="chip" type="button" data-tag="' + t + '" aria-pressed="false">#' + t + "</button>"; }).join("") + "</div>" +
      '<p class="hint" id="bcCount"></p><div class="gallery" id="bcGrid"></div>' +
      '<div class="modal" id="bcModal" hidden><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="bcTitle"><button class="icon-btn modal-x" type="button" data-close aria-label="閉じる">' + icon("x") + '</button><div class="modal-art" id="bcArt"></div><h2 id="bcTitle"></h2><p class="row-sub" id="bcMeta"></p><button class="btn btn-primary" type="button" id="bcCopy">ファイル名をコピー</button></div></div>';
  };
  O.AFTER.bc = function (root) {
    var all = bcImages(), on = [];
    function draw() {
      var q = root.querySelector("#bcQ").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var pv = root.querySelector("#bcProp").value, pn = pv === "all" ? null : prop(pv).name;
      var hits = all.filter(function (img) {
        var hay = (img.title + " " + img.tags.join(" ")).toLowerCase();
        return (!pn || img.prop === pn) && on.every(function (t) { return img.tags.indexOf(t) > -1; }) && q.every(function (w) { return hay.indexOf(w) > -1; });
      });
      root.querySelector("#bcCount").textContent = hits.length + " 件の画像（サンプル。実際の画像は未接続）";
      root.querySelector("#bcGrid").innerHTML = hits.length ? hits.map(function (img) {
        return '<button class="shot' + (img.tall ? " tall" : "") + '" type="button" data-img="' + img.id + '"><span class="shot-art" ' + bcArt(img) + '></span><span class="shot-cap">' + esc(img.title) +
          '<span class="row-sub">' + img.tags.map(function (t) { return "#" + t; }).join(" ") + "</span></span></button>";
      }).join("") : '<p class="empty">条件に合う画像がありません。タグを外すか、別のキーワードで試してください。</p>';
    }
    root.querySelector("#bcQ").addEventListener("input", draw);
    root.querySelector("#bcProp").addEventListener("change", draw);
    var modal = root.querySelector("#bcModal"), current;
    root.addEventListener("click", function (e) {
      var tag = e.target.closest("[data-tag]");
      if (tag) {
        var t = tag.getAttribute("data-tag"), i = on.indexOf(t);
        if (i > -1) on.splice(i, 1); else on.push(t);
        tag.setAttribute("aria-pressed", String(i < 0));
        return draw();
      }
      var shot = e.target.closest("[data-img]");
      if (shot) {
        current = all.filter(function (x) { return x.id === shot.getAttribute("data-img"); })[0];
        root.querySelector("#bcArt").setAttribute("style", bcArt(current).slice(7, -1));
        root.querySelector("#bcTitle").textContent = current.title;
        root.querySelector("#bcMeta").textContent = current.prop + "・" + current.tags.map(function (t) { return "#" + t; }).join(" ") + "・BC_" + current.id + ".jpg";
        modal.hidden = false;
        root.querySelector("[data-close]").focus();
        return;
      }
      if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
      if (e.target.id === "bcCopy" && current) {
        var name = "BC_" + current.id + ".jpg";
        if (navigator.clipboard) navigator.clipboard.writeText(name).then(function () { O.toast(name + " をコピーしました"); }, function () { O.toast(name); });
        else O.toast(name);
      }
    });
    draw();
  };

  // ================= オペマニュアル =================
  var MANUAL = [
    { cat: "清掃", t: "客室清掃（チェックアウト後）", steps: ["窓を開けて換気し、ゴミとリネンを回収する", "浴室・洗面・トイレを上から下の順に清掃する", "ベッドメイク（シーツの角は 45 度で折り込む）", "アメニティと備品を定数どおり補充する", "床に掃除機をかけ、最後に照明・空調・テレビの動作を確認する", "チェックリストに記入して、フロントへ清掃完了を連絡する"] },
    { cat: "清掃", t: "大浴場の清掃", steps: ["清掃中の札を出し、入口を閉鎖する", "排水し、浴槽と床を専用洗剤でブラッシングする", "カラン・シャワーヘッド・桶と椅子を洗浄する", "脱衣所の床・洗面台・ドライヤーを清掃する", "給湯して湯温（41〜42℃）と残留塩素を測り、記録する"] },
    { cat: "フロント", t: "チェックイン対応", steps: ["予約名と人数を確認する", "宿泊者名簿への記入を依頼する（外国籍の方は旅券を確認して写しを保管）", "支払い方法を確認し、事前決済の有無を伝える", "館内設備・朝食時間・チェックアウト時刻を案内する", "鍵を渡し、客室まで案内またはエレベーター位置を伝える"] },
    { cat: "フロント", t: "忘れ物の取り扱い", steps: ["発見日時・場所・発見者を記録する", "貴重品は金庫で保管し、その他は忘れ物棚で 3 か月保管する", "予約情報から連絡先を確認し、宿泊者へ連絡する", "着払いでの発送を希望された場合は送付先を確認して発送する"] },
    { cat: "緊急時", t: "火災発生時", steps: ["大声で周囲に知らせ、火災報知器を押す", "119 番に通報する（施設名・住所・燃えている場所・逃げ遅れの有無）", "初期消火は天井に火が届く前まで。無理はしない", "館内放送で避難を呼びかけ、非常口へ誘導する（エレベーターは使わない）", "避難場所で宿泊者名簿と人数を照合し、消防に報告する"] },
    { cat: "緊急時", t: "地震発生時", steps: ["揺れている間は身の安全を確保し、宿泊者にも頭を守るよう呼びかける", "揺れが収まったら火の元・ガス・設備の被害を確認する", "館内放送で状況と今後の行動を案内する", "被害がある場合は避難場所へ誘導し、名簿で人数を確認する", "支配人と本部へ被害状況を報告する"] },
    { cat: "緊急時", t: "急病人への対応", steps: ["意識・呼吸を確認し、周囲に助けを求める", "必要に応じて 119 番通報と AED の手配をする", "同行者に既往歴・服用薬を確認する", "救急隊を入口から客室まで誘導する", "対応記録を作成し、支配人へ報告する"] },
    { cat: "設備", t: "停電時", steps: ["非常灯の点灯と、エレベーター内に閉じ込めがないかを確認する", "電力会社の停電情報を確認する", "宿泊者へ状況と見込みを案内し、懐中電灯を貸し出す", "冷蔵・冷凍品の温度を記録する", "復旧後に空調・給湯・POS・鍵システムの動作を確認する"] }
  ];
  O.VIEWS.manual = function () {
    var cats = ["すべて"].concat(MANUAL.map(function (m) { return m.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    return O.pageHead("manual") +
      '<div class="toolbar"><label class="field grow"><span>キーワード</span><input id="mQ" placeholder="例: 火災、ベッドメイク、忘れ物" autocomplete="off"></label></div>' +
      '<div class="filter" role="group" aria-label="カテゴリ">' + cats.map(function (c, i) { return '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="' + (i === 0) + '">' + c + "</button>"; }).join("") + "</div>" +
      '<div class="manuals" id="mList"></div>';
  };
  O.AFTER.manual = function (root) {
    var cat = "すべて";
    function draw() {
      var q = root.querySelector("#mQ").value.trim();
      var hits = MANUAL.filter(function (m) { return (cat === "すべて" || m.cat === cat) && (!q || (m.t + m.steps.join("")).indexOf(q) > -1); });
      root.querySelector("#mList").innerHTML = hits.length ? hits.map(function (m, i) {
        return '<details class="card manual"' + (q && i === 0 ? " open" : "") + '><summary><span class="pill">' + m.cat + "</span><span class=\"row-title\">" + esc(m.t) + "</span>" + icon("down", "chev") + "</summary><ol>" +
          m.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>";
      }).join("") : '<p class="empty">「' + esc(q) + "」を含む手順書はありません。</p>";
    }
    root.querySelector("#mQ").addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-cat]");
      if (!c) return;
      cat = c.getAttribute("data-cat");
      root.querySelectorAll("[data-cat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === c)); });
      draw();
    });
    draw();
  };

  // ================= RM ポリシー・台帳 =================
  var POLICIES = [
    { h: "販売価格", items: ["公式サイトの料金は、どの OTA よりも同額以下にする（パリティの原則）", "直前割（3 日前以降）は最大 20% まで。それ以上は RM 責任者の承認が必要", "繁忙期（GW・お盆・年末年始）の料金変更は前日 18 時までに台帳へ記録する"] },
    { h: "プラン", items: ["新プランは公式サイトで先行公開し、OTA へは 24 時間後に展開する", "朝食付き・2 食付きの差額は全 OTA で揃える", "連泊割は 2 泊以上、割引率は 5〜15% の範囲で設定する"] },
    { h: "OTA 掲載", items: ["写真は BC 画像の承認済み素材のみを使う", "掲載文は施設ごとのテンプレートから作成し、誇大な表現を避ける", "在庫は全チャネルで共有在庫とし、手動の締め切りは行わない"] }
  ];
  var LEDGER_SEED = [
    { d: -1, prop: "由布院", item: "週末料金", from: 32000, to: 34000, by: "鈴木", note: "競合B の値上げに追随" },
    { d: -2, prop: "高山", item: "連泊割", from: 0.1, to: 0.12, by: "山本", note: "平日稼働の底上げ", rate: true },
    { d: -3, prop: "伊勢", item: "朝食付き（Agoda）", from: 23500, to: 24800, by: "佐藤", note: "パリティ NG を修正" },
    { d: -5, prop: "札幌", item: "冬季料金", from: 15000, to: 18500, by: "鈴木", note: "雪まつり期間" },
    { d: -6, prop: "鹿児島", item: "直前割", from: 0.15, to: 0.2, by: "田中", note: "3 日前以降の空室対策", rate: true }
  ];
  function ledger() {
    var l = store.get("ledger", null);
    if (!l) {
      l = LEDGER_SEED.map(function (x, i) { return { id: "s" + i, date: O.iso(O.addDays(O.TODAY, x.d)), prop: x.prop, item: x.item, from: x.from, to: x.to, by: x.by, note: x.note, rate: !!x.rate }; });
      store.set("ledger", l);
    }
    return l;
  }
  function fmtVal(v, rate) { return rate ? Math.round(v * 100) + "%" : O.yen(v); }
  O.VIEWS.rm = function () {
    return O.pageHead("rm") +
      '<div class="tabs" role="tablist"><button class="tab" role="tab" type="button" data-tab="policy" aria-selected="true">ポリシー</button><button class="tab" role="tab" type="button" data-tab="ledger" aria-selected="false">台帳</button></div>' +
      '<div id="rmPolicy"><div class="policy-grid">' + POLICIES.map(function (p) {
        return '<section class="card pad"><h2>' + p.h + "</h2><ul>" + p.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></section>";
      }).join("") + "</div></div>" +
      '<div id="rmLedger" hidden>' +
      '<form class="toolbar card wrap" id="rmForm">' +
      '<label class="field"><span>施設</span><select id="rmProp">' + O.PROPS.map(function (p) { return "<option>" + p.name + "</option>"; }).join("") + "</select></label>" +
      '<label class="field grow"><span>項目</span><input id="rmItem" required placeholder="例: 週末料金"></label>' +
      '<label class="field"><span>変更前（円）</span><input id="rmFrom" type="number" min="0" step="100" required></label>' +
      '<label class="field"><span>変更後（円）</span><input id="rmTo" type="number" min="0" step="100" required></label>' +
      '<label class="field grow"><span>理由</span><input id="rmNote" placeholder="例: 競合の値上げに追随"></label>' +
      '<button class="btn btn-primary" type="submit">' + icon("plus") + "記録</button></form>" +
      '<div class="toolbar"><label class="field"><span>絞り込み</span><select id="rmFilter"><option value="">全施設</option>' + O.PROPS.map(function (p) { return "<option>" + p.name + "</option>"; }).join("") + "</select></label></div>" +
      '<section class="card pad"><div class="table-wrap"><table><thead><tr><th>日付</th><th>施設</th><th>項目</th><th class="num">変更前</th><th class="num">変更後</th><th>担当</th><th>理由</th></tr></thead><tbody id="rmRows"></tbody></table></div></section></div>';
  };
  O.AFTER.rm = function (root) {
    function draw() {
      var f = root.querySelector("#rmFilter").value;
      var rows = ledger().filter(function (x) { return !f || x.prop === f; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
      root.querySelector("#rmRows").innerHTML = rows.length ? rows.map(function (x) {
        var up = x.to > x.from;
        return "<tr><td>" + O.mdw(new Date(x.date + "T00:00:00")) + "</td><td>" + esc(x.prop) + "</td><td>" + esc(x.item) + '</td><td class="num">' + fmtVal(x.from, x.rate) +
          '</td><td class="num strong">' + fmtVal(x.to, x.rate) + " " + trend(up ? 1 : -1, true) + "</td><td>" + esc(x.by) + '</td><td class="muted">' + esc(x.note) + "</td></tr>";
      }).join("") : '<tr><td colspan="7" class="empty">この施設の記録はまだありません。</td></tr>';
    }
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]");
      if (!t) return;
      var led = t.getAttribute("data-tab") === "ledger";
      root.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b === t)); });
      root.querySelector("#rmPolicy").hidden = led;
      root.querySelector("#rmLedger").hidden = !led;
    });
    root.querySelector("#rmFilter").addEventListener("change", draw);
    root.querySelector("#rmForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var l = ledger();
      l.push({ id: "u" + Date.now(), date: O.iso(new Date()), prop: root.querySelector("#rmProp").value, item: root.querySelector("#rmItem").value.trim(),
        from: +root.querySelector("#rmFrom").value, to: +root.querySelector("#rmTo").value, by: "鈴木", note: root.querySelector("#rmNote").value.trim(), rate: false });
      store.set("ledger", l);
      e.target.reset();
      draw();
      O.toast("台帳に記録しました");
    });
    draw();
  };

  // ================= ダッシュボード =================
  function dayStats(p, d) {
    var r = O.rng(O.hash("kpi" + p.id + O.iso(d)));
    var rooms = { yufuin: 42, takayama: 60, ise: 55, kagoshima: 70, sapporo: 96 }[p.id];
    var wk = d.getDay() === 6 ? 0.16 : d.getDay() === 5 ? 0.08 : 0;
    var occ = Math.min(0.99, 0.62 + wk + r() * 0.22);
    var adr = p.base * (0.9 + wk + r() * 0.15);
    return { rooms: rooms, sold: Math.round(rooms * occ), adr: adr };
  }
  function monthAgg(props, y, m) {
    var days = new Date(y, m + 1, 0).getDate(), daily = [], tot = { avail: 0, sold: 0, rev: 0 };
    for (var i = 1; i <= days; i++) {
      var d = new Date(y, m, i), a = 0, s = 0, rev = 0;
      props.forEach(function (p) { var st = dayStats(p, d); a += st.rooms; s += st.sold; rev += st.sold * st.adr; });
      daily.push({ d: d, occ: s / a });
      tot.avail += a; tot.sold += s; tot.rev += rev;
    }
    return { daily: daily, sold: tot.sold, occ: tot.sold / tot.avail, adr: tot.rev / tot.sold, revpar: tot.rev / tot.avail };
  }
  O.VIEWS.dashboard = function () {
    var opts = "";
    for (var k = 0; k < 6; k++) { var d = new Date(O.TODAY.getFullYear(), O.TODAY.getMonth() - k, 1); opts += '<option value="' + d.getFullYear() + "-" + d.getMonth() + '">' + d.getFullYear() + "年" + (d.getMonth() + 1) + "月</option>"; }
    return O.pageHead("dashboard") + '<div class="toolbar">' + propSelect("dProp", true, "all") + '<label class="field"><span>月</span><select id="dMonth">' + opts + '</select></label></div><div id="dBody"></div>';
  };
  O.AFTER.dashboard = function (root) {
    function draw() {
      var pv = root.querySelector("#dProp").value, ym = root.querySelector("#dMonth").value.split("-");
      var y = +ym[0], m = +ym[1];
      var props = pv === "all" ? O.PROPS : [prop(pv)];
      var cur = monthAgg(props, y, m), ly = monthAgg(props, y - 1, m);
      function vs(a, b, isPt) { var dlt = isPt ? (a - b) * 100 : (a / b - 1) * 100; return trend(dlt) + (dlt > 0 ? "+" : "") + dlt.toFixed(1) + (isPt ? "pt" : "%") + " 前年比"; }
      root.querySelector("#dBody").innerHTML =
        '<div class="kpis">' + kpi("販売室数（室夜）", cur.sold.toLocaleString(), "", vs(cur.sold, ly.sold)) + kpi("稼働率", O.pct(cur.occ), "", vs(cur.occ, ly.occ, true)) +
        kpi("ADR", O.yen(cur.adr), "", vs(cur.adr, ly.adr)) + kpi("RevPAR", O.yen(cur.revpar), "", vs(cur.revpar, ly.revpar)) + "</div>" +
        '<section class="card pad"><div class="section-head"><h2>日別の稼働率</h2>' + sampleNote() + "</div>" +
        O.barChart(cur.daily.map(function (x) { return x.occ * 100; }), cur.daily.map(function (x) { return String(x.d.getDate()); }), function (v) { return Math.round(v) + "%"; }, 100) + "</section>" +
        (pv === "all" ? '<section class="card pad"><h2>施設別</h2><div class="table-wrap"><table><thead><tr><th>施設</th><th class="num">室夜</th><th class="num">稼働率</th><th class="num">ADR</th><th class="num">RevPAR</th></tr></thead><tbody>' +
          O.PROPS.map(function (p) { var a = monthAgg([p], y, m); return "<tr><td>" + p.name + '</td><td class="num">' + a.sold.toLocaleString() + '</td><td class="num">' + O.pct(a.occ) + '</td><td class="num">' + O.yen(a.adr) + '</td><td class="num strong">' + O.yen(a.revpar) + "</td></tr>"; }).join("") +
          "</tbody></table></div></section>" : "");
    }
    root.querySelector("#dProp").addEventListener("change", draw);
    root.querySelector("#dMonth").addEventListener("change", draw);
    draw();
  };

  // ================= 夜タスク依頼 =================
  function nightTasks() {
    var l = store.get("night", null);
    if (!l) {
      l = [{ id: "s0", text: "由布院と競合3施設の来月の週末料金を一覧にして", kind: "調査", at: O.iso(O.addDays(O.TODAY, -1)), status: "done",
        result: "来月の土曜日は、自社が競合最安より平均 ¥1,800 高い結果でした。詳細は競合調査ページで確認できます。" }];
      store.set("night", l);
    }
    return l;
  }
  O.VIEWS.night = function () {
    return O.pageHead("night") +
      '<form class="card pad night-form" id="nForm"><label class="field"><span>種類</span><select id="nKind"><option>調査</option><option>資料作成</option><option>集計</option><option>その他</option></select></label>' +
      '<label class="field"><span>依頼内容</span><textarea id="nText" rows="3" required placeholder="例: 高山の口コミから清掃に関する指摘を抜き出して、件数をまとめて"></textarea></label>' +
      '<div class="form-foot"><span class="hint">今夜 23:00 に実行し、翌朝 7:00 に結果が届く想定です（デモでは実行されません）。</span><button class="btn btn-primary" type="submit">依頼する</button></div></form>' +
      '<h2 class="list-head">依頼一覧</h2><div class="rows" id="nList"></div>';
  };
  O.AFTER.night = function (root) {
    function draw() {
      root.querySelector("#nList").innerHTML = nightTasks().slice().reverse().map(function (t) {
        var done = t.status === "done";
        return '<div class="row night"><span class="row-icon">' + icon(done ? "check" : "moon") + '</span><span class="row-body"><span class="row-title wrap">' + esc(t.text) + '</span><span class="row-sub">' +
          esc(t.kind) + "・" + O.mdw(new Date(t.at + "T00:00:00")) + " 依頼</span>" + (done ? '<p class="result">' + esc(t.result) + "</p>" : "") + "</span>" +
          '<span class="pill ' + (done ? "good" : "warn") + '">' + (done ? "完了" : "今夜実行") + "</span>" +
          (done ? "" : '<button class="icon-btn ghost" type="button" data-cancel="' + t.id + '" aria-label="取り消す">' + icon("x") + "</button>") + "</div>";
      }).join("");
    }
    root.querySelector("#nForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var l = nightTasks();
      l.push({ id: "n" + Date.now(), text: root.querySelector("#nText").value.trim(), kind: root.querySelector("#nKind").value, at: O.iso(O.TODAY), status: "queued" });
      store.set("night", l);
      root.querySelector("#nText").value = "";
      draw();
      O.toast("今夜の実行に登録しました");
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cancel]");
      if (!b) return;
      store.set("night", nightTasks().filter(function (t) { return t.id !== b.getAttribute("data-cancel"); }));
      draw();
      O.toast("依頼を取り消しました");
    });
    draw();
  };

  // ================= 今日のホテルニュース =================
  O.NEWS = [
    { src: "朝日新聞デジタル 経済", tag: "", t: "人手不足倒産、4年連続で過去最多 「人件費の高騰」が1.7倍に", s: "人手不足を理由とした企業倒産が4年連続で過去最多を記録。人件費の高騰が1.7倍となり、経営を圧迫している。" },
    { src: "NHK 経済", tag: "金融・REIT", t: "10年もの国債の表面利率3.1%に 約30年ぶりの水準 財務省", s: "10年物国債の表面利率が3.1%に引き上げられ、1996年8月以来約30年ぶりの高水準となった。" },
    { src: "観光経済新聞", tag: "", t: "「今後5〜10年で従業員減少」半数超の企業が見込む――日本生産性本部、AIと雇用の実態調査を公表", s: "企業の72.7%が全社的にAIを導入済み。5〜10年後に従業員数が減少すると予想している企業は半数超に上る。" }
  ];
  function newsItem(n) {
    return '<article class="news-item"><p class="news-src">' + (n.tag ? '<span class="pill warn">' + esc(n.tag) + "</span>" : "") + esc(n.src) + '</p><h3>' + esc(n.t) + "</h3><p>" + esc(n.s) + "</p></article>";
  }
  O.newsItem = newsItem;
  O.VIEWS.news = function () {
    return O.pageHead("news") +
      '<section class="card pad"><div class="section-head"><h2>' + (O.TODAY.getMonth() + 1) + "月" + O.TODAY.getDate() + "日(" + O.WD[O.TODAY.getDay()] + ")・" + O.NEWS.length + " 件</h2>" + sampleNote() + "</div>" +
      O.NEWS.map(newsItem).join("") + '<p class="hint">ニュースの自動取得と AI 要約は未接続です。表示しているのは現行 ORCA に掲載されていた記事の要約です。</p></section>';
  };
})();
