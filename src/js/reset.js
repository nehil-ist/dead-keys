/* Reset progress: Settings -> Reset progress.
   Step 1: "are you sure?"  Step 2: type a phrase.  Then wipe saved progress and reload. */
const RP_PHRASE = "let the night take everything I have earned";

// Settings and tutorial flags survive a reset. Everything else under our prefixes is progress.
const RP_KEEP = new Set([
  "kotodama-set", "kotodama-cue", "kotodama-passist", "kotodama-mods",
  "kotodama-tutorial", "kotodama-tutorial-ask", "kotodama-maps", "typeaim-diff"
]);

function rpWipe() {
  try {
    Object.keys(localStorage)
      .filter(k => /^(deadkeys|kotodama|typeaim)-/.test(k) && !RP_KEEP.has(k))
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  // the unload hook would otherwise write the key stats straight back
  try { ksDirty = 0; } catch (e) {}
}

(function () {
  const root = typeof APP !== "undefined" ? APP : document.body;
  const el = document.createElement("div");
  el.id = "rp";
  el.innerHTML =
    '<div class="rb"><h3></h3><p></p><div class="ph" hidden></div>' +
    '<input type="text" hidden maxlength="80" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the phrase">' +
    '<div class="cr"><button class="go"></button><button class="no"></button></div><small></small></div>';
  root.appendChild(el);

  const q = s => el.querySelector(s);
  const h = q("h3"), p = q("p"), ph = q(".ph"), inp = q("input"),
        go = q(".go"), no = q(".no"), sm = q("small");

  let step = 0;   // 0 closed, 1 asking, 2 phrase, 3 done
  let sel = 1;    // step 1 keyboard selection: 0 = erase, 1 = stay (safe default)

  const matches = () => inp.value.trim().toLowerCase() === RP_PHRASE.toLowerCase();

  function paintSel() {
    go.classList.toggle("sel", sel === 0);
    no.classList.toggle("sel", sel === 1);
  }

  function paintPhrase() {
    const v = inp.value;
    let m = 0;
    while (m < v.length && m < RP_PHRASE.length && v[m].toLowerCase() === RP_PHRASE[m].toLowerCase()) m++;
    const bad = v.length > m && m < RP_PHRASE.length;
    ph.innerHTML = [...RP_PHRASE].map((c, i) =>
      '<i class="' + (i < m ? "ok" : i === m && bad ? "er" : "") + '">' + c + "</i>"
    ).join("");
    const ok = matches();
    go.disabled = !ok;
    inp.classList.toggle("good", ok);
  }

  function render() {
    go.classList.remove("sel"); no.classList.remove("sel");
    if (step === 1) {
      h.textContent = "Erase all progress?";
      p.textContent = "Souls, heroes, the skill tree, shop unlocks, the bestiary, records and achievements will be gone for good. Sound settings stay. This cannot be undone.";
      ph.hidden = true; inp.hidden = true;
      go.hidden = false; no.hidden = false; go.disabled = false;
      go.textContent = "Yes, erase it"; no.textContent = "Stay";
      sm.textContent = "\u2190 \u2192 choose \u00B7 ENTER confirm \u00B7 ESC stay";
      paintSel();
    } else if (step === 2) {
      h.textContent = "Say the words";
      p.textContent = "Type this phrase exactly to seal it. Pasting is disabled.";
      ph.hidden = false; inp.hidden = false; inp.value = "";
      go.textContent = "Erase everything"; no.textContent = "Cancel";
      sm.textContent = "TYPE IT OUT \u00B7 ENTER confirm \u00B7 ESC cancel";
      paintPhrase();
      setTimeout(() => { if (step === 2) inp.focus({ preventScroll: true }); }, 30);
    } else if (step === 3) {
      h.textContent = "It is done";
      p.textContent = "The night has taken everything. Restarting\u2026";
      ph.hidden = true; inp.hidden = true; go.hidden = true; no.hidden = true;
      sm.textContent = "";
    }
  }

  function close() {
    step = 0;
    el.classList.remove("on");
    inp.blur();
  }

  function next() { step = 2; render(); }

  function doReset() {
    if (step !== 2 || !matches()) return;
    step = 3; render();
    try { aInit(); sfx("bad"); } catch (e) {}
    rpWipe();
    // wipe again just before reload in case anything wrote in between
    setTimeout(() => { rpWipe(); location.reload(); }, 900);
  }

  window.rpOpen = function () {
    if (step) return;
    step = 1; sel = 1;
    render();
    el.classList.add("on");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  };

  // Buttons
  go.addEventListener("click", () => {
    go.blur();
    if (step === 1) next(); else if (step === 2) doReset();
  });
  no.addEventListener("click", () => { no.blur(); if (step === 1 || step === 2) close(); });
  no.addEventListener("mouseover", () => { if (step === 1) { sel = 1; paintSel(); } });
  go.addEventListener("mouseover", () => { if (step === 1) { sel = 0; paintSel(); } });

  // Phrase input: no pasting or dropping, so it has to be typed
  inp.addEventListener("input", paintPhrase);
  ["paste", "drop"].forEach(t => inp.addEventListener(t, e => e.preventDefault()));

  // Swallow every key while the dialog is up so the game underneath never sees it
  addEventListener("keydown", e => {
    if (!step) return;
    e.stopImmediatePropagation();
    const k = e.key;
    if (step === 3) { e.preventDefault(); return; }
    if (k === "Escape") { e.preventDefault(); if (!e.repeat) close(); return; }

    if (step === 1) {
      e.preventDefault();
      if (e.repeat) return;
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "Tab") { sel ^= 1; paintSel(); }
      else if (k === "Enter" || k === " ") { sel === 0 ? next() : close(); }
      return;
    }

    // step 2: let typing reach the input, only Enter is ours
    if (k === "Enter") { e.preventDefault(); if (!e.repeat && matches()) doReset(); return; }
    if (document.activeElement !== inp && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      inp.focus({ preventScroll: true });
    }
  }, true);
})();
