// rotate.js — Global "Rotate to Landscape" Gate (Web Game Style)
(function(){
  const OVERLAY_ID = "rotateOverlay";

  function ensureOverlay(){
    let el = document.getElementById(OVERLAY_ID);
    if (el) return el;

    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.innerHTML = `
      <div class="rotate-card" role="dialog" aria-modal="true" aria-label="Rotate device">
        <div class="phone"></div>
        <div class="arrow"><i></i></div>
        <div class="rotate-title">Rotate your device</div>
        <p class="rotate-sub">Please switch to <b>landscape</b> to continue.</p>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function isPortrait(){
    // paling stabil across browsers/webviews
    return window.innerHeight > window.innerWidth;
  }

  function setBlocked(block){
    const overlay = ensureOverlay();
    overlay.style.display = block ? "flex" : "none";

    // block scroll + gesture biar bener-bener "game tidak berfungsi"
    document.documentElement.style.overflow = block ? "hidden" : "";
    document.body.style.overflow = block ? "hidden" : "";
    document.body.style.touchAction = block ? "none" : "";

    // optional: stop double tap zoom effects on some devices
    if (block) {
      document.body.setAttribute("aria-hidden", "false");
    }
  }

  function sync(){
    setBlocked(isPortrait());
  }

  // Run and keep synced
  document.addEventListener("DOMContentLoaded", sync, { once:true });
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);

  // extra sync (kadang ukuran telat update)
  setTimeout(sync, 100);
  setTimeout(sync, 400);
})();
