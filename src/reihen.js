/* ---------- Reihen im Beet und Pflanzbuch ---------- */
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const mapIsBed = it => !!it && (it.type === "beet" || it.type === "hochbeet");
const GK_CUSTOM = {n: "Eigene Pflanze", fam: "sonst", sp: 30, rw: 30, z: "m", sun: "h", gut: [], schl: [], c: "#6aa04e", t: "k"};
const rowId = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const okDate = v => { v = str(v); if (!ISO_RE.test(v)) return ""; const d = parseKey(v); return isNaN(d) || keyOf(d) !== v ? "" : v; };
const rowCrop = r => CROPS[r.key] || {...GK_CUSTOM, n: r.name || GK_CUSTOM.n};
const rowName = r => CROPS[r.key] ? CROPS[r.key].n : (r.name || "Eigene Pflanze");
function rowNorm(o){
  o = o && typeof o === "object" ? o : {};
  const key = CROPS[o.key] ? o.key : "", name = key ? "" : str(o.name).slice(0, 40);
  if (!key && !name) return null;
  return {id: str(o.id) || rowId(), key, name, date: okDate(o.date), end: okDate(o.end), note: str(o.note).slice(0, 200), pos: clamp(Math.round(+o.pos) || 0, 0, 29)};
}
/* aktive Reihen belegen jeweils einen eigenen Platz (pos) im Beet */
function rowsFix(rows){
  const used = new Set();
  rows.forEach(r => { if (r.end) return; while (used.has(r.pos) && r.pos < 29) r.pos++; used.add(r.pos); });
  return rows;
}
const rowsAct = it => (it.rows || []).filter(r => !r.end).sort((a, b) => a.pos - b.pos);
const mapCropNames = it => mapIsBed(it) ? [...new Set(rowsAct(it).map(rowName))] : (it.pl || []).map(k => CROPS[k] ? CROPS[k].n : "").filter(Boolean);
/* Aufteilung des Beets in Reihen: lange Seite = Reihenrichtung, Reihe 1 liegt oben (bzw. links) */
function rowLayout(it){
  const wm = gkWall(it), iw = Math.max(.1, it.w - 2 * wm), ih = Math.max(.1, it.h - 2 * wm);
  const horiz = iw >= ih, along = horiz ? iw : ih, across = horiz ? ih : iw;
  const act = rowsAct(it), slots = act.length ? act[act.length - 1].pos + 1 : 0, stripe = slots ? across / slots : across;
  const list = act.map(r => {
    const c = rowCrop(r), nAlong = Math.max(1, Math.floor(along * 100 / c.sp)), rwCm = Math.round(stripe * 100);
    return {r, pos: r.pos, c, nAlong, stepA: along / nAlong, count: nAlong, rwCm, narrow: slots > 1 && rwCm < c.rw * .8};
  });
  return {horiz, along, across, slots, stripe, list, wm, iw, ih};
}
function rowAt(it, lx, ly, ppm){
  const L = rowLayout(it); if (!L.slots) return null;
  const v = (L.horiz ? ly : lx) - L.wm * ppm, pos = Math.floor(v / (L.stripe * ppm));
  if (v < 0 || pos < 0 || pos >= L.slots) return null;
  const e = L.list.find(x => x.pos === pos); return e ? e.r.id : null;
}

/* ----- Datum ----- */
const fdate = k => { const d = parseKey(k); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };
function rowAgo(k){
  if (!k) return "";
  const d = Math.round((parseKey(todayKey()) - parseKey(k)) / 864e5);
  if (d < 0) return `in ${-d} ${d === -1 ? "Tag" : "Tagen"}`;
  if (d === 0) return "heute";
  if (d === 1) return "gestern";
  if (d < 14) return `vor ${d} Tagen`;
  if (d < 60) return `vor ${Math.round(d / 7)} Wochen`;
  return `vor ${Math.round(d / 30.4)} Monaten`;
}
function monRange(ms){
  if (!ms || !ms.length) return "";
  const has = new Set(ms), nx = m => m === 12 ? 1 : m + 1, pv = m => m === 1 ? 12 : m - 1;
  let st = ms.find(m => !has.has(pv(m)));
  if (st == null) st = ms[0];
  let e = st, n = 0; while (has.has(nx(e)) && n++ < 12) e = nx(e);
  const nm = m => MON[m - 1].slice(0, 3);
  return st === e ? nm(st) : `${nm(st)} bis ${nm(e)}`;
}
const rowHarvest = r => { const c = rowCrop(r); return c.ern ? "Ernte " + monRange(c.ern) : ""; };

/* ----- Beet-Panel: Reihenliste ----- */
function rowItemHTML(it, e){
  const r = e.r, sel = S.rowSel === r.id, c = e.c;
  const sub = [r.date ? `gepflanzt ${fdate(r.date)} · ${rowAgo(r.date)}` : "Pflanzdatum offen", `ca. ${e.count} ${e.count === 1 ? "Pflanze" : "Pflanzen"}`, rowHarvest(r)].filter(Boolean).join(" · ");
  return `<div class="gk-rw${sel ? " sel" : ""}"><button class="gk-rwb" data-act="row-sel" data-id="${esc(it.id)}" data-r="${esc(r.id)}" aria-pressed="${sel}"><span class="gk-rn">${e.pos + 1}</span><i style="background:${c.c}"></i><span class="t"><b>${esc(rowName(r))}</b><span class="muted small">${esc(sub)}</span></span></button>
    ${sel ? `${r.note ? `<p class="muted small" style="margin:0 0 0 38px">${esc(r.note)}</p>` : ""}<div class="btn-row" style="margin-left:38px"><button class="btn sm" data-act="row-edit" data-id="${esc(it.id)}" data-r="${esc(r.id)}">Bearbeiten</button><button class="btn sm" data-act="row-harvest" data-id="${esc(it.id)}" data-r="${esc(r.id)}">Abgeerntet</button></div>` : ""}</div>`;
}
function rowsPanelHTML(it){
  const L = rowLayout(it), done = (it.rows || []).filter(r => r.end).length;
  return `<div class="gk-rows"><div class="lbl">Reihen${L.slots ? ` <span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0">· Reihe 1 liegt ${L.horiz ? "oben" : "links"}</span>` : ""}</div>
    ${L.list.length ? L.list.map(e => rowItemHTML(it, e)).join("") : `<p class="hint" style="margin:0">Noch nichts eingepflanzt. Trage Reihe für Reihe ein, mit Datum.</p>`}
    <div class="btn-row"><button class="btn primary sm" data-act="row-new" data-id="${esc(it.id)}">${I.plus}Reihe pflanzen</button>${done ? `<button class="btn sm" data-act="book">Abgeerntet: ${done}</button>` : ""}</div></div>`;
}

/* ----- Sheet: Reihe anlegen/bearbeiten ----- */
function rowFreePos(it, except){
  const used = new Set(rowsAct(it).filter(r => r.id !== except).map(r => r.pos));
  let p = 0; while (used.has(p)) p++; return p;
}
function rowSheet(head){
  const it = mapItem(S.sheet.id), s = S.sheet; if (!it){ S.sheet = null; return ""; }
  const r = s.r ? (it.rows || []).find(x => x.id === s.r) : null;
  if (s.r && !r){ S.sheet = null; return ""; }
  const pos = r && !r.end ? r.pos : rowFreePos(it, r && r.id), act = rowsAct(it), n = Math.max(pos + 1, act.length ? act[act.length - 1].pos + 2 : 1, 3);
  const opt = Array.from({length: Math.min(n, 30)}, (_, i) => {
    const o = act.find(x => x.pos === i && (!r || x.id !== r.id));
    return `<option value="${i}" ${i === pos ? "selected" : ""} ${o ? "disabled" : ""}>Reihe ${i + 1}${o ? " (belegt: " + esc(rowName(o)) + ")" : ""}</option>`;
  }).join("");
  const key = r ? r.key : "", custom = r && !r.key ? r.name : "", date = r ? r.date : (s.date || todayKey());
  return `${head(r ? `Reihe ${(r.end ? r.pos : pos) + 1} bearbeiten` : "Reihe pflanzen")}
    <p class="muted small" style="margin:0">${esc(it.name || MTYPES[it.type].l)}${r && r.end ? " · abgeerntet" : ""}</p>
    ${r && r.end ? "" : `<div class="field"><label for="mr-pos">Welche Reihe?</label><select id="mr-pos">${opt}</select><p class="hint">Reihe 1 liegt ${rowLayout(it).horiz ? "oben" : "links"} im Beet, die weiteren folgen ${rowLayout(it).horiz ? "nach unten" : "nach rechts"}.</p></div>`}
    <div class="field"><span class="lbl">Was pflanzt du?</span>
      ${Object.entries(CGROUP).map(([g, gn]) => `<div class="gk-cg"><span class="lbl">${gn}</span><div class="gk-cpl">${CROP_KEYS.filter(k => CROPS[k].g === g).map(k => `<label class="gk-cpc"><input type="radio" name="mr-crop" class="gk-rc" value="${k}" ${k === key ? "checked" : ""}><span><i style="background:${CROPS[k].c}"></i>${esc(CROPS[k].n)}</span></label>`).join("")}</div></div>`).join("")}
      <label for="mr-name" class="lbl" style="margin-top:6px">Oder eigene Pflanze</label><input id="mr-name" type="text" autocomplete="off" maxlength="40" placeholder="z. B. Mairübchen" value="${esc(custom)}"></div>
    <div class="field"><label for="mr-date">Gepflanzt am</label><input id="mr-date" type="date" value="${esc(date)}"><p class="hint">Leer lassen, wenn du das Datum nicht mehr weißt.</p></div>
    ${r && r.end ? `<div class="field"><label for="mr-end">Abgeerntet am</label><input id="mr-end" type="date" value="${esc(r.end)}"></div>` : ""}
    <div class="field"><label for="mr-note">Notiz</label><textarea id="mr-note" placeholder="z. B. Sorte, Saatgut oder Jungpflanzen aus dem Gartencenter">${esc(r ? r.note : "")}</textarea></div>
    ${r ? "" : `<label class="gk-next"><input type="checkbox" id="mr-next" ${s.next ? "checked" : ""}> Danach gleich die nächste Reihe anlegen</label>`}
    <div class="err" id="mr-err" hidden></div>
    <div class="btn-row"><button class="btn primary" data-act="row-save">${I.check}Speichern</button>${r && !r.end ? `<button class="btn" data-act="row-harvest" data-id="${esc(it.id)}" data-r="${esc(r.id)}">Abgeerntet, Reihe frei</button>` : ""}</div>
    ${r ? (s.confirmDelete ? `<div class="confirm"><span>Reihe aus dem Pflanzbuch löschen? Der Eintrag ist dann weg.</span><div class="btn-row"><button class="btn danger" data-act="row-del-yes">Endgültig löschen</button><button class="btn ghost" data-act="row-del-no">Abbrechen</button></div></div>`
      : `<button class="btn ghost" data-act="row-del" style="align-self:flex-start;color:var(--bad)">Eintrag löschen</button>`) : ""}`;
}
function rowCommit(it){ it.pl = []; Object.assign(it, mapNormItem(it, MAP())); mapSave(); }
function mapSaveRow(){
  const s = S.sheet, it = mapItem(s.id); if (!it) return;
  const v = id => { const e = document.getElementById(id); return e ? e.value : ""; };
  const err = t => { const e = document.getElementById("mr-err"); if (e){ e.textContent = t; e.hidden = false; e.scrollIntoView({block: "nearest"}); } };
  const radio = document.querySelector(".gk-rc:checked"), custom = str(v("mr-name")).slice(0, 40), key = radio ? radio.value : "";
  if (!key && !custom) return err("Wähle eine Pflanze aus oder trage eine eigene ein.");
  const date = str(v("mr-date")); if (date && !okDate(date)) return err("Das Datum ist ungültig.");
  const r = s.r ? it.rows.find(x => x.id === s.r) : null, endV = r && r.end ? str(v("mr-end")) : "";
  if (r && r.end && !okDate(endV)) return err("Bitte das Datum der Ernte eintragen.");
  const pos = r && r.end ? r.pos : parseInt(v("mr-pos"), 10);
  if (!(pos >= 0)) return err("Wähle eine Reihe.");
  if (!(r && r.end) && rowsAct(it).some(x => x.pos === pos && (!r || x.id !== r.id))) return err(`Reihe ${pos + 1} ist schon belegt. Wähle eine freie Reihe.`);
  const upd = {key, name: key ? "" : custom, date, note: str(v("mr-note")), pos};
  let row;
  if (r){ Object.assign(r, upd, {end: r.end ? endV : ""}); row = r; }
  else { row = rowNorm({...upd, id: ""}); it.rows = (it.rows || []).concat([row]); }
  rowCommit(it);
  const next = !r && !!(document.getElementById("mr-next") || {}).checked;
  S.rowSel = row.id; S.mapSel = it.id; S.sheetErr = ""; closeSheet(); render();
  toast(`Reihe ${pos + 1}: ${rowName(row)} gespeichert`);
  if (next) openSheet({type: "maprow", id: it.id, r: "", date, next: true});
}
function rowAct(a, b){
  const id = b.dataset.id, it = mapItem(id);
  switch (a){
    case "row-new": if (it){ S.mapSel = id; openSheet({type: "maprow", id, r: ""}); } break;
    case "row-edit": if (it) openSheet({type: "maprow", id, r: b.dataset.r}); break;
    case "row-sel": S.rowSel = S.rowSel === b.dataset.r ? null : b.dataset.r; mapRedraw(); break;
    case "row-harvest": {
      const r = it && it.rows.find(x => x.id === (b.dataset.r || (S.sheet && S.sheet.r)));
      if (!r) break;
      r.end = todayKey(); const n = r.pos + 1, nm = rowName(r); rowCommit(it); if (S.rowSel === r.id) S.rowSel = null;
      if (S.sheet) S.sheet = null; renderSheet(); render(); toast(`Reihe ${n} (${nm}) abgeerntet. Steht im Pflanzbuch.`); break; }
    case "row-save": mapSaveRow(); break;
    case "row-del": S.sheet.confirmDelete = true; renderSheet(); break;
    case "row-del-no": S.sheet.confirmDelete = false; renderSheet(); break;
    case "row-del-yes": {
      const m = mapItem(S.sheet.id); if (!m) break;
      m.rows = m.rows.filter(x => x.id !== S.sheet.r); rowCommit(m); if (S.rowSel === S.sheet.r) S.rowSel = null;
      closeSheet(); render(); toast("Eintrag gelöscht"); break; }
    case "book": openSheet({type: "book"}); break;
  }
}
/* Auswahl: entweder Pflanze oder eigener Name (nie beides) */
document.addEventListener("change", e => {
  const t = e.target;
  if (t && t.classList && t.classList.contains("gk-rc")){ const n = document.getElementById("mr-name"); if (n) n.value = ""; }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t && t.id === "mr-name" && t.value) document.querySelectorAll(".gk-rc:checked").forEach(r => { r.checked = false; });
});

/* ----- Pflanzbuch: alles, was eingepflanzt ist ----- */
function bookData(){
  return MAP().items.filter(mapIsBed).sort((a, b) => (a.name || "").localeCompare(b.name || "", "de")).map(it => ({it, act: rowsAct(it), done: (it.rows || []).filter(r => r.end).sort((a, b) => b.end.localeCompare(a.end))}));
}
function bookCount(){ return bookData().reduce((n, d) => n + d.act.length, 0); }
function bookHTML(){
  const D = bookData();
  if (!D.length) return `<div class="empty-task">${GL.sprout}<span>Lege ein Beet oder Hochbeet auf der Karte an. Dort trägst du dann Reihe für Reihe ein, was du pflanzt.</span></div>`;
  const n = bookCount(), beds = D.filter(d => d.act.length).length, kinds = new Set(D.flatMap(d => d.act.map(r => rowName(r))));
  let out = `<p class="muted small" style="margin:0">${n ? `${n} ${n === 1 ? "Reihe" : "Reihen"} in ${beds} ${beds === 1 ? "Beet" : "Beeten"} · ${kinds.size} ${kinds.size === 1 ? "Sorte" : "Sorten"}` : "Noch nichts eingepflanzt. Tippe bei einem Beet auf „Reihe pflanzen“."}</p>`;
  D.filter(d => d.act.length || d.done.length).forEach(({it, act, done}) => {
    const L = rowLayout(it), byPos = {}; L.list.forEach(e => byPos[e.r.id] = e);
    out += `<div class="gk-bk"><div class="gk-bkh"><span class="t"><b>${esc(it.name || MTYPES[it.type].l)}</b><span class="muted small">${fm(it.w)} × ${fm(it.h)} m</span></span><button class="btn sm" data-act="row-new" data-id="${esc(it.id)}">${I.plus}Reihe</button></div>`;
    out += act.map(r => { const e = byPos[r.id], sub = [r.date ? `gepflanzt ${fdate(r.date)} · ${rowAgo(r.date)}` : "Pflanzdatum offen", rowHarvest(r)].filter(Boolean).join(" · ");
      return `<button class="gk-rwb" data-act="row-edit" data-id="${esc(it.id)}" data-r="${esc(r.id)}"><span class="gk-rn">${r.pos + 1}</span><i style="background:${e.c.c}"></i><span class="t"><b>${esc(rowName(r))}</b><span class="muted small">${esc(sub)}${r.note ? " · " + esc(cut(r.note, 40)) : ""}</span></span></button>`; }).join("");
    if (done.length) out += `<div class="lbl" style="margin-top:6px">Abgeerntet</div>` + done.map(r => `<button class="gk-rwb done" data-act="row-edit" data-id="${esc(it.id)}" data-r="${esc(r.id)}"><span class="gk-rn">${r.pos + 1}</span><i style="background:${rowCrop(r).c}"></i><span class="t"><b>${esc(rowName(r))}</b><span class="muted small">${r.date ? fdate(r.date) : "?"} bis ${fdate(r.end)}</span></span></button>`).join("");
    out += `</div>`;
  });
  const empty = D.filter(d => !d.act.length && !d.done.length).map(d => d.it.name || MTYPES[d.it.type].l);
  if (empty.length) out += `<p class="muted small" style="margin:0">Noch leer: ${esc(empty.join(", "))}</p>`;
  return out;
}
function bookSheet(head){ return `${head("Pflanzbuch")}${bookHTML()}`; }
