// Screenshot the whole page at a viewport (layout check) and test for horizontal overflow.
const USAGE = `usage: node page.mjs <film.html> <out.png> [width=390] [height=844] [T]
Prints "horizontal overflow: false|true" and where the canvas sits; exits 1 on overflow or a page error.
T (seconds) opens paused on that moment; without it the film plays.`;
import { launch, openFilm } from './common.mjs';

const [html, out, w = '390', h = '844', T] = process.argv.slice(2);
if (!html || !out || !(+w > 0) || !(+h > 0) || (T !== undefined && !Number.isFinite(+T))) { console.error(USAGE); process.exit(2); }

const browser = await launch();
const errs = [];
const page = await openFilm(browser, html, {
  viewport: { width: +w, height: +h }, dpr: 2, hash: T !== undefined ? '#t' + T : '',
  log: (kind, text) => { if (kind !== 'warning') errs.push(`${kind} ${text}`); },
});
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const b = document.getElementById('film').getBoundingClientRect();
  return {
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    quirks: document.compatMode === 'BackCompat',
    canvas: `${Math.round(b.width)}×${Math.round(b.height)} at (${Math.round(b.left)}, ${Math.round(b.top)})`,
  };
});
console.log('horizontal overflow:', r.overflow);
console.log(`canvas ${r.canvas} in ${w}×${h}`);
if (r.quirks) console.log('note: no doctype (built without --wrap), so the page runs in quirks mode; the Artifact host adds its own');
errs.forEach((e) => console.log('  ', e));
await page.screenshot({ path: out });
await browser.close();
process.exit(r.overflow || errs.length ? 1 : 0);
