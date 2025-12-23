/* bgm.js — GLOBAL sound controller + resume time across pages */
(() => {
  const STORAGE_KEY = "mb_sound";        // "on" | "off"
  const TIME_KEY = "mb_bgm_time";        // seconds (string)
  const ICON_MUTE = "Assets/page1/mute.png";
  const ICON_UNMUTE = "Assets/page1/unmute.png";
  const BGM_SRC = "Assets/page1/bgm.mp3";

  let audio = null;
  let saveTimer = null;

  function resolveUrl(path) {
    try { return new URL(path, document.baseURI).href; }
    catch { return path; }
  }

  function getState() {
    try { return localStorage.getItem(STORAGE_KEY) || "off"; }
    catch { return "off"; }
  }

  function setState(state) {
    try { localStorage.setItem(STORAGE_KEY, state); } catch {}
  }

  function getSavedTime() {
    try {
      const raw = localStorage.getItem(TIME_KEY);
      const t = raw == null ? 0 : Number(raw);
      return Number.isFinite(t) && t >= 0 ? t : 0;
    } catch {
      return 0;
    }
  }

  function saveTimeNow() {
    if (!audio) return;
    // prevent storing NaN/Infinity
    const t = Number(audio.currentTime);
    if (!Number.isFinite(t) || t < 0) return;
    try { localStorage.setItem(TIME_KEY, String(t)); } catch {}
  }

  function ensureAudio() {
    if (audio) return audio;

    audio = new Audio(resolveUrl(BGM_SRC));
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 1;

    // try restore time when metadata is available
    const saved = getSavedTime();
    if (saved > 0) {
      audio.addEventListener("loadedmetadata", () => {
        try {
          // if duration known, clamp
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = Math.min(saved, Math.max(0, audio.duration - 0.25));
          } else {
            audio.currentTime = saved;
          }
        } catch {}
      }, { once: true });
    }

    // keep saving while playing
    audio.addEventListener("play", () => {
      if (saveTimer) clearInterval(saveTimer);
      saveTimer = setInterval(saveTimeNow, 700);
    });

    audio.addEventListener("pause", () => {
      saveTimeNow();
      if (saveTimer) {
        clearInterval(saveTimer);
        saveTimer = null;
      }
    });

    // also save sometimes naturally
    audio.addEventListener("timeupdate", () => {
      // light touch: don't write too often here
      // (interval handles most of it)
    });

    return audio;
  }

  function applyDefaultButtonStyle(btn) {
    // Only to prevent "button invisible" cases.
    btn.style.width = btn.style.width || "76px";
    btn.style.height = btn.style.height || "76px";
    btn.style.border = btn.style.border || "none";
    btn.style.backgroundColor = btn.style.backgroundColor || "transparent";
    btn.style.backgroundRepeat = "no-repeat";
    btn.style.backgroundSize = "contain";
    btn.style.backgroundPosition = "center";
    btn.style.cursor = "pointer";
    btn.style.pointerEvents = "auto";
    btn.style.zIndex = btn.style.zIndex || "99999";

    const stage = btn.closest?.(".stage");
    const computed = window.getComputedStyle(btn);
    if (computed.position === "static") {
      if (stage) {
        btn.style.position = "absolute";
        btn.style.top = "14px";
        btn.style.right = "18px";
      } else {
        btn.style.position = "fixed";
        btn.style.top = "14px";
        btn.style.right = "18px";
      }
    }
  }

  function setIcon(btn, isOn) {
    const url = isOn ? resolveUrl(ICON_UNMUTE) : resolveUrl(ICON_MUTE);
    if (btn.tagName === "IMG") btn.src = url;
    else btn.style.backgroundImage = `url("${url}")`;
  }

  async function play() {
    const a = ensureAudio();

    // restore time (best effort) just before play
    const saved = getSavedTime();
    if (saved > 0 && Number.isFinite(a.currentTime) && a.currentTime < 0.05) {
      try { a.currentTime = saved; } catch {}
    }

    try {
      await a.play();
      return true;
    } catch (err) {
      console.warn("[BGM] play() blocked or failed:", err);
      return false;
    }
  }

  function stop() {
    if (!audio) return;
    audio.pause();
    // do NOT reset to 0; keep last time so it resumes
    saveTimeNow();
  }

  function wireSoundButton() {
    const btnSound = document.getElementById("btn-sound");
    const hitSound = document.getElementById("hit-sound"); // legacy optional
    const clickTarget = hitSound || btnSound;

    if (!btnSound) {
      console.warn("[BGM] Missing #btn-sound on this page.");
      return;
    }

    applyDefaultButtonStyle(btnSound);

    // initial UI state
    const state = getState();
    const isOn = state === "on";
    setIcon(btnSound, isOn);

    // If state ON, try continue (won't restart)
    if (isOn) play();
    else stop();

    clickTarget?.addEventListener("click", async (e) => {
      e.preventDefault();

      const current = getState();
      if (current === "on") {
        setState("off");
        stop();
        setIcon(btnSound, false);
      } else {
        setState("on");
        await play();           // continue from saved time
        setIcon(btnSound, true);
      }
    });

    // Save time on navigation/reload
    const saveAndCleanup = () => {
      saveTimeNow();
      // don't clear TIME_KEY; we want resume
      if (saveTimer) {
        clearInterval(saveTimer);
        saveTimer = null;
      }
    };

    window.addEventListener("pagehide", saveAndCleanup);
    window.addEventListener("beforeunload", saveAndCleanup);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveTimeNow();
    });
  }

  document.addEventListener("DOMContentLoaded", wireSoundButton);
})();
