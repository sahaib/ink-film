// Page-level behaviour per preset: fonts (injected once, caption face loaded), reduced motion
// (starts paused on the poster frame), the sound button shown (the starter ships lib/audio.js),
// film.size, page tokens, network only to Google Fonts.
//   INK_FILM_TOOLS=<film>/tools node extras.mjs <films dir>      (check.sh's films)
import { chromium } from './browser.mjs';
import path from 'node:path';
const T = process.argv[2];
if (!T) { console.error('usage: node extras.mjs <films dir>'); process.exit(2); }
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) bad++; };
for (const [tag, face] of [['engraved-cosmos-1x1', 'IM Fell English'], ['blueprint-16x9', 'IBM Plex Serif'], ['risograph-9x16', 'Fraunces'], ['brand-1x1', 'Inter']]) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1200 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const net = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) net.push(new URL(r.url()).host); });
  await page.goto('file://' + path.resolve(T, tag, 'dist/film.html'));
  await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 30000 });
  await page.waitForTimeout(600);
  const r = await page.evaluate((face) => {
    const K = window.FILM.K, cs = getComputedStyle(document.documentElement), sound = document.getElementById('sound');
    return {
      links: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href')),
      href: K.FONT_HREF,
      loaded: document.fonts.check(`${K.ITALIC ? 'italic ' : ''}40px "${face}"`) && [...document.fonts].some((f) => f.family.replace(/"/g, '') === face && f.status === 'loaded'),
      clock: document.getElementById('clock').textContent,
      playLabel: document.getElementById('play').getAttribute('aria-label'),
      audio: !!window.FILM.audio,
      soundShown: !sound.hidden && getComputedStyle(sound).display !== 'none' && sound.getBoundingClientRect().width > 0,
      size: window.film.size, W: K.W, H: K.H,
      canvas: [document.getElementById('film').width, document.getElementById('film').height],
      ground: cs.getPropertyValue('--ground').trim(), bodyBg: getComputedStyle(document.body).backgroundColor,
      title: document.title, ar: cs.getPropertyValue('--ar').trim(),
    };
  }, face);
  ok(r.links.filter((h) => h === r.href).length === 1, `${tag}: preset font stylesheet linked once (${r.href})`);
  ok(r.loaded, `${tag}: caption face "${face}" loaded`);
  ok(r.playLabel === 'Play' && r.clock.startsWith('0:04'), `${tag}: reduced motion starts paused on the poster frame (clock ${r.clock}, button "${r.playLabel}")`);
  ok(r.audio && r.soundShown, `${tag}: sound button shown, with lib/audio.js built in (FILM.audio ${r.audio ? 'present' : 'missing'}, button ${r.soundShown ? 'visible' : 'hidden'})`);
  ok(r.size.W === r.W && r.size.H === r.H && Math.abs(r.canvas[0] / r.canvas[1] - r.W / r.H) < 0.01, `${tag}: film.size ${r.size.W}x${r.size.H}, canvas ${r.canvas.join('x')}, --ar ${r.ar}`);
  ok(net.every((h) => h === 'fonts.googleapis.com' || h === 'fonts.gstatic.com'), `${tag}: network only to Google Fonts (${[...new Set(net)].join(', ') || 'none'})`);
  console.log(`      page ground ${r.ground} body ${r.bodyBg} title "${r.title}"`);
  await ctx.close();
}
await browser.close();
console.log(bad ? `extras: ${bad} FAILED` : 'extras: all passed');
process.exit(bad ? 1 : 0);
