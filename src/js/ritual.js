/* Ritual: (1) the world reacts as your streak climbs (equippable WORLD EFFECTS from the shop), (2) Persona-style boss name cards,
   (3) a "soul severed" death screen with your last word frozen. Wraps existing globals like impact.js does; game.js is untouched.

   WORLD EFFECTS: a tiny registry. Each effect is built lazily (only when equipped AND the streak first starts), then cached.
   One shared 100ms poll computes the streak level k and calls paint(k) on the single active effect.
   PERF RULES every effect follows:
   - art is baked ONCE into small canvases (seamless tiles); nothing is redrawn per frame
   - motion is a CSS transform animation on a compositor layer (no repaint, no JS per frame)
   - k only flips classes / root opacity, quantized to 2% steps
   - the root is display:none whenever the streak is below the start threshold, and removed from the DOM when another effect is equipped
   - the poll does nothing while the tab is hidden; reduced-motion / shake-off pauses the animations */
(function () {
  const $ = (id) => document.getElementById(id);
  const tp = $("tp");
  if (!tp) return;
  const calm = () => matchMedia("(prefers-reduced-motion:reduce)").matches || ST.shake === false;
  const NS = "http://www.w3.org/2000/svg";

  function snd(fn) { try { if (AU.ctx && ST.sfx) fn(AU.ctx.currentTime + 0.01, AU.sfx); } catch (e) {} }

  /* ================= 1. world effects ================= */
  const css = document.createElement("style");
  css.id = "wfx-css";
  css.textContent =
    ".wfx{position:absolute;inset:0;overflow:hidden;pointer-events:none;opacity:0;transition:opacity .6s ease}" +
    ".wfx.rec{transition-duration:1.4s}" +
    ".wfx .wl{position:absolute;opacity:0;transition:opacity .9s ease}" +
    ".wfx .wl.on{opacity:1}" +
    ".wfx .wash{inset:0}" +
    ".wfx .mv{will-change:transform;animation:wfx-mv var(--d) linear infinite}" +
    "@keyframes wfx-mv{to{transform:translate3d(var(--mx),var(--my),0)}}" +
    ".wfx .fg{left:0;width:200%;will-change:transform;animation:wfx-fg var(--d) linear infinite}" +
    ".wfx .fg.r{left:-100%;animation-name:wfx-fgr}" +
    "@keyframes wfx-fg{to{transform:translate3d(-50%,0,0)}}" +
    "@keyframes wfx-fgr{to{transform:translate3d(50%,0,0)}}" +
    ".wfx .ec{left:50%;top:34%;width:78vmin;height:78vmin;margin:-39vmin 0 0 -39vmin;border-radius:50%;" +
    "background:radial-gradient(circle closest-side,#000 0 38%,#5a0707 40%,#e0291a 43%,rgba(255,70,30,.32) 50%,transparent 74%);" +
    "will-change:transform;animation:wfx-pulse 5s ease-in-out infinite alternate}" +
    "@keyframes wfx-pulse{from{transform:scale(1)}to{transform:scale(1.06)}}" +
      ".wfx .sil{background-repeat:no-repeat}" +
    ".wfx .sw1{transform-origin:50% 100%;animation:wfx-sw var(--d) ease-in-out infinite alternate}" +
    "@keyframes wfx-sw{from{transform:rotate(-10deg)}to{transform:rotate(-7deg)}}" +
    ".wfx .flg{transform-origin:100% 50%;animation:wfx-wave var(--d) ease-in-out infinite alternate}" +
    "@keyframes wfx-wave{from{transform:skewY(-5deg) scaleX(1)}to{transform:skewY(4deg) scaleX(.9)}}" +
    ".wfx .spin{animation:wfx-spin var(--d) linear infinite}" +
    "@keyframes wfx-spin{to{transform:rotate(360deg)}}" +
    ".wfx .bob{animation:wfx-bob var(--d) ease-in-out infinite alternate}" +
    "@keyframes wfx-bob{to{transform:translate3d(0,-2.5%,0)}}" +
    ".wfx .fl{opacity:0}" +
    ".wfx .fl.on{animation:wfx-fl var(--d) steps(1,end) infinite}" +
    "@keyframes wfx-fl{0%,90%,100%{opacity:0}91%{opacity:.8}92%{opacity:.1}93%{opacity:1}95%{opacity:0}}" +
    ".wfx.still .mv,.wfx.still .fg,.wfx.still .ec,.wfx.still .sw1,.wfx.still .flg,.wfx.still .spin,.wfx.still .bob,.wfx.still .fl{animation-play-state:paused}";
  document.head.appendChild(css);

  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const TAU = 6.2832;
  const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* --- tile painters (all wrap around the tile edges so the loop is seamless) --- */
  const glow = (a, b, c) => (x, X, Y, r) => {
    const g = x.createRadialGradient(X, Y, 0, X, Y, r * 3);
    g.addColorStop(0, a); g.addColorStop(0.35, b); g.addColorStop(1, c);
    x.fillStyle = g; x.beginPath(); x.arc(X, Y, r * 3, 0, TAU); x.fill();
  };
  const flat = (x, X, Y, r, q) => {
    x.fillStyle = "rgba(205,200,190," + (0.25 + 0.5 * q).toFixed(2) + ")";
    x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill();
  };
  const petal = (x, X, Y, r, q) => {
    x.save(); x.translate(X, Y); x.rotate(q * TAU); x.scale(1, 0.55);
    x.fillStyle = q > 0.5 ? "rgba(255,170,195,.85)" : "rgba(255,215,225,.8)";
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill(); x.restore();
  };
  const streak = (W, H) => {
    const n = Math.hypot(W, H), ux = -W / n, uy = H / n; // along the travel direction of the layer
    return (x, X, Y, r) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + ux * r, Y + uy * r); x.stroke(); };
  };
  function dotTile(W, H, o) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), r = rng(o.seed);
    if (o.pre) o.pre(x);
    for (let i = 0; i < o.n; i++) {
      const px = r() * W, py = r() * H, rad = o.r[0] + r() * (o.r[1] - o.r[0]), q = r();
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) o.draw(x, px + dx * W, py + dy * H, rad, q);
    }
    return c.toDataURL();
  }
  /* soft cloud strip, periodic in x so it can scroll forever; tiny canvas, CSS scales it up smooth */
  function fogTile(seed, rgb) {
    const W = 256, H = 96, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), img = x.createImageData(W, H);
    const oct = (gx, gy, s) => {
      const r = rng(s), g = []; for (let i = 0; i < gx * gy; i++) g.push(r());
      return (u, v) => {
        u *= gx; v *= gy - 1;
        const xi = Math.floor(u), yi = Math.min(Math.floor(v), gy - 2), a = u - xi, b = v - yi;
        const sa = a * a * (3 - 2 * a), sb = b * b * (3 - 2 * b), x0 = xi % gx, x1 = (xi + 1) % gx;
        return (g[yi * gx + x0] * (1 - sa) + g[yi * gx + x1] * sa) * (1 - sb) + (g[(yi + 1) * gx + x0] * (1 - sa) + g[(yi + 1) * gx + x1] * sa) * sb;
      };
    };
    const n1 = oct(4, 3, seed), n2 = oct(9, 5, seed + 17), col = rgb.split(",").map(Number);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const fx = xx / W, fy = y / H, v = n1(fx, fy) * 0.6 + n2(fx, fy) * 0.4;
      const a = sm(0.38, 0.8, v) * 0.55 * Math.sin(Math.PI * fy), p = (y * W + xx) * 4;
      img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = (a * 255) | 0;
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  /* --- effect definitions: ids must match the rows in shop.js ---
     mv: scrolling tile layers  { W,H tile px, mx,my travel in tiles (integers), d seconds per tile, t = streak level where it fades in }
     fog: drifting cloud strips; wash: static gradients; ec: the eclipse disc */
  /* --- baked SVG helper: returns a CSS url() value, rasterised once by the browser --- */
  const svgUrl = (w, h, body) => "url(" + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none">' + body + "</svg>")
    .replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")
    .replace(/^/, "data:image/svg+xml,") + ")";

  const embers = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(255,225,150,1)", "rgba(255,120,40,.6)", "rgba(255,60,10,0)") });
  const motes = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(230,250,255,1)", "rgba(120,210,255,.55)", "rgba(60,150,255,0)") });
  const bloodEmb = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(255,150,130,1)", "rgba(220,30,20,.55)", "rgba(120,0,0,0)") });
  const lants = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(255,240,190,1)", "rgba(255,150,50,.6)", "rgba(255,90,0,0)") });
  const sparks = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(255,250,200,1)", "rgba(255,200,60,.6)", "rgba(255,150,0,0)") });
  const ghosts = (n, r, seed) => ({ n, r, seed, draw: glow("rgba(255,255,255,.95)", "rgba(190,190,215,.4)", "rgba(0,0,0,0)") });
  const vstreak = (n, r, seed, col, w) => ({ n, r, seed,
    pre: (x) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; },
    draw: (x, X, Y, rad) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y + rad); x.stroke(); } });
  const wisp = (x, X, Y, r, q) => {
    x.lineCap = "round"; x.beginPath(); x.moveTo(X, Y);
    x.quadraticCurveTo(X + r * (q - 0.5) * 1.4, Y + r * 0.5, X, Y + r);
    x.strokeStyle = "rgba(10,0,20,.55)"; x.lineWidth = 5; x.stroke();
    x.strokeStyle = "rgba(170,90,255,.6)"; x.lineWidth = 1.6; x.stroke();
  };
  const rainPre = (x) => { x.strokeStyle = "rgba(205,30,40,.55)"; x.lineWidth = 1.4; x.lineCap = "round"; };

  /* Berserk-style field of skulls with broken spears; tiles seamlessly in x */
  function skullRow(seed, n) {
    const r = rng(seed), W = 600, H = 140;
    let b = "";
    for (let i = 0; i < 5; i++) { // broken spears behind the pile
      const x = 40 + r() * 520, h = 40 + r() * 60, lean = (r() - 0.5) * 30;
      b += '<path d="M' + x.toFixed(0) + " 118L" + (x + lean).toFixed(0) + " " + (118 - h).toFixed(0) + '" stroke="#0a0307" stroke-width="3"/>' +
        '<path d="M' + (x + lean).toFixed(0) + " " + (118 - h).toFixed(0) + "l-3 9h6z" + '" fill="#0a0307"/>';
    }
    b += '<path d="M0 140V112Q60 100 120 108T240 104T360 110T480 102T600 112V140Z" fill="#07020a"/>';
    const sk = [];
    for (let i = 0; i < n; i++) sk.push([30 + (i + r() * 0.8) * (540 / n), 112 - r() * 14, 0.8 + r() * 1.1]);
    sk.sort((a, c) => a[2] - c[2]).forEach(([x, y, s]) => {
      const f = s > 1.4 ? "#cfc6b4" : "#a79e8c";
      b += '<g transform="translate(' + x.toFixed(0) + " " + y.toFixed(0) + ") scale(" + s.toFixed(2) + ')"><path d="M-10 0C-10-12-6-16 0-16S10-12 10 0L7 3V9H-7V3Z" fill="' + f + '"/>' +
        '<ellipse cx="-4" cy="-4" rx="2.8" ry="3.4" fill="#12040a"/><ellipse cx="4" cy="-4" rx="2.8" ry="3.4" fill="#12040a"/>' +
        '<path d="M0-1L-1.6 2.4H1.6Z" fill="#12040a"/><path d="M-4 5V9M0 5V9M4 5V9" stroke="#12040a" stroke-width="1"/></g>';
    });
    b += '<path d="M0 132Q150 122 300 130T600 132V140H0Z" fill="#07020a"/>';
    return svgUrl(W, H, b);
  }
  const SWORD = svgUrl(60, 300,
    '<path d="M18 52H42V250L30 298L18 250Z" fill="#0b0508"/><path d="M42 52V250L30 298M18 52V250L30 298" fill="none" stroke="#8a1a24" stroke-width="1.6"/>' +
    '<rect x="4" y="40" width="52" height="12" rx="2" fill="#0b0508"/><rect x="26" y="0" width="8" height="42" fill="#0b0508"/><circle cx="30" cy="4" r="6" fill="#0b0508"/>');
  const POLE = svgUrl(12, 400, '<path d="M6 0L11 26H1Z" fill="#0b0508"/><rect x="4" y="26" width="4" height="374" fill="#0b0508"/>');
  const FLAG = svgUrl(170, 90,
    '<path d="M0 4H170L150 22L168 40L146 58L164 74L150 88H0Z" fill="#5c0910"/><path d="M0 4H170M0 88H150" stroke="#2a0306" stroke-width="3"/>' +
    '<circle cx="60" cy="45" r="22" fill="none" stroke="#e8c9a0" stroke-width="3" opacity=".7"/><path d="M60 26V64M42 45H78" stroke="#e8c9a0" stroke-width="3" opacity=".7"/>');
  const TOMOE = (function () {
    let t = "";
    [0, 120, 240].forEach((a) => { t += '<g transform="rotate(' + a + ' 100 100)"><circle cx="100" cy="52" r="11" fill="#0a0204"/><path d="M89 52C89 40 100 34 112 40C102 40 98 46 100 52Z" fill="#0a0204"/></g>'; });
    return svgUrl(200, 200, '<g opacity=".6"><circle cx="100" cy="100" r="92" fill="none" stroke="#c4121b" stroke-width="5"/>' +
      '<circle cx="100" cy="100" r="70" fill="#7a0a12" fill-opacity=".5" stroke="#c4121b" stroke-width="3"/>' +
      '<circle cx="100" cy="100" r="64" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="3 4"/>' + t +
      '<circle cx="100" cy="100" r="14" fill="#0a0204"/></g>');
  })();
  const CRESCENT = svgUrl(100, 100,
    '<mask id="m"><rect width="100" height="100" fill="#fff"/><circle cx="66" cy="44" r="40" fill="#000"/></mask>' +
    '<circle cx="50" cy="50" r="46" fill="#f2efe6" fill-opacity=".85" mask="url(#m)"/>');
  const AURA = svgUrl(100, 100,
    '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff2a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffb400" stop-opacity="0"/></radialGradient></defs><ellipse cx="50" cy="50" rx="50" ry="50" fill="url(#g)"/>');
  function bolt(seed) {
    const r = rng(seed); let x = 50, p = "M50 0";
    for (let i = 1; i <= 9; i++) { x = Math.max(10, Math.min(90, x + (r() - 0.5) * 40)); p += "L" + x.toFixed(0) + " " + i * 11; }
    return svgUrl(100, 100, '<path d="' + p + '" fill="none" stroke="#ffe14d" stroke-opacity=".35" stroke-width="9" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + p + '" fill="none" stroke="#fffbd0" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
  }
  function waveSvg(col, foam) {
    return svgUrl(400, 100, '<path d="M0 50Q50 20 100 50T200 50T300 50T400 50V100H0Z" fill="' + col + '"/>' +
      '<path d="M0 50Q50 20 100 50T200 50T300 50T400 50" fill="none" stroke="' + foam + '" stroke-width="3" vector-effect="non-scaling-stroke"/>');
  }
  function flames(seed) {
    const r = rng(seed);
    let b = '<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a0a" stop-opacity=".85"/><stop offset=".6" stop-color="#ff9a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd060" stop-opacity="0"/></linearGradient></defs>';
    for (let i = 0; i < 8; i++) {
      const x = i * 50, h = 100 - (35 + r() * 55), lean = (r() - 0.5) * 24;
      b += '<path d="M' + x + " 100Q" + (x + 8) + " " + (h + 30) + " " + (x + 25 + lean) + " " + h + "Q" + (x + 42) + " " + (h + 30) + " " + (x + 50) + ' 100Z" fill="url(#g)"/>';
    }
    return svgUrl(400, 100, b);
  }
  function branch(seed) {
    const r = rng(seed);
    let b = '<path d="M400 20C320 40 260 70 200 120S90 190 20 200" stroke="#1a0c12" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M300 50C290 90 280 110 270 140M180 130C170 160 150 175 130 195" stroke="#1a0c12" stroke-width="5" fill="none" stroke-linecap="round"/>';
    for (let i = 0; i < 38; i++) {
      const t = r(), x = 400 - t * 380 + (r() - 0.5) * 50, y = 20 + t * 180 + (r() - 0.5) * 60;
      b += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (4 + r() * 6).toFixed(1) + '" fill="' + (r() > 0.5 ? "#ffb7c8" : "#ffdbe4") + '" fill-opacity=".85"/>';
    }
    return svgUrl(400, 220, b);
  }

    /* ---- patch 2 helpers ---- */
  const mkGlow = (a, b, c) => (n, r, seed) => ({ n, r, seed, draw: glow(a, b, c) });
  const flies = mkGlow("rgba(220,255,160,1)", "rgba(120,220,90,.5)", "rgba(60,160,40,0)");
  const violet = mkGlow("rgba(235,210,255,1)", "rgba(150,80,255,.6)", "rgba(80,0,200,0)");
  const sandP = (x, X, Y, r, q) => { x.fillStyle = "rgba(225,215,190," + (0.25 + 0.45 * q).toFixed(2) + ")"; x.fillRect(X, Y, r, r * 0.6); };
  const pix = (x, X, Y, r, q) => { x.fillStyle = q > 0.5 ? "rgba(110,255,235,.85)" : "rgba(160,200,255,.8)"; x.fillRect(X, Y, r, r); };
  const feather = (x, X, Y, r, q) => {
    x.save(); x.translate(X, Y); x.rotate(q * TAU); x.scale(1, 0.3);
    x.fillStyle = "rgba(255,255,255,.8)"; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill(); x.restore();
  };
  const dstreak = (n, r, seed, col, w) => ({ n, r, seed, // falling streak: tail trails ABOVE the head
    pre: (x) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; },
    draw: (x, X, Y, rad) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - rad); x.stroke(); } });
  const neonPre = (x) => { x.strokeStyle = "rgba(120,230,255,.5)"; x.lineWidth = 1.3; x.lineCap = "round"; };
  const galePre = (x) => { x.strokeStyle = "rgba(190,215,255,.45)"; x.lineWidth = 1.3; x.lineCap = "round"; };

  /* Hueco Mundo: dunes + dead trees */
  const DUNE1 = svgUrl(800, 120, '<path d="M0 70Q100 30 200 60T400 55T600 62T800 70V120H0Z" fill="#7d7b8c" fill-opacity=".6"/>');
  const DUNE2 = svgUrl(800, 120, '<path d="M0 60Q120 20 240 54T480 48T800 60V120H0Z" fill="#12101a"/>' +
    '<path d="M0 60Q120 20 240 54T480 48T800 60" fill="none" stroke="#cfcbe0" stroke-opacity=".55" stroke-width="2" vector-effect="non-scaling-stroke"/>');
  function tree(seed) {
    const r = rng(seed); let b = "";
    (function br(x, y, a, len, w, d) {
      if (d > 5 || len < 8) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      b += '<path d="M' + x.toFixed(1) + " " + y.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + '" stroke="#0c0a10" stroke-width="' + w.toFixed(1) + '" stroke-linecap="round"/>';
      const n = d < 2 ? 2 : (r() < 0.6 ? 2 : 1);
      for (let i = 0; i < n; i++) br(x2, y2, a + (r() - 0.5) * 1.3, len * (0.68 + r() * 0.14), w * 0.68, d + 1);
    })(100, 300, -Math.PI / 2 + (r() - 0.5) * 0.2, 70, 9, 0);
    return svgUrl(200, 300, b);
  }

  /* Frontier Skybox */
  const PLANET = svgUrl(200, 140,
    '<defs><radialGradient id="p" cx=".35" cy=".35"><stop offset="0" stop-color="#bff3ff"/><stop offset="1" stop-color="#2b5aa8"/></radialGradient></defs>' +
    '<ellipse cx="100" cy="70" rx="95" ry="18" fill="none" stroke="#9fe8ff" stroke-opacity=".5" stroke-width="3" transform="rotate(-18 100 70)"/>' +
    '<circle cx="100" cy="70" r="44" fill="url(#p)" fill-opacity=".85"/>' +
    '<path d="M12 84Q100 112 188 56" fill="none" stroke="#9fe8ff" stroke-opacity=".7" stroke-width="3"/>');
  const ISLE = svgUrl(160, 110,
    '<path d="M10 40H150L120 70L90 108L70 76L36 62Z" fill="#0a1224" stroke="#5fd9ff" stroke-opacity=".6" stroke-width="2"/>' +
    '<path d="M44 40V12L54 4V40M96 40V22H110V40" fill="#0a1224" stroke="#5fd9ff" stroke-opacity=".6" stroke-width="2"/>');
  const BARS = svgUrl(100, 100,
    '<rect y="22" width="100" height="2" fill="#5fffe8" fill-opacity=".7"/><rect x="30" y="47" width="70" height="3" fill="#ff5fd0" fill-opacity=".6"/><rect y="71" width="60" height="2" fill="#5fffe8" fill-opacity=".6"/>');

  /* Royal Armory */
  const PORTAL = svgUrl(100, 100,
    '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff4b0" stop-opacity=".9"/><stop offset=".5" stop-color="#ffc83a" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a00" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="50" cy="50" r="48" fill="url(#g)"/><circle cx="50" cy="50" r="26" fill="none" stroke="#fff0a0" stroke-width="2"/>' +
    '<circle cx="50" cy="50" r="34" fill="none" stroke="#ffd860" stroke-width="1.5" stroke-dasharray="4 5"/>');

  /* Beyond the Wall */
  const COLOSSUS = svgUrl(200, 200,
    '<path d="M30 200V90C30 30 70 6 100 6S170 30 170 90V200Z" fill="#150a0c"/><path d="M30 90C30 30 70 6 100 6S170 30 170 90" fill="none" stroke="#9a2a1a" stroke-width="2"/>' +
    '<ellipse cx="72" cy="78" rx="13" ry="8" fill="#ffb347"/><ellipse cx="128" cy="78" rx="13" ry="8" fill="#ffb347"/>' +
    '<ellipse cx="72" cy="78" rx="5" ry="6" fill="#150a0c"/><ellipse cx="128" cy="78" rx="5" ry="6" fill="#150a0c"/>' +
    '<path d="M60 130Q100 150 140 130" fill="none" stroke="#ffb347" stroke-width="3" stroke-dasharray="5 4"/>');
  function wall() {
    let b = '<rect y="30" width="800" height="120" fill="#1a1214"/>';
    for (let i = 0; i < 20; i++) b += '<rect x="' + (i * 40 + 4) + '" y="12" width="28" height="22" fill="#1a1214"/>';
    for (let y = 30; y < 150; y += 20) {
      b += '<path d="M0 ' + y + 'H800" stroke="#2b1e20" stroke-width="2"/>';
      for (let x = (y / 20 % 2) * 20; x < 800; x += 40) b += '<path d="M' + x + " " + y + 'v20" stroke="#2b1e20" stroke-width="2"/>';
    }
    return svgUrl(800, 150, b);
  }

  /* Shadow Monarch */
  function army(seed) {
    const r = rng(seed); let b = "";
    for (let i = 0; i < 14; i++) {
      const x = 20 + i * 42 + r() * 14, h = 50 + r() * 45, base = 160, hy = base - h * 0.65 - 7;
      b += '<path d="M' + (x - 9) + " " + base + "L" + (x - 6) + " " + (base - h * 0.65) + "H" + (x + 6) + "L" + (x + 9) + " " + base + 'Z" fill="#05020a"/>' +
        '<circle cx="' + x + '" cy="' + hy + '" r="7" fill="#05020a"/>' +
        '<path d="M' + (x + 11) + " " + base + "V" + (base - h - 14) + '" stroke="#05020a" stroke-width="2"/>' +
        '<path d="M' + (x + 11) + " " + (base - h - 14) + 'l-3 9h6z" fill="#05020a"/>' +
        '<circle cx="' + (x - 3) + '" cy="' + hy + '" r="1.4" fill="#c58bff"/><circle cx="' + (x + 3) + '" cy="' + hy + '" r="1.4" fill="#c58bff"/>';
    }
    b += '<rect y="156" width="600" height="4" fill="#05020a"/>';
    return svgUrl(600, 160, b);
  }
  const MONARCH = svgUrl(100, 220,
    '<path d="M50 20L20 220H80Z" fill="#05020a"/><path d="M50 4C38 4 32 14 34 28H66C68 14 62 4 50 4Z" fill="#05020a"/>' +
    '<path d="M36 14L24 0M64 14L76 0" stroke="#05020a" stroke-width="4"/><path d="M28 70L8 130M72 70L92 130" stroke="#05020a" stroke-width="6"/>' +
    '<circle cx="43" cy="22" r="2.5" fill="#d2a0ff"/><circle cx="57" cy="22" r="2.5" fill="#d2a0ff"/>');

  /* Crimson Sea */
  const CROSS = svgUrl(100, 200,
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#ffd0d0" stop-opacity="0"/></linearGradient></defs>' +
    '<rect x="46" y="0" width="8" height="200" fill="url(#g)"/><rect x="22" y="60" width="56" height="7" fill="url(#g)"/>');
  const HEX = (function () {
    const r = 32, w = 55.4, cs = [[0, 0], [w, 0], [w / 2, 48], [0, 96], [w, 96]]; let b = "";
    cs.forEach(([cx, cy]) => {
      const p = [[cx, cy - r], [cx + w / 2, cy - r / 2], [cx + w / 2, cy + r / 2], [cx, cy + r], [cx - w / 2, cy + r / 2], [cx - w / 2, cy - r / 2]];
      b += '<polygon points="' + p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ") + '" fill="none" stroke="#ff8a2a" stroke-opacity=".55" stroke-width="1.5"/>';
    });
    return svgUrl(w, 96, b);
  })();

  /* Neon Dusk */
  function skyline(seed) {
    const r = rng(seed), cols = ["#ff3fa4", "#33e6ff", "#ffd24a"]; let b = "", x = 0;
    while (x < 780) {
      const w = (30 + r() * 50) | 0, h = (60 + r() * 110) | 0;
      b += '<rect x="' + x + '" y="' + (200 - h) + '" width="' + w + '" height="' + h + '" fill="#07050f"/>';
      if (r() < 0.4) b += '<path d="M' + (x + w / 2) + " " + (200 - h) + "v-" + ((10 + r() * 16) | 0) + '" stroke="#07050f" stroke-width="2"/>';
      for (let wy = 200 - h + 8; wy < 190; wy += 10) for (let wx = x + 5; wx < x + w - 5; wx += 9)
        if (r() < 0.28) b += '<rect x="' + wx + '" y="' + wy + '" width="4" height="5" fill="' + cols[(r() * 3) | 0] + '" fill-opacity=".8"/>';
      x += w + ((r() * 6) | 0);
    }
    return svgUrl(800, 200, b);
  }

  /* Grand Line Gale */
  const SHIP = svgUrl(200, 170,
    '<path d="M100 20V120" stroke="#07060b" stroke-width="4"/><path d="M104 28Q150 50 146 100L104 108Z" fill="#0b0a10"/><path d="M96 34Q60 54 62 96L96 104Z" fill="#0b0a10"/>' +
    '<path d="M100 20L134 14L100 8Z" fill="#7a0d14"/><path d="M12 112Q100 150 190 108L176 132Q100 162 28 136Z" fill="#07060b"/>');

  /* Higanbana Field */
  function lilies(seed, n) {
    const r = rng(seed); let b = "";
    for (let i = 0; i < n; i++) {
      const x = 10 + r() * 580, h = 30 + r() * 45, y = 100 - h;
      b += '<path d="M' + x.toFixed(0) + " 100Q" + (x + (r() - 0.5) * 10).toFixed(0) + " " + (100 - h / 2).toFixed(0) + " " + x.toFixed(0) + " " + y.toFixed(0) + '" stroke="#2a0810" stroke-width="1.6" fill="none"/>';
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + (k - 2.5) * 0.55, l = 12 + r() * 8;
        b += '<path d="M' + x.toFixed(0) + " " + y.toFixed(0) + "Q" + (x + Math.cos(a) * l * 0.6).toFixed(0) + " " + (y + Math.sin(a) * l * 1.1 - 6).toFixed(0) + " " +
          (x + Math.cos(a) * l * 1.3).toFixed(0) + " " + (y + Math.sin(a) * l * 0.6 + 4).toFixed(0) + '" stroke="#e0182a" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
      }
    }
    return svgUrl(600, 100, b);
  }

  /* Forest Spirits */
  function kodama(seed) {
    const r = rng(seed); let b = '<path d="M0 100V84Q150 76 300 86T600 84V100Z" fill="#04100a"/>';
    for (let i = 0; i < 7; i++) {
      const x = 40 + r() * 520, y = 82 + r() * 6, s = 0.7 + r() * 0.6;
      b += '<g transform="translate(' + x.toFixed(0) + " " + y.toFixed(0) + ") scale(" + s.toFixed(2) + ')"><ellipse cx="0" cy="-10" rx="9" ry="11" fill="#e8f0e0" fill-opacity=".85"/>' +
        '<ellipse cx="0" cy="2" rx="6" ry="4" fill="#e8f0e0" fill-opacity=".85"/><circle cx="-3" cy="-12" r="1.6" fill="#0a1a10"/><circle cx="3" cy="-12" r="1.6" fill="#0a1a10"/>' +
        '<ellipse cx="0" cy="-7" rx="1.8" ry="2.2" fill="#0a1a10"/></g>';
    }
    return svgUrl(600, 100, b);
  }

  /* wash: [css background, level, optional class, optional extra css]
     mv:   scrolling tile layers   fog: drifting clouds   band: scrolling SVG strip (u = svgUrl)
     sil:  baked SVG silhouette (u, pos css, cls = animation class, d = anim seconds, rep = tile along x)  */
  const D = {
    ash: {
      wash: [["radial-gradient(ellipse at 50% 50%,transparent 42%,rgba(20,17,15,.55))", 0]],
      mv: [
        { W: 800, H: 360, mx: -1, my: 1, d: 28, t: 0, dot: { n: 34, r: [0.9, 2.6], seed: 3, draw: flat } },
        { W: 560, H: 280, mx: -1, my: 1, d: 17, t: 0.4, dot: { n: 30, r: [1.3, 3.2], seed: 9, draw: flat } }
      ]
    },
    ember: {
      wash: [["linear-gradient(to top,rgba(200,60,10,.38),transparent 55%)", 0]],
      band: [{ u: flames(3), r: false, d: 12, t: 0.3, pos: "bottom:0;height:24%" }, { u: flames(8), r: true, d: 8, t: 0.65, pos: "bottom:0;height:16%" }],
      mv: [
        { W: 420, H: 420, mx: 0, my: -1, d: 15, t: 0, dot: embers(22, [1.2, 3], 5) },
        { W: 300, H: 300, mx: 0, my: -1, d: 9, t: 0.4, dot: embers(20, [0.9, 2.2], 12) },
        { W: 640, H: 640, mx: 0, my: -1, d: 6, t: 0.8, dot: embers(10, [3.5, 6], 27) }
      ]
    },
    lantern: {
      wash: [["linear-gradient(to top,rgba(255,150,40,.22),transparent 50%)", 0]],
      mv: [
        { W: 700, H: 700, mx: 0, my: -1, d: 48, t: 0, dot: lants(6, [5, 8], 14) },
        { W: 520, H: 520, mx: 0, my: -1, d: 34, t: 0.4, dot: lants(7, [3.5, 6], 22) },
        { W: 400, H: 400, mx: 0, my: -1, d: 22, t: 0.8, dot: lants(8, [2.5, 4.5], 36) }
      ]
    },
    fog: {
      fog: [
        { seed: 4, rgb: "186,178,206", r: false, d: 90, t: 0, pos: "bottom:0;height:62%" },
        { seed: 8, rgb: "150,160,190", r: true, d: 140, t: 0.35, pos: "top:14%;height:52%" }
      ]
    },
    mote: {
      wash: [["radial-gradient(ellipse at 50% 100%,rgba(40,110,200,.35),transparent 65%)", 0]],
      fog: [{ seed: 6, rgb: "90,150,220", r: false, d: 110, t: 0.3, pos: "bottom:0;height:40%" }],
      mv: [
        { W: 460, H: 460, mx: 0, my: -1, d: 26, t: 0, dot: motes(14, [1.8, 4.5], 21) },
        { W: 340, H: 340, mx: 0, my: -1, d: 17, t: 0.45, dot: motes(14, [1.4, 3.4], 33) },
        { W: 700, H: 700, mx: 0, my: -1, d: 40, t: 0.8, dot: motes(5, [7, 10], 44) }
      ]
    },
    curse: {
      wash: [["radial-gradient(ellipse at 50% 60%,rgba(60,0,90,.35),rgba(5,0,12,.55) 85%)", 0]],
      fog: [{ seed: 11, rgb: "70,20,110", r: false, d: 100, t: 0.2, pos: "bottom:0;height:55%" }],
      mv: [
        { W: 360, H: 360, mx: 0, my: -1, d: 12, t: 0, dot: { n: 14, r: [30, 70], seed: 5, draw: wisp } },
        { W: 280, H: 280, mx: 0, my: -1, d: 8, t: 0.5, dot: { n: 12, r: [24, 52], seed: 17, draw: wisp } }
      ]
    },
    thunder: {
      wash: [["linear-gradient(to bottom,rgba(50,42,0,.4),transparent 60%)", 0], ["rgba(255,230,90,.28)", 0.3, "fl", "--d:5s"], ["rgba(255,230,90,.18)", 0.6, "fl", "--d:7.3s;animation-delay:-2s"]],
      sil: [
        { u: bolt(3), pos: "left:14%;top:0;width:12%;height:72%;animation-delay:0s", cls: "fl", d: 5, t: 0.3 },
        { u: bolt(9), pos: "left:70%;top:0;width:14%;height:80%;animation-delay:-2s", cls: "fl", d: 7.3, t: 0.6 },
        { u: bolt(21), pos: "left:44%;top:0;width:10%;height:60%;animation-delay:-4s", cls: "fl", d: 6.1, t: 0.85 }
      ],
      mv: [{ W: 420, H: 420, mx: 0, my: -1, d: 10, t: 0.5, dot: sparks(14, [1.2, 3], 8) }]
    },
    petal: {
      wash: [["linear-gradient(to bottom,rgba(255,150,190,.14),transparent 60%)", 0.2]],
      sil: [{ u: branch(5), pos: "right:0;top:0;width:44%;height:30%", cls: "bob", d: 6, t: 0.3 }],
      mv: [
        { W: 900, H: 420, mx: -1, my: 1, d: 24, t: 0, dot: { n: 16, r: [3, 5.5], seed: 6, draw: petal } },
        { W: 640, H: 320, mx: -1, my: 1, d: 15, t: 0.45, dot: { n: 14, r: [2.5, 4.5], seed: 15, draw: petal } },
        { W: 1000, H: 500, mx: -1, my: 1, d: 10, t: 0.8, dot: { n: 7, r: [8, 13], seed: 31, draw: petal } }
      ]
    },
    wave: {
      wash: [["linear-gradient(to top,rgba(20,70,150,.4),transparent 55%)", 0]],
      band: [
        { u: waveSvg("rgba(20,60,130,.55)", "rgba(200,230,255,.5)"), r: true, d: 26, t: 0, pos: "bottom:-2%;height:26%" },
        { u: waveSvg("rgba(40,110,200,.55)", "rgba(220,240,255,.6)"), r: false, d: 16, t: 0.35, pos: "bottom:-4%;height:20%" },
        { u: waveSvg("rgba(90,170,240,.5)", "rgba(255,255,255,.8)"), r: true, d: 10, t: 0.7, pos: "bottom:-5%;height:14%" }
      ],
      mv: [{ W: 500, H: 500, mx: 0, my: -1, d: 20, t: 0.5, dot: motes(10, [1, 2.4], 19) }]
    },
    rain: {
      wash: [["linear-gradient(to bottom,transparent,rgba(110,0,12,.32))", 0.3], ["rgba(255,70,80,.22)", 0.5, "fl", "--d:8s"]],
      fog: [{ seed: 12, rgb: "120,20,30", r: false, d: 70, t: 0.25, pos: "top:-6%;height:46%" }],
      mv: [
        { W: 240, H: 480, mx: -1, my: 1, d: 0.7, t: 0, dot: { n: 34, r: [16, 34], seed: 2, pre: rainPre, draw: streak(240, 480) } },
        { W: 180, H: 360, mx: -1, my: 1, d: 0.5, t: 0.35, dot: { n: 26, r: [10, 22], seed: 7, pre: rainPre, draw: streak(180, 360) } }
      ]
    },
    tomoe: {
      wash: [["radial-gradient(ellipse at 50% 30%,rgba(190,10,20,.35),rgba(20,0,5,.5) 80%)", 0]],
      sil: [{ u: TOMOE, pos: "left:50%;top:4%;width:62vmin;height:62vmin;margin-left:-31vmin", cls: "spin", d: 40, t: 0.25 }],
      mv: [{ W: 420, H: 420, mx: 0, my: -1, d: 14, t: 0.5, dot: bloodEmb(14, [1, 2.4], 51) }]
    },
    hollow: {
      wash: [
        ["linear-gradient(to bottom,rgba(2,2,14,.55),rgba(0,0,0,0) 50%,rgba(215,205,175,.18))", 0],
        ["radial-gradient(ellipse at 50% 24%,rgba(225,225,240,.2),transparent 55%)", 0]
      ],
      fog: [{ seed: 14, rgb: "215,208,185", r: true, d: 120, t: 0.3, pos: "bottom:0;height:34%" }],
      mv: [
        { W: 700, H: 200, mx: -1, my: 0, d: 5, t: 0, dot: { n: 60, r: [1, 2.4], seed: 8, draw: sandP } },
        { W: 500, H: 160, mx: -1, my: 0, d: 3, t: 0.5, dot: { n: 50, r: [1, 2.6], seed: 18, draw: sandP } },
        { W: 360, H: 360, mx: 0, my: -1, d: 12, t: 0.7, dot: { n: 10, r: [30, 60], seed: 73, draw: wisp } }
      ],
      sil: [
        { u: CRESCENT, pos: "left:50%;top:3%;width:44vmin;height:44vmin;margin-left:-22vmin", cls: "bob", d: 9, t: 0.1 },
        { u: DUNE1, rep: 1, pos: "left:0;bottom:0;width:100%;height:30%", t: 0.1 },
        { u: tree(7), pos: "left:6%;bottom:10%;width:22vmin;height:33vmin", t: 0.25 },
        { u: tree(13), pos: "right:8%;bottom:8%;width:17vmin;height:26vmin", t: 0.5 },
        { u: DUNE2, rep: 1, pos: "left:0;bottom:-2%;width:100%;height:16%", t: 0.15 }
      ]
    },
    eclipse: {
      wash: [["radial-gradient(ellipse at 50% 34%,rgba(120,10,10,.3),transparent 60%)", 0.3], ["linear-gradient(to top,rgba(150,0,10,.45),transparent 42%)", 0.1]],
      ec: 0,
      mv: [
        { W: 420, H: 420, mx: 0, my: -1, d: 13, t: 0.15, dot: bloodEmb(24, [1, 2.6], 41) },
        { W: 600, H: 600, mx: 0, my: -1, d: 8, t: 0.7, dot: bloodEmb(10, [3, 5], 47) }
      ],
      sil: [
        { u: skullRow(19, 9), rep: 1, pos: "left:-6%;bottom:0;width:112%;height:38%", t: 0.6 },
        { u: SWORD, pos: "left:5%;bottom:-3%;width:9%;height:58%", cls: "sw1", d: 7, t: 0.4 },
        { u: POLE, pos: "right:11%;bottom:0;width:1.1%;height:62%", t: 0.5 },
        { u: FLAG, pos: "right:12.1%;bottom:44%;width:17%;height:17%", cls: "flg", d: 2.4, t: 0.5 },
        { u: skullRow(5, 12), rep: 1, pos: "left:0;bottom:0;width:100%;height:24%", t: 0.1 }
      ]
    },
    aura: {
      wash: [["radial-gradient(ellipse at 50% 100%,rgba(255,200,40,.45),transparent 65%)", 0], ["rgba(255,215,60,.2)", 0.4, "fl", "--d:4.5s"]],
      sil: [{ u: AURA, pos: "left:5%;bottom:-8%;width:90%;height:34%", cls: "bob", d: 3, t: 0.3 }],
      mv: [
        { W: 300, H: 500, mx: 0, my: -1, d: 1.1, t: 0, dot: vstreak(26, [40, 90], 4, "rgba(255,215,70,.55)", 2) },
        { W: 220, H: 400, mx: 0, my: -1, d: 0.8, t: 0.4, dot: vstreak(22, [30, 70], 9, "rgba(255,245,170,.7)", 1.6) },
        { W: 420, H: 420, mx: 0, my: -1, d: 7, t: 0.6, dot: sparks(16, [1.4, 3.4], 13) }
      ]
    },
    kodama: {
      wash: [["radial-gradient(ellipse at 50% 80%,rgba(30,120,70,.3),rgba(2,12,6,.6) 85%)", 0]],
      fog: [{ seed: 41, rgb: "120,200,150", r: false, d: 100, t: 0.2, pos: "bottom:0;height:45%" }],
      mv: [
        { W: 460, H: 460, mx: 0, my: -1, d: 30, t: 0, dot: flies(12, [1.6, 3.6], 9) },
        { W: 340, H: 340, mx: 0, my: -1, d: 20, t: 0.5, dot: flies(12, [1.2, 2.8], 27) }
      ],
      sil: [{ u: kodama(6), rep: 1, pos: "left:0;bottom:-2%;width:100%;height:20%", cls: "bob", d: 4, t: 0.3 }]
    },
    higan: {
      wash: [["linear-gradient(to top,rgba(150,0,20,.3),rgba(10,0,10,.45))", 0]],
      fog: [{ seed: 33, rgb: "120,30,70", r: true, d: 110, t: 0.3, pos: "bottom:0;height:40%" }],
      mv: [{ W: 460, H: 460, mx: 0, my: -1, d: 28, t: 0.2, dot: bloodEmb(10, [1.2, 3], 37) }],
      sil: [
        { u: lilies(4, 26), rep: 1, pos: "left:-4%;bottom:-3%;width:108%;height:22%", cls: "bob", d: 5, t: 0.05 },
        { u: lilies(15, 30), rep: 1, pos: "left:-2%;bottom:-4%;width:104%;height:32%", cls: "bob", d: 4, t: 0.55 }
      ]
    },
    neon: {
      wash: [["linear-gradient(to bottom,rgba(255,0,150,.2),transparent 45%,rgba(0,220,255,.2))", 0]],
      mv: [{ W: 200, H: 400, mx: -1, my: 1, d: 0.6, t: 0.2, dot: { n: 24, r: [14, 28], seed: 3, pre: neonPre, draw: streak(200, 400) } }],
      sil: [
        { u: skyline(4), rep: 1, pos: "left:0;bottom:0;width:100%;height:34%", t: 0.1 },
        { u: skyline(12), rep: 1, pos: "left:-3%;bottom:-4%;width:106%;height:22%", t: 0.5 }
      ]
    },
    gale: {
      wash: [["linear-gradient(to bottom,rgba(10,20,35,.55),rgba(0,30,50,.25))", 0], ["rgba(200,225,255,.25)", 0.35, "fl", "--d:6s"]],
      fog: [{ seed: 51, rgb: "70,85,110", r: false, d: 60, t: 0.1, pos: "top:-4%;height:42%" }],
      mv: [{ W: 200, H: 400, mx: -1, my: 1, d: 0.55, t: 0.2, dot: { n: 26, r: [14, 28], seed: 6, pre: galePre, draw: streak(200, 400) } }],
      band: [
        { u: waveSvg("rgba(10,40,70,.7)", "rgba(190,220,255,.5)"), r: true, d: 20, t: 0, pos: "bottom:-2%;height:26%" },
        { u: waveSvg("rgba(20,70,110,.65)", "rgba(220,240,255,.6)"), r: false, d: 12, t: 0.4, pos: "bottom:-4%;height:18%" }
      ],
      sil: [{ u: SHIP, pos: "left:56%;bottom:11%;width:26vmin;height:22vmin", cls: "bob", d: 4, t: 0.1 }]
    },
    frontier: {
      wash: [["linear-gradient(to bottom,rgba(10,40,90,.35),rgba(60,10,90,.25) 60%,transparent)", 0]],
      mv: [
        { W: 440, H: 440, mx: 0, my: -1, d: 18, t: 0, dot: { n: 30, r: [2, 5], seed: 3, draw: pix } },
        { W: 300, H: 300, mx: 0, my: -1, d: 10, t: 0.5, dot: { n: 24, r: [2, 4], seed: 12, draw: pix } }
      ],
      sil: [
        { u: PLANET, pos: "left:12%;top:6%;width:26vmin;height:18vmin", cls: "bob", d: 8, t: 0.1 },
        { u: ISLE, pos: "right:12%;top:22%;width:20vmin;height:14vmin", cls: "bob", d: 6, t: 0.35 },
        { u: ISLE, pos: "left:58%;top:8%;width:11vmin;height:8vmin", cls: "bob", d: 7, t: 0.6 },
        { u: BARS, pos: "left:0;top:0;width:100%;height:100%", cls: "fl", d: 3.7, t: 0.4 },
        { u: BARS, pos: "left:0;top:0;width:100%;height:100%;animation-delay:-2s;transform:scaleY(-1)", cls: "fl", d: 5.3, t: 0.75 }
      ]
    },
    gate: {
      wash: [["radial-gradient(ellipse at 50% 12%,rgba(255,190,40,.32),transparent 62%)", 0], ["rgba(255,225,120,.16)", 0.5, "fl", "--d:3.6s"]],
      mv: [
        { W: 300, H: 600, mx: 0, my: 1, d: 0.9, t: 0.05, dot: dstreak(10, [50, 120], 4, "rgba(255,220,100,.75)", 2) },
        { W: 240, H: 480, mx: 0, my: 1, d: 0.65, t: 0.45, dot: dstreak(10, [40, 90], 11, "rgba(255,250,200,.85)", 1.6) },
        { W: 420, H: 420, mx: 0, my: -1, d: 7, t: 0.6, dot: sparks(14, [1.4, 3.4], 13) }
      ],
      sil: [
        { u: PORTAL, pos: "left:8%;top:-6%;width:22vmin;height:22vmin", cls: "bob", d: 3, t: 0.05 },
        { u: PORTAL, pos: "left:62%;top:-4%;width:26vmin;height:26vmin;animation-delay:-1s", cls: "bob", d: 3.6, t: 0.3 },
        { u: PORTAL, pos: "left:36%;top:-8%;width:20vmin;height:20vmin;animation-delay:-2s", cls: "bob", d: 2.8, t: 0.55 },
        { u: PORTAL, pos: "left:80%;top:10%;width:16vmin;height:16vmin", cls: "bob", d: 3.3, t: 0.75 },
        { u: PORTAL, pos: "left:20%;top:16%;width:14vmin;height:14vmin;animation-delay:-1s", cls: "bob", d: 2.6, t: 0.9 }
      ]
    },
    titan: {
      wash: [["linear-gradient(to top,rgba(200,70,20,.4),rgba(90,20,10,.25) 55%,transparent)", 0]],
      fog: [
        { seed: 21, rgb: "230,225,220", r: false, d: 60, t: 0.2, pos: "bottom:14%;height:50%" },
        { seed: 23, rgb: "255,255,255", r: true, d: 90, t: 0.6, pos: "bottom:20%;height:40%" }
      ],
      mv: [{ W: 420, H: 420, mx: 0, my: -1, d: 14, t: 0.3, dot: bloodEmb(14, [1, 2.6], 29) }],
      sil: [
        { u: COLOSSUS, pos: "left:56%;bottom:18%;width:30vmin;height:30vmin", cls: "bob", d: 7, t: 0.15 },
        { u: wall(), rep: 1, pos: "left:0;bottom:0;width:100%;height:30%", t: 0.05 }
      ]
    },
    shadow: {
      wash: [["radial-gradient(ellipse at 50% 70%,rgba(70,0,130,.4),rgba(4,0,10,.6) 85%)", 0]],
      fog: [{ seed: 31, rgb: "90,30,160", r: false, d: 80, t: 0.2, pos: "bottom:0;height:46%" }],
      mv: [
        { W: 420, H: 420, mx: 0, my: -1, d: 11, t: 0, dot: violet(18, [1.2, 3], 5) },
        { W: 560, H: 560, mx: 0, my: -1, d: 7, t: 0.6, dot: violet(10, [3, 6], 19) }
      ],
      sil: [
        { u: army(3), rep: 1, pos: "left:0;bottom:0;width:100%;height:26%", t: 0.2 },
        { u: MONARCH, pos: "left:50%;bottom:0;width:14vmin;height:44vmin;margin-left:-7vmin", cls: "bob", d: 6, t: 0.5 },
        { u: army(8), rep: 1, pos: "left:-5%;bottom:-3%;width:110%;height:18%", t: 0.75 }
      ]
    },
    angel: {
      wash: [["radial-gradient(ellipse at 50% 30%,rgba(255,80,60,.35),rgba(30,0,8,.6) 85%)", 0], [HEX + " 0 0/70px auto", 0.4, "fl", "--d:6s"]],
      band: [
        { u: waveSvg("rgba(120,10,15,.6)", "rgba(255,120,110,.5)"), r: true, d: 30, t: 0, pos: "bottom:-2%;height:20%" },
        { u: waveSvg("rgba(160,15,20,.55)", "rgba(255,160,150,.55)"), r: false, d: 18, t: 0.5, pos: "bottom:-4%;height:14%" }
      ],
      mv: [
        { W: 700, H: 500, mx: -1, my: 1, d: 14, t: 0.1, dot: { n: 12, r: [5, 9], seed: 7, draw: feather } },
        { W: 900, H: 600, mx: -1, my: 1, d: 9, t: 0.7, dot: { n: 8, r: [9, 14], seed: 23, draw: feather } }
      ],
      sil: [{ u: CROSS, pos: "left:50%;top:0;width:18vmin;height:70%;margin-left:-9vmin", cls: "bob", d: 8, t: 0.2 }]
    }
  };
  const tileUrl = (o) => o.url || (o.url = dotTile(o.W, o.H, o.dot));
  const fogUrl = (o) => o.url || (o.url = fogTile(o.seed, o.rgb));

  function layerEl(cls, style) {
    const d = document.createElement("div");
    d.className = "wl " + cls; if (style) d.style.cssText = style;
    return d;
  }
  function build(id, def) {
    const root = document.createElement("div");
    root.className = "wfx wf-" + id;
    const ls = [];
    const add = (el, t) => { root.appendChild(el); ls.push({ el, t }); };
    (def.wash || []).forEach((w) => add(layerEl("wash" + (w[2] ? " " + w[2] : ""), "background:" + w[0] + (w[3] ? ";" + w[3] : "")), w[1]));
    if (def.ec != null) add(layerEl("ec", ""), def.ec);
    (def.mv || []).forEach((o) => add(layerEl("mv",
      "left:" + (o.mx > 0 ? -o.W : 0) + "px;top:" + (o.my > 0 ? -o.H : 0) + "px;" +
      "width:calc(100% + " + (o.mx ? o.W : 0) + "px);height:calc(100% + " + (o.my ? o.H : 0) + "px);" +
      "background:url(" + tileUrl(o) + ") 0 0/" + o.W + "px " + o.H + "px;" +
      "--mx:" + o.mx * o.W + "px;--my:" + o.my * o.H + "px;--d:" + o.d + "s"), o.t));
    (def.fog || []).forEach((o) => add(layerEl("fg" + (o.r ? " r" : ""),
      "background:url(" + fogUrl(o) + ") 0 0/50% 100%;" + o.pos + ";--d:" + o.d + "s"), o.t));
    (def.band || []).forEach((o) => add(layerEl("fg" + (o.r ? " r" : ""),
      "background:" + o.u + " 0 0/50% 100%;" + o.pos + ";--d:" + o.d + "s"), o.t));
    (def.sil || []).forEach((o) => add(layerEl("sil" + (o.cls ? " " + o.cls : ""),
      o.pos + ";background:" + o.u + (o.rep ? " 0 100%/auto 100% repeat-x" : " 0 0/100% 100% no-repeat") + (o.d ? ";--d:" + o.d + "s" : "")), o.t));
    return {
      root,
      paint(k) {
        root.style.opacity = k ? (0.2 + 0.8 * k).toFixed(2) : 0;
        for (const l of ls) l.el.classList.toggle("on", k > l.t);
      }
    };
  }

  /* --- default effect: blood ink + red tint + cracks (the original combo world, now built lazily) ---
     ink painted once into 4 tiny canvases, red tint is a static gradient, cracks are plain strokes that draw in once */
  function blood() {
    const root = document.createElement("div");
    root.id = "rtl";
    root.innerHTML = '<div class="rl-red"></div><div class="rl-ink"></div>';
    const red = root.querySelector(".rl-red");
    const inkBox = root.querySelector(".rl-ink");

    (function bakeInk() {
      const S = 192;
      const smooth = sm;
      function noiseFn(seed) {
        let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
        const G = []; for (let i = 0; i < 256; i++) G.push(r());
        const g = (a, b) => G[((b & 15) << 4) + (a & 15)];
        const v = (x, y) => {
          const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, w = y - yi;
          const su = u * u * (3 - 2 * u), sw = w * w * (3 - 2 * w);
          return (g(xi, yi) * (1 - su) + g(xi + 1, yi) * su) * (1 - sw) + (g(xi, yi + 1) * (1 - su) + g(xi + 1, yi + 1) * su) * sw;
        };
        return (x, y) => v(x, y) * 0.55 + v(x * 2.1, y * 2.1) * 0.3 + v(x * 4.3, y * 4.3) * 0.15;
      }
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([cx, cy], i) => {
        const c = document.createElement("canvas");
        c.width = c.height = S; c.className = "ik i" + i;
        const ctx = c.getContext("2d"), img = ctx.createImageData(S, S), n = noiseFn(11 + i * 37);
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          const fx = x / S, fy = y / S, d = Math.hypot(fx - cx, fy - cy);
          const v = d + (n(fx * 5, fy * 5) - 0.5) * 0.55;               // ragged ink edge
          const core = 1 - smooth(0.40, 0.55, v);                        // solid black pool
          const halo = 0.4 * (1 - smooth(0.45, 0.95, v));                // soft bleed
          const a = Math.max(core, halo) * (1 - smooth(0.85, 1, d));
          const p = (y * S + x) * 4; img.data[p + 3] = (a * 255) | 0;     // rgb stays 0 = black
        }
        ctx.putImageData(img, 0, 0);
        inkBox.appendChild(c);
      });
    })();

    const crSvg = document.createElementNS(NS, "svg");
    crSvg.setAttribute("class", "rl-cr");
    root.appendChild(crSvg);
    let cracks = [], kk = 0; // cracks: { els:[path...], c:threshold }
    function buildCracks() {
      const W = tp.clientWidth || 1280, H = tp.clientHeight || 720;
      crSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      crSvg.textContent = "";
      cracks = [];
      let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const N = 10, sx = W / 100, sy = H / 100;
      function add(pts, c, branch) {
        let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        const d = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
        const els = [];
        [["g", branch ? 3 : 5], ["m", branch ? 1 : 1.7]].forEach(([cls, w]) => { // g = blood glow stroke, m = bone-white crack
          const p = document.createElementNS(NS, "path");
          p.setAttribute("d", d); p.setAttribute("class", cls + (branch ? " b" : ""));
          p.style.strokeWidth = w; p.style.setProperty("--l", Math.ceil(len) + 2);
          crSvg.appendChild(p); els.push(p);
        });
        cracks.push({ els, c });
      }
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + rnd() * 0.5;
        let x = 50 + Math.cos(a) * 62, y = 50 + Math.sin(a) * 62;
        const pts = [[x * sx, y * sy]], steps = 6 + (rnd() * 4 | 0), raw = [];
        for (let j = 0; j < steps; j++) {
          x += (50 - x) * 0.17 + (rnd() - 0.5) * 9; y += (50 - y) * 0.17 + (rnd() - 0.5) * 9;
          raw.push([x, y]); pts.push([x * sx, y * sy]);
        }
        const c = i / N * 0.85;
        add(pts, c, false);
        const q = raw[1 + (rnd() * 2 | 0)];
        add([[q[0] * sx, q[1] * sy], [(q[0] + (rnd() - 0.5) * 22) * sx, (q[1] + (rnd() - 0.5) * 22) * sy]], c + 0.08, true);
      }
      paint(kk);
    }
    function paint(k) {
      kk = k;
      red.style.opacity = (k * 0.95).toFixed(3);
      inkBox.style.opacity = Math.min(1, k * 1.2).toFixed(3);
      const sc = "scale(" + (0.3 + 0.7 * k).toFixed(3) + ")";
      for (const c of inkBox.children) c.style.transform = sc;
      for (const cr of cracks) { const on = k > cr.c + 0.02; for (const p of cr.els) p.classList.toggle("on", on); }
    }
    buildCracks();
    return { root, paint, resize: buildCracks };
  }

  /* --- registry: "" is the free default (blood ink); the rest are bought in the shop (META.wf owned, META.wfE equipped) --- */
  const FX = { "": blood };
  Object.keys(D).forEach((id) => { FX[id] = () => build(id, D[id]); });
  const inst = {};
  const curW = () => { try { const e = META.wfE; return META.wf && META.wf[e] && FX[e] ? e : ""; } catch (e) { return ""; } };

  /* static thumbnail for the shop cards: a CSS background value, no live canvases, nothing animating */
  const thumbs = {};
  window.WORLDFX = {
    ids: Object.keys(D),
    thumb(id) {
      if (id in thumbs) return thumbs[id];
      let s = "";
      if (id === "") {
        s = "radial-gradient(circle at 0 0,#000 0 24%,transparent 52%),radial-gradient(circle at 100% 100%,#000 0 24%,transparent 52%),linear-gradient(rgba(130,0,12,.55),rgba(130,0,12,.55)),#0b0a0e";
      } else if (D[id]) {
        const d = D[id], parts = [];
        const s0 = d.sil && d.sil[0], b0 = d.band && d.band[0];
        if (d.sil && d.sil.some((o) => o.rep)) parts.push(d.sil.find((o) => o.rep).u + " 0 100%/auto 45% repeat-x");
        else if (s0) parts.push(s0.u + " 50% 40%/auto 70% no-repeat");
        if (b0) parts.push(b0.u + " 0 100%/100% 45% no-repeat");
        if (d.ec != null) parts.push("radial-gradient(circle closest-side at 50% 50%,#000 0 38%,#5a0707 40%,#e0291a 43%,rgba(255,70,30,.3) 50%,transparent 72%)");
        if (d.wash && d.wash[0]) parts.push(d.wash[0][0]);
        if (d.mv && d.mv[0]) parts.push("url(" + tileUrl(d.mv[0]) + ") 0 0/220px auto");
        if (d.fog && d.fog[0]) parts.push("url(" + fogUrl(d.fog[0]) + ") 0 0/100% 100%");
        parts.push("#0b0a0e");
        s = parts.join(",");
      }
      return (thumbs[id] = s);
    }
  };

  /* --- one shared loop: pick the equipped effect, compute k once, paint only the active effect --- */
  const bg = $("tpbg");
  let act = null, cur = 0, hideT = 0;

  function unmount() {
    clearTimeout(hideT);
    if (act) act.fx.root.remove();
    act = null; cur = 0;
  }
  function mount(id) {
    const had = !!inst[id], fx = inst[id] || (inst[id] = FX[id]());
    if (had && fx.resize) fx.resize();
    fx.paint(0);
    fx.root.style.display = "none";
    // live INSIDE the background stack (just under its vignette) so it is part of the backdrop and can't outrank gameplay
    if (bg) bg.insertBefore(fx.root, bg.querySelector(".vg") || null); else tp.insertBefore(fx.root, tp.firstChild);
    act = { id, fx }; cur = 0;
  }

  setInterval(() => {
    if (document.hidden) return;
    const id = curW();
    if (act && act.id !== id) unmount();
    const live = T.on && !T.done && !T.pz;
    const raw = live ? Math.max(0, Math.min(1, ((T.streak || 0) - 10) / 60)) : 0; // starts at streak 10, full at 70
    const k = Math.round(raw * 50) / 50;                                           // 2% steps = far fewer style writes
    if (!act) { if (k === 0) return; mount(id); }
    if (k === cur) return;
    const r = act.fx.root;
    clearTimeout(hideT);
    if (k > 0 && r.style.display === "none") { r.style.display = ""; void r.offsetWidth; } // flush so transitions start from 0
    r.classList.toggle("rec", k < cur || !live);
    r.classList.toggle("still", calm());
    act.fx.paint(k);
    if (k === 0) hideT = setTimeout(() => { if (cur === 0) r.style.display = "none"; }, 800); // fully off the render tree
    cur = k;
  }, 100);

  if (window.ResizeObserver) { let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (act && act.fx.resize) act.fx.resize(); }, 250); }).observe(tp); }

  /* ================= 2. boss name cards ================= */
  const FLAVOR = {
    "The Reaper": "Every word you leave unfinished, it collects.",
    "Lich King": "Crowned in silence. He remembers every typo.",
    "Oni Lord": "Horns first. Mercy never.",
    "Night Warden": "The dark keeps watch. Do not blink.",
    "Rasetsu": "It has waited at the end of every sentence."
  };
  let bossT = 0;
  function bossCard(name) {
    if (!name) return;
    const old = $("rtb"); if (old) old.remove();
    const kj = (typeof GL !== "undefined" && GL[name]) || "\u9B3C";
    const el = document.createElement("div");
    el.id = "rtb";
    el.innerHTML = '<div class="bd"></div><div class="b1"></div><div class="b2"></div><i class="bk"></i><div class="bt"><small>Boss</small><b></b><em></em></div><div class="bf"></div>';
    el.querySelector(".bk").textContent = kj;
    el.querySelector("b").textContent = name;
    el.querySelector("em").textContent = FLAVOR[name] || "Something old stirs.";
    tp.appendChild(el);
    clearTimeout(bossT); bossT = setTimeout(() => el.remove(), 1950);
    // hold the enemy gauge while the card plays so you don't lose time to the intro
    try { const now = performance.now(); T.fz = Math.max(T.fz || 0, now + 1700); if (T.mob && T.mob.pn) T.mob.pn += 1700; } catch (e) {}
    snd((t, d) => {
      sweep(70, 28, t, 0.9, "sine", 0.7, d);
      noise(t, 0.3, 0.18, 500, d);
      bell(196, t + 0.05, 1.3, 0.08, d);
      bell(294, t + 0.12, 1.1, 0.05, d);
    });
    if (!calm() && tp.animate) tp.animate([{ scale: 1.08 }, { scale: 1 }], { duration: 420, easing: "cubic-bezier(.16,.8,.3,1)" });
  }
  const hs = huntSpawn;
  huntSpawn = function () {
    const prev = T.mob, r = hs.apply(this, arguments);
    try { if (T.mob && T.mob !== prev && T.mob.boss) bossCard(T.mob.name); } catch (e) {}
    return r;
  };

  /* ================= 3. death as a ritual ================= */
  function lastWord() {
    const s = T.text || "";
    if (!s) return null;
    const p = Math.min(T.pos || 0, s.length - 1);
    let a = p, b = p;
    while (a > 0 && s[a - 1] !== " ") a--;
    while (b < s.length && s[b] !== " ") b++;
    const w = s.slice(a, b);
    return w ? { w, n: Math.max(0, Math.min(w.length, p - a)) } : null;
  }

  let ritual = null;
  function endRitual() {
    if (!ritual) return;
    const { el, timers, key } = ritual; ritual = null;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", key, true);
    el.classList.add("out");
    setTimeout(() => el.remove(), 320);
    $("tpr").classList.add("on"); // now show the normal results
  }

  function deathRitual() {
    const lw = lastWord();
    const el = document.createElement("div");
    el.id = "rtd";
    el.innerHTML = '<div class="v"></div><i class="k">\u6B7B</i>'
      + (lw ? '<div class="w"><small>the word that ended you</small><p><span class="ok"></span><span class="no"></span></p></div>' : "")
      + '<b class="tg">Eliminated</b><h2>Soul severed</h2><em></em><small class="h">any key &middot; rise again</small>';
    if (lw) {
      el.querySelector(".ok").textContent = lw.w.slice(0, lw.n);
      el.querySelector(".no").textContent = lw.w.slice(lw.n);
    }
    const by = T.mob && T.mob.name;
    el.querySelector("em").textContent = by
      ? "claimed by " + (T.mob.boss ? "" : "a ") + by
      : "undone by your own hand";
    tp.appendChild(el);
    $("tpr").classList.remove("on"); // hold the results back until the ritual ends
    const born = performance.now();
    const key = (e) => { // swallow keys so Enter/Esc can't hit hidden results; any key skips after a beat
      e.preventDefault(); e.stopImmediatePropagation();
      if (performance.now() - born > 900) endRitual();
    };
    document.addEventListener("keydown", key, true);
    el.addEventListener("pointerdown", () => { if (performance.now() - born > 900) endRitual(); });
    ritual = { el, key, timers: [setTimeout(endRitual, 3600)] };
    snd((t, d) => {
      sweep(90, 24, t, 1.6, "sine", 0.8, d);
      noise(t, 0.5, 0.12, 300, d);
      bell(130, t + 0.2, 2, 0.06, d);
      bell(98, t + 1.1, 2, 0.05, d);
    });
  }

  const te = tpEnd;
  tpEnd = function () {
    const was = T.done, wasMob = T.mob;
    te.apply(this, arguments);
    try { if (!was && T.hp <= 0 && !ritual) deathRitual(); } catch (e) { $("tpr").classList.add("on"); }
  };

  // never leave a ritual hanging if a new run starts or the player quits
  const tq = tpQuit;
  tpQuit = function () { if (ritual) { ritual.timers.forEach(clearTimeout); document.removeEventListener("keydown", ritual.key, true); ritual.el.remove(); ritual = null; } const b = $("rtb"); if (b) b.remove(); return tq.apply(this, arguments); };
})();