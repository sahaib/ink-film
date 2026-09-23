// Engraved-cosmos must reproduce the poem film exactly: build the reference kit's textures
// (examples/to-my-mind/kit.js) and a scaffolded 1:1 engraved-cosmos film's (its film.config.js,
// lib/kit.js and lib/presets.js) at the same px in the same browser; compare palette, caption face
// and the paper, void, grain and vignette pixels.
//   INK_FILM_TOOLS=<film>/tools node exact.mjs <film dir> [px ...]      (px default: 1 1.08 1.8)
import { chromium } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [dir, ...pxArgs] = process.argv.slice(2);
if (!dir) { console.error('usage: node exact.mjs <film dir> [px ...]'); process.exit(2); }
const read = (f) => fs.readFileSync(f, 'utf8');
const ref = [read(fileURLToPath(new URL('../examples/to-my-mind/kit.js', import.meta.url)))];
const cfg = read(path.join(dir, 'film.config.js'));
if (!/^ {2}aspect: '1:1',$/m.test(cfg) || !/^ {2}preset: 'engraved-cosmos',$/m.test(cfg)) {
  console.error(`${dir} must be a 1:1 engraved-cosmos film`);
  process.exit(2);
}
const mine = [cfg, read(path.join(dir, 'lib/kit.js')), read(path.join(dir, 'lib/presets.js'))];
const pxs = pxArgs.length ? pxArgs.map(Number) : [1, 1.08, 1.8];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function build(scripts, px) {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><body></body>');
  for (const s of scripts) await page.addScriptTag({ content: s });
  const out = await page.evaluate((px) => {
    const K = window.FILM.K;
    K.buildTextures(px);
    const C = {};
    for (const k of ['void', 'voidInk', 'paper', 'ink', 'sepia', 'mind', 'mindDeep', 'cyan', 'soul', 'soulHot', 'ember', 'ash', 'gold', 'goldLight', 'blueprint', 'storm', 'stormLight']) C[k] = K.C[k];
    const tex = {};
    for (const n of ['paper', 'void', 'grain', 'vignette']) {
      const c = K.tex[n], d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let s = '';
      for (let i = 0; i < d.length; i += 8192) s += String.fromCharCode.apply(null, d.subarray(i, i + 8192));
      tex[n] = { w: c.width, h: c.height, b64: btoa(s) };
    }
    return { C, tex, font: K.FONT };
  }, px);
  await page.close();
  return out;
}
let bad = 0;
for (const px of pxs) {
  const a = await build(ref, px), b = await build(mine, px);
  const pal = JSON.stringify(a.C) === JSON.stringify(b.C);
  console.log(`${pal ? 'PASS' : 'FAIL'}  px ${px}: palette roles ${pal ? 'identical' : 'differ'}${a.font === b.font ? ', caption face identical' : ', caption face differs'}`);
  if (!pal || a.font !== b.font) bad++;
  for (const n of Object.keys(a.tex)) {
    const x = Buffer.from(a.tex[n].b64, 'base64'), y = Buffer.from(b.tex[n].b64, 'base64');
    let diff = 0, max = 0;
    if (x.length === y.length) for (let i = 0; i < x.length; i++) { const d = Math.abs(x[i] - y[i]); if (d) { diff++; if (d > max) max = d; } }
    const same = x.length === y.length && diff === 0;
    console.log(`${same ? 'PASS' : 'FAIL'}  px ${px}: ${n.padEnd(8)} ${a.tex[n].w}x${a.tex[n].h} vs ${b.tex[n].w}x${b.tex[n].h}  differing bytes ${diff} (max ${max})`);
    if (!same) bad++;
  }
}
await browser.close();
console.log(bad ? `exact: ${bad} FAILED` : 'exact: identical');
process.exit(bad ? 1 : 0);
