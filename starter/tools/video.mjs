// Export the film to video: every frame rendered exactly, the soundtrack rendered offline, then ffmpeg.
const USAGE = `usage: node video.mjs <film.html> <outdir> [--size 1080] [--fps 30] [--workers 8]
  --size     the short side in pixels (px/unit = size/1000): 1080 → 1080×1080, 1080×1920 or 1920×1080
  --fps      frames per second of the video (the ink itself boils at 12)
  --workers  pages rendering frames in parallel
Writes into outdir: <slug>-<W>x<H>.mp4 (H.264 CRF 16 + AAC, −16 LUFS / −1.5 dBTP), <slug>-<W>x<H>-share.mp4
(the same at CRF 24, capped at 12 Mb/s, for messaging and social uploads), <slug>-<W>x<H>-silent.mp4,
soundtrack.wav, poster.png (at FILM.config.poster) and captions.srt (when the plates have lines);
<slug> comes from the title.
Then checks the files: every video holds every frame, and a few frames of both cuts match fresh
renders in a new page (byte-identical re-render, not a neighbour's frame, no colour shift). Exits 1 if
a check fails, a page letters with other fonts than the first, or a page logged an error.`;
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { parseArgs, launch, openPinned, loadedFonts, sameFonts, grab, ff, FFMPEG } from './common.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { size: 'num', fps: 'num', workers: 'num' }, USAGE);
const [html, outdir] = pos;
if (!html || !outdir) { console.error(USAGE); process.exit(2); }
const SIZE = opt.size ?? 1080, FPS = opt.fps ?? 30, WORKERS = Math.max(1, Math.round(opt.workers ?? 8));
if (!(Number.isInteger(SIZE) && SIZE >= 100) || !(FPS > 0 && FPS <= 120)) { console.error(`--size must be a whole number ≥ 100 and --fps in (0, 120]\n\n${USAGE}`); process.exit(2); }
const PX = SIZE / 1000, RATE = 48000;
const t0 = Date.now(), since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
const errors = [];
const log = (kind, text) => { if (kind !== 'warning') errors.push(`${kind} ${text}`); };

fs.mkdirSync(outdir, { recursive: true });
const WORK = fs.mkdtempSync(path.join(outdir, '.video-')); // intermediates; removed at the end
const browser = await launch();
let enc = null, probe = null;
try {
  await main();
} catch (e) {
  console.error(`video: FAILED  ${e.message}`);
  if (enc) enc.kill('SIGKILL');
  await browser.close().catch(() => {});
  fs.rmSync(WORK, { recursive: true, force: true });
  process.exit(1);
}

async function main() {
  // ------------------------------------------------------------------ what the film is
  probe = await openPinned(browser, html, PX, { log: (kind, text) => (kind === 'warning' ? console.log('[console.warning]', text) : log(kind, text)) });
  if (probe.missing.length) console.log(`warning: never loaded, so the export letters them in a fallback face: ${probe.missing.join(', ')}`);
  const meta = await probe.page.evaluate(() => {
    const FILM = window.FILM, cfg = FILM.config || {};
    return {
      title: String(cfg.title || ''),
      total: FILM.TOTAL,
      poster: Math.min(Math.max(cfg.poster ?? FILM.ORDER[0].dur / 2, 0), FILM.TOTAL - 0.01),
      audio: !!(FILM.audio && FILM.audio.renderOffline),
      plates: FILM.ORDER.map((s) => {
        const lines = FILM.scenes[s.id] && Array.isArray(FILM.scenes[s.id].lines) ? FILM.scenes[s.id].lines : [];
        return { start: s.start, dur: s.dur, lines: lines.map((l) => ({ text: String(l.text), at: +l.at, out: l.out == null ? null : +l.out })) };
      }),
    };
  });
  // H.264 in 4:2:0 needs even sides; a canvas an odd pixel wide loses its last column
  const W = probe.w - (probe.w % 2), H = probe.h - (probe.h % 2), N = Math.round(meta.total * FPS);
  const slug = meta.title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'film';
  const base = path.join(outdir, `${slug}-${W}x${H}`);
  const OUT = { full: `${base}.mp4`, share: `${base}-share.mp4`, silent: `${base}-silent.mp4`, wav: path.join(outdir, 'soundtrack.wav'), poster: path.join(outdir, 'poster.png'), srt: path.join(outdir, 'captions.srt') };
  const wrote = [];
  console.log(`film: "${meta.title}" ${meta.total} s → ${N} frames at ${FPS} fps, ${W}×${H} (${PX} px/unit, textures ${probe.texPX}), ${WORKERS} workers`);

  // ------------------------------------------------------------------ poster and captions
  fs.writeFileSync(OUT.poster, await grab(probe.page, String(meta.poster)));
  wrote.push(OUT.poster);
  const cues = captions(meta.plates, meta.total);
  if (cues.n) {
    fs.writeFileSync(OUT.srt, cues.srt);
    wrote.push(OUT.srt);
  }
  console.log(`poster: T=${meta.poster} s; ${cues.n ? `captions: ${cues.n} cues` : 'no script lines — captions.srt not written'}`);

  // ------------------------------------------------------------------ picture (streamed to ffmpeg in order) and sound, together
  // One pass encodes both cuts from the same frames: the master at CRF 16, and the share cut at CRF 24
  // held under 12 Mb/s by the VBV (quality-driven below that; grain-heavy looks hit the cap).
  const SILENT = path.join(WORK, 'silent.mp4'), SHARE_SILENT = path.join(WORK, 'share-silent.mp4');
  const x264 = (crf, file, cap = []) => ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), ...cap, '-profile:v', 'high', '-g', String(Math.round(FPS * 2)),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', file];
  enc = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', 'pipe:0',
    // tagged BT.709 end to end so players don't shift the colours (the frames carry the tags: the
    // -color_* options alone leave primaries and transfer unset in the file)
    '-filter_complex', `[0:v]crop=${W}:${H}:0:0,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv,split=2[master][share]`,
    '-map', '[master]', ...x264(16, SILENT),
    '-map', '[share]', ...x264(24, SHARE_SILENT, ['-maxrate', '12M', '-bufsize', '24M'])], { stdio: ['pipe', 'ignore', 'pipe'] });
  let encLog = '';
  enc.stderr.on('data', (d) => { encLog = (encLog + d).slice(-3000); });
  enc.stdin.on('error', () => {}); // a broken pipe surfaces as encDone's rejection
  const encDone = new Promise((res, rej) => {
    enc.on('error', (e) => rej(new Error(`ffmpeg (${FFMPEG}) did not run: ${e.message}`)));
    enc.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg (video) exit ${code}\n${encLog}`))));
  });
  encDone.catch(() => {}); // awaited below; this only stops an early failure being reported as unhandled

  const [hashes, RAW] = await Promise.all([frames(N, encDone), sound(probe.page, meta.audio)]);
  await probe.page.context().close();
  fs.renameSync(SILENT, OUT.silent);
  wrote.push(OUT.silent);

  // ------------------------------------------------------------------ loudness and the final mix
  if (RAW) {
    soundtrack(RAW, OUT.wav);
    const aac = /\baac_at\b/.test(ff(['-encoders']).stdout.toString()) ? 'aac_at' : 'aac';
    if (aac !== 'aac_at') console.log("warning: Apple's AAC encoder (aac_at) is missing; ffmpeg's own adds more overshoot on transients");
    ff(['-loglevel', 'error', '-i', OUT.silent, '-i', OUT.wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', aac, '-b:a', '256k', '-ar', String(RATE), '-shortest', '-movflags', '+faststart', OUT.full]);
    // the share cut takes the master's AAC stream as it is, so both carry the same sound (no -shortest:
    // AAC framing ends that stream a few ms early, and cutting to it would drop the last frame)
    ff(['-loglevel', 'error', '-i', SHARE_SILENT, '-i', OUT.full, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', OUT.share]);
    wrote.push(OUT.wav, OUT.full, OUT.share);
    const m = loudness(['-i', OUT.full, '-vn']);
    const ok = +m.input_tp <= -1.5 && Math.abs(+m.input_i + 16) <= 1;
    console.log(`sound: ${path.basename(OUT.full)} I=${m.input_i} LUFS, true peak ${m.input_tp} dBTP (${aac})${ok ? '' : '  (warning: outside −16 ±1 LUFS / −1.5 dBTP)'}  ${since()}`);
  } else {
    fs.renameSync(SHARE_SILENT, OUT.share);
    wrote.push(OUT.share);
    console.log('warning: no FILM.audio (lib/audio.js not built in), so the cuts are silent: no soundtrack.wav and no master with sound');
  }

  // ------------------------------------------------------------------ the encoded frames are the rendered ones
  await verify({ master: RAW ? OUT.full : OUT.silent, share: OUT.share, silent: OUT.silent }, W, H, N, meta.poster, hashes);

  for (const f of wrote) console.log(`  ${f}  ${(fs.statSync(f).size / 1e6).toFixed(1)} MB`);
  await browser.close();
  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(errors.length ? `page errors (${errors.length}):\n  ${errors.slice(0, 10).join('\n  ')}` : 'page errors: none');
  console.log(`video: done in ${since()}`);
  if (errors.length) process.exit(1);
}

/** Render frames 0..n-1 in WORKERS pinned pages, pulling indices from one counter, and write them to
    the encoder in order (a frame waits in `pending` until every earlier one is written). Every worker
    must letter with the probe page's fonts, before and after its frames. Returns each frame's PNG
    hash, for the determinism check. */
async function frames(n, encDone) {
  let next = 0, written = 0;
  const pending = new Map(), hashes = new Array(n), every = Math.max(1, Math.round(n / 10));
  const flush = async () => {
    while (pending.has(written)) {
      const buf = pending.get(written);
      pending.delete(written);
      const count = ++written; // (another worker may move `written` on during the await below)
      if (!enc.stdin.write(buf)) await Promise.race([once(enc.stdin, 'drain'), encDone]);
      if (count % every === 0 || count === n) console.log(`  frames ${count}/${n}  ${since()}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(WORKERS, n) }, async (_, k) => {
    const worker = await openPinned(browser, html, PX, { log }), page = worker.page;
    sameFonts(`worker ${k + 1}`, worker, probe);
    for (;;) {
      while (next < n && next - written > WORKERS * 4) await new Promise((r) => setTimeout(r, 5)); // bound the reorder window
      if (next >= n) break;
      const i = next++, png = await grab(page, String(i / FPS));
      hashes[i] = sha1(png);
      pending.set(i, png);
      await flush();
    }
    sameFonts(`worker ${k + 1}, after its frames,`, { missing: worker.missing, fonts: await loadedFonts(page) }, worker);
    await page.context().close();
  }));
  enc.stdin.end();
  await encDone;
  return hashes;
}

function sha1(buf) { return createHash('sha1').update(buf).digest('hex'); }

/** The soundtrack from FILM.audio.renderOffline, handed back as 32-bit float (no clipping, no
    rounding before the loudness chain) and written as a float WAV. */
async function sound(page, has) {
  if (!has) return null;
  const r = await page.evaluate(async (rate) => {
    const buf = await window.FILM.audio.renderOffline({ rate });
    const n = buf.length, L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
    const inter = new Float32Array(n * 2);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      inter[2 * i] = L[i]; inter[2 * i + 1] = R[i];
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    // back as base64 pieces of 3 MiB (a multiple of 3 bytes, so each decodes on its own)
    const bytes = new Uint8Array(inter.buffer), out = [];
    for (let i = 0; i < bytes.length; i += 3 << 20) {
      const sub = bytes.subarray(i, i + (3 << 20));
      let bin = '';
      for (let j = 0; j < sub.length; j += 0x8000) bin += String.fromCharCode.apply(null, sub.subarray(j, j + 0x8000));
      out.push(btoa(bin));
    }
    return { out, peak, seconds: n / buf.sampleRate, rate: buf.sampleRate };
  }, RATE);
  const data = Buffer.concat(r.out.map((b) => Buffer.from(b, 'base64')));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
  head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(3, 20); head.writeUInt16LE(2, 22); // IEEE float, stereo
  head.writeUInt32LE(r.rate, 24); head.writeUInt32LE(r.rate * 8, 28); head.writeUInt16LE(8, 32); head.writeUInt16LE(32, 34);
  head.write('data', 36); head.writeUInt32LE(data.length, 40);
  const RAW = path.join(WORK, 'soundtrack-raw.wav');
  fs.writeFileSync(RAW, Buffer.concat([head, data]));
  console.log(`  audio: ${r.seconds.toFixed(2)} s rendered offline, sample peak ${r.peak.toFixed(3)}  ${since()}`);
  return RAW;
}

/** loudnorm prints its measurements as the last JSON object on stderr. */
function lastJson(text) { return JSON.parse(text.slice(text.lastIndexOf('{'), text.lastIndexOf('}') + 1)); }
function loudness(input) { return lastJson(ff([...input, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr); }

/** The raw mix is quiet with tall transients, so a straight lift to −16 LUFS would clip them: lift,
    catch the transients with a look-ahead limiter, then normalise linearly (two-pass loudnorm) to
    −16 LUFS / −1.5 dBTP. The limiter runs 4× oversampled so it sees the true, inter-sample peaks;
    its −3.5 dB ceiling leaves room for the ~1 dB of overshoot AAC adds. */
function soundtrack(raw, wav) {
  const m0 = loudness(['-i', raw]);
  if (!(+m0.input_i > -70)) {
    console.log(`warning: the soundtrack is silent (${m0.input_i} LUFS), so it is written without normalising`);
    ff(['-loglevel', 'error', '-i', raw, '-ar', String(RATE), '-c:a', 'pcm_s16le', wav]);
    return;
  }
  const lift = (-16 - +m0.input_i).toFixed(2), LIMITED = path.join(WORK, 'soundtrack-limited.wav');
  ff(['-loglevel', 'error', '-i', raw, '-af', `volume=${lift}dB,aresample=${RATE * 4},alimiter=limit=0.667:attack=1:release=60:level=false:latency=true,aresample=${RATE}`, '-c:a', 'pcm_f32le', LIMITED]);
  const m1 = loudness(['-i', LIMITED]);
  const m2 = lastJson(ff(['-i', LIMITED, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true:print_format=json`, '-ar', String(RATE), '-c:a', 'pcm_s16le', wav]).stderr);
  console.log(`audio: raw I=${m0.input_i} LUFS TP=${m0.input_tp} → lift ${lift} dB + limiter → I=${m1.input_i} TP=${m1.input_tp} → loudnorm (${m2.normalization_type}) → I=${m2.output_i} TP=${m2.output_tp}`);
}

/** SRT from the plates' lines. A line shows from `at` until its fade ends (ln.out ?? dur − 0.8, plus
    the 0.7 s fade: 0.1 s before the plate ends), or until the next line starts if that is sooner. */
function captions(plates, total) {
  const cues = [];
  for (const s of plates) for (const ln of s.lines) {
    const start = s.start + ln.at, end = Math.min(s.start + Math.min(s.dur, (ln.out ?? s.dur - 0.8) + 0.7), total);
    if (Number.isFinite(start) && end > start) cues.push({ start, end, text: ln.text });
  }
  cues.sort((a, b) => a.start - b.start);
  cues.forEach((c, i) => { if (cues[i + 1] && cues[i + 1].start < c.end) c.end = cues[i + 1].start; });
  const ts = (x) => {
    const ms = Math.round(x * 1000), p = (v, n = 2) => String(v).padStart(n, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  const kept = cues.filter((c) => c.end - c.start >= 0.05);
  return { n: kept.length, srt: kept.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n') };
}

/** Check the delivered files: each decodes to every frame, and chosen frames of the master and the
    share cut match fresh renders in a new page, drawn last-first (a frame must not depend on what was
    drawn before it):
    - determinism: each fresh render is byte-identical to the frame that was streamed to the encoder;
    - alignment: no decoded frame is clearly a neighbour's. The ink boils in ticks (12 a second), so a
      frame and the next one in its tick are nearly alike while frames either side of a tick change
      differ plainly; the check takes the first and the last frame of each chosen moment's tick, so a
      frame shown one early and one shown one late both meet a neighbour across a tick change. A frame
      fails when, at any of four block-average scales (×1, ×2, ×4, ×8: averaging removes the encoder's
      grain-scale loss much faster than a tick's change), it is nearer a neighbour's render than its
      own and those two renders are at least twice that distance apart. That a correct frame passes
      is measured, not proven: correct exports reach at most ~0.73 of the failing threshold across
      presets, aspects and 24/30/60 fps, so a failure means a frame sits nearer a neighbour's render
      than its own. A frame the share cut's rate control softened toward its neighbour stays "alike";
    - colour: no channel is shifted on average by 1/255 or more on the master (a wrong matrix or range
      would be). The colour conversion runs once, before the split, so the master measures it for both
      cuts; the share cut, whose 12 Mb/s cap alone moves chroma by up to ~0.9/255 on grainy looks, is
      held to 2/255 as a gross check.
    The mean |Δ| left over is encoding loss: CRF 16 drops some of the finest grain, CRF 24 more. */
async function verify(files, W, H, n, poster, hashes) {
  const bytes = W * H * 3, SCALES = [1, 2, 4, 8];
  const decode = (args) => ff(['-loglevel', 'error', ...args, '-f', 'rawvideo', 'pipe:1']).stdout;
  // decoded frames, not packets: an edit list can hide a frame at playback and keep the packet count
  const counts = Object.entries(files).map(([cut, file]) => {
    const stats = ff(['-i', file, '-map', '0:v:0', '-f', 'null', '-']).stderr.match(/frame=\s*(\d+)/g) || [];
    return [cut, +(stats.at(-1) || '0').replace(/\D/g, '')];
  });
  console.log(`check: decoded frames in each file: ${counts.map(([cut, c]) => `${cut} ${c}`).join(', ')} (want ${n})`);
  const short = counts.filter(([, c]) => c !== n);
  if (short.length) throw new Error(`the video does not match the film: ${short.map(([cut, c]) => `${cut} has ${c} frames, not ${n}`).join('; ')}`);
  delete files.silent; // its picture is the master's, stream-copied
  const check = await openPinned(browser, html, PX, { log });
  sameFonts('the check page', check, probe);

  // the first and last frame of each chosen moment's boil tick, with the tick read from the engine itself
  const inFilm = (i) => i >= 0 && i < n;
  const base = [...new Set([Math.round(poster * FPS), Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1].map((i) => Math.min(n - 1, Math.max(0, i))))];
  const span = Math.ceil(FPS / 12) + 1;
  const near = [...new Set(base.flatMap((p) => Array.from({ length: 2 * span + 1 }, (_, d) => p - span + d)).filter(inFilm))];
  const tick = new Map(await check.page.evaluate(([idx, fps]) => idx.map((i) => { window.film.renderAt(i / fps); return [i, window.FILM.K.boil]; }), [near, FPS]));
  const ends = new Map(); // frame → 'tick start' | 'tick end' | 'own tick'
  for (const p of base) {
    let a = p, b = p;
    while (tick.has(a - 1) && tick.get(a - 1) === tick.get(p)) a--;
    while (tick.has(b + 1) && tick.get(b + 1) === tick.get(p)) b++;
    ends.set(a, a === b ? 'own tick' : 'tick start');
    if (b !== a) ends.set(b, 'tick end');
  }
  const picks = [...ends.keys()].sort((x, y) => x - y);
  const need = [...new Set(picks.flatMap((i) => [i - 1, i, i + 1]).filter(inFilm))].sort((x, y) => y - x);
  const fresh = new Map();
  for (const i of need) {
    // through a file, not ffmpeg's stdin: a synchronous spawn fed megabytes on stdin can hang waiting for EOF
    const png = await grab(check.page, String(i / FPS)), file = path.join(WORK, 'check.png');
    fs.writeFileSync(file, png);
    fresh.set(i, { rgb: decode(['-i', file, '-vf', `crop=${W}:${H}:0:0,format=rgb24`]), same: sha1(png) === hashes[i] });
  }
  await check.page.context().close();
  const failures = [];
  const unstable = need.filter((i) => !fresh.get(i).same);
  if (unstable.length) failures.push(`frames ${unstable.join(', ')} re-render differently in a fresh page (a plate keeps state between frames, or something loaded mid-render)`);

  // accurate rounding and full chroma interpolation: swscale's default yuv420p → rgb path reads about
  // 2/255 dark on its own, which a player's decoder does not
  const coded = Object.fromEntries(Object.entries(files).map(([cut, file]) => {
    const raw = decode(['-i', file, '-an', '-vf', `select=${picks.map((i) => `eq(n\\,${i})`).join('+')},scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+full_chroma_inp,format=rgb24`, '-fps_mode', 'passthrough']);
    if (raw.length !== bytes * picks.length) throw new Error(`check: decoded ${raw.length} bytes from ${path.basename(file)}, expected ${picks.length} frames of ${W}×${H}`);
    return [cut, raw];
  }));
  /** Block average by k (k = 1 is the image itself), cached per image. */
  const cache = new Map();
  const at = (key, img, k) => {
    if (k === 1) return img;
    const id = `${key}×${k}`;
    if (cache.has(id)) return cache.get(id);
    const w = Math.floor(W / k), h = Math.floor(H / k), out = new Float32Array(w * h * 3);
    for (let y = 0; y < h * k; y++) {
      const row = ((y / k) | 0) * w;
      for (let x = 0; x < w * k; x++) {
        const o = (row + ((x / k) | 0)) * 3, q = (y * W + x) * 3;
        out[o] += img[q]; out[o + 1] += img[q + 1]; out[o + 2] += img[q + 2];
      }
    }
    for (let j = 0; j < out.length; j++) out[j] /= k * k;
    cache.set(id, out);
    return out;
  };
  const mad = (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += Math.abs(a[j] - b[j]); return s / a.length; };
  const bias = (a, b) => { const s = [0, 0, 0]; for (let j = 0; j < a.length; j++) s[j % 3] += a[j] - b[j]; return s.map((v) => v / (a.length / 3)); };
  const R = (i, k) => at(`r${i}`, fresh.get(i).rgb, k);

  for (const [p, i] of picks.entries()) {
    const parts = [];
    let bad = false;
    for (const [cut, raw] of Object.entries(coded)) {
      const img = raw.subarray(p * bytes, (p + 1) * bytes), D = (k) => at(`${cut}${i}`, img, k);
      const e = mad(img, R(i, 1)), b = bias(img, R(i, 1)), shifted = b.some((v) => Math.abs(v) >= (cut === 'share' ? 2 : 1));
      const seen = [];
      for (const j of [i - 1, i + 1].filter((x) => fresh.has(x))) {
        let tested = null, wrong = null;
        for (const k of SCALES) {
          const own = mad(D(k), R(i, k)), d = mad(D(k), R(j, k)), sep = mad(R(i, k), R(j, k));
          if (sep < Math.max(0.5, 2 * Math.min(own, d))) continue; // too alike at this scale to tell apart
          tested ??= { k, d };
          if (d < own) { wrong = { k, d, own, sep }; break; }
        }
        if (wrong) failures.push(`${cut} frame ${i} is not frame ${i}: at ×${wrong.k} frame ${j}'s render is nearer (${wrong.d.toFixed(2)}) than its own (${wrong.own.toFixed(2)}), and those two renders are ${wrong.sep.toFixed(2)} apart`);
        bad ||= !!wrong;
        seen.push(wrong ? `${j} NEARER` : tested ? `${j} at ${tested.d.toFixed(2)}${tested.k > 1 ? ` (×${tested.k})` : ''}` : `${j} alike`);
      }
      if (shifted) failures.push(`${cut} frame ${i} is colour-shifted by ${b.map((v) => v.toFixed(2)).join('/')} (R/G/B)`);
      bad ||= shifted;
      parts.push(`${cut} |Δ| ${e.toFixed(2)}, shift ${b.map((v) => v.toFixed(2)).join('/')}, ${seen.join(', ') || 'no neighbours'}` +
        (cut === 'master' && e > 3 ? ' (encoding loss above 3/255: very fine grain)' : ''));
    }
    console.log(`check: frame ${i} (T=${(i / FPS).toFixed(3)}, ${ends.get(i)} ${tick.get(i)}) ${fresh.get(i).same ? 're-renders identically' : 'RE-RENDERS DIFFERENTLY'}; ${parts.join('; ')}${bad ? '  FAIL' : ''}`);
  }
  if (failures.length) throw new Error(`the video does not match the film:\n  ${failures.join('\n  ')}`);
}
