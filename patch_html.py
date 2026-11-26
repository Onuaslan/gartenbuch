#!/usr/bin/env python3
"""Macht aus dem Claude-Artifact die eigenständige Android-Version.
Jede Ersetzung muss genau einmal (oder wie angegeben) treffen, sonst bricht das Skript ab."""
import re, sys

src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()


def sub(old, new, count=1):
    global h
    n = h.count(old)
    if n != count:
        sys.exit(f"FEHLER: {n}x gefunden statt {count}x: {old[:90]!r}")
    h = h.replace(old, new)


BTN = '<br><button class="btn sm" data-act="settings" style="margin-top:8px">Einstellungen öffnen</button>'

# 1) Claude-Meta entfernen, Theme-Vorgabe der App (hell/dunkel) früh setzen
sub('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
sub('<head><meta charset=utf8>',
    '<head><meta charset=utf8><script>(function(){var m=/[?&]theme=(dark|light)/.exec(location.search);if(m)document.documentElement.setAttribute("data-theme",m[1]);})();</script>')

# 2) Wetter über Open-Meteo statt Claude-Hintergrundaufgabe
sub('''  if (S.mode !== "db"){ S.fireNote = "Wetterdaten gibt es nur, wenn du das Gartenbuch in der Claude-App öffnest."; render(); return; }''',
    '''  if (S.mode !== "db"){ await loadWeatherOM(); return; }''')
sub('''${weatherOk() && S.mode === "db" ? `<button class="btn ghost sm"''', '''${weatherOk() ? `<button class="btn ghost sm"''')
sub('''case "refresh-weather": requestWeather().then(() => { if (!S.fireNote) toast("Wetter wird aktualisiert – dauert 1–3 Minuten"); }); break;''',
    '''case "refresh-weather": toast("Wetter wird geladen …"); requestWeather().then(() => { if (!S.fireNote && weatherOk()) toast("Wetter aktualisiert"); }); break;''')

# 3) Boot: gespeicherte Daten laden, KI-Zugang prüfen, Wetter bei Bedarf aktualisieren
sub('S.bedplan = store.get("garten.bedplan") || null; render();\n}',
    'S.bedplan = store.get("garten.bedplan") || null; S.weather = store.get("garten.weather") || null; S.sample = aiKey() ? makeSample() : null; S.imgOk = !!S.sample; render(); maybeRefreshWeather();\n}')

# 4) Texte ohne Claude-Bezug / mit Hinweis auf den API-Schlüssel
sub('''const banner = S.mode === "local" ? `<div class="banner">Gespeichert nur in diesem Browser. In der Claude-App geöffnet, landen deine Pflanzen in deinem privaten Gartenbuch.</div>` : "";''',
    '''const banner = "";''')
sub('Die Foto-Analyse funktioniert, wenn du das Gartenbuch in der Claude-App öffnest.',
    'Für die Foto-Analyse brauchst du einen eigenen API-Schlüssel. Fotos kannst du auch ohne Analyse bei einer Pflanze speichern.' + BTN)
sub('Die Analyse ist nur in der Claude-App verfügbar. Das Foto kannst du trotzdem zu einer Pflanze speichern.',
    'Für die Analyse brauchst du einen eigenen API-Schlüssel. Das Foto kannst du trotzdem zu einer Pflanze speichern.' + BTN)
sub('Der Pflegeplan wird in der Claude-App erstellt. Öffne das Gartenbuch dort.',
    'Für den Pflegeplan brauchst du einen eigenen API-Schlüssel.' + BTN)
sub('Der Beetplan wird in der Claude-App erstellt.',
    'Für den Beetplan brauchst du einen eigenen API-Schlüssel.' + BTN)
KEYERR = 'Der API-Schlüssel fehlt, wird abgelehnt oder das Guthaben ist aufgebraucht. Prüfe ihn in den Einstellungen.'
sub('Du hast Claude für diese Seite nicht erlaubt. Das lässt sich im Menü der Seite unter Berechtigungen ändern.', KEYERR, 2)
sub('Die Analyse wurde nicht erlaubt. Du kannst sie im Menü dieser Seite unter Berechtigungen freigeben.', KEYERR)
sub('Sie erkennt Krankheiten auf Fotos und erstellt für jede Pflanze einen Profi-Pflegeplan mit Dünger, Erde und Mengen.',
    'Jeden Morgen sagt dir eine Nachricht, was heute zu tun ist. Mit eigenem API-Schlüssel erkennt sie auch Krankheiten auf Fotos und schreibt dir Pflegepläne.')
sub('Damit holt die App das Wetter für deinen Ort.', 'Damit holt die App das Wetter für deinen Ort (Internet nötig).')

sub('autocomplete="street-address"', 'autocomplete="off"', 2)

# 5) Icon, Einstellungen-Knopf, Sheet, Klick-Fälle, Render-Hook
sub('/* ---------- helpers ---------- */',
    '''I.sliders = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
/* ---------- helpers ---------- */''')
sub('''    <button class="iconbtn" data-act="help" aria-label="So funktioniert die App">${I.help}</button>
  </header>''',
    '''    <div style="display:flex;gap:8px"><button class="iconbtn" data-act="settings" aria-label="Einstellungen">${I.sliders}</button><button class="iconbtn" data-act="help" aria-label="So funktioniert die App">${I.help}</button></div>
  </header>''')
sub('  } else if (S.sheet.type === "help"){', '  } else if (S.sheet.type === "settings"){ inner = settingsSheet(head);\n  } else if (S.sheet.type === "help"){')
sub('    case "help": openSheet({type:"help"}); break;',
    '''    case "help": openSheet({type:"help"}); break;
    case "settings": S.keyMsg = null; openSheet({type:"settings"}); break;
    case "key-save": saveKey(); break;
    case "key-del": store.set("garten.apikey", ""); S.sample = null; S.imgOk = false; S.keyMsg = {ok:true, text:"Schlüssel gelöscht."}; render(); renderSheet(); break;
    case "rem-test": testNow(); break;''')
sub('function render(){\n  prepWeather();', 'function render(){\n  prepWeather(); syncSummary();')

# 6) Neuer Block: Wetter, KI-Zugang, Morgen-Nachricht
BLOCK = r'''
/* ---------- Wetter über Open-Meteo (eigenständige Version) ---------- */
let wxCurrent = null;
const wxCond = c => c === 0 ? "Klar" : c <= 2 ? "Heiter" : c === 3 ? "Bedeckt" : (c === 45 || c === 48) ? "Nebel" : (c >= 51 && c <= 57) ? "Nieselregen" : (c >= 61 && c <= 67) ? "Regen" : (c >= 71 && c <= 77) ? "Schnee" : (c >= 80 && c <= 82) ? "Regenschauer" : (c === 85 || c === 86) ? "Schneeschauer" : c >= 95 ? "Gewitter" : "";
async function fetchJSON(url, ms){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 15000);
  try { const r = await fetch(url, {signal: ctl.signal}); if (!r.ok) throw new Error("http " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
const COUNTRY_WORD = /^(österreich|oesterreich|austria|deutschland|germany|schweiz|switzerland|türkei|türkiye|turkey|at|de|ch|tr)$/i;
function geoCandidates(address){
  const a = str(address).replace(/\s+/g, " ");
  const toks = a.replace(/[,;()]/g, " ").split(" ").map(w => w.replace(/^[-–.]+|[-–.]+$/g, "")).filter(w => w && !/\d/.test(w) && !COUNTRY_WORD.test(w));
  const names = [], add = n => { n = n.trim(); if (n.length >= 2 && !names.includes(n)) names.push(n); };
  add(toks.join(" "));
  for (let i = 1; i < Math.min(toks.length, 4); i++) add(toks.slice(i).join(" "));
  for (let n = toks.length - 1; n >= 1; n--) add(toks.slice(0, n).join(" "));
  toks.forEach(add);
  return names.slice(0, 8);
}
async function geocodeAddress(address){
  const a = str(address).replace(/\s+/g, " "), plz = (a.match(/\b\d{4,5}\b/) || [])[0] || "";
  for (const name of geoCandidates(a)){
    const j = await fetchJSON("https://geocoding-api.open-meteo.com/v1/search?count=10&language=de&format=json&name=" + encodeURIComponent(name));
    const rs = arr(j && j.results).filter(r => !/^(ADM|PCL|CONT|RGN|TERR)/.test(r.feature_code || "")); if (!rs.length) continue;
    return (plz && rs.find(r => arr(r.postcodes).includes(plz))) || rs.find(r => r.country_code === "AT") || rs[0];
  }
  return null;
}
function loadWeatherOM(quiet){
  if (wxCurrent) return wxCurrent;
  if (!S.loc || !S.loc.address) return Promise.resolve();
  wxCurrent = fetchWeatherOM(quiet).catch(() => {}).then(() => { wxCurrent = null; });
  return wxCurrent;
}
async function fetchWeatherOM(quiet){
  const addr = S.loc.address;
  try {
    let lat = +S.loc.lat, lon = +S.loc.lon, label = S.loc.label;
    if (!(isFinite(lat) && isFinite(lon) && lat && lon && S.loc.geoFor === addr)){
      const hit = await geocodeAddress(addr);
      if (!hit){
        S.loc = {...S.loc, status: "error", statusText: "Den Ort kenne ich nicht. Gib am besten nur den Ortsnamen ein, z. B. „Weikendorf“."};
        store.set("garten.loc", S.loc); render(); return;
      }
      lat = hit.latitude; lon = hit.longitude; label = hit.name;
    }
    const j = await fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=8&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum`);
    const d = j && j.daily; if (!d || !arr(d.time).length) throw new Error("keine Daten");
    const days = d.time.map((date, i) => {
      const sum = +d.precipitation_sum[i] || 0, pp = d.precipitation_probability_max[i];
      return {date, max: +d.temperature_2m_max[i], min: +d.temperature_2m_min[i], rainChance: pp == null ? (sum >= 2 ? 70 : sum >= .3 ? 35 : 5) : Math.round(+pp)};
    }).filter(x => isFinite(x.max) && isFinite(x.min));
    if (!days.length) throw new Error("keine Daten");
    if (S.loc.address !== addr) return;
    S.loc = {...S.loc, label, lat, lon, geoFor: addr, status: "ok", statusText: ""};
    S.weather = {days, stand: new Date().toISOString(), forAddress: addr, lat, now: j.current && isFinite(+j.current.temperature_2m) ? {temp: +j.current.temperature_2m, cond: wxCond(+j.current.weather_code)} : null};
    store.set("garten.loc", S.loc); store.set("garten.weather", S.weather);
    S.fireNote = ""; render(); renderSheet();
  } catch (e){
    if (!quiet || !weatherOk()) S.fireNote = "Keine Verbindung zum Wetterdienst. Sobald du Internet hast, tippe auf „Wetter jetzt aktualisieren“ (Reiter Wetter).";
    render();
  }
}
function weatherStale(){
  const age = S.weather && S.weather.stand ? Date.now() - new Date(S.weather.stand).getTime() : Infinity;
  return !weatherOk() || !(age < 3 * 36e5);
}
function maybeRefreshWeather(){
  if (S.mode === "db" || !S.loc || !S.loc.address || S.loc.status === "error") return;
  if (weatherStale()) loadWeatherOM(true);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) maybeRefreshWeather(); });

/* ---------- KI-Zugang mit eigenem Anthropic-API-Schlüssel ---------- */
const AI_MODEL = "claude-sonnet-5-5";
const aiKey = () => str(store.get("garten.apikey"));
function makeSample(){
  return {
    async limits(){ return {images: true}; },
    async json(prompt, opts){
      opts = opts || {};
      const content = [];
      for (const b of arr(opts.images)){
        const url = await blobToDataURL(b);
        content.push({type: "image", source: {type: "base64", media_type: b.type || "image/jpeg", data: String(url).split(",")[1] || ""}});
      }
      content.push({type: "text", text: prompt});
      let r;
      try {
        r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", signal: opts.signal,
          headers: {"content-type": "application/json", "x-api-key": aiKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true"},
          body: JSON.stringify({model: AI_MODEL, max_tokens: 8000, messages: [{role: "user", content}]})
        });
      } catch (e){ throw {code: e && e.name === "AbortError" ? "cancelled" : "network"}; }
      if (r.status === 401 || r.status === 403) throw {code: "not_granted"};
      if (r.status === 429 || r.status === 529) throw {code: "rate_limited"};
      if (r.status === 400){
        let msg = ""; try { msg = JSON.stringify(await r.json()); } catch {}
        throw {code: /credit|balance|billing/i.test(msg) ? "not_granted" : /image/i.test(msg) ? "image_rejected" : "http_400"};
      }
      if (!r.ok) throw {code: "http_" + r.status};
      const j = await r.json();
      const txt = arr(j && j.content).map(c => (c && c.text) || "").join("");
      const m = txt.match(/\{[\s\S]*\}/); if (!m) throw {code: "invalid_json"};
      try { return JSON.parse(m[0]); } catch { throw {code: "invalid_json"}; }
    }
  };
}
async function saveKey(){
  const v = str(document.getElementById("key-in") && document.getElementById("key-in").value);
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(v)){ S.keyMsg = {ok: false, text: "Das sieht nicht nach einem Anthropic-Schlüssel aus. Er beginnt mit „sk-ant-“."}; renderSheet(); return; }
  S.keyMsg = {ok: true, text: "Schlüssel wird geprüft …"}; renderSheet();
  try {
    const r = await fetch("https://api.anthropic.com/v1/models?limit=1", {headers: {"x-api-key": v, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true"}});
    if (r.status === 401 || r.status === 403){ S.keyMsg = {ok: false, text: "Anthropic lehnt diesen Schlüssel ab. Prüfe, ob du ihn vollständig kopiert hast."}; renderSheet(); return; }
  } catch {}
  store.set("garten.apikey", v); S.sample = makeSample(); S.imgOk = true;
  S.keyMsg = {ok: true, text: "Gespeichert. Foto-Diagnose, Pflegepläne und Beetplan sind freigeschaltet."};
  render(); renderSheet();
}

/* ---------- Morgen-Nachricht (Android) ---------- */
const AND = () => window.Android && typeof window.Android.getReminder === "function" ? window.Android : null;
function remState(){
  const a = AND(); if (!a) return {native: false};
  try { return {native: true, ...JSON.parse(a.getReminder())}; } catch { return {native: false}; }
}
const cut = (s, n) => { s = str(s); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; };
function morningText(){
  const t = todayKey(), base = dailySummary(S.plants, t, shopOpen().length).split("\n"), m = parseKey(t).getMonth(), tips = [];
  S.plants.forEach(p => { const j = p.plan && arr(p.plan.jetzt)[0]; if (j) tips.push(`${p.name}: ${cut(j, 120)}`); });
  if (!tips.length){
    if (S.plants.some(isLawn)) tips.push("Rasen: " + cut(CAL[m].r, 130));
    if (S.plants.some(p => p.area === "beet")) tips.push("Gemüse: " + cut(CAL[m].g, 130));
    if (S.plants.some(p => p.area === "kuebel" || (AREAS[p.area] || {}).indoor)) tips.push("Kübel & Drinnen: " + cut(CAL[m].k, 130));
  }
  return {title: base[0], text: base.slice(1).concat(tips.slice(0, 3)).join("\n")};
}
let syncT;
function syncSummary(){
  clearTimeout(syncT);
  syncT = setTimeout(() => {
    const a = AND(); if (!a || typeof a.saveSummary !== "function" || S.mode !== "local") return;
    try { prepWeather(); const m = S.plants.length ? morningText() : {title: "", text: ""}; a.saveSummary(todayKey(), m.title || "", m.text || ""); } catch {}
  }, 1500);
}
function testNow(){ const a = AND(); if (a){ syncSummary(); a.testNow(); toast("Test läuft – die Nachricht kommt in wenigen Sekunden"); } }
/* Aufruf aus Android, wenn die Morgen-Nachricht erzeugt wird (ohne sichtbare Oberfläche) */
window.__morning = async function(){
  try {
    if (S.mode === "loading") goLocal();
    if (S.loc && S.loc.address && S.loc.status !== "error" && weatherStale()) await Promise.race([loadWeatherOM(true), new Promise(r => setTimeout(r, 3500))]);
    prepWeather();
    return JSON.stringify(S.plants.length ? morningText() : {});
  } catch (e){ return "{}"; }
};
window.__remChanged = () => { if (S.sheet && S.sheet.type === "settings") renderSheet(); };
document.addEventListener("change", e => {
  const t = e.target, a = AND(); if (!a || (t.id !== "rem-on" && t.id !== "rem-time")) return;
  const on = document.getElementById("rem-on").checked, tm = (document.getElementById("rem-time").value || "07:00").split(":");
  if (on && a.needsPermission()) a.requestNotificationPermission();
  a.setReminder(on, +tm[0] || 7, +tm[1] || 0);
  syncSummary(); setTimeout(renderSheet, 300);
});
function settingsSheet(head){
  const r = remState(), hasKey = !!aiKey(), km = S.keyMsg;
  return `${head("Einstellungen")}
    <div class="card"><h3>Morgen-Nachricht</h3>
      ${r.native ? `<p class="muted small" style="margin:0">Jeden Morgen kommt eine Nachricht, was heute im Garten zu tun ist: Gießen mit Menge, Frostwarnung, Krankheitsgefahr und die Aufgaben des Monats.</p>
        <label style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="rem-on" ${r.enabled ? "checked" : ""} style="width:22px;height:22px"> Nachricht aktivieren</label>
        <div class="field"><label for="rem-time">Uhrzeit</label><input id="rem-time" type="time" value="${pad(r.hour)}:${pad(r.minute)}"></div>
        ${r.enabled && !r.canNotify ? `<div class="err">Benachrichtigungen sind für die App ausgeschaltet. Schalte sie in den Android-Einstellungen unter Apps, Gartenbuch, Benachrichtigungen ein.</div>` : ""}
        <div class="btn-row"><button class="btn sm" data-act="rem-test">${I.cloud}Test jetzt senden</button></div>
        <p class="hint">Android kann die Nachricht um einige Minuten verschieben. Das Wetter wird dafür vorher kurz aktualisiert, sofern Internet da ist.</p>`
      : `<p class="muted small" style="margin:0">Die Morgen-Nachricht gibt es nur in der installierten Android-App.</p>`}
    </div>
    <div class="card"><h3>Foto-Diagnose und Pflegeplan</h3>
      <p class="muted small" style="margin:0">Dafür braucht die App einen eigenen API-Schlüssel von Anthropic (console.anthropic.com, Bereich „API keys“). Jede Analyse kostet wenige Cent und wird über das Guthaben dort abgerechnet. Der Schlüssel bleibt nur auf diesem Handy.</p>
      <div class="field"><label for="key-in">API-Schlüssel</label><input id="key-in" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${hasKey ? "gespeichert – zum Ändern neu eingeben" : "sk-ant-…"}"></div>
      ${km ? `<div class="${km.ok ? "banner" : "err"}">${esc(km.text)}</div>` : ""}
      <div class="btn-row"><button class="btn primary sm" data-act="key-save">${I.check}Speichern</button>${hasKey ? `<button class="btn danger sm" data-act="key-del">Löschen</button>` : ""}</div>
    </div>`;
}
'''
import os
HERE = os.path.dirname(os.path.abspath(__file__))
MAPJS = "\n".join(open(os.path.join(HERE, "src", f), encoding="utf-8").read() for f in ("pflanzen.js", "kartenzeichner.js", "gartenkarte.js"))
MAPCSS = open(os.path.join(HERE, "src", "gartenkarte.css"), encoding="utf-8").read()
sub('/* ---------- boot ---------- */', BLOCK + "\n" + MAPJS + '\n/* ---------- boot ---------- */')
DESIGNCSS = open(os.path.join(HERE, "src", "design.css"), encoding="utf-8").read()
SPLASH = open(os.path.join(HERE, "src", "splash.html"), encoding="utf-8").read()
sub('\n</style>', DESIGNCSS + MAPCSS + '\n</style>')
sub('\n<div class="app">', SPLASH + '\n<div class="app">')
sub('<link rel="preconnect" href="https://fonts.googleapis.com">\n', '')
sub('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n', '')
h = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?', '', h)

# 7) Gartenkarte: Umschalter Liste/Karte, Sheets, Klick-Fälle, Start
sub('function viewGarten(){', 'function viewGarten(){ return S.mode !== "loading" && S.gview === "karte" ? viewMap() : viewGartenList(); }\nfunction viewGartenList(){')
sub('    ${banner}\n    ${S.plants.length ? `<div class="tools">', '    ${banner}${gToggle()}\n    ${S.plants.length ? `<div class="tools">')
sub('  } else if (S.sheet.type === "help"){',
    '''  } else if (S.sheet.type === "mapadd"){ inner = mapAddSheet(head);
  } else if (S.sheet.type === "mapitem"){ inner = mapItemSheet(head); if (!S.sheet) return;
  } else if (S.sheet.type === "maplot"){ inner = mapLotSheet(head);
  } else if (S.sheet.type === "mapai"){ inner = mapAiSheet(head);
  } else if (S.sheet.type === "help"){''')
sub('    case "tab": setTab(b.dataset.tab); break;',
    '''    case "tab": setTab(b.dataset.tab); break;
    case "gview": case "map-sel": case "map-desel": case "map-add": case "map-new": case "map-edit": case "map-dup": case "map-zoom": case "map-lot": case "map-lot-first": case "map-lot-save":
    case "map-clear": case "map-clear-no": case "map-clear-yes": case "map-import": case "map-item-save": case "map-item-del": case "map-item-del-no": case "map-item-del-yes":
    case "map-ai": case "map-ai-go": case "map-ai-stop": case "map-open": mapAct(a, b); break;''')
sub('  ${shopOpen().length ? `<button class="linkcard" data-act="shop">', '  ${mapTasksSection("Im Garten jetzt dran")}\n  ${shopOpen().length ? `<button class="linkcard" data-act="shop">')
sub('    ${withPlan.length ? `<section class="sec"><div class="sec-head"><h2>In deinem Garten</h2>', '    ${mapTasksSection("Aus deiner Gartenkarte")}\n    ${withPlan.length ? `<section class="sec"><div class="sec-head"><h2>In deinem Garten</h2>')
sub('  renderTabs();\n  if (S.sheet && ["plant"', '  renderTabs(); mapAfterRender();\n  if (S.sheet && ["plant"')
sub('S.weather = store.get("garten.weather") || null;', 'S.weather = store.get("garten.weather") || null; S.map = mapNormalize(store.get("garten.map")); S.gview = store.get("garten.gview") === "karte" ? "karte" : "liste";')

import shutil
shutil.copytree(os.path.join(HERE, "src", "fonts"), os.path.join(os.path.dirname(os.path.abspath(dst)), "fonts"), dirs_exist_ok=True)
open(dst, "w", encoding="utf-8").write(h)
left = [l for l in h.splitlines() if re.search(r"Claude-App|claude\.ai", l)]
print("Rest-Verweise auf Claude-App:", len(left))
for l in left: print("  ", l.strip()[:140])
print("OK ->", dst)
