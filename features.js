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
  function trend(delta, goodWhenUp) {
    var up = delta > 0, flat = Math.abs(delta) < 1e-9;
    var good = flat ? "" : (up === (goodWhenUp !== false) ? "good" : "bad");
    return '<span class="delta ' + good + '">' + icon(flat ? "flat" : up ? "up" : "down") + "</span>";
  }

  function kpi(label, value, state, note) {
    return '<div class="kpi"><span class="kpi-label">' + label + '</span><span class="kpi-value ' + (state || "") + '">' + value + "</span>" + (note ? '<span class="kpi-note">' + note + "</span>" : "") + "</div>";
  }
  O.kpi = kpi; O.trend = trend; O.sampleNote = sampleNote;

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
