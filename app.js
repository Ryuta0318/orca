(function () {
  "use strict";

  var MARK = "assets/orca-mark.webp";

  // Lucide-style stroke icons (inner SVG markup only)
  var ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    agents: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    library: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    integrations: '<circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="4"/><path d="m10.8 12.2 2.4-2.4"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7L10.2 17a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    todo: '<path d="M4 6h2M4 12h2M4 18h2M10 6h10M10 12h10M10 18h10"/>',
    binoculars: '<circle cx="6.5" cy="16" r="3.5"/><circle cx="17.5" cy="16" r="3.5"/><path d="M10 16h4M4 13l2-8h3l1 8M20 13l-2-8h-3l-1 8"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    spark: '<path d="M4 20 9 9l4 6 3-8 4 13"/><path d="M15 4l1.5 1.5L18 4"/>',
    gem: '<path d="M12 3 20 9l-3 11H7L4 9z"/><path d="M4 9h16M12 3l-3 6 3 11 3-11z"/>',
    report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M9 17v-3M12 17v-6M15 17v-4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a2 2 0 0 0-2 2"/><path d="m15 13 2 2 4-4"/>',
    ledger: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8a3 3 0 1 1 3-3c0 1.5-3 3-3 3zM12 8a3 3 0 1 0-3-3c0 1.5 3 3 3 3z"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + "</svg>";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var NAV = [
    { id: "home", label: "Home", icon: "home" },
    { id: "chat", label: "Chat", icon: "chat" },
    { id: "search", label: "Search", icon: "search" },
    { id: "agents", label: "Agents", icon: "agents" },
    { id: "library", label: "Library", icon: "library" },
    { id: "integrations", label: "Integrations", icon: "integrations" }
  ];

  var ORB = "assets/orca-orb-soft.webp";

  // Agents: the four from the UI board first, then the existing ORCA hotel services
  var AGENTS = [
    { title: "リサーチエージェント", sub: "市場・競合を調査", icon: "chat", tag: "調査" },
    { title: "資料作成エージェント", sub: "企画・提案資料を生成", icon: "doc", tag: "資料", plain: true },
    { title: "分析エージェント", sub: "データを分析・可視化", icon: "spark", tag: "分析", plain: true },
    { title: "タスクエージェント", sub: "タスク管理・リマインド", icon: "gem", tag: "タスク", badge: 23 },
    { title: "競合調査", sub: "競合施設の最安値を毎日比較", icon: "binoculars", tag: "調査" },
    { title: "レートパリティチェック", sub: "公式サイトとOTAの料金差をチェック", icon: "scale", tag: "分析" },
    { title: "レビュー・ランキング分析", sub: "OTAの口コミ点数と順位を競合と比較", icon: "star", tag: "分析" },
    { title: "AI週次レポート", sub: "1週間の動きをまとめたレポート", icon: "report", tag: "資料" },
    { title: "夜間タスク", sub: "夜のうちに依頼を実行し、翌朝結果を受け取る", icon: "moon", tag: "タスク" }
  ];
  var LIBRARY = [
    { title: "ブランドガイドライン", sub: "ロゴ・カラー・トーン&マナー", count: 12, t1: "#f1f3f6", t2: "#6d7684", cat: "ブランド" },
    { title: "ホテル事業", sub: "運用マニュアル・RM方針・台帳", count: 28, t1: "#e9ebef", t2: "#3d4553", cat: "事業" },
    { title: "マーケティング", sub: "キャンペーン・BC画像・販促物", count: 16, t1: "#eceef2", t2: "#4a5262", cat: "販売" },
    { title: "社内ドキュメント", sub: "規程・申請・各種テンプレート", count: 42, t1: "#eef0f3", t2: "#59616f", cat: "全社" },
    { title: "運用マニュアル", sub: "清掃・緊急対応など現場の手順", count: 37, t1: "#eef1f6", t2: "#53627a", cat: "現場" },
    { title: "開業準備", sub: "開業案件のタスクと資料", count: 64, t1: "#edf0f4", t2: "#465068", cat: "事業" }
  ];

  // Simplified connector logos (24px grid)
  var LOGO = {
    slack: '<rect x="2" y="8" width="9" height="3.2" rx="1.6" fill="#36C5F0"/><circle cx="9.6" cy="4.6" r="1.6" fill="#36C5F0"/><rect x="12.8" y="2" width="3.2" height="9" rx="1.6" fill="#2EB67D"/><circle cx="19.4" cy="9.6" r="1.6" fill="#2EB67D"/><rect x="13" y="12.8" width="9" height="3.2" rx="1.6" fill="#ECB22E"/><circle cx="14.4" cy="19.4" r="1.6" fill="#ECB22E"/><rect x="8" y="13" width="3.2" height="9" rx="1.6" fill="#E01E5A"/><circle cx="4.6" cy="14.4" r="1.6" fill="#E01E5A"/>',
    notion: '<rect x="3.5" y="3" width="17" height="18" rx="2.5" fill="#fff" stroke="#111" stroke-width="1.6"/><path d="M8.5 7.5v9M8.5 7.5l7 9M15.5 7.5v9" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>',
    drive: '<path d="M8.3 3h7.4l6.3 11h-7.4z" fill="#FFBA00"/><path d="M8.3 3 2 14l3.7 6.5L12 9.5z" fill="#00AC47"/><path d="M5.7 20.5h12.6L22 14H9.4z" fill="#2684FC"/>',
    gmail: '<rect x="2.5" y="6" width="4" height="13" rx="1.2" fill="#4285F4"/><rect x="17.5" y="6" width="4" height="13" rx="1.2" fill="#34A853"/><path d="M4.2 7.4 12 13.4l7.8-6" fill="none" stroke="#EA4335" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M19.8 7.4" stroke="#FBBC04"/>',
    salesforce: '<g fill="#00A1E0"><circle cx="8" cy="12.5" r="4.5"/><circle cx="12.5" cy="10" r="5"/><circle cx="17.2" cy="12.4" r="4.4"/><rect x="5" y="12" width="15" height="5.6" rx="2.8"/></g>',
    teams: '<circle cx="18.6" cy="7.6" r="2.4" fill="#7B83EB"/><rect x="14.5" y="10.5" width="7.5" height="8" rx="2.5" fill="#7B83EB"/><rect x="3" y="6" width="12.5" height="13" rx="2.5" fill="#5059C9"/><path d="M6.2 9.6h6.2M9.3 9.6v6.4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
    box: '<rect x="2" y="5" width="20" height="14" rx="4" fill="#0061D5"/><text x="12" y="15.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7.6" fill="#fff">box</text>',
    sharepoint: '<circle cx="12.5" cy="8.5" r="5.8" fill="#036C70"/><circle cx="16.8" cy="13.8" r="4.6" fill="#1A9BA1"/><circle cx="12.6" cy="18" r="3.6" fill="#37C6D0"/><rect x="2.5" y="7" width="10" height="10" rx="2" fill="#03787C"/><text x="7.5" y="14.6" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7.5" fill="#fff">S</text>'
  };
  function logo(key) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + LOGO[key] + "</svg>"; }
  var APPS = [
    { name: "Slack", key: "slack" },
    { name: "Notion", key: "notion" },
    { name: "Google Drive", key: "drive" },
    { name: "Gmail", key: "gmail" },
    { name: "Salesforce", key: "salesforce" },
    { name: "Microsoft Teams", key: "teams" },
    { name: "Box", key: "box" },
    { name: "SharePoint", key: "sharepoint" }
  ];
  var HISTORY = [
    "先週のプロジェクト資料を要約",
    "航空券連動チャネルの予約数",
    "宿泊者国籍割合",
    "由布院の予約初動状況",
    "由布院サウナサインの有無",
    "向こう一年の開業時期"
  ];

  var view = document.getElementById("view");
  var shell = document.getElementById("shell");
  var welcome = document.getElementById("welcome");
  var toastEl = document.getElementById("toast");
  var toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  document.getElementById("nav").innerHTML = NAV.map(function (n) {
    return '<a class="nav-link" href="#' + n.id + '" data-view="' + n.id + '">' + icon(n.icon, n.id === "search" || n.id === "integrations" ? "" : "fillable") + "<span>" + n.label + "</span></a>";
  }).join("");

  // ---------- Partials ----------
  function askBar(id, placeholder) {
    return '<form class="ask" data-ask>' +
      '<span class="clip">' + icon("clip") + "</span>" +
      '<label class="sr" for="' + id + '" hidden>質問</label>' +
      '<input id="' + id + '" name="q" autocomplete="off" placeholder="' + placeholder + '">' +
      '<button class="send" type="submit" aria-label="送信">' + icon("arrow") + "</button></form>";
  }
  function agentRow(a) {
    return '<a class="row" href="#agents"><span class="row-icon' + (a.plain ? " plain" : "") + '">' + icon(a.icon) + '</span><span class="row-body"><span class="row-title">' +
      esc(a.title) + '</span><div class="row-sub">' + esc(a.sub) + "</div></span>" +
      icon("chev", "chev") + "</a>";
  }
  function libRow(l) {
    return '<a class="row" href="#library"><span class="thumb" style="--t1:' + l.t1 + ";--t2:" + l.t2 + '"><img src="' + MARK + '" alt=""></span>' +
      '<span class="row-body"><span class="row-title">' + esc(l.title) + '</span><div class="row-sub">' + l.count + "件のファイル</div></span>" + icon("chev", "chev") + "</a>";
  }
  function appTile(a) {
    return '<a class="app" href="#integrations" title="' + esc(a.name) + '" aria-label="' + esc(a.name) + '">' + logo(a.key) + "</a>";
  }
  function orbitCard() {
    // Notion top, Drive/Teams right, Salesforce/Slack left — as on the UI board
    var nodes = [["notion", 50, 14, true], ["drive", 87, 34], ["teams", 85, 70], ["salesforce", 15, 70], ["slack", 13, 34]];
    return '<div class="orbit" aria-hidden="true"><span class="orbit-ring"></span>' +
      nodes.map(function (n) {
        return '<span class="orbit-node' + (n[3] ? " light" : "") + '" style="left:' + n[1] + "%;top:" + n[2] + '%">' + logo(n[0]) + "</span>";
      }).join("") +
      '<img class="orbit-mark" src="' + MARK + '" alt=""><span class="wordmark"></span></div>';
  }

  // ---------- Views ----------
  var VIEWS = {
    home: function () {
      return '<section class="hero">' +
        '<img class="hero-orb" src="' + ORB + '" alt="" width="820" height="820">' +
        "<h1>All<br>connects here.</h1>" +
        '<p class="hero-sub">つながる。ひろがる。動き出す。</p>' +
        askBar("homeAsk", "何でも聞いてください…") +
        '<div class="quick">' +
        quickTile("chat", "Chat", "相談・調べる", "") +
        quickTile("agents", "Agents", "業務を自動化", "violet") +
        quickTile("library", "Library", "社内ナレッジ", "mint") +
        quickTile("integrations", "Integrations", "外部サービス連携", "") +
        "</div></section>" +
        '<div class="panels">' +
        '<section class="panel"><div class="section-head"><h2>Agents</h2><a class="see-all" href="#agents">すべて見る</a></div><p class="panel-sub">日々の業務を、ORCAと一緒に。</p><div class="rows">' +
        AGENTS.slice(0, 4).map(agentRow).join("") + "</div></section>" +
        '<section class="panel"><div class="section-head"><h2>Library</h2><a class="see-all" href="#library">すべて見る</a></div><p class="panel-sub">必要な情報に、すぐアクセス。</p><div class="rows">' +
        LIBRARY.slice(0, 4).map(libRow).join("") + "</div></section>" +
        '<section class="panel"><div class="section-head"><h2>Integrations</h2><a class="see-all" href="#integrations">管理</a></div><p class="panel-sub">いつものツールと、シームレスに。</p><div class="apps">' +
        APPS.slice(0, 6).map(appTile).join("") +
        '<a class="app more" href="#integrations" aria-label="ほかの連携">•••</a>' +
        '<a class="app add" href="#integrations"><span class="plus">' + icon("plus") + "</span>連携を追加</a>" +
        "</div></section>" + orbitCard() + "</div>";
    },
    chat: function () {
      return '<div class="chat">' +
        '<aside class="history" aria-label="チャット履歴"><button class="new-chat" type="button" data-new>' + icon("plus") + "新しいチャット</button>" +
        "<h2>最近</h2>" + HISTORY.map(function (h, i) {
          return '<a href="#chat"' + (i === 0 ? ' aria-current="true"' : "") + ">" + esc(h) + "</a>";
        }).join("") + "</aside>" +
        '<section class="thread"><div class="messages" id="messages">' +
        '<div class="msg-user">先週のプロジェクト資料を要約して。</div>' +
        '<div class="msg-bot"><img src="' + MARK + '" alt="ORCA"><div class="bubble">' +
        "<p>こちらが要約です。</p>" +
        '<div class="file"><span class="file-ico">PDF</span><span class="row-body"><span class="row-title">プロジェクト概要</span><div class="row-sub">PDF・3.2 MB</div></span></div>' +
        "<p><strong>要点</strong></p><ul><li>主要な進捗と成果</li><li>今後のアクション</li><li>関連するメンバーとタスク</li></ul>" +
        "</div></div>" +
        '<div class="note">表示用のサンプル会話です（回答機能は未接続）</div>' +
        '</div><div class="composer">' + askBar("chatAsk", "メッセージを入力…") + "</div></section></div>";
    },
    search: function () {
      return pageHead("Search", "エージェント・ライブラリ・連携をまとめて探す") +
        '<form class="ask" data-search style="max-width:none"><span class="clip">' + icon("search") + '</span><input id="searchBox" name="q" autocomplete="off" placeholder="キーワードで絞り込む（例: 料金、清掃、ブランド）"></form>' +
        '<div class="rows" id="results" style="margin-top:18px"></div>';
    },
    agents: function () {
      var tags = ["すべて"].concat(AGENTS.map(function (a) { return a.tag; }).filter(function (t, i, arr) { return arr.indexOf(t) === i; }));
      return pageHead("Agents", "日々の業務を、ORCAと一緒に。数字キー 1〜9 でも開けます。") +
        '<div class="filter" role="group" aria-label="カテゴリ">' + tags.map(function (t, i) {
          return '<button class="chip" type="button" data-tag="' + t + '" aria-pressed="' + (i === 0) + '">' + t + "</button>";
        }).join("") + "</div>" +
        '<div class="grid-2" id="agentGrid">' + agentCards("すべて") + "</div>";
    },
    library: function () {
      return pageHead("Library", "必要な情報に、すぐアクセス。") +
        '<div class="grid-2">' + LIBRARY.map(function (l) {
          return '<a class="card-link" href="#library"><span class="thumb" style="--t1:' + l.t1 + ";--t2:" + l.t2 + '"><img src="' + MARK + '" alt=""></span>' +
            '<span class="row-body"><span class="row-title">' + esc(l.title) + '</span><div class="row-sub">' + esc(l.sub) + '</div><div class="row-sub" style="margin-top:6px">' +
            esc(l.cat) + "・" + l.count + "件のファイル</div></span></a>";
        }).join("") + "</div>";
    },
    integrations: function () {
      return pageHead("Integrations", "いつものツールと、シームレスに。") +
        '<div class="split">' + orbitCard() +
        '<div class="rows">' + APPS.map(function (a, i) {
          var on = i < 6;
          return '<div class="row"><span class="logo-tile">' + logo(a.key) + "</span>" +
            '<span class="row-body"><span class="row-title">' + esc(a.name) + '</span><div class="row-sub">' + (on ? "接続済み" : "未接続") + "</div></span>" +
            '<button class="chip" type="button" data-toggle="' + esc(a.name) + '" aria-pressed="' + on + '">' + (on ? "接続中" : "接続する") + "</button></div>";
        }).join("") + "</div></div>";
    },
    settings: function () {
      return pageHead("設定", "鈴木 隆太・社員") +
        '<div class="settings">' +
        '<div class="setting"><span><span class="row-title">テーマ</span><div class="row-sub">ライト・ダーク・端末に合わせる</div></span>' +
        '<span class="seg" role="group" aria-label="テーマ">' +
        ["light:ライト", "dark:ダーク", "auto:自動"].map(function (p) {
          var k = p.split(":");
          return '<button type="button" data-theme-set="' + k[0] + '" aria-pressed="' + (currentTheme() === k[0]) + '">' + k[1] + "</button>";
        }).join("") + "</span></div>" +
        '<div class="setting"><span><span class="row-title">サインイン画面を表示</span><div class="row-sub">ログイン前の画面デザインを確認</div></span><a class="chip" href="#welcome">表示する</a></div>' +
        "</div>";
    }
  };
  function quickTile(id, title, sub, tone) {
    var n = NAV.filter(function (x) { return x.id === id; })[0];
    return '<a class="tile" href="#' + id + '"><span class="tile-icon ' + tone + '">' + icon(n.icon) + '</span><span class="tile-title">' + title + '</span><span class="tile-sub">' + sub + "</span></a>";
  }
  function pageHead(title, sub) {
    return '<header class="page-head"><div><h1>' + title + '</h1><p class="page-sub">' + sub + "</p></div></header>";
  }
  function agentCards(tag) {
    return AGENTS.map(function (a, i) {
      if (tag !== "すべて" && a.tag !== tag) return "";
      return '<a class="card-link" href="#agents" data-key="' + (i + 1) + '"><span class="row-icon' + (a.plain ? " plain" : "") + '">' + icon(a.icon) + '</span><span class="row-body"><span class="row-title">' +
        esc(a.title) + (a.badge ? '<span class="badge">' + a.badge + "</span>" : "") + '</span><div class="row-sub">' + esc(a.sub) + '</div></span><span class="kbd">' + (i + 1) + "</span></a>";
    }).join("");
  }
  function renderResults(q) {
    q = q.trim().toLowerCase();
    var items = AGENTS.map(function (a) { return { t: a.title, s: a.sub, k: "Agents", h: "#agents", i: a.icon }; })
      .concat(LIBRARY.map(function (l) { return { t: l.title, s: l.sub, k: "Library", h: "#library", i: "library" }; }))
      .concat(APPS.map(function (a) { return { t: a.name, s: "外部サービス連携", k: "Integrations", h: "#integrations", i: "integrations" }; }));
    var hits = items.filter(function (x) { return !q || (x.t + x.s + x.k).toLowerCase().indexOf(q) > -1; });
    document.getElementById("results").innerHTML = hits.length ? hits.map(function (x) {
      return '<a class="row" href="' + x.h + '"><span class="row-icon">' + icon(x.i) + '</span><span class="row-body"><span class="row-title">' + esc(x.t) +
        '</span><div class="row-sub">' + esc(x.k) + "・" + esc(x.s) + "</div></span>" + icon("chev", "chev") + "</a>";
    }).join("") : '<p class="page-sub">「' + esc(q) + "」に一致する項目はありません。別のキーワードで試してください。</p>";
  }

  // ---------- Theme ----------
  function currentTheme() {
    try { return localStorage.getItem("orca.theme") || "light"; } catch (e) { return "light"; }
  }
  function applyTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }
  applyTheme(currentTheme());

  // ---------- Router ----------
  function route() {
    var id = (location.hash || "#home").slice(1);
    if (id === "welcome") { welcome.hidden = false; return; }
    welcome.hidden = true;
    if (!VIEWS[id]) id = "home";
    view.innerHTML = VIEWS[id]();
    document.querySelectorAll("[data-view]").forEach(function (a) {
      if (a.getAttribute("data-view") === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    shell.classList.remove("open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    if (id === "search") { renderResults(""); document.getElementById("searchBox").focus(); }
    if (id === "chat") { var m = document.getElementById("messages"); m.scrollTop = m.scrollHeight; }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- Events ----------
  document.getElementById("menuBtn").addEventListener("click", function () {
    var open = shell.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("scrim").addEventListener("click", function () { shell.classList.remove("open"); });

  view.addEventListener("submit", function (e) {
    var form = e.target;
    e.preventDefault();
    if (form.hasAttribute("data-search")) return;
    var input = form.querySelector("input");
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    if ((location.hash || "#home") !== "#chat") {
      HISTORY.unshift(text.slice(0, 40));
      location.hash = "#chat";
    }
    setTimeout(function () {
      var m = document.getElementById("messages");
      if (!m) return;
      m.insertAdjacentHTML("beforeend", '<div class="msg-user">' + esc(text) + '</div><div class="note">デモ版のため回答は生成されません</div>');
      m.scrollTop = m.scrollHeight;
    }, 0);
    input.value = "";
  });
  view.addEventListener("input", function (e) {
    if (e.target.id === "searchBox") renderResults(e.target.value);
  });
  view.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-tag")) {
      t.parentNode.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === t)); });
      document.getElementById("agentGrid").innerHTML = agentCards(t.getAttribute("data-tag"));
    } else if (t.hasAttribute("data-toggle")) {
      var on = t.getAttribute("aria-pressed") !== "true";
      t.setAttribute("aria-pressed", String(on));
      t.textContent = on ? "接続中" : "接続する";
      t.closest(".row").querySelector(".row-sub").textContent = on ? "接続済み" : "未接続";
      toast(t.getAttribute("data-toggle") + (on ? " を接続しました" : " の接続を解除しました"));
    } else if (t.hasAttribute("data-theme-set")) {
      var v = t.getAttribute("data-theme-set");
      try { localStorage.setItem("orca.theme", v); } catch (err) { /* storage unavailable */ }
      applyTheme(v);
      t.parentNode.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
    } else if (t.hasAttribute("data-new")) {
      document.getElementById("messages").innerHTML = '<div class="note">新しいチャット。下の入力欄からどうぞ。</div>';
      document.getElementById("chatAsk").focus();
    }
  });

  // Number keys 1–7 open agents (kept from the current ORCA home), ignored while typing
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "Escape") shell.classList.remove("open");
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= AGENTS.length) toast(AGENTS[n - 1].title + " を開きます（デモ）");
  });

  route();
})();
