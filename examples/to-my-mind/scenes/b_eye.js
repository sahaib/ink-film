// The poem's words in this file are © 2026 Sahaib Singh Arora, all rights reserved — see examples/to-my-mind/NOTICE in the ink-film repository. The code is MIT.
'use strict';
/* Plate II — the eye.
   A galaxy that turns out to be an iris; the dive through the pupil; and the world beyond it
   seen in fractured, tear-blurred cells — a figure at a bright horizon (the vision) whose
   shadow grows long and looms (the fear). Nothing is ever fully clear. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const SX = 500, SY = 450;   // where the eye's centre sits on screen
  const RI = 132;             // iris radius, world units at scale 1
  const AX = 500, AY = 450, AR = 450; // the mosaic aperture (seen from inside the pupil)
  let gal = null, stars = null, veins = null, lashesUp = null, lashesLo = null, ALMOND = null;

  // ---------------------------------------------------------------- the lids (world units, eye centre at 0,0)
  const up = (x) => { const u = x / 300; return 6 - 8 * u - 141 * Math.pow(Math.max(0, 1 - u * u), 0.8); };
  const lo = (x) => { const u = x / 300; return 6 - 8 * u + 128 * Math.pow(Math.max(0, 1 - u * u), 0.85); };

  // ---------------------------------------------------------------- timing
  function camScale(t) {
    const pull = K.easeInOut(K.range(t, 2.2, 4.4));
    let s = K.lerp(K.lerp(5.8, 5.0, K.range(t, 0, 2.2)), 1.0, pull);
    s *= 1 + 0.07 * K.sr(t, 4.2, 4.85);            // lean in
    s *= 1 + 13 * K.easeIn(K.range(t, 4.85, 5.65)); // dive through the pupil
    return s;
  }
  function pupilAt(t) {
    const dark = K.sr(t, 1.5, 2.6);                 // the galaxy's bright core goes dark: a pupil
    const r = K.lerp(22, 38, dark) + 3 * Math.sin(t * 1.3) * (1 - K.sr(t, 4.2, 4.6))
      + 32 * K.sr(t, 4.3, 5.0) + 30 * K.sr(t, 5.0, 5.6);
    return { dark, r };
  }
  // vision → fear → almost vision → fear
  function fearAt(t) {
    const osc = t < 5.7 ? 0 : 0.5 - 0.5 * Math.cos(((t - 5.7) * Math.PI) / 1.25);
    return K.clamp(Math.max(t > 8.2 ? 0 : osc, K.sr(t, 7.5, 8.3)));
  }
  function apertureAt(t) {
    return AR * K.easeOut(K.range(t, 5.3, 5.95)) * (1 - K.easeIn(K.range(t, 8.2, 9.0)));
  }

  // ---------------------------------------------------------------- one-time layout
  const GCOL = [C.soulHot, C.soul, C.goldLight, C.cyan, C.mind, '#FFFFFF'];
  function buildGalaxy() {
    const g = K.stable(41), pts = [];
    const gauss = () => (g() + g() + g() - 1.5) / 1.5;
    const mk = (r, th, bulge) => {
      const f = r / RI, q = g();
      let col;
      if (bulge || f < 0.28) col = q < 0.5 ? 0 : 1;
      else if (f < 0.55) col = q < 0.45 ? 1 : q < 0.8 ? 2 : 3;
      else col = q < 0.12 ? 2 : q < 0.6 ? 3 : q < 0.9 ? 4 : 5;
      pts.push({ r, th, col, sz: 0.7 + g() * g() * 2.4, a: 0.35 + g() * 0.65, w: 0.11 * Math.pow(40 / Math.max(r, 12), 0.5) });
    };
    const arms = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];
    for (let i = 0; i < 3000; i++) {
      const k = i % 4, major = k < 2;
      if (!major && g() < 0.45) continue;
      const r = 14 + (RI - 14) * Math.pow(g(), 0.9);
      mk(r + gauss() * 5, arms[k] + Math.log(r / 16) * 2.1 + gauss() * (major ? 0.2 : 0.32));
    }
    for (let i = 0; i < 800; i++) mk(2 + Math.abs(gauss()) * 34, g() * TAU, true);
    for (let i = 0; i < 1400; i++) mk(14 + Math.sqrt(g()) * (RI - 10), g() * TAU);
    return pts;
  }
  function buildVeins() {
    const g = K.stable(77), out = [];
    const walk = (x, y, dir, n, w) => {
      const pts = [[x, y]];
      for (let k = 0; k < n; k++) {
        dir += (g() - 0.5) * 0.7;
        const toC = Math.atan2(-y, -x);
        dir += Math.sin(toC - dir) * 0.18;
        x += Math.cos(dir) * 9; y += Math.sin(dir) * 9;
        if (Math.hypot(x, y) < RI + 6) break;
        pts.push([x, y]);
        if (k === 3 || k === 7) out.push({ pts: walk(x, y, dir + (g() > 0.5 ? 0.7 : -0.7), Math.floor(n * 0.45), w * 0.6).pts, w: w * 0.6 });
      }
      return { pts, w };
    };
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, x = side * (215 + g() * 80), y = K.lerp(up(x) + 8, lo(x) - 8, g());
      out.push(walk(x, y, side > 0 ? Math.PI + (g() - 0.5) : (g() - 0.5), 14 + Math.floor(g() * 8), 1));
    }
    return out;
  }
  function buildLashes() {
    const g = K.stable(88), U = [], L = [];
    for (let i = 0; i <= 62; i++) {
      const x = -284 + (i * 570) / 62, y = up(x), dy = (up(x + 1) - up(x - 1)) / 2, ln = Math.hypot(1, dy);
      const tx = 1 / ln, ty = dy / ln, nx = dy / ln, ny = -1 / ln;
      const len = (16 + 34 * Math.pow(Math.sin((Math.PI * (x + 300)) / 600), 0.7)) * (0.6 + 0.7 * g());
      const lean = (x / 300) * 0.45 + 0.15;
      U.push({ x, y, nx, ny, tx, ty, len, lean, ph: g() * TAU });
    }
    for (let i = 0; i <= 38; i++) {
      const x = -250 + (i * 530) / 38, y = lo(x), dy = (lo(x + 1) - lo(x - 1)) / 2, ln = Math.hypot(1, dy);
      const tx = 1 / ln, ty = dy / ln, nx = -dy / ln, ny = 1 / ln;
      L.push({ x, y, nx, ny, tx, ty, len: (7 + 10 * Math.sin((Math.PI * (x + 300)) / 600)) * (0.7 + 0.6 * g()), lean: (x / 300) * 0.3, ph: g() * TAU });
    }
    return [U, L];
  }

  // ---------------------------------------------------------------- the galaxy / iris (screen space, constant dot size)
  function spiral(k, t, s, off, r0, r1) {
    const pts = [];
    for (let r = r0; r <= r1; r += 2.5) {
      const th = k + Math.log(r / 16) * 2.1 + off + t * 0.11 * Math.pow(40 / r, 0.5);
      pts.push([SX + Math.cos(th) * r * s, SY + Math.sin(th) * r * s]);
    }
    return pts;
  }
  function galaxy(ctx, t, s, pup) {
    // nebulous light along the two great arms
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const k of [0, Math.PI]) {
      const pts = spiral(k, t, s, 0, 16, RI);
      for (const [w, a, col] of [[22, 0.05, C.soul], [9, 0.07, C.cyan]]) {
        ctx.beginPath();
        K.path(ctx, pts, false);
        ctx.lineWidth = w * Math.min(s, 3);
        ctx.strokeStyle = col;
        ctx.globalAlpha = a * K.A;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
    ctx.restore();
    K.glow(ctx, SX, SY, 70 * s, C.soul, 0.75 * (1 - 0.85 * pup.dark));
    K.glow(ctx, SX, SY, 26 * s, C.soulHot, 0.9 * (1 - 0.9 * pup.dark));
    // dust lanes, hand-inked
    K.seed(621);
    for (const k of [0, Math.PI]) {
      K.ink(ctx, spiral(k, t, s, -0.32, 22, RI * 0.95), '#05050C', K.clamp(2.6 * s, 1.5, 12), 1.2, false, 0.55);
      K.ink(ctx, spiral(k, t, s, -0.52, 30, RI * 0.8), '#05050C', K.clamp(1.2 * s, 0.8, 5), 1, false, 0.35);
    }
    // the stars of the galaxy, which are also the flecks of an iris
    const dotK = K.clamp(0.55 + s * 0.2, 0.75, 1.8);
    const buckets = GCOL.map(() => []);
    for (const p of gal) {
      const th = p.th + t * p.w, x = SX + Math.cos(th) * p.r * s, y = SY + Math.sin(th) * p.r * s;
      if (x < -4 || x > 1004 || y < -4 || y > 1004) continue;
      buckets[p.col].push(x, y, p.sz * dotK, p.a);
    }
    ctx.save();
    for (let c = 0; c < GCOL.length; c++) {
      ctx.fillStyle = GCOL[c];
      const b = buckets[c];
      for (let i = 0; i < b.length; i += 4) {
        ctx.globalAlpha = b[i + 3] * K.A;
        const z = b[i + 2];
        ctx.fillRect(b[i] - z / 2, b[i + 1] - z / 2, z, z);
      }
    }
    ctx.restore();
  }
  /** Radial fibres, collarette and limbus: what makes the galaxy read as an iris. */
  function irisMarks(ctx, t, s, rp, v) {
    if (v <= 0.01) return;
    K.fade(v, () => {
      const g = K.stable(55);
      K.seed(631);
      const paths = [[], []];
      for (let i = 0; i < 170; i++) {
        const a0 = g() * TAU, tw = (g() - 0.5) * 0.4, c = i % 2, len = 0.55 + g() * 0.45, pts = [];
        for (let k = 0; k <= 8; k++) {
          const u = k / 8, r = rp + (RI - rp) * u * len, a = a0 + tw * u + 0.05 * Math.sin(u * 6 + i) + t * 0.02;
          pts.push([SX + Math.cos(a) * r * s, SY + Math.sin(a) * r * s]);
        }
        paths[c].push(pts);
      }
      for (const [c, col, al] of [[0, C.soul, 0.45], [1, C.cyan, 0.4]]) {
        ctx.beginPath();
        for (const p of paths[c]) K.trace(ctx, p, 0.5);
        K.stroke(ctx, col, 0.9, al);
      }
      // collarette: the wavy ring around the pupil
      const rc = rp + (RI - rp) * 0.33, cpts = [];
      for (let k = 0; k <= 96; k++) {
        const a = (k / 96) * TAU + t * 0.02, r = rc + 4 * Math.sin(a * 17) + 2 * Math.sin(a * 5 + 1);
        cpts.push([SX + Math.cos(a) * r * s, SY + Math.sin(a) * r * s]);
      }
      K.ink(ctx, cpts, C.goldLight, 1.4, 0.6, true, 0.55);
      // limbus
      K.ink(ctx, K.arc(SX, SY, RI * s, RI * s, 0, TAU * 1.02), '#070B16', K.clamp(7 * s, 4, 16), 0.8, false, 0.9);
      K.ink(ctx, K.arc(SX, SY, RI * s + 5, RI * s + 5, 0, TAU * 1.02), C.cyan, 0.9, 0.8, false, 0.4);
    });
  }
  function pupilDisc(ctx, t, s, pup) {
    if (pup.dark <= 0.01) return;
    const r = pup.r * s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(SX, SY, r, 0, TAU);
    ctx.fillStyle = '#030306';
    ctx.globalAlpha = pup.dark * K.A;
    ctx.fill();
    ctx.restore();
    // the pupillary ruff, a ragged amber rim
    K.seed(641);
    const pts = [];
    for (let k = 0; k <= 80; k++) { const a = (k / 80) * TAU; pts.push([SX + Math.cos(a) * (r + 1.5 * Math.sin(a * 23 + t)), SY + Math.sin(a) * (r + 1.5 * Math.sin(a * 23 + t))]); }
    K.ink(ctx, pts, C.soul, K.clamp(1.2 * s, 1, 6), 0.4, true, 0.6 * pup.dark);
  }

  // ---------------------------------------------------------------- the face around it (world space)
  function skin(ctx, t, s) {
    const lw = 1 / Math.sqrt(s);
    // pale lines are light: lit from the upper left, falling away into the dark
    const lit = (x, y) => {
      const q = (x / 470) ** 2 + ((y + 50) / 370) ** 2;
      let b = K.clamp(1.18 - q) * K.clamp(0.72 - x / 1300 - y / 1500);
      const lid = up(x);
      if (y < lid - 14 && y > lid - 70) b *= 0.35;               // the crease sits in shadow
      else if (y < lid - 70 && y > lid - 150) b *= 0.7;          // the socket
      if (y > lo(x) + 6 && y < lo(x) + 40) b *= 0.55;            // under the lower lid
      return b;
    };
    K.seed(611);
    ctx.beginPath();
    const family = (n, fn) => {
      for (let k = 1; k <= n; k++) {
        const tau = K.r() * 0.9 + 0.04, wob = K.r() * 50;
        let pen = false;
        for (let x = -300; x <= 300; x += 9) {
          const [X, Y] = fn(x, k);
          const yy = Y + 0.9 * K.n1(wob + x * 0.03);
          if (lit(X, yy) > tau) { pen ? ctx.lineTo(X, yy) : ctx.moveTo(X, yy); pen = true; } else pen = false;
        }
      }
    };
    family(40, (x, k) => [x * (1 + k * 0.028), up(x) * (1 + k * 0.012) - k * 6.4]);
    family(26, (x, k) => [x * (1 + k * 0.026), lo(x) * (1 + k * 0.01) + k * 6.6]);
    K.stroke(ctx, C.voidInk, 0.95 * lw, 0.5);
    // cross-contours on the lit brow ridge and cheek
    K.hatch(ctx, null, { bbox: { x0: -460, y0: -420, x1: 460, y1: 330 }, angle: 1.3, gap: 7, step: 14, amp: 0.8, color: C.voidInk, width: 0.7 * lw, alpha: 0.2,
      density: (x, y) => (y > up(x) - 12 && y < lo(x) + 8 && Math.abs(x) < 300 ? 0 : (lit(x, y) - 0.56) / 0.44) });
    // crease, under-eye fold, and the brow
    K.seed(612);
    const crease = [];
    for (let x = -268; x <= 286; x += 12) crease.push([x, up(x) - 42 * Math.pow(Math.max(0, 1 - (x / 290) ** 2), 0.6) - 4]);
    K.ink(ctx, crease, C.voidInk, 1.4 * lw, 1, false, 0.55);
    const fold = [];
    for (let x = -220; x <= 250; x += 12) fold.push([x, lo(x) + 30 * Math.pow(Math.max(0, 1 - (x / 260) ** 2), 0.7) + 6]);
    K.ink(ctx, fold, C.voidInk, 0.9 * lw, 1, false, 0.3);
    const g = K.stable(99);
    ctx.beginPath();
    for (let i = 0; i < 110; i++) {
      const u = g(), x = -300 + u * 610, y = -268 - 62 * Math.sin(Math.PI * (u * 0.85 + 0.1)) + (g() - 0.5) * 22 + u * 10;
      const a = -0.35 + u * 0.55 + (g() - 0.5) * 0.3, L = 16 + g() * 20;
      K.trace(ctx, K.seg(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L - 3, 5), 0.6);
    }
    K.stroke(ctx, C.voidInk, 1 * lw, 0.5);
  }
  function sclera(ctx, t, s, a) {
    if (a <= 0.01) return;
    const lw = 1 / Math.sqrt(s);
    K.fade(a, () => {
      ctx.save();
      K.clipTo(ctx, ALMOND);
      K.seed(651);
      K.fill(ctx, ALMOND, '#C9BB9C', 1, 1.5);
      const ball = K.sphereTone(0, -10, 330, -0.35, -0.7, 0);
      const dens = (x, y) => K.clamp(0.55 * ball(x, y) + 0.95 * K.clamp(1 - (y - up(x)) / 58) + 0.35 * K.clamp((Math.abs(x) - 170) / 130));
      K.hatch(ctx, null, { bbox: { x0: -300, y0: -150, x1: 300, y1: 140 }, angle: 0.4, gap: 3.6, step: 10, amp: 0.5, color: '#4A3F32', width: 0.9 * lw, alpha: 0.62, density: dens });
      K.hatch(ctx, null, { bbox: { x0: -300, y0: -150, x1: 300, y1: 140 }, angle: 1.65, gap: 4.4, step: 10, amp: 0.5, color: '#5C5040', width: 0.8 * lw, alpha: 0.45, density: (x, y) => (dens(x, y) - 0.5) / 0.5 });
      K.seed(652);
      for (const v of veins) K.ink(ctx, v.pts, C.ember, 1.1 * v.w * lw, 0.8, false, 0.55 * v.w + 0.1);
      // the caruncle at the inner corner
      K.fill(ctx, K.arc(-282, 12, 16, 11), '#C98472', 0.9, 1);
      K.ink(ctx, K.arc(-282, 12, 16, 11), C.ember, 0.9 * lw, 0.4, true, 0.6);
      ctx.restore();
    });
  }
  function lids(ctx, t, s, a) {
    if (a <= 0.01) return;
    const lw = 1 / Math.sqrt(s);
    K.fade(a, () => {
      // shadow the upper lid throws on the eye, over the iris too
      ctx.save();
      K.clipTo(ctx, ALMOND);
      K.seed(661);
      K.hatch(ctx, null, { bbox: { x0: -300, y0: -150, x1: 300, y1: -20 }, angle: 0.25, gap: 3.2, step: 9, amp: 0.4, color: '#05050A', width: 1.1 * lw, alpha: 0.75, density: (x, y) => K.clamp(1 - (y - up(x)) / 30) });
      ctx.restore();
      const U = [], L = [], U2 = [], L2 = [];
      for (let x = -300; x <= 300; x += 10) { U.push([x, up(x)]); U2.push([x, up(x) + 6 * Math.sqrt(Math.max(0, 1 - (x / 300) ** 2))]); }
      for (let x = -300; x <= 300; x += 10) { L.push([x, lo(x)]); L2.push([x, lo(x) - 5 * Math.sqrt(Math.max(0, 1 - (x / 300) ** 2))]); }
      K.seed(662);
      K.ink(ctx, U, C.voidInk, 2.8 * lw, 1, false, 0.95);
      K.ink(ctx, U2, '#C98472', 1 * lw, 0.6, false, 0.5);
      K.ink(ctx, L, C.voidInk, 1.8 * lw, 1, false, 0.8);
      K.ink(ctx, L2, '#C98472', 0.9 * lw, 0.6, false, 0.45);
      // lashes: upper sweep, lower fringe; a slight breathing sway
      const thick = [], thin = [];
      for (const l of lashesUp) {
        const sway = 0.06 * Math.sin(t * 1.4 + l.ph), len = l.len;
        const bx = l.x, by = l.y, lean = l.lean + sway;
        // out along the normal, then curling up and away toward the outer corner
        const p1 = [bx + l.nx * len * 0.45, by + l.ny * len * 0.45];
        const p2 = [bx + l.nx * len * 0.8 + l.tx * len * lean * 0.5, by + l.ny * len * 0.8 + l.ty * len * lean * 0.5 - len * 0.15];
        const p3 = [bx + l.nx * len * 0.85 + l.tx * len * (lean + 0.25), by + l.ny * len * 0.85 + l.ty * len * (lean + 0.25) - len * 0.42];
        const pts = K.bez([bx, by], p1, p2, p3, 8);
        thick.push(pts.slice(0, 5));
        thin.push(pts);
      }
      ctx.beginPath();
      for (const p of thick) K.trace(ctx, p, 0.3);
      K.stroke(ctx, C.voidInk, 2.2 * lw, 0.8);
      ctx.beginPath();
      for (const p of thin) K.trace(ctx, p, 0.3);
      K.stroke(ctx, C.voidInk, 1 * lw, 0.85);
      ctx.beginPath();
      for (const l of lashesLo) {
        const len = l.len, bx = l.x, by = l.y;
        const ex = bx + l.nx * len + l.tx * len * l.lean, ey = by + l.ny * len + l.ty * len * l.lean;
        K.trace(ctx, K.seg(bx, by, ex, ey, 5), 0.3);
      }
      K.stroke(ctx, C.voidInk, 0.9 * lw, 0.6);
    });
  }
  function catchlight(ctx, s, t) {
    const k = K.easeOut(K.range(t, 2.25, 2.5)); // a glint catching: it grows, it does not fade in
    if (k <= 0.01) return;
    const lw = 1 / s;
    {
      ctx.save();
      ctx.translate(-50, -54);
      ctx.scale(k, k);
      ctx.rotate(-0.08);
      const win = [[-15, -17], [14, -18], [16, 17], [-16, 18]];
      K.seed(671);
      K.fill(ctx, win, '#F6F1E4', 0.88, 0.4);
      K.ink(ctx, [...win, win[0]], '#F6F1E4', 1.4 * lw, 0.2, false, 0.9);
      ctx.beginPath();
      ctx.moveTo(-0.5, -18); ctx.lineTo(0.8, 17.5);
      ctx.moveTo(-15.5, 0); ctx.lineTo(15, -0.5);
      K.stroke(ctx, '#0A0A14', 2.4 * lw, 0.85);
      ctx.restore();
      K.glow(ctx, -50, -54, 40 * k, '#FFFFFF', 0.25);
      K.glow(ctx, 46, 48, 14 * k, '#FFFFFF', 0.35);
      K.fill(ctx, K.arc(46, 48, 4 * k, 4 * k, 0, TAU, 0, 1), '#F6F1E4', 0.8, 0.2);
    }
  }
  /** Drafting marks around the iris: the eye as an optical diagram. */
  function construction(ctx, t, s, a) {
    if (a <= 0.01) return;
    const lw = 1 / s;
    K.fade(a, () => {
      K.seed(681);
      const r1 = RI + 18, r2 = RI + 30;
      K.ink(ctx, K.arc(0, 0, r1, r1), C.cyan, 0.8 * lw, 0.4, false, 0.35);
      K.ink(ctx, K.arc(0, 0, r2, r2), C.cyan, 0.8 * lw, 0.4, false, 0.25);
      ctx.beginPath();
      for (let d = 0; d < 360; d += 6) {
        const an = (d / 360) * TAU + t * 0.03, L = d % 30 === 0 ? 12 : 5;
        ctx.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
        ctx.lineTo(Math.cos(an) * (r1 + L), Math.sin(an) * (r1 + L));
      }
      K.stroke(ctx, C.cyan, 0.8 * lw, 0.35);
      ctx.save();
      ctx.setLineDash([3 * lw, 8 * lw]);
      ctx.beginPath();
      ctx.moveTo(-440, 0); ctx.lineTo(440, 0);
      ctx.moveTo(0, -360); ctx.lineTo(0, 330);
      K.stroke(ctx, C.cyan, 0.8 * lw, 0.22);
      ctx.restore();
      for (const [cx, cy, a0] of [[-300, 12, -0.55], [300, -4, Math.PI - 0.55]]) {
        K.ink(ctx, K.arc(cx, cy, 300, 300, a0, a0 + 1.1), C.cyan, 0.8 * lw, 0.4, false, 0.22);
        K.ink(ctx, K.arc(cx, cy, 3, 3), C.cyan, 0.8 * lw, 0.2, false, 0.5);
      }
    });
  }
  /** Light gathering into the pupil as we fall in. */
  function rays(ctx, t, a) {
    if (a <= 0.01) return;
    K.seed(691);
    ctx.beginPath();
    for (let k = 0; k < 22; k++) {
      const an = (k / 22) * TAU + 0.13, R = 760, f = K.frac(t * 0.9 + k * 0.37);
      const x0 = SX + Math.cos(an) * R, y0 = SY + Math.sin(an) * R;
      const x1 = SX + Math.cos(an) * R * (0.25 + 0.2 * f), y1 = SY + Math.sin(an) * R * (0.25 + 0.2 * f);
      K.trace(ctx, K.seg(x0, y0, x1, y1, 20), 1);
    }
    K.stroke(ctx, C.soulHot, 1, 0.35 * a);
  }

  // ---------------------------------------------------------------- the world through the pupil
  const SHADOW = [16, 9, 16], FIG = [30, 20, 14], AMBER = K.rgb(C.soul), HOT = K.rgb(C.soulHot);
  const mix3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  function palette(f) {
    const m = (a, b) => mix3(K.rgb(a), K.rgb(b), f);
    return {
      top: m('#3E5C8A', '#150C26'), hor: m('#F7D08A', '#C4533C'),
      sun: m('#FFE6A8', '#E0603E'), halo: m('#F3A53A', '#B8412C'),
      gNear: m('#A87C45', '#6B2C30'), gFar: m('#E3C27E', '#9A4A44'),
      sunY: K.lerp(300, 640, f), sunR: K.lerp(112, 70, f), rays: 1 - f, shadowL: K.lerp(30, 250, f),
    };
  }
  const FS = 1.55, FEET = 662, CHEST = FEET - (FEET - 470) * FS;
  function inFigure(x0, y0) {
    const x = 500 + (x0 - 500) / FS, y = FEET + (y0 - FEET) / FS;
    const dx = x - 500, ax = Math.abs(dx);
    if (Math.hypot(dx, y - 413) < 25) return true;                                      // head
    if (y >= 434 && y < 452 && ax < 10) return true;                                     // neck
    if (y >= 450 && y < 562 && ax < K.lerp(35, 22, (y - 450) / 112)) return true;       // coat
    if (y >= 456 && y < 568) { const o = K.lerp(36, 41, (y - 456) / 112); if (ax > o - 9 && ax < o) return true; } // arms
    if (y >= 560 && y < 662 && Math.abs(ax - K.lerp(11, 15, (y - 560) / 102)) < 8.5) return true; // legs
    return false;
  }
  function sceneColor(x, y, t, P) {
    const HY = 600;
    let c;
    if (y < HY) { const u = K.clamp(y / HY); c = mix3(P.top, P.hor, u * u); }
    else {
      const u = K.clamp((y - HY) / 400);
      c = mix3(P.gFar, P.gNear, Math.sqrt(u));
      if (K.frac((Math.atan2(y - HY, x - 500) * 9) / Math.PI) < 0.5) c = mix3(c, [0, 0, 0], 0.12);
    }
    const dx = x - 500, dy = y - P.sunY, d = Math.hypot(dx, dy);
    if (y < HY + 2) {
      c = mix3(c, P.halo, Math.exp(-Math.max(0, d - P.sunR) / 115) * 0.7);
      if (P.rays > 0.02 && d < 380 && K.frac((Math.atan2(dy, dx) * 18) / TAU + t * 0.04) < 0.32) c = mix3(c, P.sun, 0.4 * P.rays * (1 - d / 380));
      if (d < P.sunR) c = mix3(c, P.sun, K.clamp((P.sunR - d) / 6));
    }
    if (y > 655) {
      const L = P.shadowL, dd = y - 660;
      if (dd < L && Math.abs(x - 500) < 18 + dd * 0.44) c = mix3(c, SHADOW, 0.88);
      const hy = 660 + L, hr = 26 + L * 0.34;
      if (Math.hypot(x - 500, (y - hy) * 1.25) < hr) c = mix3(c, SHADOW, 0.9);
    }
    if (inFigure(x, y)) c = FIG;
    const cd = Math.hypot(x - 500, y - CHEST);
    if (cd < 46) c = mix3(c, cd < 11 ? HOT : AMBER, cd < 11 ? 1 : (1 - cd / 46) * 0.6);
    return c;
  }
  function hexPath(p, cx, cy, r) {
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 3, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      k ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
  }
  function mosaic(ctx, t, R) {
    if (R <= 1) return;
    const fear = fearAt(t), P = palette(fear);
    const rho = 13.2 + 8 * (0.5 + 0.5 * Math.sin((t - 5.4) * 2.6 + 2.89)) + 11 * fear;
    const blur = 0.55 + 0.35 * Math.sin(t * 2.1 + 4.47) + 0.45 * fear;
    const hw = Math.sqrt(3) * rho, vh = 1.5 * rho;
    // No clip (costly on software canvases): cells stop just inside the rim and a dark
    // collar is drawn over their ragged edge afterwards.
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX, AY, R, 0, TAU);
    ctx.fillStyle = '#2A2230'; // the grout between the cells reads as their outlines
    ctx.globalAlpha = K.A;
    ctx.fill();
    ctx.globalAlpha = 1;
    K.seed(701);
    const lens = new Path2D(), groups = new Map(), dk = [], lt = [], glints = [];
    const q10 = (v) => Math.min(250, Math.round(v / 10) * 10);
    const rows = Math.ceil((R + rho) / vh) + 1;
    for (let j = -rows; j <= rows; j++) {
      const cy = AY + j * vh, cols = Math.ceil((R + rho) / hw) + 1;
      for (let i = -cols; i <= cols; i++) {
        const cx = AX + i * hw + (j & 1 ? hw / 2 : 0), dx = cx - AX, dy = cy - AY, dd = Math.hypot(dx, dy);
        if (dd > R + rho * 0.2) continue;
        const k = 1 - 0.2 * (dd / AR) ** 2;
        const sx = AX + dx * k + 11 * blur * K.n2(cx * 0.012 + t * 0.7, cy * 0.012);
        const sy = AY + dy * k + 11 * blur * K.n2(cx * 0.012 + 7, cy * 0.012 - t * 0.6);
        const c1 = sceneColor(sx, sy, t, P), c2 = sceneColor(sx + 26 * blur, sy + 8 * blur, t, P);
        let c = mix3(c1, c2, 0.38);
        const edge = K.clamp((dd - R * 0.74) / (R * 0.26));
        c = mix3(c, [6, 4, 9], edge * 0.75);
        const key = (q10(c[0]) << 16) | (q10(c[1]) << 8) | q10(c[2]);
        let gp = groups.get(key);
        if (!gp) groups.set(key, (gp = new Path2D()));
        hexPath(gp, cx, cy, rho * 0.88);
        const h = K.hash((i + 500) * 7919 + (j + 500) * 104729);
        if (h < 0.3) {
          lens.moveTo(cx + Math.cos(-2.7) * rho * 0.6, cy + Math.sin(-2.7) * rho * 0.6);
          lens.arc(cx, cy, rho * 0.6, -2.7, -1.75);
        }
        const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
        const arr = lum > 0.38 ? dk : lt, an = 0.45 + h * 1.3, ca = Math.cos(an), sa = Math.sin(an);
        if (h < 0.62) for (let m = -0.5; m <= 0.5; m += 1) {
          const ox = -sa * m * rho * 0.42, oy = ca * m * rho * 0.42, L = rho * 0.46;
          arr.push(cx + ox - ca * L + K.rs(0.6), cy + oy - sa * L, cx + ox + ca * L, cy + oy + sa * L + K.rs(0.6));
        }
        if (h > 0.955) glints.push(cx - rho * 0.28, cy - rho * 0.3, rho * 0.16);
      }
    }
    for (const [key, gp] of groups) {
      ctx.fillStyle = `rgb(${key >> 16},${(key >> 8) & 255},${key & 255})`;
      ctx.globalAlpha = K.A;
      ctx.fill(gp);
    }
    ctx.globalAlpha = 1;
    const seg = (arr, col, al, w) => {
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 4) { ctx.moveTo(arr[i], arr[i + 1]); ctx.lineTo(arr[i + 2], arr[i + 3]); }
      K.stroke(ctx, col, w, al);
    };
    seg(dk, '#2B1A10', 0.42, 1.2);
    seg(lt, C.voidInk, 0.26, 1);
    ctx.strokeStyle = '#FFF8E6';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.2 * K.A;
    ctx.stroke(lens);
    ctx.globalAlpha = 1;
    // tear glints
    ctx.beginPath();
    for (let i = 0; i < glints.length; i += 3) { ctx.moveTo(glints[i] + glints[i + 2], glints[i + 1]); ctx.arc(glints[i], glints[i + 1], glints[i + 2], 0, TAU); }
    ctx.fillStyle = '#FFF8E6';
    ctx.globalAlpha = 0.55 * K.A;
    ctx.fill();
    ctx.globalAlpha = 1;
    // a running tear: a bright meniscus sliding down one side of the lens
    const ty = AY - R + ((t - 5.4) * 90) % (2 * R);
    K.seed(702);
    if (ty > AY - R * 0.7 && ty < AY + R * 0.7) K.ink(ctx, K.arc(AX - R * 0.2, ty, R * 0.9, R * 0.9, -2.2, -0.95), '#FFFFFF', 2, 1.2, false, 0.18 * K.clamp(R / AR));
    // the collar that trims the cells to a circle
    ctx.beginPath();
    ctx.arc(AX, AY, R + rho * 0.75, 0, TAU);
    ctx.lineWidth = rho * 1.5;
    ctx.strokeStyle = '#030306';
    ctx.globalAlpha = K.A;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  /** The rim of the pupil seen from the inside: iris fibres and a drafting dial. */
  function apertureRim(ctx, t, R) {
    if (R <= 2) return;
    const v = K.clamp(R / AR);
    K.fade(v, () => {
      const g = K.stable(711);
      K.seed(712);
      const paths = [[], []];
      for (let i = 0; i < 120; i++) {
        const a = g() * TAU + t * 0.03, L = 20 + g() * 44, tw = (g() - 0.5) * 0.08;
        paths[i % 2].push(K.seg(AX + Math.cos(a) * (R + 3), AY + Math.sin(a) * (R + 3), AX + Math.cos(a + tw) * (R + L), AY + Math.sin(a + tw) * (R + L), 8));
      }
      for (const [c, col, al] of [[0, C.soul, 0.5], [1, C.cyan, 0.4]]) { ctx.beginPath(); for (const p of paths[c]) K.trace(ctx, p, 0.5); K.stroke(ctx, col, 1, al); }
      K.ink(ctx, K.arc(AX, AY, R + 2, R + 2, 0, TAU * 1.02), C.soul, 2, 0.8, false, 0.7);
      const r2 = R + 72;
      K.ink(ctx, K.arc(AX, AY, r2, r2), C.cyan, 0.8, 0.6, false, 0.3);
      ctx.beginPath();
      for (let d = 0; d < 360; d += 5) {
        const a = (d / 360) * TAU - t * 0.05, L = d % 30 === 0 ? 14 : 6;
        ctx.moveTo(AX + Math.cos(a) * r2, AY + Math.sin(a) * r2);
        ctx.lineTo(AX + Math.cos(a) * (r2 + L), AY + Math.sin(a) * (r2 + L));
      }
      K.stroke(ctx, C.cyan, 0.8, 0.3);
    });
  }

  // ---------------------------------------------------------------- plate
  FILM.scenes.eye = {
    tone: 'void',
    lines: [
      { text: 'Nothing is clear,', at: 1.0 },
      { text: 'The vision, the fear.', at: 3.8 },
    ],
    sfx: [
      { at: 0.3, kind: 'chime' },
      { at: 4.85, kind: 'whoosh' },
      { at: 5.6, kind: 'hiss' },
      { at: 8.25, kind: 'whoosh' },
    ],
    mood: (t) => {
      const f = fearAt(t);
      return { drone: 0.75, warm: 0.35 * (1 - K.sr(t, 2, 4)) + 0.4 * (1 - f) * K.sr(t, 5.5, 6), wind: 0.45 * f, rumble: 0.2 * f };
    },
    init() {
      gal = buildGalaxy();
      stars = K.makeStars(33, 460);
      veins = buildVeins();
      [lashesUp, lashesLo] = buildLashes();
      ALMOND = [];
      for (let x = -300; x <= 300; x += 10) ALMOND.push([x, up(x)]);
      for (let x = 300; x >= -300; x -= 10) ALMOND.push([x, lo(x)]);
    },
    draw(ctx, t, dur) {
      if (t >= 9.0) { ctx.fillStyle = '#030306'; ctx.fillRect(0, 0, 1000, 1000); return; }
      if (t < 5.75) {
        // One camera, one eye. At the start we are so close that the iris fills the frame and
        // reads as a galaxy; pulling back brings the white, the lids and the face in from the
        // edges. Nothing cross-fades, so no frame is a half-transparent veil.
        const s = camScale(t), pup = pupilAt(t);
        K.voidBg(ctx);
        K.drawStars(ctx, stars, t, { alpha: 0.8 });
        K.ruledSky(ctx, { gap: 6, alpha: 0.06, seed: 62 });
        const base = ctx.getTransform();
        ctx.save();
        ctx.translate(SX, SY);
        ctx.scale(s, s);
        if (s < 4.6) skin(ctx, t, s); // beyond this the face lies wholly outside the frame
        sclera(ctx, t, s, 1);
        ctx.restore();
        // the iris-galaxy, clipped to the opening of the lids
        ctx.save();
        ctx.translate(SX, SY);
        ctx.scale(s, s);
        K.clipTo(ctx, ALMOND);
        ctx.setTransform(base);
        ctx.beginPath();
        ctx.arc(SX, SY, RI * s, 0, TAU);
        ctx.clip();
        const ig = ctx.createRadialGradient(SX, SY, 0, SX, SY, RI * s);
        ig.addColorStop(0, '#2A1A14');
        ig.addColorStop(0.45, '#141B2C');
        ig.addColorStop(1, '#0A1222');
        ctx.fillStyle = ig;
        ctx.fillRect(0, 0, 1000, 1000);
        galaxy(ctx, t, s, pup);
        irisMarks(ctx, t, s, pup.r, 1 - K.sr(s, 1.8, 4.2));
        pupilDisc(ctx, t, s, pup);
        ctx.restore();
        ctx.save();
        ctx.translate(SX, SY);
        ctx.scale(s, s);
        catchlight(ctx, s, t);
        if (s < 4.6) lids(ctx, t, s, 1);
        construction(ctx, t, s, K.sr(t, 3.1, 4.2) * (1 - K.sr(t, 4.75, 5.1)));
        ctx.restore();
        rays(ctx, t, K.sr(t, 4.4, 4.95) * (1 - K.sr(t, 5.25, 5.6)));
      } else {
        ctx.fillStyle = '#030306';
        ctx.fillRect(0, 0, 1000, 1000);
      }
      const R = apertureAt(t);
      mosaic(ctx, t, R);
      apertureRim(ctx, t, R);
    },
  };
})();
