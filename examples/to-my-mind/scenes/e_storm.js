// The poem's words in this file are © 2026 Sahaib Singh Arora, all rights reserved — see examples/to-my-mind/NOTICE in the ink-film repository. The code is MIT.
'use strict';
/* Plates VII and VIII — the storm and the strike.
   VII  "Give me the rumble,": a lone figure under a boiling cumulonimbus, the world's lights on the horizon.
   VIII "Settle me a thunder.": the clouds part on the soul; a bolt finds the chest; the world's cage
        (blueprint grid, coins, gears) shatters off him; rain; the camera lowers into a puddle of stars,
        the same water the last plate rises out of.
   Both plates run on one storm clock T (VII: T = t, VIII: T = 7 + t) so the cut between them is seamless. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const RUMBLE = 7;                       // length of plate VII; VIII continues the same clock
  const FX = 560, FY = 792;               // the figure's feet
  const FIG_S = 1.18;                     // figure drawn about its feet at this scale
  const CHEST = [FX, FY - (FY - 690) * FIG_S];
  const STAR = [500, 150], STAR_R = 26;
  const PC = [515, 923];                  // the puddle: its far bank is at his feet
  const LEAD0 = 1.2, LEAD1 = 1.7;         // (plate VIII time) the leader descends, then the return stroke
  const INK = '#07060B', LAV = '#B8AED6', LAV_HI = '#DAD2F2', GROUND = '#0B0910';

  let massPoly;
  let sprites = null, puffs, glowPuffs, city, tufts, bolt, shards, drops, rings, streaks, skyStars, wstars, threadPts;

  const hy = (x) => 754 + 9 * Math.sin(x * 0.0042 + 1.3) + 5 * K.n1(x * 0.011 + 3); // the horizon

  // ---------------------------------------------------------------- cloud puffs (pre-drawn, 3 boil variants)
  const PR = 150, PAD = 26;
  function puffSprite(layer, shape) {
    const S = PR + PAD, [c, x] = K.makeCanvas(2 * S, 2 * S, Math.min(K.PX, 1.25));
    const cx = S, cy = S, g = K.stable(300 + shape * 17 + layer * 5), off = g() * 100;
    const rad = (a) => PR * (0.9 + 0.07 * K.n1(off + a * 1.6) + 0.05 * K.n1(off * 2 + a * 4.3));
    const body = [];
    for (let k = 0; k <= 90; k++) { const a = (k / 90) * TAU; body.push([cx + Math.cos(a) * rad(a), cy + Math.sin(a) * rad(a)]); }
    const shade = [['#50466C', '#1C172B'], ['#3F3659', '#15111F'], ['#312A45', '#0C0A13']][layer];
    K.seed(900 + layer * 10 + shape);
    const gr = x.createLinearGradient(0, cy - PR, 0, cy + PR);
    gr.addColorStop(0, shade[0]);
    gr.addColorStop(1, shade[1]);
    x.beginPath(); K.path(x, body); x.fillStyle = gr; x.fill();
    const tone = (px, py) => K.clamp(((py - cy) / PR) * 0.8 + 0.28 + 0.14 * ((px - cx) / PR));
    K.hatch(x, body, { angle: 0.95, gap: 3.2, step: 8, amp: 0.5, color: INK, width: 0.9, alpha: 0.8, density: tone });
    K.hatch(x, body, { angle: 2.3, gap: 4.1, step: 8, amp: 0.5, color: INK, width: 0.8, alpha: 0.65, density: (px, py) => (tone(px, py) - 0.5) / 0.5 });
    K.hatch(x, body, { angle: -0.3, gap: 4, step: 8, amp: 0.5, color: LAV, width: 0.7, alpha: 0.2 + 0.08 * (2 - layer), density: (px, py) => K.clamp((-(py - cy) / PR) * 1.1 - 0.12) });
    K.stipple(x, body, { count: 420, r0: 0.5, r1: 1.2, color: LAV, alpha: 0.32, density: (px, py) => K.clamp(-(py - cy) / PR + 0.15) });
    // inner billows: little spirals where the cloud turns over on itself
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (g() - 0.5) * 2.4, d = PR * (0.25 + g() * 0.4);
      const sx = cx + Math.cos(a) * d, sy = cy + Math.sin(a) * d, sr = PR * (0.09 + g() * 0.09), a0 = g() * TAU, sp = [];
      for (let j = 0; j <= 44; j++) { const u = j / 44, aa = a0 + u * TAU * 1.5; sp.push([sx + Math.cos(aa) * sr * u, sy + Math.sin(aa) * sr * u * 0.8]); }
      K.ink(x, sp, LAV, 0.9, 0.4, false, 0.42);
    }
    // the edge: a looping scribble, the way you'd draw a storm cloud fast with a dip pen
    const loops = [], nL = 27, l = PR * 0.075;
    for (let k = 0; k <= 560; k++) {
      const a = (k / 560) * TAU, ph = a * nL + a, rr = rad(a) - l * 0.6;
      loops.push([cx + Math.cos(a) * rr + Math.cos(ph) * l, cy + Math.sin(a) * rr + Math.sin(ph) * l]);
    }
    K.ink(x, loops, LAV, 1.1, 0.6, false, 0.5);
    const rim = [];
    for (let k = 0; k <= 34; k++) { const a = Math.PI * 1.06 + (k / 34) * Math.PI * 0.76; rim.push([cx + Math.cos(a) * (rad(a) - 4), cy + Math.sin(a) * (rad(a) - 4)]); }
    K.ink(x, rim, LAV_HI, 1.7, 0.5, false, 0.62 - layer * 0.12);
    if (layer === 2) {
      // the city's glow catching the storm's underside
      const under = [];
      for (let k = 0; k <= 30; k++) { const a = Math.PI * 0.12 + (k / 30) * Math.PI * 0.76; under.push([cx + Math.cos(a) * (rad(a) - 5), cy + Math.sin(a) * (rad(a) - 5)]); }
      K.ink(x, under, '#D8A873', 1.5, 0.5, false, 0.4);
      K.hatch(x, body, { angle: 0.2, gap: 3.6, step: 8, amp: 0.4, color: '#C58F5E', width: 0.7, alpha: 0.22, density: (px, py) => K.clamp((py - cy) / PR * 1.4 - 0.55) });
    }
    return c;
  }

  function puffAt(p, T, open) {
    let x = p.x + Math.sin(T * 0.33 + p.ph) * 10 + T * p.drift;
    let y = p.y + Math.sin(T * 0.47 + p.ph * 1.7) * 6 + 34 * K.sr(T, 0, RUMBLE) * (p.layer / 2);
    let s = (p.r / PR) * (1 + 0.05 * Math.sin(T * 0.8 + p.ph * 2.3)) * (1 + 0.08 * K.sr(T, 0, RUMBLE));
    if (open > 0) {
      const w = K.clamp(1 - (y - 40) / 470) * Math.exp(-Math.pow((x - 500) / 390, 2));
      x += (x < 500 ? -1 : 1) * open * 470 * w;
      y -= open * 90 * w;
      s *= 1 - 0.2 * open * w;
    }
    return [x, y, s, p.rot + T * p.spin];
  }

  const partW = (x, y) => K.clamp(1 - (y - 40) / 470) * Math.exp(-Math.pow((x - 500) / 390, 2));
  /** One dark body behind the puffs so the storm reads as a single mass; it tears open along x = 500. */
  function mass(ctx, T, open) {
    const dy = 34 * K.sr(T, 0, RUMBLE) * 0.5, sway = Math.sin(T * 0.3) * 6;
    for (const side of [-1, 1]) {
      const pts = massPoly[side < 0 ? 0 : 1].map(([x, y]) => {
        const yy = y + dy + (y > 380 ? Math.sin(x * 0.02 + T * 0.6) * 5 : 0);
        return [x + sway + side * open * 470 * partW(500, yy) * (x === 500 || Math.abs(x - 500) < 40 ? 1 : Math.exp(-Math.pow((x - 500) / 390, 2))), yy - open * 90 * partW(x, yy)];
      });
      K.seed(1101 + side);
      K.fill(ctx, pts, '#110D19', 1, 0);
    }
  }

  function clouds(ctx, T, open) {
    K.fade(1 - K.sr(open, 0, 0.55), () => mass(ctx, T, open)); // the backing dissolves as the storm breaks
    const v = K.boil % 3, S0 = PR + PAD;
    for (const p of puffs) {
      const [x, y, s, rot] = puffAt(p, T, open), S = S0 * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = K.A;
      ctx.drawImage(sprites[p.layer][p.shape][v], -S * p.sx, -S * p.sq, 2 * S * p.sx, 2 * S * p.sq);
      ctx.restore();
    }
  }

  /** Light moving inside the cloud: soft, slow, never a strobe. */
  function cloudGlow(ctx, T, open, strike) {
    const build = 0.25 + 0.75 * K.sr(T, 0.5, RUMBLE);
    glowPuffs.forEach((p, k) => {
      const [x, y, s] = puffAt(p, T, open);
      const f = K.clamp((K.n1(T * 1.05 + k * 7.3) - 0.15) / 0.85);
      const a = 0.5 * f * f * build * (1 - 0.6 * K.sr(T, RUMBLE, RUMBLE + 1)) + 0.75 * strike;
      K.glow(ctx, x, y + 20 * s, PR * s * 1.35, '#B3A3EE', a * 1.15);
    });
  }

  // ---------------------------------------------------------------- the world on the horizon
  function skyline(ctx, T) {
    K.glow(ctx, 830, 752, 280, C.soul, 0.1);
    K.glow(ctx, 140, 754, 200, C.soul, 0.07);
    K.seed(1201);
    for (const b of city) {
      const base = hy(b.x + b.w / 2) + 4, top = base - b.h;
      const pts = [[b.x, base], [b.x, top], [b.x + b.w, top], [b.x + b.w, base]];
      K.fill(ctx, pts, '#0E0B15', 1, 0.4);
      K.ink(ctx, pts, '#6E6592', 0.8, 0.35, false, 0.42);
      if (b.spire) {
        const sx = b.x + b.w / 2;
        K.line(ctx, sx, top, sx, top - b.h * 0.22, '#6E6592', 0.9, 0.3, 0.6);
        const blink = 0.5 + 0.5 * Math.sin(T * 2.2 + b.x);
        K.glow(ctx, sx, top - b.h * 0.22, 9, C.ember, 0.7 * blink);
      }
      ctx.fillStyle = C.soulHot;
      const dim = 0.92 - 0.5 * K.sr(T, 2.5, 13);
      for (const w of b.wins) {
        if (w.th > dim) continue;
        ctx.globalAlpha = (0.55 + 0.35 * w.th) * K.A;
        ctx.fillRect(b.x + w.dx, top + w.dy, 1.9, 2.5);
      }
      ctx.globalAlpha = 1;
    }
  }

  function ground(ctx, T, wind) {
    const top = [];
    for (let x = -60; x <= 1060; x += 20) top.push([x, hy(x)]);
    const region = [...top, [1060, 2700], [-60, 2700]];
    K.seed(1301);
    K.fill(ctx, region, GROUND, 1, 0);
    K.hatch(ctx, region, { angle: 0.07, gap: 4.2, step: 14, amp: 0.8, color: '#000000', width: 1, alpha: 0.75, bbox: { x0: -60, y0: 730, x1: 1060, y1: 1150 }, density: (x, y) => K.clamp(0.2 + (y - 760) / 240) });
    K.hatch(ctx, region, { angle: 0.04, gap: 3.4, step: 12, amp: 0.6, color: LAV, width: 0.7, alpha: 0.24, bbox: { x0: -60, y0: 730, x1: 1060, y1: 830 }, density: (x, y) => K.clamp(1 - (y - hy(x)) / 44) });
    K.ink(ctx, top, LAV, 1, 0.8, false, 0.5);
    ctx.beginPath();
    for (const g of tufts) {
      const bend = wind * (0.35 + 0.65 * (0.5 + 0.5 * K.n1(T * 1.7 + g.x * 0.013)));
      for (let b = 0; b < g.n; b++) {
        const bx = g.x + (b - g.n / 2) * g.h * 0.14, lean = (b - (g.n - 1) / 2) * 0.16 + bend;
        K.trace(ctx, [[bx, g.y], [bx + Math.sin(lean * 0.5) * g.h * 0.55, g.y - Math.cos(lean * 0.5) * g.h * 0.55], [bx + Math.sin(lean) * g.h, g.y - Math.cos(lean) * g.h]], 0.3);
      }
    }
    K.stroke(ctx, '#4E4668', 0.9, 0.75);
  }

  // ---------------------------------------------------------------- the figure, seen from behind
  function figure(ctx, T, glowI) {
    ctx.save();
    ctx.translate(FX, FY);
    ctx.scale(FIG_S, FIG_S);
    ctx.translate(-FX, -FY);
    figureBody(ctx, T, glowI);
    ctx.restore();
  }
  function figureBody(ctx, T, glowI) {
    const up = K.sr(T, 0.8, 3.2);
    const fl = 5 + 5 * K.n1(T * 2.3) + 5 * K.sr(T, 0, RUMBLE) * (1 - K.sr(T, RUMBLE, RUMBLE + 1));
    const beat = Math.pow(Math.max(0, Math.sin(T * 7.2)), 8);
    K.glow(ctx, FX, 690, 48 + 40 * glowI, C.soul, 0.24 + 0.1 * beat + 0.55 * glowI);
    const hx = FX + 0.5, hyy = 654 + 3.5 * up;
    const coat = K.spline([[FX - 8, 667], [FX - 22, 673], [FX - 25, 698], [FX - 19, 727], [FX - 23, 765], [FX - 6, 769], [FX + 9, 768], [FX + 23 + fl, 763 - fl * 0.35], [FX + 20, 728], [FX + 25, 699], [FX + 22, 673], [FX + 8, 667]], true, 6);
    const legL = [[FX - 12, 760], [FX - 3, 760], [FX - 5, 789], [FX - 12, 790]];
    const legR = [[FX + 3, 760], [FX + 11, 760], [FX + 12, 789], [FX + 5, 790]];
    const armL = K.spline([[FX - 21, 676], [FX - 28, 702], [FX - 30, 736], [FX - 25, 744], [FX - 21, 735], [FX - 19, 703]], true, 5);
    const armR = K.spline([[FX + 21, 676], [FX + 28, 703], [FX + 29, 735], [FX + 25, 743], [FX + 21, 734], [FX + 19, 704]], true, 5);
    const neck = [[FX - 5, 660 + 2 * up], [FX + 5, 660 + 2 * up], [FX + 6, 672], [FX - 6, 672]];
    const head = K.arc(hx, hyy, 11.5, 12.2, 0, TAU, 0, 3);
    const feet = [K.arc(FX - 9, FY, 6.5, 2.6, 0, TAU, 0, 3), K.arc(FX + 8.5, FY, 6.5, 2.6, 0, TAU, 0, 3)];
    const parts = [legL, legR, ...feet, coat, armL, armR, neck, head];
    K.seed(1601);
    for (const p of parts) K.fill(ctx, p, INK, 1, 0);
    // the coat's folds and seam, catching a little storm light
    ctx.beginPath();
    K.trace(ctx, K.seg(FX, 675, FX + 1, 764, 8), 0.5);
    K.trace(ctx, K.seg(FX - 19, 724, FX + 20, 724, 8), 0.4);
    for (let k = 0; k < 5; k++) K.trace(ctx, K.seg(FX - 14 + k * 7, 730, FX - 16 + k * 8 + fl * 0.2 * k, 762, 6), 0.4);
    K.stroke(ctx, LAV, 0.7, 0.22);
    // hair: short, dark, a few strands lit from the horizon
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI * 1.1 + k * 0.17; K.trace(ctx, K.arc(hx, hyy + 1, 9.5 - k * 0.4, 9.5, a, a + 0.5, 0, 3), 0.3); }
    K.stroke(ctx, LAV, 0.6, 0.35);
    // backlit: the rim of the whole silhouette
    for (const p of parts) K.ink(ctx, p, LAV_HI, 1, 0.4, true, 0.5);
    K.ink(ctx, K.arc(hx, hyy, 12, 12.6, Math.PI * 1.05, Math.PI * 1.95), LAV_HI, 1.6, 0.3, false, 0.55);
  }

  // ---------------------------------------------------------------- the strike
  function makeBolt(g) {
    const mid = (a, b, disp, depth, out) => {
      if (depth === 0) { out.push(b); return; }
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, n = (g() - 0.5) * disp;
      const m = [(a[0] + b[0]) / 2 - (dy / L) * n, (a[1] + b[1]) / 2 + (dx / L) * n];
      mid(a, m, disp * 0.56, depth - 1, out);
      mid(m, b, disp * 0.56, depth - 1, out);
    };
    const A = [STAR[0], STAR[1] + STAR_R * 0.9], main = [A];
    mid(A, CHEST, 170, 7, main);
    const branches = [];
    for (let k = 0; k < 10; k++) {
      const idx = 6 + Math.floor(g() * main.length * 0.74), s = main[idx];
      const dir = k % 2 ? 1 : -1, ang = Math.PI / 2 + dir * (0.35 + g() * 0.75), len = 60 + g() * 200;
      const pts = [s];
      mid(s, [s[0] + Math.cos(ang) * len, s[1] + Math.sin(ang) * len], len * 0.5, 5, pts);
      branches.push({ at: idx / (main.length - 1), pts, sub: false });
      if (g() < 0.65) {
        const j = Math.floor(pts.length * (0.3 + g() * 0.4)), s2 = pts[j], a2 = ang + dir * (0.3 + g() * 0.5), l2 = len * (0.3 + g() * 0.35);
        const p2 = [s2];
        mid(s2, [s2[0] + Math.cos(a2) * l2, s2[1] + Math.sin(a2) * l2], l2 * 0.5, 4, p2);
        branches.push({ at: (idx + 4) / (main.length - 1), pts: p2, sub: true });
      }
    }
    return { main, branches };
  }

  function drawBolt(ctx, tt) {
    if (tt < LEAD0) return;
    const lead = K.range(tt, LEAD0, LEAD1), after = tt - LEAD1, n = bolt.main.length;
    const flick = (k) => 0.4 + 0.6 * K.hash(K.boil * 13 + k * 7 + 3);
    const main = after < 0 ? bolt.main.slice(0, Math.max(2, Math.floor(n * lead))) : bolt.main;
    // the burn the bolt leaves on the eye, lingering after it has gone
    if (after > 0) K.fade(Math.exp(-after * 0.55) * 0.5, () => { K.seed(1701); K.ink(ctx, bolt.main, C.cyan, 1.2, 0.6, false, 0.6); });
    const bright = after < 0 ? 0.6 * flick(0) : Math.exp(-after * 2.4);
    if (bright > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, col, a] of [[18, '#6F86E8', 0.13], [7, '#B9C8FF', 0.35], [2.6, '#FFFFFF', 0.95]]) {
        ctx.beginPath(); K.path(ctx, main, false); K.stroke(ctx, col, w * (after < 0 ? 0.6 : 1), a * bright);
      }
      bolt.branches.forEach((b, k) => {
        if (lead < b.at) return;
        const pts = after < 0 ? K.part(b.pts, K.clamp((lead - b.at) / 0.16)) : b.pts;
        const bb = (after < 0 ? flick(k + 1) : Math.exp(-after * 4.5)) * (b.sub ? 0.6 : 0.9);
        if (bb < 0.02) return;
        ctx.beginPath(); K.path(ctx, pts, false); K.stroke(ctx, '#9FB0FF', 5, 0.16 * bb);
        ctx.beginPath(); K.path(ctx, pts, false); K.stroke(ctx, '#EEF2FF', b.sub ? 0.9 : 1.5, 0.85 * bb);
      });
      ctx.restore();
    }
    if (after < 0) { const tip = main[main.length - 1]; K.glow(ctx, tip[0], tip[1], 46, '#DDE4FF', 0.65); }
    else K.glow(ctx, CHEST[0], CHEST[1], 150, '#FFFFFF', 0.85 * Math.exp(-after * 3));
  }

  /** What the world built around him, blown off by the strike. */
  function drawShards(ctx, tt) {
    const a0 = tt - LEAD1;
    if (a0 <= 0) return;
    for (const s of shards) {
      const a = a0 - s.delay;
      if (a <= 0) continue;
      const al = 1 - K.sr(a, 1.9, 3.3);
      if (al <= 0.01) continue;
      const d = (s.v * (1 - Math.exp(-1.25 * a))) / 1.25;
      const x = CHEST[0] + Math.cos(s.ang) * d, y = CHEST[1] + Math.sin(s.ang) * d + 64 * a * a, rot = s.rot + s.spin * a;
      K.glow(ctx, x, y, s.size * 3, '#FFD9A0', 0.55 * Math.exp(-a * 4) * al);
      K.fade(al, () => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        K.seed(s.seed);
        if (s.type === 0) {
          // a torn scrap of blueprint: grid, a dimension tick
          K.fill(ctx, s.poly, C.blueprint, 0.95, 0.6);
          ctx.save();
          K.clipTo(ctx, s.poly);
          ctx.beginPath();
          const g = s.size / 2.6;
          for (let q = -s.size; q <= s.size; q += g) { ctx.moveTo(q, -s.size); ctx.lineTo(q, s.size); ctx.moveTo(-s.size, q); ctx.lineTo(s.size, q); }
          K.stroke(ctx, C.cyan, 0.6, 0.55);
          ctx.restore();
          K.ink(ctx, s.poly, C.cyan, 1, 0.3, true, 0.9);
          K.line(ctx, -s.size * 0.5, s.size * 0.25, s.size * 0.5, s.size * 0.25, C.cyan, 0.8, 0.2, 0.8);
        } else if (s.type === 1) {
          // a coin, spinning edge-on and back
          const face = Math.cos(a * s.flip + s.rot), rx = s.size * Math.abs(face) + 0.8, ry = s.size;
          const e = K.arc(0, 0, rx, ry, 0, TAU, 0, 3);
          K.fill(ctx, e, face > 0 ? C.gold : '#8C6A2A', 1, 0.4);
          if (rx > 3) K.ink(ctx, K.arc(0, 0, rx * 0.7, ry * 0.7, 0, TAU, 0, 3), C.goldLight, 0.8, 0.2, false, 0.8);
          K.hatch(ctx, e, { angle: 0.8, gap: 2.2, step: 4, amp: 0.2, color: '#4A3310', width: 0.6, alpha: 0.6, density: (px) => K.clamp(px / (rx + 0.1) + 0.3) });
          K.ink(ctx, e, '#5A3F12', 1, 0.2, true, 0.9);
          if (Math.abs(face) > 0.92) K.glow(ctx, -rx * 0.3, -ry * 0.3, 8, '#FFF3C8', 0.7);
        } else {
          // a broken wedge of a gear
          const r = s.size, pts = [], span = s.span;
          for (let k = 0; k < s.teeth; k++) {
            const a1 = (k / s.teeth) * span, dd = span / s.teeth;
            pts.push([Math.cos(a1) * r, Math.sin(a1) * r], [Math.cos(a1 + dd * 0.15) * r * 1.16, Math.sin(a1 + dd * 0.15) * r * 1.16], [Math.cos(a1 + dd * 0.5) * r * 1.16, Math.sin(a1 + dd * 0.5) * r * 1.16], [Math.cos(a1 + dd * 0.65) * r, Math.sin(a1 + dd * 0.65) * r]);
          }
          pts.push([Math.cos(span) * r * 0.55, Math.sin(span) * r * 0.55]);
          for (let k = 8; k >= 0; k--) { const a1 = (k / 8) * span; pts.push([Math.cos(a1) * r * 0.55, Math.sin(a1) * r * 0.55]); }
          K.fill(ctx, pts, '#3A2A10', 1, 0.5);
          K.ink(ctx, pts, C.gold, 1.2, 0.3, true, 0.95);
          K.line(ctx, r * 0.6, 0, r * 0.95, 0, C.goldLight, 0.7, 0.2, 0.7);
        }
        ctx.restore();
      });
    }
  }

  // ---------------------------------------------------------------- weather in screen space
  function windLines(ctx, T, amt) {
    if (amt <= 0.01) return;
    K.seed(1401);
    ctx.beginPath();
    for (const s of streaks) {
      const x0 = ((s.x + T * s.v) % 1700) - 350;
      for (const off of [0, 5]) {
        const pts = [];
        for (let k = 0; k <= 12; k++) {
          const u = k / 12, x = x0 + off * 2 + u * s.len * (off ? 0.7 : 1);
          pts.push([x, s.y + off + Math.sin(u * 3.2 + s.ph) * 7]);
        }
        // the gust ends in a small curl
        if (!off) { const [ex, ey] = pts[pts.length - 1]; for (let k = 1; k <= 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU * 0.8; pts.push([ex + Math.cos(a) * 9 + 9 * 0, ey + 9 + Math.sin(a) * 9]); } }
        K.trace(ctx, pts, 0.5);
      }
    }
    K.stroke(ctx, '#A39AC4', 0.9, 0.16 * amt);
  }

  function rain(ctx, T, amt) {
    const n = Math.floor(drops.length * K.clamp(amt));
    if (n < 1) return;
    for (const pass of [0, 1]) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        if ((d.near ? 1 : 0) !== pass) continue;
        const q = (d.y0 + d.v * T) % 1260, y = q - 130, x = d.x0 + q * 0.2 - 120;
        ctx.moveTo(x, y);
        ctx.lineTo(x - d.len * 0.2, y - d.len);
      }
      K.stroke(ctx, '#BDB5DC', pass ? 1.5 : 0.9, (pass ? 0.5 : 0.36) * Math.min(1, amt * 1.4));
    }
  }

  function splashes(ctx, amt) {
    if (amt <= 0.02) return;
    ctx.beginPath();
    const m = Math.floor(70 * amt);
    for (let k = 0; k < m; k++) {
      const x = K.hash(K.boil * 31 + k * 7) * 1040 - 20, y = hy(x) + 6 + Math.pow(K.hash(K.boil * 17 + k * 3), 1.3) * 250, s = 2 + (y - 750) / 60;
      ctx.moveTo(x - s, y - s * 1.2); ctx.lineTo(x, y); ctx.lineTo(x + s, y - s * 1.2);
    }
    K.stroke(ctx, '#BDB5DC', 0.8, 0.5);
  }

  // ---------------------------------------------------------------- the puddle, and what it holds
  /** Water frame (1000×1000, ripples about (500,540)). Mirrors the last plate's opening frame so the
      crossfade lands on the same stars and the same rings. tw = 0 at the last plate's t = 0. */
  function water(ctx, tt, clear, rainAmt) {
    const tw = tt - 10;
    // the void texture, mirror-tiled so the water has no seams beyond the frame; the centre tile is
    // exactly the last plate's ground
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      ctx.save();
      ctx.translate(500 + i * 1000, 500 + j * 1000);
      ctx.scale(i ? -1 : 1, j ? -1 : 1);
      ctx.drawImage(K.tex.void, -500, -500, 1000, 1000);
      ctx.restore();
    }
    K.glow(ctx, 500, 260, 760, '#3B3253', 0.55 * (1 - clear), 'source-over');
    ctx.save();
    ctx.fillStyle = C.voidInk;
    for (const s of wstars) {
      const y = 380 + (s.y - 380) * 0.8, wob = Math.sin(y * 0.045 + tw * 2.2) * 3;
      const al = clear * (0.25 + 0.75 * s.m) * (0.6 + 0.4 * Math.sin(tw * 1.6 + s.ph));
      if (al < 0.01) continue;
      ctx.globalAlpha = al * K.A;
      const w = 0.8 + s.m * 2.2;
      ctx.fillRect(s.x + wob - w / 2, y - w * 1.6, w, w * 3.2);
    }
    ctx.restore();
    K.glow(ctx, 500, 540, 120, C.soul, 0.4 * clear);
    ctx.save();
    ctx.translate(500, 540);
    ctx.scale(1, 2.4);
    K.glow(ctx, 0, 0, 22, C.soulHot, 0.8 * clear);
    ctx.restore();
    const settle = 1 - K.sr(tw, 0.4, 3.2), stir = 0.45 + 0.55 * K.sr(tt, LEAD1, 3);
    for (let k = 0; k < 6; k++) {
      const age = K.frac(tw * 0.32 + k / 6), r = 30 + age * 560, al = (1 - age) * 0.55 * settle * stir;
      if (al < 0.01) continue;
      K.seed(701 + k);
      K.ink(ctx, K.arc(500, 540, r, r * 0.3, 0, TAU * 1.01), k % 2 ? C.cyan : C.voidInk, 1.2, 1.4, false, al);
    }
    // raindrops landing: small rings, thinning out as the storm passes
    for (const g of rings) {
      const a = tt - g.t;
      if (a < 0 || a > 0.9) continue;
      const r = 4 + a * 64;
      K.seed(g.seed);
      K.ink(ctx, K.arc(g.x, g.y, r, r * 0.3, 0, TAU * 1.01), C.voidInk, 0.9, 0.6, false, (1 - a / 0.9) * 0.45 * K.clamp(rainAmt * 2 + 0.3));
    }
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const y = 600 + k * 24 + ((tw * 6) % 24), x0 = 120 + K.hash(k * 13) * 380, L = 80 + K.hash(k * 7) * 260;
      K.trace(ctx, K.seg(x0, y, x0 + L, y, 14), 1.2);
    }
    K.stroke(ctx, C.voidInk, 0.8, 0.12);
  }

  function puddle(ctx, cam, tt, clear, rainAmt, T, glowI) {
    const base = ctx.getTransform();
    ctx.save();
    ctx.translate(cam.cx, cam.cy);
    ctx.scale(cam.S, cam.S * cam.sq);
    ctx.translate(-500, -500);
    ctx.beginPath();
    ctx.arc(500, 500, 750, 0, TAU);
    ctx.save();
    ctx.clip();
    water(ctx, tt, clear, rainAmt);
    // while we still see it at a slant, the puddle mirrors the lit horizon and the figure's legs
    const m = 1 - K.sr(cam.u, 0.15, 0.6);
    if (m > 0.01) {
      ctx.save();
      ctx.setTransform(base);
      ctx.translate(cam.sx, cam.sy - cam.dy);
      ctx.translate(0, 2 * (FY + 5));
      ctx.scale(1, -1);
      const band = ctx.createLinearGradient(0, 610, 0, 792);
      band.addColorStop(0, 'rgba(140,126,184,0)');
      band.addColorStop(1, 'rgba(170,156,210,0.5)');
      ctx.fillStyle = band;
      ctx.globalAlpha = m;
      ctx.fillRect(-100, 610, 1200, 184);
      ctx.globalAlpha = 1;
      K.fade(0.55 * m, () => { skyline(ctx, T); drawBolt(ctx, tt); figure(ctx, T, glowI); });
      ctx.restore();
    }
    // muddy banks: the water darkens toward its edge while we still see one
    const bank = 1 - cam.u;
    if (bank > 0.01) {
      const g = ctx.createRadialGradient(500, 500, 540, 500, 500, 752);
      g.addColorStop(0, 'rgba(11,9,16,0)');
      g.addColorStop(1, `rgba(11,9,16,${0.9 * bank})`);
      ctx.fillStyle = g;
      ctx.fillRect(-300, -300, 1600, 1600);
    }
    ctx.restore();
    const edge = 1 - cam.u;
    if (edge > 0.01) {
      K.seed(1501);
      K.ink(ctx, K.arc(500, 500, 750, 750, 0, TAU * 1.01, 0, 20), '#000000', 6 / cam.S, 2 / cam.S, false, 0.8 * edge);
      K.ink(ctx, K.arc(500, 500, 745, 745, Math.PI * 1.05, Math.PI * 1.95, 0, 20), LAV_HI, 1.3 / cam.S, 1.5 / cam.S, false, 0.6 * edge);
      K.ink(ctx, K.arc(500, 500, 752, 752, 0.1, Math.PI - 0.1, 0, 20), LAV, 1 / cam.S, 1.5 / cam.S, false, 0.35 * edge);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- camera: tremble, then lower into the water
  function camera(T, tt) {
    let amp = 0.3 + 3.8 * K.sr(T, 0.6, RUMBLE);
    amp *= 1 - K.sr(T, RUMBLE, RUMBLE + 0.9); // the held breath before the strike
    if (tt >= LEAD1) amp += 12 * Math.exp(-(tt - LEAD1) * 5);
    if (FILM.reduced) amp *= 0.2;
    const sx = amp * (K.hash(K.boil * 3 + 1) - 0.5) * 2, sy = amp * 0.7 * (K.hash(K.boil * 5 + 2) - 0.5) * 2;
    // Tilting down: the world slides up and out; the puddle's far edge stays at his feet while the
    // near water, under the lens, opens out until it is the whole frame (the last plate's first frame).
    const u = K.easeInOut(K.range(tt, 5.0, 8.8));
    const dy = 1048 * u, far = FY + 6 - dy;
    const rx = K.lerp(390, 750, u), ry = K.lerp(125, 750, Math.pow(u, 1.25));
    return { u, dy, sx: sx * (1 - u), sy: sy * (1 - u), S: rx / 750, sq: ry / rx, cx: K.lerp(PC[0], 500, u) + sx * (1 - u), cy: far + ry + sy * (1 - u) };
  }

  // ---------------------------------------------------------------- the whole storm, on one clock
  function storm(ctx, T) {
    const tt = T - RUMBLE; // plate VIII time (negative during plate VII)
    const cam = camera(T, tt);
    const open = K.sr(tt, 0, 1.3) + 0.25 * K.sr(tt, 2.2, 6);
    const clear = K.sr(tt, 0.2, 1.4);
    const strike = tt >= LEAD1 ? Math.exp(-(tt - LEAD1) * 3.2) : 0;
    const wind = 0.35 + 0.55 * K.sr(T, 0, RUMBLE) - 0.6 * K.sr(tt, 0, 0.9) + 0.25 * K.sr(tt, 2.2, 3.5);
    const rainAmt = K.sr(tt, 2.0, 3.1) * (1 - 0.55 * K.sr(tt, 4.5, 7.5)) * (1 - K.sr(tt, 7.6, 9.4));
    const scene = 1;
    const glowI = K.clamp(strike * 1.2 + 0.3 * K.sr(tt, LEAD1, 2.4) * (1 - K.sr(tt, 3, 6)));

    ctx.save();
    ctx.translate(cam.sx, cam.sy - cam.dy);
    K.fade(scene, () => {
      const sky = ctx.createLinearGradient(0, -120, 0, 770);
      sky.addColorStop(0, '#0A0813');
      sky.addColorStop(0.55, '#1C172E');
      sky.addColorStop(1, '#40375A');
      ctx.fillStyle = sky;
      ctx.globalAlpha = K.A;
      ctx.fillRect(-40, -800, 1080, 1590);
      ctx.globalAlpha = 1;
      // (the sky above the cloud base is only drawn once the clouds have begun to part)
      K.ruledSky(ctx, { gap: 6, alpha: 0.08, color: LAV, y0: K.lerp(430, -80, K.sr(open, 0, 0.3)), y1: 770, x0: -40, x1: 1040, density: (x, y) => 0.3 + 0.7 * (1 - y / 800) });
      if (open > 0.01) {
        K.drawStars(ctx, skyStars, T, { alpha: clear });
        K.soulStar(ctx, STAR[0], STAR[1], STAR_R, 0.45 + 0.4 * K.sr(tt, 0.3, 1.3) + 0.15 * K.sr(tt, LEAD1, 2.2), T);
      }
      // the pale band of light under a storm
      const band = ctx.createLinearGradient(0, 560, 0, 772);
      band.addColorStop(0, 'rgba(120,108,160,0)');
      const dimBand = 1 - 0.35 * K.sr(T, 1, RUMBLE) * (1 - clear);
      band.addColorStop(0.8, `rgba(120,108,160,${0.42 * dimBand})`);
      band.addColorStop(1, `rgba(160,146,196,${0.25 * dimBand})`);
      ctx.fillStyle = band;
      ctx.globalAlpha = K.A;
      ctx.fillRect(-40, 560, 1080, 215);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        const g = K.clamp((K.n1(T * 0.8 + k * 9.1) - 0.45) / 0.55);
        if (g > 0) K.glow(ctx, 160 + k * 330, 742, 230, '#9C8FD0', 0.34 * g * g * K.sr(T, 1, 5) * (1 - clear * 0.7));
      }
      clouds(ctx, T, open);
      cloudGlow(ctx, T, open, strike);
      K.glow(ctx, STAR[0], STAR[1] + 10, 280, C.soul, (0.05 + 0.07 * K.sr(T, 2, RUMBLE)) * (1 - clear));
      // the storm darkens: hatching laid over the whole sky, thicker as it builds
      const thick = 0.12 + 0.72 * K.sr(T, 0, RUMBLE) - 0.5 * K.sr(tt, LEAD1, 4.5);
      K.hatch(ctx, [[-80, -120], [1080, -120], [1080, 772], [-80, 772]], {
        angle: 0.22, gap: 4.2, step: 10, amp: 0.7, color: '#06040B', width: 0.9, alpha: 0.5,
        density: (x, y) => thick * (0.45 + 0.55 * K.clamp(y / 560)) * (1 - 0.85 * K.sr(y, 520, 690)) * (0.5 + 0.5 * K.n2(x * 0.011 + T * 0.25, y * 0.018)) * (1 - clear * Math.exp(-Math.pow((x - 500) / 260, 2) - Math.pow((y - 170) / 240, 2))),
      });
      skyline(ctx, T);
      ground(ctx, T, wind);
      if (tt >= LEAD1) {
        const a = tt - LEAD1;
        const hb = Math.exp(-Math.pow((a - 0.28) / 0.11, 2)) + 0.75 * Math.exp(-Math.pow((a - 0.6) / 0.11, 2));
        K.thread(ctx, threadPts, T, K.clamp(0.3 * K.sr(a, 0, 0.2) + 0.95 * hb), 1, { speed: 0.45, seed: 1801 });
      }
      drawBolt(ctx, tt);
      figure(ctx, T, glowI);
      drawShards(ctx, tt);
      splashes(ctx, rainAmt * (1 - cam.u));
    });
    ctx.restore();
    puddle(ctx, cam, tt, clear, rainAmt, T, glowI);
    windLines(ctx, T, wind * (1 - cam.u));
    rain(ctx, T, rainAmt);
    // one flash: a negative frame, then white, then gone
    if (tt >= LEAD1 && tt < LEAD1 + 0.9) {
      const a = tt - LEAD1;
      const neg = !FILM.reduced && a < 0.1;
      const lit = (FILM.reduced ? 0.3 : 0.85) * Math.exp(-Math.max(0, a - (neg ? 0 : 0.1)) * 4.2);
      ctx.save();
      if (neg) {
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#E4DEFA';
        ctx.fillRect(0, 0, 1000, 1000);
      } else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lit;
        ctx.fillStyle = '#9C94C8';
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = lit * 0.35;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1000, 1000);
      }
      ctx.restore();
    }
  }

  function init() {
    const r = K.stable(1701);
    sprites = [];
    const boil = K.boil;
    for (let layer = 0; layer < 3; layer++) {
      sprites[layer] = [];
      for (let shape = 0; shape < 3; shape++) {
        sprites[layer][shape] = [];
        for (let v = 0; v < 3; v++) { K.boil = v * 5 + 1; sprites[layer][shape][v] = puffSprite(layer, shape); }
      }
    }
    K.boil = boil;
    puffs = [];
    const add = (layer, n, x0, x1, y0, y1, r0, r1, sx, sq) => {
      for (let i = 0; i < n; i++) {
        puffs.push({ layer, shape: (r() * 3) | 0, x: x0 + ((x1 - x0) * (i + r() * 0.8)) / n, y: y0 + r() * (y1 - y0), r: r0 + r() * (r1 - r0), ph: r() * TAU, drift: 2 + r() * 6, rot: (r() - 0.5) * 0.3, spin: (r() - 0.5) * 0.02, sx: sx * (0.9 + r() * 0.25), sq: sq * (0.9 + r() * 0.2) });
      }
    };
    add(0, 8, -160, 1120, -90, 190, 175, 240, 1.15, 0.95);
    add(1, 10, -140, 1100, 180, 360, 135, 190, 1.2, 0.85);
    add(2, 13, -120, 1080, 430, 490, 95, 130, 1.35, 0.62);
    puffs.sort((a, b) => a.layer - b.layer || a.y - b.y);
    // the backing mass: left and right halves meeting on a wavy seam at x ≈ 500
    const seam = [];
    for (let y = -300; y <= 470; y += 14) seam.push([500 + 14 * Math.sin(y * 0.045) + 6 * K.n1(y * 0.03), y]);
    const base = (x) => 470 + 18 * Math.sin(x * 0.019 + 1) + 10 * K.n1(x * 0.03);
    const left = [[-300, -300], ...seam];
    for (let x = 500; x >= -300; x -= 16) left.push([x, base(x)]);
    const right = [[1300, -300], ...seam];
    for (let x = 500; x <= 1300; x += 16) right.push([x, base(x)]);
    massPoly = [left, right];
    glowPuffs = [2, 7, 12, 19, 25].map((i) => puffs[i % puffs.length]);
    city = [];
    const addB = (x, w, h, spire) => {
      const b = { x, w, h, spire, wins: [] };
      for (let wy = 5; wy < h - 3; wy += 6) for (let wx = 3; wx < w - 3; wx += 5) if (r() < 0.42) b.wins.push({ dx: wx, dy: wy, th: r() });
      city.push(b);
    };
    addB(842, 22, 128, true);
    addB(902, 18, 104, true);
    let x = -10;
    while (x < 290) { const w = 12 + r() * 26; addB(x, w, 14 + r() * 56, r() < 0.12); x += w + r() * 5; }
    x = 612;
    while (x < 1010) { const w = 12 + r() * 30; addB(x, w, 12 + r() * 62 * (1 - Math.abs(x - 850) / 420) + 8, r() < 0.1); x += w + r() * 5; }
    tufts = [];
    for (let i = 0; i < 110; i++) {
      const tx = -20 + r() * 1040, ty = hy(tx) + 5 + Math.pow(r(), 1.5) * 240;
      tufts.push({ x: tx, y: ty, h: 5 + ((ty - 750) / 250) * 18 + r() * 5, n: 3 + ((r() * 3) | 0) });
    }
    bolt = makeBolt(K.stable(4242));
    shards = [];
    for (let i = 0; i < 60; i++) {
      const type = i % 3, size = type === 1 ? 10 + r() * 8 : 18 + r() * 20;
      const poly = [];
      for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + (r() - 0.5) * 0.9, d = size * (0.6 + r() * 0.5); poly.push([Math.cos(a) * d, Math.sin(a) * d]); }
      shards.push({ type, size, poly, ang: -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.9, v: 280 + r() * 620, spin: (r() - 0.5) * 9, rot: r() * TAU, seed: 1000 + i, delay: r() * 0.08, flip: 3 + r() * 7, span: 1.2 + r() * 1.1, teeth: 4 + ((r() * 4) | 0) });
    }
    drops = [];
    for (let i = 0; i < 460; i++) drops.push({ x0: r() * 1300 - 100, y0: r() * 1260, v: 1000 + r() * 600, len: 16 + r() * 22, near: r() < 0.14 });
    rings = [];
    for (let i = 0; i < 70; i++) rings.push({ t: 2.3 + r() * 7.2, x: 60 + r() * 880, y: 380 + r() * 560, seed: 1550 + i });
    streaks = [];
    for (let i = 0; i < 11; i++) streaks.push({ x: r() * 1700, y: 590 + r() * 170, v: 240 + r() * 220, len: 70 + r() * 110, ph: r() * TAU });
    skyStars = K.makeStars(41, 320, -120, -160, 1120, 640);
    wstars = K.makeStars(21, 380, 0, 360, 1000, 1000); // the last plate's reflected sky, star for star
    threadPts = K.spline([[STAR[0], STAR[1] + 12], [512, 330], [546, 520], [CHEST[0], CHEST[1]]], false, 24);
  }

  FILM.scenes.rumble = {
    tone: 'void',
    lines: [{ text: 'Give me the rumble,', at: 1.2 }],
    init,
    draw(ctx, t) { storm(ctx, t); },
    sfx: [{ at: 0.4, kind: 'whoosh' }, { at: 2.9, kind: 'crackle' }, { at: 5.4, kind: 'crackle' }],
    mood: (t) => ({ drone: 0.45, rumble: 0.2 + 0.8 * K.sr(t, 0, RUMBLE), wind: 0.3 + 0.55 * K.sr(t, 0, RUMBLE) }),
  };

  FILM.scenes.thunder = {
    tone: 'void',
    lines: [{ text: 'Settle me a thunder.', at: 2.6 }],
    init() { if (!sprites) init(); },
    draw(ctx, t) { storm(ctx, RUMBLE + t); },
    sfx: [
      { at: LEAD0, kind: 'crackle' },
      { at: LEAD1, kind: 'thunder' },
      { at: LEAD1 + 0.28, kind: 'heart' },
      { at: LEAD1 + 0.6, kind: 'heart' },
      { at: 2.1, kind: 'hiss' },
      { at: 5.0, kind: 'whoosh' },
      { at: 8.6, kind: 'chime' },
    ],
    mood: (t) => ({
      drone: 0.3 + 0.2 * K.sr(t, 6, 10),
      rumble: t < LEAD1 ? 0.9 * (1 - K.sr(t, 0, 1.0)) : 0.55 * (1 - K.sr(t, 2.2, 7)),
      wind: 0.8 * (1 - K.sr(t, 0, 0.9)) + 0.2 * K.sr(t, 2.2, 3.5) * (1 - K.sr(t, 6, 9)),
      rain: K.sr(t, 2.0, 3.1) * (1 - 0.55 * K.sr(t, 4.5, 7.5)) * (1 - K.sr(t, 7.6, 9.4)),
      warm: 0.35 * K.sr(t, LEAD1, 3) + 0.25 * K.sr(t, 7, 10),
    }),
  };
})();
