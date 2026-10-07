/* ORCA colour engine: a user-chosen accent for every theme (light / dark / FHG).
   The chosen colour is turned into the accent tokens and written as inline custom properties on <html>,
   which win over the theme's own values. Text-sized uses are kept readable by nudging lightness. */
(function () {
  "use strict";
  var O = window.ORCA, store = O.store, root = document.documentElement;

  // ---------- colour maths ----------
  function parse(hex) {
    hex = String(hex || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g, "$1$1");
    return /^[0-9a-f]{6}$/i.test(hex) ? [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16); }) : null;
  }
  function toHex(rgb) { return "#" + rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); }).join(""); }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(rgb) { return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function toHsl(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    function f(p, q, t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
  }
  function mixWith(rgb, other, t) { return rgb.map(function (v, i) { return v * (1 - t) + other[i] * t; }); }

  // ---------- theme awareness ----------
  var BG = { light: [255, 255, 255], dark: [24, 35, 58], fhg: [20, 20, 20] };   // surfaces text sits on
  var DEFAULT_ACCENT = { light: "#4a8ef0", dark: "#6aa5ff", fhg: "#dd5234" };
  function themeKey() {
    var t = store.get("theme", "light");
    if (t === "dark" || t === "fhg" || t === "light") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // ---------- presets ----------
  var PRESETS = [
    { id: "default", name: "標準", note: "テーマの色", hex: null },
    { id: "fhg", name: "FHG", note: "オレンジ", hex: "#dd5234" },
    { id: "seven", name: "seven", note: "seven x seven", hex: "#e8e64e" },
    { id: "fav", name: "fav", note: "fav", hex: "#c4386a" }
  ];
  function config() {
    var c = store.get("color", null);
    if (!c) {                                                     // migrate the earlier dark-only accent setting
      var old = store.get("accent", "default");
      c = { preset: old === "seven" || old === "fav" ? old : "default", custom: "#7a5cff", tint: 0, exact: false };
    }
    return { preset: c.preset || "default", custom: parse(c.custom) ? c.custom : "#7a5cff", tint: Math.max(0, Math.min(100, +c.tint || 0)), exact: !!c.exact };
  }
  function save(c) { store.set("color", c); }
  function baseHex(c) {
    if (c.preset === "custom") return c.custom;
    var p = PRESETS.filter(function (x) { return x.id === c.preset; })[0];
    return p && p.hex ? p.hex : null;
  }

  // The colour that is actually applied (after readability adjustment) for the current theme
  function resolve(c) {
    c = c || config();
    var key = themeKey(), hex = baseHex(c);
    if (!hex) return { hex: DEFAULT_ACCENT[key], base: null, adjusted: false, ratio: ratio(parse(DEFAULT_ACCENT[key]), BG[key]), key: key, isDefault: true };
    var rgb = parse(hex), bg = BG[key], adjusted = false;
    if (!c.exact && ratio(rgb, bg) < 4.5) {
      var hsl = toHsl(rgb), dir = lum(bg) > 0.5 ? -1 : 1, l = hsl[2];
      for (var i = 0; i < 90 && ratio(rgb, bg) < 4.5; i++) { l += dir * 0.01; if (l < 0.04 || l > 0.96) break; rgb = fromHsl(hsl[0], hsl[1], l); }
      adjusted = true;
    }
    return { hex: toHex(rgb), base: hex, adjusted: adjusted, ratio: ratio(rgb, bg), key: key, isDefault: false };
  }

  var VARS = ["--accent", "--accent-2", "--accent-soft", "--on-accent", "--c-ty", "--tint", "--orb-rot"];
  function apply() {
    var c = config(), r = resolve(c), st = root.style;
    if (r.isDefault && !c.tint) { VARS.forEach(function (v) { st.removeProperty(v); }); return; }
    var rgb = parse(r.hex), key = r.key;
    if (!r.isDefault) {
      var onAccent = ratio(rgb, [10, 10, 10]) >= ratio(rgb, [255, 255, 255]) ? "#0a0a0a" : "#ffffff";
      st.setProperty("--accent", r.hex);
      st.setProperty("--accent-2", toHex(mixWith(rgb, key === "light" ? [255, 255, 255] : [255, 255, 255], 0.28)));
      st.setProperty("--accent-soft", "rgba(" + rgb.map(Math.round).join(",") + "," + (key === "light" ? 0.12 : 0.17) + ")");
      st.setProperty("--on-accent", onAccent);
      st.setProperty("--c-ty", r.hex);
      st.setProperty("--orb-rot", Math.round(((toHsl(rgb)[0] - 215) % 360 + 360) % 360) + "deg");   // the ORCA glass is blue (~215°)
    } else VARS.filter(function (v) { return v !== "--tint"; }).forEach(function (v) { st.removeProperty(v); });
    st.setProperty("--tint", String(c.tint * 0.3));        // slider 0–100 → up to 30% of the accent mixed into the background
  }

  O.color = { config: config, save: save, apply: apply, resolve: resolve, parse: parse, toHex: toHex, PRESETS: PRESETS, DEFAULT_ACCENT: DEFAULT_ACCENT, themeKey: themeKey, baseHex: baseHex };
  O.applyColor = apply;
  if (window.matchMedia) {                                 // "auto" theme follows the OS, so re-resolve when it flips
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { if (store.get("theme", "light") === "auto") apply(); });
  }
  apply();
})();
