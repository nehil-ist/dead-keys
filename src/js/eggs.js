/* Easter eggs: type a secret word on the main menu and get a flash, a sound and a joke toast.
   Purely cosmetic: nothing here reads or writes META, settings, records or localStorage.
   To add one, add an entry to EGGS: { flash: css class, msg: toast text, snd: (t, d) => {...} }.
   Sounds use the game's own synth helpers and follow the "Alerts & interface" volume. */
(function () {
  const css = document.createElement("style");
  css.textContent = `
.egg-flash{position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;overflow:hidden}
.egg-flash.iddqd{background:radial-gradient(ellipse at 50% 50%,rgba(255,250,225,.98) 0%,rgba(255,236,170,.6) 55%,rgba(255,215,110,.22) 100%);animation:eggFlash .6s ease-out both}
.egg-flash.bankai{background:radial-gradient(ellipse at 50% 50%,rgba(120,0,16,.55) 0%,rgba(150,0,20,.8) 100%);animation:eggFlash .7s ease-out both}
.egg-flash.bankai::after{content:"";position:absolute;left:-20%;right:-20%;top:46%;height:5px;background:#f6efe6;box-shadow:0 0 28px 8px rgba(255,255,255,.7);rotate:-14deg;animation:eggSlash .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes eggFlash{0%{opacity:0}10%{opacity:1}100%{opacity:0}}
@keyframes eggSlash{from{translate:-60% 0;opacity:1}to{translate:60% 0;opacity:0}}
@media(prefers-reduced-motion:reduce){.egg-flash{animation-duration:.5s!important}.egg-flash.iddqd,.egg-flash.bankai{filter:opacity(.35)}.egg-flash.bankai::after{display:none}}
`;
  document.head.appendChild(css);

  const EGGS = {
    iddqd: {
      flash: "iddqd",
      msg: "GOD MODE: ON. Typos still hurt, though.",
      snd(t, d) {   /* rising power-up chime */
        swipe(t, 0.32, 0.12, 500, 6500, d);
        [392, 494, 587, 784, 988].forEach((f, i) => bell(f, t + 0.04 + i * 0.055, 0.7 - i * 0.07, 0.085, d));
        sweep(130, 260, t, 0.3, "sine", 0.22, d);
      }
    },
    bankai: {
      flash: "bankai",
      msg: "BANKAI! Typing speed unchanged. Confidence: max.",
      snd(t, d) {   /* low gong, a rush of air, then a slash */
        sweep(125, 44, t, 0.95, "sine", 0.55, d);
        bell(73.4, t, 1.5, 0.12, d);
        bell(110, t + 0.02, 1.2, 0.07, d);
        swipe(t, 0.4, 0.15, 350, 5200, d);
        swipe(t + 0.32, 0.2, 0.2, 6500, 1100, d);
        bell(1175, t + 0.34, 0.5, 0.06, d);
      }
    }
  };
  const MAXLEN = Math.max.apply(null, Object.keys(EGGS).map(k => k.length));
  let buf = "", lastKey = 0, lastEgg = 0;

  /* only on the plain main menu: no overlay, intro, hero screen, run or transition in the way */
  const canType = () => {
    try {
      return menuOpen && scr === "main" && !busy && !picking && !window.__intro && !T.on &&
        !document.querySelector(".ov2.on, #meta.on");
    } catch (e) { return false; }
  };

  function play(egg) {
    try { aInit(); } catch (e) {}
    try {
      if (AU.ctx && ST.sfx) withCat("vu", () => egg.snd(AU.ctx.currentTime + 0.005, AU.sfx));
    } catch (e) {}
  }

  function fire(name) {
    const egg = EGGS[name];
    document.querySelectorAll(".egg-flash").forEach(n => n.remove());
    const f = document.createElement("div");
    f.className = "egg-flash " + egg.flash;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
    play(egg);
    try { toast(egg.msg); } catch (e) {}
  }

  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (!canType()) { buf = ""; return; }
    const now = performance.now();
    if (now - lastKey > 2000) buf = "";            /* a pause starts a fresh word */
    lastKey = now;
    if (/^[a-z]$/i.test(e.key)) {
      buf = (buf + e.key.toLowerCase()).slice(-MAXLEN);
      for (const name in EGGS) {
        if (buf.endsWith(name)) {
          buf = "";
          if (now - lastEgg > 1500) { lastEgg = now; fire(name); }   /* cooldown: re-typing can't pile up sounds */
          break;
        }
      }
    } else if (e.key !== "Shift" && e.key !== "CapsLock") buf = "";   /* arrows, Enter, Esc... break the word */
  }, true);
})();
