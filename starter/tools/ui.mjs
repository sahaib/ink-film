// Controls, sound, keyboard and reduced-motion smoke test. Every check prints PASS or FAIL.
const USAGE = `usage: node ui.mjs <film.html> [--shot reduced.png]
  --shot  save what a reduced-motion viewer sees at the first flare's peak (or the poster frame)
Exits 1 if any check failed.`;
import fs from 'node:fs';
import { parseArgs, launch, openFilm } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { shot: 'str' }, USAGE);
const [html] = pos;
if (!html) { console.error(USAGE); process.exit(2); }

const browser = await launch(['--autoplay-policy=user-gesture-required']);
const errs = [];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failed++; };
const open = (context = {}) => openFilm(browser, html, {
  viewport: { width: 1100, height: 1000 }, hash: '', context,
  log: (kind, text) => { if (kind !== 'warning') errs.push(`${kind} ${text}`); },
});
const secs = (s) => { const m = /^(\d+):(\d\d)/.exec(s); return m ? +m[1] * 60 + +m[2] : NaN; };
const clock = async (p) => secs(await p.$eval('#clock', (e) => e.textContent));
const label = (p) => p.$eval('#play', (e) => e.getAttribute('aria-label'));
const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;

let p = await open();
const film = await p.evaluate(() => {
  const FILM = window.FILM, cfg = FILM.config || {}, cues = [];
  for (const s of FILM.ORDER) for (const c of FILM.scenes[s.id]?.sfx || []) cues.push({ at: s.start + c.at, kind: c.kind });
  cues.sort((a, b) => a.at - b.at);
  const flare = FILM.ORDER.find((s) => s.index > 0 && s.tr.type === 'flare' && s.tr.dur);
  return {
    total: FILM.TOTAL, cues, audio: !!FILM.audio,
    poster: Math.min(Math.max(cfg.poster ?? FILM.ORDER[0].dur / 2, 0), FILM.TOTAL - 0.01),
    flarePeak: flare ? flare.start + flare.tr.dur / 2 : null,
  };
});
console.log(`film: ${fmt(film.total)}, ${film.cues.length} sound cues, sound ${film.audio ? 'on offer' : 'absent (no lib/audio.js)'}`);

// 1. it plays by itself
await p.waitForTimeout(1500);
check((await clock(p)) >= 1 && (await label(p)) === 'Pause', `autoplay: clock ${fmt(await clock(p))} after 1.5 s, button reads "${await label(p)}"`);

// 2. sound: the toggle builds the synth, a cue fires as the playhead crosses it, and the toggle turns it off
const soundHidden = await p.$eval('#sound', (e) => e.hidden);
if (!film.audio) check(soundHidden, 'no sound engine, so the sound button is hidden');
else {
  check(!soundHidden, 'sound button shown');
  // count the voices the synth starts: a one-shot creates an oscillator or a buffer source when it
  // fires, while the beds are built once, when the sound is first turned on
  await p.evaluate(() => {
    window.__voices = 0;
    const P = (window.BaseAudioContext || window.AudioContext).prototype;
    for (const m of ['createOscillator', 'createBufferSource']) {
      const orig = P[m];
      P[m] = function (...a) { window.__inkAc = this; window.__voices++; return orig.apply(this, a); };
    }
  });
  await p.click('#sound');
  check((await p.$eval('#sound', (e) => e.getAttribute('aria-pressed'))) === 'true', 'sound on: aria-pressed true');
  await p.waitForTimeout(300);
  const state = await p.evaluate(() => (window.FILM.audioBuffers && window.__inkAc ? window.__inkAc.state : 'not built'));
  check(state === 'running', `sound engine built on the first press; audio context ${state}`);
  /** Voices started while playing `ms` from just after a seek to `from`. */
  const voicesFrom = async (from, ms) => {
    await p.evaluate((t) => window.film.seek(t), from);
    await p.waitForTimeout(250); // the seek itself fires nothing (cues between are skipped)
    await p.evaluate(() => { window.__voices = 0; });
    await p.waitForTimeout(ms);
    return p.evaluate(() => window.__voices);
  };
  const cue = film.cues.find((c) => c.at >= 0.4 && c.at <= film.total - 1);
  if (cue) {
    let quiet = null; // a stretch with no cue near it, for the baseline
    for (let a = 0; a + 1.6 <= film.total && quiet === null; a += 0.5) if (!film.cues.some((c) => c.at >= a - 0.1 && c.at <= a + 1.6)) quiet = a;
    const base = quiet === null ? null : await voicesFrom(quiet, 1000);
    const fired = await voicesFrom(Math.max(0, cue.at - 0.6), 1200);
    check(fired > 0 && !base, `crossing the ${cue.kind} cue at ${cue.at.toFixed(2)} s started ${fired} voices (the cue fires)` +
      (quiet === null ? '' : `; a cue-free second from ${quiet} s started ${base}`));
  } else console.log('note: no sound cue to cross (a plate declares sfx: [{ at, kind }])');
  await p.click('#sound');
  check((await p.$eval('#sound', (e) => e.getAttribute('aria-pressed'))) === 'false', 'sound off: aria-pressed false');
}

// 3. keyboard and pointer
await p.click('#play');
check((await label(p)) === 'Play', 'play button pauses (label "Play")');
const before = await clock(p);
await p.focus('#track');
await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
await p.waitForTimeout(200);
const after = await clock(p), want = Math.min(before + 6, Math.floor(film.total - 0.01));
check(Math.abs(after - want) <= 1, `2×ArrowRight on the timeline: ${fmt(before)} → ${fmt(after)} (expected ≈${fmt(want)})`);
await p.keyboard.press('Home'); await p.waitForTimeout(100);
check((await clock(p)) === 0, `Home → ${fmt(await clock(p))}`);
const box = await (await p.$('#track')).boundingBox();
await p.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2); await p.waitForTimeout(150);
const mid = await clock(p);
check(Math.abs(mid - film.total / 2) <= 1, `click at 50% of the timeline → ${fmt(mid)} (expected ≈${fmt(film.total / 2)})`);
const live = await p.evaluate(() => {
  const T = window.film.total * 0.5, s = [...window.FILM.ORDER].reverse().find((o) => T >= o.start), sc = window.FILM.scenes[s.id];
  return { shown: document.getElementById('now-line').textContent, want: sc && sc.lines ? sc.lines.map((l) => l.text).join(' ') : '' };
});
check(live.shown === live.want, `live region reads the plate's lines: "${live.shown}"`);
await p.evaluate(() => document.activeElement && document.activeElement.blur());
await p.keyboard.press('Space'); await p.waitForTimeout(100);
const spaced = await label(p);
await p.keyboard.press('Space'); await p.waitForTimeout(100);
check(spaced === 'Pause' && (await label(p)) === 'Play', 'Space plays and pauses');
await p.context().close();

// 4. reduced motion: starts paused on the poster frame
p = await open({ reducedMotion: 'reduce' });
await p.waitForTimeout(800);
const rc = await clock(p);
check(rc === Math.floor(film.poster) && (await label(p)) === 'Play', `reduced motion: paused on ${fmt(rc)} (poster ${film.poster} s), button reads "${await label(p)}"`);
if (opt.shot) {
  const T = film.flarePeak ?? film.poster;
  const url = await p.evaluate((T) => { window.film.forcePX(1); window.film.renderAt(T); return document.getElementById('film').toDataURL('image/png'); }, T);
  fs.writeFileSync(opt.shot, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  console.log(`shot -> ${opt.shot} (reduced motion, T=${T})`);
}

check(!errs.length, `page errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await browser.close();
process.exit(failed ? 1 : 0);
