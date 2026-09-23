// Shared by the tools: flags, headless system Chrome, and pages pinned for exact frames.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export const FFMPEG = process.env.FFMPEG || (fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg');

/** Split argv into positionals and flags. `flags` maps a name to 'num' | 'str' | 'bool';
    '--name value' and '--name=value' both work; an unknown flag or a bad number exits with usage. */
export function parseArgs(argv, flags, usage) {
  const pos = [], opt = {};
  const fail = (msg) => { console.error(`${msg}\n\n${usage}`); process.exit(2); };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { console.log(usage); process.exit(0); }
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const eq = a.indexOf('='), name = a.slice(2, eq < 0 ? undefined : eq), kind = flags[name];
    if (!kind) fail(`unknown flag --${name}`);
    if (kind === 'bool') { opt[name] = true; continue; }
    const v = eq < 0 ? argv[++i] : a.slice(eq + 1);
    if (v === undefined) fail(`--${name} needs a value`);
    if (kind === 'num') {
      if (!Number.isFinite(+v)) fail(`--${name} must be a number, got "${v}"`);
      opt[name] = +v;
    } else opt[name] = v;
  }
  return { pos, opt };
}

/** A frame spec is a global time in seconds ("12.5") or a plate-local one ("a_opening@3.2").
    Anything else is refused here, before it can reach the page as renderAt(NaN). */
export function checkSpec(spec) {
  if (/^\d+(\.\d+)?$/.test(spec) || /^[\w-]+@\d+(\.\d+)?$/.test(spec)) return spec;
  throw new Error(`bad frame spec "${spec}": use seconds (12.5) or plate@seconds (a_opening@3.2), one per argument`);
}

export const launch = (args = []) => chromium.launch({ channel: 'chrome', headless: true, args });

/** Open a built film in its own browser context and wait for window.film.ready.
    `log(kind, text)` receives page errors and console errors/warnings. `#t0` boots paused. */
export async function openFilm(browser, html, { viewport = { width: 1000, height: 1200 }, dpr = 1, hash = '#t0', log = null, context = {} } = {}) {
  const file = path.resolve(html);
  if (!fs.existsSync(file)) throw new Error(`no such file: ${file}`);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, ...context });
  const page = await ctx.newPage();
  if (log) {
    page.on('pageerror', (e) => log('pageerror', e.message));
    page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') log(t, m.text().split('\n')[0]); });
  }
  await page.goto(pathToFileURL(file).href + hash);
  await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 60000 });
  return page;
}

/** A paused page whose frames are a pure function of T, so any page opened this way renders any T to
    the same pixels (the video export and render.mjs both use it):
    - every stylesheet and every caption face is loaded for every glyph the lines use, then the text
      measures are cleared (the engine's own wait gives up after 2.5 s);
    - the paper and void textures are built at texPX (default ≥ 2, drawn down to the canvas, never up;
      the small viewport boots the canvas at 0.4 px/unit, so forcePX(texPX) always rebuilds them);
    - the canvas is then pinned at px pixels per drawing unit.
    Returns { page, w, h, texPX, missing, fonts }: missing lists the caption faces that did not load
    (all of them if the 15 s wait ran out), fonts is the sorted list of loaded faces of the caption
    families. Compare fonts between pages, and within a page later (loadedFonts), to prove every page
    letters with the same faces and none arrived mid-render. */
export async function openPinned(browser, html, px, { texPX = Math.max(2, px), log = null } = {}) {
  const page = await openFilm(browser, html, { viewport: { width: 480, height: 480 }, dpr: 1, log });
  const info = await page.evaluate(async ([px, texPX]) => {
    const FILM = window.FILM, K = FILM.K;
    const lines = Object.values(FILM.scenes).flatMap((s) => (Array.isArray(s.lines) ? s.lines : []).map((l) => String(l.text)));
    const text = [...new Set(lines.join(''))].join('') || ' ';
    // the faces the canvas letters with: those of the caption families (the page's own UI faces load
    // with layout and don't reach the frames)
    const families = new Set(K.FONT_FACES.map((f) => (/"([^"]+)"/.exec(f) || [])[1]).filter(Boolean));
    window.__inkFonts = () => [...document.fonts].filter((f) => f.status === 'loaded' && families.has(f.family.replace(/^"|"$/g, '')))
      .map((f) => `${f.family.replace(/^"|"$/g, '')} ${f.style} ${f.weight} ${f.unicodeRange.split(',')[0]}`).sort();
    let missing = K.FONT_FACES.slice(); // until the loads below finish
    const settle = (async () => {
      for (const l of document.querySelectorAll('link[rel="stylesheet"]')) {
        if (!l.sheet) await new Promise((r) => { l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }); });
      }
      const got = await Promise.all(K.FONT_FACES.map((f) => document.fonts.load(f, text).catch(() => [])));
      missing = K.FONT_FACES.filter((f, i) => !got[i].some((face) => face.status === 'loaded'));
      await document.fonts.ready;
    })();
    await Promise.race([settle, new Promise((r) => setTimeout(r, 15000))]);
    K.clearTextCache();
    window.film.forcePX(texPX);
    window.film.forcePX(px);
    const c = document.getElementById('film');
    return { w: c.width, h: c.height, texPX: K.PX, missing, fonts: window.__inkFonts() };
  }, [px, texPX]);
  if (texPX > 0.6 && Math.abs(info.texPX - texPX) > 1e-9) throw new Error(`textures were built at ${info.texPX} px/unit, expected ${texPX}`);
  return { page, ...info };
}

/** The caption faces loaded right now, in openPinned's form. */
export const loadedFonts = (page) => page.evaluate(() => window.__inkFonts());

/** Throws unless a pinned page letters with the reference page's faces: the same caption faces
    missing and the same faces loaded. `who` names the page in the message. */
export function sameFonts(who, got, ref) {
  const unloaded = got.missing.filter((f) => !ref.missing.includes(f));
  const lost = ref.fonts.filter((f) => !got.fonts.includes(f)), extra = got.fonts.filter((f) => !ref.fonts.includes(f));
  if (!unloaded.length && !lost.length && !extra.length) return;
  const why = [unloaded.length && `caption face ${unloaded.join(', ')} did not load`, lost.length && `missing ${lost.join(', ')}`, extra.length && `extra ${extra.join(', ')}`];
  throw new Error(`${who} did not load the same fonts as the first page, so its frames would be lettered in another face: ${why.filter(Boolean).join('; ')}`);
}

/** Render one spec and read the canvas back in the same evaluate, so nothing can draw in between. */
export async function grab(page, spec) {
  const url = await page.evaluate((spec) => {
    const at = spec.indexOf('@');
    if (at < 0) window.film.renderAt(+spec);
    else window.film.renderScene(spec.slice(0, at), +spec.slice(at + 1));
    return document.getElementById('film').toDataURL('image/png');
  }, String(spec));
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

/** Run ffmpeg on files (never fed on stdin); throws with the tail of its log on failure. Returns { stdout, stderr }. */
export function ff(args) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 30 });
  if (r.error) throw new Error(`ffmpeg (${FFMPEG}) did not run: ${r.error.message}`);
  const stderr = r.stderr.toString();
  if (r.status !== 0) throw new Error(`ffmpeg failed (exit ${r.status}): ffmpeg ${args.join(' ')}\n${stderr.slice(-1500)}`);
  return { stdout: r.stdout, stderr };
}
