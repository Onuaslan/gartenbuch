/* ---------- Gartenkarte (Draufsicht mit Maßen) ---------- */
const MTYPES = {
  beet:     {l: "Beet",             c: "#A0764D", t: "#fff",    w: 2,   h: 1,   round: false, z: 3},
  hochbeet: {l: "Hochbeet",         c: "#7A5A3A", t: "#fff",    w: 1.2, h: 2,   round: false, z: 3},
  rasen:    {l: "Rasen",            c: "#8CC66B", t: "#14201a", w: 6,   h: 5,   round: false, z: 0},
  terrasse: {l: "Terrasse / Pflaster", c: "#C8B596", t: "#14201a", w: 4, h: 3, round: false, z: 1},
  weg:      {l: "Weg",              c: "#CFC8B8", t: "#14201a", w: 1,   h: 5,   round: false, z: 1},
  haus:     {l: "Haus",             c: "#8E979E", t: "#fff",    w: 10,  h: 8,   round: false, z: 2},
  huette:   {l: "Hütte / Schuppen", c: "#B58B5B", t: "#14201a", w: 3,   h: 2.5, round: false, z: 2},
  pool:     {l: "Pool / Teich",     c: "#5AB0E0", t: "#14201a", w: 4,   h: 2.5, round: false, z: 2},
  kompost:  {l: "Kompost",          c: "#6B5B45", t: "#fff",    w: 1,   h: 1,   round: false, z: 3},
  strauch:  {l: "Strauch / Hecke",  c: "#6AAE5C", t: "#14201a", w: 1.2, h: 1.2, round: true,  z: 4},
  baum:     {l: "Baum",             c: "#3E8E53", t: "#fff",    w: 3,   h: 3,   round: true,  z: 5},
  pflanze:  {l: "Einzelpflanze",    c: "#E58FA8", t: "#14201a", w: .6,  h: .6,  round: true,  z: 5},
  sonst:    {l: "Sonstiges",        c: "#A7B0A9", t: "#14201a", w: 2,   h: 2,   round: false, z: 3}
};
const MNORTH = [[0, "Norden"], [45, "Nordosten"], [90, "Osten"], [135, "Südosten"], [180, "Süden"], [225, "Südwesten"], [270, "Westen"], [315, "Nordwesten"]];
const r2 = v => Math.round(v * 100) / 100;
const r1 = v => Math.round(v * 10) / 10;
const fm = v => (Math.round(v * 100) / 100).toLocaleString("de-AT", {maximumFractionDigits: 2});
const numIn = v => parseFloat(String(v == null ? "" : v).replace(",", "."));
const mapId = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function mapNormItem(o, m){
  o = o && typeof o === "object" ? o : {};
  const t = MTYPES[o.type] ? o.type : "sonst", d = MTYPES[t];
  const n = (v, dflt) => { v = numIn(v); return isFinite(v) ? v : dflt; };
  const w = clamp(n(o.w, d.w), .1, m.w), h = clamp(n(o.h, d.h), .1, m.l);
  const x = clamp(n(o.x, 0), 0, m.w - w), y = clamp(n(o.y, 0), 0, m.l - h);
  return {id: str(o.id) || mapId(), type: t, name: str(o.name).slice(0, 60), x: r2(x), y: r2(y), w: r2(w), h: r2(h),
    crops: str(o.crops).slice(0, 300), pids: arr(o.pids).map(str).filter(Boolean).slice(0, 30), note: str(o.note).slice(0, 500)};
}
function mapNormalize(o){
  o = o && typeof o === "object" ? o : {};
  const m = {w: Math.max(0, +o.w || 0), l: Math.max(0, +o.l || 0), north: +o.north || 0, items: []};
  if (m.w > 0 && m.l > 0) m.items = arr(o.items).filter(i => i && typeof i === "object").slice(0, 300).map(i => mapNormItem(i, m));
  return m;
}
const MAP = () => S.map || (S.map = mapNormalize(store.get("garten.map")));
const mapSave = () => store.set("garten.map", S.map);
const mapItem = id => MAP().items.find(i => i.id === id);
const mapHasLot = () => MAP().w > 0 && MAP().l > 0;
function mapPpm(){
  const avail = Math.max(240, Math.min(document.documentElement.clientWidth, 560) - 32) - 6;
  return Math.max(2, avail / Math.max(1, MAP().w)) * (S.mapZoom || 1);
}
const gToggle = () => `<div class="seg" role="group" aria-label="Ansicht"><button data-act="gview" data-v="liste" ${S.gview !== "karte" ? 'aria-current="true"' : ""}>Liste</button><button data-act="gview" data-v="karte" ${S.gview === "karte" ? 'aria-current="true"' : ""}>Karte</button></div>`;
function compassHTML(m){
  return `<svg class="compass" viewBox="0 0 40 40" aria-label="Norden" role="img"><g transform="rotate(${-(+m.north || 0)} 20 20)"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.5"/><path d="M20 5l5 15h-10z" fill="var(--bad)"/><path d="M20 35l5-15h-10z" fill="currentColor" fill-opacity=".35"/><text x="20" y="14" font-size="8" font-weight="700" text-anchor="middle" fill="#fff" stroke="none">N</text></g></svg>`;
}

/* ----- Ansicht ----- */
function viewMap(){
  const m = MAP();
  const head = `<header class="hdr"><div><div class="eyebrow">Gartenbuch<span class="dot"></span>Gartenkarte</div><h1>Mein Garten</h1></div><div style="display:flex;gap:8px"><button class="iconbtn" data-act="map-lot" aria-label="Grundstück und Daten">${I.sliders}</button><button class="iconbtn" data-act="help" aria-label="So funktioniert die App">${I.help}</button></div></header>${gToggle()}`;
  if (!mapHasLot()){
    const d = S.mapDraft || {};
    return `${head}
      <div class="card"><h3>Wie groß ist dein Grundstück?</h3>
        <p class="muted small" style="margin:0">Gib die Maße in Metern ein. Ein ungefährer Wert reicht, du kannst ihn später ändern. Danach legst du Haus, Beete, Terrasse, Bäume und Pflanzen mit ihren Maßen auf die Karte.</p>
        <div class="grid2">
          <div class="field"><label for="ml-w">Breite in m</label><input id="ml-w" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 20" value="${esc(d.w || "")}"></div>
          <div class="field"><label for="ml-l">Länge in m</label><input id="ml-l" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 35" value="${esc(d.l || "")}"></div>
        </div>
        <p class="hint">Breite = von links nach rechts auf dem Bildschirm, Länge = von oben nach unten. Oben ist standardmäßig „hinten“, unten „vorne“ zur Straße.</p>
        ${S.mapErr ? `<div class="err">${esc(S.mapErr)}</div>` : ""}
        <div class="btn-row"><button class="btn primary" data-act="map-lot-first">${I.check}Karte anlegen</button><button class="btn" data-act="map-ai">${I.spark}Lieber per Text beschreiben</button></div>
      </div>`;
  }
  const ppm = mapPpm(), W = m.w * ppm, H = m.l * ppm, gm = ppm >= 14 ? 1 : 5, zoom = S.mapZoom || 1;
  return `${head}
    <div class="mapinfo"><span class="mono">${fm(m.w)} × ${fm(m.l)} m</span><span class="muted small">${nf0.format(m.w * m.l)} m²</span>${compassHTML(m)}
      <span class="spacer"></span>
      <button class="iconbtn sm" data-act="map-zoom" data-d="-1" aria-label="Verkleinern" ${zoom <= 1 ? "disabled" : ""}>−</button><span class="mono small zl">${Math.round(zoom * 100)} %</span><button class="iconbtn sm" data-act="map-zoom" data-d="1" aria-label="Vergrößern" ${zoom >= 4 ? "disabled" : ""}>+</button></div>
    <div class="mapbox ${zoom > 1 ? "zoomed" : ""}" id="mapbox"><div class="mapcv" id="mapcv" style="width:${W}px;height:${H}px;background-size:${gm * ppm}px ${gm * ppm}px"><div id="mapitems">${mapItemsHTML()}</div></div></div>
    <div class="mapscale muted small"><i style="width:${5 * ppm}px"></i>5 m · Raster ${gm} m</div>
    <div id="mappanel">${mapPanelHTML()}</div>
    <div class="btn-row"><button class="btn primary" data-act="map-add">${I.plus}Element hinzufügen</button><button class="btn" data-act="map-ai">${I.spark}Per Text eintragen</button></div>
    ${mapListHTML()}`;
}
function mapItemsHTML(){
  const m = MAP(), ppm = mapPpm(), sel = S.mapSel;
  const list = m.items.slice().sort((a, b) => MTYPES[a.type].z - MTYPES[b.type].z);
  let out = list.map(it => {
    const t = MTYPES[it.type], w = it.w * ppm, h = it.h * ppm;
    const vert = w < 30 && w >= 14 && h >= 36, showName = (w >= 30 && h >= 16) || vert, showCrops = it.crops && w >= 44 && h >= 34;
    const nm = it.name || t.l;
    const nameLines = showName && !showCrops && h >= 46 ? 2 : 1, cropLines = clamp(Math.floor((h - 8 - (showName ? 16 : 0)) / 13), 1, 4);
    return `<div class="mi${it.id === sel ? " sel" : ""}${t.round ? " round" : ""}${vert ? " vert" : ""}" data-mid="${esc(it.id)}" style="left:${it.x * ppm}px;top:${it.y * ppm}px;width:${w}px;height:${h}px;background:${t.c};color:${t.t};z-index:${t.z + (it.id === sel ? 10 : 0)}">${showName ? `<span class="ml" style="-webkit-line-clamp:${nameLines};${nameLines > 1 ? "white-space:normal" : ""}">${esc(nm)}</span>` : ""}${showCrops ? `<span class="mc" style="-webkit-line-clamp:${cropLines}">${esc(it.crops)}</span>` : ""}</div>`;
  }).join("");
  const s = sel && mapItem(sel);
  if (s) out += `<div class="mh" data-mh="${esc(s.id)}" style="left:${(s.x + s.w) * ppm - 14}px;top:${(s.y + s.h) * ppm - 14}px" aria-label="Größe ändern"></div>`;
  return out;
}
function mapPanelHTML(){
  const it = S.mapSel && mapItem(S.mapSel);
  if (!it) return `<p class="hint">Tippe ein Element an. Ziehen verschiebt es, der blaue Punkt unten rechts ändert die Größe. Genaue Maße gibst du über „Bearbeiten“ ein.</p>`;
  const t = MTYPES[it.type], pl = it.pids.map(plantById).filter(Boolean);
  return `<div class="card mpanel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="min-width:0"><div class="eyebrow">${esc(t.l)}</div><h3 style="margin-top:3px">${esc(it.name || t.l)}</h3><div class="muted small mono">${fm(it.w)} × ${fm(it.h)} m${t.round ? "" : " · " + fm(r2(it.w * it.h)) + " m²"} · ${fm(it.x)} m von links, ${fm(it.y)} m von oben</div></div></div>
    ${it.crops ? `<div><div class="lbl">Gepflanzt</div><div>${esc(it.crops)}</div></div>` : ""}
    ${pl.length ? `<div class="chips">${pl.map(p => `<button class="chip" data-act="open" data-id="${esc(p.id)}">${I.leaf}${esc(p.name)}</button>`).join("")}</div>` : ""}
    ${it.note ? `<p class="muted small" style="margin:0">${esc(it.note)}</p>` : ""}
    <div class="btn-row"><button class="btn primary sm" data-act="map-edit" data-id="${esc(it.id)}">Bearbeiten</button><button class="btn sm" data-act="map-dup" data-id="${esc(it.id)}">Kopie</button><button class="btn ghost sm" data-act="map-desel">Fertig</button></div></div>`;
}
function mapListHTML(){
  const items = MAP().items.slice().sort((a, b) => (MTYPES[a.type].z - MTYPES[b.type].z) || (a.name || "").localeCompare(b.name || ""));
  if (!items.length) return `<div class="empty-task">${GL.sprout}<span>Die Karte ist noch leer. Tippe auf „Element hinzufügen“, z. B. Haus, Terrasse oder ein Beet.</span></div>`;
  return `<section class="sec"><div class="sec-head"><h2>Auf der Karte</h2><span class="count">${items.length}</span></div><div class="mlist">${items.map(it => {
    const t = MTYPES[it.type], pl = it.pids.map(plantById).filter(Boolean).map(p => p.name);
    const crops = [it.crops].concat(pl).filter(Boolean).join(", ");
    return `<button class="mrow" data-act="map-sel" data-id="${esc(it.id)}"><span class="msw" style="background:${t.c}"></span><span style="min-width:0;flex:1"><b>${esc(it.name || t.l)}</b><span class="muted small" style="display:block">${esc(t.l)} · ${fm(it.w)} × ${fm(it.h)} m${crops ? " · " + esc(cut(crops, 70)) : ""}</span></span></button>`;
  }).join("")}</div></section>`;
}
function mapRedraw(){
  const a = document.getElementById("mapitems"); if (!a) return;
  a.innerHTML = mapItemsHTML();
  const p = document.getElementById("mappanel"); if (p) p.innerHTML = mapPanelHTML();
}
function mapAfterRender(){
  const b = document.getElementById("mapbox");
  if (b && S.mapScroll){ b.scrollLeft = S.mapScroll[0]; b.scrollTop = S.mapScroll[1]; }
}
function mapRefresh(){ if (S.tab === "garten" && S.gview === "karte") render(); }

/* ----- Ziehen und Größe ändern ----- */
let mdrag = null;
document.addEventListener("pointerdown", e => {
  const t = e.target; if (!t || !t.closest) return;
  const hnd = t.closest("[data-mh]"), el = hnd || t.closest("[data-mid]"), cv = document.getElementById("mapcv");
  S.mapBlank = !!cv && t === cv;
  if (!el || !cv) return;
  const id = el.dataset.mh || el.dataset.mid, it = mapItem(id); if (!it) return;
  mdrag = {id, mode: hnd ? "size" : "move", sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, ow: it.w, oh: it.h, moved: false, pid: e.pointerId, ppm: mapPpm()};
  try { cv.setPointerCapture(e.pointerId); } catch {}
  if (S.mapSel !== id){ S.mapSel = id; mapRedraw(); }
});
document.addEventListener("pointermove", e => {
  if (!mdrag || e.pointerId !== mdrag.pid) return;
  if (!mdrag.moved && Math.hypot(e.clientX - mdrag.sx, e.clientY - mdrag.sy) < 6) return;
  mdrag.moved = true;
  const it = mapItem(mdrag.id), m = MAP(); if (!it){ mdrag = null; return; }
  const dx = (e.clientX - mdrag.sx) / mdrag.ppm, dy = (e.clientY - mdrag.sy) / mdrag.ppm;
  if (mdrag.mode === "move"){
    it.x = r1(clamp(mdrag.ox + dx, 0, Math.max(0, m.w - it.w)));
    it.y = r1(clamp(mdrag.oy + dy, 0, Math.max(0, m.l - it.h)));
  } else {
    it.w = r1(clamp(mdrag.ow + dx, .2, Math.max(.2, m.w - it.x)));
    it.h = r1(clamp(mdrag.oh + dy, .2, Math.max(.2, m.l - it.y)));
  }
  mapRedraw();
});
function mapDragEnd(e){
  if (!mdrag || (e && e.pointerId != null && e.pointerId !== mdrag.pid)) return;
  const was = mdrag; mdrag = null;
  if (was.moved){ mapSave(); mapRedraw(); }
}
document.addEventListener("pointerup", mapDragEnd);
document.addEventListener("pointercancel", mapDragEnd);
document.addEventListener("lostpointercapture", mapDragEnd);
document.addEventListener("click", e => {
  if (e.target && e.target.id === "mapcv" && S.mapBlank && S.mapSel){ S.mapSel = null; mapRedraw(); }
});
document.addEventListener("scroll", e => { const t = e.target; if (t && t.id === "mapbox") S.mapScroll = [t.scrollLeft, t.scrollTop]; }, true);
let mapRW = 0, mapRT;
window.addEventListener("resize", () => {
  clearTimeout(mapRT);
  mapRT = setTimeout(() => { const w = document.documentElement.clientWidth; if (w !== mapRW){ mapRW = w; if (!mdrag) mapRefresh(); } }, 200);
});

/* ----- Aktionen ----- */
function mapAct(a, b){
  const id = b.dataset.id, m = MAP();
  switch (a){
    case "gview": S.gview = b.dataset.v === "karte" ? "karte" : "liste"; store.set("garten.gview", S.gview); S.mapSel = null; render(); break;
    case "map-sel": S.mapSel = id; render(); window.scrollTo(0, 0); break;
    case "map-desel": S.mapSel = null; mapRedraw(); break;
    case "map-add": openSheet({type: "mapadd"}); break;
    case "map-new": { S.sheetErr = "";
      const t = b.dataset.type, d = MTYPES[t]; if (!d || !mapHasLot()) break;
      const n = m.items.filter(i => i.type === t).length;
      const it = mapNormItem({type: t, name: n ? d.l + " " + (n + 1) : d.l, x: (m.w - d.w) / 2 + Math.min(n, 6) * .5, y: (m.l - d.h) / 2 + Math.min(n, 6) * .5, w: d.w, h: d.h}, m);
      m.items.push(it); mapSave(); S.mapSel = it.id; render(); openSheet({type: "mapitem", id: it.id}); break; }
    case "map-edit": S.sheetErr = ""; openSheet({type: "mapitem", id}); break;
    case "map-dup": {
      const o = mapItem(id); if (!o) break;
      const c = mapNormItem({...o, id: "", pids: o.pids.slice(), name: o.name ? o.name + " (Kopie)" : "", x: o.x + .5, y: o.y + .5}, m);
      m.items.push(c); mapSave(); S.mapSel = c.id; render(); break; }
    case "map-zoom": {
      const box = document.getElementById("mapbox"), cw = box ? box.scrollWidth : 0;
      const fx = box && cw ? (box.scrollLeft + box.clientWidth / 2) / cw : 0, fy = box && box.scrollHeight ? (box.scrollTop + box.clientHeight / 2) / box.scrollHeight : 0;
      const z = [1, 1.5, 2, 3, 4], i = Math.max(0, z.indexOf(S.mapZoom || 1)) + (+b.dataset.d || 0);
      S.mapZoom = z[clamp(i, 0, z.length - 1)]; render();
      const nb = document.getElementById("mapbox");
      if (nb){ nb.scrollLeft = fx * nb.scrollWidth - nb.clientWidth / 2; nb.scrollTop = fy * nb.scrollHeight - nb.clientHeight / 2; S.mapScroll = [nb.scrollLeft, nb.scrollTop]; }
      break; }
    case "map-lot": S.sheetErr = ""; openSheet({type: "maplot"}); break;
    case "map-lot-first": {
      const w = numIn(document.getElementById("ml-w").value), l = numIn(document.getElementById("ml-l").value);
      if (!(w >= 1 && l >= 1 && w <= 2000 && l <= 2000)){ S.mapErr = "Bitte Breite und Länge in Metern eintragen, z. B. 20 und 35."; render(); break; }
      S.mapErr = ""; S.mapDraft = null; m.w = r2(w); m.l = r2(l); mapSave(); render(); break; }
    case "map-lot-save": mapSaveLot(); break;
    case "map-clear": S.sheet.confirmClear = true; renderSheet(); break;
    case "map-clear-no": S.sheet.confirmClear = false; renderSheet(); break;
    case "map-clear-yes": S.map = mapNormalize({}); mapSave(); S.mapSel = null; closeSheet(); render(); toast("Karte geleert"); break;
    case "map-import": mapImport(); break;
    case "map-item-save": mapSaveItem(); break;
    case "map-item-del": S.sheet.confirmDelete = true; renderSheet(); break;
    case "map-item-del-no": S.sheet.confirmDelete = false; renderSheet(); break;
    case "map-item-del-yes": m.items = m.items.filter(i => i.id !== S.sheet.id); mapSave(); S.mapSel = null; closeSheet(); render(); toast("Gelöscht"); break;
    case "map-ai": S.mapAiDone = null; S.mapErr = ""; openSheet({type: "mapai"}); break;
    case "map-ai-go": mapAI(); break;
    case "map-ai-stop": S.mapCtl && S.mapCtl.abort(); break;
  }
}
const mapFields = (ids) => ids.map(i => document.getElementById(i));
function mapSaveItem(){
  const it = mapItem(S.sheet.id), m = MAP(); if (!it) return;
  const v = id => { const e = document.getElementById(id); return e ? e.value : ""; };
  const w = numIn(v("mi-w")), h = numIn(v("mi-h")), x = numIn(v("mi-x")), y = numIn(v("mi-y"));
  let err = "";
  if (!(w >= .1 && h >= .1)) err = "Breite und Länge müssen mindestens 0,1 m sein.";
  else if (!(x >= 0 && y >= 0)) err = "Der Abstand von links und oben darf nicht negativ sein.";
  else if (x + w > m.w + .001) err = `Das Element ist zu breit: ${fm(x)} m Abstand plus ${fm(w)} m Breite sind mehr als die Grundstücksbreite von ${fm(m.w)} m.`;
  else if (y + h > m.l + .001) err = `Das Element ist zu lang: ${fm(y)} m Abstand plus ${fm(h)} m Länge sind mehr als die Grundstückslänge von ${fm(m.l)} m.`;
  if (err){ S.sheetErr = err; renderSheet(); return; }
  const pids = Array.from(document.querySelectorAll(".mi-pl:checked")).map(e => e.value);
  Object.assign(it, mapNormItem({id: it.id, type: v("mi-type"), name: v("mi-name"), x, y, w, h, crops: v("mi-crops"), pids, note: v("mi-note")}, m));
  mapSave(); S.sheetErr = ""; S.mapSel = it.id; closeSheet(); render(); toast("Gespeichert");
}
function mapSaveLot(){
  const m = MAP(), w = numIn(document.getElementById("mls-w").value), l = numIn(document.getElementById("mls-l").value);
  if (!(w >= 1 && l >= 1 && w <= 2000 && l <= 2000)){ S.sheetErr = "Bitte Breite und Länge in Metern eintragen."; renderSheet(); return; }
  m.w = r2(w); m.l = r2(l); m.north = +document.getElementById("mls-n").value || 0;
  m.items = m.items.map(i => mapNormItem(i, m));
  mapSave(); S.sheetErr = ""; closeSheet(); render(); toast("Gespeichert");
}
function mapImport(){
  const t = str(document.getElementById("mapimp").value);
  try {
    const o = JSON.parse(t), n = mapNormalize(o);
    if (!(n.w > 0 && n.l > 0)) throw new Error("lot");
    S.map = n; mapSave(); S.mapSel = null; S.sheetErr = ""; closeSheet(); render(); toast(`${n.items.length} Elemente übernommen`);
  } catch { S.sheetErr = "Das konnte ich nicht lesen. Füge den kompletten Text ein, der mit { beginnt und mit } endet."; renderSheet(); }
}

/* ----- Sheets ----- */
function mapAddSheet(head){
  return `${head("Element hinzufügen")}
    <p class="muted small" style="margin:0">Was möchtest du auf die Karte setzen? Maße und Namen stellst du im nächsten Schritt ein.</p>
    <div class="mtypes">${Object.entries(MTYPES).map(([k, t]) => `<button class="mtype" data-act="map-new" data-type="${k}"><span class="msw" style="background:${t.c}"></span>${esc(t.l)}</button>`).join("")}</div>`;
}
function mapItemSheet(head){
  const it = mapItem(S.sheet.id), m = MAP(); if (!it){ S.sheet = null; return ""; }
  const t = MTYPES[it.type];
  return `${head(esc(it.name || t.l))}
    <div class="field"><label for="mi-name">Name</label><input id="mi-name" type="text" autocomplete="off" value="${esc(it.name)}" placeholder="z. B. Gemüsebeet links"></div>
    <div class="field"><label for="mi-type">Art</label><select id="mi-type">${Object.entries(MTYPES).map(([k, d]) => `<option value="${k}" ${k === it.type ? "selected" : ""}>${esc(d.l)}</option>`).join("")}</select></div>
    <div class="grid2">
      <div class="field"><label for="mi-w">Breite in m</label><input id="mi-w" type="text" inputmode="decimal" autocomplete="off" value="${fm(it.w)}"></div>
      <div class="field"><label for="mi-h">Länge in m</label><input id="mi-h" type="text" inputmode="decimal" autocomplete="off" value="${fm(it.h)}"></div>
    </div>
    <p class="hint" style="margin-top:-6px">Breite geht von links nach rechts, Länge von oben nach unten. Bei Bäumen und Sträuchern beides gleich eintragen (Durchmesser).</p>
    <div class="grid2">
      <div class="field"><label for="mi-x">Abstand von links</label><input id="mi-x" type="text" inputmode="decimal" autocomplete="off" value="${fm(it.x)}"></div>
      <div class="field"><label for="mi-y">Abstand von oben</label><input id="mi-y" type="text" inputmode="decimal" autocomplete="off" value="${fm(it.y)}"></div>
    </div>
    <p class="hint" style="margin-top:-6px">In Metern, gemessen von der linken bzw. oberen Grundstücksgrenze bis zur linken oberen Ecke des Elements. Grundstück: ${fm(m.w)} × ${fm(m.l)} m.</p>
    <div class="field"><label for="mi-crops">Was ist hier gepflanzt?</label><textarea id="mi-crops" placeholder="z. B. Tomaten, Paprika, Basilikum">${esc(it.crops)}</textarea></div>
    ${S.plants.length ? `<div class="field"><span class="lbl">Pflanzen aus deiner Liste hier verknüpfen</span><div class="chklist">${S.plants.map(p => `<label class="chk"><input type="checkbox" class="mi-pl" value="${esc(p.id)}" ${it.pids.includes(p.id) ? "checked" : ""}><span>${esc(p.name)}</span></label>`).join("")}</div></div>` : ""}
    <div class="field"><label for="mi-note">Notiz</label><textarea id="mi-note" placeholder="z. B. gepflanzt am 15.5., Tropfschlauch liegt">${esc(it.note)}</textarea></div>
    ${S.sheetErr ? `<div class="err">${esc(S.sheetErr)}</div>` : ""}
    <div class="btn-row"><button class="btn primary" data-act="map-item-save">${I.check}Speichern</button></div>
    ${S.sheet.confirmDelete ? `<div class="confirm"><span><b>${esc(it.name || t.l)}</b> von der Karte löschen?</span><div class="btn-row"><button class="btn danger" data-act="map-item-del-yes">Endgültig löschen</button><button class="btn ghost" data-act="map-item-del-no">Abbrechen</button></div></div>`
      : `<button class="btn ghost" data-act="map-item-del" style="align-self:flex-start;color:var(--bad)">Element löschen</button>`}`;
}
function mapLotSheet(head){
  const m = MAP();
  return `${head("Grundstück und Daten")}
    <div class="card"><h3>Grundstück</h3>
      <div class="grid2">
        <div class="field"><label for="mls-w">Breite in m</label><input id="mls-w" type="text" inputmode="decimal" autocomplete="off" value="${m.w ? fm(m.w) : ""}"></div>
        <div class="field"><label for="mls-l">Länge in m</label><input id="mls-l" type="text" inputmode="decimal" autocomplete="off" value="${m.l ? fm(m.l) : ""}"></div>
      </div>
      <div class="field"><label for="mls-n">Oben auf der Karte ist …</label><select id="mls-n">${MNORTH.map(([d, n]) => `<option value="${d}" ${d === (+m.north || 0) ? "selected" : ""}>${n}</option>`).join("")}</select><p class="hint">Damit zeigt der Kompass richtig, wo Norden liegt. Wichtig, um Sonne und Schatten einzuschätzen.</p></div>
      ${S.sheetErr ? `<div class="err">${esc(S.sheetErr)}</div>` : ""}
      <div class="btn-row"><button class="btn primary sm" data-act="map-lot-save">${I.check}Speichern</button></div>
      <p class="hint">Wird das Grundstück kleiner, rutschen Elemente, die nicht mehr passen, an den Rand.</p>
    </div>
    <div class="card"><h3>Karte sichern oder übertragen</h3>
      <p class="muted small" style="margin:0">Dieser Text enthält deine ganze Karte. Kopiere ihn, um ihn aufzuheben oder in einem Chat zu zeigen. Zum Zurückladen den Text unten einfügen.</p>
      <div class="field"><label for="mapjson">Deine Karte</label><textarea id="mapjson" readonly onclick="this.select()" style="min-height:90px;font-family:var(--f-mono);font-size:12px">${esc(JSON.stringify(m))}</textarea></div>
      <div class="field"><label for="mapimp">Karte einfügen</label><textarea id="mapimp" placeholder="Hier den kopierten Text einfügen" style="min-height:70px;font-family:var(--f-mono);font-size:12px"></textarea></div>
      <div class="btn-row"><button class="btn sm" data-act="map-import">Karte laden</button></div>
    </div>
    ${S.sheet.confirmClear ? `<div class="confirm"><span>Alle ${m.items.length} Elemente und das Grundstück löschen?</span><div class="btn-row"><button class="btn danger" data-act="map-clear-yes">Endgültig leeren</button><button class="btn ghost" data-act="map-clear-no">Abbrechen</button></div></div>`
      : `<button class="btn ghost" data-act="map-clear" style="align-self:flex-start;color:var(--bad)">Karte leeren</button>`}`;
}
function mapAiSheet(head){
  const m = MAP(), done = S.mapAiDone;
  return `${head("Per Text eintragen")}
    <p class="muted small" style="margin:0">Beschreibe in eigenen Worten, was wo ist. Claude zeichnet es auf die Karte. Du kannst alles danach noch verschieben und anpassen.</p>
    ${!S.sample ? `<div class="banner">Dafür brauchst du den API-Schlüssel.${BTN_SETTINGS}</div>` : ""}
    <div class="field"><label for="mapai-in">Beschreibung</label><textarea id="mapai-in" style="min-height:150px" placeholder="${esc(mapHasLot() ? "z. B. Hochbeet 1,2 × 2,4 m hinten links mit Tomaten und Paprika. Daneben ein Kräuterbeet 1 × 1 m. Apfelbaum ganz rechts, Durchmesser 4 m." : "z. B. Grundstück 20 × 35 m. Das Haus steht vorne, 12 × 9 m, in der Mitte. Dahinter Terrasse 5 × 4 m, hinten links ein Gemüsebeet 3 × 1,2 m mit Tomaten.")}" ${S.mapBusy ? "disabled" : ""}>${esc(S.mapAiDraft || "")}</textarea><p class="hint">Je genauer die Maße und Himmelsrichtungen („links hinten“, „neben der Terrasse“), desto besser. Bereits Eingetragenes bleibt unverändert.</p></div>
    ${S.mapBusy ? `<div class="busy"><span class="leafspin">${GL.sprout}</span><div><b>Die Karte wird gezeichnet …</b><div class="muted small">Das dauert meist 10–30 Sekunden.</div></div></div><div class="btn-row"><button class="btn ghost sm" data-act="map-ai-stop">Abbrechen</button></div>` : ""}
    ${S.mapErr ? `<div class="err">${esc(S.mapErr)}</div>` : ""}
    ${done ? `<div class="banner"><b>${done.n} Element${done.n === 1 ? "" : "e"} eingetragen.</b>${done.note ? "<br>" + esc(done.note) : ""}<br><button class="btn sm" data-act="close" style="margin-top:8px">Karte ansehen</button></div>` : ""}
    ${S.sample && !S.mapBusy ? `<div class="btn-row"><button class="btn primary" data-act="map-ai-go">${I.spark}Auf die Karte eintragen</button></div>` : ""}`;
}
const BTN_SETTINGS = '<br><button class="btn sm" data-act="settings" style="margin-top:8px">Einstellungen öffnen</button>';

/* ----- KI: Text in Kartenelemente umsetzen ----- */
function mapPrompt(txt){
  const m = MAP();
  const have = m.items.map(i => ({typ: i.type, name: i.name, x: i.x, y: i.y, breite: i.w, laenge: i.h}));
  return `Du hilfst beim Zeichnen einer Gartenkarte in der Draufsicht. Alle Maße sind in Metern. Der Ursprung (0, 0) ist die obere linke Ecke des Grundstücks, x wächst nach rechts, y nach unten.
${mapHasLot() ? `Das Grundstück ist ${m.w} m breit (x) und ${m.l} m lang (y).` : "Das Grundstück ist noch nicht eingetragen. Entnimm Breite und Länge aus der Beschreibung."}
Erlaubte Typen: ${Object.keys(MTYPES).join(", ")}.
Bereits vorhandene Elemente (nicht ändern, nur beachten): ${JSON.stringify(have)}

Der Gärtner beschreibt, was neu eingetragen werden soll:
"""
${txt}
"""

Antworte NUR mit einem JSON-Objekt in genau dieser Form:
{"grundstueck": {"breite": Zahl, "laenge": Zahl} oder null,
 "neu": [{"typ": "beet", "name": "Kurzer Name", "x": Zahl, "y": Zahl, "breite": Zahl, "laenge": Zahl, "bepflanzung": "Tomaten, Paprika"}],
 "hinweis": "Ein kurzer Satz, was du schätzen musstest oder was unklar blieb. Leer, wenn alles klar war."}

Regeln:
- "grundstueck" nur setzen, wenn das Grundstück noch nicht eingetragen ist und die Beschreibung die Maße nennt, sonst null.
- x und y sind die linke obere Ecke des Elements. Jedes neue Element liegt vollständig im Grundstück (x + breite höchstens Grundstücksbreite, y + laenge höchstens Grundstückslänge).
- Ohne andere Angabe ist oben (kleines y) hinten und unten (großes y) vorne zur Straße. Links und rechts sind wie auf dem Bildschirm.
- Nenne Maße, die der Gärtner nicht angegeben hat, realistisch geschätzt und erwähne das im Hinweis.
- Bäume, Sträucher und Einzelpflanzen haben gleiche breite und laenge (Durchmesser).
- Neue Elemente überlappen nicht mit bereits vorhandenen, außer Beete oder Terrassen liegen auf Rasen.
- "bepflanzung" nennt nur, was der Gärtner gesagt hat. Erfinde nichts dazu.`;
}
async function mapAI(){
  const txt = str((document.getElementById("mapai-in") || {}).value || S.mapAiDraft);
  S.mapAiDraft = txt;
  if (!txt || !S.sample || S.mapBusy) return;
  S.mapBusy = true; S.mapErr = ""; S.mapAiDone = null; S.mapCtl = new AbortController(); renderSheet();
  try {
    const r = await S.sample.json(mapPrompt(txt), {signal: S.mapCtl.signal});
    const m = MAP(), g = r && r.grundstueck;
    if (!mapHasLot()){
      const w = numIn(g && g.breite), l = numIn(g && g.laenge);
      if (!(w >= 1 && l >= 1)) throw {code: "no_lot"};
      m.w = r2(w); m.l = r2(l);
    }
    const added = arr(r && r.neu).filter(x => x && typeof x === "object").slice(0, 60).map(x => mapNormItem({type: x.typ, name: x.name, x: x.x, y: x.y, w: x.breite, h: x.laenge, crops: x.bepflanzung}, m));
    if (!added.length) throw {code: "invalid_json"};
    m.items = m.items.concat(added); mapSave();
    S.mapAiDone = {n: added.length, note: str(r.hinweis)}; S.mapAiDraft = "";
    S.gview = "karte"; store.set("garten.gview", "karte");
  } catch (e){
    const c = e && e.code;
    S.mapErr = c === "cancelled" ? "" : c === "not_granted" ? "Der API-Schlüssel fehlt, wird abgelehnt oder das Guthaben ist aufgebraucht. Prüfe ihn in den Einstellungen." : c === "rate_limited" ? "Gerade zu viele Anfragen. Probier es in einer Minute nochmal." : c === "network" ? "Keine Verbindung. Prüfe dein Internet und versuche es nochmal." : c === "no_lot" ? "Ich konnte die Größe des Grundstücks nicht erkennen. Nenne Breite und Länge in Metern, z. B. „Grundstück 20 × 35 m“." : "Das hat nicht geklappt. Beschreibe es bitte etwas genauer und versuche es nochmal.";
  } finally { S.mapBusy = false; S.mapCtl = null; renderSheet(); render(); }
}

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "ml-w" || t.id === "ml-l") S.mapDraft = {...(S.mapDraft || {}), [t.id === "ml-w" ? "w" : "l"]: t.value};
  if (t.id === "mapai-in") S.mapAiDraft = t.value;
});
