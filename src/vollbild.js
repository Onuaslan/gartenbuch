/* ---------- Vollbild-Karte (quer) ---------- */
const GI = {
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="8" height="8" rx="1.2"/><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/></svg>',
  rot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="7" width="7" height="10" rx="1.4"/><path d="M20 12a8 8 0 0 1-13.4 5.9M4 12a8 8 0 0 1 13.4-5.9"/><path d="M18 3.5l-.4 3 3 .4M6 20.5l.4-3-3-.4"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h10M9 8h5"/></svg>'
};
const FTOP = 44;
let pinch = null, fullKey = "";
const fullSizeKey = () => document.documentElement.clientWidth + "x" + document.documentElement.clientHeight;
/* Nicht auf ein resize-Ereignis verlassen: WebViews melden die Drehung manchmal verspätet oder gar nicht */
setInterval(() => {
  if (mdrag || pinch) return;
  if (S.full){ if (fullSizeKey() !== fullKey) fullRefit(); return; }
  const w = document.documentElement.clientWidth;  // zurück im Normalmodus: Karte an die neue Breite anpassen
  if (S.tab === "garten" && S.gview === "karte" && mapRW && w !== mapRW){ mapRW = w; mapRefresh(); }
}, 250);
window.addEventListener("orientationchange", () => setTimeout(fullRefit, 300));
const nativeBridge = (fn, ...a) => { const b = window.Android; if (b && typeof b[fn] === "function"){ try { b[fn](...a); } catch {} } };
function fullFitPpm(){
  const m = MAP(), de = document.documentElement;
  const aw = de.clientWidth - 8 - GKM.L - GKM.R, ah = de.clientHeight - FTOP - 8 - GKM.T - GKM.B;
  return Math.max(4, Math.min(aw / Math.max(1, m.w), ah / Math.max(1, m.l)));
}
const fullZMax = () => Math.max(1, 140 / fullFitPpm());
function fullOpen(){
  if (!mapHasLot() || S.full) return;
  S.full = true; S.fullZoom = 1; S.fullScroll = [0, 0]; S.orient = "landscape";
  nativeBridge("setOrientation", "landscape"); nativeBridge("setFullscreen", true);
  render();
  setTimeout(() => { if (S.full && S.orient === "landscape") nativeBridge("setOrientation", "landscape"); }, 700);
}
function fullClose(){
  if (!S.full) return;
  S.full = false; S.fullZoom = 1; pinch = null;
  nativeBridge("setOrientation", "auto"); nativeBridge("setFullscreen", false);
  render();
}
window.__fullClose = fullClose;
function fullBarHTML(){
  const m = MAP(), z = S.fullZoom || 1, land = S.orient !== "portrait";
  return `<div class="gk-ftop"><button class="gk-fb" data-act="full-close" aria-label="Vollbild schließen">${I.x}<span>Schließen</span></button>
    <span class="gk-ft"><b>Mein Garten</b><span class="muted small mono">${fm(m.w)} × ${fm(m.l)} m</span></span>${compassHTML(m)}
    <span class="gk-fsp"></span>
    <span class="gk-fz"><button class="gk-fb ic" data-act="full-zoom" data-d="-1" aria-label="Verkleinern" ${z <= 1.001 ? "disabled" : ""}>−</button><span class="mono small gk-zl">${Math.round(z * 100)} %</span><button class="gk-fb ic" data-act="full-zoom" data-d="1" aria-label="Vergrößern" ${z >= fullZMax() - .001 ? "disabled" : ""}>+</button></span>
    <button class="gk-fb ic" data-act="full-fit" aria-label="Ganze Karte einpassen" title="Einpassen">${GI.fit}</button>
    <button class="gk-fb" data-act="full-rot" aria-label="${land ? "Hochformat" : "Querformat"} einstellen">${GI.rot}<span>${land ? "Hochformat" : "Querformat"}</span></button>
    <button class="gk-fb" data-act="map-add" aria-label="Element hinzufügen">${I.plus}<span>Element</span></button>
    <button class="gk-fb" data-act="book" aria-label="Pflanzbuch">${GI.book}<span>Pflanzbuch</span></button></div>`;
}
function fullRender(){
  let el = document.getElementById("gk-full");
  if (!S.full || !mapHasLot()){
    if (el) el.remove();
    document.body.classList.remove("gk-isfull");
    return;
  }
  if (mdrag || pinch) return;
  const old = document.getElementById("mapbox"), sc = old ? [old.scrollLeft, old.scrollTop] : S.fullScroll || [0, 0];
  if (!el){ el = document.createElement("div"); el.id = "gk-full"; el.className = "gk-full"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Gartenkarte im Vollbild"); document.body.appendChild(el); }
  document.body.classList.add("gk-isfull"); fullKey = fullSizeKey();
  const m = MAP(), ppm = mapPpm(), W = m.w * ppm + GKM.L + GKM.R, H = m.l * ppm + GKM.T + GKM.B, has = !!(S.mapSel && mapItem(S.mapSel));
  el.innerHTML = `${fullBarHTML()}<div class="gk-fbody"><div class="gk-box gk-fbox" id="mapbox"><div class="gk-cv" id="gk-cv" style="width:${n1(W)}px;height:${n1(H)}px">${mapCanvasHTML()}</div></div><div class="gk-fpanel" id="mappanel" ${has ? "" : "hidden"}>${has ? mapPanelHTML() : ""}</div></div>`;
  const nb = document.getElementById("mapbox"); nb.scrollLeft = sc[0]; nb.scrollTop = sc[1]; S.fullScroll = [nb.scrollLeft, nb.scrollTop];
  fullPanelSide();
}
/* Das Panel liegt auf der Seite, auf der das gewählte Element nicht ist */
function fullPanelSide(){
  const p = document.getElementById("mappanel"), h = S.mapSel && document.querySelector(`[data-mid="${S.mapSel}"]`); if (!p || !h) return;
  const r = h.getBoundingClientRect(), de = document.documentElement, port = de.clientHeight > de.clientWidth;
  p.classList.toggle("l", !port && r.left + r.width / 2 > de.clientWidth / 2);
  p.classList.toggle("t", port && r.top + r.height / 2 > (de.clientHeight + FTOP) / 2);
}
/* Größe oder Zoom haben sich geändert: Mitte der Ansicht beibehalten */
function fullRefit(anchor){
  if (!S.full) return;
  const box = document.getElementById("mapbox");
  let fx = .5, fy = .5, vx = box ? box.clientWidth / 2 : 0, vy = box ? box.clientHeight / 2 : 0;
  if (anchor){ fx = anchor.fx; fy = anchor.fy; vx = anchor.vx; vy = anchor.vy; }
  else if (box){
    fx = box.scrollWidth > box.clientWidth + 1 ? (box.scrollLeft + vx) / box.scrollWidth : .5;
    fy = box.scrollHeight > box.clientHeight + 1 ? (box.scrollTop + vy) / box.scrollHeight : .5;
  }
  S.fullZoom = clamp(S.fullZoom || 1, 1, fullZMax());
  if (S.fullZoom < 1.03) S.fullZoom = 1;
  fullRender();
  const nb = document.getElementById("mapbox");
  if (nb && S.fullZoom > 1){ nb.scrollLeft = fx * nb.scrollWidth - vx; nb.scrollTop = fy * nb.scrollHeight - vy; S.fullScroll = [nb.scrollLeft, nb.scrollTop]; }
}
function fullZoomTo(z, anchor){ S.fullZoom = z; fullRefit(anchor); }
function fullAct(a, b){
  switch (a){
    case "full-open": fullOpen(); break;
    case "full-close": fullClose(); break;
    case "full-zoom": { const d = +b.dataset.d || 0; fullZoomTo(clamp((S.fullZoom || 1) * (d > 0 ? 1.5 : 1 / 1.5), 1, fullZMax())); break; }
    case "full-fit": fullZoomTo(1); break;
    case "full-rot":
      S.orient = S.orient === "portrait" ? "landscape" : "portrait";
      nativeBridge("setOrientation", S.orient); fullRender(); setTimeout(fullRefit, 500); break;
  }
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && S.full && !S.sheet) fullClose(); }, true);

/* ----- Zwei Finger: Karte vergrößern und verkleinern ----- */
const pdist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
document.addEventListener("touchstart", e => {
  if (!S.full || e.touches.length !== 2) return;
  const box = document.getElementById("mapbox"), cv = document.getElementById("gk-cv"); if (!box || !cv) return;
  if (mdrag){ const it = mapItem(mdrag.id); if (it){ it.x = mdrag.ox; it.y = mdrag.oy; it.w = mdrag.ow; it.h = mdrag.oh; gkUpdateItem(it); } mdrag = null; }
  const r = box.getBoundingClientRect(), mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  pinch = {d0: pdist(e.touches), z0: S.fullZoom || 1, z: S.fullZoom || 1, vx: mx - r.left, vy: my - r.top, fx: (box.scrollLeft + mx - r.left) / box.scrollWidth, fy: (box.scrollTop + my - r.top) / box.scrollHeight, ox: box.scrollLeft + mx - r.left - cv.offsetLeft, oy: box.scrollTop + my - r.top - cv.offsetTop};
}, {passive: true});
document.addEventListener("touchmove", e => {
  if (!pinch || e.touches.length !== 2) return;
  const cv = document.getElementById("gk-cv"); if (!cv) return;
  pinch.z = clamp(pinch.z0 * pdist(e.touches) / pinch.d0, 1, fullZMax());
  cv.style.transformOrigin = `${pinch.ox}px ${pinch.oy}px`; cv.style.transform = `scale(${pinch.z / pinch.z0})`;
}, {passive: true});
function pinchEnd(e){
  if (!pinch || (e && e.touches && e.touches.length >= 2)) return;
  const p = pinch; pinch = null;
  const cv = document.getElementById("gk-cv"); if (cv){ cv.style.transform = ""; cv.style.transformOrigin = ""; }
  if (Math.abs(p.z - p.z0) > .02) fullZoomTo(p.z, p);
}
document.addEventListener("touchend", pinchEnd);
document.addEventListener("touchcancel", pinchEnd);
