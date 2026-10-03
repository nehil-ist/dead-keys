/* Daily Run reset countdown.
   The daily seed changes at 00:00 UTC (dDate() in game.js is the UTC date), so the countdown targets the next
   UTC midnight and also shows that moment in the player's own clock. Every element with class "dly-t" ticks. */
(function () {
  const pad = n => String(n).padStart(2, "0");
  const next = () => { const d = new Date(); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); };
  const left = () => Math.max(0, next() - Date.now());
  const fmt = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600); return pad(h) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60); };
  const clock = () => { try { return new Date(next()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { return "00:00 UTC"; } };
  window.DLY = { left, fmt, clock, text: () => fmt(left()) };

  const css = document.createElement("style");
  css.textContent = `
#ovSub .dly-cd{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin:10px 0 4px;font:700 .78rem 'JetBrains Mono',monospace;letter-spacing:.14em;color:#a8a49b;text-transform:uppercase}
#ovSub .dly-cd b{font:800 1.05rem 'JetBrains Mono',monospace;letter-spacing:.12em;color:#e9e5dc}
#ovSub .dly-cd small{font:600 .66rem 'JetBrains Mono',monospace;letter-spacing:.12em;opacity:.7}
#ovSub .md-c.dn .dly-cd b{color:#6c74ff}
#ovSub .md-c.on:not(.dn) .dly-cd{color:#3a3834}
#ovSub .md-c.on:not(.dn) .dly-cd b{color:#0a0a0a}
#ovSub .md-c.on:not(.dn) .dly-cd small{opacity:.85}
#ovSub .md-c.dn .dly-cd{color:#b9bcff}
#tprw .dlyres b{font-variant-numeric:tabular-nums}
`;
  document.head.appendChild(css);

  const sub = document.getElementById("ovSub");
  const mark = () => {
    const card = sub && sub.querySelector('.md-c[data-k="daily"]');
    if (!card || card.querySelector(".dly-cd")) return;
    const b = card.querySelector(".md-b"), t = b && b.querySelector(".md-t");
    if (!b) return;
    const html = '<div class="dly-cd"><span>New seed in</span><b class="dly-t">' + DLY.text() + '</b><small>resets ' + DLY.clock() + ' your time</small></div>';
    t ? t.insertAdjacentHTML("beforebegin", html) : b.insertAdjacentHTML("beforeend", html);
    const go = b.querySelector(".md-go");
    if (go && card.classList.contains("dn")) go.textContent = "\u25A0 LOCKED UNTIL THE NEW SEED";
  };
  if (sub) new MutationObserver(mark).observe(sub, { childList: true });

  /* results screen of a daily run */
  const te = tpEnd;
  tpEnd = function () {
    const dly = !T.done && T.daily;
    const r = te.apply(this, arguments);
    if (dly) try {
      const w = document.getElementById("tprw");
      w && w.insertAdjacentHTML("beforeend", '<div class="soulres dlyres"><b>Next seed in <span class="dly-t">' + DLY.text() + '</span></b><span>Resets ' + DLY.clock() + ' your time</span></div>');
    } catch (e) {}
    return r;
  };

  let day = new Date().toISOString().slice(0, 10);
  setInterval(() => {
    const els = document.querySelectorAll(".dly-t");
    if (els.length) { const t = DLY.text(); els.forEach(e => { if (e.textContent !== t) e.textContent = t; }); }
    const d = new Date().toISOString().slice(0, 10);
    if (d !== day) {                         /* the seed rolled over while a screen was open */
      day = d;
      try { if (sub && sub.classList.contains("on")) subDraw(); } catch (e) {}
      try { if (!T.on) toast("A new Daily seed has arrived."); } catch (e) {}
    }
  }, 1000);
})();
