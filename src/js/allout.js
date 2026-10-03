/* ALL-OUT stamp: clear five enemies in a row with no typos and a Persona-style slab slams across the screen.
   It rides on the game's own flawless-kill streak (T.kc, the "FLAWLESS x" counter), so it fires on kills 5, 10, 15...
   Purely cosmetic: it reads the streak and draws; it never changes score, gold, life or records.
   The overlay ignores the mouse and keyboard, so typing carries on underneath it. */
(function () {
  const css = document.createElement("style");
  css.textContent = `
.ao{position:absolute;inset:0;z-index:58;pointer-events:none;overflow:hidden;--ao-r:#d3001c}
.ao .ao-red,.ao .ao-blk{position:absolute;left:-10%;width:120%;transform-origin:0 50%}
.ao .ao-blk{top:18%;height:24%;background:#050505;rotate:-7deg;clip-path:polygon(0 12%,100% 0,100% 88%,0 100%);animation:aoBar .9s cubic-bezier(.2,.9,.2,1) both}
.ao .ao-red{top:21%;height:20%;background:var(--ao-r);rotate:-7deg;clip-path:polygon(0 0,100% 10%,100% 100%,0 86%);animation:aoBar .9s .05s cubic-bezier(.2,.9,.2,1) both;
 background-image:radial-gradient(rgba(0,0,0,.28) 22%,transparent 24%);background-size:11px 11px}
.ao .ao-t{position:absolute;left:50%;top:19%;height:24%;display:flex;align-items:center;gap:calc(.6 * var(--vmin));translate:-50% 0;rotate:-7deg;animation:aoSlam .9s cubic-bezier(.2,1.1,.25,1) both}
.ao .ao-t b{display:block;font:900 clamp(2.6rem,calc(12 * var(--vmin)),8rem)/1 'Space Grotesk',Inter,sans-serif;font-style:italic;letter-spacing:-.02em;padding:.02em .1em;background:#f4efe6;color:#050505;transform:skewX(-9deg);box-shadow:calc(.7 * var(--vmin)) calc(.7 * var(--vmin)) 0 #050505}
.ao .ao-t b:nth-child(2n){background:#050505;color:#f4efe6;box-shadow:calc(.7 * var(--vmin)) calc(.7 * var(--vmin)) 0 #f4efe6}
.ao .ao-t b:nth-child(3n){translate:0 -6%;rotate:-3deg}
.ao .ao-t b:nth-child(4n+1){translate:0 5%;rotate:3deg}
.ao .ao-t b.dash{background:var(--ao-r);color:#050505;padding:.02em .06em;box-shadow:calc(.7 * var(--vmin)) calc(.7 * var(--vmin)) 0 #050505}
.ao .ao-s{position:absolute;left:54%;top:41%;rotate:-7deg;padding:.25em 1.1em .25em .8em;background:#f4efe6;color:#050505;font:900 clamp(.9rem,calc(2.8 * var(--vmin)),1.8rem)/1 'Space Grotesk',Inter,sans-serif;letter-spacing:.22em;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%);animation:aoSub .9s .1s cubic-bezier(.2,1,.3,1) both}
.ao .ao-sh{position:absolute;left:50%;top:31%;width:0;height:0;animation:aoShard .8s ease-out both;animation-delay:.06s}
.ao .ao-sh i{position:absolute;left:0;top:0;width:calc(1.2 * var(--vmin));height:calc(5 * var(--vmin));background:#f4efe6;clip-path:polygon(50% 0,100% 100%,0 100%);transform-origin:50% 0;rotate:var(--a);translate:0 0;animation:aoFly .8s .06s ease-out both}
.ao .ao-sh i:nth-child(3n){background:var(--ao-r)}
.ao .ao-sh i:nth-child(3n+1){background:#050505}
@keyframes aoBar{0%{transform:scaleX(0)}16%{transform:scaleX(1)}80%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1) translateX(18%);opacity:0}}
@keyframes aoSlam{0%{scale:2.8;opacity:0}14%{scale:.94;opacity:1}22%{scale:1.04}30%{scale:1}82%{scale:1;opacity:1;translate:-50% 0}100%{scale:1;opacity:0;translate:-30% 0}}
@keyframes aoSub{0%{opacity:0;translate:-30px 0}22%{opacity:1;translate:0 0}80%{opacity:1}100%{opacity:0;translate:40px 0}}
@keyframes aoShard{0%{opacity:1}100%{opacity:0}}
@keyframes aoFly{0%{translate:0 0;scale:.2}100%{translate:var(--dx) var(--dy);scale:1}}
@media(prefers-reduced-motion:reduce){
 .ao .ao-blk,.ao .ao-red{animation:aoFade .9s both}.ao .ao-t{animation:aoFade .9s both}.ao .ao-s{animation:aoFade .9s both}.ao .ao-sh{display:none}
 @keyframes aoFade{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}}
`;
  document.head.appendChild(css);

  let lastAt = 0;

  function stampSound() {
    try { aInit(); } catch (e) {}
    try {
      if (!AU.ctx || !ST.sfx) return;
      withCat("vu", () => {
        const d = AU.sfx, t = AU.ctx.currentTime + 0.02;
        swipe(t, 0.16, 0.1, 400, 6000, d);               /* whoosh in */
        sweep(170, 40, t + 0.1, 0.38, "sine", 0.55, d);   /* the slam */
        noise(t + 0.1, 0.12, 0.2, 2600, d);               /* shatter */
        swipe(t + 0.1, 0.22, 0.16, 6800, 900, d);
        bell(392, t + 0.12, 0.55, 0.08, d);               /* hard stab: a fifth and an octave */
        bell(587, t + 0.12, 0.5, 0.07, d);
        bell(784, t + 0.15, 0.6, 0.05, d);
      });
    } catch (e) {}
  }

  function stamp(n) {
    const host = document.getElementById("fit");   /* the scaled app root: draws over the level-up and rest screens too */
    if (!host) return;
    host.querySelectorAll(".ao").forEach(x => x.remove());
    const el = document.createElement("div");
    el.className = "ao";
    const letters = "ALL-OUT".split("").map(c => c === "-" ? '<b class="dash">-</b>' : "<b>" + c + "</b>").join("");
    let shards = "";
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 360, r = 140 + Math.random() * 260, rad = a * Math.PI / 180;
      shards += '<i style="--a:' + (a | 0) + "deg;--dx:" + (Math.cos(rad) * r | 0) + "px;--dy:" + (Math.sin(rad) * r * 0.6 | 0) + 'px"></i>';
    }
    el.innerHTML = '<div class="ao-blk"></div><div class="ao-red"></div><div class="ao-sh">' + shards + '</div>' +
      '<div class="ao-t">' + letters + '</div><div class="ao-s">' + n + " CLEAN KILLS</div>";
    host.appendChild(el);
    setTimeout(() => el.remove(), 1000);
    stampSound();
  }

  /* wrap the kill hook that the flawless-streak code already uses; read T.kc after it has updated.
     Fires when the streak crosses 5, 10, 15... (a typo sets it back to 0, so it has to be five clean kills again). */
  const prev = rushKill;
  rushKill = function () {
    const k0 = T.kc || 0;
    const r = prev.apply(this, arguments);
    try {
      const n = T.kc || 0, now = performance.now();
      if (T.on && !T.done && T.mode === "hunt" && n > k0 && Math.floor(n / 5) > Math.floor(k0 / 5) && now - lastAt > 800) {
        lastAt = now; stamp(Math.floor(n / 5) * 5);
      }
    } catch (e) {}
    return r;
  };
  window.aoStamp = stamp;   /* handy for testing: aoStamp(5) in the console */
})();
