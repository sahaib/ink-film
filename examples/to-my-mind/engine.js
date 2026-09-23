'use strict';
/* Timeline, transitions, controls and the render loop. Scene files register in FILM.scenes. */
(function () {
  const FILM = window.FILM, K = FILM.K, W = K.W, H = K.H;

  // Nine plates, one per movement of the poem. `tr` is how each plate arrives.
  const ORDER = [
    { id: 'orrery', dur: 11, tr: { type: 'none' } },
    { id: 'eye', dur: 9, tr: { type: 'flare', dur: 1.0 } },
    { id: 'memory', dur: 10, tr: { type: 'iris', dur: 1.1, at: [500, 480] } },
    { id: 'lost', dur: 10, tr: { type: 'cut' } },
    { id: 'ritual', dur: 10, tr: { type: 'fade', dur: 0.8 } },
    { id: 'bargain', dur: 11, tr: { type: 'cut' } },
    { id: 'rumble', dur: 7, tr: { type: 'dark', dur: 1.0 } },
    { id: 'thunder', dur: 10, tr: { type: 'cut' } },
    { id: 'return', dur: 12, tr: { type: 'fade', dur: 1.2 } },
  ];
  let acc = 0;
  ORDER.forEach((s, i) => { s.start = acc; s.index = i; acc += s.dur; });
  const TOTAL = acc;
  FILM.ORDER = ORDER;
  FILM.TOTAL = TOTAL;
  FILM.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s) => document.querySelector(s);
  const canvas = $('#film'), ctx = canvas.getContext('2d');
  const layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  let PX = 0, forcedPX = 0, grain = null, ready = false;
  let quality = 1; // lowered by adapt() when a device can't hold the frame rate

  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = forcedPX || Math.max(0.4, K.clamp(((r.width || 800) * dpr) / W, 0.4, 2) * quality);
    if (PX && Math.abs(px - PX) < 0.02) return false;
    PX = px;
    canvas.width = layer.width = Math.round(W * PX);
    canvas.height = layer.height = Math.round(H * PX);
    // textures only need rebuilding when the canvas outgrows them; smaller canvases reuse them
    if (!K.tex.paper || PX > K.PX + 0.2) {
      K.buildTextures(PX);
      grain = ctx.createPattern(K.tex.grain, 'repeat');
      for (const id in FILM.scenes) {
        const sc = FILM.scenes[id];
        if (sc.init) try { sc.init(); } catch (e) { console.error(id, e); }
      }
    }
    return true;
  }

  const indexAt = (T) => {
    for (let i = ORDER.length - 1; i >= 0; i--) if (T >= ORDER[i].start) return i;
    return 0;
  };

  function renderScene(c, s, t) {
    const sc = FILM.scenes[s.id];
    c.save();
    K.A = 1;
    K.seed(s.index * 97 + 1);
    if (!sc) {
      K.voidBg(c);
      K.write(c, s.id, 500, 500, { align: 'center', color: K.C.voidInk, italic: false });
    } else {
      try { sc.draw(c, t, s.dur); } catch (e) { if (!s.err) { console.error(s.id, e); s.err = true; } }
    }
    c.restore();
    if (sc && sc.lines) {
      c.save();
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      const tone = typeof sc.tone === 'function' ? sc.tone(t) : sc.tone || 'void';
      const scrim = typeof sc.scrim === 'function' ? sc.scrim(t) : sc.scrim ?? 1;
      try { K.caption(c, sc.lines, t, s.dur, tone, scrim); } catch (e) { console.error(e); }
      c.restore();
    }
  }

  function veil(a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = K.clamp(a);
    ctx.fillStyle = K.C.void;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function overlays() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (grain) {
      grain.setTransform(new DOMMatrix([1, 0, 0, 1, (K.boil * 97) % 256, (K.boil * 57) % 256]));
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
    ctx.setTransform(PX, 0, 0, PX, 0, 0);
    ctx.drawImage(K.tex.vignette, 0, 0, W, H);
  }

  function render(T) {
    T = ((T % TOTAL) + TOTAL) % TOTAL;
    K.boil = Math.floor(T * 12);
    ctx.setTransform(PX, 0, 0, PX, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const s = ORDER[indexAt(T)], t = T - s.start, tr = s.tr, d = tr.dur || 0;
    if (s.index > 0 && d && t < d) {
      const prev = ORDER[s.index - 1], p = K.smooth(t / d), tp = prev.dur + t;
      if (tr.type === 'dark') {
        if (p < 0.5) { renderScene(ctx, prev, tp); veil(p * 2); }
        else { renderScene(ctx, s, t); veil((1 - p) * 2); }
      } else {
        renderScene(ctx, prev, tp);
        lctx.setTransform(PX, 0, 0, PX, 0, 0);
        lctx.clearRect(0, 0, W, H);
        renderScene(lctx, s, t);
        ctx.save();
        if (tr.type === 'iris') {
          const [ix, iy] = tr.at || [500, 500];
          const rad = Math.max(0.5, K.easeInOut(t / d) * 760);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, K.TAU);
          ctx.clip();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(layer, 0, 0);
          ctx.restore();
          K.seed(5);
          K.ink(ctx, K.arc(ix, iy, rad, rad, 0, K.TAU * 1.02), K.C.soulHot, 2, 1.4, false, 0.7 * (1 - p));
        } else {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = p;
          ctx.drawImage(layer, 0, 0);
          ctx.restore();
          if (tr.type === 'flare') {
            const b = Math.sin(Math.PI * p) * (FILM.reduced ? 0.35 : 1);
            K.glow(ctx, 500, 500, 980, K.C.soulHot, 0.8 * b);
            K.glow(ctx, 500, 500, 420, '#FFFFFF', 0.5 * b);
          }
        }
      }
    } else {
      renderScene(ctx, s, t);
    }
    overlays();
  }

  // ---------------------------------------------------------------- playback & controls
  const btnPlay = $('#play'), track = $('#track'), done = track.querySelector('.done'), head = track.querySelector('.head');
  const clock = $('#clock'), btnSound = $('#sound'), nowLine = $('#now-line');
  track.setAttribute('aria-valuemax', String(TOTAL));
  ORDER.forEach((s) => {
    if (!s.start) return;
    const tk = document.createElement('div');
    tk.className = 'tick';
    tk.style.left = (s.start / TOTAL) * 100 + '%';
    track.insertBefore(tk, head);
  });
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;

  let T = 0, shownT = 0, playing = true, lastNow = 0, lastDraw = 0, dirty = true, lastLine = -1;

  function ui() {
    const f = (T / TOTAL) * 100;
    done.style.width = f + '%';
    head.style.left = f + '%';
    clock.textContent = `${fmt(T)} / ${fmt(TOTAL)}`;
    track.setAttribute('aria-valuenow', String(Math.round(T)));
    track.setAttribute('aria-valuetext', `${fmt(T)} of ${fmt(TOTAL)}`);
    const s = ORDER[indexAt(T)];
    if (s.index !== lastLine) {
      lastLine = s.index;
      const sc = FILM.scenes[s.id];
      nowLine.textContent = sc && sc.lines ? sc.lines.map((l) => l.text).join(' ') : '';
    }
  }
  function setPlaying(v) {
    playing = v;
    lastNow = 0;
    btnPlay.setAttribute('aria-label', v ? 'Pause' : 'Play');
    btnPlay.querySelector('.i-pause').toggleAttribute('hidden', !v);
    btnPlay.querySelector('.i-play').toggleAttribute('hidden', v);
    if (FILM.audio) FILM.audio.setPlaying(v);
  }
  function seek(x) {
    T = ((x % TOTAL) + TOTAL) % TOTAL;
    dirty = true;
    if (FILM.audio) FILM.audio.jump(T);
  }
  btnPlay.addEventListener('click', () => setPlaying(!playing));
  canvas.addEventListener('click', () => setPlaying(!playing));
  const fromEvent = (e) => { const r = track.getBoundingClientRect(); return K.clamp((e.clientX - r.left) / r.width) * TOTAL * 0.99999; };
  let dragging = false;
  track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); seek(fromEvent(e)); });
  track.addEventListener('pointermove', (e) => { if (dragging) seek(fromEvent(e)); });
  track.addEventListener('pointerup', () => { dragging = false; });
  track.addEventListener('pointercancel', () => { dragging = false; });
  track.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 3, ArrowUp: 3, ArrowLeft: -3, ArrowDown: -3, PageUp: 10, PageDown: -10 }[e.key];
    if (step) seek(K.clamp(T + step, 0, TOTAL - 0.01));
    else if (e.key === 'Home') seek(0);
    else if (e.key === 'End') seek(TOTAL - 0.01);
    else return;
    e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && (e.target === document.body || e.target === canvas)) { setPlaying(!playing); e.preventDefault(); }
  });
  btnSound.addEventListener('click', () => {
    const on = btnSound.getAttribute('aria-pressed') !== 'true';
    btnSound.setAttribute('aria-pressed', String(on));
    btnSound.querySelector('.i-wave').toggleAttribute('hidden', !on);
    btnSound.querySelector('.i-mute').toggleAttribute('hidden', on);
    if (FILM.audio) on ? FILM.audio.enable(T, playing) : FILM.audio.disable();
  });

  function tick(now) {
    requestAnimationFrame(tick);
    if (!ready) return;
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
    lastNow = now;
    if (playing) { T = (T + dt) % TOTAL; dirty = true; }
    if (!dirty || now - lastDraw < 31) return; // drawn at ~30 fps; the ink itself boils at 12
    lastDraw = now;
    dirty = false;
    render(T);
    if (FILM.audio) FILM.audio.update(T, shownT, playing);
    shownT = T;
    ui();
    adapt(now);
  }

  // If a device can't keep up, draw fewer pixels rather than drop frames.
  let emaGap = 33, slowSince = 0, lastFrameAt = 0, steps = 0;
  function adapt(now) {
    if (!playing || forcedPX) { lastFrameAt = 0; return; }
    if (lastFrameAt) { const gap = now - lastFrameAt; if (gap < 250) emaGap = emaGap * 0.9 + gap * 0.1; }
    lastFrameAt = now;
    if (emaGap > 44 && steps < 3) {
      if (!slowSince) slowSince = now;
      else if (now - slowSince > 1500) {
        quality *= 0.82; steps++; slowSince = 0; emaGap = 33;
        sizeCanvas();
      }
    } else slowSince = 0;
  }
  document.addEventListener('visibilitychange', () => { lastFrameAt = 0; slowSince = 0; });

  new ResizeObserver(() => { if (ready && sizeCanvas()) dirty = true; }).observe(canvas);

  // Local testing hook (harmless in the published page).
  const film = (FILM.film = window.film = {
    ready: false,
    total: TOTAL,
    order: ORDER,
    seek, play: () => setPlaying(true), pause: () => setPlaying(false),
    forcePX(px) { forcedPX = px; PX = 0; sizeCanvas(); },
    renderAt(x) { T = ((x % TOTAL) + TOTAL) % TOTAL; render(T); ui(); },
    renderScene(id, t) {
      const s = ORDER.find((o) => o.id === id);
      K.boil = Math.floor((s.start + t) * 12);
      ctx.setTransform(PX, 0, 0, PX, 0, 0);
      renderScene(ctx, s, t);
      overlays();
    },
    bench(x, n = 10) { const t0 = performance.now(); for (let i = 0; i < n; i++) render(x + i / 30); return (performance.now() - t0) / n; },
  });

  // A face that lands after boot stops waiting (2.5 s) changes the letters' widths, but the lettering's
  // width cache is keyed by the ctx.font string, which stays the same: drop the cache and redraw.
  document.fonts.addEventListener('loadingdone', () => { K.clearTextCache(); dirty = true; });

  async function boot() {
    try {
      await Promise.race([
        Promise.all([document.fonts.load('italic 40px "IM Fell English"'), document.fonts.load('40px "IM Fell English"')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch (e) { /* fall back to Georgia */ }
    K.clearTextCache();
    sizeCanvas();
    ready = true;
    film.ready = true;
    const m = /^#t(\d+(?:\.\d+)?)$/.exec(location.hash);
    if (m) { seek(+m[1]); setPlaying(false); }
    else if (FILM.reduced) { seek(4.6); setPlaying(false); }
    requestAnimationFrame(tick);
  }
  boot();
})();
