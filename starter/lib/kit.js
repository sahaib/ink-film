'use strict';
/* Ink & paper kit shared by every plate.
   Everything draws in a logical space 1000 units on its short side: 1:1 → 1000×1000,
   9:16 → 1000×1778, 16:9 → 1778×1000 (from FILM.config.aspect). Place things relative to
   K.W / K.H; give sizes in plain units. The engine scales the space to the device.
   Colours, lettering and paper come from the preset (lib/presets.js), which fills K.C in place.
   Randomness is seeded: K.seed(n) gives the same strokes for the whole of one "boil"
   frame (12 per second), so lines shimmer like hand-drawn animation instead of flickering. */
(function () {
  const FILM = (window.FILM = window.FILM || { scenes: {} });
  const cfg = FILM.config || {};
  const K = (FILM.K = {});
  const ASPECTS = { '1:1': [1000, 1000], '9:16': [1000, 1778], '16:9': [1778, 1000] };
  if (!ASPECTS[cfg.aspect]) console.warn(`[ink-film] unknown aspect "${cfg.aspect}", using 1:1`);
  K.aspect = ASPECTS[cfg.aspect] ? cfg.aspect : '1:1';
  const [W, H] = ASPECTS[K.aspect];
  K.W = W; K.H = H;
  const TAU = (K.TAU = Math.PI * 2);
  K.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Palette roles. Filled in place by K.usePreset / K.brand, so `const C = K.C` in a plate stays live. */
  K.C = {};
  K.MIS = 1.4;   // default misregistration of K.fill, in units
  K.GRAIN = 0.5; // film grain strength 0..1
  K.lookVersion = 0; // bumped whenever the look changes; the engine rebuilds textures to match

  // ---------------------------------------------------------------- numbers
  K.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.range = (t, a, b) => K.clamp((t - a) / (b - a));
  K.smooth = (t) => { t = K.clamp(t); return t * t * (3 - 2 * t); };
  K.sr = (t, a, b) => K.smooth(K.range(t, a, b));
  K.easeOut = (t) => 1 - Math.pow(1 - K.clamp(t), 3);
  K.easeIn = (t) => Math.pow(K.clamp(t), 3);
  K.easeInOut = (t) => { t = K.clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  K.bump = (t, a, b) => Math.sin(Math.PI * K.range(t, a, b)); // 0 → 1 → 0 across [a, b]
  K.frac = (x) => x - Math.floor(x);

  // ---------------------------------------------------------------- randomness
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  K.mulberry = mulberry32;
  K.hash = (n) => {
    n = n | 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  };
  let R = mulberry32(1);
  K.boil = 0; // set by the engine each frame: floor(T * 12)
  /** Reseed the stroke generator for one drawn element; changes with every boil frame. */
  K.seed = (k) => { R = mulberry32((Math.imul((k | 0) + 1, 2654435761) ^ Math.imul(K.boil + 7, 40503)) >>> 0); };
  /** Reseed without the boil: identical strokes on every frame (for things that must hold still). */
  K.still = (k) => { R = mulberry32(Math.imul((k | 0) + 1, 2654435761) >>> 0); };
  K.r = () => R();
  K.rr = (a, b) => a + (b - a) * R();
  K.rs = (a) => (R() * 2 - 1) * a;
  /** Independent generator for layouts (star fields, crowds). Never affected by the boil. */
  K.stable = (seed) => mulberry32(Math.imul((seed | 0) + 1, 2654435761) >>> 0);

  // smooth value noise, range −1..1
  K.n1 = (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = K.hash(i * 1013 + 7), b = K.hash((i + 1) * 1013 + 7);
    return (a + (b - a) * u) * 2 - 1;
  };
  const h2 = (x, y) => K.hash(Math.imul(x, 73856093) ^ Math.imul(y, 19349663));
  K.n2 = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
    return (a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy) * 2 - 1;
  };
  K.fbm = (x, y, oct = 4) => {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += a * K.n2(x * f, y * f); f *= 2.03; a *= 0.5; }
    return s;
  };

  // ---------------------------------------------------------------- colour
  const rgbCache = new Map();
  K.rgb = (c) => {
    if (Array.isArray(c)) return c;
    let v = rgbCache.get(c);
    if (v) return v;
    const h = c.replace('#', '');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    rgbCache.set(c, v);
    return v;
  };
  K.rgba = (c, a) => { const [r, g, b] = K.rgb(c); return `rgba(${r},${g},${b},${a})`; };
  K.mix = (c1, c2, t) => {
    const a = K.rgb(c1), b = K.rgb(c2); t = K.clamp(t);
    let s = '#';
    for (let i = 0; i < 3; i++) s += Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0');
    return s;
  };
  /** WCAG relative luminance of '#rrggbb'. */
  K.luminance = (c) => {
    const [r, g, b] = K.rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  /** WCAG contrast ratio of two colours, 1..21. */
  K.contrast = (a, b) => {
    const x = K.luminance(a), y = K.luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  // ---------------------------------------------------------------- geometry (point arrays)
  K.seg = (x1, y1, x2, y2, step = 12) => {
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(L / step)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
    return pts;
  };
  /** Ellipse arc; rot tilts the ellipse. step = approx spacing along the curve. */
  K.arc = (cx, cy, rx, ry, a0 = 0, a1 = TAU, rot = 0, step = 9) => {
    const span = a1 - a0, L = Math.abs(span) * Math.max(rx, ry), n = Math.max(3, Math.ceil(L / step));
    const c = Math.cos(rot), s = Math.sin(rot), pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (span * i) / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return pts;
  };
  K.bez = (p0, p1, p2, p3, n = 24) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return pts;
  };
  /** Catmull-Rom curve through control points. */
  K.spline = (ctrl, closed = false, per = 8) => {
    const pts = [], n = ctrl.length, cnt = closed ? n : n - 1;
    for (let i = 0; i < cnt; i++) {
      const p0 = ctrl[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], p1 = ctrl[i];
      const p2 = ctrl[(i + 1) % n], p3 = ctrl[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      for (let j = 0; j < per; j++) {
        const t = j / per, t2 = t * t, t3 = t2 * t;
        pts.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) pts.push(ctrl[n - 1]);
    return pts;
  };
  /** Translate / scale / rotate a point array. */
  K.xf = (pts, dx = 0, dy = 0, s = 1, rot = 0) => {
    const c = Math.cos(rot) * s, n = Math.sin(rot) * s;
    return pts.map(([x, y]) => [dx + x * c - y * n, dy + x * n + y * c]);
  };
  K.bbox = (pts) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return { x0, y0, x1, y1 };
  };
  /** Keep the first `p` (0..1) of a polyline — for lines that draw themselves on. */
  K.part = (pts, p) => {
    if (p >= 1) return pts;
    const n = Math.max(2, Math.round(pts.length * K.clamp(p)));
    return pts.slice(0, n);
  };

  // ---------------------------------------------------------------- paths & ink
  /** Clean path (for fills and clips). */
  K.path = (ctx, pts, closed = true) => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  };
  /** Hand-inked path: the line wanders a little off its true course, smoothly. */
  K.trace = (ctx, pts, amp = 1, closed = false) => {
    const n = pts.length;
    if (n < 2) return;
    const off = R() * 1000, freq = 0.03 + R() * 0.025;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, n - 1)], o = pts[Math.max(i - 1, 0)];
      let tx = q[0] - o[0], ty = q[1] - o[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const w = amp * (K.n1(off + s * freq) + 0.3 * K.n1(off * 1.7 + s * freq * 4.1));
      const x = p[0] - ty * w, y = p[1] + tx * w;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    if (closed) ctx.closePath();
  };
  /** Global opacity multiplier every primitive honours — set it to fade a whole element. */
  K.A = 1;
  /** Draw fn() with everything in it faded by a (nests). */
  K.fade = (a, fn) => { const prev = K.A; K.A = prev * K.clamp(a); if (K.A > 0.004) fn(); K.A = prev; };
  K.stroke = (ctx, color, width = 1.6, alpha = 1) => {
    ctx.globalAlpha = alpha * K.A;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  /** One inked line along pts. */
  K.ink = (ctx, pts, color, width = 1.6, amp = 1, closed = false, alpha = 1) => {
    ctx.beginPath();
    K.trace(ctx, pts, amp, closed);
    K.stroke(ctx, color, width, alpha);
  };
  K.line = (ctx, x1, y1, x2, y2, color, width = 1.4, amp = 1, alpha = 1) =>
    K.ink(ctx, K.seg(x1, y1, x2, y2), color, width, amp, false, alpha);

  const regionPath = (ctx, region) => { if (typeof region === 'function') region(ctx); else K.path(ctx, region, true); };
  const fullFrame = () => ({ x0: 0, y0: 0, x1: W, y1: H });
  K.clipTo = (ctx, region) => { ctx.beginPath(); regionPath(ctx, region); ctx.clip(); };
  /** Flat colour fill, nudged off-register like a hand-pulled print (mis defaults to the preset's K.MIS). */
  K.fill = (ctx, region, color, alpha = 1, mis = K.MIS) => {
    ctx.save();
    ctx.translate(K.rs(mis), K.rs(mis));
    ctx.beginPath();
    regionPath(ctx, region);
    ctx.globalAlpha = alpha * K.A;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  /** Tonal hatching inside a region.
      density(x, y) → 0..1 ink coverage. Each line gets its own tone threshold, so lines run
      unbroken through dark passages and stop where the tone lightens — engraving, not noise.
      o: { angle, gap, step, amp, color, width, alpha, density, bbox } */
  K.hatch = (ctx, region, o = {}) => {
    const angle = o.angle ?? 0.9, gap = o.gap ?? 6, step = o.step ?? 12, amp = o.amp ?? 0.7;
    const dens = o.density || null;
    const bb = o.bbox || (region && typeof region !== 'function' ? K.bbox(region) : fullFrame());
    ctx.save();
    if (region) K.clipTo(ctx, region);
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    const rad = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2 + 2;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    ctx.beginPath();
    for (let d = -rad; d <= rad; d += gap) {
      const tau = dens ? R() * 0.94 + 0.03 : 0;
      const dd = d + K.rs(gap * 0.18), wob = R() * 100;
      let pen = false;
      for (let s = -rad; s <= rad + step; s += step) {
        const w = amp * K.n1(wob + s * 0.05);
        const x = cx + ca * s - sa * (dd + w), y = cy + sa * s + ca * (dd + w);
        if (!dens || dens(x, y) > tau) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; }
        else pen = false;
      }
    }
    K.stroke(ctx, o.color || K.C.ink, o.width ?? 1, o.alpha ?? 1);
    ctx.restore();
  };
  /** Two crossing hatch passes; the second only in the darker half of the tone. */
  K.crosshatch = (ctx, region, o = {}) => {
    const d = o.density || (() => 1);
    K.hatch(ctx, region, o);
    K.hatch(ctx, region, { ...o, angle: (o.angle ?? 0.9) + 1.25, gap: (o.gap ?? 6) * 1.2, density: (x, y) => (d(x, y) - 0.45) / 0.55 });
  };
  /** Dots scattered through a region, thinned by density. o: { count, r0, r1, color, alpha, density, bbox } */
  K.stipple = (ctx, region, o = {}) => {
    const n = o.count ?? 400, dens = o.density, r0 = o.r0 ?? 0.7, r1 = o.r1 ?? 1.6;
    const bb = o.bbox || (region && typeof region !== 'function' ? K.bbox(region) : fullFrame());
    ctx.save();
    if (region) K.clipTo(ctx, region);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = K.rr(bb.x0, bb.x1), y = K.rr(bb.y0, bb.y1), r = K.rr(r0, r1), q = R();
      if (dens && dens(x, y) < q) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.globalAlpha = (o.alpha ?? 1) * K.A;
    ctx.fillStyle = o.color || K.C.ink;
    ctx.fill();
    ctx.restore();
  };
  /** Riso-style dot screen inside a region: a fixed grid at `angle`, each dot sized so it covers
      density(x, y) of its cell (1 = solid). The grid is anchored to the page, so a moving region
      slides over a still screen, as print does. The screen sits off-register by up to `mis`.
      o: { density, cell = 7, angle = 0.26, color, alpha, mis = K.MIS, bbox } */
  K.halftone = (ctx, region, o = {}) => {
    const cell = o.cell ?? 7, angle = o.angle ?? 0.26, dens = o.density || (() => 0.5), mis = o.mis ?? K.MIS;
    const bb = o.bbox || (region && typeof region !== 'function' ? K.bbox(region) : fullFrame());
    const ca = Math.cos(angle), sa = Math.sin(angle), TOUCH = Math.PI / 4;
    // dot radius for coverage d: area-true (πr² = d·cell²) until neighbours touch at d = π/4,
    // then swelling into the cell's corners (r = 0.71·cell covers it all)
    const radius = (d) => (d <= TOUCH ? Math.sqrt(d / Math.PI) : 0.5 + 0.21 * ((d - TOUCH) / (1 - TOUCH))) * cell;
    // the bbox in screen coordinates (u along the rows, v across them)
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, y] of [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]]) {
      const u = x * ca + y * sa, v = -x * sa + y * ca;
      if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    ctx.save();
    ctx.translate(K.rs(mis), K.rs(mis));
    if (region) K.clipTo(ctx, region);
    ctx.beginPath();
    for (let v = Math.floor(v0 / cell) * cell; v <= v1 + cell; v += cell) {
      for (let u = Math.floor(u0 / cell) * cell; u <= u1 + cell; u += cell) {
        const x = u * ca - v * sa, y = u * sa + v * ca;
        if (x < bb.x0 - cell || x > bb.x1 + cell || y < bb.y0 - cell || y > bb.y1 + cell) continue;
        const d = dens(x, y);
        if (d <= 0.015) continue;
        const r = radius(Math.min(d, 1)) * (1 + K.rs(0.06));
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.globalAlpha = (o.alpha ?? 1) * K.A;
    ctx.fillStyle = o.color || K.C.ink;
    ctx.fill();
    ctx.restore();
  };
  /** Lambert tone of a sphere lit from screen direction (lx, ly): density function for K.hatch. */
  K.sphereTone = (cx, cy, r, lx, ly, amb = 0.08) => {
    const lz = 0.6, ll = Math.hypot(lx, ly, lz);
    return (x, y) => {
      const nx = (x - cx) / r, ny = (y - cy) / r, q = 1 - nx * nx - ny * ny;
      if (q <= 0) return 1;
      const d = (nx * lx + ny * ly + Math.sqrt(q) * lz) / ll;
      return K.clamp(1 - Math.max(0, d) - amb);
    };
  };
  /** Soft light. mode 'lighter' glows on dark grounds; use 'screen' or 'source-over' on paper
      (K.glowMode(tone) gives the preset's choice). */
  K.glow = (ctx, x, y, r, color, a = 1, mode = 'lighter') => {
    a *= K.A;
    if (a <= 0.003 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, K.rgba(color, K.clamp(a)));
    g.addColorStop(0.35, K.rgba(color, K.clamp(a) * 0.45));
    g.addColorStop(1, K.rgba(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  };
  /** How light adds onto a ground in this preset: 'lighter' on the void and on dark paper,
      'screen' on light paper (additive light would burn it to white). tone = 'paper' | 'void'. */
  K.glowMode = (tone) => (tone === 'paper' && K.luminance(K.C.paper) > 0.25 ? 'screen' : 'lighter');

  // ---------------------------------------------------------------- stars & nebulae
  K.makeStars = (seed, n, x0 = -250, y0 = -250, x1 = W + 250, y1 = H + 250) => {
    const r = K.stable(seed), out = [];
    for (let i = 0; i < n; i++) out.push({ x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), m: Math.pow(r(), 3.2), ph: r() * TAU, hue: r() });
    return out;
  };
  K.drawStars = (ctx, stars, t, o = {}) => {
    const a = (o.alpha ?? 1) * K.A, col = o.color || K.C.voidInk;
    if (a <= 0) return;
    ctx.save();
    ctx.fillStyle = col;
    const big = [];
    for (const s of stars) {
      const tw = 0.62 + 0.38 * Math.sin(t * (1.1 + s.hue * 1.4) + s.ph);
      const al = a * (0.22 + 0.78 * s.m) * tw;
      if (al < 0.02) continue;
      const sz = 0.8 + s.m * 2.3;
      ctx.globalAlpha = al;
      ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
      if (s.m > 0.5) big.push([s, al]);
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = col;
    for (const [s, al] of big) {
      const L = 4 + s.m * 12;
      ctx.globalAlpha = al * 0.85;
      ctx.beginPath();
      ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
      ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
      ctx.stroke();
      K.glow(ctx, s.x, s.y, L * 1.5, s.hue > 0.6 ? K.C.cyan : K.C.soulHot, (al / K.A) * 0.22);
    }
    ctx.restore();
  };
  /** Pre-rendered nebula (soft, so it lives at low resolution). Returns a canvas of size×size logical units. */
  K.nebula = (seed, size = Math.max(W, H) + 400, colors = ['#4B2E7A', '#1F5E78', '#7A2F55', '#2B3F8C']) => {
    const [c, x] = K.makeCanvas(size, size, 0.5);
    const r = K.stable(seed);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 170; i++) {
      const u = r();
      const bx = size * 0.08 + u * size * 0.84;
      const by = size / 2 + Math.sin(u * 5.3 + seed) * size * 0.17 + (r() - 0.5) * size * 0.26;
      const br = 40 + r() * 230, col = colors[(r() * colors.length) | 0];
      const g = x.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, K.rgba(col, 0.09 + r() * 0.1));
      g.addColorStop(1, K.rgba(col, 0));
      x.fillStyle = g;
      x.fillRect(bx - br, by - br, 2 * br, 2 * br);
    }
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 46; i++) {
      const bx = r() * size, by = size / 2 + (r() - 0.5) * size * 0.4, br = 30 + r() * 120;
      const g = x.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, 'rgba(0,0,0,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(bx - br, by - br, 2 * br, 2 * br);
    }
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2600; i++) {
      const u = r(), bx = u * size, by = size / 2 + Math.sin(u * 5.3 + seed) * size * 0.17 + (r() - 0.5) * size * 0.3 * r();
      x.fillStyle = K.rgba(r() > 0.7 ? '#FFE6A8' : '#CFE4F2', 0.12 + r() * 0.3);
      x.fillRect(bx, by, 1.4, 1.4);
    }
    return c;
  };

  // ---------------------------------------------------------------- recurring motifs
  /** The soul: a warm star. i = intensity (1 full light … 0 ash). o: { seed, rays, mode } */
  K.soulStar = (ctx, x, y, r, i, t, o = {}) => {
    i = K.clamp(i);
    const warm = K.mix(K.C.ash, K.C.soul, i), hot = K.mix('#A39C92', K.C.soulHot, i), rim = K.mix('#3F3A35', K.C.ember, i);
    const mode = o.mode || 'lighter';
    K.glow(ctx, x, y, r * (2.4 + 6.5 * i), K.C.soul, 0.05 + 0.3 * i, mode);
    K.glow(ctx, x, y, r * (1.3 + 1.5 * i), K.C.soulHot, 0.1 + 0.45 * i, mode);
    K.seed(o.seed ?? 11);
    ctx.beginPath();
    const n = 26;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + t * 0.05 + K.rs(0.05);
      const f = 0.5 + 0.5 * K.n1(t * 2.4 + k * 3.7);
      const len = r * (1.3 + (k % 2 ? 0.6 : 1.5) * f * (0.3 + 0.7 * i) * (o.rays ?? 1));
      const ca = Math.cos(a), sa = Math.sin(a);
      K.trace(ctx, K.seg(x + ca * r * 1.14, y + sa * r * 1.14, x + ca * len, y + sa * len, 5), 0.5);
    }
    K.stroke(ctx, warm, 1.2, 0.45 + 0.5 * i);
    const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, r * 0.08, x, y, r);
    g.addColorStop(0, hot);
    g.addColorStop(1, warm);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.globalAlpha = K.A;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (r > 9) K.hatch(ctx, K.arc(x, y, r, r), { angle: -0.75, gap: Math.max(2.4, r / 7), step: 5, amp: 0.4, color: rim, width: 0.8, alpha: 0.55, density: (px, py) => K.clamp((px - x + (py - y)) / (r * 1.5) + 0.05) });
    K.ink(ctx, K.arc(x, y, r, r, 0, TAU * 1.04), rim, Math.max(0.8, r / 14), 0.5);
    if (r > 7) K.ink(ctx, K.arc(x, y, r * 0.7, r * 0.7, 3.55, 4.7), '#FFF8E6', 1.4, 0.3, false, 0.15 + 0.75 * i);
  };
  /** A hand-drawn flame standing on (x, y). h = height, i = intensity, beat adds a heartbeat lift. o: { seed, beat, mode } */
  K.flame = (ctx, x, y, h, t, i = 1, o = {}) => {
    i = K.clamp(i);
    if (i <= 0.01) return;
    const seed = o.seed ?? 21;
    const sway = K.n1(t * 1.9 + seed) * h * 0.14;
    const lick = 1 + 0.12 * K.n1(t * 7.3 + seed) + (o.beat ?? 0) * 0.18;
    const Hh = h * lick * (0.3 + 0.7 * i), wd = h * 0.25 * (0.55 + 0.45 * i);
    const tip = [x + sway, y - Hh];
    const outer = K.spline([[x, y + wd * 0.3], [x - wd, y - Hh * 0.16], [x - wd * 0.55, y - Hh * 0.55], tip, [x + wd * 0.6, y - Hh * 0.5], [x + wd, y - Hh * 0.14]], true, 10);
    K.glow(ctx, x, y - Hh * 0.4, h * (1.3 + 2 * i), K.C.soul, 0.32 * i, o.mode || 'lighter');
    K.seed(seed);
    K.fill(ctx, outer, K.mix(K.C.ash, K.C.soul, i), 0.95, 0.7);
    const inner = K.spline([[x, y + wd * 0.18], [x - wd * 0.45, y - Hh * 0.2], [x + sway * 0.6, y - Hh * 0.62], [x + wd * 0.45, y - Hh * 0.2]], true, 8);
    K.fill(ctx, inner, K.mix('#BDB5A8', K.C.soulHot, i), 1, 0.4);
    K.ink(ctx, outer, K.mix('#3A342F', K.C.ember, i), Math.max(0.9, h / 40), 0.4, true);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const bx = x + (k - 1) * wd * 0.35;
      K.trace(ctx, K.seg(bx, y - Hh * 0.12, bx + sway * 0.5, y - Hh * (0.42 + 0.1 * k), 4), 0.6);
    }
    K.stroke(ctx, K.C.ember, Math.max(0.6, h / 70), 0.5 * i);
  };
  /** A thread of light along pts: glow, a fine inked core and sparks travelling outward.
      i = intensity, reveal = how much of the thread exists (0..1, from pts[0]).
      o: { seed, mode, width, speed, core } — core is the inked line's colour (soulHot; use a darker
      role such as ember on light paper, where a pale core disappears). */
  K.thread = (ctx, pts, t, i = 1, reveal = 1, o = {}) => {
    if (i <= 0.01 || reveal <= 0) return;
    const sub = K.part(pts, reveal);
    ctx.save();
    ctx.globalCompositeOperation = o.mode || 'lighter';
    ctx.beginPath(); K.path(ctx, sub, false); K.stroke(ctx, K.C.soul, 9, 0.07 * i);
    ctx.beginPath(); K.path(ctx, sub, false); K.stroke(ctx, K.C.soul, 3.5, 0.2 * i);
    ctx.restore();
    K.seed(o.seed ?? 31);
    K.ink(ctx, sub, o.core || K.C.soulHot, o.width ?? 1.4, 0.5, false, 0.95 * i);
    const n = sub.length;
    for (let k = 0; k < 4; k++) {
      const s = K.frac(t * (o.speed ?? 0.3) + k / 4);
      const idx = Math.min(n - 1, Math.floor(s * (pts.length - 1)));
      if (idx >= n) continue;
      const [px, py] = sub[idx];
      K.glow(ctx, px, py, 14, K.C.soulHot, 0.55 * i * Math.sin(Math.PI * s), o.mode || 'lighter');
    }
  };

  /** Ruled lines across a sky, the way engravers laid in the heavens. density(x, y) → 0..1. */
  K.ruledSky = (ctx, o = {}) => {
    const gap = o.gap ?? 5, y0 = o.y0 ?? 0, y1 = o.y1 ?? H, x0 = o.x0 ?? -20, x1 = o.x1 ?? W + 20;
    const dens = o.density || (() => 1);
    K.seed(o.seed ?? 61);
    ctx.beginPath();
    for (let y = y0; y <= y1; y += gap) {
      const tau = R();
      let pen = false;
      const wob = R() * 50;
      for (let x = x0; x <= x1; x += 18) {
        const yy = y + 0.9 * K.n1(wob + x * 0.02);
        if (dens(x, yy) > tau) { pen ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); pen = true; } else pen = false;
      }
    }
    K.stroke(ctx, o.color || K.C.voidInk, o.width ?? 0.7, o.alpha ?? 0.07);
  };

  // ---------------------------------------------------------------- textures (built by the engine)
  K.tex = {};
  K.PX = 1;
  K.makeCanvas = (w, h, px = K.PX) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * px));
    c.height = Math.max(1, Math.ceil(h * px));
    const x = c.getContext('2d');
    x.setTransform(px, 0, 0, px, 0, 0);
    return [c, x];
  };
  function pixelNoise(c, amt, seed) {
    if (!amt) return;
    const x = c.getContext('2d'), id = x.getImageData(0, 0, c.width, c.height), d = id.data, r = K.stable(seed);
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    x.putImageData(id, 0, 0);
  }
  const tone = ([r, g, b, a0, da], rnd) => `rgba(${r},${g},${b},${a0 + rnd() * da})`;
  /** Draw fn into the frame's own shape: a 1000×1000 recipe stretched to W×H (exact at 1:1). */
  const inFrame = (x, fn) => { x.save(); x.scale(W / 1000, H / 1000); fn(); x.restore(); };
  /** Paper, void, grain and vignette, following the preset's recipe K.TEX. Counts scale with the
      frame's area, so every aspect has the same density of fibres and specks as the square. */
  K.buildTextures = (px) => {
    K.PX = px;
    const T = K.TEX, area = (W * H) / 1e6, count = (n) => Math.round(n * area);
    // plate paper
    {
      const P = T.paper, [c, x] = K.makeCanvas(W, H, px), r = K.stable(77);
      x.fillStyle = P.base || K.C.paper; x.fillRect(0, 0, W, H);
      for (let i = 0, n = count(P.stains); i < n; i++) {
        const bx = r() * W, by = r() * H, br = 60 + r() * 240, dark = r() > 0.35;
        const g = x.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, tone(dark ? P.stainDark : P.stainLight, r));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(bx - br, by - br, 2 * br, 2 * br);
      }
      x.lineWidth = 0.6;
      for (let i = 0, n = count(P.fibres); i < n; i++) {
        const fx = r() * W, fy = r() * H, a = r() * TAU, L = 4 + r() * 16;
        x.strokeStyle = tone(P.fibre, r);
        x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + Math.cos(a) * L * 0.5 + (r() - 0.5) * 4, fy + Math.sin(a) * L * 0.5 + (r() - 0.5) * 4, fx + Math.cos(a) * L, fy + Math.sin(a) * L); x.stroke();
      }
      for (let i = 0, n = count(P.specks); i < n; i++) { x.fillStyle = tone(P.speck, r); const s = 0.5 + r() * 1.3; x.fillRect(r() * W, r() * H, s, s); }
      if (P.edge) {
        inFrame(x, () => {
          const e = x.createRadialGradient(500, 470, 380, 500, 500, 760), [er, eg, eb, ea] = P.edge;
          e.addColorStop(0, `rgba(${er},${eg},${eb},0)`); e.addColorStop(1, `rgba(${er},${eg},${eb},${ea})`);
          x.fillStyle = e; x.fillRect(0, 0, 1000, 1000);
        });
      }
      if (P.tint) {
        x.save();
        x.globalCompositeOperation = P.tint.mode || 'multiply';
        x.globalAlpha = P.tint.alpha;
        x.fillStyle = P.tint.color; x.fillRect(0, 0, W, H);
        x.restore();
      }
      if (P.grid) {
        const { gap, color, alpha, major } = P.grid;
        x.beginPath();
        for (let gx = gap; gx < W; gx += gap) { x.moveTo(gx, 0); x.lineTo(gx, H); }
        for (let gy = gap; gy < H; gy += gap) { x.moveTo(0, gy); x.lineTo(W, gy); }
        x.strokeStyle = K.rgba(color, alpha); x.lineWidth = 0.6; x.stroke();
        if (major) {
          x.beginPath();
          for (let gx = gap * major; gx < W; gx += gap * major) { x.moveTo(gx, 0); x.lineTo(gx, H); }
          for (let gy = gap * major; gy < H; gy += gap * major) { x.moveTo(0, gy); x.lineTo(W, gy); }
          x.strokeStyle = K.rgba(color, alpha * 1.8); x.lineWidth = 0.9; x.stroke();
        }
      }
      pixelNoise(c, P.noise, 5);
      K.tex.paper = c;
    }
    // the void: near-black with faint cloud and grit
    {
      const V = T.void, [c, x] = K.makeCanvas(W, H, px), r = K.stable(91);
      x.fillStyle = K.C.void; x.fillRect(0, 0, W, H);
      for (let i = 0, n = count(V.clouds); i < n; i++) {
        const bx = r() * W, by = r() * H, br = 100 + r() * 300;
        const g = x.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, tone(r() > 0.5 ? V.cloudA : V.cloudB, r));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(bx - br, by - br, 2 * br, 2 * br);
      }
      // bare paper showing through a flood of ink (print presets)
      for (let i = 0, n = count(V.specks || 0); i < n; i++) { x.fillStyle = tone(V.speck, r); const s = 0.5 + r() * 1.4; x.fillRect(r() * W, r() * H, s, s); }
      pixelNoise(c, V.noise, 6);
      K.tex.void = c;
    }
    // film grain tile, device pixels
    {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'), id = x.createImageData(256, 256), d = id.data, r = K.stable(3);
      for (let i = 0; i < d.length; i += 4) {
        const v = r(), on = v > 0.5 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = on;
        d[i + 3] = Math.abs(v - 0.5) * 68 * K.GRAIN;
      }
      x.putImageData(id, 0, 0);
      K.tex.grain = c;
    }
    // vignette
    {
      const [c, x] = K.makeCanvas(W, H, Math.min(px, 1));
      inFrame(x, () => {
        const g = x.createRadialGradient(500, 480, 330, 500, 500, 780);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${T.vignette})`);
        x.fillStyle = g; x.fillRect(0, 0, 1000, 1000);
      });
      K.tex.vignette = c;
    }
    K.tex.look = K.lookVersion;
  };
  /** Paper ground, optionally stained with a tint (multiply keeps the grain). */
  K.paper = (ctx, tint = null, a = 0.5, mode = 'multiply') => {
    ctx.drawImage(K.tex.paper, 0, 0, W, H);
    if (tint && a > 0) {
      ctx.save();
      ctx.globalCompositeOperation = mode;
      ctx.globalAlpha = a;
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };
  K.voidBg = (ctx) => ctx.drawImage(K.tex.void, 0, 0, W, H);

  // ---------------------------------------------------------------- lettering
  K.FONT = '"IM Fell English", "Iowan Old Style", "Palatino Linotype", Georgia, serif'; // set by the preset
  K.ITALIC = true; // the preset's caption style
  const pwCache = new Map();
  function prefixWidths(ctx, text) {
    const key = ctx.font + '|' + text;
    let v = pwCache.get(key);
    if (v) return v;
    v = [];
    for (let i = 0; i <= text.length; i++) v.push(ctx.measureText(text.slice(0, i)).width);
    pwCache.set(key, v);
    return v;
  }
  K.clearTextCache = () => pwCache.clear();
  const fontOf = (size, italic) => `${italic ? 'italic ' : ''}${size}px ${K.FONT}`;
  /** Width of text as K.write would letter it. */
  K.textWidth = (ctx, text, size = 40, italic = K.ITALIC) => {
    ctx.save();
    ctx.font = fontOf(size, italic);
    const w = prefixWidths(ctx, text)[text.length];
    ctx.restore();
    return w;
  };
  /** Hand-lettered text that writes itself on, letter by letter. progress 0..1.
      o: { size, progress, alpha, align, color, italic (default: the preset's), jitter } */
  K.write = (ctx, text, x, y, o = {}) => {
    const size = o.size ?? 40, p = o.progress ?? 1, alpha = (o.alpha ?? 1) * K.A;
    if (p <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.font = fontOf(size, o.italic ?? K.ITALIC);
    ctx.textBaseline = 'alphabetic';
    const pw = prefixWidths(ctx, text), total = pw[text.length];
    const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const n = text.length, soft = 5, head = p * (n + soft);
    const rng = mulberry32((K.boil * 131 + n * 7 + Math.round(y) * 3) >>> 0);
    const jit = o.jitter ?? 0.8;
    ctx.fillStyle = o.color || K.C.ink;
    for (let i = 0; i < n; i++) {
      const jx = (rng() - 0.5) * jit, jy = (rng() - 0.5) * jit, rot = (rng() - 0.5) * 0.028;
      const a = K.clamp((head - i) / soft);
      if (a <= 0) break;
      const ch = text[i];
      if (ch === ' ') continue;
      ctx.save();
      ctx.translate(x0 + pw[i] + jx, y + jy + (1 - a) * 3);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha * a;
      ctx.fillText(ch, 0, 0);
      ctx.globalAlpha = alpha * a * 0.28;
      ctx.fillText(ch, 0.7, 0.35);
      ctx.restore();
    }
    ctx.restore();
  };
  /** The script lines of a plate, written into the lower margin. Called by the engine.
      Lines stack upward from the last one, lead = 1.35 × size, each indented 0.9 × size more than the last.
      - 1:1 and 16:9: size 40 at x = 72; the last baseline sits on K.H − 74 (two lines: K.H − 128,
        K.H − 74). The scrim rises from K.H − 310 (higher for more lines) and is densest at the bottom edge.
      - 9:16: size 46, a block centred with its lines left-aligned, never nearer the edge than 64;
        the last baseline sits on K.H × 0.78 (two lines: ≈ K.H × 0.78 − 62), so nothing lies in the
        bottom fifth that Reels, Shorts and TikTok cover. The scrim is a band behind the lines that
        fades out before K.H × 0.8.
      A line too long for the frame shrinks to fit. */
  K.caption = (ctx, lines, t, dur, tone, strength = 1) => {
    if (!lines || !lines.length) return;
    const ink = tone === 'paper' ? K.C.captionInk : K.C.captionInkDark;
    const ground = tone === 'paper' ? K.C.paper : K.C.void;
    let vis = 0;
    const st = lines.map((ln) => {
      const wd = ln.wd ?? Math.max(1.3, ln.text.length * 0.06);
      const p = K.range(t, ln.at, ln.at + wd);
      const out = ln.out ?? dur - 0.8;
      const a = 1 - K.range(t, out, out + 0.7);
      vis = Math.max(vis, Math.min(1, p * 3) * a);
      return { p, a };
    });
    if (vis <= 0) return;
    const tall = H > W, margin = tall ? 64 : 72;
    let size = tall ? 46 : 40;
    const blockWidth = (sz) => Math.max(...lines.map((ln, i) => K.textWidth(ctx, ln.text, sz) + i * sz * 0.9));
    let block = blockWidth(size);
    if (block > W - 2 * margin) { size *= (W - 2 * margin) / block; block = blockWidth(size); }
    const lead = size * 1.35, indent = size * 0.9; // 54 and 36 at size 40
    let base;
    if (tall) {
      const s = vis * strength;
      const last = H * 0.78, floor = H * 0.8; // platform UI covers the bottom fifth
      base = last - (lines.length - 1) * lead;
      const top = base - size * 3.2, capTop = base - size;
      const g = ctx.createLinearGradient(0, top, 0, floor);
      const at = (y) => K.clamp((y - top) / (floor - top));
      g.addColorStop(0, K.rgba(ground, 0));
      g.addColorStop(at(capTop), K.rgba(ground, 0.55 * s));
      g.addColorStop(at(last - size * 0.3), K.rgba(ground, 0.7 * s));
      g.addColorStop(1, K.rgba(ground, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, top, W, floor - top);
    } else {
      base = H - 74 - (lines.length - 1) * lead;
      const top = Math.min(H - 310, base - size * 2.5);
      const g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, K.rgba(ground, 0));
      g.addColorStop(0.5, K.rgba(ground, 0.5 * vis * strength));
      g.addColorStop(1, K.rgba(ground, 0.86 * vis * strength));
      ctx.fillStyle = g;
      ctx.fillRect(0, top, W, H - top);
    }
    const x0 = tall ? Math.max(margin, (W - block) / 2) : margin;
    lines.forEach((ln, i) => K.write(ctx, ln.text, x0 + i * indent, base + i * lead, { size, color: ink, progress: st[i].p, alpha: st[i].a }));
  };
})();
