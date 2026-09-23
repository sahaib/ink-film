// Render frames of the film headlessly, exactly as the video export draws them.
const USAGE = `usage: node render.mjs <film.html> <outdir> <spec...> [--px 1] [--sheet name.png] [--cols 4] [--cell 400]
  spec     a global time in seconds ("12.5") or a plate-local time ("a_opening@3.2"), one per argument
           (zsh does not split an unquoted $T into several: pass $(seq 0 2 14) or an array)
  --px     pixels per drawing unit; 1 → the short side is 1000 px, 1.08 → the export's 1080
  --sheet  also tile every frame, labelled, into <outdir>/<name> (ffmpeg; --cell px on the short side)
Writes <outdir>/<spec with @ → _at_>.png and prints console errors and per-frame render time.`;
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, checkSpec, launch, openPinned, ff } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { px: 'num', sheet: 'str', cols: 'num', cell: 'num' }, USAGE);
const [html, outdir, ...specs] = pos;
if (!html || !outdir || !specs.length) { console.error(USAGE); process.exit(2); }
try { specs.forEach(checkSpec); } catch (e) { console.error(e.message); process.exit(2); }
const px = opt.px ?? 1, cols = Math.max(1, Math.round(opt.cols ?? 4)), cell = Math.max(64, Math.round(opt.cell ?? 400));
if (opt.sheet && (opt.sheet.includes('/') || !opt.sheet.endsWith('.png'))) { console.error('--sheet takes a file name ending .png (written inside outdir)'); process.exit(2); }

fs.mkdirSync(outdir, { recursive: true });
const browser = await launch();
const { page, w, h } = await openPinned(browser, html, px, { log: (kind, text) => console.log(`[${kind === 'pageerror' ? 'pageerror' : 'console.' + kind}]`, text) });
// tag console errors with the frame being drawn
await page.evaluate(() => { const e = console.error.bind(console); console.error = (...a) => e(`[at ${window.__spec ?? 'boot'}]`, ...a); });
console.log(`canvas ${w}×${h} (${px} px/unit)`);

const cells = opt.sheet ? fs.mkdtempSync(path.join(outdir, '.sheet-')) : null;
let failed = 0, k = 0;
for (const spec of specs) {
  let res;
  try {
    res = await page.evaluate(({ spec, cell, label }) => {
      window.__spec = spec;
      const t0 = performance.now(), at = spec.indexOf('@');
      if (at < 0) window.film.renderAt(+spec);
      else window.film.renderScene(spec.slice(0, at), +spec.slice(at + 1));
      const ms = performance.now() - t0;
      const c = document.getElementById('film');
      const out = { ms, url: c.toDataURL('image/png') };
      if (label) {
        // a small labelled copy for the sheet (the full frames are never held in the page together)
        const k = cell / Math.min(c.width, c.height), t = document.createElement('canvas');
        t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
        const x = t.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(c, 0, 0, t.width, t.height);
        x.font = '14px ui-monospace, Menlo, monospace';
        x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, x.measureText(spec).width + 12, 22);
        x.fillStyle = '#fff'; x.fillText(spec, 6, 16);
        out.cell = t.toDataURL('image/png');
      }
      return out;
    }, { spec, cell, label: !!cells });
  } catch (e) {
    console.log(`${spec.padEnd(14)} FAILED  ${e.message.split('\n')[0]}`);
    failed++;
    continue;
  }
  const name = spec.replace('@', '_at_') + '.png';
  fs.writeFileSync(path.join(outdir, name), Buffer.from(res.url.slice(res.url.indexOf(',') + 1), 'base64'));
  if (cells) fs.writeFileSync(path.join(cells, String(k++).padStart(4, '0') + '.png'), Buffer.from(res.cell.slice(res.cell.indexOf(',') + 1), 'base64'));
  console.log(`${spec.padEnd(14)} ${res.ms.toFixed(1)} ms`);
}
await browser.close();

if (cells) {
  const n = fs.readdirSync(cells).length;
  if (n) {
    const c = Math.min(cols, n), rows = Math.ceil(n / c), out = path.join(outdir, opt.sheet);
    ff(['-loglevel', 'error', '-framerate', '1', '-i', path.join(cells, '%04d.png'), '-vf', `tile=${c}x${rows}:padding=6:margin=6:color=0x222222`, '-frames:v', '1', '-update', '1', out]);
    console.log('sheet ->', out);
  }
  fs.rmSync(cells, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
