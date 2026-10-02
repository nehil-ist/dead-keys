/* Shop: cosmetic frames (borders) and parry ring skins, bought with souls (the permanent currency). Q / E switch tabs. Buying asks for a second press to confirm. */
(function () {
  const RN = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
  const RC = ["#d4cfc4", "#5fd68a", "#5aa2ff", "#b074ff", "#ffc94d"];
  // id, name, description, price in souls, rarity
  const BD = [
    ["grace", "Grace Gate", "A double rule with diamond finials at each corner.", 80, 0],
    ["rivet", "Bastion Plate", "Riveted iron plate, bolted at every corner.", 130, 1],
    ["slash", "Slashmark", "Sharp cut corners, as if drawn with one stroke of a blade.", 170, 1],
    ["lattice", "Asanoha Lattice", "Woven lattice work of a shrine screen.", 250, 2],
    ["chain", "Iron Chain", "Heavy links wound around the screen.", 280, 2],
    ["talisman", "Sealed Talisman", "Paper wards, striped and taped down at the corners.", 400, 3],
    ["crest", "Sovereign Crest", "Branching leaf finials and notched gates.", 800, 4]
  ];
  const BN = [
    ["rune", "Rune Circle", "A double ring ticked like a ward circle.", 90, 0],
    ["blade", "Blade Diamond", "A lozenge with spikes at each point.", 150, 1],
    ["hex", "Hex Seal", "Six-sided seal with an inner ward.", 190, 1],
    ["star", "Shuriken", "A four-point throwing star.", 260, 2],
    ["torii", "Torii Gate", "The ring becomes a shrine gate.", 300, 2],
    ["seal", "Bound Talisman", "A square seal braced at the corners.", 420, 3],
    ["sun", "Sovereign Sun", "A twelve-spike crown around the target.", 850, 4]
  ];
  const BG = [
    ["ledger", "Ledger Lines", "Ruled lines like a record book.", 70, 0],
    ["shoji", "Shoji Screen", "Paper panes in a wooden grid.", 120, 1],
    ["shippo", "Shippo", "Overlapping circles, the seven treasures weave.", 160, 1],
    ["kagome", "Kagome Weave", "A triangular basket lattice.", 250, 2],
    ["hatch", "Ink Hatch", "Crosshatched pen strokes, like manga shading.", 280, 2],
    ["arches", "Ruined Arches", "Pointed arches stacked like a collapsed cloister.", 420, 3],
    ["sun", "Rising Sun", "Rays fanning up from below the box.", 800, 4]
  ];
  const SW = [
    ["crimson", "Crimson Cut", "A blood-red blade stroke.", 60, 0],
    ["ember", "Ember Cut", "Orange like a banked fire.", 80, 0],
    ["jade", "Jade Cut", "A calm green edge.", 130, 1],
    ["azure", "Azure Cut", "Clear blue steel.", 150, 1],
    ["violet", "Violet Cut", "A deep purple slash.", 240, 2],
    ["gold", "Gilded Cut", "Gold leaf across the cut.", 260, 2],
    ["hellfire", "Hellfire", "Yellow to red, like a blade fresh from the forge.", 420, 3],
    ["frost", "Frostedge", "White fading to winter blue.", 420, 3],
    ["prism", "Prism Edge", "Every colour of the spectrum in one stroke.", 880, 4]
  ];
  const NONE3 = ["", "Bone White", "The default white slash and attacks.", 0, 0];
  const NONE0 = ["", "No Border", "The bare frame.", 0, 0];
  const NONE2 = ["", "Plain Box", "The default dark box.", 0, 0];
  const NONE = ["", "Plain Ring", "The default round ring.", 0, 0];
  const NONEV = ["", "Nocturne", "Count Boo-La's own soft, squeaky ghost voice.", 0, 0];
  const GV = (window.GHOST_VOICES || []).map(v => v.slice(0, 5));
  /* Slash Colors preview: the equipped hero's own attack flies in before the cut (mirrors projFx / swordFx in game.js) */
  const PJ = {
    sword: [11, 44, '<svg viewBox="0 0 16 64"><polygon points="8,0 4.4,36 11.6,36" fill="currentColor"/><polygon points="8,0 8,36 11.6,36" fill="#000" opacity=".35"/><polygon points="-1,35 4,33.5 12,33.5 17,35 15,39 11,37.6 5,37.6 1,39" fill="#e9e5dc"/><rect x="6.3" y="38" width="3.4" height="14" fill="#1b1b1a" stroke="#e9e5dc" stroke-width=".7"/></svg>'],
    arrow: [46, 10, '<svg viewBox="0 0 46 10"><path d="M0 5h38M30 1l10 4-10 4" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>'],
    orb: [24, 24, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor" opacity=".85"/><text x="12" y="17" text-anchor="middle" font-size="13" font-weight="900" fill="#000" font-family="serif">\u7B26</text></svg>'],
    ring: [26, 26, '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="none" stroke="currentColor" stroke-width="3"/></svg>'],
    kunai: [24, 24, '<svg viewBox="0 0 26 26"><path d="M13 0l3.5 9.5L26 13l-9.5 3.5L13 26l-3.5-9.5L0 13l9.5-3.5z" fill="currentColor"/></svg>'],
    fang: [34, 17, '<svg viewBox="0 0 36 18"><path d="M0 9L30 0l6 9-6 9z" fill="currentColor"/></svg>'],
    coin: [24, 24, '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="11" fill="#e9e5dc" stroke="currentColor" stroke-width="2"/><rect x="9.5" y="9.5" width="7" height="7" fill="#0a0a0a"/></svg>']
  };
  function pjHtml() {
    let fx = "sword";
    try { fx = curCh().fx || "sword"; } catch (e) {}
    const p = PJ[fx] || PJ.sword;
    return '<u class="pj ' + fx + '" style="--w:' + p[0] + 'px;--h:' + p[1] + 'px">' + p[2] + "</u>";
  }

  let tab = 0;
  const TABS = [
    { name: "Borders", own: "bd", cur: "bdE", items: BD, none: NONE0, kind: "bd", note: "Borders restyle the stat boxes, typing box, chat bubble and screen edge." },
    { name: "Parry Rings", own: "bn", cur: "bnE", items: BN, none: NONE, kind: "bn", note: "Parry ring skins change the shape of the shrinking ring when an enemy attack is parried." },
    { name: "Backgrounds", own: "bg", cur: "bgE", items: BG, none: NONE2, kind: "bg", note: "Backgrounds add a faint pattern behind the words you type." },
    { name: "Slash Colors", own: "sw", cur: "swE", items: SW, none: NONE3, kind: "sw", note: "Slash colors change the color of your sword cuts, and of the swords, arrows and other attacks you fire as you type." },
    { name: "Ghost Voices", own: "gv", cur: "gvE", items: GV, none: NONEV, kind: "gv", note: "Ghost voices change how Count Boo-La talks. Press Hear (or H) to listen before you buy. Turn the ghost off in Settings." }
  ];
  /* ghost wardrobe: hats, wings, neckwear, faces and body colors share ONE tab, split into sections (items live in ghostwear.js) */
  const GW = window.GHOST_WEAR;
  const WSEC = [
    ["hat", "Hats", "No Hat", "Nothing on its head."],
    ["wing", "Wings", "No Wings", "Just a plain, wingless ghost."],
    ["neck", "Neckwear", "No Neckwear", "Nothing around its neck."],
    ["face", "Faces", "Bare Face", "No glasses, no fangs."],
    ["tint", "Body Colors", "Classic White", "The default white ghost."]
  ];
  if (GW) TABS.push({ name: "Ghost Wardrobe", kind: "wear", note: "Count Boo-La's wardrobe: hats, wings, neckwear, faces and body colors. Each section keeps its own pick, so mix and match." });
  /* every card on the current tab: { b: [id, name, desc, price, rarity], K: owned-map key, E: equipped key, kind, slot?, sec? } */
  const entries = () => {
    const T = TABS[tab];
    if (T.kind !== "wear") return [T.none].concat(T.items).map(b => ({ b, K: T.own, E: T.cur, kind: T.kind }));
    const out = [];
    WSEC.forEach(w => {
      const S = GW.SLOT[w[0]];
      [["", w[2], w[3], 0, 0]].concat(GW.ITEMS[w[0]].map(v => v.slice(0, 5))).forEach((b, j) =>
        out.push({ b, K: S.own, E: S.cur, kind: "wear", slot: w[0], sec: j === 0 ? w[1] : "" }));
    });
    return out;
  };

  META.bd = META.bd || {}; META.bdE = META.bdE || "";
  META.bn = META.bn || {}; META.bnE = META.bnE || "";
  META.bg = META.bg || {}; META.bgE = META.bgE || "";
  META.sw = META.sw || {}; META.swE = META.swE || "";
  META.gv = META.gv || {}; META.gvE = META.gvE || "";
  /* old colour/glow borders were retired: refund them in souls */
  if (!META.bdv) {
    const old = { ink: 40, slab: 60, links: 110, blood: 130, moon: 200, ember: 230, frost: 230, void: 380, signal: 360, gilt: 750, soulfire: 950 };
    Object.keys(old).forEach(k => { if (META.bd[k]) { META.souls += old[k]; delete META.bd[k]; } });
    if (old[META.bdE]) META.bdE = "";
    META.bdv = 1; saveMeta();
  }
  if (!META.bnv) {
    const ob = { slash: 60, grace: 110, gate: 180, moon: 240, ledger: 300, ash: 620, bankai: 880 };
    Object.keys(ob).forEach(k => { if (META.bn[k]) { META.souls += ob[k]; delete META.bn[k]; } });
    if (ob[META.bnE]) META.bnE = "";
    META.bnv = 1; saveMeta();
  }
  const own = en => !en.b[0] || !!META[en.K][en.b[0]];
  const eqId = en => (META[en.K][META[en.E]] ? META[en.E] : "");
  const curB = () => (META.bd[META.bdE] ? META.bdE : "");
  const curN = () => (META.bn[META.bnE] ? META.bnE : "");
  const curG = () => (META.bg[META.bgE] ? META.bgE : "");
  const curS = () => (META.sw[META.swE] ? META.swE : "");
  const curV = () => (META.gv[META.gvE] ? META.gvE : "");

  /* frame around the game screen + theme class on body (restyles stat boxes, typing box, chat bubble) */
  const frame = document.createElement("div");
  frame.id = "bdr";
  $("tp").appendChild(frame);
  function paint() {
    const id = curB(), cl = document.body.classList;
    [...cl].filter(c => c === "fon" || /^f-/.test(c)).forEach(c => cl.remove(c));
    if (id) cl.add("fon", "f-" + id);
    frame.className = "bdr" + (id ? " on" : "");
    [...cl].filter(c => c === "prs" || /^pr-/.test(c)).forEach(c => cl.remove(c));
    const n = curN();
    if (n) cl.add("prs", "pr-" + n);
    [...cl].filter(c => c === "tbg" || /^tb-/.test(c)).forEach(c => cl.remove(c));
    const g = curG();
    if (g) cl.add("tbg", "tb-" + g);
    [...cl].filter(c => c === "swc" || /^sw-/.test(c)).forEach(c => cl.remove(c));
    const s = curS();
    if (s) cl.add("swc", "sw-" + s);
    try { window.GHOST && GHOST.refresh && GHOST.refresh(); } catch (e) {}
  }
  paint();

  /* shop screen */
  const ov = mkOv("ovSh");
  let sel = 0;
  /* buying is a two-step: the first press arms the card ("Confirm"), the second buys. Moving away, switching tabs or waiting disarms it. */
  let arm = -1, armAt = 0, armTm = 0;
  let wantX = null; /* remembered column while moving Up / Down, like a text editor */

  const card = i => ov.querySelector('.sh-c[data-i="' + i + '"]');
  function btnState(en, i) {
    const b = en.b;
    if (b[0] === eqId(en)) return ["", "Equipped"];
    if (own(en)) return ["", "Equip"];
    if (META.souls < b[3]) return ["no", "Buy \u00B7 " + b[3] + " souls"];
    return arm === i ? ["cf", "Confirm \u00B7 " + b[3] + " souls"] : ["", "Buy \u00B7 " + b[3] + " souls"];
  }
  function paintBtn(i) {
    const c = card(i), en = entries()[i];
    if (!c || !en) return;
    const bt = c.querySelector(":scope > button"), s = btnState(en, i);
    if (bt) { bt.className = s[0]; bt.textContent = s[1]; }
  }
  function disarm() {
    clearTimeout(armTm);
    const a = arm;
    arm = -1;
    if (a >= 0) paintBtn(a);
  }

  function preview(en, i) {
    const b = en.b;
    if (en.kind === "wear") return '<div class="sh-p pvg">' + GW.build(Object.fromEntries([[en.slot, b[0]]]), "pv" + i, GW.VB[en.slot]) + "</div>";
    if (en.kind === "gv") return '<div class="sh-p pvv"><div class="bars">' + [0, 1, 2, 3, 4, 5, 6].map(n => '<i style="--n:' + n + ';--h:' + (10 + ((b[0].length * 7 + n * 11 + b[4] * 5) % 30)) + 'px"></i>').join("") + '</div><button class="pvbtn" data-v="' + b[0] + '">\u25B6 Hear</button></div>';
    if (en.kind === "bn") return '<div class="sh-p ' + (b[0] ? "pvr pr-" + b[0] : "pvd") + '"><div class="rw"><i class="tg"></i><i class="rg"></i><strong>F</strong></div></div>';
    if (en.kind === "sw") return '<div class="sh-p pvs sw-' + (b[0] || "none") + '">' + pjHtml() + '<i class="sw"></i><i class="sw s2"></i><em>cut it down</em></div>';
    if (en.kind === "bg") return '<div class="sh-p pvt' + (b[0] ? " tb-" + b[0] : "") + '"><div class="tbx"><b>the quiet bla</b>de falls</div></div>';
    return '<div class="sh-p pvb' + (b[0] ? " f-" + b[0] : "") + '">' + (b[0] ? '<div class="bdr pv on"></div><div class="mk"></div>' : "") + "<em>type to survive</em></div>";
  }

  function draw() {
    clearTimeout(armTm);
    arm = -1;
    const T = TABS[tab], ens = entries();
    if (sel >= ens.length) sel = 0;
    ov.innerHTML =
      '<div class="sh-h"><h2>Shop</h2><small>Dress the frame of your hunt, and dress up the ghost</small><span class="sh-s">\u9B42 <b>' + META.souls + "</b> souls</span></div>" +
      '<div class="sh-t"><kbd>Q</kbd>' + TABS.map((t, k) => '<i data-t="' + k + '" class="' + (k === tab ? "on" : "") + '">' + t.name + "</i>").join("") + '<kbd>E</kbd></div><div class="sh-g">' +
      ens.map((en, i) => {
        const b = en.b, e = b[0] === eqId(en), st = btnState(en, i);
        return (en.sec ? '<h3 class="sh-sec">' + en.sec + "</h3>" : "") +
          '<div class="sh-c' + (i === sel ? " sel" : "") + (e ? " eq" : "") + '" data-i="' + i + '" style="--rc:' + RC[b[4]] + '">' + preview(en, i) +
          "<b>" + b[1] + "</b><small>" + (b[0] ? RN[b[4]] + " " + "\u25C6".repeat(b[4] + 1) : "DEFAULT") + "</small><span>" + b[2] + "</span>" +
          '<button class="' + st[0] + '">' + st[1] + "</button></div>";
      }).join("") +
      '</div><p class="sb">' + T.note + " Arrows move \u00B7 Enter equips, or asks to buy and confirms \u00B7 Q / E switch tabs \u00B7 Esc closes.</p>";
  }

  function act(i) {
    const en = entries()[i];
    if (!en) return;
    const b = en.b, id = b[0];
    let bought = false;
    if (own(en)) {
      disarm();
      META[en.E] = id;
      try { sfx("ui"); } catch (e) {}
    } else if (META.souls < b[3]) {
      disarm();
      try { sfx("err"); } catch (e) {}
      toast("Not enough souls: " + (b[3] - META.souls) + " more");
      const c = card(i);
      if (c) { c.classList.remove("nk"); c.offsetWidth; c.classList.add("nk"); }
      return;
    } else if (arm !== i) {
      /* first press: ask, don't buy */
      disarm();
      arm = i; armAt = performance.now();
      paintBtn(i);
      armTm = setTimeout(disarm, 4000);
      try { sfx("ui"); } catch (e) {}
      return;
    } else if (performance.now() - armAt < 350) {
      return; /* a double-click must not confirm by accident */
    } else {
      META.souls -= b[3];
      META[en.K][id] = 1;
      META[en.E] = id;
      bought = true;
      try { window.shopSnd(b[4]); } catch (e) {}
      toast(b[1] + " bought and equipped");
    }
    saveMeta();
    paint();
    if (en.kind === "gv") { try { GHOST.preview(id); } catch (e) {} }
    else if (en.kind === "wear") { try { GHOST.dress(id ? b[1] : ""); } catch (e) {} }
    const top = ov.scrollTop;
    sel = i;
    draw();
    ov.scrollTop = top;
    if (bought) { const c = card(i); if (c) c.classList.add("bgt"); }
  }

  function setTab(t) {
    if (t === tab) return;
    disarm();
    tab = t; sel = 0; draw(); ov.scrollTop = 0;
    try { sfx("ui"); } catch (e) {}
  }

  const highlight = () => ov.querySelectorAll(".sh-c").forEach((c, i) => c.classList.toggle("sel", i === sel));
  function select(i) {
    if (i === sel) return false;
    disarm();
    sel = i;
    highlight();
    return true;
  }
  function reveal() {
    const c = card(sel);
    if (!c) return;
    if (c.offsetTop < 80) { ov.scrollTop = 0; return; }
    c.scrollIntoView({ block: "nearest" });
    const h = c.previousElementSibling;
    if (h && h.classList.contains("sh-sec")) h.scrollIntoView({ block: "nearest" });
  }
  /* Up / Down jump a whole row of the grid, landing on the card nearest in column */
  function rowMove(dir) {
    const cs = [...ov.querySelectorAll(".sh-c")], cur = cs[sel];
    if (!cur) return sel;
    const top = c => c.offsetTop, mid = c => c.offsetLeft + c.offsetWidth / 2, ct = top(cur), cx = wantX == null ? mid(cur) : wantX;
    wantX = cx;
    const cand = cs.filter(c => (dir > 0 ? top(c) > ct + 4 : top(c) < ct - 4));
    const pool = cand.length ? cand : cs;
    const rowTop = (dir > 0 ? Math.min : Math.max)(...pool.map(top));
    const row = cs.filter(c => Math.abs(top(c) - rowTop) <= 4);
    let best = row[0];
    row.forEach(c => { if (Math.abs(mid(c) - cx) < Math.abs(mid(best) - cx)) best = c; });
    return cs.indexOf(best);
  }
  function hear(btn) {
    const box = btn.closest(".pvv");
    try { GHOST.preview(btn.dataset.v); } catch (e) {}
    if (box) { box.classList.add("playing"); clearTimeout(box._t); box._t = setTimeout(() => box.classList.remove("playing"), 2200); }
  }
  ov.addEventListener("click", e => {
    const hb = e.target.closest(".pvbtn");
    if (hb) { e.stopPropagation(); hear(hb); return; }
    const t = e.target.closest(".sh-t i");
    if (t) { setTab(+t.dataset.t); return; }
    const c = e.target.closest(".sh-c");
    if (!c) return;
    const i = +c.dataset.i, en = entries()[i];
    select(i);
    /* the card body only selects what you haven't bought; free equips still work from anywhere on the card */
    if (e.target.closest(".sh-c > button") || (en && own(en))) act(i);
  });
  ov.addEventListener("mouseover", e => {
    const c = e.target.closest(".sh-c");
    if (c) { wantX = null; select(+c.dataset.i); }
  });

  const prev = window.ovKey;
  window.ovKey = function (o, e) {
    if (o !== ov) { prev && prev(o, e); return; }
    const n = entries().length, k = e.key.toLowerCase();
    const to = (i, vert) => {
      e.preventDefault();
      if (!vert) wantX = null;
      if (select(i)) { try { sfx("ui"); } catch (x) {} }
      reveal();
    };
    if (k === "q") { e.preventDefault(); e.repeat || setTab((tab + TABS.length - 1) % TABS.length); }
    else if (k === "e") { e.preventDefault(); e.repeat || setTab((tab + 1) % TABS.length); }
    else if (k === "h" && TABS[tab].kind === "gv") { e.preventDefault(); e.repeat || (() => { const b = entries()[sel]; try { b && GHOST.preview(b.b[0]); } catch (x) {} })(); }
    else if (e.key === "ArrowRight") to((sel + 1) % n);
    else if (e.key === "ArrowLeft") to((sel + n - 1) % n);
    else if (e.key === "ArrowDown") to(rowMove(1), true);
    else if (e.key === "ArrowUp") to(rowMove(-1), true);
    else if (e.key === "Tab") to((sel + (e.shiftKey ? n - 1 : 1)) % n);
    else if (e.key === "Home") to(0);
    else if (e.key === "End") to(n - 1);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.repeat || act(sel); }
  };

  /* main menu entry, right after Heroes & Skills */
  const at = MAIN.findIndex(x => x[0] === "meta");
  MAIN.splice(at < 0 ? MAIN.length - 1 : at + 1, 0, ["shop", "Shop", "Borders, rings, backgrounds, ghost voices and outfits"]);
  const _ma = mainAct;
  mainAct = function (i) {
    if (MAIN[i] && MAIN[i][0] === "shop") { sel = 0; draw(); ov.classList.add("on"); return; }
    return _ma.apply(this, arguments);
  };
  try { if (scr === "main") $("mlist").innerHTML = listHTML(MAIN, mSel); } catch (e) {}
})();
