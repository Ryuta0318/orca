/* ORCA "thinking" loader: the orca swims a figure-eight through the ring.
   Usage: ORCA.loader(canvas) -> { stop() }. Transparent background, scales to the canvas size. */
(function () {
  "use strict";
  var O = window.ORCA;
  var BASE = "assets/loader/";
  var NAMES = ["ring", "side", "qf", "front", "qb", "back", "bl", "bm", "bs", "splash"];
  var img = {}, loaded = null;

  function load() {
    if (loaded) return loaded;
    loaded = Promise.all(NAMES.map(function (n) {
      return new Promise(function (res) {
        var i = new Image();
        i.onload = function () { img[n] = i; res(); };
        i.onerror = function () { res(); };
        i.src = BASE + n + ".webp";
      });
    }));
    return loaded;
  }

  // Scene units (ring centre at 0,0). Scene box: 1100 x 600, ring a little below centre.
  var SW = 1100, SH = 600, OY = 40;
  var T = 6, RING = 1.4, K = 0.52, B = 345, CZ = 360, D = 1000, BEAT = 2, TAU = Math.PI * 2;
  var HOLE = { x: -1.4, y: 14.7 };
  var POSES = ["front", "qf", "side", "qb", "back"];
  function smooth(a, b, x) { var k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); }

  function path(t) {
    var th = TAU * t / T, X = B * Math.sin(th), Z = CZ * Math.sin(th) * Math.cos(th);
    var p = D / (D - Z), lift = 34 * Math.pow(Math.sin(th), 2);
    return { Z: Z, p: p, x: HOLE.x + X * p, y: HOLE.y - lift * p + 6 * Math.sin(TAU * t * 1.5),
      yaw: Math.atan2(B * Math.cos(th), CZ * Math.cos(2 * th)) };
  }

  var BUB = [];
  for (var k = 0; k < 36; k++) {
    var r1 = Math.abs((Math.sin(k * 12.9898) * 43758.5453) % 1), r2 = (Math.sin(k * 78.233) * 12345.678) % 1;
    BUB.push({ t0: k * T / 36, size: 0.35 + r1 * 0.45, drift: r2 * 40, life: 1.4 + Math.abs(r2) * 0.8, kind: ["bs", "bm", "bs", "bl"][k % 4] });
  }

  function scene(g, t) {
    function warped(im, w, h, amp) {
      var N = 48, sw = im.width / N, dw = w / N;
      for (var i = 0; i < N; i++) {
        var tail = 1 - (i + 0.5) / N, kk = Math.pow(Math.max(0, (tail - 0.3) / 0.7), 1.7);
        var dy = amp * h * 0.09 * kk * Math.sin(TAU * BEAT * t - 3.4 * tail);
        g.drawImage(im, i * sw, 0, sw + 0.6, im.height, -w / 2 + i * dw, -h / 2 + dy, dw + 0.6, h);
      }
    }
    function orca(o) {
      var a = Math.abs(o.yaw) / (Math.PI / 4), i0 = Math.min(3, Math.floor(a)), f = smooth(0.3, 0.7, a - i0);
      var mirror = o.yaw < 0 ? -1 : 1, s = K * o.p;
      g.save();
      g.translate(o.x, o.y);
      g.rotate(0.05 * Math.sin(TAU * BEAT * t + 1) * Math.sin(Math.abs(o.yaw)));
      [[POSES[i0], 1 - f], [POSES[i0 + 1], f]].sort(function (p, q) { return p[1] - q[1]; }).forEach(function (pw) {
        var im = img[pw[0]];
        if (pw[1] < 0.01 || !im) return;
        var w = im.width * s, h = im.height * s, bend = pw[0] === "side" ? 1 : (pw[0] === "front" || pw[0] === "back") ? 0 : 0.6;
        g.save();
        g.globalAlpha = Math.min(1, pw[1] * 1.7);
        g.scale(mirror, 1);
        if (bend) warped(im, w, h, bend);
        else { g.rotate(0.06 * Math.sin(TAU * BEAT * t)); g.drawImage(im, -w / 2, -h / 2, w, h); }
        g.restore();
      });
      g.restore();
    }
    function ring() {
      var br = 1 + 0.012 * Math.sin(TAU * t / T * 2), w = img.ring.width * RING * br, h = img.ring.height * RING * br;
      g.save(); g.rotate(0.03 * Math.sin(TAU * t / T)); g.drawImage(img.ring, -w / 2, -h / 2, w, h); g.restore();
    }
    function bubbles(front) {
      BUB.forEach(function (b) {
        var age = ((t - b.t0) % T + T) % T;
        if (age > b.life) return;
        var o = path(b.t0);
        if ((o.Z >= 0) !== front) return;
        var pr = age / b.life, side = Math.sign(Math.sin(o.yaw)) || 1, im = img[b.kind];
        if (!im) return;
        var x = o.x - side * 50 * o.p + b.drift * pr + 7 * Math.sin(pr * 8 + b.t0 * 3);
        var y = o.y - 140 * (0.5 - 0.5 * Math.cos(Math.PI * pr));
        var sz = im.width * 0.22 * b.size * o.p * (0.6 + 0.6 * pr);
        g.globalAlpha = Math.min(1, pr / 0.12) * (1 - pr) * 0.9;
        g.drawImage(im, x - sz / 2, y - sz / 2, sz, sz * im.height / im.width);
      });
      g.globalAlpha = 1;
    }
    function splash() {
      [0, T / 2].forEach(function (tc, j) {
        var age = ((t - tc) % T + T) % T, im = img.splash;
        if (age > 0.6 || !im) return;
        var pr = age / 0.6, dir = j === 0 ? 1 : -1, sc = 0.55 * (0.7 + 0.6 * pr);
        g.save();
        g.translate(HOLE.x - dir * 30, HOLE.y - 20 - 30 * pr);
        g.scale(-dir, 1); g.rotate(-0.4);
        g.globalAlpha = (1 - pr) * 0.85;
        g.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc);
        g.restore();
      });
      g.globalAlpha = 1;
    }
    var o = path(t);
    bubbles(false);
    if (o.Z < 0) { orca(o); ring(); } else ring();
    splash();
    if (o.Z >= 0) orca(o);
    bubbles(true);
  }

  O.loader = function (canvas) {
    var g = canvas.getContext("2d"), raf = 0, start = performance.now(), live = true;
    var still = O.reduceMotion();
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    }
    function fit() {                      // follow the box if it is resized (phone rotation, window drag)
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (Math.abs(canvas.width - Math.round(canvas.clientWidth * dpr)) > 2) size();
    }
    function frame(now) {
      if (!live) return;
      if (!canvas.isConnected) { live = false; return; }
      if (canvas.width < 2) size(); else fit();
      var sc = Math.min(canvas.width / SW, canvas.height / SH);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.imageSmoothingQuality = "high";
      g.setTransform(sc, 0, 0, sc, canvas.width / 2, canvas.height / 2 + OY * sc);
      scene(g, still ? 0.9 : ((now - start) / 1000) % T);
      if (!still) raf = requestAnimationFrame(frame);
    }
    load().then(function () { if (live && img.ring) { size(); raf = requestAnimationFrame(frame); } });
    return { stop: function () { live = false; cancelAnimationFrame(raf); } };
  };
  O.preloadLoader = load;
})();
