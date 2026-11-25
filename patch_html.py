#!/usr/bin/env python3
"""Macht aus dem Claude-Artifact eine eigenständige Version für die Android-App.
Jede Ersetzung muss genau einmal treffen, sonst bricht das Skript ab."""
import re, sys

src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()


def sub(old, new, count=1):
    global h
    n = h.count(old)
    if n != count:
        sys.exit(f"FEHLER: {n}x gefunden statt {count}x: {old[:90]!r}")
    h = h.replace(old, new)


# 1) Claude-Meta entfernen, Theme-Vorgabe der App (hell/dunkel) früh setzen
sub('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
sub('<head><meta charset=utf8>',
    '<head><meta charset=utf8><script>(function(){var m=/[?&]theme=(dark|light)/.exec(location.search);if(m)document.documentElement.setAttribute("data-theme",m[1]);})();</script>')

# 2) Wetter: Open-Meteo statt Claude-Hintergrundaufgabe
sub('''  if (S.mode !== "db"){ S.fireNote = "Wetterdaten gibt es nur, wenn du das Gartenbuch in der Claude-App öffnest."; render(); return; }''',
    '''  if (S.mode !== "db"){ await loadWeatherOM(); return; }''')

WEATHER_JS = r'''
/* ---------- Wetter über Open-Meteo (eigenständige Version) ---------- */
let wxBusy = false;
const wxCond = c => c === 0 ? "Klar" : c <= 2 ? "Heiter" : c === 3 ? "Bedeckt" : (c === 45 || c === 48) ? "Nebel" : (c >= 51 && c <= 57) ? "Nieselregen" : (c >= 61 && c <= 67) ? "Regen" : (c >= 71 && c <= 77) ? "Schnee" : (c >= 80 && c <= 82) ? "Regenschauer" : (c === 85 || c === 86) ? "Schneeschauer" : c >= 95 ? "Gewitter" : "";
async function fetchJSON(url, ms){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 15000);
  try { const r = await fetch(url, {signal: ctl.signal}); if (!r.ok) throw new Error("http " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
async function geocodeAddress(address){
  const a = str(address).replace(/\s+/g, " "), plz = (a.match(/\b\d{4,5}\b/) || [])[0] || "";
  const names = [];
  if (plz){ const after = a.slice(a.indexOf(plz) + plz.length).replace(/^[\s,]+/, "").trim(); if (after) names.push(after); }
  a.split(",").map(s => s.trim()).filter(s => s && !/\d/.test(s)).forEach(s => names.push(s));
  if (!names.length){ const n = a.replace(/\d+/g, " ").replace(/\s+/g, " ").trim(); if (n) names.push(n); }
  const seen = new Set();
  for (const name of names){
    if (seen.has(name)) continue; seen.add(name);
    const j = await fetchJSON("https://geocoding-api.open-meteo.com/v1/search?count=10&language=de&format=json&name=" + encodeURIComponent(name));
    const rs = arr(j && j.results); if (!rs.length) continue;
    return (plz && rs.find(r => arr(r.postcodes).includes(plz))) || rs.find(r => r.country_code === "AT") || rs[0];
  }
  return null;
}
async function loadWeatherOM(quiet){
  if (wxBusy || !S.loc || !S.loc.address) return;
  wxBusy = true; const addr = S.loc.address;
  try {
    let lat = +S.loc.lat, lon = +S.loc.lon, label = S.loc.label;
    if (!(isFinite(lat) && isFinite(lon) && lat && lon && S.loc.geoFor === addr)){
      const hit = await geocodeAddress(addr);
      if (!hit){
        S.loc = {...S.loc, status: "error", statusText: "Den Ort kenne ich nicht. Gib Postleitzahl und Ort ein, z. B. „2253 Weikendorf“."};
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
  } finally { wxBusy = false; }
}
function maybeRefreshWeather(){
  if (S.mode === "db" || !S.loc || !S.loc.address || S.loc.status === "error") return;
  const age = S.weather && S.weather.stand ? Date.now() - new Date(S.weather.stand).getTime() : Infinity;
  if (!weatherOk() || !(age < 3 * 36e5)) loadWeatherOM(true);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) maybeRefreshWeather(); });
'''
sub('async function requestWeather(){', WEATHER_JS + '\nasync function requestWeather(){')

sub('''${weatherOk() && S.mode === "db" ? `<button class="btn ghost sm"''', '''${weatherOk() ? `<button class="btn ghost sm"''')
sub('''case "refresh-weather": requestWeather().then(() => { if (!S.fireNote) toast("Wetter wird aktualisiert – dauert 1–3 Minuten"); }); break;''',
    '''case "refresh-weather": toast("Wetter wird geladen …"); requestWeather().then(() => { if (!S.fireNote && weatherOk()) toast("Wetter aktualisiert"); }); break;''')

# 3) Boot: gespeichertes Wetter laden, bei Bedarf aktualisieren
sub('S.bedplan = store.get("garten.bedplan") || null; render();\n}',
    'S.bedplan = store.get("garten.bedplan") || null; S.weather = store.get("garten.weather") || null; render(); maybeRefreshWeather();\n}')

# 4) Texte ohne Claude-Bezug
sub('''const banner = S.mode === "local" ? `<div class="banner">Gespeichert nur in diesem Browser. In der Claude-App geöffnet, landen deine Pflanzen in deinem privaten Gartenbuch.</div>` : "";''',
    '''const banner = "";''')
sub('Fotografiere eine Pflanze. Claude erkennt sie, prüft Blätter, Flecken und Schädlinge und sagt dir Schritt für Schritt, was du tun und welches Mittel du kaufen sollst.',
    'Fotografiere eine Pflanze und lege das Bild bei ihr ab. So siehst du über die Wochen, wie sie sich entwickelt.')
sub('Die Foto-Analyse funktioniert, wenn du das Gartenbuch in der Claude-App öffnest.',
    'Die automatische Foto-Analyse ist in dieser Handy-Version nicht enthalten. Fotos kannst du bei deinen Pflanzen speichern.')
sub('Die Analyse ist nur in der Claude-App verfügbar. Das Foto kannst du trotzdem zu einer Pflanze speichern.',
    'Die automatische Analyse ist in dieser Handy-Version nicht enthalten. Das Foto kannst du zu einer Pflanze speichern.')
sub('Der Pflegeplan wird in der Claude-App erstellt. Öffne das Gartenbuch dort.',
    'Der automatische Pflegeplan ist in dieser Handy-Version nicht enthalten.')
sub('Der Beetplan wird in der Claude-App erstellt.',
    'Der automatische Beetplan ist in dieser Handy-Version nicht enthalten.')
sub('Sie erkennt Krankheiten auf Fotos und erstellt für jede Pflanze einen Profi-Pflegeplan mit Dünger, Erde und Mengen.',
    'Dazu gibt es Gartenkalender, Frostwarnungen, Einkaufsliste und Erntetagebuch.')
sub('Damit holt die App das Wetter für deinen Ort.', 'Damit holt die App das Wetter für deinen Ort (Internet nötig).')


# 4b) Verbleibende Hinweise auf den automatischen Pflegeplan
sub('<li><div><b>Profi-Pflegeplan erstellen lassen</b><span>In der Pflanze auf „Profi-Pflegeplan“ tippen.</span></div></li>',
    '<li><div><b>Jeden Tag „Heute“ ansehen</b><span>Dort steht, was gegossen werden muss und wie viel.</span></div></li>')
sub('Noch keine Tipps für diesen Monat. Tippe hier und dann auf „Pflegeplan erstellen“ – danach stehen hier die Aufgaben für genau diese Pflanze.',
    'Für diese Pflanze gibt es keine Monatstipps. Allgemeine Aufgaben findest du im Kalender.')
sub('Öffne eine Pflanze im Tab <b>Garten</b> und tippe auf <b>Pflegeplan erstellen</b>. Ein Gärtnermeister-Plan sagt dir, welche Erde, welcher Dünger in welcher Menge und wann – ausgerechnet für deine Fläche oder deinen Topf.',
    'Trag im Tab <b>Garten</b> die richtige Fläche oder Topfgröße ein, dann stimmt die Gießmenge. Der Tab <b>Kalender</b> zeigt, was im jeweiligen Monat für Rasen, Gemüse und Kübel dran ist.')

# 5) Nichts darf mehr auf Claude-Dienste zeigen (außer den toten Pfaden, die nie erreicht werden)
open(dst, "w", encoding="utf-8").write(h)
left = [l for l in h.splitlines() if re.search(r"Claude-App|claude\.ai", l)]
print("Rest-Verweise auf Claude-App:", len(left))
for l in left: print("  ", l.strip()[:140])
print("OK ->", dst)
