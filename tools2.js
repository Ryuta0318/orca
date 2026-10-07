/* ORCA tools, part 2: BC image search, operations manual, RM policy & ledger, dashboard, night tasks.
   Production screen structure, fictional sample data. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store, kpi = O.kpi;
  var BRANDS = ["ブランドA", "ブランドB", "ブランドC", "ブランドD", "ブランドE"];
  var AREAS = {
    "ブランドA": ["石垣", "糸島", "由布院"], "ブランドB": ["小豆島", "富士御殿場"], "ブランドC": ["鹿児島天文館", "長崎", "札幌すすきの", "飛騨高山"],
    "ブランドD": ["函館", "東京両国", "東京西日暮里", "広島", "高松", "伊勢", "熊本"], "ブランドE": ["名古屋栄", "宮島"]
  };
  var FAC = [];
  BRANDS.forEach(function (b) { AREAS[b].forEach(function (a) { FAC.push({ id: O.hash(b + a).toString(36), brand: b, area: a, name: b + " " + a }); }); });
  function rnd(s) { return O.rng(O.hash(String(s))); }
  function sideToggle() { return '<button class="icon-btn ghost side-collapse" type="button" data-side-collapse aria-label="サイドバーを閉じる">' + icon("library") + "</button>"; }
  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-side-collapse]");
    if (b) b.closest(".tool-layout").classList.toggle("side-closed");
  });

  // ================= BC画像検索 =================
  var SCENES = ["客室", "ラウンジ", "ロビー", "テラス", "バスルーム", "イベント", "ロゴ素材", "外観", "バー", "レストラン", "寝室", "ディナー", "スイート", "背景素材", "プール", "ビーチ", "朝食", "ショップ"];
  var HUE = { "客室": 30, "ラウンジ": 25, "ロビー": 38, "テラス": 95, "バスルーム": 195, "イベント": 330, "ロゴ素材": 220, "外観": 205, "バー": 15, "レストラン": 20, "寝室": 35, "ディナー": 8, "スイート": 40, "背景素材": 210, "プール": 190, "ビーチ": 185, "朝食": 45, "ショップ": 280 };
  var IMGS = [];
  FAC.forEach(function (f) {
    var r = rnd("bcimg" + f.id), n = 10 + Math.floor(r() * 14);
    for (var i = 0; i < n; i++) {
      var sc = SCENES[Math.floor(Math.pow(r(), 1.5) * SCENES.length)];
      IMGS.push({ id: f.id + "_" + i, f: f, scene: sc, h: [0.75, 1, 1.33, 1.5][Math.floor(r() * 4)], comp: r() < 0.3, hue: HUE[sc] + Math.floor(r() * 20 - 10), sat: 18 + Math.floor(r() * 30), light: 40 + Math.floor(r() * 25) });
    }
  });
  function art(im) {
    return "background:radial-gradient(120% 80% at 75% 15%, hsl(" + (im.hue + 15) + " " + im.sat + "% " + (im.light + 35) + "% / .9), transparent 60%)," +
      "radial-gradient(90% 70% at 20% 90%, hsl(" + (im.hue - 10) + " " + (im.sat + 10) + "% " + (im.light - 18) + "%), transparent 70%)," +
      "linear-gradient(160deg, hsl(" + im.hue + " " + im.sat + "% " + (im.light + 12) + "%), hsl(" + (im.hue + 8) + " " + im.sat + "% " + (im.light - 12) + "%))";
  }
  O.VIEWS.bc = function () {
    return O.pageHead("bc", { sub: "Brand & Creative の素材画像をタグで検索。押すと拡大、↗ で Box の原本を開く（サンプル）", actions: '<button class="btn" type="button" data-scope>' + icon("library") + "取得範囲</button>" }) +
      '<div class="tool-layout"><aside class="tool-side"><div class="side-head"><span class="side-title">絞り込み</span>' + sideToggle() + '</div><p class="side-group">ブランド・施設</p><div id="bcBrands"></div><p class="side-group">場面</p><div class="tag-cloud" id="bcScenes"></div></aside>' +
      '<div class="tool-main"><form class="search-hero" id="bcForm"><span>' + icon("search") + '</span><input id="bcQ" placeholder="例: 海が見える客室、朝食、外観のライトアップ" aria-label="画像を検索"><button class="btn btn-primary" type="submit">探す <kbd>Enter</kbd></button></form>' +
      '<p class="result-meta"><b id="bcCount"></b> 件　<span class="muted">最終更新: 9日前</span><span class="muted" id="bcActive"></span></p><div class="masonry" id="bcGrid"></div></div></div>' +
      '<div class="modal" id="bcModal" hidden><div class="modal-card wide" role="dialog" aria-modal="true" aria-labelledby="bcTitle"><button class="icon-btn modal-x" type="button" data-close aria-label="閉じる">' + icon("x") + '</button><div class="modal-art tall" id="bcArt"></div><h2 id="bcTitle"></h2><p class="row-sub" id="bcMeta"></p><div class="form-foot"><span class="hint">原本は Box にあります（デモでは開けません）</span><span><button class="btn" type="button" id="bcCopy">ファイル名をコピー</button> <button class="btn btn-primary" type="button" id="bcBox">' + icon("arrow") + "Box で原本を開く</button></span></div></div></div>";
  };
  O.AFTER.bc = function (root) {
    var brand = "", fac = "", scene = "", q = "", open = {}, current;
    function match(im, skip) {
      if (skip !== "brand" && brand && im.f.brand !== brand) return false;
      if (skip !== "brand" && fac && im.f.id !== fac) return false;
      if (skip !== "scene" && scene && im.scene !== scene) return false;
      if (q) { var hay = im.scene + im.f.name + (im.comp ? "圧縮版" : ""); if (!q.split(/[\s、,]+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1 || (w.length > 1 && hay.indexOf(w.slice(0, 2)) > -1); })) return false; }
      return true;
    }
    function sidebar() {
      var base = IMGS.filter(function (im) { return match(im, "brand"); });
      root.querySelector("#bcBrands").innerHTML = '<button class="side-item" type="button" data-brand="" aria-current="' + (!brand) + '"><span>すべて</span><b>' + base.length.toLocaleString() + "</b></button>" +
        BRANDS.map(function (b) {
          var n = base.filter(function (im) { return im.f.brand === b; }).length;
          return '<button class="side-item tree" type="button" data-brand="' + b + '" aria-current="' + (brand === b && !fac) + '"><span>' + icon("chev", "caret" + (open[b] ? " open" : "")) + b + "</span><b>" + n + "</b></button>" +
            (open[b] ? FAC.filter(function (f) { return f.brand === b; }).map(function (f) {
              return '<button class="side-item sub" type="button" data-fac="' + f.id + '" aria-current="' + (fac === f.id) + '"><span>' + f.area + "</span><b>" + base.filter(function (im) { return im.f.id === f.id; }).length + "</b></button>";
            }).join("") : "");
        }).join("");
      var sbase = IMGS.filter(function (im) { return match(im, "scene"); });
      root.querySelector("#bcScenes").innerHTML = SCENES.map(function (s) {
        var n = sbase.filter(function (im) { return im.scene === s; }).length;
        return n ? '<button class="tag" type="button" data-scene="' + s + '" aria-pressed="' + (scene === s) + '">' + s + " <b>" + n + "</b></button>" : "";
      }).join("");
    }
    function grid() {
      var list = IMGS.filter(function (im) { return match(im); });
      root.querySelector("#bcCount").textContent = list.length.toLocaleString();
      root.querySelector("#bcActive").textContent = [brand && (fac ? FAC.filter(function (f) { return f.id === fac; })[0].name : brand), scene && "#" + scene, q && "「" + q + "」"].filter(Boolean).join("　");
      root.querySelector("#bcGrid").innerHTML = list.length ? list.slice(0, 80).map(function (im) {
        return '<button class="shot2" type="button" data-img="' + im.id + '" style="aspect-ratio:1/' + im.h + ";" + art(im) + '">' + (im.comp ? '<span class="comp">' + icon("library") + "圧縮版</span>" : "") + '<span class="shot2-cap">' + esc(im.f.name) + "・" + im.scene + "</span></button>";
      }).join("") : '<p class="empty">条件に合う画像がありません。場面のタグを外すか、別の言葉で探してください。</p>';
    }
    function draw() { sidebar(); grid(); }
    root.querySelector("#bcForm").addEventListener("submit", function (e) { e.preventDefault(); q = root.querySelector("#bcQ").value.trim(); draw(); });
    var modal = root.querySelector("#bcModal");
    root.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-brand]"))) { var b = t.getAttribute("data-brand"); if (b && brand === b && !fac) open[b] = !open[b]; else if (b) open[b] = true; brand = b; fac = ""; return draw(); }
      if ((t = e.target.closest("[data-fac]"))) { fac = t.getAttribute("data-fac"); return draw(); }
      if ((t = e.target.closest("[data-scene]"))) { var s = t.getAttribute("data-scene"); scene = scene === s ? "" : s; return draw(); }
      if (e.target.closest("[data-scope]")) return O.toast("取得範囲: Box の「Brand & Creative」配下（サンプル）");
      if ((t = e.target.closest("[data-img]"))) {
        current = IMGS.filter(function (x) { return x.id === t.getAttribute("data-img"); })[0];
        root.querySelector("#bcArt").setAttribute("style", art(current) + ";aspect-ratio:1/" + Math.min(current.h, 1.1));
        root.querySelector("#bcTitle").textContent = current.f.name + "・" + current.scene;
        root.querySelector("#bcMeta").textContent = "#" + current.scene + "　#" + current.f.brand + "　BC_" + current.id + ".jpg" + (current.comp ? "（圧縮版）" : "");
        modal.hidden = false; return;
      }
      if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
      if (e.target.closest("#bcBox")) O.toast("デモのため Box は開けません");
      if (e.target.closest("#bcCopy") && current) { var nm = "BC_" + current.id + ".jpg"; (navigator.clipboard ? navigator.clipboard.writeText(nm) : Promise.reject()).then(function () { O.toast(nm + " をコピーしました"); }, function () { O.toast(nm); }); }
    });
    draw();
  };

  // ================= オペマニュアル =================
  var PAGES_COMMON = [
    ["行動指針", ["お客様の名前を覚え、2回目以降は名前でお迎えする", "迷ったら「お客様にとって一番気持ちよいのはどれか」で決める", "判断できないことは必ず当日中に責任者へ共有する"]],
    ["ブランドの基礎データ", ["ブランドの約束・トーン&マナーは BC 画像検索のガイドラインを参照", "客室タイプ名はブランド共通の名称を使う", "公式サイトの表記を正とする"]],
    ["火災発生時", ["大声で周囲に知らせ、火災報知器を押す", "119 番に通報する（施設名・住所・場所・逃げ遅れの有無）", "初期消火は天井に火が届く前まで", "非常口へ誘導する（エレベーターは使わない）", "避難場所で宿泊者名簿と人数を照合する"]],
    ["地震発生時", ["揺れている間は身の安全を確保し、宿泊者にも頭を守るよう呼びかける", "揺れが収まったら火の元・設備の被害を確認する", "館内放送で状況と今後の行動を案内する", "責任者と本部へ被害状況を報告する"]],
    ["急病人への対応", ["意識・呼吸を確認し、周囲に助けを求める", "必要に応じて 119 番通報と AED を手配する", "救急隊を入口から客室まで誘導する", "対応記録を作成し、責任者へ報告する"]],
    ["停電時", ["非常灯の点灯と、エレベーター内の閉じ込めの有無を確認する", "宿泊者へ状況と見込みを案内し、懐中電灯を貸し出す", "復旧後に空調・給湯・POS・鍵システムを確認する"]],
    ["忘れ物の取り扱い", ["発見日時・場所・発見者を記録する", "貴重品は金庫、その他は忘れ物棚で 3 か月保管する", "宿泊者へ連絡し、着払いで発送する"]]
  ];
  var PAGES_BRAND = [
    ["チェックイン対応", ["予約名と人数を確認する", "宿泊者名簿への記入を依頼する", "支払い方法と事前決済の有無を確認する", "館内設備・朝食時間・チェックアウト時刻を案内する"]],
    ["客室清掃（チェックアウト後）", ["換気し、ゴミとリネンを回収する", "浴室・洗面・トイレを上から下の順に清掃する", "ベッドメイクとアメニティの補充", "照明・空調・テレビの動作を確認し、清掃完了を連絡する"]],
    ["朝食オペレーション", ["開場 30 分前に料理と食器の数を確認する", "混雑時は入口で待ち時間を案内する", "アレルギーの申し出は料理長へ直接伝える"]],
    ["客室タイプと設備", ["客室タイプごとの定員と設備はブランド共通表を参照", "エキストラベッドの可否を確認する"]],
    ["接客の言葉づかい", ["最初と最後は必ず名前を呼ぶ", "否定から入らず、できることを先に伝える"]],
    ["SNS 投稿のルール", ["宿泊者が写り込む写真は投稿しない", "ハッシュタグはブランド共通のものを使う"]],
    ["クレーム対応", ["まず謝意と共感を伝える", "事実を確認し、その場でできる対応を提示する", "対応内容を記録し、翌朝の申し送りで共有する"]],
    ["備品の発注", ["月末に在庫を数え、発注表に記入する", "共通品はブランド一括発注を使う"]]
  ];
  function folders() {
    var out = [{ sec: "common", id: "common", name: "全施設共有", desc: "全拠点に流れ込みます。行動指針・ブランドの基礎データ。", pages: PAGES_COMMON, color: "#7c8cf0" }];
    var colors = ["#5aa8e0", "#f0965a", "#e8b84a", "#ef8a6a", "#e47bb0"];
    BRANDS.forEach(function (b, i) { out.push({ sec: "brand", id: "b" + i, name: b, desc: b + " の全拠点に流れ込みます。", pages: PAGES_BRAND, color: colors[i] }); });
    FAC.forEach(function (f, i) {
      var r = rnd("open" + f.id), y = 2018 + Math.floor(r() * 8), m = 1 + Math.floor(r() * 12);
      out.push({ sec: "site", id: "f" + i, name: f.name, desc: y + "-" + String(m).padStart(2, "0") + "-" + String(1 + Math.floor(r() * 27)).padStart(2, "0") + " 開業", pages: PAGES_BRAND.slice(0, 4).concat([["施設概要", ["住所・電話番号・最寄り駅", "客室数と客室タイプ", "駐車場の有無と台数"]], ["周辺案内", ["徒歩圏の飲食店とコンビニ", "観光地までの移動手段"]], ["緊急連絡先", ["最寄りの病院と夜間救急", "設備業者と警備会社の連絡先"]]]), color: colors[BRANDS.indexOf(f.brand)], tag: "社内" });
    });
    return out;
  }
  O.VIEWS.manual = function () {
    return O.pageHead("manual") +
      '<div class="tool-layout"><aside class="tool-side"><button class="side-item" type="button" data-home aria-current="true"><span>' + icon("home") + ' ホーム</span></button><p class="side-group">管理</p>' +
      '<p class="side-group">' + icon("star") + ' お気に入り</p><div id="mFav"></div></aside>' +
      '<div class="tool-main"><div class="filters"><span class="filter-ico">' + icon("search") + '</span><input class="f-input" id="mQ" placeholder="施設・フォルダ・ページを検索" aria-label="検索"><span class="f-count" id="mCount"></span>' +
      '<span class="seg" role="group" aria-label="表示"><button type="button" data-view-mode="list" aria-pressed="true">' + icon("todo") + 'リスト</button><button type="button" data-view-mode="tile" aria-pressed="false">' + icon("library") + "タイル</button></span></div>" +
      '<div id="mBody"></div></div></div>';
  };
  O.AFTER.manual = function (root) {
    var F = folders(), mode = "list", at = null, page = null;
    function favs() { return store.get("manualFav", []); }
    function drawFav() {
      var f = favs();
      root.querySelector("#mFav").innerHTML = f.length ? f.map(function (id) { var x = F.filter(function (y) { return y.id === id; })[0]; return x ? '<button class="side-item" type="button" data-folder="' + id + '"><span>' + esc(x.name) + "</span></button>" : ""; }).join("") :
        '<p class="hint side-hint">行の「☆」を押すと、ここに表示されます。</p>';
    }
    function folderRow(x) {
      var fav = favs().indexOf(x.id) > -1;
      return '<div class="folder-row" ' + (mode === "tile" ? 'data-tile' : "") + '><button class="folder-open" type="button" data-folder="' + x.id + '"><svg class="folder-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="' + x.color + '" fill-opacity=".22" stroke="' + x.color + '" stroke-width="1.6"/></svg><span class="folder-name">' + esc(x.name) + "</span></button>" +
        '<span class="folder-desc">' + esc(x.desc) + '</span><span class="folder-pages">' + x.pages.length + "ページ</span>" + (x.tag ? '<span class="pill">' + x.tag + "</span>" : "") +
        '<button class="icon-btn ghost" type="button" data-fav="' + x.id + '" aria-pressed="' + fav + '" aria-label="お気に入り">' + icon("star", fav ? "faved" : "") + "</button></div>";
    }
    function home() {
      var q = root.querySelector("#mQ").value.trim();
      var list = F.filter(function (x) { return !q || (x.name + x.desc + x.pages.map(function (p) { return p[0]; }).join("")).indexOf(q) > -1; });
      root.querySelector("#mCount").textContent = list.length + " フォルダ";
      var sec = function (k, h, sub) { var l = list.filter(function (x) { return x.sec === k; }); return l.length ? '<h2 class="folder-sec">' + h + ' <span class="muted">' + sub + '</span></h2><div class="folders' + (mode === "tile" ? " tiles" : "") + '">' + l.map(folderRow).join("") + "</div>" : ""; };
      return '<div class="doc-head"><h2>オペマニュアル</h2><p>施設ごとのフォルダに入った現場の手順書（サンプル）</p></div>' +
        (list.length ? sec("common", "全施設共有", "全拠点に反映") + sec("brand", "ブランド", "そのブランドの拠点に反映") + sec("site", "拠点", "社外に共有できるのはこの種類だけ") : '<p class="empty">「' + esc(q) + "」に一致するフォルダやページはありません。</p>");
    }
    function folderView(x) {
      return '<nav class="crumbs"><button type="button" data-home>オペマニュアル</button>' + icon("chev") + "<b>" + esc(x.name) + '</b></nav><div class="doc-head"><h2>' + esc(x.name) + "</h2><p>" + esc(x.desc) + "</p></div>" +
        '<div class="folders">' + x.pages.map(function (p, i) {
          return '<div class="folder-row"><button class="folder-open" type="button" data-mpage="' + i + '">' + icon("library") + '<span class="folder-name">' + esc(p[0]) + '</span></button><span class="folder-desc">' + p[1].length + ' ステップ</span><span class="folder-pages">更新 ' + O.md(O.addDays(O.TODAY, -((i * 7 + x.name.length) % 40))) + "</span></div>";
        }).join("") + "</div>";
    }
    function pageView(x, i) {
      var p = x.pages[i];
      return '<nav class="crumbs"><button type="button" data-home>オペマニュアル</button>' + icon("chev") + '<button type="button" data-folder="' + x.id + '">' + esc(x.name) + "</button>" + icon("chev") + "<b>" + esc(p[0]) + '</b></nav><article class="card pad doc"><h2>' + esc(p[0]) + '</h2><ol class="steps">' + p[1].map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></article>";
    }
    function draw() {
      drawFav();
      root.querySelector("#mBody").innerHTML = page !== null ? pageView(at, page) : at ? folderView(at) : home();
      root.querySelectorAll("[data-view-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view-mode") === mode)); });
    }
    root.querySelector("#mQ").addEventListener("input", function () { at = null; page = null; draw(); });
    root.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-fav]"))) { var id = t.getAttribute("data-fav"), f = favs(), i = f.indexOf(id); if (i > -1) f.splice(i, 1); else f.push(id); store.set("manualFav", f); O.toast(i > -1 ? "お気に入りから外しました" : "お気に入りに追加しました"); return draw(); }
      if ((t = e.target.closest("[data-folder]"))) { at = F.filter(function (x) { return x.id === t.getAttribute("data-folder"); })[0]; page = null; return draw(); }
      if ((t = e.target.closest("[data-mpage]"))) { page = +t.getAttribute("data-mpage"); return draw(); }
      if (e.target.closest("[data-home]")) { at = null; page = null; return draw(); }
      if ((t = e.target.closest("[data-view-mode]"))) { mode = t.getAttribute("data-view-mode"); return draw(); }
    });
    draw();
  };

  // ================= RM ポリシー・台帳 =================
  var CHAPTERS = [
    ["序章", "本書について", ["目的", "用語と KPI の定義", "役割分担と決裁権限"]],
    ["1章", "価格ポリシー", ["販売思想", "ボトム価格", "人数によるチャージ", "子供料金", "宿泊税等の価格表示", "レートパリティと価格設計", "直前割の上限", "繁忙期の価格"]],
    ["2章", "プランポリシー", ["標準プラン", "キャンセルポリシー", "プランの新設", "海外 OTA での販売制限", "販売可能期間", "非常時対応"]],
    ["3章", "販促・広告", ["販促施策の実施", "広告予算", "OTA からのマーケット情報取得"]],
    ["4章", "施設情報の設定", ["施設名", "星（★）の設定", "施設カテゴリ", "施設紹介文（新規開業・リニューアル時）"]],
    ["5章", "部屋名", ["部屋名の付け方", "ベッドタイプの表記", "定員と添い寝"]],
    ["6章", "OTA 掲載ルール", ["写真の選び方", "掲載文のテンプレート", "在庫の共有"]]
  ];
  var BODY = "この項目では、全施設で共通の考え方と、施設ごとに判断してよい範囲を定めます。迷ったときは RM 責任者に確認し、決めた内容は台帳に記録してください。（サンプル本文）";
  O.VIEWS.rm = function () {
    return O.pageHead("rm") +
      '<div class="tool-layout"><aside class="tool-side"><div class="side-head"><span class="side-title">RM ポリシー・台帳</span>' + sideToggle() + '</div><button class="side-item" type="button" data-toc aria-current="true"><span>' + icon("home") + ' 目次</span></button>' +
      '<p class="side-group">' + icon("star") + ' お気に入り</p><div id="rmFav"></div></aside><div class="tool-main" id="rmMain"></div></div>';
  };
  O.AFTER.rm = function (root) {
    var view = "toc", ch = 0;
    function favs() { return store.get("rmFav", []); }
    function ledger() {
      var l = store.get("rmLedger", null);
      if (!l) {
        l = [[-1, FAC[2].name, "週末料金", 32000, 34000, "鈴木", "競合の値上げに追随"], [-2, FAC[9].name, "連泊割", 10, 12, "山本", "平日稼働の底上げ"], [-3, FAC[15].name, "朝食付き（Agoda）", 23500, 24800, "佐藤", "パリティ NG を修正"], [-5, FAC[7].name, "冬季料金", 15000, 18500, "鈴木", "雪まつり期間"]]
          .map(function (x, i) { return { id: "s" + i, date: O.iso(O.addDays(O.TODAY, x[0])), prop: x[1], item: x[2], from: x[3], to: x[4], by: x[5], note: x[6] }; });
        store.set("rmLedger", l);
      }
      return l;
    }
    function toc() {
      var q = (root.querySelector("#rmQ") || {}).value || "";
      var list = CHAPTERS.map(function (c, i) { return [c, i]; }).filter(function (x) { return !q || (x[0].join("") + BODY).indexOf(q) > -1; });
      return '<div class="doc-head"><h2>RM ポリシー・台帳</h2><p>販売価格・プラン・OTA 掲載の決まりと、条件・施設・部屋タイプの台帳。編集履歴は残ります。（サンプル）</p></div>' +
        '<label class="search-line">' + icon("search") + '<input id="rmQ" placeholder="例: OTA キャンセル（本文も検索）" value="' + esc(q) + '" aria-label="ポリシーを検索"></label>' +
        '<h2 class="folder-sec">販売ポリシー・掲載ルール <span class="muted">文章で読むルール。価格・プラン・販促と、OTA への掲載の決まり。</span></h2><div class="chapters">' +
        (list.length ? list.map(function (x) {
          var c = x[0], i = x[1], sec = c[2].slice(0, 6).map(function (s, j) { return (i ? i + "." : "0.") + (j + 1) + "　" + s; }).join("・") + (c[2].length > 6 ? " ほか" + (c[2].length - 6) + "件" : "");
          return '<button class="chapter" type="button" data-ch="' + i + '"><span class="ch-title">' + c[0] + "　" + c[1] + '</span><span class="ch-secs">' + sec + '</span><span class="row-sub">' + O.mdw(O.addDays(O.TODAY, -(i * 3 + 20))) + " 更新</span></button>";
        }).join("") : '<p class="empty">一致する章はありません。</p>') + "</div>" +
        '<h2 class="folder-sec">台帳 <span class="muted">条件・施設・部屋タイプの変更記録</span></h2><button class="chapter" type="button" data-ledger><span class="ch-title">料金・条件の変更台帳</span><span class="ch-secs">' + ledger().length + ' 件の記録・最終更新 ' + O.md(new Date(ledger().slice().sort(function (a, b) { return b.date.localeCompare(a.date); })[0].date + "T00:00:00")) + "</span></button>";
    }
    function chapter(i) {
      var c = CHAPTERS[i], key = "ch" + i, fav = favs().indexOf(key) > -1;
      return '<nav class="crumbs"><button type="button" data-toc>目次</button>' + icon("chev") + "<b>" + c[0] + "　" + c[1] + '</b></nav><article class="card pad doc"><div class="section-head"><h2>' + c[0] + "　" + c[1] + '</h2><button class="btn" type="button" data-fav-ch="' + key + '">' + icon("star", fav ? "faved" : "") + (fav ? "お気に入り済み" : "お気に入りに追加") + "</button></div>" +
        c[2].map(function (s, j) { return "<h3>" + (i ? i + "." : "0.") + (j + 1) + "　" + s + "</h3><p>" + BODY + "</p>"; }).join("") + '<p class="hint">編集履歴: ' + O.mdw(O.addDays(O.TODAY, -(i * 3 + 20))) + " 鈴木 更新・" + O.mdw(O.addDays(O.TODAY, -(i * 3 + 48))) + " 山本 更新</p></article>";
    }
    function ledgerView() {
      var l = ledger().slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
      return '<nav class="crumbs"><button type="button" data-toc>目次</button>' + icon("chev") + '<b>料金・条件の変更台帳</b></nav><form class="toolbar card wrap" id="rmForm">' +
        '<label class="field"><span>施設</span><select id="rmProp">' + FAC.map(function (f) { return "<option>" + esc(f.name) + "</option>"; }).join("") + "</select></label>" +
        '<label class="field grow"><span>項目</span><input id="rmItem" required placeholder="例: 週末料金"></label><label class="field"><span>変更前</span><input id="rmFrom" type="number" required></label><label class="field"><span>変更後</span><input id="rmTo" type="number" required></label>' +
        '<label class="field grow"><span>理由</span><input id="rmNote" placeholder="例: 競合の値上げに追随"></label><button class="btn btn-primary" type="submit">' + icon("plus") + "記録</button></form>" +
        '<section class="card pad"><div class="table-wrap"><table><thead><tr><th>日付</th><th>施設</th><th>項目</th><th class="num">変更前</th><th class="num">変更後</th><th>担当</th><th>理由</th></tr></thead><tbody>' +
        l.map(function (x) { var pc = x.from < 100; return "<tr><td>" + O.mdw(new Date(x.date + "T00:00:00")) + "</td><td>" + esc(x.prop) + "</td><td>" + esc(x.item) + '</td><td class="num">' + (pc ? x.from + "%" : O.yen(x.from)) + '</td><td class="num strong">' + (pc ? x.to + "%" : O.yen(x.to)) + "</td><td>" + esc(x.by) + '</td><td class="muted">' + esc(x.note) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
    }
    function draw() {
      var f = favs();
      root.querySelector("#rmFav").innerHTML = f.length ? f.map(function (k) { var i = +k.slice(2); return '<button class="side-item" type="button" data-ch="' + i + '"><span>' + CHAPTERS[i][0] + "　" + CHAPTERS[i][1] + "</span></button>"; }).join("") : '<p class="hint side-hint">章の「お気に入りに追加」で、ここに表示されます。</p>';
      root.querySelector("#rmMain").innerHTML = view === "toc" ? toc() : view === "ch" ? chapter(ch) : ledgerView();
    }
    root.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-ch]"))) { view = "ch"; ch = +t.getAttribute("data-ch"); return draw(); }
      if (e.target.closest("[data-toc]")) { view = "toc"; return draw(); }
      if (e.target.closest("[data-ledger]")) { view = "ledger"; return draw(); }
      if ((t = e.target.closest("[data-fav-ch]"))) { var k = t.getAttribute("data-fav-ch"), f = favs(), i = f.indexOf(k); if (i > -1) f.splice(i, 1); else f.push(k); store.set("rmFav", f); return draw(); }
    });
    root.addEventListener("input", function (e) { if (e.target.id === "rmQ") { var pos = e.target.selectionStart; draw(); var q = root.querySelector("#rmQ"); q.focus(); q.setSelectionRange(pos, pos); } });
    root.addEventListener("submit", function (e) {
      if (e.target.id !== "rmForm") return;
      e.preventDefault();
      var l = ledger();
      l.push({ id: "u" + Date.now(), date: O.iso(new Date()), prop: root.querySelector("#rmProp").value, item: root.querySelector("#rmItem").value.trim(), from: +root.querySelector("#rmFrom").value, to: +root.querySelector("#rmTo").value, by: "鈴木", note: root.querySelector("#rmNote").value.trim() });
      store.set("rmLedger", l); draw(); O.toast("台帳に記録しました");
    });
    draw();
  };

  // ================= ダッシュボード =================
  var PAL = ["#e8794a", "#2fae78", "#e0a72e", "#4a7ff0", "#d9547a", "#7a6ae8", "#2aa7b8", "#9a7b4f", "#5b6577", "#c94f4f"];
  var MONTHS = [];
  (function () { for (var k = 11; k >= -4; k--) { var d = new Date(O.TODAY.getFullYear(), O.TODAY.getMonth() - k, 1); MONTHS.push(d); } })();
  function ym(d) { return String(d.getFullYear()).slice(2) + "年" + (d.getMonth() + 1) + "月"; }
  function mstat(f, d) {
    var r = rnd("dash" + f.id + d.getFullYear() + d.getMonth()), rooms = 30 + (O.hash(f.id) % 70), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    var future = d > O.TODAY, occ = (future ? 0.25 + r() * 0.3 : 0.5 + r() * 0.35) * (d.getMonth() === 7 || d.getMonth() === 11 ? 1.1 : 1);
    var sold = Math.round(rooms * days * Math.min(0.98, occ)), adr = (14000 + (O.hash(f.area) % 22) * 1500) * (0.85 + r() * 0.35);
    var bookings = Math.round(sold / (1.5 + r() * 0.5)), guests = Math.round(sold * (1.6 + r() * 0.8));
    return { avail: rooms * days, sold: sold, rev: sold * adr, bookings: bookings, guests: guests };
  }
  function agg(facs, months) {
    var t = { avail: 0, sold: 0, rev: 0, bookings: 0, guests: 0 };
    facs.forEach(function (f) { months.forEach(function (d) { var s = mstat(f, d); for (var k in t) t[k] += s[k]; }); });
    t.occ = t.sold / t.avail; t.adr = t.rev / t.sold; t.revpar = t.rev / t.avail; return t;
  }
  function multiLine(series, labels, fmt) {
    var W = 680, H = 260, L = 64, R = 12, T = 12, B = 30, all = [];
    series.forEach(function (s) { s.v.forEach(function (v) { if (v != null) all.push(v); }); });
    var mx = Math.max.apply(null, all), mn = 0, step = Math.pow(10, Math.floor(Math.log10(mx / 3))), top = Math.ceil(mx / step) * step;
    function x(i) { return L + (W - L - R) * i / (labels.length - 1); }
    function y(v) { return T + (H - T - B) * (1 - (v - mn) / (top - mn)); }
    var g = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (k) { var v = top * k; g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="axis" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v) + "</text>"; });
    labels.forEach(function (lb, i) { if (i % 3 === 0) g += '<text class="axis" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + lb + "</text>"; });
    series.forEach(function (s) {
      var d = "", pen = false;
      s.v.forEach(function (v, i) { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); pen = true; });
      g += '<path d="' + d + '" fill="none" stroke="' + s.c + '" stroke-width="1.8" stroke-linejoin="round"><title>' + esc(s.n) + "</title></path>";
      s.v.forEach(function (v, i) { if (v != null) g += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.4" fill="' + s.c + '"><title>' + esc(s.n) + " " + labels[i] + " " + fmt(v) + "</title></circle>"; });
    });
    return '<figure class="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="月次の推移">' + g + "</svg></figure>";
  }
  function barsBy(rows, fmt) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; })) || 1;
    return '<div class="share">' + rows.map(function (r) { return '<div class="share-row"><span class="share-name small">' + esc(r[0]) + '</span><span class="share-bar"><i style="width:' + (r[1] / mx * 100).toFixed(1) + "%;background:" + r[2] + '"></i></span><span class="share-val">' + fmt(r[1]) + "</span></div>"; }).join("") + "</div>";
  }
  O.VIEWS.dashboard = function () {
    var mo = MONTHS.map(function (d, i) { return '<option value="' + i + '">' + ym(d) + "</option>"; }).join("");
    return O.pageHead("dashboard") +
      '<div class="tool-layout"><aside class="tool-side"><div class="side-head"><span class="side-title">絞り込み</span>' + sideToggle() + '</div>' +
      '<p class="side-group">期間</p><span class="seg" role="group" aria-label="期間の種類"><button type="button" data-pmode="single" aria-pressed="false">単月</button><button type="button" data-pmode="range" aria-pressed="true">期間</button></span>' +
      '<label class="field side-field"><select id="dFrom" aria-label="開始月">' + mo + '</select></label><span class="side-tilde">〜</span><label class="field side-field" id="dToWrap"><select id="dTo" aria-label="終了月">' + mo + "</select></label>" +
      '<p class="side-group">ブランド</p><label class="field side-field"><select id="dBrand"><option value="">ブランド：全て</option>' + BRANDS.map(function (b) { return "<option>" + b + "</option>"; }).join("") + "</select></label>" +
      '<p class="side-group">施設 <span class="side-count" id="dFacCount"></span></p><div id="dFacs"></div></aside>' +
      '<div class="tool-main"><div class="rv-top"><span class="seg tabs-seg" role="tablist">' + [["perf", "実績"], ["curve", "ブッキングカーブ"], ["mix", "ミックス"], ["data", "データ"], ["cross", "クロス分析"]].map(function (t, i) { return '<button type="button" role="tab" data-dtab="' + t[0] + '" aria-pressed="' + (i === 0) + '">' + t[1] + "</button>"; }).join("") +
      '</span><span class="rv-desc right" id="dRange"></span><button class="btn btn-primary" type="button" id="dExport">' + icon("down") + '書き出し</button></div><div id="dBody"></div></div></div>';
  };
  O.AFTER.dashboard = function (root) {
    var tab = "perf", pmode = "range", off = {};
    root.querySelector("#dFrom").value = "0"; root.querySelector("#dTo").value = String(MONTHS.length - 1);
    function facs() { var b = root.querySelector("#dBrand").value; return FAC.filter(function (f) { return (!b || f.brand === b) && !off[f.id]; }); }
    function months() { var a = +root.querySelector("#dFrom").value, z = pmode === "single" ? a : +root.querySelector("#dTo").value; if (z < a) { var t = a; a = z; z = t; } return MONTHS.slice(a, z + 1); }
    function side() {
      var b = root.querySelector("#dBrand").value, list = FAC.filter(function (f) { return !b || f.brand === b; });
      root.querySelector("#dFacCount").textContent = list.filter(function (f) { return !off[f.id]; }).length + " / " + list.length + " 施設";
      root.querySelector("#dFacs").innerHTML = BRANDS.filter(function (x) { return !b || x === b; }).map(function (x) {
        return '<p class="side-sub">' + x + "</p>" + FAC.filter(function (f) { return f.brand === x; }).map(function (f) { return '<label class="side-check"><input type="checkbox" data-fac="' + f.id + '"' + (off[f.id] ? "" : " checked") + "> " + f.area + "</label>"; }).join("");
      }).join("");
    }
    function perf(F, M) {
      var t = agg(F, M), lab = M.map(ym);
      var metric = function (name, sub, get, fmt) {
        var ser = F.slice(0, 10).map(function (f, i) { return { n: f.name, c: PAL[i % PAL.length], v: M.map(function (d) { var s = mstat(f, d); return get(s); }) }; });
        var tot = F.map(function (f, i) { var a = agg([f], M); return [f.name, get(a), PAL[i % PAL.length]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
        return '<section class="card pad"><h2>' + name + ' <span class="muted">' + sub + '</span></h2><div class="dash-pair"><div><p class="mini-head">月次の推移（施設ごと' + (F.length > 10 ? "・上位10施設" : "") + "）</p>" + multiLine(ser, lab, fmt) + '</div><div><p class="mini-head">施設別</p>' + barsBy(tot, fmt) + "</div></div></section>";
      };
      return '<section class="card pad"><h2>この期間の実績（選択中の施設の合計） <span class="muted">' + lab[0] + "〜" + lab[lab.length - 1] + "・" + F.length + "施設・" + M.length + "か月分の予約明細（サンプル）</span></h2>" +
        '<div class="kpis three-col">' + kpi("室夜", t.sold.toLocaleString(), "", "平均泊数 " + (t.sold / t.bookings).toFixed(2) + " 泊") + kpi("OCC（稼働率）", (t.occ * 100).toFixed(1) + "<small>%</small>", "", "室夜 ÷（総室数 × 日数）") +
        kpi("ADR（予約総額ベース）", Math.round(t.adr).toLocaleString() + "<small>円</small>", "", "売上（予約総額）÷ 室夜") + kpi("RevPAR（予約総額ベース）", Math.round(t.revpar).toLocaleString() + "<small>円</small>", "", "売上 ÷（総室数 × 日数）") +
        kpi("予約件数", t.bookings.toLocaleString() + "<small>件</small>", "", "売上（予約総額）" + Math.round(t.rev / 1000).toLocaleString() + " 千円") + kpi("人泊", t.guests.toLocaleString(), "", "宿泊人数 × 泊数") + "</div></section>" +
        '<p class="tool-note">指標ごとに1行で表示します。左は月次の推移で、折れ線は施設ごとに1本。右は施設別の期間合計で、左の折れ線と同じ色です。</p>' +
        metric("ADR（予約総額ベース）・円", "売上（予約総額）÷ 室夜", function (s) { return s.rev / s.sold; }, function (v) { return Math.round(v).toLocaleString(); }) +
        metric("OCC（稼働率）・%", "室夜 ÷（総室数 × 日数）", function (s) { return s.sold / s.avail * 100; }, function (v) { return v.toFixed(1); }) +
        metric("室夜", "販売した部屋数 × 泊数", function (s) { return s.sold; }, function (v) { return Math.round(v).toLocaleString(); });
    }
    function curve(F, M) {
      var d = M[M.length - 1], days = [90, 75, 60, 45, 30, 21, 14, 7, 3, 0], t = agg(F, [d]);
      var cur = days.map(function (x, i) { return Math.round(t.sold * Math.pow((i + 1) / days.length, 1.6)); }), last = cur.map(function (v, i) { return Math.round(v * (0.88 + 0.02 * i)); });
      return '<section class="card pad"><h2>ブッキングカーブ <span class="muted">' + ym(d) + " 宿泊分の積み上がり（室夜）</span></h2>" +
        O.lineChart([{ name: "今年", values: cur, cls: "s1" }, { name: "前年", values: last, cls: "s2" }], days.map(function (x) { return x ? x + "日前" : "当日"; }), function (v) { return Math.round(v).toLocaleString(); }) + "</section>";
    }
    function mix(F, M) {
      var r = rnd("mix" + F.length + M.length), ch = [["公式サイト", 0.28], ["楽天トラベル", 0.2], ["じゃらん", 0.16], ["Booking.com", 0.12], ["Expedia", 0.08], ["一休", 0.07], ["その他", 0.09]].map(function (x, i) { return [x[0], x[1] * (0.85 + r() * 0.3) * 100, PAL[i]]; });
      return '<section class="card pad"><h2>販売チャネルのミックス <span class="muted">室夜の構成比</span></h2>' + barsBy(ch, function (v) { return v.toFixed(1) + "%"; }) + "</section>";
    }
    function dataTable(F, M) {
      return '<section class="card pad"><h2>施設 × 月の明細 <span class="muted">室夜 / OCC / ADR</span></h2><div class="table-wrap"><table><thead><tr><th class="sticky">施設</th>' + M.map(function (d) { return '<th class="num">' + ym(d) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        F.map(function (f) { return '<tr><td class="sticky">' + esc(f.name) + "</td>" + M.map(function (d) { var s = mstat(f, d); return '<td class="num">' + s.sold.toLocaleString() + '<span class="row-sub">' + (s.sold / s.avail * 100).toFixed(0) + "%・" + Math.round(s.rev / s.sold / 1000) + "k</span></td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></section>";
    }
    function cross(F, M) {
      var B = BRANDS.filter(function (b) { return F.some(function (f) { return f.brand === b; }); });
      return '<section class="card pad"><h2>ブランド × 月の稼働率 <span class="muted">色が濃いほど高い</span></h2><div class="table-wrap"><table class="heat"><thead><tr><th class="sticky">ブランド</th>' + M.map(function (d) { return '<th class="num">' + ym(d) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        B.map(function (b) { var fs = F.filter(function (f) { return f.brand === b; }); return '<tr><td class="sticky">' + b + "</td>" + M.map(function (d) { var o = agg(fs, [d]).occ; return '<td class="num" style="background:color-mix(in srgb, var(--accent) ' + Math.round(o * 70) + '%, transparent);color:' + (o > 0.55 ? "#fff" : "inherit") + '">' + (o * 100).toFixed(0) + "%</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></section>";
    }
    function draw() {
      var F = facs(), M = months();
      root.querySelector("#dToWrap").hidden = pmode === "single";
      root.querySelector("#dRange").textContent = ym(M[0]) + (M.length > 1 ? " 〜 " + ym(M[M.length - 1]) : "") + "　2時間前に取得";
      root.querySelector("#dBody").innerHTML = !F.length ? '<p class="empty">施設が選ばれていません。左の一覧から選んでください。</p>' : tab === "perf" ? perf(F, M) : tab === "curve" ? curve(F, M) : tab === "mix" ? mix(F, M) : tab === "data" ? dataTable(F, M) : cross(F, M);
    }
    root.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-dtab]"))) { tab = t.getAttribute("data-dtab"); root.querySelectorAll("[data-dtab]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); }); return draw(); }
      if ((t = e.target.closest("[data-pmode]"))) { pmode = t.getAttribute("data-pmode"); root.querySelectorAll("[data-pmode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); }); return draw(); }
      if (e.target.closest("#dExport")) {
        var F = facs(), M = months(), rows = [["施設", "月", "室夜", "OCC", "ADR", "RevPAR", "予約件数", "人泊"].join(",")];
        F.forEach(function (f) { M.forEach(function (d) { var s = mstat(f, d); rows.push([f.name, ym(d), s.sold, (s.sold / s.avail * 100).toFixed(1) + "%", Math.round(s.rev / s.sold), Math.round(s.rev / s.avail), s.bookings, s.guests].join(",")); }); });
        download("ORCA_dashboard_" + O.iso(O.TODAY) + ".csv", new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv" }));
        O.toast("CSV を書き出しました（サンプル）");
      }
    });
    root.addEventListener("change", function (e) {
      if (e.target.matches("[data-fac]")) { off[e.target.getAttribute("data-fac")] = !e.target.checked; side(); return draw(); }
      if (e.target.id === "dBrand") side();
      if (["dFrom", "dTo", "dBrand"].indexOf(e.target.id) > -1) draw();
    });
    side(); draw();
  };

  // ================= 夜タスク依頼 =================
  var TYPES = ["新規拠点の競合調査（開業プランニング）", "競合のファミリー料金調査（子供料金・3人目加算）", "口コミの深掘り分析", "資料作成（PPTX）", "その他"];
  var PEOPLE = ["鈴木", "山口", "木村", "大塚"];
  function nights() {
    var l = store.get("night2", null);
    if (!l) {
      var seed = [["ブランドE 名古屋栄の競合調査", 0, 1, -8, "done", 1, true, 34.04], ["ブランドC 長崎の競合調査", 0, 1, -9, "done", 1, true, 24.88], ["ブランドE 名古屋栄の競合調査（重複）", 0, 1, -9, "cancel", 1, false, 0],
        ["新規プロジェクトの競合分析", 0, 2, -12, "done", 1, false, 41.32], ["ブランドE 宮島の競合分析", 0, 2, -13, "done", 1, true, 46.11], ["離島PJの開業前競合分析", 0, 2, -23, "done", 1, false, 37.57],
        ["ブランドC 札幌のファミリー料金調査（PPTX 付きで再実行）", 1, 3, -29, "done", 3, true, 52.4], ["高松の口コミを清掃の観点で深掘り", 2, 0, -2, "done", 1, false, 12.7]];
      l = seed.map(function (x, i) { var at = O.addDays(O.TODAY, x[3]); at.setHours(10 + i, 4 * i); var end = new Date(at.getTime() + (13 + i) * 3600e3); return { id: "s" + i, title: x[0], type: TYPES[x[1]], who: PEOPLE[x[2]], at: at.toISOString(), end: x[4] === "cancel" ? new Date(at.getTime() + 3600e3).toISOString() : end.toISOString(), status: x[4], targets: x[5], ownRate: x[6], cost: x[7] }; });
      store.set("night2", l);
    }
    return l;
  }
  function crc32(bytes) { var c, t = [], crc = -1; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ t[(crc ^ bytes[i]) & 0xff]; return (crc ^ -1) >>> 0; }
  function zip(name, text) {                       // minimal one-file "stored" zip
    var enc = new TextEncoder(), data = enc.encode(text), fn = enc.encode(name), crc = crc32(data);
    function u16(v) { return [v & 255, v >> 8 & 255]; } function u32(v) { return [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255]; }
    var local = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(fn.length), u16(0));
    var central = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(fn.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0));
    var off = local.length + fn.length + data.length;
    var end = [].concat(u32(0x06054b50), u16(0), u16(0), u16(1), u16(1), u32(central.length + fn.length), u32(off), u16(0));
    return new Blob([new Uint8Array(local), fn, data, new Uint8Array(central), fn, new Uint8Array(end)], { type: "application/zip" });
  }
  function fmtAt(iso) { var d = new Date(iso); return String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  O.VIEWS.night = function () {
    return O.pageHead("night", { actions: '<button class="btn" type="button" data-refresh>' + icon("refresh") + "更新 <kbd>R</kbd></button>" }) +
      '<div class="tool-layout"><aside class="tool-side"><div class="side-head"><span class="side-title">夜タスク</span>' + sideToggle() + '</div><button class="btn btn-primary block" type="button" data-new>' + icon("plus") + "新規申請</button>" +
      '<button class="side-item" type="button" aria-current="true"><span>' + icon("todo") + ' 依頼一覧</span><b id="nCount"></b></button><p class="side-group">依頼を検索</p>' +
      '<label class="side-search">' + icon("search") + '<input type="search" id="nQ" placeholder="例: 題・型・依頼者・施設" aria-label="依頼を検索"></label><label class="side-check"><input type="checkbox" id="nMine"> 自分の依頼のみ</label></aside>' +
      '<div class="tool-main"><p class="tool-note">添付と依頼文を送信すると、その晩に実行され、翌朝 zip で受け取れます。　<b class="accent">次の実行: 今夜 21:00</b></p>' +
      '<form class="card pad night-new" id="nForm" hidden><h2>新規申請</h2><div class="cond-row"><label class="field grow"><span>件名</span><input id="nTitle" required placeholder="例: ブランドB 小豆島の冬季競合調査"></label><label class="field grow"><span>型</span><select id="nType">' + TYPES.map(function (t) { return "<option>" + t + "</option>"; }).join("") + "</select></label></div>" +
      '<label class="field"><span>依頼文</span><textarea id="nBody" rows="3" placeholder="調べてほしい内容と、出してほしい形式"></textarea></label><label class="field"><span>添付</span><input type="file" id="nFile" multiple></label>' +
      '<div class="form-foot"><span class="hint">今夜 21:00 に実行する想定です（デモでは実行されません）。</span><span><button class="btn" type="button" data-cancel-new>キャンセル</button> <button class="btn btn-primary" type="submit">送信</button></span></div></form>' +
      '<h2 class="list-head">' + icon("todo") + ' 依頼一覧 <span class="col-count" id="nCount2"></span></h2><div class="night-list" id="nList"></div></div></div>';
  };
  O.AFTER.night = function (root) {
    var openId = null;
    function draw() {
      var q = root.querySelector("#nQ").value.trim(), mine = root.querySelector("#nMine").checked, all = nights();
      var list = all.filter(function (t) { return (!mine || t.who === "鈴木") && (!q || (t.title + t.type + t.who).indexOf(q) > -1); }).sort(function (a, b) { return b.at.localeCompare(a.at); });
      root.querySelector("#nCount").textContent = all.length; root.querySelector("#nCount2").textContent = list.length;
      var label = { done: ["完了", "good"], cancel: ["取消", ""], queued: ["受付済み", "info"], running: ["実行中", "warn"] };
      root.querySelector("#nList").innerHTML = list.length ? list.map(function (t) {
        var st = label[t.status];
        return '<article class="night-row' + (openId === t.id ? " open" : "") + '"><span class="pill ' + st[1] + '">' + st[0] + '</span><div class="row-body"><p class="night-title">' + esc(t.title) + '</p><p class="night-meta">' + esc(t.type) + '<span class="who">' + esc(t.who) + "</span>依頼 " + fmtAt(t.at) + (t.end ? "　終了 " + fmtAt(t.end) : "") + "</p>" +
          '<p class="night-meta">対象 ' + t.targets + "件" + (t.ownRate ? "　自社料金表あり" : "") + (t.cost ? "　$" + t.cost.toFixed(2) : "") + "</p>" +
          (openId === t.id ? '<div class="night-detail"><p><b>依頼文</b>　' + esc(t.body || "対象エリアの競合施設を洗い出し、日別最安料金と客室タイプの対応表を作ってください。") + "</p><p><b>成果物</b>　" + (t.status === "done" ? "result.txt（サンプル）" : "未作成") + "</p>" + (t.status === "queued" ? '<button class="btn" type="button" data-cancel="' + t.id + '">この依頼を取り消す</button>' : "") + "</div>" : "") +
          '</div><div class="night-actions">' + (t.status === "done" ? '<button class="btn btn-primary" type="button" data-zip="' + t.id + '">' + icon("down") + "zip をダウンロード</button>" : "") + '<button class="btn" type="button" data-detail="' + t.id + '" aria-expanded="' + (openId === t.id) + '">' + icon("feedback") + "詳細</button></div></article>";
      }).join("") : '<p class="empty">条件に合う依頼はありません。</p>';
    }
    root.addEventListener("click", function (e) {
      var t;
      if (e.target.closest("[data-new]")) { root.querySelector("#nForm").hidden = false; root.querySelector("#nTitle").focus(); return; }
      if (e.target.closest("[data-cancel-new]")) { root.querySelector("#nForm").hidden = true; return; }
      if (e.target.closest("[data-refresh]")) { draw(); return O.toast("一覧を更新しました"); }
      if ((t = e.target.closest("[data-detail]"))) { openId = openId === t.getAttribute("data-detail") ? null : t.getAttribute("data-detail"); return draw(); }
      if ((t = e.target.closest("[data-cancel]"))) { var l = nights(); l.forEach(function (x) { if (x.id === t.getAttribute("data-cancel")) { x.status = "cancel"; x.end = new Date().toISOString(); } }); store.set("night2", l); O.toast("依頼を取り消しました"); return draw(); }
      if ((t = e.target.closest("[data-zip]"))) {
        var x = nights().filter(function (y) { return y.id === t.getAttribute("data-zip"); })[0];
        download("ORCA_night_" + x.id + "_" + x.at.slice(0, 10) + ".zip", zip("result.txt", x.title + "\r\n" + x.type + "\r\n依頼 " + fmtAt(x.at) + " / 終了 " + fmtAt(x.end) + "\r\n\r\nこれはデモ用のサンプル成果物です。"));
        O.toast("zip をダウンロードしました（サンプル）");
      }
    });
    root.addEventListener("input", function (e) { if (e.target.id === "nQ") draw(); });
    root.addEventListener("change", function (e) { if (e.target.id === "nMine") draw(); });
    root.querySelector("#nForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var l = nights(), files = root.querySelector("#nFile").files;
      l.push({ id: "n" + Date.now(), title: root.querySelector("#nTitle").value.trim(), type: root.querySelector("#nType").value, who: "鈴木", at: new Date().toISOString(), end: null, status: "queued", targets: Math.max(1, files.length), ownRate: false, cost: 0, body: root.querySelector("#nBody").value.trim() });
      store.set("night2", l); e.target.reset(); e.target.hidden = true; draw(); O.toast("今夜 21:00 の実行に登録しました");
    });
    document.addEventListener("keydown", function onR(e) {
      if (!root.querySelector("#nList")) return document.removeEventListener("keydown", onR);
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") { draw(); O.toast("一覧を更新しました"); }
    });
    draw();
  };
})();
