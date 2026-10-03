/* Daily Run lock: once today's megaboss is slain the Daily Run stays closed until the next seed.
   The Modes screen already greyed the card out, but two other doors stayed open:
   the results screen's Again button / R key (DAILY was still 1) and any non-selected card click.
   Every launch path ends in mainAct (menus) or tpBegin (Again / R), so both are gated here. */
(function () {
  const done = () => { try { return !!localStorage.getItem("kotodama-daily-done-" + dDate()); } catch (e) { return false; } };
  const deny = () => {
    try { sfx("err"); } catch (e) { try { sfx("ui"); } catch (x) {} }
    try { toast("Daily cleared. New seed in " + (window.DLY ? DLY.text() : "tomorrow") + "."); } catch (e) {}
  };

  /* menus: Modes screen, main menu, any hotkey */
  const ma = mainAct;
  mainAct = function (i) {
    if (MAIN[i] && MAIN[i][0] === "daily" && done()) { deny(); return; }
    return ma.apply(this, arguments);
  };

  /* results screen: Again button, R key, Enter on Again */
  const tb = tpBegin;
  tpBegin = function () {
    if (DAILY && !RESUMING && done()) {
      if (T.done) { deny(); return; }   /* sitting on the results screen: stay there */
      DAILY = 0;                        /* never silently relaunch the daily */
    }
    const r = tb.apply(this, arguments);
    paintAgain();
    return r;
  };

  const again = document.getElementById("tpAgain");
  const AGAIN_HTML = again ? again.innerHTML : "";
  function paintAgain() {
    if (!again) return;
    const lock = !!(DAILY && T.done && done());
    again.classList.toggle("dlk", lock);
    again.style.opacity = lock ? ".5" : "";
    again.innerHTML = lock ? 'New seed in <span class="dly-t">' + DLY.text() + '</span>' : AGAIN_HTML;
  }
  if (again) {
    /* stop the click before it starts the screen wipe */
    again.addEventListener("click", e => {
      if (DAILY && T.done && done()) { e.stopImmediatePropagation(); deny(); }
    }, true);
  }
  const te = tpEnd;
  tpEnd = function () {
    const r = te.apply(this, arguments);
    try { paintAgain(); } catch (e) {}
    return r;
  };
})();
