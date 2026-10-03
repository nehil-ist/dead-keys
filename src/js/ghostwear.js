/* Count Boo-La's wardrobe.
   The ghost itself is a plain white ghost. Everything it can wear is sold in the Shop:
   hats, wings, neckwear, face items and body colors. Each item is
   [id, name, description, price in souls, rarity 0-4, svg (or palette for tints)].
   build(worn, uid, viewBox) draws the ghost; worn() reads what the player has equipped. */
(function () {
  /* ---------- storage: owned maps + equipped ids, one pair per slot ---------- */
  const SLOT = {
    hat: { own: "ghH", cur: "ghHE" },
    wing: { own: "ghW", cur: "ghWE" },
    neck: { own: "ghN", cur: "ghNE" },
    face: { own: "ghF", cur: "ghFE" },
    tint: { own: "ghT", cur: "ghTE" }
  };
  Object.keys(SLOT).forEach(k => {
    META[SLOT[k].own] = META[SLOT[k].own] || {};
    META[SLOT[k].cur] = META[SLOT[k].cur] || "";
  });

  /* retired items: refund the souls and unequip (bandana was replaced by the Ninja Scarf) */
  if (!META.gwv) {
    const gone = { neck: { bandana: 170 } };
    Object.keys(gone).forEach(k => Object.keys(gone[k]).forEach(id => {
      if (META[SLOT[k].own][id]) { META.souls += gone[k][id]; delete META[SLOT[k].own][id]; }
      if (META[SLOT[k].cur] === id) META[SLOT[k].cur] = "";
    }));
    META.gwv = 1;
    try { saveMeta(); } catch (e) {}
  }
  const worn = () => {
    const o = {};
    Object.keys(SLOT).forEach(k => {
      const id = META[SLOT[k].cur];
      o[k] = id && META[SLOT[k].own][id] ? id : "";
    });
    return o;
  };


  /* ---------- little helpers for animated bits (CSS classes gx-* live in ghost.css) ---------- */
  const spark = (x, y, sc, c, cls) => `<g transform="translate(${x} ${y}) scale(${sc})"><path class="gx-tw ${cls ? "gx-" + cls : ""}" d="M0 -6 1.6 -1.6 6 0 1.6 1.6 0 6 -1.6 1.6 -6 0 -1.6 -1.6Z" fill="${c}"/></g>`;
  const flame = (x, y, sc, c, cls) => `<g transform="translate(${x} ${y}) scale(${sc})"><path class="gx-fl ${cls ? "gx-" + cls : ""}" d="M0 8C-9 0-9-12-2-22-1-14 3-12 5-6 8-2 6 5 0 8Z" fill="${c}"/></g>`;
  const feather = (ang, len, c, cls) => `<g transform="rotate(${ang} 38 98)"><path class="gx-fw ${cls ? "gx-" + cls : ""}" d="M38 98Q${38 - len * .5} ${98 - len * .22} ${38 - len} 98 ${38 - len * .5} ${98 + len * .14} 38 100Z" fill="${c}"/></g>`;
  const BODY = "M70 28C100 28 118 50 116 78 114 96 104 106 98 120 92 136 98 150 84 156 74 160 66 152 70 144 76 134 68 128 58 124 42 118 24 100 24 76 24 48 42 28 70 28Z";

  /* ---------- hats (drawn on the head, top of the head is y=28) ---------- */
  const HATS = [
    ["sprout", "Little Sprout", "A tiny seedling growing from its head.", 40, 0,
      `<path d="M70 32C70 22 70 16 70 9" stroke="#3f8f4a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
       <path d="M70 13C58 2 46 6 46 6 50 19 62 21 70 13Z" fill="#5fd68a" stroke="#2c6b3a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M70 13C82 2 94 6 94 6 90 19 78 21 70 13Z" fill="#7be7a0" stroke="#2c6b3a" stroke-width="2" stroke-linejoin="round"/>`],
    ["beanie", "Knit Beanie", "A snug woolly cap with a fluffy pom.", 70, 0,
      `<path d="M42 38C40 12 56 2 70 2 84 2 100 12 98 38 84 43 56 43 42 38Z" fill="#4a6cff" stroke="#1f2f8a" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="32" width="58" height="11" rx="5" fill="#2f4ad0" stroke="#1f2f8a" stroke-width="2.4"/>
       <path d="M52 34v7M60 34v7M68 34v7M76 34v7M84 34v7M92 34v7" stroke="#1f2f8a" stroke-width="1.4"/>
       <circle cx="70" cy="2" r="7" fill="#f4f1ea" stroke="#1f2f8a" stroke-width="2.2"/>`],
    ["party", "Party Hat", "Every day is somebody's un-birthday.", 90, 1,
      `<path d="M70 -22 50 36Q70 44 90 36Z" fill="#ff6fa5" stroke="#8a1f4d" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M62 -2 82 6M58 12 86 20M54 26 90 32" stroke="#ffe27a" stroke-width="3" stroke-linecap="round"/>
       <circle cx="70" cy="-23" r="6" fill="#ffe27a" stroke="#8a1f4d" stroke-width="2"/>`],
    ["horns", "Little Horns", "Tiny devil horns. Very tiny. Very devilish.", 130, 1,
      `<path d="M48 38C39 24 41 8 52 -1 52 12 57 22 63 31Z" fill="#e8143f" stroke="#5a0a1e" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M92 38C101 24 99 8 88 -1 88 12 83 22 77 31Z" fill="#e8143f" stroke="#5a0a1e" stroke-width="2.2" stroke-linejoin="round"/>`],
    ["tophat", "Top Hat", "Dapper. Slightly haunted.", 220, 2,
      `<ellipse cx="70" cy="33" rx="40" ry="8" fill="#14101f" stroke="#0a0a0a" stroke-width="2.4"/>
       <path d="M50 32V-6Q70 -12 90 -6V32Q70 38 50 32Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 21Q70 27 90 21V30Q70 36 50 30Z" fill="#8a2be2"/>`],
    ["witch", "Witch Hat", "Pointy, crooked and slightly too big.", 260, 2,
      `<ellipse cx="70" cy="32" rx="46" ry="9" fill="#3b2a6b" stroke="#150f2a" stroke-width="2.4"/>
       <path d="M50 31C56 14 62 -4 76 -28 80 -14 80 -6 88 4 91 12 92 22 92 31Q70 38 50 31Z" fill="#3b2a6b" stroke="#150f2a" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 24Q70 32 92 24L92 31Q70 38 50 31Z" fill="#ff9a2e"/>
       <rect x="64" y="25" width="12" height="10" rx="1.5" fill="none" stroke="#ffe27a" stroke-width="2"/>`],
    ["halo", "Halo", "A golden ring that floats just above.", 380, 3,
      `<ellipse cx="70" cy="9" rx="31" ry="9" fill="none" stroke="#ffd95a" stroke-width="12" opacity=".22"/>
       <ellipse cx="70" cy="9" rx="30" ry="8" fill="none" stroke="#ffd95a" stroke-width="6"/>
       <ellipse cx="70" cy="9" rx="30" ry="8" fill="none" stroke="#fff6c2" stroke-width="2" opacity=".85"/>`],
    ["count", "Count's Hat", "Wide brim, crimson band and a little bat pin.", 500, 3,
      `<ellipse cx="70" cy="30" rx="44" ry="9" fill="#14101f" stroke="#0a0a0a" stroke-width="2.6"/>
       <path d="M42 28C42 4 52 -8 70 -8 88 -8 98 4 98 28 84 33 56 33 42 28Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2.6" stroke-linejoin="round"/>
       <path d="M43 22C58 28 82 28 97 22L98 28C84 33 56 33 42 28Z" fill="#b3123a"/>
       <path d="M86 14 92 4 96 12 102 6 100 18 94 16Z" fill="#241a38" stroke="#e8143f" stroke-width="1.6" stroke-linejoin="round"/>`],
    ["crown", "Gold Crown", "Heavy is the head. Shiny is the crown.", 800, 4,
      `<path d="M44 36 40 6 56 20 70 -2 84 20 100 6 96 36Q70 43 44 36Z" fill="#ffc94d" stroke="#8a5a00" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M46 30Q70 37 94 30" stroke="#fff3b0" stroke-width="2" fill="none" opacity=".8"/>
       <circle cx="70" cy="26" r="4" fill="#e8143f" stroke="#5a0a1e" stroke-width="1.4"/>
       <circle cx="55" cy="28" r="2.6" fill="#5aa2ff" stroke="#1f2f8a" stroke-width="1.2"/>
       <circle cx="85" cy="28" r="2.6" fill="#5aa2ff" stroke="#1f2f8a" stroke-width="1.2"/>
       <circle cx="40" cy="6" r="3" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/><circle cx="70" cy="-2" r="3.4" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/><circle cx="100" cy="6" r="3" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/>`],
    ["cat", "Cat Ears", "Two soft ears. Does not make it any less haunted.", 60, 0,
      `<path d="M43 42 44 12 68 32Z" fill="#2a2540" stroke="#0a0a14" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M97 42 96 12 72 32Z" fill="#2a2540" stroke="#0a0a14" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M49 33 49.5 21 60 31Z" fill="#ff8aa6"/><path d="M91 33 90.5 21 80 31Z" fill="#ff8aa6"/>`],
    ["wisp", "Soul Flame", "A cold blue flame that keeps you company.", 240, 2,
      flame(70, 8, 1.7, "#5aa2ff", "") + flame(70, 6, 1, "#e8fbff", "b") + spark(52, -6, .8, "#9fe8ff", "") + spark(90, -10, .7, "#9fe8ff", "c")],
    ["wizard", "Starry Wizard Hat", "Stars you can actually watch twinkle.", 420, 3,
      `<ellipse cx="70" cy="33" rx="44" ry="9" fill="#2a3a8a" stroke="#101a4a" stroke-width="2.4"/>
       <path d="M48 32C54 12 62 -8 78 -30 82 -14 86 6 92 32Q70 39 48 32Z" fill="#2a3a8a" stroke="#101a4a" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M48 26Q70 34 92 26L92 32Q70 39 48 32Z" fill="#ffd95a"/>` +
      spark(68, 14, 1.3, "#ffe27a", "") + spark(82, -4, 1, "#fff6c2", "b") + spark(60, 0, .8, "#ffe27a", "c") + spark(84, 20, .8, "#fff6c2", "")],
    ["storm", "Storm Cloud", "Your very own rain. Lightning is extra.", 480, 3,
      `<g fill="#4a4f6b" stroke="#232744" stroke-width="2.2"><circle cx="54" cy="-4" r="11"/><circle cx="70" cy="-10" r="14"/><circle cx="87" cy="-4" r="11"/><rect x="48" y="-6" width="44" height="12" rx="6" stroke="none"/></g>
       <rect x="52" y="-6" width="36" height="10" rx="5" fill="#4a4f6b"/>
       <path class="gx-fh" d="M72 6 63 20 70 20 65 33 81 15 73 15 78 6Z" fill="#ffe45a" stroke="#8a6a00" stroke-width="1.2" stroke-linejoin="round"/>
       <g fill="#7ac8ff"><rect class="gx-fa" x="52" y="8" width="2.4" height="7" rx="1.2"/><rect class="gx-fa gx-b" x="86" y="8" width="2.4" height="7" rx="1.2"/><rect class="gx-fa gx-c" x="60" y="9" width="2.4" height="7" rx="1.2"/><rect class="gx-fa gx-d" x="79" y="9" width="2.4" height="7" rx="1.2"/></g>`],
    ["frost", "Frost Crown", "Ice that never melts. Snow that never stops.", 850, 4,
      `<path d="M44 36 42 4 56 22 70 -8 84 22 98 4 96 36Q70 43 44 36Z" fill="#bfeaff" stroke="#2a6a9a" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M56 22 58 36M70 -8 70 38M84 22 82 36" stroke="#fff" stroke-width="1.6" opacity=".8"/>
       <path d="M46 31Q70 38 94 31" stroke="#7ac8ff" stroke-width="2.4" fill="none"/>
       <circle cx="70" cy="28" r="3.6" fill="#5aa2ff" stroke="#1f4a8a" stroke-width="1.4"/>` +
      spark(70, -8, 1.3, "#fff", "") + spark(42, 4, 1, "#e8fbff", "b") + spark(98, 4, 1, "#e8fbff", "c") +
      `<g fill="#fff"><circle class="gx-fa gx-e" cx="48" cy="-2" r="1.8"/><circle class="gx-fa gx-f" cx="92" cy="-4" r="1.8"/><circle class="gx-fa gx-g" cx="70" cy="-14" r="1.6"/></g>`]
  ];

  /* ---------- wings: only the LEFT wing is drawn, the right one is its mirror ---------- */
  const WINGS = [
    ["tiny", "Tiny Wings", "Two small feathered nubs. Cute, not useful.", 60, 0,
      `<ellipse cx="20" cy="90" rx="15" ry="9" fill="#fff" stroke="#9fb3ff" stroke-width="2.2" transform="rotate(-28 20 90)"/>
       <path d="M10 92Q20 86 28 84" stroke="#cfd6ff" stroke-width="1.6" fill="none"/>`],
    ["fairy", "Fairy Wings", "See-through wings that catch the light.", 160, 1,
      `<path d="M38 94C28 74 10 62-2 70-8 80 8 92 36 98Z" fill="#bff6ff" fill-opacity=".72" stroke="#5ab8c8" stroke-width="2" stroke-linejoin="round"/>
       <path d="M38 100C26 102 12 110 14 121 22 125 34 115 40 104Z" fill="#bff6ff" fill-opacity=".6" stroke="#5ab8c8" stroke-width="2" stroke-linejoin="round"/>
       <path d="M34 96C22 86 10 76 2 72" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>`],
    ["bat", "Bat Wings", "Leathery wings with crimson veins.", 200, 1,
      `<path d="M36 92C20 76 6 78-6 90 4 90 10 94 12 100 18 96 24 98 28 106 32 100 36 100 40 104Z" fill="#241a38" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M12 100C18 92 26 94 32 100M28 106C30 98 34 96 38 98" stroke="#b3123a" stroke-width="1.6" fill="none"/>`],
    ["butterfly", "Butterfly Wings", "Painted wings, one pink and one blue.", 280, 2,
      `<path d="M38 92C30 66 4 56-2 74-6 88 16 96 38 98Z" fill="#ff8ad0" stroke="#7a2a6a" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M38 100C24 100 6 108 10 124 16 134 34 120 40 104Z" fill="#8ad0ff" stroke="#2a5a8a" stroke-width="2.2" stroke-linejoin="round"/>
       <circle cx="14" cy="80" r="4" fill="#fff" opacity=".8"/><circle cx="20" cy="119" r="3" fill="#fff" opacity=".8"/>`],
    ["angel", "Angel Wings", "Soft white feathers. Purely decorative, probably.", 320, 2,
      `<path d="M38 94C24 70 4 66-10 74-4 78 0 82 2 88-6 88-12 92-12 96-4 98 4 100 8 104 2 106-2 112 0 116 10 116 22 112 36 104Z" fill="#fff" stroke="#9fb3ff" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M6 92C18 90 28 94 34 100M4 102C16 100 26 102 34 106" stroke="#cfd6ff" stroke-width="1.6" fill="none"/>`],
    ["moth", "Moth Wings", "Dusty, soft and drawn to the light.", 260, 2,
      `<path d="M38 92C26 66 4 58 -6 70 -10 84 8 96 36 98Z" fill="#d9c3a0" stroke="#6a5030" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M38 100C22 100 4 106 8 122 16 130 34 118 40 104Z" fill="#c4aa84" stroke="#6a5030" stroke-width="2.2" stroke-linejoin="round"/>
       <circle cx="10" cy="78" r="6" fill="#fff" stroke="#6a5030" stroke-width="1.6"/><circle cx="10" cy="78" r="2.8" fill="#2a1a10"/>
       <circle cx="19" cy="116" r="4" fill="#fff" stroke="#6a5030" stroke-width="1.4"/><circle cx="19" cy="116" r="1.8" fill="#2a1a10"/>`],
    ["phantom", "Phantom Wings", "Barely there. Fades in and out of the world.", 460, 3,
      `<g class="gx-gh"><path d="M38 92C22 66 0 58 -14 66 -6 72 -8 80 -14 86 -6 88 -2 94 -6 102 4 100 8 106 6 114 16 110 24 108 38 102Z" fill="#cfd6ff" fill-opacity=".5" stroke="#9fb3ff" stroke-width="2" stroke-dasharray="5 3" stroke-linejoin="round"/>
       <path d="M34 94C20 82 6 74 -6 72M34 98C20 94 6 92 -4 96" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/></g>`],
    ["dragon", "Dragon Wings", "Ember-veined, spined and a little bit smug.", 600, 4,
      `<path d="M38 94 -18 34Q-26 54 -22 72 -14 66 -12 76 -14 94 -12 102 -4 94 2 104 0 114 8 118 22 112 38 104Z" fill="#7a1230" stroke="#2a0510" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M10 64 -22 72M10 64 -12 102M10 64 8 118" stroke="#2a0510" stroke-width="2.6" fill="none" stroke-linecap="round"/>
       <path class="gx-pu" d="M10 64 -22 72M10 64 -12 102M10 64 8 118M38 96 12 68" stroke="#ff7a2e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
       <path d="M38 94 -18 34" stroke="#2a0510" stroke-width="4.4" stroke-linecap="round"/><path d="M38 94 -18 34" stroke="#5a1a2a" stroke-width="1.6" stroke-linecap="round"/>
       <path d="M-18 34 -26 28 -20 40Z" fill="#e9dcc8" stroke="#2a0510" stroke-width="1.4" stroke-linejoin="round"/>
       <g fill="#ff9a2e"><circle class="gx-rs" cx="-8" cy="58" r="2" style="--dx:-6px"/><circle class="gx-rs gx-b" cx="-4" cy="90" r="1.8" style="--dx:-8px"/><circle class="gx-rs gx-c" cx="4" cy="108" r="2" style="--dx:-4px"/></g>`],
    ["crystal", "Crystal Wings", "Shards of colored glass. Sparkles on every flap.", 750, 4,
      `<path d="M38 92 -2 46 16 84Z" fill="#7ae8ff" stroke="#2a5a8a" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M38 96 -16 70 14 94Z" fill="#b58aff" stroke="#3a2260" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M38 100 -12 102 20 106Z" fill="#ff9ad8" stroke="#7a2a6a" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M38 104 2 128 24 110Z" fill="#8fffd0" stroke="#1f6a4a" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M30 88 4 58M30 94 -4 76M30 101 0 103" stroke="#fff" stroke-width="1.4" opacity=".75" fill="none"/>` +
      spark(-2, 46, 1.2, "#fff", "") + spark(-14, 70, 1, "#fff", "b") + spark(2, 126, 1, "#fff", "c")],
    ["phoenix", "Phoenix Wings", "Flame-feathered. Rises again every run.", 950, 4,
      feather(-62, 62, "#e8143f", "") + feather(-34, 66, "#e8143f", "b") + feather(-6, 62, "#e8143f", "c") + feather(22, 54, "#e8143f", "b") +
      feather(-56, 46, "#ff8a1e", "c") + feather(-28, 50, "#ff8a1e", "") + feather(0, 46, "#ff8a1e", "b") + feather(26, 38, "#ff8a1e", "c") +
      feather(-50, 28, "#ffe27a", "") + feather(-20, 30, "#ffe27a", "c") + feather(8, 26, "#ffe27a", "b") +
      `<g fill="#ffb84a"><circle class="gx-rs" cx="-10" cy="62" r="2" style="--dx:-4px"/><circle class="gx-rs gx-b" cx="-14" cy="92" r="1.8" style="--dx:-8px"/><circle class="gx-rs gx-c" cx="-4" cy="116" r="2" style="--dx:-6px"/></g>`]
  ];

  /* ---------- neckwear (around y=100-125) ---------- */
  const pearls = (() => {
    let s = "";
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, u = 1 - t;
      const x = u * u * 46 + 2 * u * t * 70 + t * t * 94, y = u * u * 106 + 2 * u * t * 128 + t * t * 106;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.8" fill="#fff" stroke="#b8b4d8" stroke-width="1.4"/>`;
    }
    return s;
  })();

  const chain = (() => {
    let g = "";
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t;
      const x = u * u * 46 + 2 * u * t * 70 + t * t * 94, y = u * u * 106 + 2 * u * t * 126 + t * t * 106;
      g += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${i % 2 ? 3 : 4.4}" ry="${i % 2 ? 4.4 : 3}" fill="none" stroke="#ffd95a" stroke-width="2.2"/>`;
    }
    return g;
  })();
  const spikes = (() => {
    let g = "";
    [[48, 107], [59, 111], [70, 113], [81, 111], [92, 107]].forEach(([x, y]) => { g += `<path d="M${x - 3.6} ${y + 1} ${x} ${y - 9} ${x + 3.6} ${y + 1}Z" fill="#d8dbe6" stroke="#4a4d5e" stroke-width="1.4" stroke-linejoin="round"/>`; });
    return g;
  })();
  const NECK = [
    ["bow", "Bow Tie", "A little red bow, perfectly straight.", 50, 0,
      `<path d="M70 112 52 102Q47 112 52 122Z" fill="#e8143f" stroke="#5a0a1e" stroke-width="2" stroke-linejoin="round"/>
       <path d="M70 112 88 102Q93 112 88 122Z" fill="#e8143f" stroke="#5a0a1e" stroke-width="2" stroke-linejoin="round"/>
       <rect x="64" y="106" width="12" height="12" rx="3" fill="#b3123a" stroke="#5a0a1e" stroke-width="2"/>`],
    ["bell", "Bell Collar", "Jingles when it floats. Ruins every ambush.", 90, 0,
      `<path d="M44 106Q70 122 96 106" fill="none" stroke="#e8143f" stroke-width="7" stroke-linecap="round"/>
       <path d="M44 106Q70 122 96 106" fill="none" stroke="#5a0a1e" stroke-width="1.6" stroke-dasharray="2 5"/>
       <circle cx="70" cy="123" r="7" fill="#ffd95a" stroke="#8a5a00" stroke-width="2"/>
       <path d="M64 124H76" stroke="#8a5a00" stroke-width="1.6"/><circle cx="70" cy="127" r="1.6" fill="#8a5a00"/>`],
    ["scarf", "Cozy Scarf", "Striped, wool and long enough to trip on.", 140, 1,
      `<path d="M84 120 94 150 80 152 74 126Z" fill="#4a9d6a" stroke="#1f4a30" stroke-width="2" stroke-linejoin="round"/>
       <path d="M42 104Q70 124 98 104L100 117Q70 137 40 117Z" fill="#4a9d6a" stroke="#1f4a30" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M50 111 49 122M62 117 61 128M78 117 79 128M90 111 91 122" stroke="#f4f1ea" stroke-width="3" stroke-linecap="round"/>`],
    ["ninja", "Ninja Scarf", "Silent, swift and fluttering behind you.", 170, 1,
      `<path d="M42 104Q70 122 98 104L99 116Q70 134 41 116Z" fill="#c92a2a" stroke="#5a0a0a" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M48 108 47 119M60 114 59 125M80 114 81 125M92 108 93 119" stroke="#8a1414" stroke-width="2" stroke-linecap="round"/>
       <g class="gx-sw gx-l"><path d="M92 112 118 118 110 124 122 134 96 126Z" fill="#c92a2a" stroke="#5a0a0a" stroke-width="2" stroke-linejoin="round"/></g>
       <circle cx="93" cy="113" r="4.4" fill="#a31f1f" stroke="#5a0a0a" stroke-width="2"/>`],
    ["spiked", "Spiked Collar", "Looks dangerous. Mostly just loud.", 150, 1,
      `<path d="M42 104Q70 120 98 104L98 113Q70 129 42 113Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round"/>` + spikes],
    ["chain", "Gold Chain", "Heavy links and a diamond that catches every light.", 290, 2,
      chain + `<path d="M70 126 77 134 70 144 63 134Z" fill="#8fe8ff" stroke="#2a5a8a" stroke-width="1.8" stroke-linejoin="round"/><path d="M66 134H74M70 126V144" stroke="#fff" stroke-width="1" opacity=".8"/>` +
      spark(70, 133, 1.1, "#fff", "") + spark(52, 112, .8, "#fff6c2", "b")],
    ["pearls", "Pearl Necklace", "A string of moonlit pearls.", 260, 2, pearls],
    ["medal", "Gold Medal", "For services to the afterlife.", 320, 2,
      `<path d="M56 100 70 120 84 100 84 111 70 131 56 111Z" fill="#3a6bff" stroke="#1f2f8a" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="70" cy="130" r="9" fill="#ffd95a" stroke="#8a5a00" stroke-width="2.2"/>
       <path d="M70 124 72 129 77 129.4 73 132.4 74.4 137 70 134.4 65.6 137 67 132.4 63 129.4 68 129Z" fill="#fff3b0" stroke="#8a5a00" stroke-width="1"/>`],
    ["amulet", "Rune Amulet", "Hums when a typo is near.", 440, 3,
      `<path d="M46 104Q70 118 94 104" stroke="#6b4a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <circle class="gx-pu" cx="70" cy="124" r="14" fill="#b58aff" opacity=".5"/>
       <path d="M70 112 80 124 70 136 60 124Z" fill="#2a1f4a" stroke="#b58aff" stroke-width="2" stroke-linejoin="round"/>
       <path class="gx-pu gx-b" d="M70 117V131M64 122 70 126 76 122" stroke="#e6d2ff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`],
    ["lantern", "Soul Lantern", "A little light for a long night. Swings as you float.", 520, 3,
      `<path d="M46 106Q70 120 94 106" stroke="#8a5a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>
       <g class="gx-sg"><path d="M70 114V121" stroke="#8a5a00" stroke-width="2"/>
       <circle class="gx-pu" cx="70" cy="134" r="17" fill="#ffd95a" opacity=".4"/>
       <path d="M63 122H77L75 126H65Z" fill="#8a5a00" stroke="#4a3000" stroke-width="1.4" stroke-linejoin="round"/>
       <path d="M64 126H76V139C76 142 73 144 70 144 67 144 64 142 64 139Z" fill="#ffe9a0" stroke="#8a5a00" stroke-width="1.8" stroke-linejoin="round"/>` +
      flame(70, 139, .7, "#ff9a2e", "") + `<path d="M64 130H76" stroke="#8a5a00" stroke-width="1.2"/></g>`],
    ["cape", "Count's Cape", "A real cape. Billows behind you, collar up.", 450, 3,
      `<path d="M36 106 24 70 54 100ZM104 106 116 70 86 100Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M38 103 31 82 51 99ZM102 103 109 82 89 99Z" fill="#b3123a"/>
       <path d="M45 108Q70 122 95 108L95 117Q70 131 45 117Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M70 113 75 119 70 127 65 119Z" fill="#e8143f" stroke="#0a0a0a" stroke-width="1.6"/>
       <path class="gx-pu" d="M70 113 75 119 70 127 65 119Z" fill="#ff8aa6" opacity=".7"/>`,
      `<g class="gx-sw"><path d="M32 100C12 124 6 150 2 172 22 166 38 174 56 168 72 174 88 166 106 172 124 166 128 124 108 100Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M40 106C24 128 20 148 16 164 32 160 44 166 58 162 72 168 84 160 98 166 114 160 118 128 100 106Z" fill="#b3123a" opacity=".85"/>
       <path d="M30 112C26 136 22 152 18 166M110 112C114 136 118 152 122 166" stroke="#0a0a0a" stroke-width="1.4" fill="none" opacity=".6"/></g>`],
    ["flame", "Flame Scarf", "Warm, loud and technically on fire.", 800, 4,
      `<path d="M84 120 94 142 80 144 74 126Z" fill="#e8143f" stroke="#7a1a00" stroke-width="2" stroke-linejoin="round"/>
       <path d="M42 104Q70 124 98 104L100 117Q70 137 40 117Z" fill="#ff7a1e" stroke="#7a1a00" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M50 111 49 122M62 117 61 128M78 117 79 128M90 111 91 122" stroke="#ffe27a" stroke-width="3" stroke-linecap="round"/>` +
      flame(80, 148, 1.2, "#ff8a1e", "") + flame(90, 146, 1, "#ffe27a", "b") + flame(86, 150, .8, "#e8143f", "c") + flame(48, 106, .8, "#ff8a1e", "b") + flame(92, 104, .8, "#ffe27a", "") + flame(70, 120, .7, "#ffe27a", "c")],
    ["mantle", "Royal Mantle", "A full velvet train, ermine trim and a jeweled clasp.", 850, 4,
      `<path d="M30 104Q70 134 110 104L116 128Q70 160 24 128Z" fill="#b3123a" stroke="#5a0a1e" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M34 106Q70 138 106 106L108 119Q70 150 32 119Z" fill="#fff7ef" stroke="#c9b8a8" stroke-width="1.6" stroke-linejoin="round"/>
       <g fill="#14101f"><path d="M46 118 48 124 50 118Z"/><path d="M60 126 62 132 64 126Z"/><path d="M76 126 78 132 80 126Z"/><path d="M90 118 92 124 94 118Z"/></g>
       <path d="M62 120Q70 128 78 120" stroke="#ffd95a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <circle cx="70" cy="124" r="5" fill="#e8143f" stroke="#8a5a00" stroke-width="2"/><circle cx="68.6" cy="122.6" r="1.4" fill="#fff"/>` +
      spark(70, 124, 1.3, "#fff6c2", "") + spark(40, 112, .8, "#ffd95a", "b") + spark(100, 112, .8, "#ffd95a", "c"),
      `<g class="gx-sw"><path d="M28 100C4 126 -4 154 -8 180 24 172 48 180 70 174 92 180 116 172 148 180 144 154 136 126 112 100Z" fill="#b3123a" stroke="#5a0a1e" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M-8 172Q24 164 48 172 70 166 92 172 116 164 148 172L148 182Q116 174 92 182 70 176 48 182 24 174 -8 182Z" fill="#fff7ef" stroke="#c9b8a8" stroke-width="1.8" stroke-linejoin="round"/>
       <g fill="#14101f"><path d="M12 172 14 180 16 172Z"/><path d="M36 174 38 182 40 174Z"/><path d="M62 172 64 180 66 172Z"/><path d="M88 174 90 182 92 174Z"/><path d="M114 172 116 180 118 172Z"/><path d="M134 172 136 180 138 172Z"/></g>
       <path d="M24 112C18 136 12 156 8 170M116 112C122 136 128 156 132 170" stroke="#5a0a1e" stroke-width="1.4" fill="none" opacity=".6"/></g>`]
  ];

  /* ---------- face items: eyes are at (52,66) and (88,66), mouth at (70,96) ---------- */
  const heart = (x, y) => `<g transform="translate(${x} ${y}) scale(1.05)"><path d="M0 7C-15 -4-15 -17-7 -17-2.5 -17 0 -14 0 -11 0 -14 2.5 -17 7 -17 15 -17 15 -4 0 7Z" fill="#ff4f8a" stroke="#8a1f4d" stroke-width="2" stroke-linejoin="round"/><path d="M-9 -12Q-6 -15-3 -13" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
  const FACE = [
    ["glasses", "Round Glasses", "Thin wire frames. Scholarly, for a ghost.", 80, 0,
      `<circle cx="52" cy="66" r="15" fill="#fff" fill-opacity=".14" stroke="#2a2540" stroke-width="3"/>
       <circle cx="88" cy="66" r="15" fill="#fff" fill-opacity=".14" stroke="#2a2540" stroke-width="3"/>
       <path d="M67 64Q70 61 73 64M37 62 29 58M103 62 111 58" stroke="#2a2540" stroke-width="3" fill="none" stroke-linecap="round"/>`],
    ["shades", "Sunglasses", "Too cool to haunt.", 150, 1,
      `<g fill="#0a0a0a" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"><rect x="36" y="54" width="32" height="22" rx="8"/><rect x="72" y="54" width="32" height="22" rx="8"/></g>
       <path d="M68 62H72M36 60 28 56M104 60 112 56" stroke="#0a0a0a" stroke-width="3" stroke-linecap="round"/>
       <path d="M42 59H50M78 59H86" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`],
    ["monocle", "Monocle", "One lens, one chain, endless opinions.", 130, 1,
      `<circle cx="88" cy="66" r="15" fill="#fff" fill-opacity=".14" stroke="#d9a21f" stroke-width="3"/>
       <path d="M100 77C111 91 109 109 101 119" stroke="#d9a21f" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-dasharray="3 2"/>`],
    ["patch", "Pirate Patch", "Lost the eye in the Great Haunting.", 170, 1,
      `<path d="M28 50 112 78" stroke="#14101f" stroke-width="3"/>
       <ellipse cx="52" cy="66" rx="13" ry="14" fill="#14101f" stroke="#0a0a0a" stroke-width="2"/>`],
    ["fangs", "Little Fangs", "Two small, polite fangs.", 220, 2,
      `<path d="M64 92 66.5 100 69 92ZM71 92 73.5 100 76 92Z" fill="#fff" stroke="#2c2447" stroke-width="1.4" stroke-linejoin="round"/>`],
    ["stache", "Handlebar Stache", "Waxed, curled and quite serious.", 200, 2,
      `<path d="M70 85C62 81 52 83 46 89 43 93 47 96 52 94 58 92 64 92 70 94 76 92 82 92 88 94 93 96 97 93 94 89 88 83 78 81 70 85Z" fill="#2a2540" stroke="#0a0a14" stroke-width="1.6" stroke-linejoin="round"/>`],
    ["heartshades", "Heart Shades", "Love at first haunt.", 300, 2,
      heart(52, 67) + heart(88, 67) + `<path d="M67 62Q70 59 73 62" stroke="#8a1f4d" stroke-width="2.4" fill="none" stroke-linecap="round"/>`],
    ["whiskers", "Cat Whiskers", "Drawn on with a very small crayon.", 50, 0,
      `<path d="M32 82 10 77M32 87 8 88M33 92 12 99M108 82 130 77M108 87 132 88M107 92 128 99" stroke="#2a2540" stroke-width="1.8" fill="none" stroke-linecap="round"/>`],
    ["third", "Third Eye", "Sees every typo before you do.", 380, 3,
      `<circle class="gx-pu" cx="70" cy="46" r="11" fill="#e8143f" opacity=".35"/>
       <path d="M58 46Q70 36 82 46 70 56 58 46Z" fill="#fff" stroke="#2a2540" stroke-width="2.2" stroke-linejoin="round"/>
       <circle cx="70" cy="46" r="5" fill="#e8143f" stroke="#5a0a1e" stroke-width="1.4"/><circle cx="70" cy="46" r="2" fill="#1a1630"/><circle cx="68.4" cy="44.4" r="1.2" fill="#fff"/>`],
    ["stars", "Star Eyes", "Starstruck by every single word.", 420, 3,
      `<g transform="translate(52 66)"><path class="gx-tw" d="M0 -14 4 -4.5 14 -4 6.2 2 8.6 12 0 6.4 -8.6 12 -6.2 2 -14 -4 -4 -4.5Z" fill="#ffe27a" stroke="#8a5a00" stroke-width="1.8" stroke-linejoin="round"/></g>
       <g transform="translate(88 66)"><path class="gx-tw gx-b" d="M0 -14 4 -4.5 14 -4 6.2 2 8.6 12 0 6.4 -8.6 12 -6.2 2 -14 -4 -4 -4.5Z" fill="#ffe27a" stroke="#8a5a00" stroke-width="1.8" stroke-linejoin="round"/></g>
       <circle cx="48" cy="62" r="2.4" fill="#fff"/><circle cx="84" cy="62" r="2.4" fill="#fff"/>` + spark(36, 52, .9, "#fff6c2", "c") + spark(104, 54, .9, "#fff6c2", "")],
    ["visor", "Cyber Visor", "Scans for typos in real time. Never stops.", 600, 3,
      `<rect x="32" y="55" width="76" height="22" rx="11" fill="#0e2a3a" stroke="#38e6ff" stroke-width="2.4"/>
       <rect class="gx-pu" x="36" y="58" width="68" height="16" rx="8" fill="#38e6ff" opacity=".18"/>
       <path d="M42 62H60M42 70H52M98 62H86M98 70H90" stroke="#38e6ff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
       <circle cx="52" cy="66" r="5.4" fill="none" stroke="#38e6ff" stroke-width="1.6" stroke-dasharray="3 2.4"/><circle cx="88" cy="66" r="5.4" fill="none" stroke="#38e6ff" stroke-width="1.6" stroke-dasharray="3 2.4"/>
       <circle cx="52" cy="66" r="1.6" fill="#ff4a6a"/><circle cx="88" cy="66" r="1.6" fill="#ff4a6a"/>
       <rect class="gx-sc" x="40" y="57" width="4" height="18" rx="2" fill="#aef6ff" opacity=".85"/>
       <path d="M32 66 24 62M108 66 116 62M104 57 114 46" stroke="#38e6ff" stroke-width="3" stroke-linecap="round"/>
       <circle class="gx-pu gx-b" cx="114" cy="46" r="3" fill="#ff4a6a"/>`],
    ["laser", "Laser Eyes", "Do not look directly. Do not blink either.", 800, 4,
      `<path class="gx-bm" d="M42 66H6" stroke="#ff2a4a" stroke-width="7" stroke-linecap="round" opacity=".45"/><path class="gx-bm" d="M98 66H134" stroke="#ff2a4a" stroke-width="7" stroke-linecap="round" opacity=".45"/>
       <path class="gx-bm gx-b" d="M42 66H8" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path class="gx-bm gx-b" d="M98 66H132" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
       <circle class="gx-pu" cx="52" cy="66" r="12" fill="#ff2a4a" opacity=".5"/><circle class="gx-pu" cx="88" cy="66" r="12" fill="#ff2a4a" opacity=".5"/>
       <ellipse cx="52" cy="66" rx="8" ry="10.5" fill="#ff2a4a" stroke="#5a0a1e" stroke-width="1.6"/><ellipse cx="88" cy="66" rx="8" ry="10.5" fill="#ff2a4a" stroke="#5a0a1e" stroke-width="1.6"/>
       <ellipse cx="52" cy="66" rx="3.4" ry="5" fill="#fff"/><ellipse cx="88" cy="66" rx="3.4" ry="5" fill="#fff"/>`]
  ];

  /* ---------- body colors: [top, mid, bottom, outline, aura glow, eye color] ---------- */
  const TINT0 = ["#fbf9ff", "#e3e6ff", "#a9b4f2", "#2c2447", "#9fb3ff", "#1a1630"];
  const TINTS = [
    ["rose", "Rose Mist", "A blush of pink.", 60, 0, ["#fff5f8", "#ffd6e4", "#f2a0bd", "#5a2a3f", "#ff9fc0", "#1a1630"]],
    ["mint", "Mint Wisp", "Cool, fresh and faintly minty.", 60, 0, ["#f4fffa", "#cff7e3", "#8fd9b5", "#1f4a38", "#8fffd0", "#1a1630"]],
    ["lemon", "Lemon Glow", "Sunshine in ghost form.", 90, 1, ["#fffdf0", "#fff0b0", "#e8cf6a", "#5a4a12", "#ffe27a", "#1a1630"]],
    ["sky", "Sky Spirit", "Clear daytime blue.", 90, 1, ["#f2fbff", "#c8ecff", "#85c4ee", "#1f3f5a", "#8fd8ff", "#1a1630"]],
    ["lilac", "Lilac Haze", "A dreamy violet.", 140, 1, ["#fbf6ff", "#e6d2ff", "#b58aee", "#3a2260", "#c9a0ff", "#1a1630"]],
    ["shadow", "Shadow", "A ghost made of night. Glowing eyes.", 300, 2, ["#6a6a86", "#3a3a52", "#1a1a2a", "#05050c", "#7a7aff", "#ffdf5a"]],
    ["blood", "Blood Moon", "Crimson from crown to tail.", 420, 3, ["#ffe6ea", "#ff8fa3", "#c01a3a", "#3a0716", "#ff4a6a", "#1a1630"]],
    ["aurora", "Aurora", "Shifting northern lights, trapped in a ghost.", 520, 3, ["#f2fff8", "#9ff2d8", "#7a8cff", "#1f2a5a", "#6affd8", "#1a1630"], "hue"],
    ["gold", "Gilded", "Real polished gold. Gleams as it moves.", 800, 4, ["#fff1a0", "#f2b01e", "#9a5a08", "#3d2300", "#ffb300", "#2a1800"], "gold"],
    ["cosmic", "Starfield", "A night sky wearing a ghost. The stars twinkle.", 900, 4, ["#6a5ac0", "#2e2478", "#0e0a2a", "#05030f", "#9a7aff", "#fff2a8"], "cosmic"]
  ];

  const ITEMS = { hat: HATS, wing: WINGS, neck: NECK, face: FACE, tint: TINTS };
  /* viewBox for each slot's shop preview (zoomed on the part that changes) */
  const VB = { hat: "0 -32 140 104", wing: "-30 24 200 118", neck: "-14 48 168 136", face: "24 38 92 76", tint: "-14 -12 168 178" };

  const find = (slot, id) => (id ? ITEMS[slot].find(v => v[0] === id) || null : null);


  /* extra shine drawn over the body for effect body colors (clipped to the body shape) */
  const bodyFx = (fx, uid) => {
    if (fx === "gold")
      return `<path d="M38 60C40 44 52 35 66 33" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/>` +
        `<path d="M40 96C48 108 58 116 70 118" stroke="#fff3b0" stroke-width="3" opacity=".45" fill="none" stroke-linecap="round"/>` +
        `<g clip-path="url(#gcp${uid})"><g class="gx-sh"><rect x="14" y="20" width="16" height="150" fill="#fff" opacity=".6" transform="skewX(-18)"/><rect x="36" y="20" width="6" height="150" fill="#fff" opacity=".4" transform="skewX(-18)"/></g></g>` +
        spark(50, 52, 1, "#fff", "") + spark(102, 70, .9, "#fff", "b") + spark(84, 118, .8, "#fff6c2", "c");
    if (fx === "cosmic")
      return spark(48, 52, .9, "#fff", "") + spark(96, 60, .7, "#cfd6ff", "b") + spark(62, 104, .8, "#ffe27a", "c") + spark(100, 100, .7, "#fff", "") + spark(40, 84, .6, "#9fb3ff", "b") +
        `<g fill="#fff" opacity=".8"><circle cx="82" cy="46" r="1.2"/><circle cx="110" cy="84" r="1.1"/><circle cx="56" cy="118" r="1.1"/><circle cx="74" cy="132" r="1"/></g>`;
    return "";
  };

  function build(eq, uid, vb) {
    eq = eq || {};
    uid = uid || "m";
    const tn = find("tint", eq.tint), T = (tn || [0, 0, 0, 0, 0, TINT0])[5], fx = (tn && tn[6]) || "";
    const wing = find("wing", eq.wing), neck = find("neck", eq.neck), face = find("face", eq.face), hat = find("hat", eq.hat);
    return `<svg viewBox="${vb || "0 0 140 160"}" overflow="visible"><defs>` +
      `<linearGradient id="gbd${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T[0]}"/><stop offset=".55" stop-color="${T[1]}"/><stop offset="1" stop-color="${T[2]}"/></linearGradient>` +
      `<clipPath id="gcp${uid}"><path d="${BODY}"/></clipPath><radialGradient id="gaura${uid}"><stop offset="0" stop-color="${T[4]}" stop-opacity=".42"/><stop offset="1" stop-color="${T[4]}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse class="au" cx="70" cy="86" rx="72" ry="78" fill="url(#gaura${uid})"/>` +
      (wing ? `<g class="wl">${wing[5]}</g><g class="wr"><g transform="translate(140 0) scale(-1 1)">${wing[5]}</g></g>` : "") +
      (neck && neck[6] ? neck[6] : "") +
      /* plain ghost body: round head flowing into a curled tail */
      `<g class="tl"><path${fx === "hue" ? ' class="gx-hue"' : ""} d="${BODY}" fill="url(#gbd${uid})" stroke="${T[3]}" stroke-width="2.6" stroke-linejoin="round"/>${bodyFx(fx, uid)}</g>` +
      (neck ? `<g class="nk">${neck[5]}</g>` : "") +
      `<ellipse class="hl" cx="26" cy="86" rx="8" ry="6.5" fill="${T[0]}" stroke="${T[3]}" stroke-width="2.2"/><ellipse class="hr" cx="114" cy="86" rx="8" ry="6.5" fill="${T[0]}" stroke="${T[3]}" stroke-width="2.2"/>` +
      `<ellipse cx="45" cy="80" rx="8" ry="4.6" fill="#ff8aa6" opacity=".6"/><ellipse cx="95" cy="80" rx="8" ry="4.6" fill="#ff8aa6" opacity=".6"/>` +
      `<g class="ey"><ellipse cx="52" cy="66" rx="8" ry="10.5" fill="${T[5]}"/><ellipse cx="88" cy="66" rx="8" ry="10.5" fill="${T[5]}"/>` +
      `<circle cx="49.5" cy="62" r="2.8" fill="#fff"/><circle cx="85.5" cy="62" r="2.8" fill="#fff"/></g>` +
      `<g class="mo"><ellipse cx="70" cy="96" rx="6" ry="4.5" fill="#3a0716" stroke="${T[3]}" stroke-width="1.8"/></g>` +
      (face ? `<g class="fc">${face[5]}</g>` : "") +
      (hat ? `<g class="ht">${hat[5]}</g>` : "") +
      "</svg>";
  }

  window.GHOST_WEAR = { SLOT, ITEMS, VB, worn, build };
})();
