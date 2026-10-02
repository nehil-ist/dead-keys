/* Count Boo-La: a floating vampire ghost mascot.
   - roams the main menu and the game screen (Settings > Ghost mascot turns it off)
   - talks with a typewriter bubble, voiced by a procedural voice pack (no audio files)
   - voice packs are sold in the Shop (Ghost Voices tab, see shop.js) */
(function () {
  const APP = document.getElementById("fit");
  if (!APP) return;
  const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- settings ---------- */
  if (ST.ghost === undefined) ST.ghost = true;
  if (ST.gvoice === undefined) ST.gvoice = true;
  /* the two toggles live in the settings screen (SET3 in game.js) */

  /* ---------- voice packs ---------- */
  /* id "" is the free default. wave/base(Hz)/spread(semitones)/dur(s)/cps(chars per second) shape the babble.
     fm = formant strength, vib = [Hz, depth], lay = detune layers (cents), noise = breath mix, bell/chip = special synths */
  const VOICES = [
    ["", "Nocturne", "The Count's own soft, squeaky ghost voice.", 0, 0,
      { wave: "triangle", base: 520, spread: 7, dur: .075, cps: 17, fm: 1, gain: .5, glide: .06 }],
    ["chirp", "Bat Chirp", "High, fast squeaks, like a colony in the rafters.", 70, 0,
      { wave: "sine", base: 1150, spread: 9, dur: .05, cps: 26, fm: 0, gain: .5, glide: .35, vib: [30, .02] }],
    ["whisper", "Crypt Whisper", "Breathy and hushed, spoken straight into your ear.", 130, 1,
      { wave: "sawtooth", base: 300, spread: 5, dur: .09, cps: 19, fm: 1.4, gain: .3, noise: 1, glide: 0 }],
    ["elder", "Elder Baritone", "Deep, slow and grand. Centuries of practice.", 170, 1,
      { wave: "sawtooth", base: 118, spread: 5, dur: .13, cps: 12, fm: 1.2, gain: .9, vib: [5, .012], glide: -.05, lp: 2400 }],
    ["wail", "Banshee Wail", "A warbling, theremin-like moan with a wide vibrato.", 260, 2,
      { wave: "sine", base: 640, spread: 8, dur: .16, cps: 11, fm: 0, gain: .55, vib: [6.5, .045], glide: .12 }],
    ["music", "Coffin Music Box", "Each letter is a tiny bell from a haunted music box.", 290, 2,
      { wave: "sine", base: 880, spread: 12, dur: .22, cps: 14, fm: 0, gain: .42, bell: 1, pent: 1 }],
    ["chip", "Chiptune Fiend", "Pure 8-bit square-wave menace.", 420, 3,
      { wave: "square", base: 440, spread: 10, dur: .06, cps: 22, fm: 0, gain: .4, chip: 1, lp: 5200 }],
    ["choir", "Blood Moon Choir", "A whole crimson choir speaking in one voice.", 800, 4,
      { wave: "sawtooth", base: 260, spread: 6, dur: .2, cps: 13, fm: 1.1, gain: .5, lay: [-18, 0, 15, 1200], vib: [4.5, .01], glide: .04, lp: 3600, oct: 1 }]
  ];
  window.GHOST_VOICES = VOICES.slice(1); // shop list (default handled by shop.js)

  const VF = { a: [800, 1250], e: [520, 1900], i: [310, 2300], o: [500, 950], u: [330, 820] };
  const curVoice = () => {
    META.gv = META.gv || {}; META.gvE = META.gvE || "";
    const id = META.gv[META.gvE] ? META.gvE : "";
    return (VOICES.find(v => v[0] === id) || VOICES[0])[5];
  };
  const voiceById = id => (VOICES.find(v => v[0] === id) || VOICES[0])[5];

  let master = null;
  function out() {
    const c = AU.ctx;
    if (!c || !AU.sfx) return null;
    if (!master || master.context !== c) {
      master = c.createGain();
      master.gain.value = .6;
      master.connect(AU.sfx);
    }
    return master;
  }
  let nbuf = null;
  function noiseSrc(c, dur) {
    if (!nbuf || nbuf.sampleRate !== c.sampleRate) {
      nbuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = nbuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = nbuf; s.loop = true;
    s.start(0, Math.random() * .5); s.stop(c.currentTime + dur + .05);
    return s;
  }

  /* one babble syllable. contour: -1..1 shifts pitch (questions rise, exclamations punch) */
  function blip(p, ch, contour, force) {
    if (!ST.sfx || (!force && !ST.gvoice)) return;
    const c = AU.ctx, o = out();
    if (!c || !o) return;
    const code = ch.toLowerCase().charCodeAt(0);
    if (!(code >= 97 && code <= 122)) return;
    const t = c.currentTime + .004, d = p.dur;
    let semi = ((code * 5) % 13) / 12 * p.spread - p.spread / 2 + (contour || 0) * 3;
    if (p.pent) semi = [0, 2, 4, 7, 9, 12, 14, 16][(code * 3) % 8] - 4;
    let f = p.base * Math.pow(2, semi / 12);
    const vow = VF[ch.toLowerCase()] || (code % 2 ? VF.o : VF.e);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(p.gain, t + .01);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    g.connect(o);

    if (p.bell) {
      [1, 2.76, 5.4].forEach((k, i) => {
        const os = c.createOscillator(), gg = c.createGain();
        os.type = "sine"; os.frequency.value = f * k;
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(p.gain / (i * 1.8 + 1), t + .005);
        gg.gain.exponentialRampToValueAtTime(1e-4, t + d * (1 - i * .25));
        os.connect(gg); gg.connect(o); os.start(t); os.stop(t + d + .05);
      });
      return;
    }

    let src = [];
    (p.lay || [0]).forEach(cents => {
      const os = c.createOscillator();
      os.type = p.wave;
      os.frequency.setValueAtTime(f * (1 + (p.glide || 0)), t);
      os.frequency.exponentialRampToValueAtTime(Math.max(30, f), t + d * .8);
      os.detune.value = cents > 100 ? 0 : cents;
      if (cents > 100) os.frequency.value = f * 2;
      if (p.chip) {
        os.frequency.cancelScheduledValues(t);
        os.frequency.setValueAtTime(f, t);
        os.frequency.setValueAtTime(f * 1.26, t + d * .5);
      }
      if (p.vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = p.vib[0]; lg.gain.value = f * p.vib[1];
        l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + d + .05);
      }
      os.start(t); os.stop(t + d + .05);
      src.push(os);
    });
    if (p.noise) src.push(noiseSrc(c, d));

    if (p.fm) {
      /* two vowel formants give it a mouth */
      vow.forEach((fr, i) => {
        const bp = c.createBiquadFilter(), gg = c.createGain();
        bp.type = "bandpass"; bp.frequency.value = fr * (f > 500 ? 1.2 : 1); bp.Q.value = p.noise ? 3 : 5;
        gg.gain.value = (i ? .55 : 1) * p.fm * (p.noise ? 1.6 : 1);
        src.forEach(s => s.connect(bp));
        bp.connect(gg); gg.connect(g);
      });
    } else {
      const lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = p.lp || 6000;
      src.forEach(s => s.connect(lp));
      lp.connect(g);
    }
    if (p.lp && p.fm) {
      const lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = p.lp;
      g.disconnect(); g.connect(lp); lp.connect(o);
    }
  }

  /* non-speech ghost sounds, all built from the equipped pack so they match its voice */
  function laugh(p) {
    const w = "hahaha";
    for (let i = 0; i < 6; i++) setTimeout(() => blip(p, w[i], 2 - i * .7), i * 120);
  }
  function wooo(p) {
    const c = AU.ctx, o = out();
    if (!c || !o || !ST.gvoice || !ST.sfx) return;
    const t = c.currentTime + .01, os = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    os.type = p.chip ? "square" : p.wave === "sawtooth" ? "sawtooth" : "sine";
    os.frequency.setValueAtTime(p.base * .7, t);
    os.frequency.exponentialRampToValueAtTime(p.base * 1.5, t + .5);
    os.frequency.exponentialRampToValueAtTime(p.base * .5, t + 1.1);
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = 6; lg.gain.value = p.base * .05; l.connect(lg); lg.connect(os.frequency);
    lp.type = "lowpass"; lp.frequency.value = 1800;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p.gain * .8, t + .25);
    g.gain.exponentialRampToValueAtTime(1e-4, t + 1.15);
    os.connect(lp); lp.connect(g); g.connect(o);
    os.start(t); l.start(t); os.stop(t + 1.2); l.stop(t + 1.2);
  }
  function poof() {
    const c = AU.ctx, o = out();
    if (!c || !o || !ST.sfx || !ST.gvoice) return;
    const t = c.currentTime + .01, s = noiseSrc(c, .35), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(5000, t + .3);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.28, t + .06);
    g.gain.exponentialRampToValueAtTime(1e-4, t + .33);
    s.connect(bp); bp.connect(g); g.connect(o);
  }

  /* ---------- lines ---------- */
  const L = {
    greet: ["Good evening, little typist... I am Count Boo-La!", "Welcome back to the crypt. Shall we type?", "Ooh, fresh fingers! Delicious."],
    idle: ["Boo! ...did I scare you? No? Hmm.", "I haven't had a bite in centuries. I'm on a typing diet.", "Fast fingers, warm hearts. Mostly the hearts.", "Psst. Spend your souls in the Shop. I'll sing for you.", "Being dead is fine. Being slow is worse.", "I float, therefore I type.", "Try the Shop! My voices and outfits are very, very fashionable.", "I'm not a ghost who haunts. I'm a ghost who vibes."],
    poke: ["Hee hee! That tickles.", "Boo! Ha ha ha!", "Careful, I'm see-through, not defenseless!", "Again, again!", "You poked a ghost. Bold."],
    set: ["Settings? You can switch me off here... but you wouldn't. Right?", "Turn me down if I'm too chatty. I won't cry. Much."],
    song: ["Ooh, pick a song! Something spooky."],
    shop: ["The Shop! Try my voices, or dress me up.", "Ahh, souls! Spend them wisely. Or on me.", "A new voice? Make it a good one."],
    start: ["Time to hunt! Don't stop typing!", "Show them what your fingers can do!", "Heart high, fingers fast!"],
    kill: ["Slain! Magnificent!", "Oooh, so tidy!", "Bleh, that one was dry.", "Another one gone!", "Sharp!"],
    boss: ["The boss is down?! Bravo!", "Now THAT was a feast!"],
    hurt: ["Ouch! Mind your hearts!", "Careful!!", "That one looked painful.", "Eek!"],
    low: ["Your hearts! Breathe and type clean!", "Stay with me, dear!", "Don't die on me, I'm the only dead one here!"],
    streak: ["Look at that flow!", "Unstoppable!", "Your fingers are on fire!", "Ooh, I'm getting dizzy!"],
    fell: ["You fell... but death is only the beginning. Again?", "Hee, don't worry. I've died loads.", "A glorious defeat! Go again!"],
    done: ["Time! Not bad at all!", "You survived. How terribly lively of you!"]
  };

  /* ---------- DOM ---------- */
  /* the ghost is a plain ghost: whatever it wears comes from the Shop (see ghostwear.js) */
  const art = () => GHOST_WEAR.build(GHOST_WEAR.worn(), "m");

  const gh = document.createElement("div");
  gh.id = "gh";
  gh.innerHTML = '<div class="gb"><small>Count Boo-La</small><span></span></div><div class="gs">' + art() +
    '</div><i class="gw w1"></i><i class="gw w2"></i><i class="gw w3"></i>';
  APP.appendChild(gh);
  const bub = gh.querySelector(".gb"), btx = bub.querySelector("span"), gs = gh.querySelector(".gs");

  /* ---------- state ---------- */
  const S = {
    x: 140, y: 140, vx: 0, vy: 0, tx: 300, ty: 200, face: 1, nt: 0, t0: performance.now(),
    vis: false, ctx: "menu", wantCtx: "", bw: 200, bh: 50, bx: 0, below: false,
    q: null, qi: 0, qt: 0, talking: false, hideT: 0, nextIdle: 0, lastSay: 0, lastCtxLine: "",
    rects: [], rt: 0, lastScr: "", lastShop: false, streakSaid: 0, wasAlive: false, born: 0
  };
  const $$ = id => document.getElementById(id);
  const sz = () => (FIT.w < 600 ? .66 : 1.12) * (S.ctx === "game" ? .66 : 1);

  /* ---------- speaking ---------- */
  function speak(text, opt) {
    opt = opt || {};
    const now = performance.now();
    if (!S.vis) return;
    if (!opt.force && S.talking && !opt.cut) return;
    S.lastSay = now;
    clearTimeout(S.hideT);
    btx.textContent = "";
    bub.classList.remove("on"); bub.offsetWidth; bub.classList.add("on");
    // measure the final size once so the bubble does not jump while typing
    bub.style.width = ""; bub.style.minHeight = "";
    btx.textContent = text;
    S.bw = Math.min(bub.offsetWidth, 250); S.bh = bub.offsetHeight;
    bub.style.width = S.bw + "px"; bub.style.minHeight = S.bh + "px";
    btx.textContent = "";
    S.q = text; S.qi = 0; S.qt = now; S.talking = true;
    S.contour = /\?\s*$/.test(text) ? 1 : /!\s*$/.test(text) ? .5 : 0;
    S.pack = opt.pack || curVoice(); S.pv = !!opt.preview;
  }
  function stopTalk() {
    S.talking = false; gh.classList.remove("talk");
    S.hideT = setTimeout(() => bub.classList.remove("on"), S.ctx === "game" ? 1800 : 3200);
  }
  function tickTalk(now) {
    if (!S.talking) return;
    const p = S.pack, step = 1000 / p.cps;
    while (S.qi < S.q.length && now - S.qt >= step) {
      const ch = S.q[S.qi++];
      S.qt += step * (",.!?".includes(ch) ? 5 : ch === " " ? .6 : 1);
      btx.textContent = S.q.slice(0, S.qi);
      if (/[a-z]/i.test(ch) && S.qi % 2) blip(p, ch, S.contour * (S.qi / S.q.length), S.pv);
    }
    gh.classList.toggle("talk", S.qi < S.q.length);
    if (S.qi >= S.q.length) stopTalk();
  }

  /* ---------- movement ---------- */
  function refreshRects() {
    S.rects = [];
    if (S.ctx !== "game") return;
    /* the play column (typing box, enemy panels) spans the full height: the ghost stays in the side margins, below the stat bar */
    let l = 1e9, r2 = -1e9;
    ["tpwrap", "tprow"].forEach(id => {
      const e = $$(id);
      if (e && e.offsetParent !== null) { const r = e.getBoundingClientRect(); l = Math.min(l, r.left); r2 = Math.max(r2, r.right); }
    });
    if (r2 > l) S.rects.push([l - 8, 0, r2 + 8, FIT.h]);
    const h = document.querySelector("#tp .tph");
    S.rects.push([0, 0, FIT.w, h ? Math.max(70, h.getBoundingClientRect().bottom + 6) : 90]);
  }
  const hits = (x, y, w, h) => S.rects.some(r => x < r[2] && x + w > r[0] && y < r[3] && y + h > r[1]);

  function newTarget() {
    const W = FIT.w, H = FIT.h, k = sz(), gw = 130 * k, gh2 = 150 * k, m = 12;
    if (S.ctx === "shop") { S.tx = W - gw - 28; S.ty = H - gh2 - 18; return; }
    if (RM) { S.tx = W - gw - 30; S.ty = H - gh2 - 30; return; }
    for (let i = 0; i < 40; i++) {
      const x = R(m, W - gw - m), y = R(m + 40 * k, H - gh2 - m);
      if (!hits(x, y, gw, gh2)) { S.tx = x; S.ty = y; return; }
    }
    S.tx = W - gw - m; S.ty = H - gh2 - m;
  }

  function setCtx() {
    const menuOn = $$("menu") && $$("menu").classList.contains("on");
    const gameOn = $$("tp") && $$("tp").classList.contains("on");
    const shopOn = $$("ovSh") && $$("ovSh").classList.contains("on");
    const intro = !!$$("wk");
    const want = ST.ghost && !intro && (menuOn || gameOn || shopOn);
    const c = shopOn ? "shop" : gameOn && !menuOn ? "game" : "menu";
    if (c !== S.ctx) { S.ctx = c; S.nt = 0; refreshRects(); gh.classList.toggle("gm2", c === "game"); gh.classList.toggle("sp", c === "shop"); }
    if (want && !S.vis) {
      S.vis = true; S.born = performance.now();
      S.x = Math.min(FIT.w - 160, S.x); S.y = Math.min(FIT.h - 170, S.y);
      gh.classList.add("on"); gh.classList.remove("pop"); gh.offsetWidth; gh.classList.add("pop");
      S.nextIdle = performance.now() + 4500;
      if (S.ctx === "menu" && !S.greeted) { S.greeted = true; setTimeout(() => speak(pick(L.greet)), 1100); }
    } else if (!want && S.vis) {
      S.vis = false; gh.classList.remove("on", "talk"); bub.classList.remove("on"); S.talking = false;
    }
  }

  /* ---------- main loop ---------- */
  let last = 0, chk = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (now - chk > 200) {
      chk = now; setCtx();
      if (now - S.rt > 600) { S.rt = now; refreshRects(); }
      if (S.vis) watch(now);
    }
    if (!S.vis) return;
    const k = sz();
    if (now > S.nt) { newTarget(); S.nt = now + (RM ? 1e9 : R(3200, 6500)); }
    const spring = S.ctx === "shop" ? 2.2 : 1.1;
    S.vx += ((S.tx - S.x) * spring - S.vx * 2.1) * dt;
    S.vy += ((S.ty - S.y) * spring - S.vy * 2.1) * dt;
    S.x += S.vx * dt; S.y += S.vy * dt;
    if (Math.abs(S.vx) > 14) S.face += ((S.vx > 0 ? 1 : -1) - S.face) * Math.min(1, dt * 7);
    const t = (now - S.t0) / 1000, bob = RM ? 0 : Math.sin(t * 2.1) * 7 + Math.sin(t * 1.3) * 3;
    const tilt = Math.max(-14, Math.min(14, S.vx * .05));
    gh.style.transform = "translate3d(" + S.x.toFixed(1) + "px," + (S.y + bob).toFixed(1) + "px,0)";
    gs.style.transform = "scale(" + (S.face * k).toFixed(3) + "," + k + ") rotate(" + (tilt * S.face).toFixed(1) + "deg)";
    // bubble placement: keep inside the screen, flip below the ghost near the top
    const gw = 130 * k, gh2 = 150 * k;
    const bx = Math.max(8 - S.x, Math.min(FIT.w - 8 - S.bw - S.x, gw / 2 - S.bw / 2));
    const below = S.y - S.bh - 20 < 4;
    bub.style.left = bx.toFixed(0) + "px";
    bub.style.top = (below ? gh2 + 4 : -S.bh - 14) + "px";
    bub.classList.toggle("bl", below);
    bub.style.setProperty("--ax", Math.max(14, Math.min(S.bw - 14, gw / 2 - bx)).toFixed(0) + "px");
    // in game, fade out while floating over the typing box so it never hides a letter
    gh.classList.toggle("ovr", S.ctx === "game" && hits(S.x, S.y, gw, gh2));
    tickTalk(now);
  }

  /* ---------- reacting to the game ---------- */
  function ctxLine(kind, minGap, chance) {
    const now = performance.now();
    if (!S.vis || now - S.lastSay < (minGap || 6000)) return;
    if (chance != null && Math.random() > chance) return;
    speak(pick(L[kind]));
  }
  function watch(now) {
    if (S.ctx === "menu") {
      if (typeof scr !== "undefined" && scr !== S.lastScr) {
        S.lastScr = scr;
        if (scr === "set") setTimeout(() => ctxLine("set", 1500), 500);
        else if (scr === "song") setTimeout(() => ctxLine("song", 1500, .7), 500);
      }
      if (now > S.nextIdle) { S.nextIdle = now + R(15000, 26000); ctxLine("idle", 5000); }
    } else if (S.ctx === "game") {
      if (typeof T !== "undefined" && T.on && !T.done) {
        const st = T.streak || 0;
        if (st >= 25 && Math.floor(st / 25) > S.streakSaid) { S.streakSaid = Math.floor(st / 25); ctxLine("streak", 4000); }
        if (st < 25) S.streakSaid = 0;
      }
    }
  }
  /* hook the game's own functions (same pattern shop.js uses for mainAct) */
  try { const o = tpBegin; tpBegin = function () { const r = o.apply(this, arguments); try { S.streakSaid = 0; setTimeout(() => ctxLine("start", 0), 1300); } catch (e) {} return r; }; } catch (e) {}
  try { const o = tpMsg; tpMsg = function (m) { const r = o.apply(this, arguments); try { if (m === "Slain") ctxLine("kill", 7000, .35); else if (m === "Boss down") { S.lastSay = 0; ctxLine("boss", 0); } } catch (e) {} return r; }; } catch (e) {}
  try { const o = hurtFx; hurtFx = function () { const r = o.apply(this, arguments); try { const low = T.hp <= 28; ctxLine(low ? "low" : "hurt", 7000, low ? .8 : .3); } catch (e) {} return r; }; } catch (e) {}
  try { const o = tpEnd; tpEnd = function () { const was = T.done; const r = o.apply(this, arguments); if (!was) setTimeout(() => { try { S.lastSay = 0; speak(pick(T.hp <= 0 ? L.fell : L.done), { cut: true }); } catch (e) {} }, 700); return r; }; } catch (e) {}
  try { const o = applySet; applySet = function () { const r = o.apply(this, arguments); try { const was = S.vis; setCtx(); if (!was && S.vis) { poof(); speak("Back from the grave!", { cut: true }); } } catch (e) {} return r; }; } catch (e) {}

  /* ---------- poke (click / tap on the ghost, as long as no button is under the finger) ---------- */
  function poke(e) {
    if (!S.vis || S.ctx === "game") return;
    if (e.target.closest && e.target.closest("button,.mi,.sr,input,.sh-c,.sh-t,.bk,a,[data-i]")) return;
    const r = gs.getBoundingClientRect(), pad = 6;
    if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad) return;
    try { aInit(); } catch (x) {}
    gh.classList.remove("hop"); gh.offsetWidth; gh.classList.add("hop");
    const p = curVoice();
    if (Math.random() < .45) { laugh(p); speak(pick(L.poke), { cut: true, pack: p }); }
    else if (Math.random() < .5) { wooo(p); speak("Wooo...! Boo!", { cut: true }); }
    else speak(pick(L.poke), { cut: true });
    S.tx = R(20, FIT.w - 150); S.ty = R(20, FIT.h - 170); S.nt = performance.now() + 4000;
  }
  document.addEventListener("pointerdown", poke, true);
  const unlock = () => { try { aInit(); } catch (e) {} };
  addEventListener("pointerdown", unlock, { once: true, capture: true });
  addEventListener("keydown", unlock, { once: true, capture: true });

  /* ---------- API for the shop ---------- */
  window.GHOST = {
    preview(id) {
      try { aInit(); } catch (e) {}
      const p = voiceById(id);
      const line = pick(["Good evening. I'd like to drink your typos.", "Boo! Do I sound fabulous or what?", "Count Boo-La, at your service."]);
      S.vis ? speak(line, { force: true, pack: p, cut: true, preview: true }) : (function () { let i = 0; const q = line; const iv = setInterval(() => { if (i >= q.length) return clearInterval(iv); blip(p, q[i], 0, true); i++; }, 1000 / p.cps); })();
      return line;
    },
    say(text) { speak(text, { cut: true }); },
    /* redraw the ghost after the player equips something in the Shop */
    refresh() {
      gs.innerHTML = art();
      gh.classList.remove("hop"); gh.offsetWidth; gh.classList.add("hop");
    },
    dress(name) {
      speak(name ? pick(["Ooh, the " + name + "! Fabulous.", "The " + name + "? I look dead good.", "A " + name + "! How dashing."]) : pick(["Back to plain old me!", "Simple and spooky."]), { cut: true });
    },
    laugh() { laugh(curVoice()); },
    wooo() { wooo(curVoice()); },
    voices: VOICES
  };
  requestAnimationFrame(frame);
})();
