/* ORCA shell: navigation, home, chat, search, lists, integrations, settings and the router. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store;
  var MARK = "assets/orca-mark.webp";
  var ORB = "assets/orca-orb-soft.webp";

  var NAV = [
    { id: "home", label: "Home", icon: "home", fill: true },
    { id: "chat", label: "Chat", icon: "chat", fill: true },
    { id: "search", label: "Search", icon: "search" },
    { id: "agents", label: "Agents", icon: "agents", fill: true },
    { id: "library", label: "Library", icon: "library", fill: true },
    { id: "integrations", label: "Integrations", icon: "integrations" }
  ];
  var SECTIONS = {
    agents: { title: "Agents", sub: "日々の業務を、ORCAと一緒に。番号キー（1〜9）でも開けます。" },
    library: { title: "Library", sub: "必要な情報に、すぐアクセス。" },
    integrations: { title: "Integrations", sub: "いつものツールと、シームレスに。" },
    search: { title: "Search", sub: "機能・手順書・連携をまとめて探す" },
    settings: { title: "Settings", sub: "表示とデモデータの管理" }
  };

  // Simplified connector logos (24px grid)
  var LOGO = {
    slack: '<rect x="2" y="8" width="9" height="3.2" rx="1.6" fill="#36C5F0"/><circle cx="9.6" cy="4.6" r="1.6" fill="#36C5F0"/><rect x="12.8" y="2" width="3.2" height="9" rx="1.6" fill="#2EB67D"/><circle cx="19.4" cy="9.6" r="1.6" fill="#2EB67D"/><rect x="13" y="12.8" width="9" height="3.2" rx="1.6" fill="#ECB22E"/><circle cx="14.4" cy="19.4" r="1.6" fill="#ECB22E"/><rect x="8" y="13" width="3.2" height="9" rx="1.6" fill="#E01E5A"/><circle cx="4.6" cy="14.4" r="1.6" fill="#E01E5A"/>',
    notion: '<rect x="3.5" y="3" width="17" height="18" rx="2.5" fill="#fff" stroke="#111" stroke-width="1.6"/><path d="M8.5 7.5v9M8.5 7.5l7 9M15.5 7.5v9" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>',
    drive: '<path d="M8.3 3h7.4l6.3 11h-7.4z" fill="#FFBA00"/><path d="M8.3 3 2 14l3.7 6.5L12 9.5z" fill="#00AC47"/><path d="M5.7 20.5h12.6L22 14H9.4z" fill="#2684FC"/>',
    gmail: '<rect x="2.5" y="6" width="4" height="13" rx="1.2" fill="#4285F4"/><rect x="17.5" y="6" width="4" height="13" rx="1.2" fill="#34A853"/><path d="M4.2 7.4 12 13.4l7.8-6" fill="none" stroke="#EA4335" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>',
    salesforce: '<g fill="#00A1E0"><circle cx="8" cy="12.5" r="4.5"/><circle cx="12.5" cy="10" r="5"/><circle cx="17.2" cy="12.4" r="4.4"/><rect x="5" y="12" width="15" height="5.6" rx="2.8"/></g>',
    teams: '<circle cx="18.6" cy="7.6" r="2.4" fill="#7B83EB"/><rect x="14.5" y="10.5" width="7.5" height="8" rx="2.5" fill="#7B83EB"/><rect x="3" y="6" width="12.5" height="13" rx="2.5" fill="#5059C9"/><path d="M6.2 9.6h6.2M9.3 9.6v6.4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
    box: '<rect x="2" y="5" width="20" height="14" rx="4" fill="#0061D5"/><text x="12" y="15.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7.6" fill="#fff">box</text>',
    sharepoint: '<circle cx="12.5" cy="8.5" r="5.8" fill="#036C70"/><circle cx="16.8" cy="13.8" r="4.6" fill="#1A9BA1"/><circle cx="12.6" cy="18" r="3.6" fill="#37C6D0"/><rect x="2.5" y="7" width="10" height="10" rx="2" fill="#03787C"/><text x="7.5" y="14.6" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7.5" fill="#fff">S</text>'
  };
  function logo(key) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + LOGO[key] + "</svg>"; }
  var APPS = [
    { name: "Slack", key: "slack" }, { name: "Notion", key: "notion" }, { name: "Google Drive", key: "drive" },
    { name: "Gmail", key: "gmail" }, { name: "Salesforce", key: "salesforce" }, { name: "Microsoft Teams", key: "teams" },
    { name: "Box", key: "box" }, { name: "SharePoint", key: "sharepoint" }
  ];
  function connected() { return store.get("apps", ["Slack", "Notion", "Google Drive", "Gmail", "Salesforce", "Microsoft Teams"]); }

  var HISTORY = ["先週のプロジェクト資料を要約", "航空券連動チャネルの予約数", "宿泊者国籍割合", "由布院の予約初動状況", "由布院サウナサインの有無", "向こう一年の開業時期"];

  var view = document.getElementById("view");
  var shell = document.getElementById("shell");
  var welcome = document.getElementById("welcome");
  var toastEl = document.getElementById("toast");
  var toastTimer;

  O.toast = function (msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  };

  document.getElementById("nav").innerHTML = NAV.map(function (n) {
    return '<a class="nav-link" href="#' + n.id + '" data-view="' + n.id + '">' + icon(n.icon, n.fill ? "fillable" : "") + "<span>" + n.label + "</span></a>";
  }).join("");

  // ---------- Back button + page header ----------
  var depth = 0; // in-app navigations since load, so Back never leaves the site
  function parentOf(id) {
    var f = O.feature(id);
    if (f && id !== "chat") return f.group;
    return "home";
  }
  O.pageHead = function (id, opt) {
    opt = opt || {};
    var f = O.feature(id), s = SECTIONS[id] || {};
    var title = f ? f.title : s.title, sub = opt.sub || (f ? f.sub : s.sub);
    return '<div class="page-top"><button class="back" type="button" data-back>' + icon("back") + "<span>戻る</span></button></div>" +
      '<header class="page-head"><div class="page-title">' + (f ? '<span class="head-icon tone-' + f.tone + '">' + icon(f.icon) + "</span>" : "") +
      "<div><h1>" + esc(title) + '</h1><p class="page-sub">' + esc(sub) + "</p></div></div>" + (opt.actions ? '<div class="page-actions">' + opt.actions + "</div>" : "") + "</header>";
  };
  O.refreshBadges = function () {
    var n = O.openTodoCount();
    document.querySelectorAll("[data-badge=todo]").forEach(function (b) { b.textContent = n; b.hidden = !n; });
  };

  // ---------- Partials ----------
  function askBar(id, placeholder) {
    return '<form class="ask" data-ask><span class="clip">' + icon("clip") + "</span>" +
      '<input id="' + id + '" name="q" autocomplete="off" aria-label="質問" placeholder="' + placeholder + '">' +
      '<button class="send" type="submit" aria-label="送信">' + icon("arrow") + "</button></form>";
  }
  function featureRow(f) {
    return '<a class="row" href="#' + f.id + '"><span class="row-icon tone-' + f.tone + '">' + icon(f.icon) + '</span><span class="row-body"><span class="row-title">' +
      esc(f.title) + '</span><span class="row-sub">' + esc(f.sub) + "</span></span>" +
      (f.id === "todo" ? '<span class="badge" data-badge="todo"></span>' : "") + icon("chev", "chev") + "</a>";
  }
  function featureCard(f) {
    return '<a class="card-link" href="#' + f.id + '"><span class="row-icon tone-' + f.tone + '">' + icon(f.icon) + '</span><span class="row-body"><span class="row-title">' +
      esc(f.title) + (f.id === "todo" ? ' <span class="badge" data-badge="todo"></span>' : "") + '</span><span class="row-sub">' + esc(f.sub) + "</span></span>" +
      (f.key ? '<span class="kbd">' + f.key + "</span>" : "") + "</a>";
  }
  function quickTile(id, title, sub, tone, ic) {
    return '<a class="tile" href="#' + id + '"><span class="tile-icon tone-' + tone + '">' + icon(ic) + '</span><span class="tile-title">' + title + '</span><span class="tile-sub">' + sub + "</span></a>";
  }
  function orbitCard(big) {
    return '<a class="orbit' + (big ? " big" : "") + '" href="#integrations" aria-label="Integrations を開く"><span class="orbit-ring"></span><span class="orbit-ring r2"></span>' +
      APPS.map(function (a) { return '<span class="orbit-node" data-node>' + logo(a.key) + "</span>"; }).join("") +
      '<img class="orbit-mark" src="' + MARK + '" alt=""><span class="wordmark"></span></a>';
  }
  // Connector icons circle the mark on a tilted ellipse; nearer icons are larger and pass in front
  function animateOrbit(el) {
    var nodes = [].slice.call(el.querySelectorAll("[data-node]")), mark = el.querySelector(".orbit-mark");
    var still = O.reduceMotion();
    var t0 = performance.now();
    function frame(now) {
      if (!el.isConnected) return;
      var w = el.clientWidth, h = el.clientHeight, cx = w / 2, cy = h * 0.46;
      var rx = Math.min(w * 0.4, h * 0.62), ry = rx * 0.34, t = still ? 0 : (now - t0) / 1000;
      nodes.forEach(function (n, i) {
        var a = t * 0.45 + i * Math.PI * 2 / nodes.length, z = Math.sin(a);
        var sc = 0.72 + 0.32 * (z + 1) / 2;
        n.style.transform = "translate(" + (cx + rx * Math.cos(a)) + "px," + (cy + ry * z) + "px) translate(-50%,-50%) scale(" + sc.toFixed(3) + ")";
        n.style.zIndex = z > 0 ? 3 : 1;
        n.style.opacity = (0.55 + 0.45 * (z + 1) / 2).toFixed(3);
      });
      if (mark) mark.style.transform = "translate(-50%,-50%) translateY(" + (4 * Math.sin(t * 1.3)).toFixed(2) + "px)";
      if (!still) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  // Quick-access tiles on Home: chosen in Settings > Home (4 slots)
  O.TILE_CHOICES = function () {
    return [{ id: "chat", title: "Chat", sub: "相談・調べる", icon: "chat", tone: "blue" }, { id: "agents", title: "Agents", sub: "業務を自動化", icon: "agents", tone: "violet" },
      { id: "library", title: "Library", sub: "社内ナレッジ", icon: "library", tone: "mint" }, { id: "integrations", title: "Integrations", sub: "外部サービス連携", icon: "integrations", tone: "blue" },
      { id: "search", title: "Search", sub: "まとめて探す", icon: "search", tone: "violet" }]
      .concat(O.FEATURES.filter(function (f) { return f.id !== "chat"; }).map(function (f) { return { id: f.id, title: f.title, sub: f.sub, icon: f.icon, tone: f.tone }; }));
  };
  O.homeTiles = function () { return store.get("homeTiles", ["chat", "agents", "library", "integrations"]); };
  O.refreshHome = function () { if (lastPage === "home") render("home"); };
  // On phones a tool's sidebar folds behind one button that shows the current choice
  function mobileSidebar(layout) {
    var side = layout.querySelector(".tool-side");
    if (!side) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "side-open-btn"; btn.setAttribute("aria-expanded", "false");
    layout.insertBefore(btn, layout.firstChild);
    function label() {
      var title = (side.querySelector(".side-title") || {}).textContent || "絞り込み";
      var cur = side.querySelector('.side-item[aria-current="true"] span');
      btn.innerHTML = icon("search") + "<span>" + esc(title) + (cur ? " <em>" + esc(cur.textContent.trim()) + "</em>" : "") + "</span>" + icon("chev", "chev");
    }
    btn.addEventListener("click", function () {
      var open = layout.classList.toggle("side-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    // Picking a single item (area, facility, folder…) closes the panel on phones
    side.addEventListener("click", function (e) {
      if (e.target.closest(".side-item:not(.tree)") && window.matchMedia("(max-width: 860px)").matches) { layout.classList.remove("side-open"); btn.setAttribute("aria-expanded", "false"); }
      setTimeout(label, 0);
    });
    side.addEventListener("change", function () { setTimeout(label, 0); });
    label();
  }
  var THINK_MS = 20000;                 // demo: how long "考えています" stays up
  var THINK_STEPS = ["社内ナレッジを検索しています", "関連する資料を読み込んでいます", "回答の根拠を確認しています", "回答をまとめています"];
  function group(g) { return O.FEATURES.filter(function (f) { return f.group === g && f.id !== "chat"; }); }

  // ---------- Views ----------
  var V = O.VIEWS;
  V.home = function () {
    var ag = ["todo", "competitor", "parity", "reviews"].map(O.feature);
    var lib = ["bc", "manual", "rm", "weekly"].map(O.feature);
    return '<section class="hero">' +
      '<img class="hero-orb" src="' + ORB + '" alt="" width="820" height="820">' +
      "<h1>All<br><em>connects here.</em></h1>" +
      '<p class="hero-sub">つながる。ひろがる。動き出す。</p>' +
      askBar("homeAsk", "何でも聞いてください…") +
      '<div class="quick">' + O.homeTiles().map(function (id) {
        var c = O.TILE_CHOICES().filter(function (x) { return x.id === id; })[0];
        return c ? quickTile(c.id, esc(c.title), esc(c.sub), c.tone, c.icon) : "";
      }).join("") + "</div></section>" + O.onhandPanel() +
      '<div class="panels">' +
      '<section class="panel"><div class="section-head"><h2>Agents</h2><a class="see-all" href="#agents">すべて見る</a></div><p class="panel-sub">日々の業務を、ORCAと一緒に。</p><div class="rows">' + ag.map(featureRow).join("") + "</div></section>" +
      '<section class="panel"><div class="section-head"><h2>Library</h2><a class="see-all" href="#library">すべて見る</a></div><p class="panel-sub">必要な情報に、すぐアクセス。</p><div class="rows">' + lib.map(featureRow).join("") + "</div></section>" +
      '<section class="panel news-panel"><div class="section-head"><h2>今日のホテルニュース</h2></div><p class="panel-sub">' + (O.TODAY.getMonth() + 1) + "月" + O.TODAY.getDate() + "日(" + O.WD[O.TODAY.getDay()] + ")・" + O.NEWS.length + " 件</p>" +
      O.NEWS.slice(0, 2).map(O.newsItem).join("") + '<a class="see-all more" href="#news">もっと見る ' + icon("chev") + "</a></section>" +
      orbitCard() + "</div>";
  };
  V.chat = function () {
    return O.pageHead("chat") + '<div class="chat">' +
      '<aside class="history" aria-label="チャット履歴"><button class="new-chat" type="button" data-new-chat>' + icon("plus") + "新しいチャット</button>" +
      "<h2>最近</h2>" + HISTORY.map(function (h, i) { return '<a href="#chat"' + (i === 0 ? ' aria-current="true"' : "") + ">" + esc(h) + "</a>"; }).join("") + "</aside>" +
      '<section class="thread"><div class="messages" id="messages">' +
      '<div class="msg-user">先週のプロジェクト資料を要約して。</div>' +
      '<div class="msg-bot"><img src="' + MARK + '" alt="ORCA"><div class="bubble"><p>こちらが要約です。</p>' +
      '<div class="file"><span class="file-ico">PDF</span><span class="row-body"><span class="row-title">プロジェクト概要</span><span class="row-sub">PDF・3.2 MB</span></span></div>' +
      "<p><strong>要点</strong></p><ul><li>主要な進捗と成果</li><li>今後のアクション</li><li>関連するメンバーとタスク</li></ul></div></div>" +
      '<div class="note">表示用のサンプル会話です（回答機能は未接続）</div>' +
      '</div><div class="composer">' + askBar("chatAsk", "メッセージを入力…") + "</div></section></div>";
  };
  V.agents = function () { return O.pageHead("agents") + '<div class="grid-2">' + group("agents").map(featureCard).join("") + "</div>"; };
  V.library = function () { return O.pageHead("library") + '<div class="grid-2">' + group("library").map(featureCard).join("") + "</div>"; };
  V.search = function () {
    return O.pageHead("search") +
      '<form class="ask wide" data-search><span class="clip">' + icon("search") + '</span><input id="searchBox" name="q" autocomplete="off" aria-label="検索" placeholder="キーワードで絞り込む（例: 料金、清掃、口コミ）"></form>' +
      '<div class="rows results" id="results"></div>';
  };
  V.integrations = function () {
    var on = connected();
    return O.pageHead("integrations") + '<div class="split">' + orbitCard(true) + '<div class="rows">' + APPS.map(function (a) {
      var c = on.indexOf(a.name) > -1;
      return '<div class="row"><span class="logo-tile">' + logo(a.key) + '</span><span class="row-body"><span class="row-title">' + esc(a.name) + '</span><span class="row-sub">' + (c ? "接続済み" : "未接続") + "</span></span>" +
        '<button class="chip" type="button" data-toggle="' + esc(a.name) + '" aria-pressed="' + c + '">' + (c ? "接続中" : "接続する") + "</button></div>";
    }).join("") + "</div></div>";
  };
  // ---------- Search ----------
  function renderResults(q) {
    q = q.trim().toLowerCase();
    var items = O.FEATURES.map(function (f) { return { t: f.title, s: f.sub, k: f.group === "agents" ? "Agents" : "Library", h: "#" + f.id, i: f.icon, tone: f.tone }; })
      .concat(APPS.map(function (a) { return { t: a.name, s: "外部サービス連携", k: "Integrations", h: "#integrations", i: "integrations", tone: "blue" }; }));
    var hits = items.filter(function (x) { return !q || (x.t + x.s + x.k).toLowerCase().indexOf(q) > -1; });
    document.getElementById("results").innerHTML = hits.length ? hits.map(function (x) {
      return '<a class="row" href="' + x.h + '"><span class="row-icon tone-' + x.tone + '">' + icon(x.i) + '</span><span class="row-body"><span class="row-title">' + esc(x.t) +
        '</span><span class="row-sub">' + esc(x.k) + "・" + esc(x.s) + "</span></span>" + icon("chev", "chev") + "</a>";
    }).join("") : '<p class="empty">「' + esc(q) + "」に一致する項目はありません。別のキーワードで試してください。</p>";
  }

  // ---------- Theme ----------
  function theme() { return store.get("theme", "light"); }
  O.applyTheme = applyTheme;
  function applyTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);   // light | dark | fhg
    if (O.applyColor) O.applyColor();                                // accent contrast depends on the theme
  }
  applyTheme(theme());

  // ---------- Notifications ----------
  var pop = document.getElementById("notifPop");
  O.renderNotifs = function () { renderNotifs(); };
  function renderNotifs() {
    var todos = store.get("todos", []).filter(function (t) { return !t.done && new Date(t.due + "T00:00:00") <= O.TODAY; });
    var night = store.get("night2", []).filter(function (t) { return t.status === "done"; }).slice(0, 3);
    var items = todos.map(function (t) { return '<a class="notif" href="#todo">' + icon("todo") + "<span><strong>期限のタスク</strong>" + esc(t.text) + "</span></a>"; })
      .concat(night.map(function (t) { return '<a class="notif" href="#night">' + icon("moon") + "<span><strong>夜タスクが完了</strong>" + esc(t.title) + "</span></a>"; }));
    var n = items.length;
    pop.innerHTML = '<p class="pop-head">お知らせ' + (n ? "（" + n + "件）" : "") + "</p>" + (items.join("") || '<p class="empty">新しいお知らせはありません。</p>');
    // Unread: the bell is filled with the accent and shows a count; with none it stays quiet
    var btn = document.getElementById("notifBtn"), badge = document.getElementById("notifCount");
    badge.hidden = !n; badge.textContent = n > 99 ? "99+" : String(n);
    badge.toggleAttribute("data-wide", n > 9);
    btn.classList.toggle("has-unread", n > 0);
    btn.setAttribute("aria-label", n ? "お知らせ " + n + "件（未読）" : "お知らせ");
    if (n > lastNotifCount) {                       // swing the bell once when something new arrives (and on first load)
      btn.classList.remove("ring"); void btn.offsetWidth; btn.classList.add("ring");
      setTimeout(function () { btn.classList.remove("ring"); }, 1400);
    }
    lastNotifCount = n;
  }
  var lastNotifCount = -1;

  // ---------- Router ----------
  function route() {
    var id = (location.hash || "#home").slice(1);
    pop.hidden = true;
    if (id === "welcome") { welcome.hidden = false; return; }
    welcome.hidden = true;
    if (id === "settings") {
      if (!view.getAttribute("data-page")) { id = "home"; history.replaceState(null, "", "#home"); render(id); }
      O.openSettings();
      return;
    }
    O.closeSettings && O.closeSettings();
    render(id);
  }
  var lastPage = "home";
  function render(id) {
    if (!V[id]) id = "home";
    // A fresh root per render, so listeners a page attaches die with the page
    view.innerHTML = '<div class="page-root">' + V[id]() + "</div>";
    view.setAttribute("data-page", id);
    var f = O.feature(id);
    var navId = id === "chat" ? "chat" : f ? f.group : id;
    document.querySelectorAll(".nav-link[data-view]").forEach(function (a) {
      if (a.getAttribute("data-view") === navId) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    shell.classList.remove("open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    if (O.AFTER[id]) O.AFTER[id](view.firstElementChild);
    view.querySelectorAll(".orbit").forEach(animateOrbit);
    if (id === "home") O.mountOnhand(view.firstElementChild);
    view.querySelectorAll(".tool-layout").forEach(mobileSidebar);
    lastPage = id;
    if (id === "search") { renderResults(""); document.getElementById("searchBox").focus(); }
    if (id === "chat") { var m = document.getElementById("messages"); m.scrollTop = m.scrollHeight; }
    O.refreshBadges();
    renderNotifs();
    document.querySelector(".main").scrollTop = 0;
  }
  window.addEventListener("hashchange", function () { depth++; route(); });
  O.currentPage = function () { return lastPage; };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open-settings]");
    if (b) O.openSettings(b.getAttribute("data-open-settings"));
  });
  // Settings opens as a dialog over the current page without touching history
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href="#settings"]');
    if (!a) return;
    e.preventDefault();
    shell.classList.remove("open");
    O.openSettings();
  });

  // ---------- Events ----------
  document.getElementById("menuBtn").addEventListener("click", function () {
    var open = shell.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("scrim").addEventListener("click", function () { shell.classList.remove("open"); });
  document.getElementById("notifBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    pop.hidden = !pop.hidden;
    this.setAttribute("aria-expanded", String(!pop.hidden));
  });
  document.addEventListener("click", function (e) { if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true; });

  view.addEventListener("submit", function (e) {
    var form = e.target;
    if (form.hasAttribute("data-search")) { e.preventDefault(); return; }
    if (!form.hasAttribute("data-ask")) return;
    e.preventDefault();
    var input = form.querySelector("input");
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = "";
    function post() {
      var m = document.getElementById("messages");
      m.insertAdjacentHTML("beforeend", '<div class="msg-user">' + esc(text) + "</div>" +
        '<div class="thinking" role="status" aria-live="polite"><canvas class="orca-loader" aria-hidden="true"></canvas><div class="thinking-body">' +
        '<span class="thinking-text">考えています<span class="dots"><i></i><i></i><i></i></span></span><span class="thinking-step" data-step>' + THINK_STEPS[0] + "</span>" +
        '<div class="progress" aria-hidden="true"><i data-bar></i></div><span class="thinking-foot"><span data-sec>0</span> 秒<button class="link-btn" type="button" data-stop-thinking>止める</button></span></div></div>');
      var th = m.lastElementChild, loader = O.loader(th.querySelector("canvas")), t0 = Date.now(), timer;
      var step = th.querySelector("[data-step]"), bar = th.querySelector("[data-bar]"), sec = th.querySelector("[data-sec]");
      m.scrollTop = m.scrollHeight;
      th.scrollIntoView({ block: "nearest" });
      function finish(msg) {
        clearInterval(timer); loader.stop();
        if (!th.isConnected) return;
        th.outerHTML = '<div class="note">' + msg + "</div>";
        m.scrollTop = m.scrollHeight;
      }
      th.__stop = function () { finish("回答を止めました"); };
      timer = setInterval(function () {
        if (!th.isConnected) { clearInterval(timer); loader.stop(); return; }
        var el = Date.now() - t0;
        if (el >= THINK_MS) return finish("デモ版のため回答は生成されません");
        bar.style.width = (el / THINK_MS * 100).toFixed(1) + "%";
        sec.textContent = Math.floor(el / 1000);
        var s = THINK_STEPS[Math.min(THINK_STEPS.length - 1, Math.floor(el / (THINK_MS / THINK_STEPS.length)))];
        if (step.textContent !== s) step.textContent = s;
      }, 200);
    }
    if (view.getAttribute("data-page") !== "chat") {
      HISTORY.unshift(text.slice(0, 40));
      location.hash = "#chat";
      setTimeout(post, 0);
    } else post();
  });
  view.addEventListener("input", function (e) { if (e.target.id === "searchBox") renderResults(e.target.value); });
  view.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) {
      if (depth > 0) { depth -= 2; history.back(); }
      else location.hash = "#" + parentOf(view.getAttribute("data-page"));
      return;
    }
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-toggle")) {
      var name = t.getAttribute("data-toggle"), on = connected(), was = on.indexOf(name) > -1;
      on = was ? on.filter(function (n) { return n !== name; }) : on.concat(name);
      store.set("apps", on);
      t.setAttribute("aria-pressed", String(!was));
      t.textContent = was ? "接続する" : "接続中";
      t.closest(".row").querySelector(".row-sub").textContent = was ? "未接続" : "接続済み";
      O.toast(name + (was ? " の接続を解除しました" : " を接続しました"));
    } else if (t.hasAttribute("data-stop-thinking")) {
      var thk = t.closest(".thinking"); if (thk && thk.__stop) thk.__stop();
    } else if (t.hasAttribute("data-new-chat")) {
      document.getElementById("messages").innerHTML = '<div class="note">新しいチャット。下の入力欄からどうぞ。</div>';
      document.getElementById("chatAsk").focus();
    }
  });

  // Number keys 1–9 open the tools, as on the current ORCA home
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "Escape") {
      shell.classList.remove("open");
      pop.hidden = true;
      var modal = document.querySelector(".modal:not([hidden])");
      if (modal) modal.hidden = true;
      return;
    }
    var f = O.FEATURES.filter(function (x) { return String(x.key) === e.key; })[0];
    if (f) location.hash = "#" + f.id;
  });

  route();
})();
