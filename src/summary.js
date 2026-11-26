"use strict";
process.env.TZ = "Europe/Vienna";
const fs = require("fs"), path = require("path");
const AREAS = {
  rasen:  {label:"Rasen", ground:true, glyph:"grass"},
  beet:   {label:"Gemüsebeet", ground:true, glyph:"sprout"},
  zier:   {label:"Zierpflanzen", ground:true, glyph:"flower"},
  kuebel: {label:"Kübel & Töpfe", pot:true, glyph:"pot"},
  zimmer: {label:"Drinnen", pot:true, indoor:true, glyph:"house"}
};
const KINDS = {
  rasen:   {label:"Rasen", kc:.85, raw:15, min:10, max:20},
  tomate:  {label:"Tomate", kc:1.05, raw:12},
  paprika: {label:"Paprika / Chili", kc:1.0, raw:10},
  gurke:   {label:"Gurke / Zucchini", kc:1.0, raw:11},
  salat:   {label:"Salat / Spinat", kc:.9, raw:8},
  kohl:    {label:"Kohl", kc:.95, raw:14},
  wurzel:  {label:"Wurzelgemüse", kc:.8, raw:15},
  kraeuter:{label:"Kräuter", kc:.6, raw:10},
  stauden: {label:"Stauden / Blumen", kc:.7, raw:15},
  rose:    {label:"Rose", kc:.75, raw:18},
  gehoelz: {label:"Strauch / Hecke", kc:.6, raw:25},
  kuebel:  {label:"Kübelpflanze", kc:.8, raw:12},
  zimmer:  {label:"Zimmerpflanze", kc:.5, raw:10, interval:7}
};
const SUN = {voll:{label:"Volle Sonne", f:1, hint:"mehr als 6 Stunden direkte Sonne"}, halb:{label:"Halbschatten", f:.75, hint:"3–6 Stunden Sonne"}, schatten:{label:"Schatten", f:.55, hint:"unter 3 Stunden Sonne"}};
const STATUS = {gut:"Gesund", beobachten:"Beobachten", krank:"Behandeln"};
const WD = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const WDL = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const MON = ["Jänner","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const CAL = [
  {r:"Bei Frost und Raureif nicht betreten – gefrorene Halme brechen und werden braun.", g:"Anbauplan machen: Was wächst wo? Saatgut sichten und bestellen.", k:"Winterquartier kontrollieren, nur gießen wenn die Erde oben trocken ist, Blätter auf Schildläuse prüfen."},
  {r:"Rasenmäher warten und Messer schleifen lassen – stumpfe Messer zerfransen die Halme.", g:"Ende Februar Paprika und Chili drinnen auf der Fensterbank vorziehen (20–25 °C).", k:"An milden Tagen lüften. Oleander bei Bedarf zurückschneiden."},
  {r:"Laub und Abgestorbenes abrechen. Erster Schnitt, sobald das Gras etwa 8 cm hoch ist, nur die Spitzen kürzen.", g:"Mitte März Tomaten drinnen vorziehen. Radieschen, Spinat und Erbsen direkt ins Beet säen, sobald der Boden nicht mehr gefroren ist.", k:"Umtopfen in frische Erde und langsam an mehr Licht gewöhnen."},
  {r:"Ab etwa 10 °C Bodentemperatur düngen (Frühjahrsdünger). Vertikutieren und kahle Stellen nachsäen, wenn der Boden abgetrocknet ist.", g:"Salat, Kohlrabi und Karotten säen, Kartoffeln legen. Beete mit reifem Kompost vorbereiten.", k:"Tagsüber hinaus in den Halbschatten, bei Nachtfrost wieder hinein."},
  {r:"Wöchentlich mähen, Schnitthöhe 4–5 cm.", g:"Nach den Eisheiligen (Mitte Mai) Tomaten, Paprika, Gurken und Zucchini auspflanzen.", k:"Endgültig ins Freie. Ab jetzt alle 1–2 Wochen düngen."},
  {r:"Bei Trockenheit selten, aber durchdringend gießen: 10–15 Liter pro m² auf einmal.", g:"Tomaten wöchentlich ausgeizen, Beete mulchen, morgens gießen. Starkzehrer nachdüngen.", k:"Wöchentlich düngen, Feuchte täglich mit dem Finger prüfen."},
  {r:"In der Hitze höher mähen (5–6 cm). Sommerdüngung Anfang Juli.", g:"Ernten, ernten, ernten – regelmäßiges Ernten fördert neue Früchte. Endivie und Chinakohl für den Herbst säen.", k:"An Hitzetagen morgens und abends gießen, Untersetzer leeren."},
  {r:"Ende August ist die beste Zeit für Nachsaat und neue Rasenflächen.", g:"Feldsalat und Spinat säen. Tomaten auf Braunfäule kontrollieren und kranke Blätter sofort entfernen.", k:"Letzte Düngung Ende August, damit die Triebe bis zum Winter ausreifen."},
  {r:"Kaliumbetonter Herbstdünger macht den Rasen winterfest. Nachsaat bis Anfang Oktober.", g:"Ernten, Knoblauch und Winterzwiebeln stecken.", k:"Düngung beenden, Winterquartier vorbereiten."},
  {r:"Laub wöchentlich abrechen – darunter fault der Rasen. Mähen bis das Wachstum stoppt, letzter Schnitt auf etwa 5 cm.", g:"Grüne Tomaten vor dem ersten Frost ernten und drinnen nachreifen lassen. Leere Beete mulchen oder Gründüngung säen. Knoblauch stecken.", k:"Zitrus und Empfindliche vor 0 °C einräumen. Oleander und Olive vertragen kurz bis −5 °C. Weniger gießen."},
  {r:"Letztes Laub abrechen, Mäher reinigen und einwintern.", g:"Grünkohl und Rosenkohl nach dem ersten Frost ernten (schmecken dann süßer). Kompost auf die Beete.", k:"Winterharte Kübel mit Vlies und Luftpolsterfolie um den Topf schützen. Außenwasserhahn entleeren."},
  {r:"Ruhe – bei Frost nicht betreten.", g:"Feldsalat und Grünkohl ernten.", k:"Hell und kühl überwintern (5–10 °C), wenig gießen."}
];

const pad = n => String(n).padStart(2,"0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y,m,d] = String(k).split("-").map(Number); return new Date(y, m-1, d); };
const addDays = (k,n) => { const d = parseKey(k); d.setDate(d.getDate()+n); return keyOf(d); };
const diffDays = (a,b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const todayKey = () => keyOf(new Date());
const clamp = (x,a=0,b=1) => Math.max(a, Math.min(b, x));
const nf1 = new Intl.NumberFormat("de-AT",{maximumFractionDigits:1});
const nf0 = new Intl.NumberFormat("de-AT",{maximumFractionDigits:0});
const fmtL = l => l < 10 ? nf1.format(Math.max(.1, Math.round(l*10)/10)) + " l" : l < 100 ? nf0.format(Math.round(l)) + " l" : nf0.format(Math.round(l/10)*10) + " l";
const fmtDate = k => { const d = parseKey(k); return `${d.getDate()}. ${MON[d.getMonth()].slice(0,3)}.`; };
const relDay = k => { const n = diffDays(todayKey(), k); return n === 0 ? "Heute" : n === 1 ? "Morgen" : n === -1 ? "Gestern" : WDL[parseKey(k).getDay()]; };
const str = v => (v == null ? "" : String(v)).trim();
const arr = v => Array.isArray(v) ? v : [];
function ra(date){
  const s = new Date(date.getFullYear(),0,0), J = Math.floor((date - s)/864e5), phi = LATV*Math.PI/180;
  const dr = 1 + .033*Math.cos(2*Math.PI*J/365), dl = .409*Math.sin(2*Math.PI*J/365 - 1.39);
  const ws = Math.acos(clamp(-Math.tan(phi)*Math.tan(dl), -1, 1));
  return 24*60/Math.PI*.082*dr*(ws*Math.sin(phi)*Math.sin(dl) + Math.cos(phi)*Math.cos(dl)*Math.sin(ws));
}
function et0(d){ const t = (d.max + d.min)/2; return Math.max(.2, .0023*.408*ra(parseKey(d.date))*(t+17.8)*Math.sqrt(Math.max(0, d.max - d.min))); }
let WX = [];
let LATV = 48;
function setWeather(days, latv){
  LATV = +latv || 48;
  const ds = (Array.isArray(days) ? days : []).filter(d => d && d.date && isFinite(d.max) && isFinite(d.min)).slice();
  ds.sort((a,b) => a.date < b.date ? -1 : 1);
  WX = ds.map(d => ({...d, rainChance: +d.rainChance || 0, et0: et0(d), rain: (+d.rainChance || 0)/100*5}));
}
function dayW(k){
  const d = WX.find(x => x.date === k); if (d) return d;
  const m = new Date().getMonth(), base = [.5,.8,1.5,2.5,3.5,4.5,5,4.2,2.8,1.6,.8,.5][m];
  if (!WX.length) return {et0: base, rain:.6, rainChance:12};
  if (k < WX[0].date) return {et0: WX[0].et0, rain:0, rainChance:0};
  const l = WX[WX.length-1]; return {et0: l.et0, rain:.5, rainChance:10};
}
const potVol = dcm => Math.PI*(dcm/20)**2*(.9*dcm/10);
function model(p){
  const kind = KINDS[p.kind] || KINDS.stauden, area = AREAS[p.area] || AREAS.beet, sunf = (SUN[p.sun] || SUN.voll).f, today = todayKey();
  if (area.indoor || kind.interval){
    const interval = Math.round((kind.interval || 7) * (p.sun === "voll" ? .8 : p.sun === "schatten" ? 1.3 : 1));
    const since = p.lastWatered ? Math.max(0, diffDays(p.lastWatered, today)) : Math.round(interval/2);
    const due = Math.max(0, interval - since);
    return {fill: clamp(1 - since/interval), due: due <= 6 ? due : null, amountL: potVol(+p.size || 20)*.15, perM2:null, indoor:true, pot:true, interval};
  }
  let raw, loss, gain, A;
  const pot = !!area.pot;
  if (pot){ const d = +p.size || 30; A = Math.PI*(d/200)**2; raw = potVol(d)*.15; loss = w => w.et0*kind.kc*sunf*A*3.5; gain = w => w.rain*A*.7; }
  else { A = Math.max(.1, +p.size || 1); raw = kind.raw; loss = w => w.et0*kind.kc*sunf; gain = w => w.rain; }
  let d = 0, k = addDays(p.lastWatered || addDays(today,-3), 1), guard = 0;
  while (k <= today && guard++ < 90){ const w = dayW(k); d = Math.max(0, d + loss(w) - gain(w)); k = addDays(k,1); }
  const dNow = d; let due = dNow >= raw*.9 ? 0 : null, dDue = dNow;
  for (let i = 1; i <= 6 && due === null; i++){ const w = dayW(addDays(today,i)); d = Math.max(0, d + loss(w) - gain(w)); if (d >= raw*.9){ due = i; dDue = d; } }
  let amountL, perM2 = null;
  if (pot) amountL = Math.max(dDue, raw*.6);
  else { let mm = Math.max(dDue, kind.min || raw*.7); if (kind.max) mm = Math.min(mm, kind.max); perM2 = mm; amountL = mm*A; }
  return {fill: clamp(1 - dNow/raw), due, amountL, perM2, pot, area: A};
}
function recText(m){
  if (m.due === 0) return "Heute gießen";
  if (m.due === 1) return "Morgen gießen";
  if (m.due != null) return "Am " + WDL[parseKey(addDays(todayKey(), m.due)).getDay()] + " gießen";
  return "Diese Woche nicht nötig";
}
const amountText = m => m.perM2 ? `${fmtL(m.amountL)} · ${nf0.format(Math.round(m.perM2))} l/m²` : `≈ ${fmtL(m.amountL)}`;
const cans = l => Math.max(1, Math.round(l/10*2)/2);
const cansText = l => { const c = cans(l); return `${nf1.format(c)} ${c === 1 ? "Gießkanne" : "Gießkannen"} à 10 l`; };

/* ---------- garden knowledge (shared by app and morning summary) ---------- */
const isLawn = p => p.area === "rasen" || p.kind === "rasen";
const ZEHRER = {tomate:"stark", paprika:"stark", gurke:"stark", kohl:"stark", salat:"mittel", wurzel:"mittel", kraeuter:"schwach"};
const ZEHRER_LABEL = {stark:"Starkzehrer", mittel:"Mittelzehrer", schwach:"Schwachzehrer"};
const NEXT_YEAR = {
  stark: "Mittelzehrer: Salat, Spinat, Karotten, Kohlrabi, Zwiebeln oder Rote Rüben.",
  mittel: "Schwachzehrer: Erbsen, Bohnen, Radieschen, Kräuter – oder eine Gründüngung wie Phacelia.",
  schwach: "Starkzehrer: Tomaten, Gurken, Zucchini, Kürbis oder Kohl. Vorher 3–5 Liter reifen Kompost pro m² einarbeiten."
};
const MIX = {
  tomate:  {gut:["Basilikum","Petersilie","Karotten","Salat","Spinat","Kohl","Ringelblumen"], schlecht:["Kartoffeln","Gurken","Erbsen","Fenchel"], pause:"Tomaten nicht zwei Jahre hintereinander an denselben Platz – die Braunfäule überdauert im Boden."},
  paprika: {gut:["Tomaten","Karotten","Basilikum","Zwiebeln"], schlecht:["Erbsen","Fenchel","Bohnen"], pause:"Danach 3 Jahre keine Nachtschattengewächse (Tomate, Paprika, Kartoffel, Melanzani) an dieselbe Stelle."},
  gurke:   {gut:["Salat","Dill","Zwiebeln","Kohl","Bohnen"], schlecht:["Tomaten","Kartoffeln","Radieschen"], pause:"Gurken und Zucchini 3 Jahre Pause am selben Platz."},
  salat:   {gut:["Karotten","Radieschen","Kohl","Tomaten","Gurken","Erdbeeren","Zwiebeln"], schlecht:["Petersilie","Sellerie"], pause:"Salat ist unkompliziert – trotzdem jedes Jahr den Platz wechseln."},
  kohl:    {gut:["Tomaten","Salat","Sellerie","Spinat","Dill"], schlecht:["Erdbeeren","Zwiebeln","Knoblauch"], pause:"Kohl mindestens 4 Jahre Pause am selben Platz, sonst droht Kohlhernie."},
  wurzel:  {gut:["Zwiebeln","Lauch","Salat","Tomaten","Dill"], schlecht:["Rote Rüben"], pause:"Wurzelgemüse 3 Jahre Pause am selben Platz."},
  kraeuter:{gut:["Tomaten","Gurken","Salat","Kohl"], schlecht:[], pause:"Mehrjährige Kräuter (Thymian, Salbei, Rosmarin) bleiben stehen, einjährige jedes Jahr umsetzen."}
};
const MIX_KEY = {tomate:"Tomaten", paprika:"Paprika", gurke:"Gurken", salat:"Salat", kohl:"Kohl", wurzel:"Karotten", kraeuter:"Basilikum"};
const HARVEST_KINDS = ["tomate","paprika","gurke","salat","kohl","wurzel","kraeuter","gehoelz","kuebel"];
const canHarvest = p => HARVEST_KINDS.includes(p.kind) && !isLawn(p) && !(AREAS[p.area]||{}).indoor;
const isBed = p => p.area === "beet" || !!ZEHRER[p.kind] && p.area !== "kuebel" && p.area !== "zimmer";
function badPairs(plants){
  const beds = plants.filter(isBed), out = [];
  for (let i = 0; i < beds.length; i++) for (let j = i+1; j < beds.length; j++){
    const a = beds[i], b = beds[j], ma = MIX[a.kind], mb = MIX[b.kind];
    if ((ma && ma.schlecht.includes(MIX_KEY[b.kind])) || (mb && mb.schlecht.includes(MIX_KEY[a.kind]))) out.push([a, b]);
  }
  return out;
}

/* Weather-based disease warnings – only for plants that exist */
function diseaseWarnings(plants, today){
  const next = WX.filter(d => d.date >= today).slice(0,7), m = parseKey(today).getMonth() + 1, out = [];
  if (!next.length || !plants.length) return out;
  const of = (...kinds) => plants.filter(p => kinds.includes(p.kind));
  const wet = next.filter(d => d.rainChance >= 50), warmWet = wet.filter(d => d.max >= 15);
  const tom = of("tomate");
  if (tom.length && m >= 6 && m <= 10 && warmWet.length >= 2) out.push({level:"bad", plants: tom, title:"Braunfäule-Gefahr bei Tomaten",
    text:`${warmWet.length} feucht-warme Tage in Sicht. Untere Blätter bis 30 cm Höhe abschneiden, nur von unten an den Stängel gießen und ein Regendach oder eine Folienhaube aufstellen. Braune Flecken? Befallene Blätter sofort in den Restmüll, nicht auf den Kompost.`});
  const snail = plants.filter(p => ["salat","kohl","gurke","stauden","kraeuter"].includes(p.kind) && !(AREAS[p.area]||{}).indoor);
  if (snail.length && m >= 4 && m <= 10 && wet.length && wet.some(d => d.min >= 5)) out.push({level:"warn", plants: snail, title:"Schnecken-Wetter",
    text:`Nach dem Regen am ${WDL[parseKey(wet[0].date).getDay()]} abends mit der Taschenlampe kontrollieren und absammeln. Bei starkem Befall Schneckenkorn mit Eisen-III-Phosphat (z. B. Neudorff Ferramol, Compo Bio Schneckenkorn) dünn streuen – etwa 5 g pro m², das sind 3–4 Körner pro Handfläche Boden.`});
  const mildew = of("gurke","rose"), dryWarm = next.filter(d => d.max >= 24 && d.rainChance < 30);
  if (mildew.length && m >= 6 && m <= 9 && dryWarm.length >= 3) out.push({level:"warn", plants: mildew, title:"Echter Mehltau möglich",
    text:"Warm-trockene Tage mit kühlen Nächten. Auf weißen, abwischbaren Belag auf den Blättern achten. Vorbeugend morgens und nur auf den Boden gießen. Bei ersten Flecken befallene Blätter entfernen und Netzschwefel (z. B. Neudorff Netz-Schwefelit) laut Packung spritzen."});
  const lawn = plants.filter(isLawn);
  if (lawn.length && (m >= 10 || m <= 3) && wet.length >= 2 && next.some(d => d.max <= 12)) out.push({level:"warn", plants: lawn, title:"Pilzgefahr im Rasen (Schneeschimmel)",
    text:"Nasskaltes Wetter. Laub sofort abrechen, nicht mehr mit Stickstoff düngen und den nassen Rasen nicht betreten. Graue, runde Flecken? Mit dem Rechen auflockern, im Frühjahr nachsäen."});
  const indoor = plants.filter(p => (AREAS[p.area]||{}).indoor);
  if (indoor.length && (m >= 11 || m <= 2)) out.push({level:"warn", plants: indoor, title:"Heizungsluft: Zeit für Spinnmilben",
    text:"Blattunterseiten genau ansehen: feine Gespinste oder helle Pünktchen? Pflanze lauwarm abduschen und eine Schale Wasser neben die Heizung stellen. Hartnäckig: Rapsöl-Präparat (z. B. Neudorff Spruzit, Celaflor Naturen) laut Packung."});
  return out;
}

/* Text for the morning push notification */
function dailySummary(plants, today, shopOpen){
  const d = parseKey(today), lines = [`Gartenbuch · ${WDL[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()]}`];
  const due = plants.map(p => ({p, m: model(p)})).filter(x => x.m.due === 0);
  lines.push(due.length ? "Gießen: " + due.map(({p,m}) => `${p.name} ${amountText(m)}`).join(" · ") : "Heute muss nichts gegossen werden.");
  const next = WX.filter(x => x.date >= today).slice(0,4);
  const outdoor = plants.filter(p => !(AREAS[p.area]||{}).indoor), pots = plants.filter(p => p.area === "kuebel"), ground = plants.filter(p => (AREAS[p.area]||{}).ground);
  const frost = next.find(x => x.min <= 2);
  if (frost && outdoor.length) lines.push(`Frost ${relDay(frost.date).toLowerCase() === "heute" ? "heute Nacht" : relDay(frost.date)}: ${nf1.format(frost.min)} °C${pots.length ? ` – ${pots.map(p => p.name).join(", ")} reinstellen` : ""}${plants.some(p => p.area === "beet") ? ", Beet mit Vlies abdecken" : ""}.`);
  const wet = next.find(x => x.rainChance >= 50 && x.date > today);
  if (wet && ground.length) lines.push(`${relDay(wet.date)} ${wet.rainChance} % Regen – Beet und Rasen können warten.`);
  diseaseWarnings(plants, today).forEach(w => lines.push(`${w.title}: ${w.plants.map(p => p.name).join(", ")}`));
  const sick = plants.filter(p => p.status === "krank");
  if (sick.length) lines.push(`Behandeln: ${sick.map(p => p.name).join(", ")}`);
  if (shopOpen) lines.push(`Einkaufsliste: ${shopOpen} offen`);
  return lines.join("\n");
}

function load(f){
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const id = path.basename(f, ".json");
  if (j && j.data && typeof j.data === "object" && !Array.isArray(j.data)) return {id: j.id || id, ...j.data};
  return {id, ...j};
}
function loadDir(d){ try { return fs.readdirSync(d).filter(f => f.endsWith(".json")).map(f => load(path.join(d, f))); } catch { return []; } }
const root = process.argv[2] || ".";
const plants = loadDir(path.join(root, "plants")).filter(p => p && p.name);
const w = loadDir(path.join(root, "weather")).find(x => x.days) || null;
const loc = loadDir(path.join(root, "settings")).find(x => x.address) || null;
const shop = loadDir(path.join(root, "shopping")).filter(x => x && !x.done).length;
if (w && loc && w.forAddress === loc.address) setWeather(w.days, +loc.lat || +w.lat || 48);
console.log(dailySummary(plants, todayKey(), shop));
