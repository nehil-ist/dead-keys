/* Shop purchase effects: sound + visuals scaled by item rarity (0 Common .. 4 Legendary) */
(function () {
  const RC = [
    { n: "COMMON", c: "#d4cfc4", g: "212,207,196" },
    { n: "UNCOMMON", c: "#5fd68a", g: "95,214,138" },
    { n: "RARE", c: "#5aa2ff", g: "90,162,255" },
    { n: "EPIC", c: "#b074ff", g: "176,116,255" },
    { n: "LEGENDARY", c: "#ffc94d", g: "255,201,77" }
  ];
  let silent = false;

  /* ---------- sound ---------- */
  function sound(r) {
    withCat("vu", () => {
      if (!AU.ctx || !ST.sfx) return;
      const t = AU.ctx.currentTime + 0.01, d = AU.sfx, R = Math.random;
      if (r === 0) {
        tone(2093, t, .12, "triangle", .07, d, 6000);
        tone(3136, t + .045, .16, "sine", .05, d);
        noise(t, .02, .05, 5000, d);
      } else if (r === 1) {
        [1568, 2093, 2637].forEach((f, i) => {
          tone(f, t + i * .06, .2, "triangle", .07, d, 6000);
          tone(f * 2.005, t + i * .06, .1, "sine", .025, d);
        });
        noise(t, .03, .05, 5000, d);
      } else if (r === 2) {
        [659, 784, 988, 1319].forEach((f, i) => {
          tone(f, t + i * .075, .55, "sine", .09, d);
          tone(f * 2.756, t + i * .075, .3, "sine", .025, d);
          tone(f / 2, t + i * .075, .4, "triangle", .04, d, 1200);
        });
        swipe(t, .35, .06, 1200, 6500, d);
      } else if (r === 3) {
        sweep(120, 420, t, .3, "sawtooth", .05, d, 1800);
        swipe(t, .35, .1, 800, 7000, d);
        const h = t + .28;
        sweep(150, 45, h, .5, "sine", .4, d);
        noise(h, .18, .14, 1500, d);
        [392, 494, 587, 784].forEach((f, i) => {
          tone(f, h + i * .04, 1.1, "sawtooth", .045, d, 1400);
          tone(f * 2, h + i * .04, .9, "sine", .06, d);
        });
        for (let i = 0; i < 6; i++) tone(1568 * (1 + i * .19), h + .1 + i * .06, .25, "sine", .035, d);
      } else {
        sweep(90, 28, t, 1.3, "sine", .55, d);
        sweep(110, 880, t, .45, "sawtooth", .06, d, 3000);
        swipe(t, .5, .12, 500, 9000, d);
        const h = t + .45;
        noise(h, .9, .2, 900, d);
        sweep(200, 40, h, .8, "sine", .5, d);
        [262, 330, 392, 523, 659, 784].forEach((f, i) => {
          tone(f, h + i * .035, 1.8, "sawtooth", .04, d, 1800);
          tone(f * 2, h + i * .035, 1.6, "sine", .06, d);
        });
        [1319, 1760, 2349, 3136].forEach((f, i) => tone(f, h + .05 + i * .09, 1.2, "sine", .05, d));
        for (let i = 0; i < 14; i++) tone(2000 + R() * 3500, h + .1 + i * .07, .18, "sine", .03, d);
      }
    });
  }

  /* ---------- visuals ---------- */
  function mk(cls, css, life) {
    const e = document.createElement("div");
    e.className = "rfx " + cls;
    e.style.cssText = css;
    APP.appendChild(e);
    setTimeout(() => e.remove(), life);
    return e;
  }

  function visual(r, rc) {
    const rm = matchMedia("(prefers-reduced-motion:reduce)").matches, big = ST.shake && !rm;
    const x = rc.left + rc.width / 2, y = rc.top + rc.height / 2, K = RC[r], R = Math.random;
    const at = `left:${x}px;top:${y}px;--c:${K.c};--g:${K.g};`;

    // expanding rings
    for (let i = 0; i <= Math.min(3, r); i++)
      mk("ring", at + `animation-delay:${i * .09}s;--s:${5 + r * 2.2 + i}`, 1100);

    // sparks
    const n = [8, 14, 22, 36, 64][r], sp = [90, 120, 170, 240, 360][r];
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, d = sp * (.4 + R() * .6), s = 5 + R() * (4 + r * 2);
      mk("spk", at + `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--w:${s}px;--rot:${R() * 360 | 0}deg;animation-duration:${.55 + R() * .5 + r * .12}s`, 1400);
    }

    // card ghost: the bought card flares outward
    if (r >= 2)
      mk("ghost" + (r === 4 ? " gold" : ""), at + `width:${rc.width}px;height:${rc.height}px`, 1000);

    // rarity tag
    mk("tag", at + `--sz:${.8 + r * .16}rem`, 1300).textContent = K.n + " " + "\u25C6".repeat(r + 1);

    if (r >= 3) {
      mk("pillar", at + `height:${y + 40}px;width:${rc.width * (r === 4 ? 1.1 : .7)}px`, 1500);
      mk("rune", at, 1400);
    }
    if (r >= 3 && big) mk("rays", at + `--len:${r === 4 ? 900 : 600}px`, 1700);
    if (r >= 2 && big) mk("flash", `--g:${K.g};--a:${[0, 0, .14, .28, .6][r]}`, 700);

    if (r === 3) mk("stamp", `--c:${K.c};--sz:2.4rem`, 1200).textContent = "EPIC";
    if (r === 4) {
      setTimeout(() => {
        mk("stamp", `--c:${K.c};--sz:clamp(2.6rem,9vh,5rem)`, 1900).textContent = "LEGENDARY";
        if (big) mk("flash", `--g:${K.g};--a:.35`, 900);
      }, 450);
      for (let i = 0; i < 26; i++)  // rising embers
        mk("ember", `left:${R() * 100}%;--c:${K.c};animation-delay:${(R() * 1.4).toFixed(2)}s;--dx:${R() * 80 - 40}px;--w:${3 + R() * 5}px`, 3200);
    }

    // screen shake (respects the "Screen shake and flashes" setting)
    if (big && r >= 3) {
      const f = $("bf");
      if (f && f.animate) {
        const m = r === 4 ? 9 : 5, s = r === 4 ? 450 : 300;
        f.animate([{ translate: "0 0" }, { translate: `${-m}px ${m / 2}px` }, { translate: `${m}px ${-m / 2}px` },
          { translate: `${-m / 2}px 0` }, { translate: "0 0" }], { duration: s, delay: r === 4 ? 450 : 280 });
      }
    }
  }

  function play(r, rc) {
    try { sound(r); } catch (e) {}
    try { visual(r, rc); } catch (e) {}
  }

  /* mute the stock "blessed" chime on shop buys so it doesn't mask the rarity sound */
  const _cf = cardFx;
  cardFx = function (e) {
    if (!silent || e || !AU.ctx) return _cf.apply(this, arguments);
    const real = AU.sfx;
    try {
      AU.sfx = AU.ctx.createGain();
      AU.sfx.gain.value = 0;
      return _cf.apply(this, arguments);
    } finally { AU.sfx = real; }
  };

  /* detect a real purchase: a rarity card (ware, blessing, extra heart) was clicked and gold dropped */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#bfc .bc");
    if (!b || b.disabled || !T.on || T.bfm !== "shop") return;
    const k = b.dataset.t;
    let r = -1;
    if (k === "i" || k === "0") {
      const m = /\br([0-4])\b/.exec(b.className);
      if (m) r = +m[1];
    } else if (k === "h") r = 3;  // Extra Heart has no tier: treated as Epic
    if (r < 0) return;
    const g0 = T.gold, rc = b.getBoundingClientRect();
    silent = true;
    setTimeout(() => { silent = false; if (T.gold < g0) play(r, rc); }, 0);
  }, true);

  window.shopFxTest = r => play(r, { left: FIT.w / 2 - 90, top: FIT.h / 2 - 120, width: 180, height: 240 });
})();
