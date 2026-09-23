// Render the whole film every --step seconds and report console/page errors and warnings.
const USAGE = `usage: node sweep.mjs <film.html> [--step 0.25]
Prints "rendered N frames across 0–<total>s; errors: N" and the first ten; exits 1 if there were any.`;
import { parseArgs, launch, openFilm } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { step: 'num' }, USAGE);
const [html] = pos;
if (!html) { console.error(USAGE); process.exit(2); }
const step = opt.step ?? 0.25;
if (!(step > 0)) { console.error('--step must be > 0'); process.exit(2); }

const browser = await launch();
const errs = [];
const page = await openFilm(browser, html, { log: (kind, text) => errs.push(`${kind} ${text}`) });
const { n, total } = await page.evaluate((step) => {
  const total = window.film.total;
  let n = 0;
  for (let i = 0; i * step < total; i++) { window.film.renderAt(i * step); n++; }
  document.getElementById('film').getContext('2d').getImageData(0, 0, 1, 1); // flush the last draw
  return { n, total };
}, step);
console.log(`rendered ${n} frames across 0–${+total.toFixed(2)}s; errors: ${errs.length}`);
errs.slice(0, 10).forEach((e) => console.log('  ', e));
await browser.close();
process.exit(errs.length ? 1 : 0);
