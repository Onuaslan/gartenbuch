/* ---------- Gartenkarte: realistische Zeichnung (SVG) ---------- */
const GKM = {L: 30, T: 20, R: 8, B: 8};
const n1 = v => Math.round(v * 10) / 10;
const gkHash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function gkRand(seed){
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/* Schatten fällt Richtung Norden (Sonne steht mittags im Süden), leicht nach Osten gedreht */
function gkShadowVec(m){
  const a = ((+m.north || 0) - 25) * Math.PI / 180;
  return [-Math.sin(a), -Math.cos(a)];
}
function gkDefs(ppm, usedKeys){
  const r = gkRand(7), p = [];
  // Rasen: Halme und weiche Flecken
  let grass = `<rect width="96" height="96" fill="#86bd63"/>`;
  for (let i = 0; i < 7; i++) grass += `<circle cx="${n1(r() * 96)}" cy="${n1(r() * 96)}" r="${n1(10 + r() * 18)}" fill="${r() > .5 ? "#9acb74" : "#74ad55"}" opacity=".16"/>`;
  for (let i = 0; i < 150; i++){ const x = r() * 96, y = r() * 96, l = 2.5 + r() * 3.5, a = (r() - .5) * 1.2;
    grass += `<path d="M${n1(x)} ${n1(y)}l${n1(Math.sin(a) * l)} ${n1(-Math.cos(a) * l)}" stroke="${["#6ba24d", "#a5d37e", "#78b158", "#93c56e"][i % 4]}" stroke-width="1" stroke-linecap="round" opacity=".55"/>`; }
  p.push(`<pattern id="gkGrass" width="96" height="96" patternUnits="userSpaceOnUse">${grass}</pattern>`);
  const mw = Math.max(16, ppm * 1.2);
  p.push(`<pattern id="gkMow" width="${n1(mw * 2)}" height="12" patternUnits="userSpaceOnUse"><rect width="${n1(mw)}" height="12" fill="#fff" opacity=".07"/></pattern>`);
  // Erde
  let soil = `<rect width="48" height="48" fill="#6a4d37"/>`;
  for (let i = 0; i < 70; i++) soil += `<circle cx="${n1(r() * 48)}" cy="${n1(r() * 48)}" r="${n1(.5 + r() * 1.1)}" fill="${["#583f2c", "#7c5c44", "#4a3424", "#8a6a50", "#9b8a76"][i % 5]}" opacity="${n1(.5 + r() * .4)}"/>`;
  p.push(`<pattern id="gkSoil" width="48" height="48" patternUnits="userSpaceOnUse">${soil}</pattern>`);
  // Kies (Wege)
  let gravel = `<rect width="40" height="40" fill="#d6cdba"/>`;
  for (let i = 0; i < 60; i++) gravel += `<circle cx="${n1(r() * 40)}" cy="${n1(r() * 40)}" r="${n1(.6 + r() * 1.2)}" fill="${["#c3b9a3", "#e6dfce", "#b5ab96", "#cfc5ae"][i % 4]}"/>`;
  p.push(`<pattern id="gkGravel" width="40" height="40" patternUnits="userSpaceOnUse">${gravel}</pattern>`);
  // Terrassenplatten im Halbverband
  const sw = Math.max(16, ppm * .6), sh = sw / 2, tones = ["#d3c6ae", "#c9bba2", "#d8ccb6", "#cdbfa6"];
  let pav = "";
  for (let row = 0; row < 2; row++) for (let c = -1; c < 2; c++){
    const x = c * sw + (row ? sw / 2 : 0), y = row * sh;
    pav += `<rect x="${n1(x + .5)}" y="${n1(y + .5)}" width="${n1(sw - 1)}" height="${n1(sh - 1)}" rx="1" fill="${tones[(row * 2 + c + 3) % 4]}" stroke="#b3a58b" stroke-width=".8"/>`;
  }
  p.push(`<pattern id="gkPaver" width="${n1(sw)}" height="${n1(sh * 2)}" patternUnits="userSpaceOnUse">${pav}</pattern>`);
  // Holz
  let wood = `<rect width="60" height="12" fill="#a98259"/><path d="M0 11.5H60" stroke="#6f5233" stroke-width="1.2"/>`;
  for (let i = 0; i < 6; i++) wood += `<path d="M${n1(r() * 40)} ${n1(2 + r() * 8)}h${n1(8 + r() * 18)}" stroke="#8d6a43" stroke-width=".8" opacity=".7"/>`;
  p.push(`<pattern id="gkWood" width="60" height="12" patternUnits="userSpaceOnUse">${wood}</pattern>`);
  // Dachziegel-Reihen
  p.push(`<pattern id="gkTileH" width="10" height="5" patternUnits="userSpaceOnUse"><path d="M0 4.6H10" stroke="#000" stroke-opacity=".22" stroke-width="1"/><path d="M5 0V4.6" stroke="#000" stroke-opacity=".08"/></pattern>`);
  p.push(`<pattern id="gkTileV" width="5" height="10" patternUnits="userSpaceOnUse"><path d="M4.6 0V10" stroke="#000" stroke-opacity=".22" stroke-width="1"/><path d="M0 5H4.6" stroke="#000" stroke-opacity=".08"/></pattern>`);
  p.push(`<linearGradient id="gkWater" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#62d0f2"/><stop offset=".55" stop-color="#2aa3dc"/><stop offset="1" stop-color="#1580b8"/></linearGradient>`);
  p.push(`<radialGradient id="gkCrown" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8ccb78"/><stop offset=".55" stop-color="#4a9a56"/><stop offset="1" stop-color="#2f7040"/></radialGradient>`);
  p.push(`<radialGradient id="gkCrownC" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5f9a72"/><stop offset=".6" stop-color="#33704b"/><stop offset="1" stop-color="#204c35"/></radialGradient>`);
  p.push(`<radialGradient id="gkShrub" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9ad285"/><stop offset=".6" stop-color="#5aa95a"/><stop offset="1" stop-color="#3b7a45"/></radialGradient>`);
  p.push(`<filter id="gkBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="gkBlur2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5"/></filter>`);
  usedKeys.forEach(k => { const c = CROPS[k]; if (c) p.push(`<radialGradient id="gkp-${k}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${gkShade(c.c, .35)}"/><stop offset=".6" stop-color="${c.c}"/><stop offset="1" stop-color="${gkShade(c.c, -.3)}"/></radialGradient>`); });
  return `<defs>${p.join("")}</defs>`;
}
function gkShade(hex, f){
  const n = parseInt(hex.slice(1), 16), c = i => { const v = (n >> (16 - i * 8)) & 255; return Math.round(clamp(f >= 0 ? v + (255 - v) * f : v * (1 + f), 0, 255)); };
  return "#" + [0, 1, 2].map(i => c(i).toString(16).padStart(2, "0")).join("");
}
const gkSh = (shape, dx, dy, op, big) => `<g transform="translate(${n1(dx)} ${n1(dy)})" filter="url(#${big ? "gkBlur2" : "gkBlur"})" opacity="${op}" fill="#000">${shape}</g>`;
const gkBloom = nm => /hortensie/i.test(nm) ? "#b9a3e6" : /rose/i.test(nm) ? "#e4577f" : /lavendel/i.test(nm) ? "#9a7bd0" : /flieder/i.test(nm) ? "#b79ae0" : /forsythi/i.test(nm) ? "#f4d03f" : /heidelbeer/i.test(nm) ? "#3b4a9a" : /beere|johannis|stachel/i.test(nm) ? "#c0304a" : /rhodo|azale/i.test(nm) ? "#e06aa8" : null;
const gkFruit = nm => /apfel/i.test(nm) ? "#d6362c" : /birne/i.test(nm) ? "#cdd651" : /kirsch/i.test(nm) ? "#9d1f2e" : /zwetsch|pflaume/i.test(nm) ? "#5a3b8f" : /marille|pfirsich/i.test(nm) ? "#f0a03a" : /zitron/i.test(nm) ? "#f2d24a" : null;
const gkConifer = nm => /fichte|tanne|kiefer|thuja|zypress|eibe|wacholder|lebensbaum/i.test(nm);

/* ----- ein Pflanzensymbol (Draufsicht) ----- */
function gkPlant(k, cx, cy, r, rnd){
  const c = CROPS[k]; if (!c) return "";
  const fill = `url(#gkp-${k})`;
  let s = `<g transform="translate(${n1(cx)} ${n1(cy)})"><circle cx="${n1(r * .22)}" cy="${n1(r * .3)}" r="${n1(r * .95)}" fill="#000" opacity=".22"/>`;
  if (c.t === "f"){
    const len = r * 1.05, w = Math.max(1, r * .3);
    for (let i = 0; i < 6; i++){ const a = (-70 + i * 28 + (rnd() - .5) * 10) * Math.PI / 180; s += `<path d="M0 0L${n1(Math.sin(a) * len)} ${n1(-Math.cos(a) * len)}" stroke="${i % 2 ? gkShade(c.c, .2) : c.c}" stroke-width="${n1(w)}" stroke-linecap="round"/>`; }
    if (c.f) s += `<circle cx="0" cy="${n1(r * .15)}" r="${n1(r * .32)}" fill="${c.f}"/>`;
  } else if (c.t === "r"){
    for (let i = 0; i < 7; i++) s += `<ellipse cx="0" cy="${n1(-r * .5)}" rx="${n1(r * .42)}" ry="${n1(r * .56)}" transform="rotate(${i * 51.4 + n1(rnd() * 10)})" fill="${fill}" stroke="${gkShade(c.c, -.35)}" stroke-width=".5"/>`;
    s += `<circle r="${n1(r * .3)}" fill="${gkShade(c.c, .4)}"/>`;
    if (c.f) s += `<circle r="${n1(r * .2)}" fill="${c.f}"/>`;
  } else if (c.t === "h"){
    for (let i = 0; i < 8; i++) s += `<ellipse cx="0" cy="${n1(-r * .55)}" rx="${n1(r * .2)}" ry="${n1(r * .6)}" transform="rotate(${i * 45 + n1(rnd() * 12)})" fill="${fill}" stroke="${gkShade(c.c, -.4)}" stroke-width=".4"/>`;
    s += `<circle r="${n1(r * .24)}" fill="${c.f || gkShade(c.c, .3)}"/>`;
  } else {
    const lobes = c.t === "k" ? 5 : 4;
    s += `<circle r="${n1(r * .85)}" fill="${fill}" stroke="${gkShade(c.c, -.4)}" stroke-width=".6"/>`;
    for (let i = 0; i < lobes; i++){ const a = i * 6.283 / lobes + rnd(); s += `<circle cx="${n1(Math.cos(a) * r * .45)}" cy="${n1(Math.sin(a) * r * .45)}" r="${n1(r * .42)}" fill="${gkShade(c.c, .22)}" opacity=".55"/>`; }
    if (c.f) for (let i = 0; i < 4; i++){ const a = rnd() * 6.283, d = r * (.2 + rnd() * .5); s += `<circle cx="${n1(Math.cos(a) * d)}" cy="${n1(Math.sin(a) * d)}" r="${n1(Math.max(1, r * .17))}" fill="${c.f}" stroke="#00000030" stroke-width=".4"/>`; }
  }
  return s + "</g>";
}
/* ----- Pflanzen im Beet nach Abstandsraster (Anzahl in Metern berechnet, identisch zu den Hinweisen) ----- */
const gkWall = it => it.type === "hochbeet" ? .06 : .08;
function gkBedPlants(it, ppm, ix, iy, iw, ih){
  const keys = (it.pl || []).filter(k => CROPS[k]); if (!keys.length) return "";
  const rnd = gkRand(gkHash(it.id + "p")), wm = gkWall(it), lay = cropLayout(Math.max(.1, it.w - 2 * wm), Math.max(.1, it.h - 2 * wm), keys);
  let out = "";
  lay.forEach(L => {
    const c = CROPS[L.key], span = L.span * ppm, across = L.across * ppm, stepA = span / L.nAlong, stepB = across / L.nAcross;
    const r = clamp(Math.min(stepA, stepB) * (c.t === "f" ? .62 : .46), 2.2, ppm * .55);
    let cnt = 0;
    for (let a = 0; a < L.nAlong; a++) for (let b = 0; b < L.nAcross && cnt < 400; b++, cnt++){
      const u = L.i * span + (a + .5) * stepA, v = (b + .5) * stepB;
      out += gkPlant(L.key, L.horiz ? ix + u : ix + v, L.horiz ? iy + v : iy + u, r, rnd);
    }
  });
  return out;
}
/* ----- Elemente ----- */
function gkDrawItem(it, m, ppm){
  const w = it.w * ppm, h = it.h * ppm, t = it.type, nm = it.name || "", [sx, sy] = gkShadowVec(m), rnd = gkRand(gkHash(it.id));
  const rect = (x, y, ww, hh, rx, extra) => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(ww)}" height="${n1(hh)}" rx="${n1(rx)}" ${extra}/>`;
  switch (t){
    case "rasen":
      return rect(0, 0, w, h, 6, 'fill="url(#gkGrass)"') + rect(0, 0, w, h, 6, 'fill="url(#gkMow)"') + rect(.6, .6, w - 1.2, h - 1.2, 6, 'fill="none" stroke="#5a9244" stroke-opacity=".55" stroke-width="1.2"');
    case "terrasse":
      return rect(0, 0, w, h, 2, 'fill="url(#gkPaver)" stroke="#a59880" stroke-width="1.5"') + rect(1.5, 1.5, w - 3, h - 3, 1, 'fill="none" stroke="#fff" stroke-opacity=".25"');
    case "weg":
      return rect(0, 0, w, h, 3, 'fill="url(#gkGravel)" stroke="#a89c85" stroke-width="1.4"');
    case "haus": {
      const e = clamp(ppm * .25, 2, 7), iw = w - 2 * e, ih = h - 2 * e, sh = Math.min(ppm * 3.2, 30);
      let s = gkSh(rect(0, 0, w, h, 2, ""), sx * sh, sy * sh, .26, true) + rect(0, 0, w, h, 2, 'fill="#3d4247"');
      if (iw >= ih){
        s += rect(e, e, iw, ih / 2, 0, 'fill="#737a82"') + rect(e, e, iw, ih / 2, 0, 'fill="url(#gkTileH)"') + rect(e, e + ih / 2, iw, ih / 2, 0, 'fill="#585e65"') + rect(e, e + ih / 2, iw, ih / 2, 0, 'fill="url(#gkTileH)"');
        s += `<path d="M${n1(e)} ${n1(e + ih / 2)}H${n1(e + iw)}" stroke="#2c3034" stroke-width="${n1(Math.max(2, ppm * .14))}"/><path d="M${n1(e)} ${n1(e + 1)}H${n1(e + iw)}" stroke="#fff" stroke-opacity=".18"/>`;
      } else {
        s += rect(e, e, iw / 2, ih, 0, 'fill="#737a82"') + rect(e, e, iw / 2, ih, 0, 'fill="url(#gkTileV)"') + rect(e + iw / 2, e, iw / 2, ih, 0, 'fill="#585e65"') + rect(e + iw / 2, e, iw / 2, ih, 0, 'fill="url(#gkTileV)"');
        s += `<path d="M${n1(e + iw / 2)} ${n1(e)}V${n1(e + ih)}" stroke="#2c3034" stroke-width="${n1(Math.max(2, ppm * .14))}"/>`;
      }
      const cw = Math.max(4, ppm * .55);
      s += gkSh(rect(e + iw * .66, e + ih * .22, cw, cw, 0, ""), sx * 3, sy * 3, .35, false) + rect(e + iw * .66, e + ih * .22, cw, cw, 1, 'fill="#8d7360" stroke="#55402f" stroke-width="1"') + rect(e + iw * .66 + cw * .22, e + ih * .22 + cw * .22, cw * .56, cw * .56, 0, 'fill="#2b2f33"');
      return s;
    }
    case "huette": {
      const sh = Math.min(ppm * 1.4, 14);
      let s = gkSh(rect(0, 0, w, h, 1, ""), sx * sh, sy * sh, .32, false) + rect(0, 0, w, h, 1, 'fill="url(#gkWood)" stroke="#5e4528" stroke-width="1.4"');
      const horiz = w >= h, step = Math.max(4, ppm * .22);
      for (let i = 1; i * step < (horiz ? w : h); i++) s += horiz ? `<path d="M${n1(i * step)} 0V${n1(h)}" stroke="#000" stroke-opacity=".2"/>` : `<path d="M0 ${n1(i * step)}H${n1(w)}" stroke="#000" stroke-opacity=".2"/>`;
      s += horiz ? rect(0, 0, w, h * .18, 0, 'fill="#fff" opacity=".16"') : rect(0, 0, w * .18, h, 0, 'fill="#fff" opacity=".16"');
      return s;
    }
    case "pool": {
      if (/teich/i.test(nm)){
        let s = `<ellipse cx="${n1(w / 2)}" cy="${n1(h / 2)}" rx="${n1(w / 2)}" ry="${n1(h / 2)}" fill="#7a7a6c"/><ellipse cx="${n1(w / 2)}" cy="${n1(h / 2)}" rx="${n1(w / 2 - 2.5)}" ry="${n1(h / 2 - 2.5)}" fill="url(#gkWater)"/>`;
        for (let i = 0; i < 4; i++) s += `<circle cx="${n1(w * (.25 + rnd() * .5))}" cy="${n1(h * (.25 + rnd() * .5))}" r="${n1(Math.min(w, h) * .09)}" fill="#4f9f55" stroke="#2f6f3a" stroke-width=".8"/>`;
        return s;
      }
      const rx = Math.min(w, h) * .14, c = clamp(ppm * .22, 3, 8);
      return gkSh(rect(0, 0, w, h, rx, ""), sx * 3, sy * 3, .22, false) + rect(0, 0, w, h, rx, 'fill="#e8e4d8" stroke="#bfb9a8" stroke-width="1.4"') + rect(c, c, w - 2 * c, h - 2 * c, rx * .7, 'fill="url(#gkWater)" stroke="#0f6f9f" stroke-opacity=".45" stroke-width="1.6"')
        + `<path d="M${n1(w * .18)} ${n1(h * .38)}q${n1(w * .08)} -${n1(h * .08)} ${n1(w * .16)} 0t${n1(w * .16)} 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><path d="M${n1(w * .45)} ${n1(h * .68)}q${n1(w * .08)} -${n1(h * .08)} ${n1(w * .16)} 0t${n1(w * .16)} 0" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/>`
        + `<ellipse cx="${n1(w * .3)}" cy="${n1(h * .28)}" rx="${n1(w * .2)}" ry="${n1(h * .12)}" fill="#fff" opacity=".18"/>`;
    }
    case "kompost": {
      const f = clamp(ppm * .08, 2, 5);
      return gkSh(rect(0, 0, w, h, 1, ""), sx * 3, sy * 3, .3, false) + rect(0, 0, w, h, 1, 'fill="url(#gkWood)" stroke="#5e4528" stroke-width="1.2"') + rect(f, f, w - 2 * f, h - 2 * f, 0, 'fill="#3f3024"') + rect(f, f, w - 2 * f, h - 2 * f, 0, 'fill="url(#gkSoil)" opacity=".7"');
    }
    case "hochbeet": {
      const f = gkWall(it) * ppm, sh = Math.min(ppm * .5, 6);
      return gkSh(rect(0, 0, w, h, 2, ""), sx * sh, sy * sh, .3, false) + rect(0, 0, w, h, 2, 'fill="url(#gkWood)" stroke="#5e4528" stroke-width="1.2"') + rect(f, f, w - 2 * f, h - 2 * f, 1, 'fill="url(#gkSoil)" stroke="#000" stroke-opacity=".4" stroke-width="1.6"') + gkBedPlants(it, ppm, f, f, w - 2 * f, h - 2 * f);
    }
    case "beet":
      return rect(0, 0, w, h, 5, 'fill="url(#gkSoil)" stroke="#47321f" stroke-width="1.4"') + rect(1.5, 1.5, w - 3, h - 3, 4, 'fill="none" stroke="#fff" stroke-opacity=".12"') + gkBedPlants(it, ppm, gkWall(it) * ppm, gkWall(it) * ppm, w - 2 * gkWall(it) * ppm, h - 2 * gkWall(it) * ppm);
    case "strauch": {
      const long = Math.max(w, h), short = Math.min(w, h);
      let s = "";
      if (long / short >= 2.4){ // Hecke
        const horiz = w >= h, n = Math.max(3, Math.ceil(long / (short * .6))), rr = short * .58;
        s += gkSh(rect(0, 0, w, h, short / 2, ""), sx * 4, sy * 4, .3, false);
        for (let i = 0; i < n; i++){ const u = n === 1 ? long / 2 : short / 2 + i * (long - short) / (n - 1); s += `<circle cx="${n1(horiz ? u : w / 2)}" cy="${n1(horiz ? h / 2 : u)}" r="${n1(rr)}" fill="url(#gkShrub)" stroke="#2f6a3a" stroke-opacity=".5" stroke-width=".8"/>`; }
        return s;
      }
      const r = short / 2, cx = w / 2, cy = h / 2, bloom = gkBloom(nm);
      s += gkSh(`<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w / 2)}" ry="${n1(h / 2)}"/>`, sx * r * .5, sy * r * .5, .3, false);
      for (let i = 0; i < 7; i++){ const a = i * 6.283 / 7, d = r * .42; s += `<circle cx="${n1(cx + Math.cos(a) * d * (w / short))}" cy="${n1(cy + Math.sin(a) * d * (h / short))}" r="${n1(r * .62)}" fill="url(#gkShrub)" stroke="#2f6a3a" stroke-opacity=".45" stroke-width=".7"/>`; }
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * .6)}" fill="url(#gkShrub)"/>`;
      if (bloom) for (let i = 0; i < 12; i++){ const a = rnd() * 6.283, d = r * (.1 + rnd() * .75); s += `<circle cx="${n1(cx + Math.cos(a) * d)}" cy="${n1(cy + Math.sin(a) * d)}" r="${n1(Math.max(1.3, r * .14))}" fill="${bloom}" stroke="#00000028" stroke-width=".4"/>`; }
      return s;
    }
    case "baum": {
      const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2, con = gkConifer(nm), fruit = gkFruit(nm), g = con ? "gkCrownC" : "gkCrown", len = r * .8;
      let s = gkSh(`<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w / 2)}" ry="${n1(h / 2)}"/>`, sx * len, sy * len, .34, true);
      const k = 9;
      for (let i = 0; i < k; i++){ const a = i * 6.283 / k + .3, d = r * .42; s += `<circle cx="${n1(cx + Math.cos(a) * d)}" cy="${n1(cy + Math.sin(a) * d)}" r="${n1(r * .58)}" fill="url(#${g})" stroke="${con ? "#1b4a31" : "#2b6a3a"}" stroke-opacity=".55" stroke-width=".8"/>`; }
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * .62)}" fill="url(#${g})"/>`;
      for (let i = 0; i < 9; i++){ const a = rnd() * 6.283, d = r * (.1 + rnd() * .7); s += `<circle cx="${n1(cx + Math.cos(a) * d)}" cy="${n1(cy + Math.sin(a) * d)}" r="${n1(r * (.07 + rnd() * .1))}" fill="${rnd() > .5 ? "#b9e3a4" : "#1f5a35"}" opacity=".3"/>`; }
      if (fruit) for (let i = 0; i < 16; i++){ const a = rnd() * 6.283, d = r * (.15 + rnd() * .72); s += `<circle cx="${n1(cx + Math.cos(a) * d)}" cy="${n1(cy + Math.sin(a) * d)}" r="${n1(Math.max(1.4, r * .06))}" fill="${fruit}" stroke="#00000030" stroke-width=".4"/>`; }
      return s;
    }
    case "pflanze": {
      const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2, col = gkBloom(nm) || "#e86f9a";
      let s = `<circle cx="${n1(cx + r * .2)}" cy="${n1(cy + r * .3)}" r="${n1(r)}" fill="#000" opacity=".22"/>`;
      for (let i = 0; i < 5; i++) s += `<ellipse cx="${n1(cx)}" cy="${n1(cy - r * .55)}" rx="${n1(r * .3)}" ry="${n1(r * .5)}" transform="rotate(${i * 72 + 20} ${n1(cx)} ${n1(cy)})" fill="#4f9f4f"/>`;
      for (let i = 0; i < 5; i++) s += `<circle cx="${n1(cx + Math.cos(i * 1.2566) * r * .32)}" cy="${n1(cy + Math.sin(i * 1.2566) * r * .32)}" r="${n1(r * .3)}" fill="${col}" stroke="#00000025" stroke-width=".5"/>`;
      return s + `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * .16)}" fill="#f2c94c"/>`;
    }
    default:
      return rect(0, 0, w, h, 3, 'fill="#bcc3ba" stroke="#8d958b" stroke-width="1.4"') + rect(2, 2, w - 4, h - 4, 2, 'fill="none" stroke="#fff" stroke-opacity=".3"');
  }
}
/* ----- Beschriftung (Halo-Text, immer oben) ----- */
function gkLabel(it, ppm){
  const t = MTYPES[it.type], w = it.w * ppm, h = it.h * ppm, nm = it.name || t.l, hasPl = (it.pl || []).length > 0;
  const cropNames = (it.pl || []).map(k => CROPS[k] ? CROPS[k].n : "").filter(Boolean).join(", ") || it.crops || "";
  const cw = (txt, fs) => txt.length * fs * .6;
  const vertical = w < h * .55 && w < 60 && h >= 40, avail = vertical ? h : w * (t.round ? .85 : 1), area = vertical ? w : h;
  let fs = Math.min(clamp(avail / Math.max(5, nm.length) * 1.75, 8, 13), area * .8);
  if (fs < 8.5 || (hasPl && vertical && area < 22)) return "";
  while (fs > 8.5 && cw(nm, fs) > avail - 4) fs -= .5;
  const fit = (txt, f, maxw) => { if (cw(txt, f) <= maxw) return txt; const n = Math.floor(maxw / (f * .6)) - 1; return n >= 3 ? txt.slice(0, n) + "…" : ""; };
  const l1 = fit(nm, fs, avail - 4); if (!l1) return "";
  const two = !vertical && cropNames && h >= 38 && it.type !== "rasen", l2 = two ? fit(cropNames, 10, avail - 6) : "";
  const cy = it.type === "rasen" ? Math.min(h / 2, 18) : h / 2;
  let out = `<g class="gk-lbl" transform="translate(${n1(w / 2)} ${n1(cy)})${vertical ? " rotate(-90)" : ""}"><text y="${l2 ? -3 : fs * .35}" font-size="${n1(fs)}" font-weight="700">${esc(l1)}</text>`;
  if (l2) out += `<text y="${n1(fs * .35 + 11)}" font-size="10" font-weight="500">${esc(l2)}</text>`;
  return out + "</g>";
}
/* ----- gesamte Karte ----- */
function gkRulers(m, ppm){
  const W = m.w * ppm, H = m.l * ppm, major = ppm >= 9 ? 5 : 10, minor = ppm >= 12;
  let s = "";
  for (let x = 0; x <= m.w + .001; x += 1){
    const px = GKM.L + x * ppm, isM = x % major === 0;
    if (!isM && !minor) continue;
    s += `<path d="M${n1(px)} ${GKM.T - (isM ? 6 : 3)}V${GKM.T}" stroke="currentColor" stroke-width="1" opacity=".55"/>`;
    if (isM) s += `<text x="${n1(px)}" y="${GKM.T - 8}" font-size="9" text-anchor="middle" fill="currentColor" class="gk-rt">${x}</text>`;
  }
  for (let y = 0; y <= m.l + .001; y += 1){
    const py = GKM.T + y * ppm, isM = y % major === 0;
    if (!isM && !minor) continue;
    s += `<path d="M${GKM.L - (isM ? 6 : 3)} ${n1(py)}H${GKM.L}" stroke="currentColor" stroke-width="1" opacity=".55"/>`;
    if (isM) s += `<text x="${GKM.L - 9}" y="${n1(py + 3)}" font-size="9" text-anchor="end" fill="currentColor" class="gk-rt">${y}</text>`;
  }
  return s;
}
function gkOrdered(m){ return m.items.slice().sort((a, b) => MTYPES[a.type].z - MTYPES[b.type].z); }
function gkItemGroups(m, ppm){
  return gkOrdered(m).map(it => `<g id="gki-${it.id}" transform="translate(${n1(GKM.L + it.x * ppm)} ${n1(GKM.T + it.y * ppm)})">${gkDrawItem(it, m, ppm)}</g>`).join("");
}
function gkLabelGroups(m, ppm){
  return gkOrdered(m).map(it => `<g id="gkl-${it.id}" transform="translate(${n1(GKM.L + it.x * ppm)} ${n1(GKM.T + it.y * ppm)})">${gkLabel(it, ppm)}</g>`).join("");
}
function gkSvgHTML(m, ppm){
  const W = m.w * ppm, H = m.l * ppm, tw = W + GKM.L + GKM.R, th = H + GKM.T + GKM.B;
  const used = [...new Set(m.items.flatMap(i => i.pl || []))];
  let grid = "";
  for (let x = 1; x < m.w; x++) grid += `<path d="M${n1(GKM.L + x * ppm)} ${GKM.T}V${n1(GKM.T + H)}" stroke="#fff" stroke-opacity="${x % 5 ? .22 : .42}" stroke-width="1"/>`;
  for (let y = 1; y < m.l; y++) grid += `<path d="M${GKM.L} ${n1(GKM.T + y * ppm)}H${n1(GKM.L + W)}" stroke="#fff" stroke-opacity="${y % 5 ? .22 : .42}" stroke-width="1"/>`;
  const base = `<svg class="gk-svg" width="${n1(tw)}" height="${n1(th)}" viewBox="0 0 ${n1(tw)} ${n1(th)}" aria-hidden="true">${gkDefs(ppm, used)}
    <rect x="${GKM.L}" y="${GKM.T}" width="${n1(W)}" height="${n1(H)}" fill="#cbd6b6"/>${ppm >= 6 ? grid : ""}
    <g id="gkitems">${gkItemGroups(m, ppm)}</g>
    <rect x="${GKM.L}" y="${GKM.T}" width="${n1(W)}" height="${n1(H)}" fill="none" stroke="#4b7a47" stroke-width="2.5"/></svg>`;
  const top = `<svg class="gk-svg2" width="${n1(tw)}" height="${n1(th)}" viewBox="0 0 ${n1(tw)} ${n1(th)}" aria-hidden="true"><g class="gk-ruler">${gkRulers(m, ppm)}</g><g id="gklabels">${gkLabelGroups(m, ppm)}</g></svg>`;
  return base + top;
}
/* einzelnes Element beim Ziehen oder Skalieren aktualisieren (ohne alles neu zu zeichnen) */
function gkUpdateItem(it){
  const m = MAP(), ppm = mapPpm(), tr = `translate(${n1(GKM.L + it.x * ppm)} ${n1(GKM.T + it.y * ppm)})`;
  const g = document.getElementById("gki-" + it.id), l = document.getElementById("gkl-" + it.id), h = document.querySelector(`[data-mid="${it.id}"]`), grip = document.querySelector(".gk-grip");
  if (g){ g.setAttribute("transform", tr); if (mdrag && mdrag.mode === "size") g.innerHTML = gkDrawItem(it, m, ppm); }
  if (l){ l.setAttribute("transform", tr); if (mdrag && mdrag.mode === "size") l.innerHTML = gkLabel(it, ppm); }
  if (h){ h.style.left = GKM.L + it.x * ppm + "px"; h.style.top = GKM.T + it.y * ppm + "px"; h.style.width = it.w * ppm + "px"; h.style.height = it.h * ppm + "px"; }
  if (grip){ grip.style.left = GKM.L + (it.x + it.w) * ppm - 14 + "px"; grip.style.top = GKM.T + (it.y + it.h) * ppm - 14 + "px"; }
}
