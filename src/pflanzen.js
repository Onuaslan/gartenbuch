/* ---------- Pflanzen-Datenbank (Richtwerte für Mitteleuropa / Österreich) ----------
   n Name, fam Fruchtfolge-Familie, sp Abstand in der Reihe (cm), rw Reihenabstand (cm),
   z Zehrer (s stark, m mittel, w schwach), sun (v voll, h halb, s Schatten),
   vor = Vorziehen im Haus, saat = Direktsaat, pfl = Auspflanzen/Stecken, ern = Ernte/Blüte (Monate 1-12),
   gut/schl = gute/schlechte Nachbarn, c Laubfarbe, f Fruchtfarbe, t Symbol (b Busch, r Rosette, f feines Grün, h hoch, k Kraut) */
const FAM = {
  nacht: "Nachtschatten (Tomate, Paprika, Kartoffel)", kuerbis: "Kürbisgewächse (Gurke, Zucchini, Kürbis)", kohl: "Kohl und Kreuzblütler",
  dolde: "Doldenblütler (Karotte, Sellerie, Petersilie)", lauch: "Lauchgewächse (Zwiebel, Knoblauch, Lauch)", huelse: "Hülsenfrüchte (Erbse, Bohne)",
  gaense: "Gänsefußgewächse (Rote Bete, Mangold, Spinat)", korb: "Korbblütler (Salat, Sonnenblume)", lippe: "Lippenblütler (Kräuter)",
  rose: "Rosengewächse (Erdbeere, Himbeere)", gras: "Süßgräser (Mais)", sonst: "Sonstige"
};
const CROPS = {
  tomate:   {n: "Tomate", g: "g", fam: "nacht", sp: 50, rw: 70, z: "s", sun: "v", vor: [3, 4], pfl: [5, 6], ern: [7, 8, 9, 10], gut: ["basilikum", "karotte", "knoblauch", "zwiebel", "petersilie", "tagetes", "ringelblume"], schl: ["kartoffel", "fenchel", "erbse"], c: "#4f8f3a", f: "#d9402f", t: "b", tip: "Erst nach den Eisheiligen (Mitte Mai) ins Freie, am besten mit Regenschutz gegen Braunfäule."},
  paprika:  {n: "Paprika", g: "g", fam: "nacht", sp: 50, rw: 60, z: "s", sun: "v", vor: [2, 3], pfl: [5, 6], ern: [7, 8, 9, 10], gut: ["basilikum", "zwiebel", "karotte", "knoblauch"], schl: ["fenchel", "erbse"], c: "#4d8f3d", f: "#e8a22c", t: "b", tip: "Braucht Wärme: erst nach den Eisheiligen auspflanzen."},
  kartoffel:{n: "Kartoffel", g: "g", fam: "nacht", sp: 35, rw: 70, z: "s", sun: "v", pfl: [4, 5], ern: [7, 8, 9], gut: ["buschbohne", "kohlrabi", "ringelblume", "kapuzinerkresse"], schl: ["tomate", "erbse", "sellerie"], c: "#3f8a3c", t: "b", tip: "Anhäufeln, sobald das Kraut 20 cm hoch ist."},
  gurke:    {n: "Gurke", g: "g", fam: "kuerbis", sp: 50, rw: 100, z: "s", sun: "v", vor: [4], pfl: [5, 6], ern: [7, 8, 9], gut: ["dill", "erbse", "buschbohne", "zwiebel", "knoblauch", "salat", "kapuzinerkresse", "tagetes"], schl: ["tomate", "kartoffel", "radieschen", "fenchel"], c: "#3f8f45", t: "b", tip: "Am Rankgitter ziehen, gleichmäßig feucht halten."},
  zucchini: {n: "Zucchini", g: "g", fam: "kuerbis", sp: 80, rw: 100, z: "s", sun: "v", vor: [4], saat: [5], pfl: [5, 6], ern: [6, 7, 8, 9], gut: ["buschbohne", "zwiebel", "kapuzinerkresse", "mais"], schl: ["kartoffel"], c: "#3b8540", f: "#c9d26a", t: "b", tip: "Starkzehrer: viel Kompost und regelmäßig gießen."},
  kuerbis:  {n: "Kürbis", g: "g", fam: "kuerbis", sp: 120, rw: 150, z: "s", sun: "v", vor: [4], saat: [5], pfl: [5, 6], ern: [9, 10], gut: ["stangenbohne", "mais", "zwiebel"], schl: ["kartoffel"], c: "#3a7f3f", f: "#e08a22", t: "b", tip: "Braucht viel Platz, die Ranken wachsen mehrere Meter."},
  salat:    {n: "Salat", g: "g", fam: "korb", sp: 25, rw: 25, z: "m", sun: "h", vor: [2, 3], saat: [3, 4, 5, 6, 7, 8], pfl: [3, 4, 5, 6, 7, 8, 9], ern: [5, 6, 7, 8, 9, 10], gut: ["radieschen", "karotte", "erdbeere", "gurke", "kohlrabi", "zwiebel", "dill"], schl: ["petersilie", "sellerie"], c: "#7fbf4f", t: "r", tip: "Nicht zu tief pflanzen, im Hochsommer halbschattig."},
  radieschen:{n: "Radieschen", g: "g", fam: "kohl", sp: 5, rw: 15, z: "w", sun: "h", saat: [3, 4, 5, 6, 7, 8, 9], ern: [4, 5, 6, 7, 8, 9, 10], gut: ["salat", "karotte", "erbse", "spinat"], schl: ["gurke"], c: "#5da545", f: "#c43d63", t: "f", tip: "Wächst in 4 bis 6 Wochen, gut als Lückenfüller."},
  karotte:  {n: "Karotte", g: "g", fam: "dolde", sp: 5, rw: 25, z: "w", sun: "v", saat: [3, 4, 5, 6, 7], ern: [6, 7, 8, 9, 10], gut: ["zwiebel", "lauch", "knoblauch", "tomate", "radieschen", "salat", "erbse", "rosmarin", "salbei"], schl: ["dill", "fenchel"], c: "#6ab04c", t: "f", tip: "Feine, steinfreie Erde. Nicht frisch mit Mist düngen."},
  zwiebel:  {n: "Zwiebel", g: "g", fam: "lauch", sp: 8, rw: 20, z: "w", sun: "v", saat: [3], pfl: [3, 4], ern: [7, 8], gut: ["karotte", "rotebete", "salat", "tomate", "gurke", "erdbeere"], schl: ["erbse", "buschbohne", "stangenbohne"], c: "#7fb25a", t: "f", tip: "Steckzwiebeln im März/April, geerntet wird, wenn das Laub gelb wird."},
  knoblauch:{n: "Knoblauch", g: "g", fam: "lauch", sp: 12, rw: 25, z: "w", sun: "v", pfl: [10, 11, 3], ern: [7, 8], gut: ["tomate", "erdbeere", "karotte", "rotebete", "gurke"], schl: ["erbse", "buschbohne", "stangenbohne"], c: "#86b968", t: "f", tip: "Zehen im Oktober oder März stecken."},
  lauch:    {n: "Lauch", g: "g", fam: "lauch", sp: 15, rw: 30, z: "s", sun: "v", vor: [2, 3], pfl: [5, 6, 7], ern: [9, 10, 11, 12], gut: ["karotte", "sellerie", "erdbeere", "tomate"], schl: ["erbse", "buschbohne", "stangenbohne"], c: "#5f9f5a", t: "f", tip: "Beim Auspflanzen tief setzen und später anhäufeln."},
  kohlrabi: {n: "Kohlrabi", g: "g", fam: "kohl", sp: 30, rw: 30, z: "m", sun: "h", vor: [2, 3], pfl: [3, 4, 5, 6, 7, 8], ern: [5, 6, 7, 8, 9, 10], gut: ["salat", "spinat", "rotebete", "kartoffel", "zwiebel"], schl: [], c: "#79b86a", t: "r", tip: "Gleichmäßig gießen, sonst platzen die Knollen."},
  brokkoli: {n: "Brokkoli", g: "g", fam: "kohl", sp: 50, rw: 50, z: "s", sun: "h", vor: [3, 4, 5], pfl: [4, 5, 6, 7], ern: [6, 7, 8, 9, 10], gut: ["salat", "sellerie", "rotebete", "kartoffel"], schl: ["erdbeere"], c: "#5d9d6d", t: "r", tip: "Mit Kulturnetz gegen Kohlweißling schützen."},
  gruenkohl:{n: "Grünkohl", g: "g", fam: "kohl", sp: 50, rw: 50, z: "s", sun: "h", vor: [5, 6], pfl: [6, 7], ern: [10, 11, 12, 1, 2], gut: ["sellerie", "kartoffel", "rotebete", "zwiebel"], schl: ["erdbeere"], c: "#4d8a62", t: "r", tip: "Schmeckt nach dem ersten Frost am besten."},
  spinat:   {n: "Spinat", g: "g", fam: "gaense", sp: 10, rw: 20, z: "m", sun: "h", saat: [3, 4, 8, 9], ern: [5, 6, 10, 11], gut: ["erdbeere", "kohlrabi", "radieschen"], schl: [], c: "#4f9a4a", t: "r", tip: "Bei Hitze schießt er; lieber im Frühjahr und Spätsommer säen."},
  erbse:    {n: "Erbse", g: "g", fam: "huelse", sp: 5, rw: 40, z: "w", sun: "h", saat: [3, 4, 5], ern: [6, 7], gut: ["karotte", "gurke", "kohlrabi", "radieschen", "salat", "mais"], schl: ["zwiebel", "knoblauch", "lauch", "tomate", "kartoffel", "fenchel"], c: "#6fb057", t: "h", tip: "Rankhilfe geben; Erbsen binden Stickstoff im Boden."},
  buschbohne:{n: "Buschbohne", g: "g", fam: "huelse", sp: 8, rw: 40, z: "w", sun: "v", saat: [5, 6], ern: [7, 8, 9], gut: ["kartoffel", "gurke", "kohlrabi", "rotebete"], schl: ["zwiebel", "knoblauch", "lauch", "erbse", "fenchel"], c: "#4f9a45", t: "b", tip: "Erst nach den Eisheiligen säen, rohe Bohnen sind giftig."},
  stangenbohne:{n: "Stangenbohne", g: "g", fam: "huelse", sp: 10, rw: 80, z: "w", sun: "v", saat: [5, 6], ern: [7, 8, 9, 10], gut: ["gurke", "mais", "kuerbis"], schl: ["zwiebel", "knoblauch", "lauch", "erbse", "fenchel", "rotebete"], c: "#4a9440", t: "h", tip: "Braucht 2 m hohe Stangen oder ein Rankgitter."},
  rotebete: {n: "Rote Bete", g: "g", fam: "gaense", sp: 10, rw: 25, z: "m", sun: "h", saat: [4, 5, 6], ern: [7, 8, 9, 10], gut: ["zwiebel", "kohlrabi", "salat", "knoblauch", "buschbohne"], schl: ["stangenbohne"], c: "#6aa04e", f: "#a3294f", t: "r", tip: "Die Knäuel vereinzeln, sonst werden die Knollen klein."},
  mangold:  {n: "Mangold", g: "g", fam: "gaense", sp: 25, rw: 35, z: "m", sun: "h", saat: [4, 5, 6], ern: [6, 7, 8, 9, 10], gut: ["kohlrabi", "zwiebel", "buschbohne", "radieschen"], schl: [], c: "#5aa24f", f: "#d85a7a", t: "r", tip: "Immer nur die äußeren Blätter ernten, dann wächst er weiter."},
  sellerie: {n: "Sellerie", g: "g", fam: "dolde", sp: 40, rw: 50, z: "s", sun: "v", vor: [2, 3], pfl: [5], ern: [9, 10], gut: ["lauch", "brokkoli", "gruenkohl", "tomate", "buschbohne"], schl: ["kartoffel", "mais"], c: "#5fa653", t: "r", tip: "Nicht zu tief pflanzen, viel Wasser und Nährstoffe."},
  fenchel:  {n: "Fenchel", g: "g", fam: "dolde", sp: 30, rw: 35, z: "m", sun: "v", saat: [5, 6, 7], ern: [8, 9, 10], gut: [], schl: ["tomate", "buschbohne", "stangenbohne", "erbse", "karotte", "paprika", "gurke", "kohlrabi"], c: "#8cc16a", t: "f", tip: "Verträgt sich mit fast keinem Nachbarn, am besten allein oder am Rand."},
  rucola:   {n: "Rucola", g: "g", fam: "kohl", sp: 5, rw: 15, z: "w", sun: "h", saat: [3, 4, 5, 8, 9], ern: [4, 5, 6, 7, 8, 9, 10], gut: ["salat", "karotte", "tomate"], schl: [], c: "#6bb552", t: "r", tip: "Mit Kulturnetz gegen Erdflöhe schützen."},
  mais:     {n: "Süßmais", g: "g", fam: "gras", sp: 30, rw: 60, z: "s", sun: "v", saat: [5], ern: [8, 9], gut: ["stangenbohne", "kuerbis", "gurke", "erbse", "zucchini"], schl: ["sellerie"], c: "#6fae43", f: "#f0cf4c", t: "h", tip: "In Blöcken statt in einer Reihe pflanzen, damit er bestäubt wird."},
  basilikum:{n: "Basilikum", g: "k", fam: "lippe", sp: 20, rw: 25, z: "m", sun: "v", vor: [3, 4], pfl: [5, 6], ern: [6, 7, 8, 9], gut: ["tomate", "paprika", "zucchini"], schl: [], c: "#5eab4c", t: "k", tip: "Frostempfindlich, erst ab Mitte Mai ins Freie."},
  petersilie:{n: "Petersilie", g: "k", fam: "dolde", sp: 10, rw: 20, z: "m", sun: "h", saat: [3, 4, 5, 6, 7], ern: [5, 6, 7, 8, 9, 10], gut: ["tomate", "zwiebel", "radieschen", "erdbeere"], schl: ["salat", "sellerie"], c: "#4f9e48", t: "k", tip: "Keimt langsam, 3 bis 4 Wochen Geduld."},
  schnittlauch:{n: "Schnittlauch", g: "k", fam: "lauch", sp: 15, rw: 20, z: "m", sun: "h", saat: [3, 4, 5], ern: [4, 5, 6, 7, 8, 9, 10], gut: ["karotte", "erdbeere", "tomate", "gurke"], schl: ["erbse", "buschbohne", "stangenbohne"], c: "#5aa65a", t: "f", tip: "Mehrjährig, nach der Blüte kräftig zurückschneiden."},
  dill:     {n: "Dill", g: "k", fam: "dolde", sp: 15, rw: 25, z: "w", sun: "v", saat: [4, 5, 6, 7], ern: [6, 7, 8, 9], gut: ["gurke", "salat", "zwiebel", "rotebete", "brokkoli"], schl: ["karotte", "fenchel"], c: "#7fba66", t: "f", tip: "Mehrmals nachsäen für laufende Ernte."},
  thymian:  {n: "Thymian", g: "k", fam: "lippe", sp: 25, rw: 30, z: "w", sun: "v", pfl: [4, 5, 9], ern: [5, 6, 7, 8, 9, 10], gut: ["erdbeere", "brokkoli", "kohlrabi"], schl: [], c: "#7da66b", t: "k", tip: "Mag trockenen, kalkhaltigen Boden."},
  salbei:   {n: "Salbei", g: "k", fam: "lippe", sp: 40, rw: 50, z: "w", sun: "v", pfl: [4, 5], ern: [5, 6, 7, 8, 9, 10], gut: ["karotte", "rosmarin", "tomate"], schl: ["gurke"], c: "#8aa88a", t: "k", tip: "Im Frühjahr kräftig zurückschneiden."},
  rosmarin: {n: "Rosmarin", g: "k", fam: "lippe", sp: 50, rw: 60, z: "w", sun: "v", pfl: [5], ern: [3, 4, 5, 6, 7, 8, 9, 10, 11], gut: ["salbei", "karotte"], schl: [], c: "#6d9a78", t: "k", tip: "Nicht sicher winterhart: im Kübel überwintern oder gut abdecken."},
  minze:    {n: "Minze", g: "k", fam: "lippe", sp: 40, rw: 40, z: "m", sun: "h", pfl: [4, 5, 6], ern: [5, 6, 7, 8, 9], gut: ["tomate"], schl: ["petersilie"], c: "#4fa862", t: "k", tip: "Wuchert stark, besser im Topf oder mit Wurzelsperre."},
  erdbeere: {n: "Erdbeere", g: "o", fam: "rose", sp: 30, rw: 40, z: "m", sun: "v", pfl: [4, 8, 9], ern: [5, 6, 7], gut: ["knoblauch", "zwiebel", "salat", "spinat", "radieschen", "schnittlauch", "petersilie", "thymian"], schl: ["brokkoli", "gruenkohl"], c: "#4a9a4a", f: "#d5283c", t: "b", tip: "Nach 3 bis 4 Jahren an eine neue Stelle setzen."},
  himbeere: {n: "Himbeere", g: "o", fam: "rose", sp: 50, rw: 150, z: "m", sun: "h", pfl: [3, 4, 10, 11], ern: [6, 7, 8, 9], gut: ["knoblauch"], schl: [], c: "#4c8e42", f: "#c9304f", t: "h", tip: "Alte Ruten nach der Ernte abschneiden."},
  sonnenblume:{n: "Sonnenblume", g: "b", fam: "korb", sp: 40, rw: 60, z: "s", sun: "v", saat: [4, 5], ern: [7, 8, 9], gut: ["gurke", "mais"], schl: ["kartoffel"], c: "#5f9a3c", f: "#f2c230", t: "h", tip: "Starkzehrer, bietet Vögeln und Insekten Nahrung."},
  ringelblume:{n: "Ringelblume", g: "b", fam: "korb", sp: 25, rw: 30, z: "w", sun: "v", saat: [3, 4, 5], ern: [6, 7, 8, 9, 10], gut: ["tomate", "kartoffel", "salat", "karotte"], schl: [], c: "#6bae4c", f: "#f08a1c", t: "k", tip: "Zieht Nützlinge an, Blüten sind essbar."},
  tagetes:  {n: "Tagetes", g: "b", fam: "korb", sp: 20, rw: 25, z: "w", sun: "v", vor: [3, 4], pfl: [5], ern: [6, 7, 8, 9, 10], gut: ["tomate", "kartoffel", "gurke", "salat"], schl: [], c: "#5d9d44", f: "#f0a31c", t: "k", tip: "Hält Fadenwürmer (Nematoden) im Boden in Schach."},
  kapuzinerkresse:{n: "Kapuzinerkresse", g: "b", fam: "sonst", sp: 30, rw: 40, z: "w", sun: "h", saat: [4, 5], ern: [6, 7, 8, 9, 10], gut: ["gurke", "tomate", "kartoffel", "zucchini"], schl: [], c: "#6cb04f", f: "#ee7a1e", t: "k", tip: "Lockt Läuse von anderen Pflanzen weg, Blüten sind essbar."},
  lavendel: {n: "Lavendel", g: "b", fam: "lippe", sp: 40, rw: 50, z: "w", sun: "v", pfl: [4, 5, 9], ern: [6, 7, 8], gut: ["erdbeere"], schl: [], c: "#8fa88e", f: "#8f6fc8", t: "k", tip: "Nach der Blüte um ein Drittel zurückschneiden."}
};
const CROP_KEYS = Object.keys(CROPS).sort((a, b) => CROPS[a].n.localeCompare(CROPS[b].n, "de"));
const CGROUP = {g: "Gemüse", k: "Kräuter", o: "Obst", b: "Blumen"};
const ZEHR = {s: "Starkzehrer", m: "Mittelzehrer", w: "Schwachzehrer"};
const SUNL = {v: "Volle Sonne", h: "Halbschatten", s: "Schatten"};

function cropPairs(keys){
  const good = [], bad = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++){
    const a = CROPS[keys[i]], b = CROPS[keys[j]]; if (!a || !b) continue;
    const isBad = a.schl.includes(keys[j]) || b.schl.includes(keys[i]), isGood = a.gut.includes(keys[j]) || b.gut.includes(keys[i]);
    if (isBad) bad.push([keys[i], keys[j]]); else if (isGood) good.push([keys[i], keys[j]]);
  }
  return {good, bad};
}
/* Pflanzenzahl: Innenmaße w × h (m), k Sorten teilen sich die Fläche der Länge nach */
function cropLayout(w, h, keys){
  const k = keys.length; if (!k) return [];
  const along = Math.max(w, h), across = Math.min(w, h), horiz = w >= h;
  const out = [];
  for (let i = 0; i < k; i++){
    const c = CROPS[keys[i]], span = along / k, inner = span, innerAcross = across;
    const nAlong = Math.max(1, Math.floor(inner * 100 / c.sp)), nAcross = Math.max(1, Math.floor(innerAcross * 100 / Math.max(c.rw, c.sp)));
    out.push({key: keys[i], count: nAlong * nAcross, nAlong, nAcross, span, i, horiz, along, across});
  }
  return out;
}
/* Aufgaben für einen Monat aus den Sorten auf der Karte */
function cropTasks(items, month){
  const rows = [];
  items.forEach(it => (it.pl || []).forEach(k => {
    const c = CROPS[k]; if (!c) return; const where = it.name || (MTYPES[it.type] || {}).l || "";
    const add = (arr, text) => { if (arr && arr.includes(month)) rows.push({key: k, crop: c.n, where, text}); };
    add(c.vor, "im Haus vorziehen"); add(c.saat, "direkt ins Beet säen"); add(c.pfl, k === "kartoffel" || k === "zwiebel" || k === "knoblauch" ? "stecken" : "auspflanzen");
    if (c.ern && c.ern.includes(month) && !(c.ern.includes(month - 1 || 12))) rows.push({key: k, crop: c.n, where, text: c.g === "b" ? "beginnt zu blühen" : "Erntezeit beginnt"});
  }));
  return rows;
}
