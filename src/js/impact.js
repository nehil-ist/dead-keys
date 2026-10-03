/* Strike impact: every Space attack gets a camera punch (zoom + tilt), a brief hit-freeze,
   a shockwave ring, a flash and a layered thud. Level 1 = normal cut, 2 = finishing blow, 3 = critical. */
(function () {
  let anim = null;
  const calm = () => matchMedia("(prefers-reduced-motion:reduce)").matches || ST.shake === false;

  function sound(L) {
    try {
      if (!AU.ctx || !ST.sfx) return;
      const t = AU.ctx.currentTime + 0.003, d = AU.sfx, v = 1 + (Math.random() - 0.5) * 0.06;
      // sub thump: the "you feel it" part
      sweep(130 * v, 36, t, 0.18 + L * 0.1, "sine", 0.55 + L * 0.12, d);
      // crack on the transient
      noise(t, 0.05 + L * 0.02, 0.2 + L * 0.05, 1800, d);
      // blade zing falling away
      sweep(2600 * v, 500, t, 0.1 + L * 0.03, "sawtooth", 0.05 + L * 0.015, d, 5000);
      if (L >= 2) { // finishing blow: body + ring
        sweep(80, 28, t + 0.01, 0.55, "sine", 0.7, d);
        noise(t + 0.02, 0.28, 0.12, 700, d);
        bell(523 * v, t + 0.03, 0.8, 0.09, d);
      }
      if (L >= 3) { // critical: bright accent
        bell(1046, t + 0.05, 0.9, 0.08, d);
        tone(1568, t + 0.05, 0.25, "triangle", 0.07, d);
      }
    } catch (e) {}
  }

  function punch(L) {
    const tp = document.getElementById("tp");
    if (!tp || !tp.animate) return;
    const big = L >= 2;
    // hit-freeze: hold the enemy gauge for a beat so the hit lands before anything moves
    try { T.fz = Math.max(T.fz || 0, performance.now() + (big ? 140 : 70)); } catch (e) {}
    // shockwave + flash
    const mk = (cls, big2) => {
      const el = document.createElement("div");
      el.className = cls + (big2 ? " big" : "");
      if (cls === "ixw") el.style.setProperty("--ixs", big2 ? 16 : 9);
      tp.appendChild(el);
      setTimeout(() => el.remove(), 900);
    };
    mk("ixf", big); mk("ixw", big);
    if (calm()) return;
    // camera punch: snap in, then ease out slowly
    const z = L >= 3 ? 1.14 : big ? 1.1 : 1.05;
    const tilt = (Math.random() < 0.5 ? -1 : 1) * (big ? 1.1 : 0.5);
    if (anim) anim.cancel();
    anim = tp.animate([
      { scale: 1, rotate: "0deg", offset: 0 },
      { scale: z, rotate: tilt + "deg", offset: 0.14, easing: "cubic-bezier(.2,.7,.2,1)" },
      { scale: z * 0.995, rotate: tilt * 0.9 + "deg", offset: big ? 0.36 : 0.26 }, // the freeze
      { scale: 1, rotate: "0deg", offset: 1 }
    ], { duration: big ? 520 : 340, easing: "cubic-bezier(.16,.8,.3,1)" });
    anim.onfinish = anim.oncancel = () => { anim = null; };
  }

  const fx = (L) => { punch(L); sound(L); };

  const sf = strikeFx;
  strikeFx = function (boss, fin) { sf.apply(this, arguments); fx(fin ? 2 : 1); };
  const cf = critFx;
  critFx = function () { cf.apply(this, arguments); fx(3); };

  /* ---------- per letter: every correct key lands ---------- */
  const PENTA = [0, 2, 4, 7, 9];
  function keySound(streak, last) {
    try {
      if (!AU.ctx || !ST.sfx) return;
      const t = AU.ctx.currentTime + 0.002, d = AU.sfx;
      const i = Math.min(streak, 39);
      // pitch climbs a pentatonic scale with your streak (two octaves), drops back after a typo
      const f = 330 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5) / 2 * 1) / 12);
      sweep(120, 52, t, 0.08, "sine", 0.3, d);                 // tiny thump under every key
      tone(Math.min(f, 1400), t, 0.14, "triangle", 0.055, d);  // rising note
      noise(t, 0.02, 0.07, 3500, d);                           // click
      if (last) {                                              // last letter: the word is loaded
        sweep(95, 38, t, 0.22, "sine", 0.5, d);
        noise(t + 0.005, 0.07, 0.14, 1400, d);
        tone(Math.min(f * 2, 2200), t, 0.22, "sine", 0.06, d);
      }
      if (streak > 0 && streak % 10 === 0) bell(784, t + 0.01, 0.6, 0.06, d); // every 10: chime
    } catch (e) {}
  }

  function keyFx(el, last) {
    if (calm()) return;
    const k = Math.min(1, (T.streak || 0) / 40); // 0..1 as the streak builds
    if (el && el.animate) // the letter pops
      el.animate([
        { transform: "scale(1.9)", filter: "brightness(2.2)" },
        { transform: "scale(1)", filter: "brightness(1)" }
      ], { duration: 170, easing: "cubic-bezier(.2,.9,.3,1)" });
    const wrap = document.getElementById("tpwrap");
    if (wrap && wrap.animate) // the whole word bumps
      wrap.animate([
        { scale: 1 }, { scale: last ? 1.05 : 1 + 0.012 + k * 0.012, offset: 0.2 }, { scale: 1 }
      ], { duration: last ? 240 : 120, easing: "ease-out" });
    const mob = document.getElementById("mobg");
    if (mob && mob.animate && T.mode === "hunt") { // the enemy flinches
      const a = (last ? 12 : 3 + k * 5) * (Math.random() < 0.5 ? -1 : 1);
      mob.animate([
        { translate: "0 0" }, { translate: a + "px " + (a / 3) + "px", offset: 0.25 }, { translate: "0 0" }
      ], { duration: last ? 200 : 110, easing: "ease-out" });
    }
  }

  const tk = tpKey;
  tpKey = function (e) {
    const live = T.on && !T.done && !T.rest && !T.pz && !T.par && !T.aw && typeof e === "string" && e.length === 1 && !(T.mode === "hunt" && e >= "1" && e <= "3");
    const ok0 = T.ok, len = T.text ? T.text.length : 0, pos = T.pos;
    const el = live ? document.getElementById("tpt").children[pos] : null;
    tk.apply(this, arguments);
    if (live && T.ok > ok0) {
      const last = pos === len - 1;
      keyFx(el, last);
      keySound(T.streak, last);
    }
  };
})();
