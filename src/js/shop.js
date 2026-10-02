/* Shop: cosmetics bought with souls (the permanent currency): in-game borders and kill effects */
(function () {
  const RN = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
  const RC = ["#d4cfc4", "#5fd68a", "#5aa2ff", "#b074ff", "#ffc94d"];
  // id, name, description, price in souls, rarity
  const BD = [
    ["ink", "Ink Line", "A single clean stroke.", 40, 0],
    ["slab", "Black Slab", "Heavy and plain, edged in bone.", 60, 0],
    ["links", "Iron Links", "A segmented rim, like film stock.", 110, 1],
    ["blood", "Blood Seal", "A pulsing crimson ring.", 130, 1],
    ["moon", "Moonlit Silver", "Silver light circling the edge.", 200, 2],
    ["ember", "Ember Edge", "A slow, burning orbit.", 230, 2],
    ["frost", "Frostbite", "Icy light that never melts.", 230, 2],
    ["void", "Void Rift", "Purple dark that bends around you.", 380, 3],
    ["signal", "Dead Signal", "Scanlines and a failing broadcast.", 360, 3],
    ["gilt", "Gilded Reaper", "Molten gold, thick and proud.", 750, 4],
    ["soulfire", "Soulfire Halo", "Spirit flame, fast and bright.", 950, 4]
  ];
  // id, name, description, price in souls, rarity, glyph
  const KD = [
    ["ink", "Ink Splatter", "A bone-white blot, flung droplets and a slow drip.", 60, 0, "\u58A8"],
    ["feather", "Crow Feathers", "Black feathers scatter and flutter down.", 120, 1, "\u7FBD"],
    ["petal", "Sakura Petals", "A drift of pale blossoms, spinning as they fall.", 220, 2, "\u685C"],
    ["ash", "Ember Ash", "Sparks and glowing ash rising from the kill.", 230, 2, "\u7070"],
    ["wisp", "Spirit Wisps", "Cold souls spiral up and away.", 390, 3, "\u9B42"],
    ["lily", "Spider Lilies", "Crimson blooms unfurl where the enemy fell.", 800, 4, "\u5F7C"]
  ];
  const NONE = ["", "No Border", "The bare frame.", 0, 0];
  const KNONE = ["", "Default Burst", "The stock shard burst.", 0, 0, "\u65AC"];
  const items = () => [NONE].concat(BD).map(d => ({ t: "b", d })).concat([KNONE].concat(KD).map(d => ({ t: "k", d })));

  META.bd = META.bd || {};
  META.bdE = META.bdE || "";
  META.kf = META.kf || {};
  META.kfE = META.kfE || "";
  const own = id => !id || !!META.bd[id];
  const cur = () => (own(META.bdE) ? META.bdE : "");
  const kown = id => !id || !!META.kf[id];
  const kcur = () => (kown(META.kfE) ? META.kfE : "");

  /* ---------- kill effects ---------- */
  const R = Math.random, rnd = (a, b) => a + R() * (b - a);
  const reduced = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  let LIVE = 0;
  const TR = "translate(-50%,-50%) ";

  function mkp(host, css, cls) {
    const e = document.createElement("i");
    e.className = "kf" + (cls ? " " + cls : "");
    e.style.cssText = css;
    host.appendChild(e);
    LIVE++;
    return e;
  }
  function run(e, kf, dur, ease, delay) {
    let done = 0;
    const end = () => { if (!done) { done = 1; LIVE = Math.max(0, LIVE - 1); e.remove(); } };
    if (!e.animate) { setTimeout(end, 50); return; }
    const a = e.animate(kf, { duration: dur, easing: ease || "linear", delay: delay || 0, fill: "both" });
    a.onfinish = a.oncancel = end;
    setTimeout(end, dur + (delay || 0) + 400);
  }
  function ring(h, x, y, rgb, size, s, dur) {
    const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + size * s + "px;height:" + size * s + "px;border-radius:50%;border:2px solid rgba(" + rgb + ",.9);box-shadow:0 0 14px rgba(" + rgb + ",.6)");
    run(e, [{ transform: TR + "scale(.2)", opacity: .9 }, { transform: TR + "scale(1.5)", opacity: 0 }], dur || 600, "ease-out");
  }
  const mn = s => Math.max(.7, s);

  const FX = {
    petal(h, x, y, B, s, rm) {
      const n = Math.round((B ? 46 : 20) * (rm ? .35 : 1)), C = ["#ffd6e0", "#ffb7c9", "#ff95b0", "#fff1f4", "#f7c0d0"];
      for (let i = 0; i < n; i++) {
        const a = R() * 6.283, d = (50 + R() * (B ? 220 : 130)) * s, w = (9 + R() * 9) * (B ? 1.25 : 1) * mn(s);
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d * .55 - 28 * s, sw = rnd(-60, 60) * s, fall = (70 + R() * 110) * s * (rm ? .4 : 1);
        const r1 = rnd(-200, 200), r2 = r1 + rnd(-260, 260);
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + w * .68 + "px;background:" + C[i % C.length] + ";border-radius:100% 0 100% 0;box-shadow:0 0 6px rgba(255,140,175,.55)");
        run(e, [
          { transform: TR + "translate(0,0) rotate(0deg) scale(.3)", opacity: 0 },
          { transform: TR + "translate(" + dx + "px," + dy + "px) rotate(" + r1 + "deg) scale(1)", opacity: 1, offset: .28 },
          { transform: TR + "translate(" + (dx + sw * .5) + "px," + (dy + fall * .55) + "px) rotate(" + (r1 + r2) / 2 + "deg) scale(1)", opacity: 1, offset: .7 },
          { transform: TR + "translate(" + (dx + sw) + "px," + (dy + fall) + "px) rotate(" + r2 + "deg) scale(.85)", opacity: 0 }
        ], rnd(1000, 1800), "cubic-bezier(.2,.7,.4,1)", R() * 120);
      }
      ring(h, x, y, "255,170,195", B ? 150 : 90, s);
    },

    ink(h, x, y, B, s, rm) {
      const bone = "#f1ece1", ol = "0 0 0 2px #0a0a0a";
      const bs = (B ? 150 : 80) * s;
      const blot = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + bs + "px;height:" + bs * .8 + "px;background:" + bone + ";border-radius:46% 54% 41% 59%/55% 44% 56% 45%;box-shadow:" + ol);
      run(blot, [
        { transform: TR + "scale(.15) rotate(0deg)", opacity: 1 },
        { transform: TR + "scale(1.1) rotate(8deg)", opacity: 1, offset: .2 },
        { transform: TR + "scale(1.15) rotate(8deg)", opacity: .9, offset: .6 },
        { transform: "translate(-50%,-44%) scale(1.2) rotate(8deg)", opacity: 0 }
      ], 950, "ease-out");
      const core = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + bs * .42 + "px;height:" + bs * .34 + "px;background:#0a0a0a;border-radius:55% 45% 52% 48%/48% 56% 44% 52%");
      run(core, [{ transform: TR + "scale(.1)", opacity: 1 }, { transform: TR + "scale(1)", opacity: 1, offset: .25 }, { transform: TR + "scale(1.05)", opacity: 0 }], 800, "ease-out");
      const n = Math.round((B ? 34 : 16) * (rm ? .4 : 1));
      for (let i = 0; i < n; i++) {
        const a = R() * 6.283, d = (30 + R() * (B ? 200 : 120)) * s, sz = (3 + R() * (B ? 12 : 9)) * mn(s);
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d, drip = (10 + R() * 40) * s, blk = i % 3 === 0;
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + sz + "px;height:" + sz * rnd(.8, 1.3) + "px;background:" + (blk ? "#0a0a0a" : bone) + ";border-radius:50%;box-shadow:" + (blk ? "0 0 0 2px " + bone : ol));
        run(e, [
          { transform: TR + "scale(.3)", opacity: 1 },
          { transform: TR + "translate(" + dx + "px," + dy + "px) scale(1)", opacity: 1, offset: .3 },
          { transform: TR + "translate(" + dx + "px," + (dy + drip) + "px) scale(.9)", opacity: 1, offset: .75 },
          { transform: TR + "translate(" + dx + "px," + (dy + drip * 1.4) + "px) scale(.7)", opacity: 0 }
        ], rnd(800, 1300), "cubic-bezier(.1,.8,.2,1)");
      }
      const m = Math.round((B ? 10 : 5) * (rm ? .4 : 1));
      for (let i = 0; i < m; i++) {
        const deg = R() * 360, a = deg * Math.PI / 180, d = (50 + R() * (B ? 190 : 110)) * s, L = (20 + R() * 30) * mn(s);
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d, rot = deg + 90;
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + 3 * mn(s) + "px;height:" + L + "px;background:" + bone + ";border-radius:2px;box-shadow:" + ol);
        run(e, [
          { transform: TR + "rotate(" + rot + "deg) scaleY(.2)", opacity: 1 },
          { transform: TR + "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg) scaleY(1)", opacity: 1, offset: .35 },
          { transform: TR + "translate(" + dx * 1.05 + "px," + dy * 1.05 + "px) rotate(" + rot + "deg) scaleY(.6)", opacity: 0 }
        ], rnd(450, 700), "cubic-bezier(.1,.8,.2,1)");
      }
    },

    feather(h, x, y, B, s, rm) {
      const n = Math.round((B ? 24 : 10) * (rm ? .4 : 1));
      for (let i = 0; i < n; i++) {
        const L = (16 + R() * 14) * (B ? 1.3 : 1) * mn(s), W = L * .36, a = R() * 6.283, d = (30 + R() * (B ? 150 : 90)) * s;
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d * .5 - 20 * s, ph = R() * 6.28, fall = (110 + R() * 130) * s * (rm ? .4 : 1);
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + W + "px;height:" + L + "px;background:linear-gradient(90deg,#0a0a0a 46%,#34322e 54%);border:1.5px solid #e9e5dc;border-radius:50% 50% 50% 50%/85% 85% 15% 15%");
        const kf = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6, sx = dx * (.6 + .4 * t) + Math.sin(t * 9 + ph) * 30 * s * t, sy = dy + t * fall, rot = Math.sin(t * 9 + ph) * 55 + t * 80;
          kf.push({ transform: TR + "translate(" + sx + "px," + sy + "px) rotate(" + rot + "deg) scale(" + (k ? 1 : .4) + ")", opacity: k === 0 || k === 6 ? 0 : 1, offset: t });
        }
        run(e, kf, rnd(1500, 2400), "ease-out", R() * 100);
      }
      ring(h, x, y, "233,229,220", B ? 140 : 80, s, 520);
    },

    ash(h, x, y, B, s, rm) {
      const g = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + (B ? 220 : 120) * s + "px;height:" + (B ? 220 : 120) * s + "px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,70,.85),rgba(255,90,31,.35) 45%,transparent 70%)");
      run(g, [{ transform: TR + "scale(.3)", opacity: 1 }, { transform: TR + "scale(1.2)", opacity: 0 }], 480, "ease-out");
      const n = Math.round((B ? 58 : 26) * (rm ? .35 : 1)), C = ["#ffb347", "#ff5a1f", "#ffd27a", "#ff7a2a"];
      for (let i = 0; i < n; i++) {
        const sz = (2.5 + R() * (B ? 6 : 4.5)) * mn(s), a = R() * 6.283, d = (20 + R() * 70) * s, c = C[i % C.length];
        const dx = Math.cos(a) * d + rnd(-20, 20) * s, dy = Math.sin(a) * d * .5, rise = -(70 + R() * (B ? 260 : 170)) * s;
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + sz + "px;height:" + sz + "px;border-radius:50%;background:" + c + ";box-shadow:0 0 8px " + c + ",0 0 14px rgba(255,90,31,.6)");
        run(e, [
          { transform: TR + "scale(.4)", opacity: 0 },
          { transform: TR + "translate(" + dx + "px," + dy + "px) scale(1)", opacity: 1, offset: .15 },
          { transform: TR + "translate(" + (dx + rnd(-25, 25) * s) + "px," + (dy + rise * .6) + "px) scale(.8)", opacity: .9, offset: .6 },
          { transform: TR + "translate(" + (dx + rnd(-40, 40) * s) + "px," + (dy + rise) + "px) scale(.2)", opacity: 0 }
        ], rnd(800, 1500), "ease-out");
      }
    },

    wisp(h, x, y, B, s, rm) {
      const n = Math.round((B ? 20 : 9) * (rm ? .4 : 1));
      for (let i = 0; i < n; i++) {
        const sz = (9 + R() * 10) * (B ? 1.3 : 1) * mn(s), ph = R() * 6.28, amp = (14 + R() * 26) * s, rise = (110 + R() * (B ? 260 : 160)) * s * (rm ? .5 : 1), ox = rnd(-30, 30) * s;
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + sz + "px;height:" + sz + "px;border-radius:50%;background:radial-gradient(circle,#fff 0,#b8fffb 30%,rgba(120,230,255,.55) 55%,transparent 72%)");
        const kf = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6, X = ox + Math.sin(ph + t * Math.PI * 2.2) * amp * (.4 + t), Y = -rise * t;
          kf.push({ transform: TR + "translate(" + X + "px," + Y + "px) scale(" + (k === 0 ? .4 : k === 6 ? .3 : .5 + t * .6) + ")", opacity: k === 0 || k === 6 ? 0 : 1 - t * .35, offset: t });
        }
        run(e, kf, rnd(1100, 2000), "ease-out", R() * 120);
      }
      ring(h, x, y, "140,230,255", B ? 170 : 100, s, 800);
    },

    lily(h, x, y, B, s, rm) {
      const n = Math.round((B ? 28 : 13) * (rm ? .5 : 1));
      for (let i = 0; i < n; i++) {
        const a = i / n * 360 + rnd(-8, 8), L = (34 + R() * 40) * (B ? 1.5 : 1) * s, w = 4 * mn(s), curl = (i % 2 ? 1 : -1) * rnd(10, 34);
        const e = mkp(h, "left:" + (x - w / 2) + "px;top:" + (y - L) + "px;width:" + w + "px;height:" + L + "px;transform-origin:50% 100%;background:linear-gradient(0deg,#7a0b1d,#e0243f 55%,#ff6a7c);border-radius:50% 50% 10% 10%/100% 100% 0 0;box-shadow:0 -2px 6px rgba(255,60,90,.7)");
        run(e, [
          { transform: "rotate(" + a + "deg) scaleY(0)", opacity: 1 },
          { transform: "rotate(" + (a + curl * .5) + "deg) scaleY(1)", opacity: 1, offset: .35 },
          { transform: "rotate(" + (a + curl) + "deg) scaleY(1)", opacity: 1, offset: .7 },
          { transform: "rotate(" + (a + curl * 1.4) + "deg) scaleY(.9) translateY(-8px)", opacity: 0 }
        ], rnd(900, 1300), "cubic-bezier(.2,.8,.3,1)", R() * 80);
      }
      const p = Math.round((B ? 14 : 6) * (rm ? .4 : 1));
      for (let i = 0; i < p; i++) {
        const w = (7 + R() * 6) * mn(s), a = R() * 6.283, d = (40 + R() * 90) * s, dx = Math.cos(a) * d, dy = Math.sin(a) * d * .5, fall = (60 + R() * 80) * s;
        const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + w * .6 + "px;background:#c2112e;border-radius:100% 0 100% 0");
        run(e, [
          { transform: TR + "scale(.3)", opacity: 0 },
          { transform: TR + "translate(" + dx + "px," + dy + "px) rotate(120deg) scale(1)", opacity: 1, offset: .3 },
          { transform: TR + "translate(" + dx * 1.1 + "px," + (dy + fall) + "px) rotate(300deg) scale(.8)", opacity: 0 }
        ], rnd(1000, 1600), "ease-out", 120);
      }
      ring(h, x, y, "224,36,63", B ? 160 : 100, s, 700);
      ring(h, x, y, "224,36,63", B ? 100 : 60, s, 900);
    }
  };

  /* ---------- impact layer: what makes a kill land (themed per effect) ---------- */
  const TH = { ink: "241,236,225", feather: "233,229,220", petal: "255,170,195", ash: "255,140,50", wisp: "140,230,255", lily: "224,36,63" };

  function shock(h, x, y, rgb, size, dur, w, delay) {
    const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + "px;border-radius:50%;border:" + w + "px solid rgba(" + rgb + ",.95);box-shadow:0 0 26px rgba(" + rgb + ",.75),inset 0 0 26px rgba(" + rgb + ",.5)");
    run(e, [
      { transform: TR + "scale(.04)", opacity: 1, borderWidth: w + "px" },
      { transform: TR + "scale(.8)", opacity: .85, offset: .45 },
      { transform: TR + "scale(1.2)", opacity: 0, borderWidth: "0px" }
    ], dur, "cubic-bezier(.1,.9,.2,1)", delay);
  }

  function streak(h, x, y, rgb, len, thick, ang, delay) {
    const e = mkp(h, "left:" + x + "px;top:" + y + "px;width:" + len + "px;height:" + thick + "px;border-radius:50%;background:linear-gradient(90deg,transparent,#fff 28%,rgba(" + rgb + ",1) 50%,#fff 72%,transparent);box-shadow:0 0 24px 5px rgba(" + rgb + ",.8)");
    run(e, [
      { transform: TR + "rotate(" + ang + "deg) scaleX(0)", opacity: 1 },
      { transform: TR + "rotate(" + ang + "deg) scaleX(1)", opacity: 1, offset: .22 },
      { transform: TR + "rotate(" + ang + "deg) scaleX(1.06) scaleY(.15)", opacity: 0 }
    ], 300 + thick * 14, "cubic-bezier(.1,.9,.2,1)", delay);
  }

  function snd(id, B) {
    withCat("va", () => {
      if (!AU.ctx || !ST.sfx) return;
      const t = AU.ctx.currentTime + .005, d = AU.sfx, g = B ? 1.5 : 1;
      sweep(160, 36, t, .5 * g, "sine", .55, d);
      noise(t, .09, .2, 1200, d);
      if (id === "ink") { noise(t + .02, .28, .17, 450, d); sweep(240, 55, t, .22, "square", .08, d, 900); }
      else if (id === "feather") { swipe(t, .38, .22, 1400, 7500, d); swipe(t + .08, .32, .13, 900, 5200, d); }
      else if (id === "petal") { [784, 988, 1319, 1760].forEach((f, i) => { tone(f, t + .02 + i * .05, .8, "sine", .07, d); tone(f * 2.76, t + .02 + i * .05, .3, "sine", .02, d); }); }
      else if (id === "ash") { noise(t, .5, .2, 300, d); for (let i = 0; i < 7; i++) noise(t + .05 + i * .05, .03, .13, 2500 + i * 400, d); }
      else if (id === "wisp") { sweep(300, 1900, t, .55, "sine", .08, d); sweep(450, 2500, t + .06, .5, "triangle", .045, d); }
      else if (id === "lily") { tone(98, t, .9, "sawtooth", .1, d, 700); tone(104, t, .9, "sawtooth", .08, d, 700); sweep(520, 90, t, .35, "square", .08, d, 1400); }
    });
  }

  function impact(id, host, x, y, B, s, rm) {
    const rgb = TH[id] || "255,255,255", tp = $("tp");
    snd(id, B);
    /* themed flash from the point of impact */
    const fl = mkp(host, "left:0;top:0;width:100%;height:100%;mix-blend-mode:screen;background:radial-gradient(circle at " + x + "px " + y + "px,rgba(" + rgb + ",.95),rgba(" + rgb + ",.4) 30%,rgba(" + rgb + ",0) 68%)");
    run(fl, [{ opacity: 1 }, { opacity: .55, offset: .25 }, { opacity: 0 }], B ? 560 : 320, "ease-out");
    /* shockwaves + the cut itself */
    shock(host, x, y, rgb, (B ? 760 : 460) * s, B ? 620 : 420, B ? 12 : 8);
    shock(host, x, y, rgb, (B ? 460 : 260) * s, B ? 520 : 340, 4, 60);
    const ang = -22 + rnd(-10, 10);
    streak(host, x, y, rgb, (B ? 980 : 600) * s, B ? 10 : 6, ang);
    if (B) streak(host, x, y, rgb, 820 * s, 7, ang + 52, 70);
    if (rm || !tp) return;
    /* hit-stop: freeze CSS motion for a beat, then punch the whole arena */
    const hs = B ? 130 : 75;
    tp.classList.add("kfs");
    setTimeout(() => tp.classList.remove("kfs"), hs);
    if (tp.animate) {
      const a = B ? 28 : 16, kf = [];
      for (let i = 0; i < 9; i++) { const k = 1 - i / 9; kf.push({ translate: rnd(-a, a) * k + "px " + rnd(-a, a) * k * .6 + "px", scale: 1 + (B ? .04 : .022) * k }); }
      kf.push({ translate: "0 0", scale: 1 });
      tp.animate(kf, { duration: B ? 420 : 280, delay: hs - 20, easing: "linear" });
    }
  }

  /* the enemy portrait is cut in half and falls apart, so something visibly dies */
  function portrait(id, tp, B) {
    const g = $("mobg");
    if (!g || !tp || !tp.animate) return;
    try {
      const tr = tp.getBoundingClientRect(), r = g.getBoundingClientRect(), cs = getComputedStyle(g), rgb = TH[id] || "255,255,255";
      if (!r.width) return;
      const css = "left:" + (r.left - tr.left + r.width / 2) + "px;top:" + (r.top - tr.top + r.height / 2) + "px;width:" + r.width + "px;height:" + r.height + "px;display:grid;place-items:center;background:#e9e5dc;color:#0a0a0a;font:" + cs.font + ";box-shadow:0 0 30px rgba(" + rgb + ",.9)";
      const cuts = ["polygon(-2% -2%,102% -2%,102% 28%,-2% 72%)", "polygon(-2% 72%,102% 28%,102% 102%,-2% 102%)"];
      cuts.forEach((c, i) => {
        const e = mkp(tp, css + ";clip-path:" + c), sg = i ? 1 : -1, d = B ? 1.5 : 1;
        e.textContent = g.textContent;
        run(e, [
          { transform: TR + "translate(0,0) rotate(0deg) scale(1.08)", opacity: 1, filter: "brightness(3)" },
          { transform: TR + "translate(" + sg * 5 + "px," + sg * 7 + "px) rotate(" + sg * 2 + "deg) scale(1.05)", opacity: 1, filter: "brightness(1.6)", offset: .18 },
          { transform: TR + "translate(" + sg * 34 * d + "px," + sg * 70 * d + "px) rotate(" + sg * 15 * d + "deg) scale(.9)", opacity: 0, filter: "brightness(1)" }
        ], B ? 800 : 560, "cubic-bezier(.2,.7,.3,1)");
      });
    } catch (err) {}
  }

  function fx(id, host, x, y, boss, s) {
    const f = FX[id];
    if (!f || !host || LIVE > 240) return;
    const rm = reduced(), B = !!boss;
    s = s || 1;
    try { impact(id, host, x, y, B, s, rm); } catch (e) {}
    /* the burst fires right after the hit-stop, then an echo fills it out */
    setTimeout(() => {
      try { f(host, x, y, B, s, rm); } catch (e) {}
      if (!rm) setTimeout(() => { if (LIVE < 200) try { f(host, x, y, B, s * .65, rm); } catch (e) {} }, 110);
    }, rm ? 0 : (B ? 110 : 60));
  }
  window.killFxTest = (id, boss) => { const tp = $("tp"); fx(id || kcur() || "petal", tp, tp.clientWidth / 2, tp.clientHeight / 2, boss, 1); };

  /* mob and boss kills: replace the stock shards with the equipped burst */
  const _sl = slayFx;
  slayFx = function (e, t) {
    const id = kcur();
    if (!id) return _sl.apply(this, arguments);
    const wrap = $("tpwrap"), before = new Set(wrap.querySelectorAll(".shd"));
    _sl.apply(this, arguments);
    try {
      wrap.querySelectorAll(".shd").forEach(n => { if (!before.has(n)) n.remove(); });
      const ch = $("tpt").children, a = ch[e.a], b = ch[e.b - 1], tp = $("tp");
      if (!a || !b) return;
      const tr = tp.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
      fx(id, tp, (ar.left + br.right) / 2 - tr.left, ar.top + ar.height / 2 - tr.top, !!e.boss, e.boss ? 1.7 : 1.35);
      portrait(id, tp, !!e.boss);
    } catch (err) {}
  };

  /* megaboss kills */
  const _me = mgEnd;
  mgEnd = function (t) {
    const id = kcur(), host = $("mg");
    let before = null, cx = 0, cy = 0;
    if (id && t && host && !MG.done) { before = new Set(host.querySelectorAll(".msh")); cx = MG.cx; cy = MG.cy; }
    _me.apply(this, arguments);
    if (before) {
      try {
        host.querySelectorAll(".msh").forEach(n => n.remove());
        fx(id, host, cx, cy, true, 1.5);
        setTimeout(() => fx(id, host, cx, cy, true, 1.1), 260);
      } catch (err) {}
    }
  };

  /* the frame drawn around the game screen */
  const frame = document.createElement("div");
  frame.id = "bdr";
  $("tp").appendChild(frame);
  function paint() {
    const id = cur();
    frame.className = "bdr" + (id ? " on b-" + id : "");
  }
  paint();

  /* shop screen */
  const ov = mkOv("ovSh");
  let sel = 0, pvT = 0;

  function card(it, i, eq) {
    const b = it.d, k = it.t === "k", o = k ? kown(b[0]) : own(b[0]), e = b[0] === eq, can = META.souls >= b[3];
    const pv = k
      ? '<div class="sh-p kp"><i class="kg">' + b[5] + "</i><em>" + (b[0] ? "hover to preview" : "stock burst") + "</em></div>"
      : '<div class="sh-p"><div class="bdr pv on' + (b[0] ? " b-" + b[0] : "") + '"></div><em>type to survive</em></div>';
    return '<div class="sh-c' + (i === sel ? " sel" : "") + (e ? " eq" : "") + '" data-i="' + i + '" style="--rc:' + RC[b[4]] + '">' + pv +
      "<b>" + b[1] + "</b><small>" + (b[0] ? RN[b[4]] + " " + "\u25C6".repeat(b[4] + 1) : "DEFAULT") + "</small><span>" + b[2] + "</span>" +
      "<button" + (!o && !can ? ' class="no"' : "") + ">" + (e ? "Equipped" : o ? "Equip" : "Buy \u00B7 " + b[3] + " souls") + "</button></div>";
  }

  function draw() {
    const eb = cur(), ek = kcur(), all = items();
    const bh = all.map((it, i) => it.t === "b" ? card(it, i, eb) : "").join("");
    const kh = all.map((it, i) => it.t === "k" ? card(it, i, ek) : "").join("");
    ov.innerHTML =
      '<div class="sh-h"><h2>Shop</h2><small>Borders and kill effects for your hunt</small><span class="sh-s">\u9B42 <b>' + META.souls + "</b> souls</span></div>" +
      '<div class="sh-t"><i>Borders</i></div><div class="sh-g">' + bh + "</div>" +
      '<div class="sh-t"><i>Kill Effects</i></div><div class="sh-g">' + kh + "</div>" +
      '<p class="sb">Borders appear around the game screen. Kill effects replace the shard burst when a mob or boss falls. Everything is bought with souls from your runs. Esc to close.</p>';
  }

  /* hover or select a kill effect to see it fire in its card */
  function prev(i) {
    const it = items()[i];
    if (!it || it.t !== "k" || !it.d[0]) return;
    const now = performance.now();
    if (now - pvT < 450) return;
    pvT = now;
    const box = ov.querySelector('.sh-c[data-i="' + i + '"] .sh-p');
    if (box) fx(it.d[0], box, box.clientWidth / 2, box.clientHeight / 2, false, .5);
  }

  function act(i) {
    const it = items()[i];
    if (!it) return;
    const b = it.d, id = b[0], k = it.t === "k";
    const owned = k ? META.kf : META.bd, ek = k ? "kfE" : "bdE", isOwn = k ? kown : own;
    const cardEl = () => ov.querySelector('.sh-c[data-i="' + i + '"]');
    let bought = false;
    if (isOwn(id)) {
      META[ek] = id;
      try { sfx("ui"); } catch (e) {}
    } else if (META.souls < b[3]) {
      try { sfx("err"); } catch (e) {}
      toast("Not enough souls: " + (b[3] - META.souls) + " more");
      const c = cardEl();
      if (c) { c.classList.remove("nk"); c.offsetWidth; c.classList.add("nk"); }
      return;
    } else {
      META.souls -= b[3];
      owned[id] = 1;
      META[ek] = id;
      bought = true;
      try { window.shopSnd(b[4]); } catch (e) {}
      toast(b[1] + " bought and equipped");
    }
    saveMeta();
    paint();
    const top = ov.scrollTop;
    sel = i;
    draw();
    ov.scrollTop = top;
    if (bought) { const c = cardEl(); if (c) c.classList.add("bgt"); }
    pvT = 0;
    prev(i);
  }

  const highlight = () => ov.querySelectorAll(".sh-c").forEach(c => c.classList.toggle("sel", +c.dataset.i === sel));
  ov.addEventListener("click", e => { const c = e.target.closest(".sh-c"); if (c) act(+c.dataset.i); });
  ov.addEventListener("mouseover", e => {
    const c = e.target.closest(".sh-c");
    if (!c) return;
    const i = +c.dataset.i;
    if (i !== sel) { sel = i; highlight(); }
    prev(i);
  });

  const prevKey = window.ovKey;
  window.ovKey = function (o, e) {
    if (o !== ov) { prevKey && prevKey(o, e); return; }
    const n = items().length, mv = d => {
      e.preventDefault();
      sel = (sel + d + n) % n;
      highlight();
      const c = ov.querySelector('.sh-c[data-i="' + sel + '"]');
      c && c.scrollIntoView && c.scrollIntoView({ block: "nearest" });
      prev(sel);
    };
    if (e.key === "ArrowRight" || e.key === "ArrowDown") mv(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") mv(-1);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.repeat || act(sel); }
  };

  /* main menu entry, right after Heroes & Skills */
  const at = MAIN.findIndex(x => x[0] === "meta");
  MAIN.splice(at < 0 ? MAIN.length - 1 : at + 1, 0, ["shop", "Shop", "Borders and kill effects"]);
  const _ma = mainAct;
  mainAct = function (i) {
    if (MAIN[i] && MAIN[i][0] === "shop") { sel = 0; draw(); ov.classList.add("on"); return; }
    return _ma.apply(this, arguments);
  };
  try { if (scr === "main") $("mlist").innerHTML = listHTML(MAIN, mSel); } catch (e) {}
})();
