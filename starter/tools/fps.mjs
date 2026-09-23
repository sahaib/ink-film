// Play the film live and report the frames it actually draws per second.
const USAGE = `usage: node fps.mjs <film.html> [startT=1] [seconds=4] [--viewport 1000x1200] [--dpr 2]
The canvas sizes itself to the viewport as it would for a viewer (so its px/unit follows the aspect);
prints "start Ts for Ns: F frames/s (canvas Wpx)". The engine draws at most ~30 frames/s.`;
import { parseArgs, launch, openFilm } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { viewport: 'str', dpr: 'num' }, USAGE);
const [html, start = '1', secs = '4'] = pos;
const vp = /^(\d+)x(\d+)$/.exec(opt.viewport ?? '1000x1200');
if (!html || !vp || !Number.isFinite(+start) || !(+secs > 0)) { console.error(USAGE); process.exit(2); }

const browser = await launch();
const page = await openFilm(browser, html, {
  viewport: { width: +vp[1], height: +vp[2] }, dpr: opt.dpr ?? 2, hash: '',
  log: (kind, text) => { if (kind === 'pageerror') console.log('[pageerror]', text); },
});
const r = await page.evaluate(async ([start, secs]) => {
  const c = document.getElementById('film'), x = c.getContext('2d'), K = window.FILM.K;
  let draws = 0;
  const orig = x.drawImage.bind(x);
  // count frames by the vignette overlay, drawn once per rendered frame (looked up each time: a
  // texture rebuild replaces it)
  x.drawImage = function (img, ...a) { if (img === K.tex.vignette) draws++; return orig(img, ...a); };
  window.film.seek(start); window.film.play();
  await new Promise((r) => setTimeout(r, secs * 1000));
  return { fps: draws / secs, px: c.width };
}, [+start, +secs]);
console.log(`start ${start}s for ${secs}s: ${r.fps.toFixed(1)} frames/s (canvas ${r.px}px)`);
await browser.close();
