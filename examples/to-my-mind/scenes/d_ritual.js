// The poem's words in this file are © 2026 Sahaib Singh Arora, all rights reserved — see examples/to-my-mind/NOTICE in the ink-film repository. The code is MIT.
'use strict';
/* Plates V and VI — the ritual and the bargain.
   V:  a clock-and-gear mandala seen from above. Identical walkers circle it in lockstep; a heavy
       seal stamps the one warm figure until it is as grey as the rest, then stamps the whole ritual.
   VI: a balance weighs the soul's flame against pouring gold, three times over, while the towers
       of the rich lean closer and the tally of bargains grows past counting. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const LX = 0.78, LY = 0.62; // light from the upper left; shadows fall toward the lower right

  const circ = (x, y, r) => K.arc(x, y, r, r, 0, TAU, 0, Math.max(1.2, Math.min(9, r * 0.3)));
  const annulus = (x, y, r0, r1) => (ctx) => {
    ctx.moveTo(x + r1, y);
    ctx.arc(x, y, r1, 0, TAU);
    ctx.moveTo(x + r0, y);
    ctx.arc(x, y, r0, 0, TAU, true);
  };
  const quad = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const closed = (pts) => [...pts, pts[0]];
  /** Damped jolt after each hit time. */
  function jolt(t, times, amp, decay = 8) {
    let dx = 0, dy = 0;
    const m = FILM.reduced ? 0.18 : 1;
    for (const [T0, A] of times) {
      const a = t - T0;
      if (a < 0 || a > 0.9) continue;
      const e = Math.exp(-a * decay) * A * amp * m;
      dx += Math.sin(a * 61 + T0) * e;
      dy += Math.cos(a * 47 + T0) * e;
    }
    return [dx, dy];
  }

  // =================================================================== PLATE V · the ritual
  const OX = 500, OY = 450; // the clock's centre — the Vitruvian circle cuts to this ring
  const FACE_IN = 298, FACE_R = 330;
  const TRACKS = [
    { r0: 252, r1: 290, n: 24, spin: 0.05, walk: 0.07, base: 0.1 },    // outer, clockwise
    { r0: 192, r1: 232, n: 18, spin: -0.06, walk: -0.1, base: 0.332 }, // middle — the individual walks here
    { r0: 134, r1: 172, n: 12, spin: 0.08, walk: 0.1, base: 0.25 },    // inner
  ];
  const PRESS = [3.0, 5.2, 7.4];
  const FINAL = 9.93; // the last, giant stamp; the cut to plate VI lands on it
  const V = {
    tint: '#95A0A5', band: '#D4CDBA', face: '#DED7C5', recess: '#7A7568',
    body: '#8C8983', head: '#34312D', warm: '#B8412C', warmHead: '#3A1C12',
    iron: '#2E2A26', ironMid: '#57504A', ironLight: '#A1978A', brass: '#A8894A', brassDark: '#5A4524',
  };
  let baseC = null, bands = [];

  const warmth = (t) => 1 - 0.4 * K.sr(t, PRESS[0], PRESS[0] + 0.3) - 0.34 * K.sr(t, PRESS[1], PRESS[1] + 0.3) - 0.26 * K.sr(t, PRESS[2], PRESS[2] + 0.3);

  function buildBase() {
    const [c, x] = K.makeCanvas(1000, 1000);
    const g = K.stable(41);
    // flagstones in running bond, seen from above
    const SH = 96;
    for (let j = -1; j < 12; j++) {
      let x0 = -40 - g() * 70;
      for (let i = 0; x0 < 1040; i++) {
        K.still(1000 + j * 40 + i);
        const SW = 84 + g() * 96, y0 = j * SH - 30;
        const q = [[x0 + g() * 5, y0 + g() * 5], [x0 + SW - g() * 5, y0 + g() * 5], [x0 + SW - g() * 5, y0 + SH - g() * 5], [x0 + g() * 5, y0 + SH - g() * 5]];
        x0 += SW;
        const dark = g() > 0.82, tone = dark ? 0.55 + g() * 0.2 : 0.12 + g() * 0.32;
        K.fill(x, q, dark ? '#8F8D82' : g() > 0.5 ? '#AEAC9F' : '#C3BFB0', 0.45, 0);
        K.hatch(x, q, { angle: 0.8 + (g() - 0.5) * 0.4, gap: 4.4, step: 10, amp: 0.6, color: '#45443E', width: 0.7, alpha: 0.4, density: (px, py) => tone + 0.3 * K.fbm(px * 0.018, py * 0.018, 2) });
        K.ink(x, closed(q), '#34332E', 1.1, 0.9, false, 0.55);
        if (g() > 0.72) {
          const cx = x0 + SW * (0.2 + g() * 0.6), cy = y0 + SH * (0.2 + g() * 0.6), pts = [[cx, cy]];
          for (let k = 0; k < 5; k++) pts.push([pts[k][0] + (g() - 0.3) * 18, pts[k][1] + (g() - 0.5) * 14]);
          K.ink(x, pts, '#34332E', 0.7, 0.3, false, 0.5);
        }
      }
    }
    K.still(7);
    // compass circles scribed on the floor around the clock, a drafter's layout
    x.save();
    x.setLineDash([4, 8]);
    for (const r of [392, 468, 560]) K.ink(x, circ(OX, OY, r), '#2E2D29', 0.8, 0.8, false, 0.28);
    x.restore();
    // the clock stands proud of the floor: its cast shadow
    for (let k = 0; k < 4; k++) K.fill(x, circ(OX + LX * (8 + k * 5), OY + LY * (8 + k * 5), FACE_R + k * 2), '#1A1814', 0.09, 0);
    // recessed works under the rings
    const rec = circ(OX, OY, FACE_IN);
    K.fill(x, rec, V.recess, 1, 0);
    K.crosshatch(x, rec, { angle: 0.7, gap: 3.4, step: 10, amp: 0.5, color: '#221F1B', width: 0.8, alpha: 0.7, density: (px, py) => 0.45 + 0.3 * K.clamp(((px - OX) * LX + (py - OY) * LY) / FACE_IN + 0.3) });
    x.beginPath();
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU;
      K.trace(x, K.seg(OX + Math.cos(a) * 40, OY + Math.sin(a) * 40, OX + Math.cos(a) * 128, OY + Math.sin(a) * 128, 10), 0.4);
    }
    K.stroke(x, '#1E1B18', 0.7, 0.5);
    // the dial's face band
    const face = annulus(OX, OY, FACE_IN, FACE_R), fb = { x0: OX - FACE_R, y0: OY - FACE_R, x1: OX + FACE_R, y1: OY + FACE_R };
    K.fill(x, face, V.face, 1, 0);
    K.hatch(x, face, { angle: -0.4, gap: 3.2, step: 10, amp: 0.4, color: '#6E685C', width: 0.6, alpha: 0.4, bbox: fb, density: (px, py) => 0.18 + 0.5 * K.clamp(((px - OX) * LX + (py - OY) * LY) / FACE_R) });
    K.stipple(x, face, { count: 1600, bbox: fb, color: '#4E493F', alpha: 0.35, r0: 0.35, r1: 1 });
    // bevels: lit edge upper-left, shaded edge lower-right
    K.ink(x, K.arc(OX, OY, FACE_R - 2, FACE_R - 2, Math.PI, 1.5 * Math.PI), '#FFF9EA', 2, 0.4, false, 0.7);
    K.ink(x, K.arc(OX, OY, FACE_IN + 2, FACE_IN + 2, 0, 0.5 * Math.PI), '#FFF9EA', 1.6, 0.4, false, 0.5);
    baseC = c;
  }

  function buildBand(tr, i) {
    const S = 2 * (tr.r1 + 6);
    const [c, x] = K.makeCanvas(S, S);
    x.translate(S / 2, S / 2);
    K.still(500 + i);
    const reg = annulus(0, 0, tr.r0, tr.r1), bb = { x0: -tr.r1, y0: -tr.r1, x1: tr.r1, y1: tr.r1 };
    K.fill(x, reg, V.band, 1, 0);
    K.hatch(x, reg, { angle: 0.6 + i, gap: 3.4, step: 10, amp: 0.5, color: '#6A6457', width: 0.6, alpha: 0.4, bbox: bb, density: (px, py) => 0.3 + 0.35 * K.n2(px * 0.025 + i, py * 0.025) });
    K.stipple(x, reg, { count: 1100, bbox: bb, color: '#554F44', alpha: 0.35, r0: 0.35, r1: 1 });
    const mid = (tr.r0 + tr.r1) / 2;
    x.beginPath();
    if (i === 0) {
      // knurled edges
      for (let k = 0; k < 144; k++) {
        const a = (k / 144) * TAU, c0 = Math.cos(a), s0 = Math.sin(a);
        x.moveTo(c0 * tr.r0, s0 * tr.r0); x.lineTo(c0 * (tr.r0 + 6), s0 * (tr.r0 + 6));
        x.moveTo(c0 * (tr.r1 - 6), s0 * (tr.r1 - 6)); x.lineTo(c0 * tr.r1, s0 * tr.r1);
      }
      K.stroke(x, '#3A362F', 0.8, 0.7);
      x.save(); x.setLineDash([2, 6]);
      K.ink(x, circ(0, 0, mid), '#3A362F', 0.7, 0.4, false, 0.4);
      x.restore();
    } else if (i === 1) {
      // chevrons pointing the way the crowd must walk
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * TAU, dx = Math.sin(a), dy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
        const px = nx * mid, py = ny * mid;
        x.moveTo(px - dx * 5 + nx * 9, py - dy * 5 + ny * 9); x.lineTo(px + dx * 4, py + dy * 4); x.lineTo(px - dx * 5 - nx * 9, py - dy * 5 - ny * 9);
      }
      K.stroke(x, '#3A362F', 1, 0.35);
      for (const r of [tr.r0 + 4, tr.r1 - 4]) K.ink(x, circ(0, 0, r), '#3A362F', 0.6, 0.3, false, 0.45);
    } else {
      // studs
      for (let k = 0; k < 36; k++) {
        const a = ((k + 0.5) / 36) * TAU;
        for (const r of [tr.r0 + 6, tr.r1 - 6]) { const sx = Math.cos(a) * r, sy = Math.sin(a) * r; x.moveTo(sx + 2.6, sy); x.arc(sx, sy, 2.6, 0, TAU); }
      }
      x.fillStyle = '#4A453C'; x.globalAlpha = 0.75; x.fill(); x.globalAlpha = 1;
    }
    return { c, S };
  }

  function gearPts(x, y, r, teeth, rot) {
    const pts = [], d = TAU / teeth, ro = r * 1.13;
    for (let k = 0; k < teeth; k++) {
      const a = rot + k * d;
      for (const [f, rr] of [[0, r], [0.12, ro], [0.45, ro], [0.57, r], [0.78, r]]) pts.push([x + Math.cos(a + d * f) * rr, y + Math.sin(a + d * f) * rr]);
    }
    return pts;
  }
  function brassGear(ctx, x, y, r, teeth, rot, seed) {
    const pts = gearPts(x, y, r, teeth, rot);
    K.seed(seed);
    K.fill(ctx, K.xf(pts, LX * 7, LY * 7), '#15130F', 0.3, 0);
    K.fill(ctx, pts, V.brass, 1, 0.8);
    K.hatch(ctx, pts, { angle: 0.75, gap: 2.8, step: 7, amp: 0.4, color: V.brassDark, width: 0.9, density: (px, py) => K.clamp(((px - x) * LX + (py - y) * LY) / (r * 1.1) + 0.32) });
    for (let k = 0; k < 5; k++) {
      const a0 = rot + (k * TAU) / 5 + 0.22, a1 = a0 + TAU / 5 - 0.44;
      const win = [...K.arc(x, y, r * 0.78, r * 0.78, a0, a1, 0, 5), ...K.arc(x, y, r * 0.36, r * 0.36, a1, a0, 0, 4)];
      K.fill(ctx, win, V.iron, 0.94, 0.4);
      K.ink(ctx, closed(win), '#16120E', 0.9, 0.3, false, 0.8);
    }
    K.ink(ctx, closed(pts), '#1E1810', 1.3, 0.3, false, 0.95);
    K.ink(ctx, circ(x, y, r * 0.86), '#1E1810', 0.8, 0.3, false, 0.55);
    const hub = circ(x, y, r * 0.2);
    K.fill(ctx, hub, V.ironMid, 1, 0.3);
    K.ink(ctx, hub, '#16120E', 1, 0.2, true);
    K.ink(ctx, K.arc(x, y, r * 1.02, r * 1.02, 3.4, 4.6), '#F6E3B0', 1.3, 0.3, false, 0.6);
  }

  /** An iron clock hand: counterweight, shaft, pierced loop and a leaf-shaped tip. */
  function handPieces(len, w) {
    return {
      shaft: [[-len * 0.14, -w * 0.62], [len * 0.52, -w * 0.34], [len * 0.52, w * 0.34], [-len * 0.14, w * 0.62]],
      loop: [len * 0.6, 0, w * 2.1, w * 1.1],
      tip: K.spline([[len * 0.66, 0], [len * 0.78, -w * 1.5], [len, 0], [len * 0.78, w * 1.5]], true, 6),
      tail: [-len * 0.2, 0, w * 1.7],
    };
  }
  function hand(ctx, len, w, ang, seed) {
    const P = handPieces(len, w), c = Math.cos(ang), s = Math.sin(ang);
    const W = (pts) => K.xf(pts, OX, OY, 1, ang);
    const at = (lx, ly) => [OX + lx * c - ly * s, OY + lx * s + ly * c];
    const [lcx, lcy] = at(P.loop[0], P.loop[1]), [tcx, tcy] = at(P.tail[0], P.tail[1]);
    K.seed(seed);
    // shadow on the dial
    ctx.save();
    ctx.translate(LX * 13, LY * 13);
    for (const reg of [W(P.shaft), W(P.tip), annulus(lcx, lcy, P.loop[3], P.loop[2]), circ(tcx, tcy, P.tail[2])]) K.fill(ctx, reg, '#15130F', 0.2, 0);
    ctx.restore();
    for (const reg of [W(P.shaft), W(P.tip), annulus(lcx, lcy, P.loop[3], P.loop[2]), circ(tcx, tcy, P.tail[2])]) K.fill(ctx, reg, V.iron, 1, 0.6);
    K.ink(ctx, closed(W(P.shaft)), '#0E0C0A', 1.1, 0.3, false);
    K.ink(ctx, W(P.tip), '#0E0C0A', 1.1, 0.3, true);
    K.ink(ctx, circ(lcx, lcy, P.loop[2]), '#0E0C0A', 1.1, 0.3, false);
    K.ink(ctx, circ(lcx, lcy, P.loop[3]), '#0E0C0A', 1, 0.3, false);
    K.ink(ctx, circ(tcx, tcy, P.tail[2]), '#0E0C0A', 1.1, 0.3, false);
    // a bright ridge along the blade
    K.ink(ctx, W(K.seg(-len * 0.12, -w * 0.15, len * 0.5, -w * 0.1, 10)), V.ironLight, 0.9, 0.3, false, 0.8);
    K.ink(ctx, W(K.seg(len * 0.68, -w * 0.2, len * 0.95, -w * 0.05, 8)), V.ironLight, 0.9, 0.3, false, 0.8);
  }

  function trackPos(ti, k, t) {
    const tr = TRACKS[ti], w = tr.spin + tr.walk, rr = (tr.r0 + tr.r1) / 2, dir = Math.sign(w);
    const a = tr.base + (k * TAU) / tr.n + w * t;
    return { x: OX + Math.cos(a) * rr, y: OY + Math.sin(a) * rr, ux: -Math.sin(a) * dir, uy: Math.cos(a) * dir, a };
  }
  /** The individual: out of step and drifting until the seal has done its work. */
  function individual(t) {
    const tr = TRACKS[1], w = tr.spin + tr.walk, lock = 1 - warmth(t);
    const a = tr.base + w * t + 0.05 * Math.sin(t * 0.9) * (1 - lock);
    const rr = (tr.r0 + tr.r1) / 2 + 6 * Math.sin(t * 1.9) * (1 - lock);
    const dir = Math.sign(w), sway = 0.35 * Math.sin(t * 1.3) * (1 - lock);
    const ux0 = -Math.sin(a) * dir, uy0 = Math.cos(a) * dir, cs = Math.cos(sway), sn = Math.sin(sway);
    return {
      x: OX + Math.cos(a) * rr, y: OY + Math.sin(a) * rr,
      ux: ux0 * cs - uy0 * sn, uy: ux0 * sn + uy0 * cs,
      ph: K.lerp(t * TAU * 1.12 + 1.3, t * TAU * 1.5, lock),
    };
  }

  /** Walkers seen from above, batched: shadows, feet, arms, shoulders, heads. */
  const FS = 1.55; // walker scale
  function walkers(ctx, figs, body, head, stainLevel = 0, zMul = 1) {
    if (!figs.length) return;
    const Z = FS * zMul;
    ctx.beginPath();
    for (const f of figs) {
      const tx = f.x + LX * 48, ty = f.y + LY * 48;
      ctx.moveTo(f.x + LY * 6.5 * Z, f.y - LX * 6.5 * Z);
      ctx.lineTo(tx + LY * 2.8 * Z, ty - LX * 2.8 * Z);
      ctx.lineTo(tx - LY * 2.8 * Z, ty + LX * 2.8 * Z);
      ctx.lineTo(f.x - LY * 6.5 * Z, f.y + LX * 6.5 * Z);
      ctx.closePath();
    }
    ctx.globalAlpha = 0.24 * K.A; ctx.fillStyle = '#1A1814'; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const f of figs) {
      const s = Math.sin(f.ph), px = -f.uy, py = f.ux;
      for (const sd of [-1, 1]) {
        const fx = f.x + (f.ux * 4.6 * s * sd + px * 2.9 * sd) * Z, fy = f.y + (f.uy * 4.6 * s * sd + py * 2.9 * sd) * Z;
        ctx.moveTo(fx + 2.3 * Z, fy);
        ctx.ellipse(fx, fy, 2.3 * Z, 1.6 * Z, Math.atan2(f.uy, f.ux), 0, TAU);
      }
    }
    ctx.globalAlpha = K.A; ctx.fillStyle = head; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const f of figs) {
      const s = Math.sin(f.ph), px = -f.uy, py = f.ux;
      for (const sd of [-1, 1]) {
        const sx = f.x + px * 7.4 * sd * Z, sy = f.y + py * 7.4 * sd * Z;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + ((-5 * s * sd + 2.2) * f.ux + px * 1.6 * sd) * Z, sy + ((-5 * s * sd + 2.2) * f.uy + py * 1.6 * sd) * Z);
      }
    }
    K.stroke(ctx, head, 2.1 * Z, 1);
    const yoke = (f) => {
      // a capsule across the shoulders: rounded ends, so it never reads as an eye
      const px = -f.uy, py = f.ux, hl = 5 * Z, rr = 4.3 * Z, a0 = Math.atan2(py, px), pts = [];
      for (let k = 0; k <= 6; k++) { const a = a0 - Math.PI / 2 + (k / 6) * Math.PI; pts.push([f.x + px * hl + Math.cos(a) * rr, f.y + py * hl + Math.sin(a) * rr]); }
      for (let k = 0; k <= 6; k++) { const a = a0 + Math.PI / 2 + (k / 6) * Math.PI; pts.push([f.x - px * hl + Math.cos(a) * rr, f.y - py * hl + Math.sin(a) * rr]); }
      return pts;
    };
    const yokes = figs.map(yoke);
    ctx.beginPath();
    for (const y of yokes) K.path(ctx, y, true);
    ctx.globalAlpha = K.A; ctx.fillStyle = body; ctx.fill(); ctx.globalAlpha = 1;
    // a fold of cloth down the back, and the ink outline
    ctx.beginPath();
    for (let i = 0; i < figs.length; i++) {
      const f = figs[i];
      K.trace(ctx, [...yokes[i], yokes[i][0]], 0.35);
      ctx.moveTo(f.x - f.ux * 1 * Z, f.y - f.uy * 1 * Z);
      ctx.lineTo(f.x - f.ux * 4.2 * Z, f.y - f.uy * 4.2 * Z);
    }
    K.stroke(ctx, '#1C1916', 1, 0.9);
    if (stainLevel > 0) {
      for (const f of figs) K.stipple(ctx, null, { count: Math.round(34 * stainLevel), bbox: { x0: f.x - 12 * Z, y0: f.y - 8 * Z, x1: f.x + 12 * Z, y1: f.y + 8 * Z }, color: '#3E3B37', alpha: 0.75, r0: 0.6, r1: 1.5 });
    }
    ctx.beginPath();
    for (const f of figs) { const hx = f.x + f.ux * 3.4 * Z, hy = f.y + f.uy * 3.4 * Z; ctx.moveTo(hx + 4.3 * Z, hy); ctx.arc(hx, hy, 4.3 * Z, 0, TAU); }
    ctx.globalAlpha = K.A; ctx.fillStyle = head; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const f of figs) { const hx = f.x + f.ux * 3.4 * Z, hy = f.y + f.uy * 3.4 * Z; ctx.moveTo(hx + 4.3 * Z, hy); ctx.arc(hx, hy, 4.3 * Z, 0, TAU); }
    K.stroke(ctx, '#0E0C0A', 0.8, 0.8);
    ctx.beginPath();
    for (const f of figs) {
      const hx = f.x + f.ux * 3.4 * Z, hy = f.y + f.uy * 3.4 * Z, a0 = Math.atan2(f.uy, f.ux);
      ctx.moveTo(hx + Math.cos(a0 + 2.2) * 3.2 * Z, hy + Math.sin(a0 + 2.2) * 3.2 * Z);
      ctx.arc(hx, hy, 3.2 * Z, a0 + 2.2, a0 + 4.1);
    }
    K.stroke(ctx, '#8C8780', 0.8, 0.8);
  }

  /** The seal, seen from above. (x, y) is the spot on the floor; h its height (0 = pressed). */
  function seal(ctx, x, y, R, h, alpha, seed) {
    if (alpha <= 0.01) return;
    const s = 1 + h * 1.1, sx = x + (x - 500) * h * 0.3, sy = y + (y - 500) * h * 0.3, r = R * s;
    // soft shadow gathering beneath it
    const shx = x + LX * h * 150, shy = y + LY * h * 150, shr = R * (1 + h * 0.3);
    for (let k = 0; k < 4; k++) K.fill(ctx, circ(shx, shy, shr * (1 + k * 0.09)), '#15130F', 0.13 * alpha * (1 - 0.3 * Math.min(h, 2)) / (1 + k * 0.7), 0);
    K.fade(alpha, () => {
      const base = circ(sx, sy, r), gap = Math.max(2.8, r / 60);
      const bb = { x0: Math.max(-40, sx - r), y0: Math.max(-40, sy - r), x1: Math.min(1040, sx + r), y1: Math.min(1040, sy + r) };
      K.seed(seed);
      K.fill(ctx, base, V.iron, 1, 0.8);
      K.hatch(ctx, base, { angle: -0.6, gap, step: gap * 2.6, amp: 0.4, color: '#0C0A08', width: Math.max(0.9, gap / 3.2), bbox: bb, density: (px, py) => K.clamp(((px - sx) * LX + (py - sy) * LY) / r + 0.35) });
      // fluted rim
      ctx.beginPath();
      const nf = r > 200 ? 120 : 64;
      for (let k = 0; k < nf; k++) {
        const a = (k / nf) * TAU, c = Math.cos(a), sn = Math.sin(a);
        ctx.moveTo(sx + c * r * 0.9, sy + sn * r * 0.9);
        ctx.lineTo(sx + c * r * 0.985, sy + sn * r * 0.985);
      }
      K.stroke(ctx, V.ironLight, Math.max(0.9, r / 70), 0.55);
      K.ink(ctx, circ(sx, sy, r * 0.89), V.ironLight, Math.max(1, r / 90), 0.4, false, 0.7);
      K.ink(ctx, circ(sx, sy, r * 0.8), '#0C0A08', Math.max(1, r / 90), 0.4, false, 0.9);
      // engraved lozenges around the shoulder
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * TAU, rr = r * 0.66, px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
        const ux = Math.cos(a), uy = Math.sin(a), q = r * 0.06, l = r * 0.1;
        ctx.moveTo(px + ux * l, py + uy * l); ctx.lineTo(px - uy * q, py + ux * q); ctx.lineTo(px - ux * l, py - uy * l); ctx.lineTo(px + uy * q, py - ux * q); ctx.closePath();
      }
      K.stroke(ctx, V.ironLight, Math.max(0.8, r / 110), 0.6);
      // neck and knob, lifted toward the eye
      const nx = sx + (sx - 500) * 0.04 * s, ny = sy + (sy - 500) * 0.04 * s;
      const neck = circ(nx, ny, r * 0.44);
      K.fill(ctx, K.xf(neck, LX * r * 0.08, LY * r * 0.08), '#0C0A08', 0.5, 0);
      K.fill(ctx, neck, V.ironMid, 1, 0.5);
      K.hatch(ctx, neck, { angle: 0.9, gap: gap * 0.9, step: gap * 2.4, amp: 0.3, color: '#0C0A08', width: Math.max(0.8, gap / 3.5), density: K.sphereTone(nx, ny, r * 0.44, -LX, -LY, 0.1) });
      K.ink(ctx, neck, '#0C0A08', Math.max(1.1, r / 60), 0.4, true);
      const kx = nx + (nx - 500) * 0.03 * s, ky = ny + (ny - 500) * 0.03 * s, kr = r * 0.26;
      const knob = circ(kx, ky, kr);
      K.fill(ctx, knob, V.ironMid, 1, 0.4);
      K.crosshatch(ctx, knob, { angle: 0.7, gap: gap * 0.8, step: gap * 2, amp: 0.3, color: '#0C0A08', width: Math.max(0.8, gap / 3.5), density: K.sphereTone(kx, ky, kr, -LX, -LY, 0.05) });
      K.ink(ctx, knob, '#0C0A08', Math.max(1.1, r / 60), 0.3, true);
      K.ink(ctx, K.arc(kx, ky, kr * 0.62, kr * 0.62, 3.5, 4.5), '#EFE6D2', Math.max(1.2, r / 45), 0.3, false, 0.75);
      K.ink(ctx, K.arc(sx, sy, r * 0.95, r * 0.95, 3.4, 4.7), '#EFE6D2', Math.max(1, r / 80), 0.4, false, 0.5);
      K.ink(ctx, base, '#0C0A08', Math.max(1.4, r / 55), 0.5, true);
    });
  }

  /** Where the seal is at time t (or null). */
  function sealState(t) {
    for (let i = 0; i < PRESS.length; i++) {
      const P = PRESS[i];
      if (t >= P - 1.1 && t < P) {
        const u = K.range(t, P - 1.1, P), f = individual(t);
        return { x: f.x, y: f.y, h: 1.75 * (1 - K.easeIn(u)), a: K.sr(u, 0, 0.3), i };
      }
      if (t >= P && t < P + 0.95) {
        const f = individual(P), u = K.range(t, P + 0.1, P + 0.72);
        return { x: f.x, y: f.y, h: 1.9 * u * u, a: 1 - K.sr(u, 0.45, 1), i };
      }
    }
    return null;
  }
  /** Floor point stamped at time P, carried round by the middle band since. */
  function carried(P, t) {
    const f = individual(P), d = TRACKS[1].spin * (t - P), c = Math.cos(d), s = Math.sin(d);
    const dx = f.x - OX, dy = f.y - OY;
    return [OX + dx * c - dy * s, OY + dx * s + dy * c];
  }

  /** Ink squeezed out from under a seal's rim at the moment it lands. */
  function inkBurst(ctx, x, y, R, a, seed) {
    if (a < 0) return;
    const g = K.stable(seed), grow = K.easeOut(a / 0.16), fade = 1 - 0.55 * K.sr(a, 0.3, 1.2);
    ctx.beginPath();
    for (let j = 0; j < 22; j++) {
      const ang = (j / 22) * TAU + g() * 0.25, L = R * (0.25 + g() * 0.55) * grow, w = 1.2 + g() * 2.6;
      const c = Math.cos(ang), s = Math.sin(ang), r0 = R * 1.02;
      ctx.moveTo(x + c * r0 - s * w, y + s * r0 + c * w);
      ctx.lineTo(x + c * (r0 + L), y + s * (r0 + L));
      ctx.lineTo(x + c * r0 + s * w, y + s * r0 - c * w);
      ctx.closePath();
      const d = r0 + L + 3 + g() * 8, dr = 0.8 + g() * 2.2;
      ctx.moveTo(x + c * d + dr, y + s * d);
      ctx.arc(x + c * d, y + s * d, dr, 0, TAU);
    }
    ctx.globalAlpha = 0.7 * fade * K.A; ctx.fillStyle = '#34312C'; ctx.fill(); ctx.globalAlpha = 1;
  }

  function stampMarks(ctx, t) {
    for (let i = 0; i < PRESS.length; i++) {
      const P = PRESS[i];
      if (t < P) break;
      const [x, y] = carried(P, t), a = t - P;
      // the seal's imprint in grey ink, left on the band
      K.seed(900 + i);
      const im = 0.5 * K.sr(a, 0, 0.05);
      K.ink(ctx, circ(x, y, 62), '#4A4640', 2.2, 0.6, false, im);
      K.ink(ctx, circ(x, y, 50), '#4A4640', 1, 0.6, false, im * 0.8);
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const ang = (k / 16) * TAU, px = x + Math.cos(ang) * 41, py = y + Math.sin(ang) * 41, ux = Math.cos(ang), uy = Math.sin(ang);
        ctx.moveTo(px + ux * 6, py + uy * 6); ctx.lineTo(px - uy * 3.6, py + ux * 3.6); ctx.lineTo(px - ux * 6, py - uy * 6); ctx.lineTo(px + uy * 3.6, py - ux * 3.6); ctx.closePath();
      }
      K.stroke(ctx, '#4A4640', 0.9, im * 0.8);
      // splatter
      const g = K.stable(70 + i * 13);
      ctx.beginPath();
      for (let j = 0; j < 34; j++) {
        const ang = g() * TAU, D = 58 + g() * 70, sz = 0.8 + g() * g() * 4.5;
        const d = D * K.easeOut(a / 0.18);
        const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d;
        ctx.moveTo(px + sz, py);
        ctx.arc(px, py, sz, 0, TAU);
        if (sz > 2.4) { ctx.moveTo(px, py); ctx.arc(px - Math.cos(ang) * sz * 1.8, py - Math.sin(ang) * sz * 1.8, sz * 0.55, 0, TAU); }
      }
      ctx.globalAlpha = 0.6 * K.A * K.sr(a, 0, 0.04); ctx.fillStyle = '#3B3833'; ctx.fill(); ctx.globalAlpha = 1;
      inkBurst(ctx, x, y, 64, a, 40 + i);
      // shockwave
      if (a < 0.75) {
        for (let k = 0; k < 3; k++) {
          const rr = 70 + (a - k * 0.06) * 460;
          if (rr > 70) K.ink(ctx, circ(x, y, rr), '#2E2B27', 2.6 - k * 0.7, 1.4, false, 0.7 * (1 - a / 0.75));
        }
      }
    }
  }

  function ritualDraw(ctx, t, dur) {
    K.paper(ctx, V.tint, 0.34);
    const [jx, jy] = jolt(t, [...PRESS.map((P) => [P, 9]), [FINAL, 20]], 1, 7);
    const z = 1 + 0.07 * K.sr(t, 0.8, 9.6);
    ctx.save();
    ctx.translate(OX + jx, OY + jy); ctx.scale(z, z); ctx.translate(-OX, -OY);
    ctx.drawImage(baseC, 0, 0, 1000, 1000);
    // radial construction lines running out across the floor
    K.seed(11);
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + 0.26;
      K.trace(ctx, K.seg(OX + Math.cos(a) * 344, OY + Math.sin(a) * 344, OX + Math.cos(a) * 820, OY + Math.sin(a) * 820, 14), 0.6);
    }
    K.stroke(ctx, '#23221F', 0.8, 0.3);
    ctx.restore();
    // the dial: minute graduations, lozenges where numerals would be
    K.seed(12);
    ctx.beginPath();
    for (let k = 0; k < 60; k++) {
      if (k % 5 === 0) continue;
      const a = (k / 60) * TAU, c = Math.cos(a), s = Math.sin(a);
      K.trace(ctx, K.seg(OX + c * 311, OY + s * 311, OX + c * 325, OY + s * 325, 8), 0.3);
    }
    K.stroke(ctx, '#1E1B17', 1.1, 0.85);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU, ux = Math.cos(a), uy = Math.sin(a), m = 314;
      const L = k % 3 ? 11 : 15, q = k % 3 ? 3.6 : 5.2;
      const lz = [[OX + ux * (m - L), OY + uy * (m - L)], [OX + ux * m - uy * q, OY + uy * m + ux * q], [OX + ux * (m + L), OY + uy * (m + L)], [OX + ux * m + uy * q, OY + uy * m - ux * q]];
      K.fill(ctx, lz, V.iron, 1, 0.5);
      K.ink(ctx, closed(lz), '#0E0C0A', 0.9, 0.2, false);
    }
    K.ink(ctx, circ(OX, OY, FACE_R), '#1B1915', 2.6, 0.7, false);
    K.ink(ctx, circ(OX, OY, 326), '#1B1915', 0.8, 0.5, false, 0.8);
    K.ink(ctx, circ(OX, OY, FACE_IN), '#1B1915', 1.5, 0.6, false);
    K.ink(ctx, circ(OX, OY, 303), '#1B1915', 0.6, 0.5, false, 0.7);

    // the rings turn, one against the next
    TRACKS.forEach((tr, i) => {
      K.seed(20 + i);
      K.fill(ctx, annulus(OX + LX * 5, OY + LY * 5, tr.r0, tr.r1), '#15130F', 0.3, 0);
      const b = bands[i];
      ctx.save();
      ctx.translate(OX, OY);
      ctx.rotate(tr.spin * t);
      ctx.drawImage(b.c, -b.S / 2, -b.S / 2, b.S, b.S);
      ctx.restore();
      K.ink(ctx, circ(OX, OY, tr.r1), '#1B1915', 1.5, 0.6, false);
      K.ink(ctx, circ(OX, OY, tr.r0), '#1B1915', 1.3, 0.6, false);
      K.ink(ctx, circ(OX, OY, tr.r1 + 3.5), '#1B1915', 0.6, 0.5, false, 0.6);
      K.ink(ctx, K.arc(OX, OY, tr.r0 + 1.5, tr.r0 + 1.5, 0, Math.PI * 0.5), '#FFF9EA', 1.2, 0.3, false, 0.6);
    });

    // the works at the centre
    const gr = 0.45 * t;
    brassGear(ctx, OX, OY, 66, 22, gr, 31);
    for (let k = 0; k < 3; k++) {
      const a = 0.3 + (k * TAU) / 3, d = 100;
      brassGear(ctx, OX + Math.cos(a) * d, OY + Math.sin(a) * d, 28, 9, -gr * (66 / 28) + a * (1 + 66 / 28) + 0.18, 32 + k);
    }

    // imprints under the crowd
    stampMarks(ctx, t);

    // the crowd, in lockstep
    const figs = [];
    TRACKS.forEach((tr, ti) => {
      for (let k = 0; k < tr.n; k++) {
        if (ti === 1 && k === 0) continue;
        const p = trackPos(ti, k, t);
        p.ph = t * TAU * 1.5;
        figs.push(p);
      }
    });
    K.seed(40);
    walkers(ctx, figs, V.body, V.head);
    // the individual, and the wandering path only it walks
    const w = warmth(t), me = individual(t);
    if (w > 0.02) {
      const trail = [];
      for (let k = 1; k <= 36; k++) trail.push(individual(t - k * 0.07));
      K.seed(42);
      K.ink(ctx, trail.map((p) => [p.x, p.y]), C.ember, 2.2, 0.8, false, 0.7 * w);
      ctx.beginPath();
      trail.forEach((p, k) => { if (k % 3) return; const r = 3.9 * (1 - k / 42); ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, TAU); });
      ctx.globalAlpha = 0.92 * w * K.A; ctx.fillStyle = C.ember; ctx.fill(); ctx.globalAlpha = 1;
    }
    // it stands out while it still can: larger, haloed, lit from within — all of it drains with the presses
    const meZ = 1 + 0.3 * w;
    K.glow(ctx, me.x, me.y, 150, C.soul, 0.28 * w, 'source-over');
    K.glow(ctx, me.x, me.y, 96, C.soul, 0.5 * w, 'source-over');
    K.glow(ctx, me.x, me.y, 52, '#FFD27A', 0.45 * w, 'screen');
    K.seed(41);
    walkers(ctx, [me], K.mix(V.body, V.warm, w), K.mix(V.head, V.warmHead, w), 1 - w, meZ);
    if (w > 0.02) {
      K.ink(ctx, circ(me.x, me.y, 24 + 2.5 * Math.sin(t * 3)), C.soul, 1.6, 0.8, false, 0.75 * w);
      // the soul's point of light at the chest, the film's recurring anchor
      const cx = me.x - me.ux * 1.5, cy = me.y - me.uy * 1.5, beat = 0.85 + 0.15 * Math.sin(t * 7.2);
      K.glow(ctx, cx, cy, 22 * beat, C.soul, 0.9 * w, 'screen');
      K.glow(ctx, cx, cy, 9, '#FFF3CF', 0.95 * w, 'screen');
      ctx.beginPath();
      ctx.arc(cx, cy, 2.6 * beat, 0, TAU);
      ctx.globalAlpha = w * K.A; ctx.fillStyle = C.soulHot; ctx.fill(); ctx.globalAlpha = 1;
    }

    // hands sweeping far too fast
    hand(ctx, 188, 7.4, -Math.PI / 2 + 2.2 + t * 0.105, 51);
    hand(ctx, 262, 5.4, -Math.PI / 2 + 0.4 + t * 1.25, 52);
    const cap = circ(OX, OY, 17);
    K.seed(53);
    K.fill(ctx, cap, V.ironMid, 1, 0.4);
    K.crosshatch(ctx, cap, { angle: 0.7, gap: 2.4, step: 5, amp: 0.2, color: '#0C0A08', width: 0.8, density: K.sphereTone(OX, OY, 17, -LX, -LY, 0.05) });
    K.ink(ctx, cap, '#0C0A08', 1.2, 0.2, true);
    K.ink(ctx, K.arc(OX, OY, 10, 10, 3.5, 4.6), '#EFE6D2', 1.4, 0.2, false, 0.8);

    // the seal
    const st = sealState(t);
    if (st) seal(ctx, st.x, st.y, 64, st.h, st.a, 60 + st.i);
    // the last stamp comes down on the whole ritual
    if (t > 8.7) {
      const u = K.range(t, 8.7, FINAL), h = 2.1 * (1 - K.easeIn(u));
      seal(ctx, OX, OY, 338, h, K.sr(t, 8.7, 9.25), 70);
      inkBurst(ctx, OX, OY, 338, t - FINAL, 77);
    }
    ctx.restore();
    lightShafts(ctx, t);
  }
  /** Diagonal bars of window light across the whole floor, with dust drifting through them. */
  function lightShafts(ctx, t) {
    const nx = LY, ny = -LX; // across the shafts
    const g = ctx.createLinearGradient(500 - nx * 700, 500 - ny * 700, 500 + nx * 700, 500 + ny * 700);
    const bands = [[0.14, 0.2], [0.3, 0.42], [0.55, 0.6], [0.72, 0.84]];
    g.addColorStop(0, 'rgba(255,250,235,0)');
    for (const [a, b] of bands) {
      g.addColorStop(a - 0.02, 'rgba(255,250,235,0)');
      g.addColorStop(a + 0.01, 'rgba(255,250,235,0.16)');
      g.addColorStop(b - 0.01, 'rgba(255,250,235,0.16)');
      g.addColorStop(b + 0.02, 'rgba(255,250,235,0)');
    }
    g.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1000, 1000);
    ctx.restore();
    const r = K.stable(97);
    ctx.save();
    ctx.fillStyle = '#FFFDF4';
    for (let k = 0; k < 90; k++) {
      const b = bands[k % 4], u = K.lerp(b[0], b[1], r()), along = K.frac(r() + t * (0.012 + r() * 0.01));
      const cx = 500 + nx * (u - 0.5) * 1400 + LX * (along - 0.5) * 1500 + Math.sin(t * 0.7 + k) * 6;
      const cy = 500 + ny * (u - 0.5) * 1400 + LY * (along - 0.5) * 1500 + Math.cos(t * 0.5 + k) * 6;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2 + k);
      ctx.fillRect(cx, cy, 1.6, 1.6);
    }
    ctx.restore();
  }

  // =================================================================== PLATE VI · the bargain
  const PIV = [470, 252], BEAM = 250, CHAIN = 236, HORIZON = 612;
  const CYC = [0, 3.3, 6.6], CUTS = [3.3, 6.6];
  const COINS = [12, 16, 34], GAPS = [0.11, 0.085, 0.052], POUR0 = 0.35, FALL = 0.62;
  const FLAME0 = [1, 0.78, 0.56], FLAME1 = [0.84, 0.62, 0.24];
  const TIP = [0.2, 0.27, 0.4];
  const B = {
    brass: '#A37B34', brassDark: '#5B4016', brassLight: '#E3C47A', ink: '#24160A',
    coin: '#D6A949', coinDark: '#8E6522', coinLight: '#F6DC92', glass: '#CFE6E8',
  };
  const TOWERS = [
    { x: 602, w: 66, h: 290, tiers: 2, seed: 1 },
    { x: 688, w: 82, h: 430, tiers: 3, spire: true, seed: 2 },
    { x: 786, w: 96, h: 520, tiers: 3, spire: true, seed: 3 },
    { x: 880, w: 76, h: 370, tiers: 2, seed: 4 },
    { x: 958, w: 64, h: 300, tiers: 2, seed: 5 },
  ];
  let setC = null, pillarC = [], towerC = [];

  const cycleOf = (t) => (t < CYC[1] ? 0 : t < CYC[2] ? 1 : 2);
  const landT = (c, k) => POUR0 + k * GAPS[c] + FALL;
  /** Share of this cycle's coins that have landed, smoothed. */
  const landed = (c, u) => K.smooth(K.range(u, POUR0 + FALL, landT(c, COINS[c] - 1)));
  function theta(t) {
    const c = cycleOf(t), u = t - CYC[c], p = landed(c, u);
    let th = TIP[c] * K.easeInOut(p) + 0.018 * Math.sin(u * 4.3) * (1 - p) * K.sr(u, 0.3, 1);
    if (c === 2) {
      const f = K.range(t, 9.9, 10.6);
      th += 0.17 * (K.easeOut(f) + 0.12 * Math.sin(f * 9) * (1 - f) * (f > 0 ? 1 : 0));
    }
    return th;
  }
  const beamEnd = (th, side) => [PIV[0] + side * BEAM * Math.cos(th), PIV[1] + side * BEAM * Math.sin(th)];
  const panAt = (th, side) => { const [x, y] = beamEnd(th, side); return [x, y + CHAIN]; };

  function buildSet() {
    const [c, x] = K.makeCanvas(1000, 1000);
    // a rich dark sky, maroon to smouldering gold at the horizon
    const g = x.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#2A0B13'); g.addColorStop(0.5, '#521A22'); g.addColorStop(0.82, '#7E3424'); g.addColorStop(1, '#B06A2E');
    x.fillStyle = g; x.fillRect(0, 0, 1000, HORIZON);
    // glory rays from behind the towers
    x.save();
    x.globalCompositeOperation = 'screen';
    for (let k = 0; k < 22; k++) {
      const a = Math.PI + 0.08 + (k / 22) * (Math.PI - 0.16), w = 0.035 + (k % 3) * 0.02;
      x.beginPath();
      x.moveTo(800, HORIZON);
      x.lineTo(800 + Math.cos(a - w) * 1400, HORIZON + Math.sin(a - w) * 1400);
      x.lineTo(800 + Math.cos(a + w) * 1400, HORIZON + Math.sin(a + w) * 1400);
      x.closePath();
      x.fillStyle = `rgba(226,170,80,${k % 2 ? 0.05 : 0.09})`;
      x.fill();
    }
    x.restore();
    K.ruledSky(x, { gap: 4.5, y1: HORIZON, color: '#E6B862', alpha: 0.16, width: 0.7, density: (px, py) => 0.3 + 0.7 * Math.pow(1 - py / HORIZON, 1.2), seed: 5 });
    K.still(3);
    K.stipple(x, null, { count: 1400, bbox: { x0: 0, y0: 0, x1: 1000, y1: HORIZON }, color: '#F3D48C', alpha: 0.3, r0: 0.35, r1: 1.1, density: (px, py) => 0.3 + 0.7 * (py / HORIZON) });
    // the floor: warm paper, ruled in perspective toward the scale
    x.save();
    x.beginPath(); x.rect(0, HORIZON, 1000, 1000 - HORIZON); x.clip();
    x.drawImage(K.tex.paper, 0, 0, 1000, 1000);
    const VP = [470, HORIZON - 6];
    x.beginPath();
    for (let k = -18; k <= 18; k++) {
      const bx = VP[0] + k * 150;
      K.trace(x, K.seg(VP[0] + (bx - VP[0]) * 0.02, HORIZON + 2, bx, 1000, 16), 0.5);
    }
    for (let k = 0; k < 12; k++) {
      const y = HORIZON + 5 * Math.pow(1.42, k);
      if (y > 1000) break;
      K.trace(x, K.seg(-10, y, 1010, y, 18), 0.6);
    }
    K.stroke(x, '#5B4430', 0.8, 0.35);
    K.hatch(x, quad(-10, HORIZON, 1010, 1000), { angle: 0, gap: 2.8, step: 14, amp: 0.5, color: '#3E2A18', width: 0.75, alpha: 0.75, density: (px, py) => K.clamp(0.95 - (py - HORIZON) / 230) });
    // the gold light, caught on the polished floor
    x.save();
    x.globalCompositeOperation = 'screen';
    const rg = x.createRadialGradient(800, HORIZON + 10, 10, 800, HORIZON + 10, 420);
    rg.addColorStop(0, 'rgba(240,180,90,0.35)'); rg.addColorStop(1, 'rgba(240,180,90,0)');
    x.fillStyle = rg; x.fillRect(0, HORIZON, 1000, 1000 - HORIZON);
    x.restore();
    x.restore();
    // horizon line and a band of shadow beneath the far edge
    K.ink(x, K.seg(-10, HORIZON, 1010, HORIZON, 16), '#2A150B', 1.6, 0.6);
    K.ink(x, K.seg(-10, HORIZON + 3, 1010, HORIZON + 3, 16), '#2A150B', 0.7, 0.6, false, 0.6);
    setC = c;
  }

  function buildTower(T) {
    const SW = T.w + 30, SH = T.h + (T.spire ? 120 : 30);
    const [c, x] = K.makeCanvas(SW, SH);
    const g = K.stable(T.seed * 17);
    K.still(T.seed);
    const cx = SW / 2, fr = T.tiers === 3 ? [0.55, 0.28, 0.17] : [0.7, 0.3];
    let y = SH, w = T.w;
    for (let i = 0; i < T.tiers; i++) {
      const th = T.h * fr[i], q = quad(cx - w / 2, y - th, cx + w / 2, y);
      K.fill(x, q, '#4A3113', 1, 0.5);
      K.hatch(x, q, { angle: Math.PI / 2, gap: 2.6, step: 9, amp: 0.3, color: '#D9A94E', width: 0.75, alpha: 0.8, density: (px) => K.clamp(0.85 - 0.75 * (px - (cx - w / 2)) / w) });
      // lit windows
      const cols = Math.max(2, Math.floor(w / 13)), rows = Math.floor(th / 15);
      x.beginPath();
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        if (g() < 0.42) continue;
        const wx = cx - w / 2 + (k + 0.5) * (w / cols) - 2, wy = y - th + 8 + r * 15;
        x.rect(wx, wy, 4, 6.5);
      }
      x.fillStyle = '#FFE39A'; x.globalAlpha = 0.85; x.fill(); x.globalAlpha = 1;
      // art-deco fins and ledge
      x.beginPath();
      for (const f of [-0.33, 0, 0.33]) K.trace(x, K.seg(cx + f * w, y - th + 4, cx + f * w, y - 4, 12), 0.3);
      K.stroke(x, '#1E1206', 0.8, 0.5);
      K.ink(x, closed(q), '#1E1206', 1.3, 0.4, false);
      K.ink(x, K.seg(cx - w / 2 - 4, y - th, cx + w / 2 + 4, y - th, 8), '#F2CF7E', 1.6, 0.3, false, 0.9);
      y -= th;
      w *= 0.72;
    }
    if (T.spire) {
      const sp = [[cx - w * 0.28, y], [cx, y - 100], [cx + w * 0.28, y]];
      K.fill(x, sp, '#6A4A1C', 1, 0.3);
      K.hatch(x, sp, { angle: Math.PI / 2, gap: 2, step: 6, color: '#E3B45A', width: 0.6, density: (px) => (px < cx ? 0.3 : 0.8) });
      K.ink(x, closed(sp), '#1E1206', 1.1, 0.3, false);
      x.beginPath(); x.arc(cx, y - 102, 3, 0, TAU); x.fillStyle = '#FFE39A'; x.fill();
    }
    return { c, SW, SH };
  }

  function buildPillar(v) {
    const X0 = 350, Y0 = 150, SWd = 240, SHd = 660;
    const [c, x] = K.makeCanvas(SWd, SHd);
    x.translate(-X0, -Y0);
    K.still(700 + v);
    const px = PIV[0];
    // plinth
    for (const [hw, y0, y1] of [[108, 776, 800], [90, 752, 776], [72, 730, 752]]) {
      const q = quad(px - hw, y0, px + hw, y1);
      K.fill(x, q, B.brass, 1, 0.8);
      K.hatch(x, q, { angle: Math.PI / 2, gap: 2.8, step: 6, amp: 0.3, color: B.brassDark, width: 0.9, density: (qx) => K.clamp(0.12 + 0.75 * (qx - (px - hw)) / (2 * hw)) });
      K.ink(x, K.seg(px - hw + 2, y0 + 1.6, px + hw - 2, y0 + 1.6, 10), B.brassLight, 1.3, 0.3, false, 0.9);
      K.ink(x, closed(q), B.ink, 1.3, 0.5, false);
    }
    // the shaft, fluted
    const shaft = [[px - 16, 730], [px - 13, 362], [px + 13, 362], [px + 16, 730]];
    K.fill(x, shaft, B.brass, 1, 0.6);
    K.hatch(x, shaft, { angle: Math.PI / 2, gap: 2.4, step: 8, amp: 0.3, color: B.brassDark, width: 0.8, density: (qx) => K.clamp(0.05 + 0.95 * (qx - (px - 16)) / 32) });
    x.beginPath();
    for (let k = -2; k <= 2; k++) K.trace(x, K.seg(px + k * 5.6, 724, px + k * 4.6, 368, 12), 0.3);
    K.stroke(x, B.ink, 0.8, 0.5);
    K.ink(x, K.seg(px - 9, 724, px - 7.5, 368, 12), B.brassLight, 1.2, 0.3, false, 0.8);
    K.ink(x, closed(shaft), B.ink, 1.4, 0.4, false);
    for (const [yy, hw] of [[722, 21], [368, 18]]) {
      const q = quad(px - hw, yy - 4, px + hw, yy + 4);
      K.fill(x, q, B.brassLight, 1, 0.4);
      K.ink(x, closed(q), B.ink, 1.1, 0.3, false);
    }
    // capital and volutes
    const ab = [[px - 40, 324], [px + 40, 324], [px + 30, 342], [px - 30, 342]];
    K.fill(x, ab, B.brass, 1, 0.5);
    K.hatch(x, ab, { angle: 0, gap: 2.4, step: 6, color: B.brassDark, width: 0.8, density: (qx, qy) => K.clamp((qy - 324) / 18) });
    K.ink(x, closed(ab), B.ink, 1.3, 0.3, false);
    for (const sd of [-1, 1]) {
      const sp = [];
      for (let k = 0; k < 44; k++) { const a = k * 0.3, rr = 12 * (1 - k / 50); sp.push([px + sd * 36 + sd * Math.cos(a) * rr, 346 + Math.sin(a) * rr]); }
      K.ink(x, sp, B.ink, 1.3, 0.2, false);
      K.ink(x, sp.slice(0, 10), B.brassLight, 1, 0.2, false, 0.8);
    }
    // post and knife-edge cradle
    const post = [[px - 6, 324], [px - 5, 266], [px + 5, 266], [px + 6, 324]];
    K.fill(x, post, B.brass, 1, 0.3);
    K.ink(x, closed(post), B.ink, 1.1, 0.3, false);
    const cr = [[px - 14, 270], [px + 14, 270], [px, 254]];
    K.fill(x, cr, B.brassLight, 1, 0.3);
    K.ink(x, closed(cr), B.ink, 1.1, 0.2, false);
    // finial above the pivot
    const fp = [[px - 3, 240], [px - 2.5, 214], [px + 2.5, 214], [px + 3, 240]];
    K.fill(x, fp, B.brass, 1, 0.2); K.ink(x, closed(fp), B.ink, 1, 0.2, false);
    const orb = circ(px, 204, 11);
    K.fill(x, orb, B.brass, 1, 0.3);
    K.hatch(x, orb, { angle: 0.8, gap: 2, step: 4, color: B.brassDark, width: 0.7, density: K.sphereTone(px, 204, 11, -LX, -LY, 0.05) });
    K.ink(x, orb, B.ink, 1.1, 0.2, true);
    K.ink(x, K.seg(px, 193, px, 164, 6), B.ink, 1.4, 0.2, false);
    K.ink(x, K.arc(px - 3, 201, 5, 5, 3.4, 4.6), '#FFF3CC', 1.2, 0.1, false, 0.9);
    // the dial the pointer reads
    const [dx, dy] = PIV;
    for (const r of [58, 64]) K.ink(x, K.arc(dx, dy, r, r, Math.PI / 2 - 0.66, Math.PI / 2 + 0.66), B.ink, r === 58 ? 1.2 : 0.8, 0.3, false);
    x.beginPath();
    for (let k = -12; k <= 12; k++) {
      const a = Math.PI / 2 + k * 0.05, L = k % 4 ? 4 : 7;
      x.moveTo(dx + Math.cos(a) * 58, dy + Math.sin(a) * 58);
      x.lineTo(dx + Math.cos(a) * (58 - L), dy + Math.sin(a) * (58 - L));
    }
    K.stroke(x, B.ink, 0.9, 0.9);
    return { c, X0, Y0, SW: SWd, SH: SHd };
  }

  function chain(ctx, x0, y0, x1, y1, alpha) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(L / 7.5)), ang = Math.atan2(y1 - y0, x1 - x0);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
      if (k % 2) { ctx.moveTo(x + ca * 4.4, y + sa * 4.4); ctx.ellipse(x, y, 4.4, 2.1, ang, 0, TAU); }
      else { ctx.moveTo(x - ca * 4.2, y - sa * 4.2); ctx.lineTo(x + ca * 4.2, y + sa * 4.2); }
    }
    K.stroke(ctx, B.brassLight, 2.3, 0.8 * alpha);
    K.stroke(ctx, B.ink, 0.9, alpha);
  }

  function panParts(cx, cy) {
    const rx = 88, ry = 16;
    return {
      rim: K.arc(cx, cy, rx, ry, 0, TAU, 0, 6),
      front: K.arc(cx, cy, rx, ry, Math.PI, 0, 0, 6),
      body: [...K.bez([cx + rx, cy], [cx + rx * 0.72, cy + 42], [cx - rx * 0.72, cy + 42], [cx - rx, cy], 18), ...K.arc(cx, cy, rx, ry, Math.PI, 0, 0, 6)],
    };
  }
  function panBack(ctx, cx, cy, seed) {
    const P = panParts(cx, cy);
    K.seed(seed);
    K.fill(ctx, P.rim, '#6A4C1E', 1, 0.5);
    K.hatch(ctx, P.rim, { angle: 0, gap: 2.4, step: 8, amp: 0.3, color: '#3A2710', width: 0.8, density: (px, py) => K.clamp(0.7 - (py - cy + 16) / 40) });
    K.ink(ctx, K.arc(cx, cy, 86, 14.5, Math.PI, TAU, 0, 6), B.brassLight, 1.1, 0.3, false, 0.8);
  }
  function panFront(ctx, cx, cy, seed) {
    const P = panParts(cx, cy);
    K.seed(seed);
    K.fill(ctx, P.body, B.brass, 1, 0.6);
    K.hatch(ctx, P.body, { angle: 0.25, gap: 2.4, step: 7, amp: 0.4, color: B.brassDark, width: 0.85, density: (px, py) => K.clamp(0.15 + (px - cx) / 170 + (py - cy) / 70) });
    K.ink(ctx, K.arc(cx, cy + 9, 80, 16, Math.PI - 0.1, 0.1, 0, 6), B.ink, 0.8, 0.3, false, 0.6);
    ctx.beginPath();
    for (let k = 0; k < 11; k++) { const a = Math.PI - 0.25 - (k / 10) * (Math.PI - 0.5), qx = cx + Math.cos(a) * 80, qy = cy + 9 + Math.sin(a) * 16; ctx.moveTo(qx + 1.5, qy); ctx.arc(qx, qy, 1.5, 0, TAU); }
    ctx.globalAlpha = 0.8 * K.A; ctx.fillStyle = B.brassLight; ctx.fill(); ctx.globalAlpha = 1;
    K.ink(ctx, K.bez([cx - 80, cy + 6], [cx - 66, cy + 30], [cx - 40, cy + 36], [cx - 14, cy + 38], 10), '#FFF0C0', 1.4, 0.3, false, 0.75);
    K.ink(ctx, P.front, B.brassLight, 3, 0.3, false, 0.9);
    K.ink(ctx, closed(P.body), B.ink, 1.4, 0.4, false);
    K.ink(ctx, P.front, B.ink, 1, 0.3, false, 0.8);
  }

  /** A coin seen face-on or tumbling: spin turns it about a horizontal axis. */
  function coin(ctx, x, y, r, spin, tilt, seed, flat = false) {
    const k = Math.cos(spin), ry = r * Math.max(0.1, Math.abs(k));
    K.seed(seed);
    const face = K.arc(x, y, r, ry, 0, TAU, tilt, 3);
    if (Math.abs(k) < 0.35) {
      // nearly edge-on: show the milled rim
      const e = K.arc(x, y + 3, r, ry, 0, Math.PI, tilt, 3);
      K.fill(ctx, [...e, ...K.arc(x, y, r, ry, Math.PI, 0, tilt, 3)], B.coinDark, 1, 0.3);
    }
    K.fill(ctx, face, B.coin, 1, 0.4);
    if (!flat) K.hatch(ctx, face, { angle: 0.8 + tilt, gap: 2.2, step: 5, amp: 0.2, color: B.coinDark, width: 0.7, density: (px, py) => K.clamp(((px - x) * LX + (py - y) * LY) / r + 0.3) });
    if (Math.abs(k) > 0.3) {
      K.ink(ctx, K.arc(x, y, r * 0.72, ry * 0.72, 0, TAU, tilt, 3), B.ink, 0.8, 0.2, true, 0.7);
      // an engraved star in place of a face or a word
      const pts = [];
      for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU - Math.PI / 2, rr = j % 2 ? r * 0.18 : r * 0.42; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (ry / r)]); }
      K.ink(ctx, closed(pts), B.ink, 0.8, 0.2, false, 0.6);
    }
    K.ink(ctx, face, B.ink, 1.1, 0.3, true);
    K.ink(ctx, K.arc(x, y, r * 0.86, ry * 0.86, 3.4, 4.6, tilt, 3), B.coinLight, 1.2, 0.2, false, 0.9);
  }
  /** A pile of coins lying flat, seen edge-on: milled bands with a face on top. */
  function pile(ctx, x, yb, n, seed) {
    if (n <= 0) return;
    const rx = 21, ry = 5.6, th = 5.2, g = K.stable(seed);
    const offs = [];
    for (let i = 0; i < n; i++) offs.push((g() - 0.5) * 3.6);
    K.seed(seed);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = x + offs[i], y = yb - i * th;
      const lo = K.arc(cx, y, rx, ry, 0, Math.PI, 0, 4), hi = K.arc(cx, y - th, rx, ry, Math.PI, 0, 0, 4);
      K.path(ctx, [...lo, ...hi], true);
    }
    ctx.globalAlpha = K.A; ctx.fillStyle = B.coinDark; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = x + offs[i], y = yb - i * th;
      for (let k = -8; k <= 8; k++) { const qx = cx + k * 2.5; ctx.moveTo(qx, y - th + ry * Math.sqrt(1 - (k / 8.5) ** 2) - 0.5); ctx.lineTo(qx, y + ry * Math.sqrt(1 - (k / 8.5) ** 2) - 0.5); }
    }
    K.stroke(ctx, B.ink, 0.5, 0.45);
    ctx.beginPath();
    for (let i = 0; i < n; i++) K.trace(ctx, K.arc(x + offs[i], yb - i * th, rx, ry, 0, Math.PI, 0, 4), 0.2);
    K.stroke(ctx, B.ink, 0.9, 0.85);
    ctx.beginPath();
    for (let i = 0; i < n; i++) K.trace(ctx, K.seg(x + offs[i] - rx * 0.7, yb - i * th - 1.6, x + offs[i] - rx * 0.2, yb - i * th - 1.2, 4), 0.1);
    K.stroke(ctx, B.coinLight, 1, 0.8);
    const top = n - 1;
    coin(ctx, x + offs[top], yb - top * th - th, rx, 0.25 * Math.PI * 0 + 1.3, 0, seed + 3);
  }

  function tallies(ctx, t) {
    const gates = [];
    gates.push([2.75, 6.05, 9.0, 9.32, 9.6]);
    for (let g = 1; g < 18; g++) {
      const b = 9.9 + (g - 1) * 0.19;
      gates.push([b, b + 0.03, b + 0.06, b + 0.09, b + 0.13]);
    }
    K.seed(80);
    const ink = (pts, p, a) => {
      if (p <= 0) return;
      const sub = K.part(pts, p);
      K.ink(ctx, K.xf(sub, 1.6, 1.8), '#12050A', 3.6, 0.7, false, 0.6 * a);
      K.ink(ctx, sub, '#F4D98E', 3.1, 0.7, false, 0.95 * a);
    };
    gates.forEach((times, g) => {
      const gx = 52 + (g % 9) * 100, gy = 42 + Math.floor(g / 9) * 96;
      const jit = K.stable(g + 3);
      times.forEach((T0, m) => {
        const dur = g ? 0.05 : 0.22, p = K.range(t, T0, T0 + dur);
        if (p <= 0) return;
        if (m < 4) {
          const x0 = gx + m * 17 + (jit() - 0.5) * 3, top = gy + (jit() - 0.5) * 5;
          ink(K.seg(x0, top, x0 + 3 + (jit() - 0.5) * 3, top + 66 + (jit() - 0.5) * 6, 5), p, 1);
        } else {
          ink(K.seg(gx - 10, gy + 54, gx + 64, gy + 10, 6), p, 1);
        }
      });
    });
  }

  function bargainDraw(ctx, t, dur) {
    const c = cycleOf(t), u = t - CYC[c], prog = landed(c, u), th = theta(t);
    // jump cuts: the whole frame jolts and a splice crosses it
    let jy = 0, splice = 0;
    for (const T0 of CUTS) {
      const a = t - T0;
      if (a >= 0 && a < 0.14) { splice = 1 - a / 0.14; jy = (FILM.reduced ? 0 : -18) * splice; }
    }
    ctx.drawImage(setC, 0, 0, 1000, 1000);
    ctx.save();
    ctx.translate(0, jy);
    if (jy) ctx.drawImage(setC, 0, 0, 1000, 1000);
    // the towers of the rich: taller and leaning closer with every bargain
    const grow = 1 + 0.2 * c + 0.06 * prog, lean = -(0.03 + 0.055 * c + 0.03 * prog);
    K.glow(ctx, 800, HORIZON - 60, 420, '#F2B85A', 0.18 + 0.08 * c, 'screen');
    TOWERS.forEach((T, i) => {
      const S = towerC[i], f = 0.75 + 0.25 * K.hash(i * 7 + 1);
      ctx.save();
      ctx.translate(T.x, HORIZON + 2);
      ctx.rotate(lean * f);
      ctx.scale(1, grow * (0.95 + 0.1 * K.hash(i + 11)));
      ctx.drawImage(S.c, -S.SW / 2, -S.SH, S.SW, S.SH);
      ctx.restore();
    });
    tallies(ctx, t);
    // back-lit by the gold: every shadow reaches toward us
    const L = panAt(th, -1), Rr = panAt(th, 1);
    K.seed(81);
    TOWERS.forEach((T, i) => {
      const hw = T.w * 0.5, len = (T.h * grow) * 0.55;
      const sh = [[T.x - hw, HORIZON + 1], [T.x + hw, HORIZON + 1], [T.x + hw * 2.6 - len * 0.62, HORIZON + len], [T.x - hw * 2.6 - len * 0.62, HORIZON + len]];
      K.fill(ctx, sh, '#1E0F06', 0.16, 0);
      K.hatch(ctx, sh, { angle: -1.02, gap: 4.2, step: 12, amp: 0.4, color: '#1E0F06', width: 0.7, alpha: 0.35, density: (px, py) => K.clamp(1.1 - (py - HORIZON) / len) });
    });
    K.fill(ctx, [[PIV[0] - 20, 790], [PIV[0] + 20, 790], [PIV[0] - 70, 1000], [PIV[0] - 150, 1000]], '#2A1608', 0.2, 0);
    for (const [px] of [L, Rr]) K.fill(ctx, K.arc(px - 60, 880, 80, 11, 0, TAU, 0, 8), '#2A1608', 0.13, 0);
    // coins spilled by the bargains before this one
    const sp = K.stable(55);
    for (let k = 0; k < 8 * c; k++) {
      const fx = 590 + sp() * 330, fy = 700 + sp() * 150, rr = 13 + sp() * 4;
      K.fill(ctx, K.arc(fx - 10, fy + 5, rr * 1.1, rr * 0.3, 0, TAU, 0, 5), '#2A1608', 0.25, 0);
      K.fill(ctx, [...K.arc(fx, fy + 3, rr, rr * 0.3, 0, Math.PI, 0, 4), ...K.arc(fx, fy, rr, rr * 0.3, Math.PI, 0, 0, 4)], B.coinDark, 1, 0);
      coin(ctx, fx, fy, rr, 1.27, 0, 600 + k, true);
    }
    const pl = pillarC[K.boil % 3];
    ctx.drawImage(pl.c, pl.X0, pl.Y0, pl.SW, pl.SH);
    // the pointer, hanging from the beam, reads the dial
    const na = Math.PI / 2 + th;
    const nd = [Math.cos(na), Math.sin(na)], nn = [-nd[1], nd[0]];
    const needle = [[PIV[0] + nn[0] * 3, PIV[1] + nn[1] * 3], [PIV[0] + nd[0] * 62, PIV[1] + nd[1] * 62], [PIV[0] - nn[0] * 3, PIV[1] - nn[1] * 3]];
    K.seed(82);
    K.fill(ctx, needle, '#2A1A0A', 1, 0.3);
    K.ink(ctx, closed(needle), B.ink, 0.9, 0.2, false);

    // left pan: the soul's flame in a small glass bowl
    const fI = K.lerp(FLAME0[c], FLAME1[c], prog) * (1 - 0.5 * K.sr(t, 10.2, 11.4));
    const E = [beamEnd(th, -1), beamEnd(th, 1)];
    const ring = (e) => [e[0], e[1] + 13];
    const hang = (e) => [e[0], e[1] + 20];
    chain(ctx, hang(E[0])[0], hang(E[0])[1], L[0] + 6, L[1] - 15, 0.6);
    chain(ctx, hang(E[1])[0], hang(E[1])[1], Rr[0] + 6, Rr[1] - 15, 0.6);
    panBack(ctx, L[0], L[1], 83);
    {
      const bx = L[0], by = L[1] - 30, br = 34;
      const bowl = K.arc(bx, by, br, br, -Math.PI / 2 + 0.62, 1.5 * Math.PI - 0.62, 0, 4);
      K.fill(ctx, bowl, B.glass, 0.22, 0);
      K.glow(ctx, bx, by + 6, 70 * fI + 20, C.soul, 0.55 * fI, 'screen');
      K.flame(ctx, bx, by + 20, 58, t, fI, { mode: 'screen', seed: 6 });
      K.seed(84);
      K.ink(ctx, bowl, '#3E5A5E', 1.2, 0.3, false, 0.85);
      K.ink(ctx, K.arc(bx, by - br * Math.cos(0.62), br * Math.sin(0.62), 4.5, 0, TAU, 0, 3), '#3E5A5E', 1, 0.2, true, 0.8);
      K.ink(ctx, K.arc(bx, by, br - 5, br - 5, 3.3, 4.2), '#FFFFFF', 1.8, 0.2, false, 0.75);
      K.ink(ctx, K.arc(bx, by, br - 7, br - 7, 0.3, 0.9), '#FFFFFF', 1.1, 0.2, false, 0.5);
      K.ink(ctx, K.arc(bx, L[1] + 3, 14, 3.5, 0, TAU, 0, 3), '#3E5A5E', 1, 0.2, true, 0.8);
    }
    panFront(ctx, L[0], L[1], 85);
    // right pan: the gold
    panBack(ctx, Rr[0], Rr[1], 86);
    const n = COINS[c], gap = GAPS[c], done = [];
    for (let k = 0; k < n; k++) if (u >= landT(c, k)) done.push(k);
    const piles = [[], [], []];
    for (const k of done) piles[k % 3].push(k);
    const offX = [-32, 1, 33];
    piles.forEach((p, i) => pile(ctx, Rr[0] + offX[i], Rr[1] + 3 - (i === 1 ? 3 : 0), p.length, 300 + c * 10 + i));
    panFront(ctx, Rr[0], Rr[1], 87);
    chain(ctx, hang(E[0])[0], hang(E[0])[1], L[0] - 82, L[1], 1);
    chain(ctx, hang(E[0])[0], hang(E[0])[1], L[0] + 82, L[1], 1);
    chain(ctx, hang(E[1])[0], hang(E[1])[1], Rr[0] - 82, Rr[1], 1);
    chain(ctx, hang(E[1])[0], hang(E[1])[1], Rr[0] + 82, Rr[1], 1);
    for (const e of E) {
      const [rx, ry] = ring(e);
      K.seed(88);
      K.ink(ctx, circ(rx, ry, 7), B.ink, 2.4, 0.2, false);
      K.ink(ctx, circ(rx, ry, 7), B.brassLight, 1, 0.2, false, 0.9);
    }
    // the beam
    ctx.save();
    ctx.translate(PIV[0], PIV[1]);
    ctx.rotate(th);
    K.seed(89);
    const top = [], bot = [];
    for (let x = -BEAM; x <= BEAM; x += 20) {
      const f = 1 - Math.abs(x) / BEAM;
      top.push([x, -(3.8 + 5.2 * f) - 3 * f * f]);
      bot.push([x, 3.4 + 3.6 * f]);
    }
    const beam = [...top, ...bot.reverse()];
    K.fill(ctx, beam, B.brass, 1, 0.5);
    K.hatch(ctx, beam, { angle: 0, gap: 2, step: 8, amp: 0.2, color: B.brassDark, width: 0.8, density: (px, py) => K.clamp(0.1 + py / 9) });
    K.ink(ctx, top, B.brassLight, 1.2, 0.3, false, 0.9);
    K.ink(ctx, closed(beam), B.ink, 1.3, 0.3, false);
    for (const sd of [-1, 1]) {
      const sc = K.spline([[sd * 16, -8], [sd * 40, -24], [sd * 70, -20], [sd * 96, -10], [sd * 118, -8]], false, 6);
      K.ink(ctx, sc, B.ink, 1.6, 0.2, false);
      K.ink(ctx, sc, B.brassLight, 0.8, 0.2, false, 0.8);
      const sp = [];
      for (let k = 0; k < 24; k++) { const a = k * 0.36, rr = 7 * (1 - k / 28); sp.push([sd * 40 + Math.cos(a) * rr * sd, -24 - 6 + Math.sin(a) * rr]); }
      K.ink(ctx, sp, B.ink, 1.1, 0.1, false);
      const knob = circ(sd * BEAM, 0, 6.5);
      K.fill(ctx, knob, B.brassLight, 1, 0.2);
      K.ink(ctx, knob, B.ink, 1.1, 0.2, true);
    }
    const boss = circ(0, 0, 12.5);
    K.fill(ctx, boss, B.brass, 1, 0.3);
    K.hatch(ctx, boss, { angle: 0.8, gap: 1.9, step: 4, color: B.brassDark, width: 0.7, density: K.sphereTone(0, 0, 12.5, -0.6, -0.8, 0.1) });
    K.ink(ctx, boss, B.ink, 1.3, 0.2, true);
    K.ink(ctx, circ(0, 0, 3), B.ink, 1.2, 0.1, true);
    ctx.restore();

    // falling gold
    for (let k = 0; k < n; k++) {
      const s0 = POUR0 + k * gap, a = u - s0;
      if (a < 0 || a >= FALL) continue;
      const q = a / FALL, lt = CYC[c] + landT(c, k), pp = panAt(theta(lt), 1);
      const tx = pp[0] + offX[k % 3], ty = pp[1] - 4 - Math.floor(k / 3) * 5.2;
      const sx = tx + 46 + ((k * 37) % 5) * 7, sy = -40 - (k % 4) * 16;
      const x = K.lerp(sx, tx, q), y = K.lerp(sy, ty, q * q);
      coin(ctx, x, y, 19, a * 13 + k, 0.3 * Math.sin(k), 400 + k, k % 3 !== 0);
      if (k % 3 === 0) K.glow(ctx, x - 6, y - 5, 16, '#FFF4C8', 0.6, 'screen');
    }
    ctx.restore();

    if (splice > 0) {
      K.seed(90);
      K.ink(ctx, K.seg(-10, 402, 1010, 398, 20), '#140A06', 2.2, 1.2, false, 0.7 * splice);
      ctx.save();
      ctx.globalAlpha = 0.22 * splice;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.restore();
    }
    const dark = K.sr(t, 10.1, 11.6);
    if (dark > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 * dark;
      ctx.fillStyle = C.void;
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.restore();
    }
  }

  // =================================================================== registration
  const coinSfx = [];
  for (let c = 0; c < 3; c++) for (let k = 0; k < COINS[c]; k += c === 2 ? 3 : 2) coinSfx.push({ at: +(CYC[c] + landT(c, k)).toFixed(3), kind: 'coin' });

  FILM.scenes.ritual = {
    tone: 'paper',
    lines: [
      { text: "I've sinned all the rituals,", at: 0.9 },
      { text: 'And doomed my individual.', at: 4.2 },
    ],
    sfx: [
      ...[0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5].map((at) => ({ at, kind: 'tick' })),
      ...PRESS.map((at) => ({ at: at - 0.45, kind: 'whoosh' })),
      ...PRESS.map((at) => ({ at, kind: 'stamp' })),
      { at: 9.2, kind: 'whoosh' },
      { at: FINAL, kind: 'stamp' },
    ],
    mood: (t) => ({ drone: 0.5, warm: 0.14 * warmth(t), rumble: 0.1 + 0.3 * K.sr(t, 8.7, 9.9), rain: 0, wind: 0.05 }),
    init() {
      buildBase();
      bands = TRACKS.map(buildBand);
    },
    draw: ritualDraw,
  };

  FILM.scenes.bargain = {
    tone: 'paper',
    lines: [
      { text: 'And as I say again,', at: 0.6 },
      { text: 'To the rich of I bargain.', at: 3.9 },
    ],
    sfx: [
      ...coinSfx,
      ...CUTS.map((at) => ({ at, kind: 'snap' })),
      { at: 2.75, kind: 'hiss' }, { at: 6.05, kind: 'hiss' }, { at: 9.0, kind: 'hiss' }, { at: 9.32, kind: 'hiss' }, { at: 9.6, kind: 'hiss' },
      { at: 9.9, kind: 'whoosh' },
    ],
    mood: (t) => ({ drone: 0.35 + 0.25 * K.sr(t, 9, 11), warm: 0.45 * (1 - K.sr(t, 9, 11)), rumble: 0.3 * K.sr(t, 9.5, 11), rain: 0, wind: 0 }),
    init() {
      buildSet();
      pillarC = [0, 1, 2].map(buildPillar);
      towerC = TOWERS.map(buildTower);
    },
    draw: bargainDraw,
  };
})();
