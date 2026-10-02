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
  const worn = () => {
    const o = {};
    Object.keys(SLOT).forEach(k => {
      const id = META[SLOT[k].cur];
      o[k] = id && META[SLOT[k].own][id] ? id : "";
    });
    return o;
  };

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
       <circle cx="40" cy="6" r="3" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/><circle cx="70" cy="-2" r="3.4" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/><circle cx="100" cy="6" r="3" fill="#fff3b0" stroke="#8a5a00" stroke-width="1.4"/>`]
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
    ["dragon", "Dragon Wings", "Spined, scaled and a little bit smug.", 600, 4,
      `<path d="M38 94C26 70 10 52-6 46-2 56-2 64 4 70-4 70-10 74-14 80-6 82 0 86 2 92-6 94-10 100-10 108 2 104 14 106 22 112 28 104 34 100 40 100Z" fill="#2fae6a" stroke="#0e4a2a" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M36 96C24 84 10 70-2 62M34 100C20 96 6 90-6 84" stroke="#0e4a2a" stroke-width="1.6" fill="none"/>`]
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
    ["bandana", "Bandana", "Tied tight, polka-dotted and ready for trouble.", 170, 1,
      `<path d="M42 104Q70 120 98 104L70 140Z" fill="#c92a2a" stroke="#5a0a0a" stroke-width="2.2" stroke-linejoin="round"/>
       <g fill="#fff"><circle cx="58" cy="112" r="2"/><circle cx="82" cy="112" r="2"/><circle cx="70" cy="118" r="2"/><circle cx="70" cy="130" r="2"/></g>`],
    ["pearls", "Pearl Necklace", "A string of moonlit pearls.", 260, 2, pearls],
    ["medal", "Gold Medal", "For services to the afterlife.", 320, 2,
      `<path d="M56 100 70 120 84 100 84 111 70 131 56 111Z" fill="#3a6bff" stroke="#1f2f8a" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="70" cy="130" r="9" fill="#ffd95a" stroke="#8a5a00" stroke-width="2.2"/>
       <path d="M70 124 72 129 77 129.4 73 132.4 74.4 137 70 134.4 65.6 137 67 132.4 63 129.4 68 129Z" fill="#fff3b0" stroke="#8a5a00" stroke-width="1"/>`],
    ["cape", "Count's Cape", "A high gothic collar with a blood-red gem.", 450, 3,
      `<path d="M36 106 24 70 54 100ZM104 106 116 70 86 100Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M38 103 31 82 51 99ZM102 103 109 82 89 99Z" fill="#b3123a"/>
       <path d="M45 108Q70 122 95 108L95 117Q70 131 45 117Z" fill="#14101f" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M70 113 75 119 70 127 65 119Z" fill="#e8143f" stroke="#0a0a0a" stroke-width="1.6"/>`],
    ["mantle", "Royal Mantle", "Crimson velvet trimmed with ermine.", 850, 4,
      `<path d="M30 104Q70 134 110 104L116 128Q70 160 24 128Z" fill="#b3123a" stroke="#5a0a1e" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M34 106Q70 138 106 106L108 119Q70 150 32 119Z" fill="#fff7ef" stroke="#c9b8a8" stroke-width="1.6" stroke-linejoin="round"/>
       <g fill="#14101f"><path d="M46 118 48 124 50 118Z"/><path d="M60 126 62 132 64 126Z"/><path d="M76 126 78 132 80 126Z"/><path d="M90 118 92 124 94 118Z"/></g>
       <circle cx="70" cy="122" r="4.5" fill="#ffd95a" stroke="#8a5a00" stroke-width="1.6"/>`]
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
    ["visor", "Cyber Visor", "Scans for typos in real time.", 600, 3,
      `<rect x="32" y="55" width="76" height="22" rx="11" fill="#0e2a3a" stroke="#38e6ff" stroke-width="2.4"/>
       <rect x="42" y="64" width="56" height="4" rx="2" fill="#38e6ff" opacity=".9"/>
       <path d="M32 66 24 62M108 66 116 62" stroke="#38e6ff" stroke-width="3" stroke-linecap="round"/>`]
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
    ["gold", "Gilded", "Solid gold. Surprisingly light.", 800, 4, ["#fffbe0", "#ffe27a", "#d9a21f", "#6b4a00", "#ffd95a", "#1a1630"]]
  ];

  const ITEMS = { hat: HATS, wing: WINGS, neck: NECK, face: FACE, tint: TINTS };
  /* viewBox for each slot's shop preview (zoomed on the part that changes) */
  const VB = { hat: "0 -32 140 104", wing: "-26 36 192 112", neck: "10 50 120 104", face: "24 38 92 76", tint: "-14 -12 168 178" };

  const find = (slot, id) => (id ? ITEMS[slot].find(v => v[0] === id) || null : null);

  function build(eq, uid, vb) {
    eq = eq || {};
    uid = uid || "m";
    const T = (find("tint", eq.tint) || [0, 0, 0, 0, 0, TINT0])[5];
    const wing = find("wing", eq.wing), neck = find("neck", eq.neck), face = find("face", eq.face), hat = find("hat", eq.hat);
    return `<svg viewBox="${vb || "0 0 140 160"}" overflow="visible"><defs>` +
      `<linearGradient id="gbd${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T[0]}"/><stop offset=".55" stop-color="${T[1]}"/><stop offset="1" stop-color="${T[2]}"/></linearGradient>` +
      `<radialGradient id="gaura${uid}"><stop offset="0" stop-color="${T[4]}" stop-opacity=".42"/><stop offset="1" stop-color="${T[4]}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse class="au" cx="70" cy="86" rx="72" ry="78" fill="url(#gaura${uid})"/>` +
      (wing ? `<g class="wl">${wing[5]}</g><g class="wr"><g transform="translate(140 0) scale(-1 1)">${wing[5]}</g></g>` : "") +
      /* plain ghost body: round head flowing into a curled tail */
      `<g class="tl"><path d="M70 28C100 28 118 50 116 78 114 96 104 106 98 120 92 136 98 150 84 156 74 160 66 152 70 144 76 134 68 128 58 124 42 118 24 100 24 76 24 48 42 28 70 28Z" fill="url(#gbd${uid})" stroke="${T[3]}" stroke-width="2.6" stroke-linejoin="round"/></g>` +
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
