// =====================
// Message Booth - Page 1 (2 LANE FIXED)
// =====================

const NEXT_PAGE_URL = "template.html";

// Assets
const WALKER_COLORS = [
  "Assets/page1/walker/walker1.png",
  "Assets/page1/walker/walker2.png",
  "Assets/page1/walker/walker3.png",
  "Assets/page1/walker/walker4.png",
  "Assets/page1/walker/walker5.png",
];

// 2 lane positions (px from bottom of stage)
const LANE_BACK = 100;
const LANE_FRONT = 28;

// how many walkers total
const NUM_WALKERS = 4;
const MIN_VISIBLE = 2;

// speeds (px/s)
const SPEED_BACK = 46;
const SPEED_FRONT = 60;

// sizes
const SIZE_BACK = 0.97;
const SIZE_FRONT = 1.27;

// Gerobak
const GEROBak_SRC = "Assets/page1/gerobak.png";
const GEROBak_MIN_INTERVAL_MS = 60_000;
const GEROBak_EXTRA_RANDOM_MS = 25_000;
const GEROBak_TRAVEL_MS = 26_000;

// DOM
const stage = document.getElementById("stage");
const boothImg = document.getElementById("booth-img");
const boothHit = document.getElementById("booth-hit");
const walkersLayer = document.getElementById("walkers-layer");
const fade = document.getElementById("fade");
const nightToggle = document.getElementById("night-toggle");

const igBtn = document.getElementById("btn-ig");
const soundBtn = document.getElementById("btn-sound");

// helpers
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// frame width matches CSS: width: calc(50vw - 520px)
function frameW() {
  return Math.max(0, (window.innerWidth / 2) - 520);
}

// ---------------- Night mode ----------------
function setNight(on){
  document.body.classList.toggle("night", on);
  if (nightToggle) nightToggle.textContent = on ? "☀️" : "🌙";
  try { localStorage.setItem("mb_night", on ? "1" : "0"); } catch {}
}

let nightOn = false;
try { nightOn = localStorage.getItem("mb_night") === "1"; } catch {}
setNight(nightOn);

if (nightToggle){
  nightToggle.addEventListener("click", () => {
    nightOn = !nightOn;
    setNight(nightOn);
  });
}

// ---------------- Booth interactions ----------------
if (boothHit && boothImg){
  boothHit.addEventListener("mouseenter", () => boothImg.classList.add("is-dim", "is-bounce"));
  boothHit.addEventListener("mouseleave", () => boothImg.classList.remove("is-dim", "is-bounce"));
  boothHit.addEventListener("mousedown", () => boothImg.classList.add("is-dim", "is-bounce"));

  boothHit.addEventListener("click", (e) => {
    e.preventDefault();
    boothImg.classList.add("is-dim");
    if (fade) fade.classList.add("is-on");
    setTimeout(() => (window.location.href = NEXT_PAGE_URL), 280);
  });
}

// ---------------- WALKERS (2 lanes, locked) ----------------
function applyLaneStyle(el, lane){
  const isFront = lane === LANE_FRONT;

  const scale = isFront ? SIZE_FRONT : SIZE_BACK;
  const speed = isFront ? SPEED_FRONT : SPEED_BACK;
  const z = isFront ? 320 : 170;

  el.style.width = `${120 * scale}px`;
  el.style.height = `${190 * scale}px`;
  el.style.bottom = `${lane}px`;
  el.style.zIndex = String(z);

  return speed;
}

function spawnWalker(w, side){
  w.speed = applyLaneStyle(w.el, w.lane);

  const hide = frameW() + 160;
  w.dir = side === "left" ? 1 : -1;
  w.x = side === "left" ? -hide : (window.innerWidth + hide);
}

function forceSpawnInside(w, side){
  const openLeft = frameW();
  const openRight = window.innerWidth - frameW();

  spawnWalker(w, side);

  if (side === "left"){
    w.x = openLeft + 20;
    w.dir = 1;
  } else {
    w.x = openRight - 160;
    w.dir = -1;
  }
}

function makeWalker(lane){
  const el = document.createElement("div");
  el.className = "walker";
  walkersLayer.appendChild(el);

  const w = {
    el,
    lane,
    x: 0,
    dir: 1,
    speed: 0,
    color: pick(WALKER_COLORS),
  };

  el.style.backgroundImage = `url('${w.color}')`;
  spawnWalker(w, Math.random() < 0.5 ? "left" : "right");
  return w;
}

const walkers = [];
for (let i = 0; i < NUM_WALKERS; i++){
  const lane = (i % 2 === 0) ? LANE_BACK : LANE_FRONT;
  walkers.push(makeWalker(lane));
}

forceSpawnInside(walkers[0], "left");
forceSpawnInside(walkers[1], "right");

function countVisible(){
  let c = 0;
  for (const w of walkers){
    if (w.x > -80 && w.x < window.innerWidth + 80) c++;
  }
  return c;
}

// ---------------- GEROBak ----------------
let gerobakEl = null;
let gerobakRunning = false;
let nextGerobakAt = performance.now() + GEROBak_MIN_INTERVAL_MS;

function ensureGerobakEl(){
  if (gerobakEl) return;
  gerobakEl = document.createElement("img");
  gerobakEl.src = GEROBak_SRC;
  gerobakEl.className = "gerobak";
  gerobakEl.alt = "gerobak";
  stage.appendChild(gerobakEl);
  gerobakEl.style.display = "none";
}

function scheduleNextGerobak(now){
  nextGerobakAt = now + GEROBak_MIN_INTERVAL_MS + rand(0, GEROBak_EXTRA_RANDOM_MS);
}

function startGerobak(now){
  ensureGerobakEl();
  if (!gerobakEl || gerobakRunning) return;

  gerobakRunning = true;
  gerobakEl.style.display = "block";

  const hide = frameW() + 260;
  const dir = Math.random() < 0.5 ? -1 : 1;

  const startX = dir === -1 ? (window.innerWidth + hide) : (-hide);
  const endX   = dir === -1 ? (-hide) : (window.innerWidth + hide);

  const flipX = dir === 1 ? -1 : 1;

  const t0 = now;
  const duration = GEROBak_TRAVEL_MS;

  function anim(t){
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const x = startX + (endX - startX) * eased;

    gerobakEl.style.transform = `translate3d(${x}px,0,0) scaleX(${flipX})`;

    if (p < 1) requestAnimationFrame(anim);
    else {
      gerobakEl.style.display = "none";
      gerobakRunning = false;
      scheduleNextGerobak(t);
    }
  }
  requestAnimationFrame(anim);
}
scheduleNextGerobak(performance.now());

// ---------------- Main loop ----------------
let lastT = 0;
function tick(t){
  const dt = (t - lastT) / 1000 || 0;
  lastT = t;

  for (const w of walkers){
    w.x += w.dir * w.speed * dt;
    w.el.style.transform = `translate3d(${w.x}px,0,0) scaleX(${w.dir})`;

    const hide = frameW() + 220;

    if (w.dir === 1 && w.x > window.innerWidth + hide) spawnWalker(w, "left");
    if (w.dir === -1 && w.x < -hide) spawnWalker(w, "right");
  }

  if (countVisible() < MIN_VISIBLE){
    forceSpawnInside(walkers[0], "left");
    forceSpawnInside(walkers[1], "right");
  }

  if (!gerobakRunning && t >= nextGerobakAt){
    startGerobak(t);
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.addEventListener("resize", () => {
  forceSpawnInside(walkers[0], "left");
  forceSpawnInside(walkers[1], "right");
});

// ---------------- HUD button anim + IG link ----------------
function attachAnim(el){
  if (!el) return;

  const on = () => {
    el.classList.add("is-dim","is-pop");
    el.classList.remove("is-shake");
    void el.offsetWidth;
    el.classList.add("is-shake");
  };
  const off = () => el.classList.remove("is-dim","is-pop","is-shake");

  el.addEventListener("mouseenter", on);
  el.addEventListener("mouseleave", off);
  el.addEventListener("mousedown", on);
  el.addEventListener("mouseup", () => {
    setTimeout(() => el.classList.remove("is-pop"), 120);
  });
}

attachAnim(igBtn);
attachAnim(soundBtn);

if (igBtn){
  igBtn.addEventListener("click", () => {
    window.open("https://instagram.com/delman.17", "_blank", "noopener,noreferrer");
  });
}
