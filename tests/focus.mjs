// Review Focus tests for the ink-film starter, run against the films check.sh built.
//   INK_FILM_TOOLS=<film>/tools node focus.mjs <films dir> [preset ...]
// <films dir> holds check.sh's films (<preset>-<WxH>/dist/film.html, the brand fixtures, the negative
// controls) and a frames/ folder.
// Review Focus 1–3 of the plan (4, export drift, is in export.sh; 5, scaffold refusal, in scaffold.sh):
// 1. aspect centring  — brightest-region centroid of a_opening@4 within 8% of frame centre, every film
// 2. preset switch    — mean RGB of blueprint vs risograph frames differ by > 40 (separate pages),
//                       and a live K.usePreset() rebuilds the textures (no stale paper)
// 3. low contrast     — brand tokens ink #777 / paper #888 warn "[ink-film] contrast" and pick a caption
//                       ink with >= 4.5:1 against paper; same for darkInk / dark
// Plus: every film's caption inks reach 4.5:1 on their grounds, and
// - 9:16 captions  — text and scrim stay out of the bottom 20% (platform UI), for every preset
// - embedded fonts — a client font given as a data: URI loads and letters the captions; the remote
//                     entry is refused with a warning; the page makes no network request at all
import { chromium } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';

const T = process.argv[2];
const presets = process.argv.slice(3).length ? process.argv.slice(3) : ['engraved-cosmos', 'blueprint', 'risograph', 'brand'];
const aspects = ['1x1', '9x16', '16x9'];
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failed++; };

// WCAG 2 contrast, computed here independently of the kit's own helper
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (hex) => { const h = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function open(html) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()} ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror ${e.message}`));
  await page.goto('file://' + path.resolve(html) + '#t0');
  await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 30000 });
  await page.evaluate(() => { window.film.pause(); window.film.forcePX(1); });
  return { page, logs };
}

/** Render id@t and measure it in the page: mean RGB, and the centroid of the brightest region —
    the brightest 1.5% of the frame after averaging brightness over 100-unit neighbourhoods (the
    subject's scale), so paper stains, grain and single lines can't outvote the subject. */
function stats(page, spec) {
  return page.evaluate((spec) => {
    const [id, t] = spec.split('@');
    window.film.renderScene(id, +t);
    const c = document.getElementById('film'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const { W, H } = window.film.size, w = c.width, h = c.height, cell = Math.max(1, Math.round((20 * w) / W));
    const gw = Math.floor(w / cell), gh = Math.floor(h / cell), cells = new Float64Array(gw * gh);
    let R = 0, G = 0, B = 0;
    for (let y = 0; y < h; y++) {
      const gy = Math.floor(y / cell);
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        R += d[i]; G += d[i + 1]; B += d[i + 2];
        const gx = Math.floor(x / cell);
        if (gx < gw && gy < gh) cells[gy * gw + gx] += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }
    }
    // 5×5-cell box average (100 units), clipped at the frame edge
    const blur = new Float64Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      let s = 0, m = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        const x = gx + i, y = gy + j;
        if (x >= 0 && y >= 0 && x < gw && y < gh) { s += cells[y * gw + x]; m++; }
      }
      blur[gy * gw + gx] = s / m;
    }
    const n = w * h, sorted = Array.from(blur).sort((a, b) => b - a);
    const cut = sorted[Math.max(0, Math.floor(sorted.length * 0.015) - 1)];
    // one region: the connected cells (8-neighbour) at or above the cut that hold the brightest point,
    // so two separate bright patches can't average out to a false centre
    let top = 0;
    for (let i = 1; i < blur.length; i++) if (blur[i] > blur[top]) top = i;
    const seen = new Uint8Array(gw * gh), stack = [top];
    seen[top] = 1;
    let sx = 0, sy = 0, k = 0;
    while (stack.length) {
      const i = stack.pop(), gx = i % gw, gy = (i - gx) / gw;
      sx += gx + 0.5; sy += gy + 0.5; k++;
      for (let j = -1; j <= 1; j++) for (let q = -1; q <= 1; q++) {
        const x = gx + q, y = gy + j, o = y * gw + x;
        if (x >= 0 && y >= 0 && x < gw && y < gh && !seen[o] && blur[o] >= cut) { seen[o] = 1; stack.push(o); }
      }
    }
    const cx = ((sx / k) * cell * W) / w, cy = ((sy / k) * cell * H) / h;
    return { W, H, mean: [R / n, G / n, B / n], cx, cy, cells: k, dx: (cx - W / 2) / W, dy: (cy - H / 2) / H };
  }, spec);
}

const film = (tag) => path.join(T, tag, 'dist', 'film.html');
const means = {};

// ---- 1. aspect centring (every built film) + caption contrast on both grounds
for (const p of presets) {
  for (const a of aspects) {
    const tag = `${p}-${a}`;
    if (!fs.existsSync(film(tag))) { ok(false, `${tag}: no built film`); continue; }
    const { page } = await open(film(tag));
    const s = await stats(page, 'a_opening@4');
    means[tag] = s.mean;
    ok(Math.abs(s.dx) <= 0.08 && Math.abs(s.dy) <= 0.08,
      `centring ${tag.padEnd(22)} ${s.W}x${s.H} bright centroid (${s.cx.toFixed(0)}, ${s.cy.toFixed(0)}) off centre by dx ${(s.dx * 100).toFixed(1)}% dy ${(s.dy * 100).toFixed(1)}%`);
    if (a === '1x1') {
      const C = await page.evaluate(() => ({ ...window.FILM.K.C }));
      const cp = contrast(C.captionInk, C.paper), cv = contrast(C.captionInkDark, C.void);
      ok(cp >= 4.5 && cv >= 4.5, `captions ${p.padEnd(16)} captionInk/paper ${cp.toFixed(2)}:1, captionInkDark/void ${cv.toFixed(2)}:1`);
    }
    await page.close();
  }
}

// negative control: a plate that hard-codes the square must fail the same measure
for (const a of ['9x16', '16x9']) {
  const tag = `negative-${a}`;
  if (!fs.existsSync(film(tag))) { ok(false, `${tag}: no built film`); continue; }
  const { page } = await open(film(tag));
  const s = await stats(page, 'a_opening@4');
  ok(Math.abs(s.dx) > 0.08 || Math.abs(s.dy) > 0.08,
    `control  ${tag.padEnd(22)} hard-coded 1000x1000 plate is caught: dx ${(s.dx * 100).toFixed(1)}% dy ${(s.dy * 100).toFixed(1)}%`);
  await page.close();
}

// ---- 2. preset switch
if (presets.includes('blueprint') && presets.includes('risograph')) {
  for (const a of aspects) {
    const b = means[`blueprint-${a}`], r = means[`risograph-${a}`];
    if (!b || !r) continue;
    ok(dist(b, r) > 40, `preset switch ${a}: mean RGB blueprint (${b.map((v) => v.toFixed(0))}) vs risograph (${r.map((v) => v.toFixed(0))}) differ by ${dist(b, r).toFixed(1)}`);
  }
}
if (presets.includes('engraved-cosmos') && presets.includes('risograph') && fs.existsSync(film('engraved-cosmos-1x1'))) {
  // live switch in one page: the paper must follow the preset, not stay as it was first built
  const { page } = await open(film('engraved-cosmos-1x1'));
  const before = await stats(page, 'a_opening@4');
  await page.evaluate(() => window.FILM.K.usePreset('risograph'));
  const after = await stats(page, 'a_opening@4');
  const fresh = means['risograph-1x1'];
  ok(dist(after.mean, fresh) < 10 && dist(before.mean, fresh) > 25,
    `live K.usePreset: cosmos→risograph mean ${dist(before.mean, fresh).toFixed(1)} → ${dist(after.mean, fresh).toFixed(1)} from a fresh risograph page (< 10 = textures rebuilt)`);
  await page.close();
}

// ---- 3. low-contrast brand
for (const [name, pair, ground, inkRole] of [
  ['brand-lowcontrast', 'ink/paper', 'paper', 'captionInk'],
  ['brand-lowdark', 'darkInk/dark', 'void', 'captionInkDark'],
]) {
  if (!presets.includes('brand')) break;
  if (!fs.existsSync(film(name))) { ok(false, `${name}: no built film`); continue; }
  const { page, logs } = await open(film(name));
  const C = await page.evaluate(() => ({ ...window.FILM.K.C }));
  const warns = logs.filter((l) => l.startsWith('warning [ink-film] contrast'));
  const others = logs.filter((l) => /^(error|pageerror)/.test(l));
  const c = contrast(C[inkRole], C[ground]);
  ok(warns.length === 1 && warns[0].includes(pair), `${name}: contrast warning logged once for ${pair}: ${JSON.stringify(warns[0] || null)}`);
  ok(c >= 4.5, `${name}: K.C.${inkRole} ${C[inkRole]} on ${ground} ${C[ground]} = ${c.toFixed(2)}:1 (>= 4.5)`);
  ok(others.length === 0, `${name}: no errors (${others.length})`);
  await page.close();
}

// ---- 9:16 captions clear the platform UI
/** Rows the caption treatment (text + scrim) touches: render id@t with and without its lines at the
    same T and boil, so any differing pixel is caption. */
function captionRows(page, spec) {
  return page.evaluate((spec) => {
    const [id, t] = spec.split('@');
    const c = document.getElementById('film'), x = c.getContext('2d'), w = c.width, h = c.height;
    window.film.renderScene(id, +t);
    const a = x.getImageData(0, 0, w, h).data;
    const sc = window.FILM.scenes[id], keep = sc.lines;
    sc.lines = [];
    window.film.renderScene(id, +t);
    const b = x.getImageData(0, 0, w, h).data;
    sc.lines = keep;
    let first = -1, last = -1, n = 0;
    for (let y = 0; y < h; y++) {
      let hit = false;
      for (let i = y * w * 4, e = (y + 1) * w * 4; i < e; i++) if (a[i] !== b[i]) { hit = true; n++; }
      if (hit) { if (first < 0) first = y; last = y; }
    }
    return { first, last, n, h, H: window.film.size.H };
  }, spec);
}
for (const p of presets) {
  const tag = `${p}-9x16`;
  if (!fs.existsSync(film(tag))) continue;
  const { page } = await open(film(tag));
  for (const spec of ['a_opening@4', 'b_closing@3']) {
    const r = await captionRows(page, spec), u = r.H / r.h, floor = 0.8 * r.h;
    ok(r.n > 0 && r.last < floor,
      `9:16 caption ${tag.padEnd(20)} ${spec.padEnd(12)} spans y ${(r.first * u).toFixed(0)}–${(r.last * u).toFixed(0)} of ${r.H}; bottom 20% starts at ${(0.8 * r.H).toFixed(0)}`);
  }
  await page.close();
}

// ---- client font embedded as a data URI
if (presets.includes('brand')) {
  const tag = 'brand-fontfile';
  if (!fs.existsSync(film(tag))) ok(false, `${tag}: no built film`);
  else {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1 });
    const net = [], logs = [];
    page.on('request', (q) => { const u = q.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) net.push(u); });
    page.on('console', (m) => logs.push(`${m.type()} ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`pageerror ${e.message}`));
    await page.goto('file://' + path.resolve(film(tag)) + '#t0');
    await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const K = window.FILM.K, fam = (f) => f.family.replace(/"/g, '');
      const c = document.createElement('canvas').getContext('2d'), s = 'A single point of light,';
      const width = (font) => { c.font = font; return c.measureText(s).width; };
      return {
        check: document.fonts.check('40px "Ink Fixture"'), checkItalic: document.fonts.check('italic 40px "Ink Fixture"'),
        faces: [...document.fonts].filter((f) => fam(f) === 'Ink Fixture').map((f) => `${f.style}/${f.status}`),
        remote: [...document.fonts].filter((f) => fam(f) === 'Ink Remote').length,
        used: width('40px "Ink Fixture", monospace'), fallback: width('40px monospace'),
        italic: K.ITALIC, href: K.FONT_HREF,
      };
    });
    ok(r.check && r.faces.includes('normal/loaded') && r.faces.includes('italic/loaded'),
      `${tag}: document.fonts.check('40px "Ink Fixture"') ${r.check}; faces ${r.faces.join(', ')}`);
    ok(Math.abs(r.used - r.fallback) > 1, `${tag}: the embedded face is what letters text (width ${r.used.toFixed(1)} vs fallback ${r.fallback.toFixed(1)})`);
    ok(r.italic === true, `${tag}: an italic file for the text family sets K.ITALIC (${r.italic})`);
    ok(r.href === null && r.remote === 0, `${tag}: embedded and declared families are not requested from Google (FONT_HREF ${r.href}); remote file not loaded`);
    ok(net.length === 0, `${tag}: no request leaves the page (${net.length}${net.length ? ': ' + net.slice(0, 3).join(', ') : ''})`);
    const refused = logs.filter((l) => l.startsWith('warning [ink-film] embedded font "Ink Remote"'));
    const other = logs.filter((l) => /^(error|pageerror|warning)/.test(l) && !refused.includes(l));
    ok(refused.length === 1 && other.length === 0, `${tag}: remote URL refused with one warning ${JSON.stringify(refused[0] || null)}; other warnings/errors ${other.length}`);
    // a frame to look at
    const url = await page.evaluate(() => { window.film.pause(); window.film.forcePX(1); window.film.renderScene('a_opening', 4); return document.getElementById('film').toDataURL('image/png'); });
    fs.writeFileSync(path.join(T, 'frames', `${tag}-a_opening_at_4.png`), Buffer.from(url.split(',')[1], 'base64'));
    await page.close();
  }
}

await browser.close();
console.log(failed ? `focus: ${failed} FAILED` : 'focus: all passed');
process.exit(failed ? 1 : 0);
