// A caption face that arrives late: when the web font lands after the engine stops waiting for it
// (2.5 s), the lettering must be measured again. The film is opened twice: once normally, and once with
// every fonts.gstatic.com response held back 6 s, so the first frames are lettered in the fallback face.
// After the face lands, the first script line must be exactly as wide as on the normal load (±0.5 units).
// The width is read where the viewer sees it: the x of the first and last letter as K.write draws them.
//   INK_FILM_TOOLS=<film>/tools node latefont.mjs <film.html> [...]
import { chromium } from './browser.mjs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node latefont.mjs <film.html> [...]'); process.exit(2); }
const DELAY = 6000, TOL = 0.5;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) bad++; };

/** The film's first script line, a moment it is fully written (on a plate that did not just arrive
    through a transition), and the caption face as a CSS font. */
const pick = () => {
  const { K, ORDER, scenes } = window.FILM;
  for (const s of ORDER) {
    const ln = scenes[s.id] && scenes[s.id].lines && scenes[s.id].lines[0];
    if (!ln) continue;
    const t = ln.at + (ln.wd ?? Math.max(1.3, ln.text.length * 0.06)) + 0.3;
    if (s.index > 0 && t < (s.tr.dur || 0)) continue;
    return { text: ln.text, T: s.start + t, font: `${K.ITALIC === false ? '' : 'italic '}40px ${K.FONT}` };
  }
  return null;
};

/** The line's width in drawing units at global time T: from the first letter's x to the last's, as
    K.write places them (its first pass of each letter, drawn at the letter's own origin). */
const measure = ({ text, T }) => {
  const K = window.FILM.K, write = K.write, xs = [];
  K.write = function (c, s, ...rest) {
    if (s !== text) return write.call(this, c, s, ...rest);
    c.fillText = function (ch, x, y) {
      if (x === 0 && y === 0) { const m = this.getTransform(); xs.push(m.e / Math.hypot(m.a, m.b)); }
      return CanvasRenderingContext2D.prototype.fillText.call(this, ch, x, y);
    };
    try { return write.call(this, c, s, ...rest); } finally { delete c.fillText; }
  };
  try { window.film.renderAt(T); } finally { K.write = write; }
  return xs.length > 1 ? xs[xs.length - 1] - xs[0] : null;
};

async function open(file, delay) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1200 } });
  if (delay) {
    await ctx.route('https://fonts.gstatic.com/**', async (route) => {
      await new Promise((r) => setTimeout(r, delay));
      await route.continue().catch(() => {});
    });
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // not the load event: font requests hold it back, so it would only come once the late face has landed
  await page.goto('file://' + path.resolve(file), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 30000 });
  return { ctx, page, errors };
}
const loaded = (page, line) => page.evaluate(({ font, text }) => document.fonts.check(font, text), line);

for (const file of files) {
  const name = path.basename(file);
  const normal = await open(file, 0);
  const line = await normal.page.evaluate(pick);
  if (!line) { ok(false, `${name}: no script line to measure`); await normal.ctx.close(); continue; }
  await normal.page.waitForFunction(({ font, text }) => document.fonts.check(font, text), line, { timeout: 30000 });
  const want = await normal.page.evaluate(measure, line);
  await normal.ctx.close();

  const late = await open(file, DELAY);
  const early = await loaded(late.page, line);
  const stale = await late.page.evaluate(measure, line); // lettered in the fallback face, and cached
  await late.page.waitForFunction(({ font, text }) => document.fonts.check(font, text), line, { timeout: 30000 });
  await late.page.evaluate(() => document.fonts.ready);
  await late.page.waitForTimeout(300);
  const got = await late.page.evaluate(measure, line);
  await late.ctx.close();

  const f = (x) => (x == null ? 'none' : x.toFixed(2));
  // the case is only staged if the face was still missing at ready and the fallback measured differently
  ok(!early && want != null && stale != null && Math.abs(stale - want) > TOL,
    `${name}: with fonts held back ${DELAY / 1000} s, the film starts in the fallback face ("${line.text}" ${f(stale)} wide, ${f(want)} in the caption face)`);
  ok(got != null && want != null && Math.abs(got - want) <= TOL,
    `${name}: once the face lands, "${line.text}" is re-measured: ${f(got)} wide, ${f(want)} on a normal load (±${TOL})`);
  ok(!normal.errors.length && !late.errors.length, `${name}: no page errors${[...normal.errors, ...late.errors].map((e) => `; ${e}`).join('')}`);
}
await browser.close();
console.log(bad ? `latefont: ${bad} FAILED` : 'latefont: all passed');
process.exit(bad ? 1 : 0);
