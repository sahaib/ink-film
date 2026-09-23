// A plate in FILM.config.plates with no scene registered: the engine draws the bare ground, letters
// nothing (on-screen text is the script's lines only, never a plate id), and warns once for that id.
//   INK_FILM_TOOLS=<film>/tools node missing.mjs <film.html> <plate id>
import { chromium } from './browser.mjs';
import path from 'node:path';

const [file, id] = process.argv.slice(2);
if (!file || !id) { console.error('usage: node missing.mjs <film.html> <plate id>'); process.exit(2); }
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) bad++; };

const page = await (await browser.newContext({ viewport: { width: 1000, height: 1200 } })).newPage();
const warnings = [], errors = [];
page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); else if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + path.resolve(file));
await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 30000 });
const r = await page.evaluate((id) => {
  const s = window.FILM.ORDER.find((o) => o.id === id);
  if (!s) return null;
  const fill = CanvasRenderingContext2D.prototype.fillText;
  let letters = 0, frames = 0;
  CanvasRenderingContext2D.prototype.fillText = function (...a) { letters++; return fill.apply(this, a); };
  try {
    for (; frames < 12; frames++) window.film.renderAt(s.start + (s.dur * (frames + 0.5)) / 12);
  } finally { CanvasRenderingContext2D.prototype.fillText = fill; }
  return { letters, frames, registered: id in window.FILM.scenes };
}, id);
await page.waitForTimeout(300); // the live loop draws the plate too
await browser.close();

const want = `[ink-film] no scene registered for plate "${id}"`;
if (!r) ok(false, `${path.basename(file)}: no plate "${id}" in FILM.config.plates`);
else {
  ok(!r.registered && r.letters === 0, `plate "${id}" with no scene: ${r.frames} frames drawn with ${r.letters} letters (the id is not lettered on screen)`);
  const n = warnings.filter((w) => w === want).length, other = warnings.filter((w) => w !== want);
  ok(n === 1 && !other.length && !errors.length, `warned once: ${want} (${n}×; other warnings ${other.length}, errors ${errors.length})`);
}
console.log(bad ? `missing: ${bad} FAILED` : 'missing: all passed');
process.exit(bad ? 1 : 0);
