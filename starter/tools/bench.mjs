// Real per-frame cost (each frame followed by a forced flush) at --px pixels per drawing unit.
const USAGE = `usage: node bench.mjs <film.html> <spec...> [--px 1.8] [--budget 18]
  spec  a global time ("12.5": the whole frame, transitions included) or "plate@t" (that plate alone)
Averages 12 frames from each spec at 30 fps steps; exits 1 if any is over --budget ms/frame.
Pessimistic by design (getImageData forces a sync); fps.mjs playing live is the other half.`;
import { parseArgs, checkSpec, launch, openPinned } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { px: 'num', budget: 'num' }, USAGE);
const [html, ...specs] = pos;
if (!html || !specs.length) { console.error(USAGE); process.exit(2); }
try { specs.forEach(checkSpec); } catch (e) { console.error(e.message); process.exit(2); }
const px = opt.px ?? 1.8, budget = opt.budget ?? 18;

const browser = await launch(['--enable-gpu', '--ignore-gpu-blocklist']);
// textures at the canvas's own density, as a viewer's page builds them
const { page, w, h } = await openPinned(browser, html, px, { texPX: px, log: (kind, text) => { if (kind === 'pageerror') console.log('[pageerror]', text); } });
console.log(`canvas ${w}×${h} (${px} px/unit), budget ${budget} ms/frame`);
let over = 0;
for (const spec of specs) {
  const ms = await page.evaluate((spec) => {
    const x = document.getElementById('film').getContext('2d'), at = spec.indexOf('@');
    const draw = at < 0 ? (dt) => window.film.renderAt(+spec + dt) : (dt) => window.film.renderScene(spec.slice(0, at), +spec.slice(at + 1) + dt);
    draw(0); x.getImageData(0, 0, 1, 1);
    const t0 = performance.now();
    for (let i = 0; i < 12; i++) { draw(i / 30); x.getImageData(0, 0, 1, 1); }
    return (performance.now() - t0) / 12;
  }, spec);
  if (ms > budget) over++;
  console.log(`${spec.padEnd(14)} ${ms.toFixed(1)} ms/frame${ms > budget ? '  OVER BUDGET' : ''}`);
}
await browser.close();
process.exit(over ? 1 : 0);
