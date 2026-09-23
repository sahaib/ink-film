// The poem's words in this file are © 2026 Sahaib Singh Arora, all rights reserved — see examples/to-my-mind/NOTICE in the ink-film repository. The code is MIT.
'use strict';
/* Plates I and IX — the orrery.
   Mind: a cold planet caged in armillary rings. Soul: a warm star. They orbit one another;
   the poem opens and closes on them, and the last frame is the first. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const CX = 500, CY = 430, TILT = -0.1, SPIN = 0.3;
  const SOUL = { rx: 300, ry: 112 }, MIND = { rx: 108, ry: 40 };
  const MIND_R = 78, SOUL_R = 30;
  let stars, far, nebula;

  function onEllipse(e, a) {
    const x = Math.cos(a) * e.rx, y = Math.sin(a) * e.ry, c = Math.cos(TILT), s = Math.sin(TILT);
    return [CX + x * c - y * s, CY + x * s + y * c, Math.sin(a)]; // third value: depth, +1 nearest
  }
  const soulAt = (th) => onEllipse(SOUL, th);
  const mindAt = (th) => onEllipse(MIND, th + Math.PI);
  const ellPt = (x, y, rx, ry, a, rot) => {
    const px = Math.cos(a) * rx, py = Math.sin(a) * ry, c = Math.cos(rot), s = Math.sin(rot);
    return [x + px * c - py * s, y + px * s + py * c];
  };
  // Where the loop joins: a single point of light.
  FILM.orrerySeam = soulAt(-Math.PI / 2);

  // ---------------------------------------------------------------- the nebula, engraved
  /** Stippled and ruled like an observatory drawing, not airbrushed. Rendered once. */
  function buildDust() {
    const S = 1400, px = Math.min(K.PX, 1.5);
    const [c, x] = K.makeCanvas(S, S, px);
    const band = (X, Y) => {
      const u = X / S, cy = S / 2 + Math.sin(u * 5.3 + 3) * S * 0.17;
      const w = S * (0.12 + 0.05 * K.n1(u * 6 + 2)), dy = (Y - cy) / w;
      let m = Math.exp(-dy * dy) * (0.55 + 0.6 * K.fbm(X * 0.004 + 3, Y * 0.004 + 9, 4));
      m *= 1 - K.clamp((K.fbm(X * 0.006 + 20, Y * 0.011 + 1, 3) - 0.08) * 3) * 0.85; // dark lanes
      return K.clamp(m);
    };
    // a breath of colour for depth, kept cold and low
    const g = K.stable(41);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const u = g(), bx = u * S, by = S / 2 + Math.sin(u * 5.3 + 3) * S * 0.17 + (g() - 0.5) * S * 0.16, br = 80 + g() * 200;
      const gr = x.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, g() > 0.75 ? 'rgba(92,60,110,0.07)' : 'rgba(44,62,112,0.08)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr;
      x.fillRect(bx - br, by - br, 2 * br, 2 * br);
    }
    x.globalCompositeOperation = 'source-over';
    // ruled streaks running with the band, broken by its density
    K.still(43);
    K.hatch(x, null, { angle: -0.28, gap: 2.8, step: 9, amp: 0.6, color: C.voidInk, width: 0.55, alpha: 0.13, density: (X, Y) => band(X, Y) * 1.05 - 0.08, bbox: { x0: 0, y0: 0, x1: S, y1: S } });
    K.hatch(x, null, { angle: 0.35, gap: 3.4, step: 9, amp: 0.6, color: C.cyan, width: 0.5, alpha: 0.08, density: (X, Y) => (band(X, Y) - 0.45) * 1.8, bbox: { x0: 0, y0: 0, x1: S, y1: S } });
    // stipple: the dust itself
    const r = K.stable(47);
    for (let i = 0; i < 90000; i++) {
      const X = r() * S, Y = S / 2 + (r() - 0.5) * S * 0.72, d = band(X, Y);
      if (Math.pow(d, 1.25) < r()) continue;
      const q = r(), z = 0.5 + r() * r() * 1.5;
      x.fillStyle = q > 0.93 ? K.rgba(C.soulHot, 0.35 + r() * 0.4) : q > 0.86 ? K.rgba(C.cyan, 0.3 + r() * 0.4) : K.rgba(C.voidInk, 0.18 + r() * 0.5 * d);
      x.fillRect(X, Y, z, z);
    }
    // knots where stars are being born
    for (let i = 0; i < 14; i++) {
      const u = r(), X = u * S, Y = S / 2 + Math.sin(u * 5.3 + 3) * S * 0.17 + (r() - 0.5) * S * 0.1;
      if (band(X, Y) < 0.35) continue;
      const gr = x.createRadialGradient(X, Y, 0, X, Y, 12);
      gr.addColorStop(0, 'rgba(255,230,168,0.16)');
      gr.addColorStop(1, 'rgba(255,230,168,0)');
      x.fillStyle = gr;
      x.fillRect(X - 12, Y - 12, 24, 24);
      for (let k = 0; k < 40; k++) { const a = r() * K.TAU, d = r() * r() * 22; x.fillStyle = K.rgba(C.soulHot, 0.5 * r()); x.fillRect(X + Math.cos(a) * d, Y + Math.sin(a) * d, 1.1, 1.1); }
    }
    return c;
  }

  // ---------------------------------------------------------------- construction drawing
  function construction(ctx, reveal, alpha) {
    if (alpha <= 0.01 || reveal <= 0) return;
    const a0 = -Math.PI / 2, a1 = a0 + TAU * reveal, RR = 372;
    K.seed(101);
    K.ink(ctx, K.arc(CX, CY, RR, RR, a0, a1), C.mind, 1, 0.8, false, 0.34 * alpha);
    K.ink(ctx, K.arc(CX, CY, RR + 12, RR + 12, a0, a1), C.mind, 0.7, 0.8, false, 0.2 * alpha);
    ctx.beginPath();
    for (let d = 0; d < 360; d += 5) {
      const a = a0 + (d / 360) * TAU;
      if (a > a1) break;
      const L = d % 30 === 0 ? 16 : d % 10 === 0 ? 9 : 5, c = Math.cos(a), s = Math.sin(a);
      ctx.moveTo(CX + c * RR, CY + s * RR);
      ctx.lineTo(CX + c * (RR - L), CY + s * (RR - L));
    }
    K.stroke(ctx, C.mind, 0.9, 0.34 * alpha);
    const lr = K.sr(reveal, 0.1, 0.8);
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(CX - 430 * lr, CY); ctx.lineTo(CX + 430 * lr, CY);
    ctx.moveTo(CX, CY - 390 * lr); ctx.lineTo(CX, CY + 360 * lr);
    for (const a of [Math.PI / 6, -Math.PI / 6]) {
      ctx.moveTo(CX - Math.cos(a) * 350 * lr, CY - Math.sin(a) * 350 * lr);
      ctx.lineTo(CX + Math.cos(a) * 350 * lr, CY + Math.sin(a) * 350 * lr);
    }
    K.stroke(ctx, C.mind, 0.8, 0.15 * alpha);
    ctx.restore();
    // compass arcs pricked from the rim, a drafter's working marks
    K.seed(103);
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (k * TAU) / 4 + 0.42, px = CX + Math.cos(a) * RR, py = CY + Math.sin(a) * RR;
      const vis = K.sr(reveal, 0.3 + k * 0.14, 0.62 + k * 0.1);
      if (vis > 0) K.ink(ctx, K.arc(px, py, 118, 118, a + Math.PI - 0.5, a + Math.PI - 0.5 + 1.0 * vis), C.mind, 0.8, 0.6, false, 0.2 * alpha);
      K.ink(ctx, K.arc(px, py, 3, 3), C.mind, 0.8, 0.2, false, 0.4 * alpha * vis);
    }
    K.ink(ctx, K.arc(CX, CY, 8, 8), C.mind, 0.9, 0.3, false, 0.5 * alpha);
    K.line(ctx, CX - 15, CY, CX + 15, CY, C.mind, 0.8, 0.2, 0.5 * alpha);
    K.line(ctx, CX, CY - 15, CX, CY + 15, C.mind, 0.8, 0.2, 0.5 * alpha);
  }

  function orbits(ctx, reveal, alpha) {
    if (alpha <= 0.01 || reveal <= 0) return;
    ctx.save();
    ctx.setLineDash([2, 7]);
    K.seed(111);
    K.ink(ctx, K.part(K.arc(CX, CY, SOUL.rx, SOUL.ry, -Math.PI / 2, TAU - Math.PI / 2, TILT), reveal), C.soul, 1.1, 0.6, false, 0.38 * alpha);
    K.ink(ctx, K.part(K.arc(CX, CY, MIND.rx, MIND.ry, Math.PI / 2, TAU + Math.PI / 2, TILT), reveal), C.mind, 1.1, 0.6, false, 0.45 * alpha);
    ctx.restore();
  }

  /** A dimension line held taut between the two bodies. */
  function tension(ctx, m, s, alpha, t) {
    if (alpha <= 0.01) return;
    const dx = s[0] - m[0], dy = s[1] - m[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const a = [m[0] + ux * 110, m[1] + uy * 110], b = [s[0] - ux * 36, s[1] - uy * 36];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 30) return;
    K.seed(301);
    K.ink(ctx, K.seg(a[0], a[1], b[0], b[1], 10), C.cyan, 0.8, 0.5, false, 0.32 * alpha);
    ctx.beginPath();
    const off = (t * 14) % 14;
    for (let d = off; d < len; d += 14) {
      const px = a[0] + ux * d, py = a[1] + uy * d;
      ctx.moveTo(px - uy * 3.5, py + ux * 3.5);
      ctx.lineTo(px + uy * 3.5, py - ux * 3.5);
    }
    K.stroke(ctx, C.cyan, 0.7, 0.28 * alpha);
    for (const [px, py, dir] of [[a[0], a[1], 1], [b[0], b[1], -1]]) {
      ctx.beginPath();
      ctx.moveTo(px + (ux * 9 - uy * 4) * dir, py + (uy * 9 + ux * 4) * dir);
      ctx.lineTo(px, py);
      ctx.lineTo(px + (ux * 9 + uy * 4) * dir, py + (uy * 9 - ux * 4) * dir);
      K.stroke(ctx, C.cyan, 0.8, 0.4 * alpha);
    }
  }

  // ---------------------------------------------------------------- the mechanism
  /** A toothed wheel, hand-inked. */
  function gear(ctx, x, y, r, teeth, rot, color, alpha, width = 1.2) {
    const pts = [];
    for (let k = 0; k < teeth; k++) {
      const a = rot + (k / teeth) * TAU, d = TAU / teeth;
      pts.push(ellPt(x, y, r, r, a, 0), ellPt(x, y, r * 1.14, r * 1.14, a + d * 0.12, 0), ellPt(x, y, r * 1.14, r * 1.14, a + d * 0.45, 0), ellPt(x, y, r, r, a + d * 0.57, 0));
    }
    K.ink(ctx, pts, color, width, 0.3, true, alpha);
    K.ink(ctx, K.arc(x, y, r * 0.42, r * 0.42), color, width * 0.8, 0.3, false, alpha);
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = rot + (k / 5) * TAU;
      K.trace(ctx, K.seg(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, 6), 0.3);
    }
    K.stroke(ctx, color, width * 0.8, alpha * 0.8);
  }
  FILM.gear = gear;
  /** The orrery's brass: arms from the centre post to each body, and the wheels that turn them. */
  function brass(ctx, t, m, s, alpha) {
    if (alpha <= 0.01) return;
    K.seed(501);
    for (const [p, w] of [[m, 2.6], [s, 2]]) {
      K.ink(ctx, K.seg(CX, CY, p[0], p[1], 12), C.gold, w, 0.5, false, 0.75 * alpha);
      K.ink(ctx, K.seg(CX, CY - 2, p[0], p[1] - 2, 12), C.goldLight, 0.7, 0.5, false, 0.5 * alpha);
    }
    gear(ctx, CX, CY, 30, 18, t * 0.3, C.gold, 0.8 * alpha, 1.3);
    gear(ctx, CX + 46, CY + 18, 15, 10, -t * 0.54 + 0.2, C.gold, 0.6 * alpha, 1);
    K.glow(ctx, CX, CY, 60, C.gold, 0.12 * alpha);
  }

  // ---------------------------------------------------------------- the mind
  const rings = (t, tighten) => [0, 1, 2].map((k) => ({
    k,
    R: MIND_R * (1.4 + 0.25 * k) * tighten,
    rot: -0.5 + k * 1.05 + t * 0.13 * (k % 2 ? 1 : -1),
    sq: 0.3 + 0.07 * k,
  }));
  const GAP = [0.35, 1.05]; // where the thunder broke ring 1 (ellipse parameter, radians)

  function ringHalf(ctx, x, y, ring, front, alpha, crack) {
    if (alpha <= 0.01) return;
    const a0 = front ? 0 : Math.PI, a1 = a0 + Math.PI;
    let spans = [[a0, a1]];
    if (crack > 0 && ring.k === 1) {
      spans = [];
      const g0 = GAP[0], g1 = GAP[0] + (GAP[1] - GAP[0]) * crack;
      if (front) { if (g0 > a0) spans.push([a0, g0]); if (g1 < a1) spans.push([g1, a1]); }
      else spans.push([a0, a1]);
    }
    K.seed(401 + ring.k * 3 + (front ? 1 : 0));
    for (const [s0, s1] of spans) {
      K.ink(ctx, K.arc(x, y, ring.R, ring.R * ring.sq, s0, s1, ring.rot), C.mind, 1.7, 0.6, false, alpha);
      K.ink(ctx, K.arc(x, y, ring.R * 1.06, ring.R * 1.06 * ring.sq, s0, s1, ring.rot), C.mind, 0.8, 0.6, false, alpha * 0.5);
    }
    // graduations between the two rules of each band
    ctx.beginPath();
    for (let k = 0; k <= 15; k++) {
      const a = a0 + (k * Math.PI) / 15;
      if (crack > 0 && ring.k === 1 && a > GAP[0] - 0.02 && a < GAP[0] + (GAP[1] - GAP[0]) * crack + 0.02) continue;
      const [ix, iy] = ellPt(x, y, ring.R, ring.R * ring.sq, a, ring.rot);
      const [ox, oy] = ellPt(x, y, ring.R * 1.06, ring.R * 1.06 * ring.sq, a, ring.rot);
      ctx.moveTo(ix, iy);
      ctx.lineTo(ox, oy);
    }
    K.stroke(ctx, C.mind, 0.7, alpha * 0.6);
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = a0 + ((k + 0.5) * Math.PI) / 6;
      if (crack > 0 && ring.k === 1 && a > GAP[0] - 0.05 && a < GAP[1] + 0.05) continue;
      const [px, py] = ellPt(x, y, ring.R * 1.03, ring.R * 1.03 * ring.sq, a, ring.rot);
      ctx.moveTo(px + 2.4, py);
      ctx.arc(px, py, 2.4, 0, TAU);
    }
    ctx.globalAlpha = alpha * K.A;
    ctx.fillStyle = C.cyan;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (front) {
      // cage bars from the ring down onto the planet
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = 0.35 + k * 0.8;
        if (crack > 0 && ring.k === 1 && a > GAP[0] - 0.1 && a < GAP[1] + 0.1) continue;
        const [px, py] = ellPt(x, y, ring.R, ring.R * ring.sq, a, ring.rot);
        const dx = px - x, dy = py - y, L = Math.hypot(dx, dy) || 1;
        K.trace(ctx, K.seg(px, py, x + (dx / L) * MIND_R * 0.96, y + (dy / L) * MIND_R * 0.96, 6), 0.4);
      }
      K.stroke(ctx, C.mind, 1, alpha * 0.55);
    }
  }

  function mindBody(ctx, x, y, r, t, lx, ly, soulI, crack) {
    const body = K.arc(x, y, r, r);
    K.seed(201);
    K.fill(ctx, body, C.mindDeep, 1, 1);
    const tone = K.sphereTone(x, y, r, lx, ly, 0.05);
    K.hatch(ctx, body, { angle: 0.6, gap: 2.6, step: 6, amp: 0.4, color: '#040A16', width: 1, density: tone });
    K.hatch(ctx, body, { angle: 1.95, gap: 3.2, step: 6, amp: 0.4, color: '#040A16', width: 0.9, density: (px, py) => (tone(px, py) - 0.42) / 0.58 });
    K.hatch(ctx, body, { angle: -0.45, gap: 3.6, step: 6, amp: 0.4, color: '#02060E', width: 0.9, density: (px, py) => (tone(px, py) - 0.7) / 0.3 });
    K.stipple(ctx, body, { count: 260, r0: 0.5, r1: 1.1, color: '#02060E', alpha: 0.8, density: (px, py) => (tone(px, py) - 0.3) * 1.4 });
    // curved form-lines along the latitudes, only through the half-tones
    {
      const ct0 = Math.cos(0.38), st0 = Math.sin(0.38);
      K.seed(207);
      ctx.beginPath();
      for (let k = 1; k < 26; k++) {
        const ph = -Math.PI / 2 + (k / 26) * Math.PI, yy = -r * Math.sin(ph), hw = r * Math.cos(ph), tau = 0.15 + K.r() * 0.2;
        let pen = false;
        for (let j = 0; j <= 20; j++) {
          const a = (j / 20) * Math.PI, px = hw * Math.cos(a), py = yy + hw * 0.16 * Math.sin(a);
          const X = x + px * ct0 - py * st0, Y = y + px * st0 + py * ct0, v = tone(X, Y);
          if (v > tau && v < 0.78) { pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } else pen = false;
        }
      }
      K.stroke(ctx, C.mind, 0.6, 0.35);
    }
    // a lattice of nuclei on the surface, turning with the planet
    {
      const N = 170, spin = t * 0.22, ct0 = Math.cos(0.38), st0 = Math.sin(0.38);
      ctx.fillStyle = C.cyan;
      for (let i = 0; i < N; i++) {
        const yv = 1 - (2 * (i + 0.5)) / N, rad = Math.sqrt(1 - yv * yv), th = i * 2.399963 + spin;
        const px = Math.cos(th) * rad, pz = Math.sin(th) * rad;
        if (pz < 0.05) continue;
        const X = x + (px * ct0 - -yv * st0) * r * 0.97, Y = y + (px * st0 + -yv * ct0) * r * 0.97, lit = 1 - tone(X, Y);
        const z = 0.8 + 1.6 * pz;
        ctx.globalAlpha = K.A * K.clamp(0.12 + 0.75 * lit) * pz;
        ctx.fillRect(X - z / 2, Y - z / 2, z, z);
      }
      ctx.globalAlpha = 1;
    }
    // latitude & longitude, tilted and slowly turning
    const tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt);
    const rp = (px, py) => [x + px * ct - py * st, y + px * st + py * ct];
    ctx.beginPath();
    for (let m = 0; m < 12; m++) {
      const lam = (m / 12) * TAU + t * 0.22;
      if (Math.cos(lam) <= 0.02) continue;
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const ph = -Math.PI / 2 + (k / 16) * Math.PI;
        pts.push(rp(r * Math.cos(ph) * Math.sin(lam), -r * Math.sin(ph)));
      }
      K.trace(ctx, pts, 0.35);
    }
    for (const ph of [-1.05, -0.52, 0, 0.52, 1.05]) {
      const yy = -r * Math.sin(ph), hw = r * Math.cos(ph), pts = [];
      for (let k = 0; k <= 14; k++) { const a = (k / 14) * Math.PI; pts.push(rp(hw * Math.cos(a), yy + hw * 0.16 * Math.sin(a))); }
      K.trace(ctx, pts, 0.35);
    }
    K.stroke(ctx, C.mind, 0.8, 0.5);
    // the soul lights the mind's near limb
    const la = Math.atan2(ly, lx);
    K.ink(ctx, K.arc(x, y, r - 1.8, r - 1.8, la - 1.0, la + 1.0), C.soulHot, 2.2, 0.4, false, 0.2 + 0.6 * soulI);
    K.ink(ctx, K.arc(x, y, r, r, 0, TAU * 1.03), C.mind, 1.8, 0.6);
    if (crack > 0) {
      const g = K.stable(5), pts = [];
      let px = x - r * 0.7, py = y - r * 0.28;
      for (let k = 0; k <= 10; k++) { pts.push([px, py]); px += r * 0.135; py += (g() - 0.42) * r * 0.22; }
      const vis = K.part(pts, crack);
      const mid = vis[Math.floor(vis.length / 2)];
      K.glow(ctx, mid[0], mid[1], r * 0.9, C.soul, 0.35 * crack);
      K.seed(211);
      K.ink(ctx, vis, C.soul, 4, 0.3, false, 0.3);
      K.ink(ctx, vis, C.soulHot, 1.5, 0.3);
    }
  }

  function brokenPiece(ctx, x, y, ring, t, crack) {
    if (crack <= 0) return;
    // the snapped length of ring 1 drifts loose, turning slowly
    const a = (GAP[0] + GAP[1]) / 2, [px, py] = ellPt(x, y, ring.R, ring.R * ring.sq, a, ring.rot);
    const dx = px - x, dy = py - y, L = Math.hypot(dx, dy) || 1, drift = 12 + 6 * Math.sin(t * 0.9);
    ctx.save();
    ctx.translate(px + (dx / L) * drift * crack, py + (dy / L) * drift * crack);
    ctx.rotate(0.25 * Math.sin(t * 0.6) + 0.3);
    K.seed(431);
    const piece = K.arc(0, 0, 34, 12, -0.9, 0.3, 0.2);
    K.ink(ctx, piece, C.mind, 1.7, 0.4, false, 0.85 * crack);
    ctx.restore();
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const u = k / 5, sx = px + Math.cos(u * 6 + t * 0.4) * (26 + k * 7), sy = py + Math.sin(u * 5 + t * 0.5) * (18 + k * 5);
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 5, sy - 2);
    }
    K.stroke(ctx, C.cyan, 1, 0.55 * crack);
  }

  // ---------------------------------------------------------------- embers shed by a grieving soul
  function embers(ctx, t, th, from, n) {
    for (let k = 0; k < n; k++) {
      const b = from + k * 0.23;
      if (t < b) break;
      const age = t - b;
      if (age > 3.4) continue;
      const [sx, sy] = soulAt(th(b));
      const a = K.hash(k * 17 + 3) * TAU, v = 16 + K.hash(k * 31 + 5) * 26;
      const x = sx + Math.cos(a) * v * age, y = sy + Math.sin(a) * v * age * 0.6 + 11 * age * age;
      const al = (1 - age / 3.4) * 0.9;
      K.glow(ctx, x, y, 9, C.soul, 0.5 * al);
      ctx.globalAlpha = al;
      ctx.fillStyle = K.mix(C.soulHot, C.ash, age / 3.4);
      ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- the whole plate
  /** o: { th, thOf, soulI, soulR, tighten, reveal, others, crack, zoom, focus, embersFrom, t } */
  function orrery(ctx, t, o) {
    K.voidBg(ctx);
    const z = o.zoom ?? 1, f = o.focus || [CX, CY];
    // far stars move less than the plate: a little parallax
    ctx.save();
    const zf = 1 + (z - 1) * 0.25;
    ctx.translate(f[0], f[1]); ctx.scale(zf, zf); ctx.translate(-f[0], -f[1]);
    ctx.save();
    ctx.globalAlpha = 0.95 * o.others;
    ctx.translate(500, 470); ctx.rotate(-0.35 + t * 0.004); ctx.translate(-700, -700);
    ctx.drawImage(nebula, 0, 0, 1400, 1400);
    ctx.restore();
    K.drawStars(ctx, far, t, { alpha: 0.7 * o.others });
    ctx.restore();
    K.fade(o.others, () => K.ruledSky(ctx, { gap: 5, alpha: 0.075, density: (x, y) => 0.25 + 0.75 * Math.pow(1 - y / 1000, 1.5) }));

    ctx.save();
    ctx.translate(f[0], f[1]); ctx.scale(z, z); ctx.translate(-f[0], -f[1]);
    K.drawStars(ctx, stars, t, { alpha: o.others });
    construction(ctx, o.reveal, o.others);
    orbits(ctx, o.reveal, o.others);

    const s = soulAt(o.th), m = mindAt(o.th);
    const lx = s[0] - m[0], ly = s[1] - m[1], ll = Math.hypot(lx, ly) || 1;
    tension(ctx, m, s, o.others * K.sr(o.reveal, 0.5, 1), t);
    brass(ctx, t, m, s, o.others * K.sr(o.reveal, 0.2, 0.7));
    const rs = rings(t, o.tighten);
    const mr = MIND_R * (1 + 0.06 * m[2]);
    const drawMind = () => {
      if (o.others <= 0.01) return;
      K.fade(o.others, () => {
        for (const r of rs) ringHalf(ctx, m[0], m[1], r, false, 0.85, o.crack);
        mindBody(ctx, m[0], m[1], mr, t, lx / ll, ly / ll, o.soulI, o.crack);
        for (const r of rs) ringHalf(ctx, m[0], m[1], r, true, 0.95, o.crack);
        brokenPiece(ctx, m[0], m[1], rs[1], t, o.crack);
      });
    };
    const drawSoul = () => {
      const r = (o.soulR ?? SOUL_R) * (1 + 0.08 * s[2]);
      if (r < 9) K.glow(ctx, s[0], s[1], 46, C.soulHot, 0.55 * o.soulI);
      K.soulStar(ctx, s[0], s[1], r, o.soulI, t);
    };
    if (s[2] > m[2]) { drawMind(); drawSoul(); } else { drawSoul(); drawMind(); }
    if (o.embersFrom != null) embers(ctx, t, o.thOf, o.embersFrom, 16);
    ctx.restore();
    return { soul: s, mind: m };
  }
  FILM.orrery = orrery;

  // ---------------------------------------------------------------- Plate I
  FILM.scenes.orrery = {
    tone: 'void',
    lines: [
      { text: 'To my mind that forbids,', at: 1.7 },
      { text: 'to the soul that I grieve.', at: 5.0 },
    ],
    sfx: [{ at: 0.2, kind: 'chime' }, { at: 9.8, kind: 'whoosh' }],
    mood: (t) => ({ drone: 0.55 + 0.25 * K.sr(t, 5, 9), warm: 0.1 + 0.3 * (1 - K.sr(t, 5, 9.5)), wind: 0.05 }),
    init() {
      stars = K.makeStars(7, 430);
      far = K.makeStars(8, 520);
      nebula = buildDust();
    },
    draw(ctx, t, dur) {
      const th = (x) => -Math.PI / 2 + x * SPIN;
      const soulI = K.lerp(K.lerp(0.9, 1, K.sr(t, 0, 1.4)), 0.42, K.sr(t, 5.4, 9.4));
      const s = soulAt(th(t));
      const dive = K.easeIn(K.range(t, 9.5, dur + 1));
      orrery(ctx, t, {
        th: th(t), thOf: th, soulI,
        soulR: K.lerp(3, SOUL_R, K.sr(t, 0.1, 1.8)),
        tighten: 1 - 0.14 * K.sr(t, 1.8, 4.8) - 0.06 * K.sr(t, 5.2, 10),
        reveal: K.sr(t, 1.0, 4.6),
        others: K.sr(t, 0.6, 2.8),
        crack: 0,
        zoom: (1 + 0.05 * K.sr(t, 0, dur)) * (1 + 11 * dive),
        focus: [K.lerp(CX, s[0], K.sr(t, 9.2, 10.6)), K.lerp(CY, s[1], K.sr(t, 9.2, 10.6))],
        embersFrom: 5.5,
      });
    },
  };

  // ---------------------------------------------------------------- Plate IX
  let wstars;
  function water(ctx, t, a) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = a;
    K.voidBg(ctx);
    // reflected sky: stars squeezed and shivering on the surface
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 1000, 1000); ctx.clip();
    for (const s of wstars) {
      const y = 380 + (s.y - 380) * 0.8, wob = Math.sin(y * 0.045 + t * 2.2) * 3 * (1 - K.sr(t, 0, 3));
      const al = a * (0.25 + 0.75 * s.m) * (0.6 + 0.4 * Math.sin(t * 1.6 + s.ph));
      ctx.globalAlpha = al;
      ctx.fillStyle = C.voidInk;
      const w = 0.8 + s.m * 2.2;
      ctx.fillRect(s.x + wob - w / 2, y - w * 1.6, w, w * 3.2);
    }
    ctx.restore();
    ctx.globalAlpha = a;
    // the soul, reflected
    K.glow(ctx, 500, 540, 120, C.soul, 0.4 * a);
    ctx.save();
    ctx.translate(500, 540); ctx.scale(1, 2.4);
    K.glow(ctx, 0, 0, 22, C.soulHot, 0.8 * a);
    ctx.restore();
    // rings on the water, settling
    const settle = 1 - K.sr(t, 0.4, 3.2);
    for (let k = 0; k < 6; k++) {
      const age = K.frac(t * 0.32 + k / 6), r = 30 + age * 560;
      const al = (1 - age) * 0.55 * settle * a;
      if (al < 0.01) continue;
      K.seed(701 + k);
      K.ink(ctx, K.arc(500, 540, r, r * 0.3, 0, TAU * 1.01), k % 2 ? C.cyan : C.voidInk, 1.2, 1.4, false, al);
    }
    // surface strokes
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const y = 600 + k * 24 + (t * 6) % 24, x0 = 120 + K.hash(k * 13) * 380, L = 80 + K.hash(k * 7) * 260;
      K.trace(ctx, K.seg(x0, y, x0 + L, y, 14), 1.2);
    }
    K.stroke(ctx, C.voidInk, 0.8, 0.12 * a);
    ctx.restore();
  }

  // The Earth, engraved once into a texture: land, sea, cloud, with ruled line-work.
  let earthTex = null, earthLights = [];
  const mixA = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function buildEarth() {
    const S = 512, c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data, g = K.stable(12);
    const ocean = [24, 56, 92], deep = [10, 26, 50], land = [206, 172, 104], landDark = [128, 98, 52], cloud = [238, 230, 212];
    earthLights = [];
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const u = (i / S) * 2 - 1, v = (j / S) * 2 - 1;
        if (u * u + v * v > 1.02) continue;
        const n = K.fbm(u * 2.3 + 11, v * 2.3 + 4, 4), rule = Math.sin((u * 0.94 + v * 0.34) * 170);
        let col;
        if (n > 0.06) {
          col = mixA(land, landDark, K.clamp((n - 0.06) * 4) * 0.55 + (rule > 0.55 ? 0.32 : 0));
          if (g() < 0.01) earthLights.push([u, v]);
        } else col = mixA(ocean, deep, K.clamp(-n * 3) * 0.7 + (rule > 0.7 ? 0.28 : 0));
        const cl = K.fbm(u * 3.1 + 40, v * 5.4 + 7, 4);
        if (cl > 0.16) col = mixA(col, cloud, K.clamp((cl - 0.16) * 3.2) * 0.85);
        const k = (j * S + i) * 4;
        d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0);
    earthTex = c;
  }

  function earth(ctx, t, x, y, r, a) {
    if (r < 1 || a <= 0.01) return;
    K.fade(a, () => {
      K.glow(ctx, x, y, r * 1.22, C.cyan, 0.3);
      const spin = t * 0.03, cs = Math.cos(spin), sn = Math.sin(spin);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.clip();
      ctx.globalAlpha = K.A;
      ctx.translate(x, y);
      ctx.rotate(spin);
      ctx.drawImage(earthTex, -r, -r, 2 * r, 2 * r);
      ctx.restore();
      const body = K.arc(x, y, r, r, 0, TAU, 0, Math.max(4, r / 30));
      const shade = K.sphereTone(x, y, r, -0.55, -0.72, 0.02);
      const gap = K.clamp(r / 95, 2.2, 6);
      K.seed(801);
      K.hatch(ctx, body, { angle: 1.2, gap, step: gap * 2.6, amp: 0.5, color: '#02050C', width: 1.3, density: shade });
      K.hatch(ctx, body, { angle: 2.45, gap: gap * 1.25, step: gap * 2.6, amp: 0.5, color: '#02050C', width: 1.1, density: (px, py) => (shade(px, py) - 0.45) / 0.55 });
      if (r > 30) {
        ctx.save();
        ctx.fillStyle = C.soulHot;
        for (const [u, v] of earthLights) {
          const px = x + (u * cs - v * sn) * r, py = y + (u * sn + v * cs) * r;
          const dk = shade(px, py);
          if (dk < 0.62) continue;
          ctx.globalAlpha = K.A * K.clamp((dk - 0.62) * 4) * 0.9;
          const z = r > 300 ? 2.2 : 1.4;
          ctx.fillRect(px - z / 2, py - z / 2, z, z);
        }
        ctx.restore();
      }
      K.ink(ctx, body, C.cyan, 1.6, 0.8, true, 0.85);
      K.ink(ctx, K.arc(x, y, r * 1.025, r * 1.025, 3.5, 5.6), C.cyan, 3, 0.8, false, 0.4);
    });
  }

  FILM.scenes.return = {
    tone: 'void',
    lines: [
      { text: 'To my mind that forbids,', at: 5.2 },
      { text: 'To the soul that I grieve.', at: 7.6 },
    ],
    sfx: [{ at: 0.4, kind: 'chime' }, { at: 5.1, kind: 'chime' }, { at: 9.5, kind: 'chime' }],
    mood: (t) => ({ drone: 0.5, warm: 0.2 + 0.25 * K.sr(t, 4, 7), rain: 0.5 * (1 - K.sr(t, 0, 2.8)) }),
    init() {
      if (!stars) FILM.scenes.orrery.init();
      wstars = K.makeStars(21, 380, 0, 360, 1000, 1000);
      buildEarth();
    },
    draw(ctx, t, dur) {
      const th = (x) => -Math.PI / 2 + (x - dur) * SPIN;
      const s = soulAt(th(t));
      const rise = K.sr(t, 1.8, 3.4);
      const u = K.easeInOut(K.range(t, 1.6, 5.4));
      const er = 1050 * Math.pow(1 - u, 2.4);
      const ex = K.lerp(500, s[0], u), ey = K.lerp(1560, s[1], Math.pow(u, 0.8));
      const settle = K.sr(t, 10.1, 11.7);
      const others = K.sr(t, 3.6, 6.0) * (1 - settle);
      orrery(ctx, t, {
        th: th(t), thOf: th,
        soulI: K.lerp(0.68, 0.9, settle),
        soulR: K.lerp(K.lerp(0, SOUL_R, K.sr(t, 4.4, 5.8)), 3, K.sr(t, 10.4, 11.9)),
        tighten: 0.86,
        reveal: K.sr(t, 3.8, 6.6),
        others,
        crack: K.sr(t, 4.2, 6.4),
        zoom: K.lerp(1.7, 1, K.easeInOut(K.range(t, 3.4, 6.8))),
        focus: [s[0], s[1]],
      });
      earth(ctx, t, ex, ey, er, K.sr(t, 1.4, 2.6) * (1 - K.sr(t, 4.9, 5.6)));
      water(ctx, t, 1 - rise);
      // signature
      K.write(ctx, '— Sahaib', 928, 970, { size: 34, align: 'right', color: C.voidInk, progress: K.range(t, 9.4, 10.6), alpha: 1 - K.range(t, dur - 0.8, dur - 0.1) });
    },
  };
})();
