/* ---------- Aufgaben: abhakbare Tagesliste ---------- */
const TK = {day: null, done: null, todos: null, saved: ""};
const tkWeek = () => addDays(todayKey(), -((new Date().getDay() + 6) % 7));
function tkLoad(){
  const t = todayKey();
  if (!TK.done){ const o = store.get("garten.done"); TK.done = o && typeof o === "object" && !Array.isArray(o) ? o : {}; }
  if (!TK.todos) TK.todos = arr(store.get("garten.todos")).filter(x => x && typeof x === "object" && str(x.title)).slice(0, 200)
    .map(x => ({id: str(x.id) || "t" + Date.now().toString(36), title: str(x.title).slice(0, 120), date: str(x.date) || t, every: [7, 14, 30].includes(+x.every) ? +x.every : 0, done: x.done ? str(x.done) : null}));
  if (!TK.day || TK.day.date !== t){
    const d = TK.day ? null : store.get("garten.day");
    TK.day = d && d.date === t && d.tasks && typeof d.tasks === "object" ? d : {date: t, tasks: {}};
    const cut = addDays(t, -120); Object.keys(TK.done).forEach(k => { if (String(TK.done[k]) < cut) delete TK.done[k]; });
    TK.todos = TK.todos.filter(x => !(x.done && x.done < addDays(t, -14)));
  }
}
const tkSaveTodos = () => store.set("garten.todos", TK.todos);
const tkSaveDay = () => { const s = JSON.stringify(TK.day); if (s !== TK.saved){ TK.saved = s; store.set("garten.day", TK.day); } };
const tkDate = k => { const d = parseKey(k); return d.getDate() + "." + (d.getMonth() + 1) + "."; };

/* Aufgaben, die sich aus Pflanzen, Wetter und Eigenem ergeben */
function tkCandidates(){
  const t = todayKey(), out = [];
  const outdoor = S.plants.filter(p => !(AREAS[p.area] || {}).indoor);
  const frost = WX.find(d => d.date >= t && d.date <= addDays(t, 1) && d.min <= 2);
  if (frost && (outdoor.length || MAP().items.length)){
    const when = `Frost ${relDay(frost.date).toLowerCase()} (${nf1.format(frost.min)} °C)`;
    const mapBeds = MAP().items.filter(i => (i.type === "beet" || i.type === "hochbeet") && i.pl.length).map(i => i.name || MTYPES[i.type].l);
    const beds = S.plants.filter(p => p.area === "beet").map(p => p.name).concat(mapBeds), pots = S.plants.filter(p => p.area === "kuebel").map(p => p.name), zier = S.plants.filter(p => p.area === "zier").map(p => p.name);
    if (beds.length) out.push({id: `f:beet:${frost.date}`, kind: "frost", title: "Beete mit Vlies abdecken", sub: `${cut(beds.join(", "), 60)} · ${when}`});
    if (pots.length) out.push({id: `f:kuebel:${frost.date}`, kind: "frost", title: "Kübel ins Haus oder in die Garage stellen", sub: `${cut(pots.join(", "), 60)} · ${when}`});
    if (zier.length) out.push({id: `f:zier:${frost.date}`, kind: "frost", title: "Empfindliche Zierpflanzen schützen", sub: `${cut(zier.join(", "), 60)} · ${when}`});
  }
  S.plants.forEach(p => { const m = model(p); if (m.due === 0) out.push({id: `w:${p.id}:${t}`, kind: "water", title: `${p.name} gießen`, sub: amountText(m) + (!m.pot && m.amountL < 400 ? ` · ${cansText(m.amountL)}` : ""), ref: p.id}); });
  S.plants.filter(p => p.status === "krank" || p.status === "beobachten").forEach(p => out.push({id: `o:${p.id}:${tkWeek()}`, kind: "watch", title: `${p.name} prüfen`, sub: str(p.statusText) || STATUS[p.status], ref: p.id}));
  TK.todos.filter(x => !x.done && x.date <= t).forEach(x => out.push({id: `t:${x.id}:${x.date}`, kind: "own", title: x.title, ref: x.id,
    sub: (x.date < t ? `überfällig seit ${tkDate(x.date)}` : "") + (x.every ? (x.date < t ? " · " : "") + (x.every === 7 ? "jede Woche" : x.every === 14 ? "alle 2 Wochen" : "jeden Monat") : "")}));
  return out;
}
/* Monatsaufgaben aus der Gartenkarte (bleiben bis zum Abhaken stehen) */
function tkMapTasks(){
  if (!MAP().items.some(i => i.pl && i.pl.length)) return [];
  const d = new Date(), ym = d.getFullYear() + "-" + (d.getMonth() + 1);
  return cropTasks(MAP().items, d.getMonth() + 1).map(r => ({id: `m:${r.it}:${r.key}:${r.text}:${ym}`, kind: "karte", title: `${r.crop} ${r.text}`, sub: r.where, color: CROPS[r.key].c}));
}
function tkSync(){
  tkLoad();
  const cand = tkCandidates(), ids = new Set(cand.map(c => c.id)), tasks = TK.day.tasks;
  cand.forEach(c => { if (!tasks[c.id]) tasks[c.id] = {...c, done: false}; else { tasks[c.id].title = c.title; tasks[c.id].sub = c.sub; } });
  Object.keys(tasks).forEach(id => { if (!ids.has(id) && !tasks[id].done) delete tasks[id]; });
  tkSaveDay();
}
const TK_ORDER = {frost: 0, water: 1, watch: 2, own: 3, karte: 4};
function tkList(){
  tkSync();
  const t = todayKey(), all = Object.values(TK.day.tasks).map(x => ({...x}));
  tkMapTasks().forEach(x => { const dn = TK.done[x.id]; if (!dn) all.push({...x, done: false}); else if (dn === t) all.push({...x, done: true}); });
  all.sort((a, b) => (TK_ORDER[a.kind] - TK_ORDER[b.kind]) || a.title.localeCompare(b.title, "de"));
  return {open: all.filter(x => !x.done), done: all.filter(x => x.done)};
}
const TK_COL = {frost: "var(--bad)", water: "var(--water)", watch: "var(--sun)", own: "var(--ink-2)"};
function tkRow(x){
  const p = x.ref && (x.kind === "water" || x.kind === "watch") ? plantById(x.ref) : null;
  const more = !x.done && p ? (x.kind === "water" ? `<div class="tk-more">${howHTML(p, model(p))}</div>` : `<div class="tk-more"><button class="btn sm" data-act="open" data-id="${esc(p.id)}">Was tun?</button></div>`) : "";
  return `<div class="tk${x.done ? " done" : ""}" style="--tkc:${x.color || TK_COL[x.kind] || "var(--ink-2)"}">
    <div class="tk-top"><button class="tk-main" role="checkbox" aria-checked="${x.done ? "true" : "false"}" data-act="tk" data-id="${esc(x.id)}"><span class="tk-chk">${x.done ? I.check : ""}</span><span class="tk-body"><span class="tk-t">${esc(x.title)}</span>${x.sub ? `<span class="tk-s">${esc(x.sub)}</span>` : ""}</span></button>${x.kind === "own" ? `<button class="iconbtn sm tk-x" data-act="tk-del" data-id="${esc(x.id)}" aria-label="Aufgabe löschen">×</button>` : ""}</div>${more}</div>`;
}
function tasksSectionHTML(){
  if (S.mode === "loading") return `<section class="sec"><div class="sec-head"><h2>Heute zu tun</h2></div><div class="empty-task">${I.leaf}<span>Garten wird geladen …</span></div></section>`;
  tkLoad();
  if (!S.plants.length && !MAP().items.length && !TK.todos.length) return `<section class="sec"><div class="sec-head"><h2>Heute zu tun</h2><span class="count">0 Aufgaben</span></div><div class="card"><h3>So startest du</h3><ol class="steps">
          <li class="done"><div><b>Standort gespeichert</b><span>${esc(place())}</span></div></li>
          <li class="on"><div><b>Erste Pflanze anlegen</b><span>Zum Beispiel deinen Rasen oder ein Gemüsebeet. Miss dazu Länge und Breite in Metern.</span></div></li>
          <li><div><b>Profi-Pflegeplan erstellen lassen</b><span>In der Pflanze auf „Profi-Pflegeplan“ tippen.</span></div></li></ol>
          <div class="btn-row"><button class="btn primary" data-act="add">${I.plus}Pflanze anlegen</button><button class="btn" data-act="tab" data-tab="foto">${I.cam}Pflanze fotografieren</button></div></div>
          <div class="btn-row"><button class="btn sm" data-act="todo-add">${I.plus}Eigene Aufgabe</button></div></section>`;
  const L = tkList(), n = L.open.length + L.done.length, pct = n ? Math.round(L.done.length / n * 100) : 0;
  return `<section class="sec"><div class="sec-head"><h2>Heute zu tun</h2><span class="count">${n ? `${L.done.length} von ${n} erledigt` : "0 Aufgaben"}</span></div>
    ${n ? `<div class="tk-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : ""}
    <div class="tk-list">
      ${L.open.map(tkRow).join("")}
      ${n && !L.open.length ? `<div class="empty-task">${I.check}<span>Alles erledigt für heute. Gut gemacht.</span></div>` : ""}
      ${!n ? `<div class="empty-task">${I.check}<span>${S.plants.length ? "Heute muss nichts gegossen werden. Im Boden ist noch genug Wasser." : "Heute steht nichts an. Lege Pflanzen an oder trage Pflanzen in die Beete auf der Karte ein, dann erscheinen hier deine Aufgaben."}</span></div>` : ""}
      ${L.done.length ? `<div class="tk-sep">Erledigt</div>${L.done.map(tkRow).join("")}` : ""}
    </div>
    <div class="btn-row"><button class="btn sm" data-act="todo-add">${I.plus}Eigene Aufgabe</button></div></section>`;
}
/* Monatsliste für den Kalender (gleiche Haken wie auf „Heute“) */
function mapTasksSection(title){
  tkLoad(); const rows = tkMapTasks(); if (!rows.length) return "";
  const open = rows.filter(r => !TK.done[r.id]).length;
  return `<section class="sec"><div class="sec-head"><h2>${esc(title)}</h2><span class="count">${open} offen</span></div><div class="tk-list">${rows.slice(0, 20).map(r => tkRow({...r, done: !!TK.done[r.id]})).join("")}</div>
    <div class="btn-row"><button class="btn sm" data-act="map-open">Auf der Karte ansehen</button></div></section>`;
}

/* ----- Abhaken ----- */
async function tkToggle(id){
  tkSync();
  const t = todayKey(), task = TK.day.tasks[id];
  if (!task){
    if (!tkMapTasks().some(x => x.id === id)) return;
    if (TK.done[id]) delete TK.done[id]; else { TK.done[id] = t; toast("Erledigt"); }
    store.set("garten.done", TK.done); render(); return;
  }
  const todo = task.kind === "own" ? TK.todos.find(x => x.id === task.ref) : null, p = task.kind === "water" ? plantById(task.ref) : null;
  if (!task.done){
    task.done = true; task.at = Date.now();
    if (todo){ task.ownDate = todo.date; if (todo.every) todo.date = addDays(t, todo.every); else todo.done = t; tkSaveTodos(); }
    tkSaveDay();
    if (p){ task.prev = p.lastWatered || ""; tkSaveDay(); await waterNow(p.id); } else { toast("Erledigt"); render(); }
  } else {
    task.done = false;
    if (todo){ if (todo.every) todo.date = task.ownDate || t; else todo.done = null; tkSaveTodos(); }
    tkSaveDay();
    if (p) await updatePlant(p.id, {lastWatered: task.prev || "", history: arr(p.history).filter((h, i) => !(i === 0 && h && h.type === "wasser" && h.date === t))});
    else render();
  }
}
function todoSheet(head){
  const t = todayKey();
  return `${head("Eigene Aufgabe")}
    <div class="field"><label for="td-title">Was ist zu tun?</label><input id="td-title" type="text" autocomplete="off" maxlength="120" placeholder="z. B. Rasen mähen, Laub rechen, Kompost wenden"></div>
    <div class="grid2">
      <div class="field"><label for="td-date">Fällig am</label><input id="td-date" type="date" value="${t}" min="${t}"></div>
      <div class="field"><label for="td-every">Wiederholen</label><select id="td-every"><option value="0">Einmalig</option><option value="7">Jede Woche</option><option value="14">Alle 2 Wochen</option><option value="30">Jeden Monat</option></select></div>
    </div>
    ${S.sheetErr ? `<div class="err">${esc(S.sheetErr)}</div>` : ""}
    <div class="btn-row"><button class="btn primary" data-act="todo-save">${I.check}Speichern</button></div>`;
}
function tkAct(a, b){
  switch (a){
    case "tk": tkToggle(b.dataset.id); break;
    case "tk-del": { tkLoad(); const tid = b.dataset.id, task = TK.day.tasks[tid]; if (!task) break;
      TK.todos = TK.todos.filter(x => x.id !== task.ref); delete TK.day.tasks[tid]; tkSaveTodos(); tkSaveDay(); toast("Aufgabe gelöscht"); render(); break; }
    case "todo-add": S.sheetErr = ""; openSheet({type: "todo"}); setTimeout(() => { const e = document.getElementById("td-title"); if (e) e.focus(); }, 80); break;
    case "todo-save": {
      tkLoad(); const title = str(document.getElementById("td-title").value).trim(), date = document.getElementById("td-date").value || todayKey(), every = +document.getElementById("td-every").value || 0;
      if (!title){ S.sheetErr = "Bitte schreib auf, was zu tun ist."; renderSheet(); break; }
      TK.todos.push({id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), title, date: date < todayKey() ? todayKey() : date, every, done: null});
      tkSaveTodos(); S.sheetErr = ""; closeSheet(); render(); toast(date > todayKey() ? "Aufgabe für " + tkDate(date) + " gespeichert" : "Aufgabe gespeichert"); break; }
  }
}
