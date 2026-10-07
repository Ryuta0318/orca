/* ORCA settings dialog: personal settings, skills, memory, notes, search scope and usage. */
(function () {
  "use strict";
  var O = window.ORCA;
  var icon = O.icon, esc = O.esc, store = O.store;

  var TABS = [
    { id: "personal", label: "個人設定", icon: "sliders" },
    { id: "home", label: "ホーム", icon: "home" },
    { id: "color", label: "カラー", icon: "palette" },
    { id: "skills", label: "スキル", icon: "skills" },
    { id: "memory", label: "メモリ", icon: "memory" },
    { id: "notes", label: "自分のノート", icon: "note" },
    { id: "scope", label: "検索範囲 / コネクタ", icon: "connector" },
    { id: "usage", label: "利用状況", icon: "usage" }
  ];
  // Extra icons used only here
  var EXTRA = {
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M12 21c-1.5 0-2-1-2-2 0-2 3-2 3-4a2 2 0 0 0-2-2h-4"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    skills: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
    memory: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3.5 9h3M17.5 15h3"/>',
    note: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    connector: '<path d="M7 7h4v4H7zM13 13h4v4h-4z"/><path d="M11 9h3a2 2 0 0 1 2 2v2M7 11v3a2 2 0 0 0 2 2h4"/>',
    usage: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  function ic(name) {
    return EXTRA[name] ? '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + EXTRA[name] + "</svg>" : icon(name);
  }

  var SKILLS = [
    { id: "minutes", name: "議事録まとめ", cmd: "/minutes", sub: "会議メモから決定事項・宿題・期限を整理する" },
    { id: "compreport", name: "競合レポート作成", cmd: "/compare", sub: "競合調査と口コミのデータから週次の比較レポートを作る" },
    { id: "reply", name: "口コミ返信の下書き", cmd: "/reply", sub: "口コミの内容に合わせた返信文を、施設のトーンで下書きする" },
    { id: "mail", name: "メールの下書き", cmd: "/mail", sub: "要点を箇条書きで渡すと、社内外向けのメール文にする" },
    { id: "translate", name: "翻訳（日・英・中）", cmd: "/translate", sub: "案内文や掲載文を3言語に翻訳する" },
    { id: "sheet", name: "表の集計", cmd: "/sheet", sub: "貼り付けた表を集計し、要点を文章でまとめる" }
  ];
  var SCOPE = [
    { icon: "chats", t: "Teams内ファイル検索", s: "Teams のファイルとやり取りを検索", on: true },
    { icon: "book", t: "Hotel AI Wiki検索", s: "社内ナレッジ（Hotel AI Wiki）のノートを検索。回答の基本となる検索先", on: true },
    { icon: "globe", t: "Web検索", s: "社外の公開情報を Web で検索", on: true },
    { icon: "box", t: "Box内ファイル検索", s: "Box 上のファイルを検索", on: true },
    { icon: "binoculars", t: "競合価格・パリティ データ", s: "競合ホテルの価格レンジと公式サイト最安の判定（競合調査の集計）", on: true },
    { icon: "star", t: "口コミ・評判データ", s: "OTA別スコア・エリア内順位・トピック別の評価（口コミ収集の集計）", on: true },
    { icon: "chart", t: "販売実績データ", s: "施設別の室夜・稼働率・ADR・RevPAR（ダッシュボードの集計）", on: true },
    { icon: "lock", t: "経理・人事データ", s: "会計・給与・人事評価の情報", on: false }
  ];
  var MEMORY_SEED = ["担当施設は由布院と高山", "回答は箇条書きで短めに", "金額は税込で表示する", "競合は競合A・B・Cの3施設を基準にする"];
  var NOTES_SEED = [
    { t: "由布院 秋の販促メモ", b: "紅葉シーズンは連泊割を強化。公式サイトのバナーを10/15に差し替え。", d: -2 },
    { t: "口コミ返信のトーン", b: "最初にお礼、次に具体的な改善内容、最後に再訪のお誘い。定型文は避ける。", d: -9 }
  ];

  function memories() { var m = store.get("memory", null); if (!m) { m = MEMORY_SEED.slice(); store.set("memory", m); } return m; }
  function notes() {
    var n = store.get("notes", null);
    if (!n) { n = NOTES_SEED.map(function (x, i) { return { id: "s" + i, t: x.t, b: x.b, at: O.iso(O.addDays(O.TODAY, x.d)) }; }); store.set("notes", n); }
    return n;
  }
  function skillOn(id) { var s = store.get("skills", {}); return s[id] !== false; }
  function toggle(on, attr, label) {
    return '<button class="switch" type="button" role="switch" aria-checked="' + on + '" aria-label="' + esc(label) + '" ' + attr + "><span></span></button>";
  }

  // ---------- Panels ----------
  function seg(attr, cur, opts) {
    return '<span class="seg" role="group">' + opts.map(function (o) { return '<button type="button" ' + attr + '="' + o[0] + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + o[1] + "</button>"; }).join("") + "</span>";
  }
  var PANELS = {
    color: function () {
      var C = O.color, c = C.config(), key = C.themeKey();
      var sw = C.PRESETS.map(function (p) {
        return '<button class="swatch" type="button" data-color-preset="' + p.id + '" aria-pressed="' + (c.preset === p.id) + '" style="--sw:' + (p.hex || C.DEFAULT_ACCENT[key]) + '"><i></i>' + p.name + '<small class="muted">' + p.note + "</small></button>";
      }).join("") + '<button class="swatch" type="button" data-color-preset="custom" aria-pressed="' + (c.preset === "custom") + '" style="--sw:' + c.custom + '"><i></i>自分で選ぶ</button>';
      return '<h3>カラー</h3><p class="dlg-lead">差し色（ボタン・選択中の項目・グラフの線・アイコンなど）を、好きな色に変えられます。ライト・ダーク・FHG のどれでも使えます。</p>' +
        '<h4 class="set-h">差し色</h4><div class="swatches" role="group" aria-label="差し色のプリセット">' + sw + "</div>" +
        '<div class="cp-row"><input class="cp-pick" id="colPick" type="color" value="' + c.custom + '" aria-label="色を選ぶ"><input class="cp-hex" id="colHex" value="' + c.custom + '" maxlength="7" spellcheck="false" aria-label="色コード（例: #7a5cff）"><span class="hint" style="margin:0">色を選ぶか、色コードを入れると、すぐ反映されます</span></div>' +
        '<p class="cp-info" id="colInfo" aria-live="polite"></p>' +
        '<div class="set-list"><div class="set-row col"><span><span class="row-title">背景の色味</span><span class="row-sub wrap">差し色を背景にうっすら混ぜます。0 で混ぜません</span></span><span class="cp-row" style="padding:0"><input class="cp-range" id="colTint" type="range" min="0" max="100" step="1" value="' + c.tint + '" aria-label="背景の色味"><output class="cp-out" id="colTintOut">' + c.tint + "</output></span></div>" +
        '<div class="set-row"><span><span class="row-title">読みやすさのために自動調整する</span><span class="row-sub wrap">背景と見分けにくい色（ライトでの黄色など）を、明るさだけ調整します。切ると選んだ色そのままになります</span></span>' + toggle(!c.exact, "data-color-auto", "読みやすさのために自動調整する") + "</div>" +
        '<div class="set-row"><span><span class="row-title">色をもとに戻す</span><span class="row-sub wrap">差し色を標準に、背景の色味を 0 にします</span></span><button class="chip" type="button" data-color-reset>戻す</button></div></div>' +
        '<h4 class="set-h">プレビュー <span class="muted">いま開いているテーマでの見え方</span></h4>' +
        '<div class="cprev"><div class="cprev-row"><button class="btn btn-primary" type="button" tabindex="-1">主要ボタン</button><a class="see-all" href="javascript:void(0)" tabindex="-1" style="font-size:14px">リンクの色</a><span class="pill info">ラベル</span><span class="chip" aria-pressed="true" tabindex="-1">選択中</span><span class="chip" tabindex="-1">未選択</span><span class="switch" role="img" aria-label="オンのスイッチ" aria-checked="true" style="pointer-events:none"><span></span></span></div>' +
        '<div class="cprev-row"><div class="progress"><i></i></div><span class="cprev-bars" aria-hidden="true"><i style="height:30%"></i><i style="height:55%"></i><i style="height:42%"></i><i style="height:78%"></i><i style="height:60%"></i><i style="height:92%"></i></span></div></div>';
    },
    home: function () {
      var tiles = O.homeTiles(), choices = O.TILE_CHOICES(), oh = O.onhandConfig();
      var facs = O.FACILITIES || [];
      return '<h3>ホーム</h3><p class="dlg-lead">ホーム画面に出す内容を、自分用に変えられます。変更はすぐに反映されます。</p>' +
        '<h4 class="set-h">クイックアクセス <span class="muted">よく使う4つを並べます</span></h4><div class="slot-grid">' +
        tiles.map(function (id, i) {
          var c = choices.filter(function (x) { return x.id === id; })[0] || choices[0];
          return '<label class="slot"><span class="slot-no">' + (i + 1) + '</span><span class="tile-icon tone-' + c.tone + '">' + ic(c.icon) + '</span><select data-slot="' + i + '" aria-label="' + (i + 1) + '番目">' +
            choices.map(function (x) { return '<option value="' + x.id + '"' + (x.id === id ? " selected" : "") + ">" + esc(x.title) + "</option>"; }).join("") + "</select></label>";
        }).join("") + '</div><button class="link-btn" type="button" data-tiles-reset>初期設定（Chat・Agents・Library・Integrations）に戻す</button>' +
        '<h4 class="set-h">オンハンド <span class="muted">選んだ施設の ADR・OCC・RevPAR を、予算・前年と並べてホームに表示します。複数選ぶとホームで切り替えられます</span></h4><div class="set-list">' +
        '<div class="set-row"><span><span class="row-title">ホームにオンハンドを表示</span><span class="row-sub">オフのときは表示しません</span></span>' + toggle(oh.on, "data-oh-on", "ホームにオンハンドを表示") + "</div>" +
        '<div class="set-row' + (oh.on ? "" : " is-off") + '"><span><span class="row-title">最初に開く指標</span><span class="row-sub">ホームを開いたときに選ばれているタブ</span></span>' + seg("data-oh-metric", oh.metric, [["adr", "ADR"], ["occ", "OCC"], ["revpar", "RevPAR"]]) + "</div>" +
        '<div class="set-row col' + (oh.on ? "" : " is-off") + '"><span class="row-title">施設 <span class="muted">' + oh.facs.length + " / " + facs.length + ' 施設を選択中</span></span><div class="fac-pick">' +
        (O.FAC_BRANDS || []).map(function (b) {
          return '<div class="fac-group"><p>' + b + "</p>" + facs.filter(function (f) { return f.brand === b; }).map(function (f) {
            return '<label class="fac-opt"><input type="checkbox" data-oh-fac="' + f.id + '"' + (oh.facs.indexOf(f.id) > -1 ? " checked" : "") + "> " + esc(f.area) + "</label>";
          }).join("") + "</div>";
        }).join("") + "</div></div></div>";
    },
    personal: function () {
      var cur = store.get("theme", "light"), lang = store.get("lang", "ja"), n = store.get("notify", { todo: true, night: true });
      return '<h3>個人設定</h3><p class="dlg-lead">表示や通知など、自分だけに効く設定です。</p><div class="set-list">' +
        '<div class="set-row"><span><span class="row-title">テーマ</span><span class="row-sub">ライト・ダーク・FHG（黒とブランドカラー）・端末に合わせる</span></span><span class="seg" role="group" aria-label="テーマ">' +
        [["light", "ライト"], ["dark", "ダーク"], ["fhg", "FHG"], ["auto", "自動"]].map(function (k) { return '<button type="button" data-theme-set="' + k[0] + '" aria-pressed="' + (cur === k[0]) + '">' + k[1] + "</button>"; }).join("") + "</span></div>" +
        '<div class="set-row"><span><span class="row-title">回答の言語</span><span class="row-sub">チャットの回答に使う言語</span></span><label class="field inline"><select id="setLang">' +
        [["ja", "日本語"], ["en", "English"], ["zh", "中文"]].map(function (k) { return '<option value="' + k[0] + '"' + (lang === k[0] ? " selected" : "") + ">" + k[1] + "</option>"; }).join("") + "</select></label></div>" +
        '<div class="set-row"><span><span class="row-title">動きを減らす</span><span class="row-sub">シャチのローディングやコネクタの回転を止め、静止画で表示する</span></span>' + toggle(store.get("motion", "on") === "reduce", "data-motion", "動きを減らす") + "</div>" +
        '<div class="set-row"><span><span class="row-title">TODO のリマインド</span><span class="row-sub">期限の日の朝にお知らせする</span></span>' + toggle(n.todo, 'data-notify="todo"', "TODO のリマインド") + "</div>" +
        '<div class="set-row"><span><span class="row-title">夜タスクの完了通知</span><span class="row-sub">結果が出たらお知らせする</span></span>' + toggle(n.night, 'data-notify="night"', "夜タスクの完了通知") + "</div>" +
        '<div class="set-row"><span><span class="row-title">デモデータをリセット</span><span class="row-sub">TODO・夜タスク・台帳・メモリ・ノートを初期状態に戻す</span></span><button class="chip" type="button" data-reset>リセット</button></div>' +
        '<div class="set-row"><span><span class="row-title">サインイン画面</span><span class="row-sub">ログイン前の画面を表示する</span></span><a class="chip" href="#welcome" data-close-dlg>表示する</a></div>' +
        '<form class="set-row col" id="fbForm"><label class="row-title" for="fbText">フィードバックを送信</label><textarea id="fbText" rows="3" required placeholder="使いにくい点や欲しい機能を書いてください"></textarea><div class="form-foot"><span class="hint">デモ版のため、この端末に保存されます。</span><button class="btn btn-primary" type="submit">送信</button></div></form>' +
        "</div>";
    },
    skills: function () {
      return '<h3>スキル</h3><p class="dlg-lead">チャットの入力欄で「/」を押すと呼び出せる定型の作業です。オフにしたスキルは候補に出ません。</p><div class="set-list">' +
        SKILLS.map(function (s) {
          return '<div class="set-row"><span class="set-icon">' + ic("skills") + '</span><span class="row-body"><span class="row-title">' + esc(s.name) + ' <code>' + s.cmd + '</code></span><span class="row-sub wrap">' + esc(s.sub) + "</span></span>" +
            toggle(skillOn(s.id), 'data-skill="' + s.id + '"', s.name) + "</div>";
        }).join("") + "</div>";
    },
    memory: function () {
      var m = memories();
      return '<h3>メモリ</h3><p class="dlg-lead">ORCA が回答のたびに前提として使う、あなたについての情報です。不要なものは削除できます。</p>' +
        '<form class="add-row" id="memForm"><input id="memText" required placeholder="例: 会議は火曜と木曜の午前が多い" aria-label="覚えさせる内容"><button class="btn btn-primary" type="submit">' + icon("plus") + "追加</button></form>" +
        '<div class="set-list">' + (m.length ? m.map(function (x, i) {
          return '<div class="set-row"><span class="set-icon">' + ic("memory") + '</span><span class="row-body"><span class="row-title wrap">' + esc(x) + '</span></span><button class="icon-btn ghost" type="button" data-mem-del="' + i + '" aria-label="削除">' + icon("trash") + "</button></div>";
        }).join("") : '<p class="empty">覚えている情報はありません。</p>') + "</div>";
    },
    notes: function () {
      var n = notes();
      return '<h3>自分のノート</h3><p class="dlg-lead">自分だけが見られるメモです。回答の参考資料にも使われます。</p>' +
        '<form class="note-form" id="noteForm"><input id="noteTitle" required placeholder="タイトル" aria-label="タイトル"><textarea id="noteBody" rows="2" placeholder="内容" aria-label="内容"></textarea><button class="btn btn-primary" type="submit">' + icon("plus") + "ノートを追加</button></form>" +
        '<div class="set-list">' + (n.length ? n.map(function (x) {
          return '<div class="set-row top"><span class="set-icon">' + ic("note") + '</span><span class="row-body"><span class="row-title">' + esc(x.t) + '</span><span class="row-sub wrap">' + esc(x.b) +
            '</span><span class="row-sub">' + O.mdw(new Date(x.at + "T00:00:00")) + ' 更新</span></span><button class="icon-btn ghost" type="button" data-note-del="' + x.id + '" aria-label="削除">' + icon("trash") + "</button></div>";
        }).join("") : '<p class="empty">ノートはまだありません。</p>') + "</div>";
    },
    scope: function () {
      return '<h3>検索範囲 / コネクタ</h3><p class="dlg-lead">回答の作成時に参照する検索先の一覧です。質問に合う情報を、ここに載っている検索先から探します。参照できるのは権限の範囲内の内容です。</p><div class="set-list boxed">' +
        SCOPE.map(function (s) {
          return '<div class="set-row"><span class="set-icon">' + ic(s.icon) + '</span><span class="row-body"><span class="row-title">' + esc(s.t) + '</span><span class="row-sub wrap">' + esc(s.s) + "</span></span>" +
            '<span class="pill ' + (s.on ? "info" : "") + '">' + (s.on ? "利用中" : "対象外") + "</span></div>";
        }).join("") + "</div>";
    },
    usage: function () {
      var r = O.rng(77), days = [], total = 0;
      for (var i = 29; i >= 0; i--) { var v = Math.round(4 + r() * 14 + (i % 7 < 2 ? -3 : 2)); days.push(Math.max(0, v)); total += Math.max(0, v); }
      var by = [["ORCA チャット", 0.46], ["競合調査", 0.14], ["パリティ判定", 0.11], ["TODO", 0.1], ["口コミ・ランキング分析", 0.09], ["その他", 0.1]];
      return '<h3>利用状況</h3><p class="dlg-lead">直近30日間の利用です（サンプルデータ）。</p>' +
        '<div class="kpis three"><div class="kpi"><span class="kpi-label">質問数</span><span class="kpi-value">' + total + '</span><span class="kpi-note">直近30日</span></div>' +
        '<div class="kpi"><span class="kpi-label">1日平均</span><span class="kpi-value">' + (total / 30).toFixed(1) + '</span><span class="kpi-note">回</span></div>' +
        '<div class="kpi"><span class="kpi-label">参照した資料</span><span class="kpi-value">' + Math.round(total * 2.3) + '</span><span class="kpi-note">件</span></div></div>' +
        '<section class="card pad"><h2>日別の質問数</h2>' + O.barChart(days, days.map(function (_, i) { return O.md(O.addDays(O.TODAY, i - 29)); }), function (v) { return Math.round(v) + ""; }) + "</section>" +
        '<section class="card pad"><h2>機能別</h2><div class="share">' + by.map(function (b) {
          return '<div class="share-row"><span class="share-name">' + b[0] + '</span><span class="share-bar"><i style="width:' + (b[1] * 100 / 0.46) + '%"></i></span><span class="share-val">' + Math.round(b[1] * 100) + "%</span></div>";
        }).join("") + "</div></section>";
    }
  };

  // ---------- Dialog ----------
  var dlg, current = "scope", lastFocus;
  function build() {
    dlg = document.createElement("div");
    dlg.className = "dlg-wrap";
    dlg.hidden = true;
    dlg.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">' +
      '<header class="dlg-head"><span class="dlg-badge">' + ic("sliders") + '</span><h2 id="dlgTitle">設定</h2><button class="icon-btn ghost dlg-x" type="button" data-close-dlg aria-label="閉じる">' + icon("x") + "</button></header>" +
      '<nav class="dlg-tabs" role="tablist">' + TABS.map(function (t) {
        return '<button class="dlg-tab" role="tab" type="button" data-tab="' + t.id + '" aria-selected="false">' + ic(t.icon) + "<span>" + t.label + "</span></button>";
      }).join("") + '</nav><div class="dlg-body" id="dlgBody" role="tabpanel"></div><footer class="dlg-foot" id="dlgFoot" hidden></footer></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener("click", onClick);
    dlg.addEventListener("submit", onSubmit);
    dlg.addEventListener("input", function (e) {
      var t = e.target;
      if (t.id === "colPick") { dlg.querySelector("#colHex").value = t.value; dlg.querySelector("#colHex").classList.remove("bad"); setColor(function (c) { c.preset = "custom"; c.custom = t.value; }); }
      else if (t.id === "colHex") {
        var rgb = O.color.parse(t.value);
        t.classList.toggle("bad", !rgb);
        if (rgb) { var hx = O.color.toHex(rgb); dlg.querySelector("#colPick").value = hx; setColor(function (c) { c.preset = "custom"; c.custom = hx; }); }
      } else if (t.id === "colTint") setColor(function (c) { c.tint = +t.value; });
    });
    dlg.addEventListener("change", function (e) {
      var t = e.target;
      if (t.id === "setLang") { store.set("lang", t.value); O.toast("回答の言語を変更しました"); }
      if (t.hasAttribute("data-slot")) {
        var tiles = O.homeTiles().slice(), i = +t.getAttribute("data-slot"), j = tiles.indexOf(t.value);
        if (j > -1 && j !== i) tiles[j] = tiles[i];            // picking a tile already shown swaps the two slots
        tiles[i] = t.value; store.set("homeTiles", tiles); show("home"); O.refreshHome();
      }
      if (t.hasAttribute("data-oh-fac")) {
        var id = t.getAttribute("data-oh-fac"), on = t.checked;
        saveOh(function (c) { c.facs = c.facs.filter(function (x) { return x !== id; }); if (on) c.facs.push(id); if (on) c.on = true; });
      }
    });
  }
  function show(tab) {
    current = tab;
    dlg.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === tab)); });
    dlg.querySelector("#dlgBody").innerHTML = PANELS[tab]();
    dlg.querySelector("#dlgBody").scrollTop = 0;
    if (tab === "color") refreshColor();
    var foot = dlg.querySelector("#dlgFoot");
    foot.hidden = tab !== "scope";
    foot.textContent = "検索範囲はこの画面では変更できません。「対象外」は、権限の範囲外の検索先です。";
  }
  O.openSettings = function (tab) {
    if (!dlg) build();
    lastFocus = document.activeElement;
    dlg.hidden = false;
    document.body.classList.add("dlg-open");
    show(tab || current);
    dlg.querySelector('[data-tab="' + current + '"]').focus();
  };
  function close() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    document.body.classList.remove("dlg-open");
    if (location.hash === "#settings") history.replaceState(null, "", "#" + (O.currentPage ? O.currentPage() : "home"));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  O.closeSettings = close;

  // Colour tab: update everything in place so the picker keeps focus while the user drags
  function refreshColor() {
    var C = O.color, c = C.config(), r = C.resolve(c), info = dlg.querySelector("#colInfo");
    if (!info) return;
    if (r.isDefault) info.innerHTML = "テーマ標準の色を使っています（ライトは青、ダークは明るい青、FHG はオレンジ）。";
    else {
      info.innerHTML = "適用される色 <b>" + r.hex.toUpperCase() + "</b>　背景との明るさの差 " + r.ratio.toFixed(1) + " : 1" +
        (r.adjusted ? "　読みやすさのため明るさを調整しました（選んだ色 <b>" + r.base.toUpperCase() + "</b>）" : "") +
        (c.exact && r.ratio < 4.5 ? '　<span class="warn">この色は背景と見分けにくく、小さな文字が読みにくくなります</span>' : "");
    }
    dlg.querySelectorAll("[data-color-preset]").forEach(function (b) {
      var id = b.getAttribute("data-color-preset"); b.setAttribute("aria-pressed", String(c.preset === id));
      if (id === "custom") b.style.setProperty("--sw", c.custom);
      if (id === "default") b.style.setProperty("--sw", C.DEFAULT_ACCENT[C.themeKey()]);
    });
    var out = dlg.querySelector("#colTintOut"); if (out) out.textContent = c.tint;
  }
  function setColor(fn) { var c = O.color.config(); fn(c); O.color.save(c); O.color.apply(); refreshColor(); }
  function saveOh(fn) { var c = O.onhandConfig(); fn(c); store.set("onhand", c); show("home"); O.refreshHome(); }
  function onClick(e) {
    if (e.target === dlg || e.target.closest("[data-close-dlg]")) { close(); return; }
    var cb = e.target.closest("[data-color-preset],[data-color-auto],[data-color-reset]");
    if (cb) {
      if (cb.hasAttribute("data-color-preset")) setColor(function (c) { c.preset = cb.getAttribute("data-color-preset"); });
      else if (cb.hasAttribute("data-color-auto")) { setColor(function (c) { c.exact = !c.exact; }); cb.setAttribute("aria-checked", String(!O.color.config().exact)); }
      else { setColor(function (c) { c.preset = "default"; c.tint = 0; c.exact = false; }); show("color"); O.toast("色をもとに戻しました"); }
      return;
    }
    var hb = e.target.closest("[data-oh-on],[data-oh-metric],[data-tiles-reset]");
    if (hb) {
      if (hb.hasAttribute("data-tiles-reset")) { store.set("homeTiles", ["chat", "agents", "library", "integrations"]); show("home"); O.refreshHome(); return O.toast("クイックアクセスを初期設定に戻しました"); }
      if (hb.hasAttribute("data-oh-on")) return saveOh(function (c) { c.on = !c.on; });
      if (hb.hasAttribute("data-oh-metric")) return saveOh(function (c) { c.metric = hb.getAttribute("data-oh-metric"); });
    }
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-tab")) return show(t.getAttribute("data-tab"));
    if (t.hasAttribute("data-theme-set")) {
      var v = t.getAttribute("data-theme-set");
      store.set("theme", v);
      O.applyTheme(v);
      t.parentNode.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
    } else if (t.hasAttribute("data-skill")) {
      var s = store.get("skills", {}), id = t.getAttribute("data-skill");
      s[id] = !skillOn(id); store.set("skills", s);
      t.setAttribute("aria-checked", String(s[id]));
    } else if (t.hasAttribute("data-motion")) {
      var red = store.get("motion", "on") !== "reduce";
      store.set("motion", red ? "reduce" : "on"); O.applyMotion();
      t.setAttribute("aria-checked", String(red));
      O.toast(red ? "動きを減らしました" : "動きをもとに戻しました");
    } else if (t.hasAttribute("data-notify")) {
      var n = store.get("notify", { todo: true, night: true }), k = t.getAttribute("data-notify");
      n[k] = !n[k]; store.set("notify", n);
      t.setAttribute("aria-checked", String(n[k]));
    } else if (t.hasAttribute("data-mem-del")) {
      var m = memories(); m.splice(+t.getAttribute("data-mem-del"), 1); store.set("memory", m); show("memory");
      O.toast("メモリから削除しました");
    } else if (t.hasAttribute("data-note-del")) {
      store.set("notes", notes().filter(function (x) { return x.id !== t.getAttribute("data-note-del"); })); show("notes");
      O.toast("ノートを削除しました");
    } else if (t.hasAttribute("data-reset")) {
      var keep = store.get("theme", "light");
      store.clear(); store.set("theme", keep);
      O.refreshBadges(); O.renderNotifs();
      O.toast("デモデータを初期状態に戻しました");
    }
  }
  function onSubmit(e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === "memForm") {
      var m = memories(); m.unshift(f.querySelector("input").value.trim()); store.set("memory", m); show("memory"); O.toast("メモリに追加しました");
    } else if (f.id === "noteForm") {
      var n = notes();
      n.unshift({ id: "n" + Date.now(), t: f.querySelector("#noteTitle").value.trim(), b: f.querySelector("#noteBody").value.trim(), at: O.iso(new Date()) });
      store.set("notes", n); show("notes"); O.toast("ノートを追加しました");
    } else if (f.id === "fbForm") {
      var fb = store.get("feedback", []); fb.push({ at: new Date().toISOString(), text: f.querySelector("textarea").value.trim() });
      store.set("feedback", fb); f.reset(); O.toast("フィードバックを保存しました");
    }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && dlg && !dlg.hidden) { e.stopPropagation(); close(); } }, true);
})();
