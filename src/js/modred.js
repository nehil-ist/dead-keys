/* Modifier seals: sealing a rule turns its card dark blood red and a short iron "seal" sound plays
   (stone thud + chain clank + a low bell that climbs one step for every seal you hold).
   Breaking a seal plays a brittle snap. Sounds are tiny and throttled, so spamming Enter cannot
   pile up audio nodes, and the red flash only restarts once the last one has faded. */
(function () {
  const css = document.createElement("style");
  css.textContent = `
#ovMo.ov2 .mm-c.sealed{background:linear-gradient(160deg,#4a050c 0%,#2a0207 55%,#16010 3 100%);color:#f1d9d4}
#ovMo.ov2 .mm-c.sealed:nth-child(even){background:linear-gradient(160deg,#3e040a 0%,#230206 60%,#120104 100%)}
#ovMo.ov2 .mm-c.sealed.on{box-shadow:inset 0 0 0 3px #b3121f,inset 0 0 70px rgba(200,10,30,.35)}
#ovMo.ov2 .mm-c.sealed .mm-pt{filter:none;opacity:1;background:repeating-linear-gradient(135deg,transparent 0 11px,rgba(190,20,35,.14) 11px 13px)}
#ovMo.ov2 .mm-c.sealed .mm-k{color:#c1121f;opacity:.28}
#ovMo.ov2 .mm-c.sealed.on .mm-k{opacity:.42;filter:drop-shadow(0 0 18px rgba(220,20,40,.55))}
#ovMo.ov2 .mm-c.sealed .mm-v{color:#e0584f}
#ovMo.ov2 .mm-c.sealed .mm-n{color:#e0584f}
#ovMo.ov2 .mm-c.sealed .mm-b p{color:#d9aaa3}
#ovMo.ov2 .mm-c.sealed .mm-b b{color:#fff1ee;text-shadow:0 0 22px rgba(210,20,40,.6)}
#ovMo.ov2 .mm-c.sealed .mm-t u,#ovMo.ov2 .mm-c.sealed .mm-go{background:#9b0e1b;color:#fff1ee}
#ovMo.ov2 .mm-c.sealed .mm-st{background:#c1121f;color:#1a0003}
#ovMo.ov2.bleed::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;background:radial-gradient(ellipse at 50% 50%,rgba(190,0,22,0) 38%,rgba(190,0,22,.8) 100%);animation:mmBleed .9s ease-out both}
@keyframes mmBleed{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
#ovMo.ov2 .mm-c.sealed.pop{animation:mmBloodPop .5s cubic-bezier(.2,1.2,.3,1)}
@keyframes mmBloodPop{0%{filter:brightness(1.8)}100%{filter:brightness(1)}}
@media(prefers-reduced-motion:reduce){#ovMo.ov2.bleed::after,#ovMo.ov2 .mm-c.sealed.pop{animation:none}}
`.replace("#16010 3 100%", "#160103 100%");
  document.head.appendChild(css);

  /* ---------- the seal sound ---------- */
  let lastSnd = 0;
  function moSound(sealing) {
    try { aInit(); } catch (e) {}
    if (!AU.ctx || !ST.sfx) return;
    const now = performance.now();
    if (now - lastSnd < 80) return;            /* spam guard: at most ~12 sounds a second */
    lastSnd = now;
    const n = Math.max(1, MODS.filter(m => MOD[m[0]]).length);
    const step = Math.pow(2, (n - 1) * 2 / 12);   /* climbs a whole tone per seal held */
    withCat("vu", () => {
      const d = AU.sfx, t = AU.ctx.currentTime + 0.005, v = 1 + (Math.random() - 0.5) * 0.03;
      if (sealing) {
        sweep(150 * v, 46, t, 0.24, "sine", 0.5, d);                 /* stone thud */
        noise(t, 0.05, 0.16, 1800, d);                                /* iron clank */
        swipe(t + 0.015, 0.09, 0.08, 3800, 900, d);                   /* chain drag */
        bell(147 * step * v, t + 0.02, 0.75, 0.09, d);                /* low bell */
        bell(208 * step * v, t + 0.02, 0.55, 0.05, d);                /* dark tritone */
      } else {
        swipe(t, 0.12, 0.12, 5200, 1000, d);                          /* brittle snap */
        noise(t, 0.07, 0.1, 3200, d);
        sweep(420 * v, 120, t, 0.14, "triangle", 0.12, d, 1600);
        tone(880 * v, t + 0.01, 0.1, "sine", 0.03, d);
      }
    });
  }
  window.moSound = moSound;

  /* moTog toggles the rule; we own the sound here. Sealing also bleeds red (not re-triggered while it is still fading). */
  let lastBleed = 0;
  const mt = moTog;
  moTog = function (i) {
    const key = MODS[i] && MODS[i][0], was = !!MOD[key];
    const r = mt.apply(this, arguments);
    if (key) {
      const isOn = !!MOD[key];
      moSound(isOn);
      if (isOn && !was) {
        const nowT = performance.now(), ov = document.getElementById("ovMo");
        if (ov && nowT - lastBleed > 700) {
          lastBleed = nowT;
          clearTimeout(ov._bt); ov.classList.remove("bleed"); ov.offsetWidth; ov.classList.add("bleed");
          ov._bt = setTimeout(() => ov.classList.remove("bleed"), 950);
        }
      }
    }
    return r;
  };
})();
