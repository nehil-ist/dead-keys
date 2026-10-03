/* Hover gate: a mouse that is sitting still must never select or preview anything.
   Browsers fire a synthetic "mouseover" whenever new UI appears under a resting cursor (leaving a run,
   opening the pause screen, changing menu screens...). Those ghost hovers used to steal the keyboard
   selection or play previews. Now a mouseover only counts after the mouse has really moved, and the gate
   closes again on every key press, click or scroll, so the cursor never has to be parked off-screen. */
(function () {
  let armed = false, lx = null, ly = null;
  const close = () => { armed = false; };
  /* a real move changes the pointer position; a ghost hover reports the position the mouse already had */
  const moved = e => lx !== null && Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) >= 2;
  const track = e => { lx = e.clientX; ly = e.clientY; };
  addEventListener("mousemove", e => { if (moved(e)) armed = true; track(e); }, true);
  addEventListener("keydown", close, true);
  addEventListener("mousedown", close, true);
  addEventListener("wheel", close, { capture: true, passive: true });
  addEventListener("mouseover", e => {
    if (moved(e)) armed = true;
    track(e);
    if (!armed) e.stopImmediatePropagation();
  }, true);
  window.addEventListener("blur", close);
})();
