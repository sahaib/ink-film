// The poem's words in this file are © 2026 Sahaib Singh Arora, all rights reserved — see examples/to-my-mind/NOTICE in the ink-film repository. The code is MIT.
'use strict';
/* Plates III and IV — the memory and the loss.
   III: a child in a locket, praying by an oil lamp; one unbroken thread of light runs to a star.
   IV:  the thread snaps, the lamp dies, the paper stains to blueprint and the grown man is
        measured, forced into the world's two poses, and pinned like a specimen. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;

  // ---------------------------------------------------------------- layout
  const LC = [500, 455], LR = 345;               // locket centre & inner radius
  const FLOOR_Y = 588;
  const LAMP = [588, 700];                       // lamp base centre
  const WICK = [626, 672];
  const WIN = { cx: 702, top: 262, r: 90, x0: 612, x1: 792, y1: 420 };
  const STAR = [738, 226];
  const CHEST = [409, 541];                      // the child's amber point
  const SKIN = '#B7784A', SKIN_DARK = '#7A4A2A', HAIR = '#1C120B', TUNIC = '#E3CFA6';
  const WALL = '#3E2716', FLOOR = '#4E321C', SHADE = '#170D06';
  const BP_LINE = '#DCEBF7', BP_SOFT = '#9CC7E6';

  const beat = (g) => {
    const ph = K.frac(g * 1.2);
    return Math.exp(-Math.pow(ph * 11, 2)) + 0.55 * Math.exp(-Math.pow((ph - 0.2) * 11, 2));
  };

  /** Closed outline around a centre line with the given widths (arms, legs, sleeves). */
  function limb(center, widths, per = 5) {
    const L = [], Rr = [];
    for (let i = 0; i < center.length; i++) {
      const p = center[i], q = center[Math.min(i + 1, center.length - 1)], o = center[Math.max(i - 1, 0)];
      let tx = q[0] - o[0], ty = q[1] - o[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const w = widths[i] / 2;
      L.push([p[0] - ty * w, p[1] + tx * w]);
      Rr.push([p[0] + ty * w, p[1] - tx * w]);
    }
    return K.spline(L.concat(Rr.reverse()), true, per);
  }

  // ---------------------------------------------------------------- the child (profile, facing the lamp)
  const TUNIC_PTS = K.spline([
    [372, 506], [356, 526], [346, 572], [342, 628], [336, 676], [330, 700], [352, 714], [420, 717],
    [476, 709], [490, 690], [476, 667], [442, 657], [420, 651], [414, 612], [419, 566], [411, 522], [398, 508],
  ], true, 6);
  const HEAD_PTS = K.spline([
    [368, 472], [365, 446], [380, 427], [402, 421], [424, 429], [436, 447], [439, 459], [447, 472],
    [439, 478], [441, 486], [434, 497], [418, 505], [398, 505], [377, 493],
  ], true, 6);
  const HAIR_PTS = K.spline([
    [363, 482], [361, 451], [376, 426], [402, 416], [427, 423], [441, 440], [439, 449], [425, 443],
    [410, 447], [399, 459], [393, 477], [380, 490],
  ], true, 6);
  const SLEEVE_PTS = limb([[390, 528], [398, 566], [406, 600], [420, 590], [432, 568]], [24, 23, 21, 18, 15]);
  const HANDS_PTS = K.spline([[424, 574], [425, 548], [435, 522], [446, 508], [451, 522], [447, 550], [440, 574]], true, 6);
  const CHILD_HULL = TUNIC_PTS.concat(HEAD_PTS);

  function drawChild(ctx, g, light) {
    const fx = WICK[0];
    const dark = 1 - light;
    // tunic
    K.seed(2101);
    K.fill(ctx, TUNIC_PTS, K.mix('#6A5238', TUNIC, 0.35 + 0.65 * light), 1, 1.2);
    K.hatch(ctx, TUNIC_PTS, { angle: -1.1, gap: 3.6, step: 8, amp: 0.5, color: '#3A2412', width: 0.9,
      density: (x, y) => K.clamp((fx - x) / 250 - 0.28 + 0.5 * dark + (y > 660 ? 0.15 : 0)) });
    K.hatch(ctx, TUNIC_PTS, { angle: 0.4, gap: 4.4, step: 8, amp: 0.5, color: '#3A2412', width: 0.8,
      density: (x, y) => K.clamp((fx - x) / 250 - 0.62 + 0.6 * dark) });
    // pencil texture in the lit cloth
    K.hatch(ctx, TUNIC_PTS, { angle: 0.9, gap: 5, step: 10, amp: 0.8, color: '#F6E6C4', width: 1.2, alpha: 0.18 * light });
    // folds
    ctx.beginPath();
    K.trace(ctx, K.spline([[362, 560], [372, 610], [368, 660]], false, 6), 0.8);
    K.trace(ctx, K.spline([[410, 664], [446, 676], [474, 690]], false, 6), 0.8);
    K.trace(ctx, K.spline([[352, 690], [396, 700], [440, 704]], false, 6), 0.8);
    K.stroke(ctx, '#3A2412', 1, 0.55);
    K.ink(ctx, TUNIC_PTS, C.ink, 1.8, 0.7, true);

    // head
    K.seed(2111);
    K.fill(ctx, HEAD_PTS, K.mix(SKIN_DARK, SKIN, 0.3 + 0.7 * light), 1, 0.8);
    K.hatch(ctx, HEAD_PTS, { angle: -0.9, gap: 3, step: 6, amp: 0.4, color: '#3A1E0E', width: 0.8,
      density: (x) => K.clamp((fx - x) / 210 - 0.72 + 0.6 * dark) });
    K.glow(ctx, 438, 470, 36, '#FFC989', 0.35 * light, 'screen');
    K.ink(ctx, HEAD_PTS, C.ink, 1.6, 0.5, true);
    // hair
    K.fill(ctx, HAIR_PTS, HAIR, 1, 0.8);
    K.hatch(ctx, HAIR_PTS, { angle: 0.5, gap: 3.2, step: 6, amp: 0.4, color: '#5A3A22', width: 0.8, alpha: 0.7, density: (x, y) => K.clamp(0.9 - (x - 380) / 120) });
    ctx.beginPath();
    for (let k = 0; k < 6; k++) K.trace(ctx, K.spline([[372 + k * 9, 428 + k * 2], [380 + k * 10, 440 + k], [384 + k * 9, 456]], false, 4), 0.4);
    K.stroke(ctx, '#6B4A2E', 0.8, 0.6);
    K.ink(ctx, HAIR_PTS, C.ink, 1.3, 0.4, true);
    // ear, closed eye, brow, mouth
    K.ink(ctx, K.arc(399, 472, 7, 9, -1.3, 1.9), C.ink, 1.2, 0.3);
    K.ink(ctx, K.arc(427, 459, 7, 4, 0.2, 2.9), C.ink, 1.4, 0.2);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) { const a = 0.9 + k * 0.5; ctx.moveTo(427 + Math.cos(a) * 7, 459 + Math.sin(a) * 4); ctx.lineTo(427 + Math.cos(a) * 10, 459 + Math.sin(a) * 7.5); }
    K.stroke(ctx, C.ink, 0.8, 0.8);
    K.ink(ctx, K.spline([[420, 449], [428, 447], [435, 450]], false, 4), C.ink, 1.2, 0.2);
    K.ink(ctx, K.seg(433, 488, 440, 487, 4), '#5A2A18', 1.2, 0.2);

    // near arm & folded hands
    K.seed(2121);
    K.fill(ctx, SLEEVE_PTS, K.mix('#6A5238', TUNIC, 0.4 + 0.6 * light), 1, 0.8);
    K.hatch(ctx, SLEEVE_PTS, { angle: -1.2, gap: 3.4, step: 7, amp: 0.4, color: '#3A2412', width: 0.8, density: (x, y) => K.clamp((fx - x) / 240 - 0.25 + 0.5 * dark + (y > 590 ? 0.2 : 0)) });
    K.ink(ctx, SLEEVE_PTS, C.ink, 1.5, 0.5, true);
    K.fill(ctx, HANDS_PTS, K.mix(SKIN_DARK, SKIN, 0.35 + 0.65 * light), 1, 0.6);
    K.hatch(ctx, HANDS_PTS, { angle: -1.0, gap: 2.6, step: 5, amp: 0.3, color: '#3A1E0E', width: 0.7, density: (x) => K.clamp((446 - x) / 26 + 0.6 * dark) });
    K.ink(ctx, HANDS_PTS, C.ink, 1.3, 0.4, true);
    K.ink(ctx, K.seg(437, 572, 446, 514, 6), C.ink, 0.8, 0.3, false, 0.7);
    K.glow(ctx, 452, 530, 30, '#FFC989', 0.4 * light, 'screen');
  }

  /** The heart: an amber point at the chest, beating. */
  function heart(ctx, g, i) {
    if (i <= 0.01) return;
    const b = beat(g);
    K.glow(ctx, CHEST[0], CHEST[1], 30 + 26 * b, C.soul, (0.3 + 0.35 * b) * i, 'source-over');
    K.glow(ctx, CHEST[0], CHEST[1], 11 + 6 * b, C.soulHot, 0.85 * i, 'source-over');
    ctx.fillStyle = '#FFFBF0';
    ctx.globalAlpha = i * K.A;
    ctx.beginPath(); ctx.arc(CHEST[0], CHEST[1], 2.6 + 1.2 * b, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the room
  const WIN_PTS = K.arc(WIN.cx, WIN.top, WIN.r, WIN.r, Math.PI, TAU, 0, 6).concat([[WIN.x1, WIN.y1], [WIN.x0, WIN.y1]]);
  const WIN_OUT = K.arc(WIN.cx, WIN.top, WIN.r + 16, WIN.r + 16, Math.PI, TAU, 0, 6).concat([[WIN.x1 + 16, WIN.y1 + 8], [WIN.x0 - 16, WIN.y1 + 8]]);
  let winStars = [];

  function lampLightAt(fl, lx, ly) {
    // radius of the lamp's pool of light
    return (x, y) => {
      const d = Math.hypot(x - lx, (y - ly) * 1.15);
      return K.clamp(K.clamp((d - 70 - 150 * fl) / (240 + 230 * fl)) * 0.95 + 0.4 * (1 - fl) + 0.16 * K.n2(x * 0.022, y * 0.022));
    };
  }

  function roomBack(ctx, g, fl, flick) {
    const lx = WICK[0], ly = WICK[1] - 30;
    const dens = lampLightAt(fl * (1 + 0.04 * flick), lx, ly);
    // wall
    ctx.fillStyle = WALL;
    ctx.fillRect(100, 90, 800, FLOOR_Y - 90);
    ctx.fillStyle = FLOOR;
    ctx.fillRect(100, FLOOR_Y, 800, 820 - FLOOR_Y);
    if (fl > 0.01) {
      const gr = ctx.createRadialGradient(lx, ly, 10, lx, ly, 470);
      gr.addColorStop(0, K.rgba('#F2C27E', 0.95 * fl * K.A));
      gr.addColorStop(0.35, K.rgba('#C98A4A', 0.55 * fl * K.A));
      gr.addColorStop(1, K.rgba('#C98A4A', 0));
      ctx.fillStyle = gr;
      ctx.fillRect(100, 90, 800, 730);
    }
    // plaster: long vertical strokes, then tone
    K.seed(2201);
    const wallR = [[100, 90], [900, 90], [900, FLOOR_Y], [100, FLOOR_Y]];
    K.hatch(ctx, wallR, { angle: 1.2, gap: 3.3, step: 15, amp: 0.8, color: SHADE, width: 0.85, density: dens });
    K.hatch(ctx, wallR, { angle: -0.3, gap: 3.9, step: 15, amp: 0.8, color: SHADE, width: 0.8, density: (x, y) => (dens(x, y) - 0.35) / 0.65 });
    K.hatch(ctx, wallR, { angle: 0.45, gap: 4.8, step: 15, amp: 0.8, color: SHADE, width: 0.8, density: (x, y) => (dens(x, y) - 0.7) / 0.3 });
    K.stipple(ctx, wallR, { count: 450, r0: 0.5, r1: 1.3, color: SHADE, alpha: 0.5, density: (x, y) => 0.25 + 0.75 * dens(x, y) });
    // cracks in the plaster
    ctx.beginPath();
    K.trace(ctx, K.spline([[210, 180], [236, 214], [228, 252], [252, 300]], false, 6), 1);
    K.trace(ctx, K.spline([[236, 214], [262, 226], [276, 250]], false, 5), 1);
    K.trace(ctx, K.spline([[520, 120], [512, 160], [530, 190]], false, 5), 1);
    K.stroke(ctx, SHADE, 1, 0.55);
    // floor boards in perspective
    const floorR = [[100, FLOOR_Y], [900, FLOOR_Y], [900, 820], [100, 820]];
    ctx.save();
    K.clipTo(ctx, floorR);
    ctx.beginPath();
    for (let k = -10; k <= 12; k++) {
      const x0 = 500 + k * 46, dx = (x0 - 500) * 2.6;
      K.trace(ctx, K.seg(x0, FLOOR_Y, 500 + dx, 900, 16), 0.8);
    }
    for (const y of [614, 646, 690, 748]) K.trace(ctx, K.seg(100, y, 900, y, 20), 0.6);
    K.stroke(ctx, SHADE, 1.1, 0.7);
    ctx.restore();
    K.hatch(ctx, floorR, { angle: 0.05, gap: 3.8, step: 18, amp: 0.6, color: SHADE, width: 1, density: (x, y) => dens(x, y) * 1.05 });
    K.hatch(ctx, floorR, { angle: -0.9, gap: 4.6, step: 18, amp: 0.6, color: SHADE, width: 0.9, density: (x, y) => (dens(x, y) - 0.45) / 0.55 });
    // skirting
    K.ink(ctx, K.seg(100, FLOOR_Y, 900, FLOOR_Y, 14), SHADE, 2.2, 0.8);
    K.ink(ctx, K.seg(100, FLOOR_Y - 12, 900, FLOOR_Y - 12, 14), SHADE, 1, 0.8, false, 0.6);

    // window: the night outside
    K.seed(2211);
    K.fill(ctx, WIN_OUT, '#2A1A0E', 1, 1);
    K.hatch(ctx, WIN_OUT, { angle: 0.5, gap: 3, step: 8, amp: 0.4, color: '#0E0804', width: 0.9, density: () => 0.55 });
    K.fill(ctx, WIN_PTS, '#132547', 1, 0.6);
    const sky = K.bbox(WIN_PTS);
    K.hatch(ctx, WIN_PTS, { angle: 0.02, gap: 3.4, step: 10, amp: 0.5, color: '#07112A', width: 1, density: (x, y) => K.clamp(1 - (y - sky.y0) / 300) * 0.9 });
    ctx.save();
    K.clipTo(ctx, WIN_PTS);
    for (const s of winStars) {
      const tw = 0.6 + 0.4 * Math.sin(g * (1.3 + s.hue) + s.ph);
      ctx.globalAlpha = (0.35 + 0.65 * s.m) * tw * K.A;
      ctx.fillStyle = '#F4ECD6';
      const z = 1 + s.m * 2;
      ctx.fillRect(s.x - z / 2, s.y - z / 2, z, z);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    brightStar(ctx, g);
    // frame, mullions, sill, deep reveal on the left
    K.seed(2221);
    ctx.beginPath();
    K.trace(ctx, K.seg(WIN.cx, WIN.top - WIN.r, WIN.cx, WIN.y1, 10), 0.6);
    K.trace(ctx, K.seg(WIN.x0, 322, WIN.x1, 322, 10), 0.6);
    K.stroke(ctx, '#2A1A0E', 7, 1);
    ctx.beginPath();
    K.trace(ctx, K.seg(WIN.cx + 2.5, WIN.top - WIN.r + 4, WIN.cx + 2.5, WIN.y1, 10), 0.5);
    K.trace(ctx, K.seg(WIN.x0, 319.5, WIN.x1, 319.5, 10), 0.5);
    K.stroke(ctx, '#C98A4A', 1, 0.55 * fl);
    K.ink(ctx, WIN_PTS, '#140B05', 2.2, 0.6, true);
    K.ink(ctx, WIN_OUT, '#140B05', 1.6, 0.8, true);
    const reveal = [[WIN.x0, WIN.top], [WIN.x0 + 14, WIN.top + 6], [WIN.x0 + 14, WIN.y1 - 2], [WIN.x0, WIN.y1]];
    K.fill(ctx, reveal, '#1A0F07', 0.8, 0.3);
    const sill = [[WIN.x0 - 26, WIN.y1 + 8], [WIN.x1 + 26, WIN.y1 + 8], [WIN.x1 + 20, WIN.y1 + 22], [WIN.x0 - 20, WIN.y1 + 22]];
    K.fill(ctx, sill, '#5A3A20', 1, 0.6);
    K.hatch(ctx, sill, { angle: 0, gap: 3, step: 10, color: SHADE, width: 0.8, density: (x) => K.clamp((x - 600) / 300 + 0.2) });
    K.ink(ctx, sill, SHADE, 1.4, 0.6, true);
    // light on the sill and mullion from the lamp
    K.glow(ctx, WIN.x0 + 30, WIN.y1 + 14, 60, '#F2C27E', 0.25 * fl, 'screen');
  }

  /** The one bright star the thread is tied to. */
  function brightStar(ctx, g) {
    const tw = 0.85 + 0.15 * Math.sin(g * 2.1);
    ctx.save();
    ctx.beginPath(); K.path(ctx, WIN_PTS); ctx.clip();
    K.glow(ctx, STAR[0], STAR[1], 110, '#FFE6A8', 0.45 * tw, 'screen');
    K.glow(ctx, STAR[0], STAR[1], 30, '#FFFFFF', 0.85, 'screen');
    ctx.restore();
    K.seed(2215);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, L = k % 2 ? 11 : 30 * tw;
      K.trace(ctx, K.seg(STAR[0] + Math.cos(a) * 4, STAR[1] + Math.sin(a) * 4, STAR[0] + Math.cos(a) * L, STAR[1] + Math.sin(a) * L, 4), 0.3);
    }
    K.stroke(ctx, '#FFF4D6', 1.5, 0.95);
    ctx.fillStyle = '#FFFBF0';
    ctx.globalAlpha = K.A;
    ctx.beginPath(); ctx.arc(STAR[0], STAR[1], 4.5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** A wider warm glow under the thread so it reads against the dark room. */
  function threadGlow(ctx, pts, i) {
    if (i <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.beginPath(); K.path(ctx, pts, false);
    K.stroke(ctx, C.soul, 7, 0.22 * i);
    ctx.restore();
  }

  /** The child's shadow thrown up the wall by the lamp — it breathes with the flame. */
  function castShadow(ctx, g, fl, flick) {
    if (fl <= 0.02) return;
    const L = [WICK[0], WICK[1] - 26], k = 1.6 + 0.05 * flick;
    const proj = (p) => [L[0] + (p[0] - L[0]) * k, L[1] + (p[1] - L[1]) * k * 0.92];
    const hull = K.spline(CHILD_HULL.filter((_, i) => i % 3 === 0).map(proj), true, 2);
    const wall = [[100, 90], [900, 90], [900, FLOOR_Y], [100, FLOOR_Y]];
    ctx.save();
    K.clipTo(ctx, wall);
    K.seed(2301);
    K.fill(ctx, hull, SHADE, 0.35 * fl, 2);
    K.crosshatch(ctx, hull, { angle: 0.8, gap: 3.4, step: 10, amp: 0.8, color: SHADE, width: 1, alpha: 0.75 * fl, density: () => 0.8 });
    ctx.restore();
  }

  function mat(ctx) {
    K.seed(2311);
    const m = K.arc(400, 712, 150, 26);
    K.fill(ctx, m, '#8A3A22', 1, 1);
    ctx.save();
    K.clipTo(ctx, m);
    ctx.beginPath();
    for (let x = 250; x < 560; x += 14) K.trace(ctx, K.seg(x, 684, x + 10, 742, 8), 0.4);
    K.stroke(ctx, '#D9A441', 2.4, 0.6);
    ctx.beginPath();
    for (let y = 692; y < 740; y += 8) K.trace(ctx, K.seg(240, y, 560, y, 16), 0.4);
    K.stroke(ctx, SHADE, 0.9, 0.5);
    ctx.restore();
    K.ink(ctx, m, SHADE, 1.5, 0.6, true);
    ctx.beginPath();
    for (let k = 0; k < 22; k++) { const a = Math.PI * 0.12 + (k / 21) * Math.PI * 0.76, x = 400 + Math.cos(a) * 150, y = 712 + Math.sin(a) * 26; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 6, y + 8); }
    K.stroke(ctx, '#D9A441', 1, 0.7);
  }

  function lamp(ctx, g, fl, lit, flick) {
    K.seed(2401);
    // shadow on the floor
    ctx.save();
    ctx.translate(LAMP[0] - 14, LAMP[1] + 6);
    ctx.scale(1, 0.22);
    K.fill(ctx, K.arc(0, 0, 60, 60), SHADE, 0.5, 0.5);
    ctx.restore();
    const body = K.spline([[548, 700], [551, 684], [574, 677], [604, 679], [628, 671], [633, 676], [620, 688], [604, 701], [576, 705]], true, 6);
    K.fill(ctx, body, '#9A4E2A', 1, 1);
    K.hatch(ctx, body, { angle: -0.4, gap: 2.6, step: 6, amp: 0.3, color: '#3A160A', width: 0.9, density: (x, y) => K.clamp((y - 680) / 26 + (600 - x) / 120 * 0.4) });
    K.ink(ctx, body, C.ink, 1.6, 0.5, true);
    // oil well & rim highlight
    K.fill(ctx, K.arc(582, 682, 18, 5), '#2A1208', 1, 0.3);
    K.ink(ctx, K.arc(582, 682, 18, 5), C.ink, 1, 0.3);
    K.ink(ctx, K.spline([[556, 684], [578, 678], [606, 680], [626, 672]], false, 5), '#F2C27E', 1.4, 0.3, false, 0.35 + 0.6 * fl);
    // decorative incised dots
    ctx.beginPath();
    for (let k = 0; k < 7; k++) { const x = 560 + k * 7, y = 693 + Math.sin(k * 0.8) * 1.5; ctx.moveTo(x + 1.2, y); ctx.arc(x, y, 1.2, 0, TAU); }
    ctx.fillStyle = '#3A160A'; ctx.globalAlpha = K.A; ctx.fill(); ctx.globalAlpha = 1;
    // wick
    K.ink(ctx, K.seg(625, 673, 628, 664, 3), SHADE, 2, 0.2);
    if (lit > 0.02) K.glow(ctx, 628, 664, 9, C.ember, lit, 'screen');
    if (fl > 0.01) K.flame(ctx, 628, 666, 50, g, fl, { beat: beat(g) * 0.9, mode: 'screen', seed: 23 });
  }

  // ---------------------------------------------------------------- the thread
  function threadPts(g, fl) {
    const sway = K.n1(g * 1.9 + 23) * 50 * 0.14;
    const tip = [628 + sway, 666 - 50 * (1 + 0.12 * K.n1(g * 7.3 + 23))];
    return K.bez(tip, [660, 540], [640, 380], STAR, 70);
  }

  function dustMotes(ctx, g, fl) {
    if (fl <= 0.02) return;
    const r = K.stable(55);
    for (let k = 0; k < 26; k++) {
      const x0 = 440 + r() * 360, y0 = 420 + r() * 300, sp = 6 + r() * 10, ph = r() * TAU;
      const y = y0 - ((g * sp + ph * 20) % 260), x = x0 + Math.sin(g * 0.6 + ph) * 12;
      const d = Math.hypot(x - WICK[0], y - WICK[1]);
      const a = K.clamp(1 - d / 300) * fl * (0.5 + 0.5 * Math.sin(g * 2 + ph));
      if (a > 0.02) K.glow(ctx, x, y, 4, '#FFE6A8', 0.8 * a, 'screen');
    }
  }

  // ---------------------------------------------------------------- the locket
  let stripes = null;
  function sunburst(ctx, g) {
    ctx.save();
    ctx.translate(LC[0], LC[1]);
    ctx.rotate(g * 0.012);
    ctx.beginPath();
    for (let k = 0; k < 40; k += 2) {
      const a0 = (k / 40) * TAU, a1 = ((k + 1) / 40) * TAU;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a0) * 900, Math.sin(a0) * 900);
      ctx.lineTo(Math.cos(a1) * 900, Math.sin(a1) * 900);
      ctx.closePath();
    }
    ctx.fillStyle = K.rgba('#D9A441', 0.12 * K.A);
    ctx.fill();
    ctx.restore();
    K.seed(2501);
    K.ruledSky(ctx, { gap: 7, color: '#8A6A3A', alpha: 0.12, density: (x, y) => K.clamp(Math.hypot(x - LC[0], y - LC[1]) / 700) });
  }

  function locketFrame(ctx, g) {
    const [cx, cy] = LC, R0 = LR, R1 = LR + 30;
    K.seed(2511);
    // drop shadow onto the paper
    ctx.save();
    ctx.translate(8, 10);
    K.fill(ctx, (c) => { c.arc(cx, cy, R1 + 4, 0, TAU); c.arc(cx, cy, R0, 0, TAU, true); }, '#3A2412', 0.18, 0);
    ctx.restore();
    const band = (c) => { c.arc(cx, cy, R1, 0, TAU); c.arc(cx, cy, R0, 0, TAU, true); };
    K.fill(ctx, band, '#B58A45', 1, 0.8);
    const lit = (x, y) => { const nx = (x - cx) / R1, ny = (y - cy) / R1; return K.clamp(0.45 + 0.6 * (nx * 0.6 + ny * 0.8)); };
    K.hatch(ctx, band, { angle: 0.7, gap: 2.8, step: 8, amp: 0.4, color: '#4A2A10', width: 0.9, density: lit, bbox: { x0: cx - R1, y0: cy - R1, x1: cx + R1, y1: cy + R1 } });
    K.hatch(ctx, band, { angle: -0.6, gap: 3.4, step: 8, amp: 0.4, color: '#4A2A10', width: 0.8, density: (x, y) => (lit(x, y) - 0.6) / 0.4, bbox: { x0: cx - R1, y0: cy - R1, x1: cx + R1, y1: cy + R1 } });
    K.ink(ctx, K.arc(cx, cy, R1, R1, 0, TAU * 1.01), C.ink, 2, 0.7);
    K.ink(ctx, K.arc(cx, cy, R0, R0, 0, TAU * 1.01), C.ink, 2, 0.7);
    K.ink(ctx, K.arc(cx, cy, R0 + 7, R0 + 7, 0, TAU * 1.01), C.ink, 0.9, 0.5, false, 0.8);
    K.ink(ctx, K.arc(cx, cy, R0 - 6, R0 - 6, 0, TAU * 1.01), '#8A6A3A', 1, 0.5, false, 0.6);
    // beads
    ctx.beginPath();
    const bead = [];
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * TAU, x = cx + Math.cos(a) * (R0 + 18), y = cy + Math.sin(a) * (R0 + 18);
      ctx.moveTo(x + 4, y); ctx.arc(x, y, 4, 0, TAU);
      bead.push([x, y]);
    }
    ctx.fillStyle = '#E2C07A'; ctx.globalAlpha = K.A; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const [x, y] of bead) { ctx.moveTo(x - 1.6, y - 1.2); ctx.arc(x - 1.2, y - 1.2, 1.2, 0, TAU); }
    ctx.fillStyle = '#FFF4D6'; ctx.globalAlpha = 0.8 * K.A; ctx.fill(); ctx.globalAlpha = 1;
    // bail (the loop the chain passes through) and its collar
    const by = cy - R1 - 24;
    K.fill(ctx, K.arc(cx, by, 26, 26), '#B58A45', 1, 0.6);
    K.fill(ctx, K.arc(cx, by, 14, 14), K.C.paper, 1, 0);
    K.hatch(ctx, (c) => { c.arc(cx, by, 26, 0, TAU); c.arc(cx, by, 14, 0, TAU, true); }, { angle: 0.7, gap: 2.6, step: 6, color: '#4A2A10', width: 0.8, density: (x, y) => K.clamp(0.4 + (x - cx) / 40 + (y - by) / 40), bbox: { x0: cx - 26, y0: by - 26, x1: cx + 26, y1: by + 26 } });
    K.ink(ctx, K.arc(cx, by, 26, 26), C.ink, 1.6, 0.4);
    K.ink(ctx, K.arc(cx, by, 14, 14), C.ink, 1.2, 0.3);
    const collar = [[cx - 20, cy - R1 + 6], [cx - 14, cy - R1 - 12], [cx + 14, cy - R1 - 12], [cx + 20, cy - R1 + 6]];
    K.fill(ctx, collar, '#9C7438', 1, 0.5);
    K.hatch(ctx, collar, { angle: 1.4, gap: 2.4, step: 6, color: '#4A2A10', width: 0.8, density: (x) => K.clamp((x - cx + 10) / 30) });
    K.ink(ctx, collar, C.ink, 1.4, 0.4, true);
    // hinge knuckles on the right edge
    for (let k = -1; k <= 1; k++) {
      const hy = cy + k * 26, kn = [[cx + R1 - 4, hy - 11], [cx + R1 + 14, hy - 11], [cx + R1 + 18, hy], [cx + R1 + 14, hy + 11], [cx + R1 - 4, hy + 11]];
      K.fill(ctx, kn, k === 0 ? '#9C7438' : '#C79A52', 1, 0.4);
      K.hatch(ctx, kn, { angle: 0, gap: 2.4, step: 5, color: '#4A2A10', width: 0.7, density: (x, y) => K.clamp((y - hy + 4) / 14) });
      K.ink(ctx, kn, C.ink, 1.2, 0.3, true);
    }
  }

  function pencilWork(ctx, g) {
    const [cx, cy] = LC;
    K.seed(2531);
    const col = '#7A5A32';
    K.ink(ctx, K.arc(cx, cy, LR + 58, LR + 58, -2.6, 0.2), col, 0.8, 0.9, false, 0.35);
    K.ink(ctx, K.arc(cx, cy, LR + 74, LR + 74, 1.9, 3.9), col, 0.7, 0.9, false, 0.28);
    ctx.beginPath();
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU, r0 = LR + 58, L = k % 6 ? 5 : 12;
      if (a > 0.2 && a < 3.68) continue;
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * (r0 + L), cy + Math.sin(a) * (r0 + L));
    }
    K.stroke(ctx, col, 0.7, 0.35);
    ctx.save(); ctx.setLineDash([3, 8]);
    K.ink(ctx, K.seg(cx - LR - 110, cy, cx - LR - 36, cy, 10), col, 0.7, 0.4, false, 0.4);
    K.ink(ctx, K.seg(cx + LR + 60, cy, cx + LR + 120, cy, 10), col, 0.7, 0.4, false, 0.4);
    K.ink(ctx, K.seg(cx, cy + LR + 36, cx, cy + LR + 80, 10), col, 0.7, 0.4, false, 0.4);
    ctx.restore();
    // a compass point pricked into the paper, and the arc it swung
    K.ink(ctx, K.arc(96, 150, 4, 4), col, 0.8, 0.2, false, 0.45);
    K.ink(ctx, K.arc(96, 150, 150, 150, 0.1, 1.2), col, 0.7, 0.8, false, 0.25);
  }

  function glass(ctx) {
    // the locket glass catches the light: one curved sheen, top-left
    K.seed(2521);
    const [cx, cy] = LC;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    K.ink(ctx, K.arc(cx, cy, LR - 30, LR - 30, 3.55, 4.35), '#FFF8E6', 9, 0.6, false, 0.1);
    K.ink(ctx, K.arc(cx, cy, LR - 52, LR - 52, 3.7, 4.2), '#FFF8E6', 3, 0.6, false, 0.14);
    ctx.restore();
  }

  function filmDust(ctx, amount) {
    const r = K.mulberry((K.boil * 7919 + 13) >>> 0);
    ctx.save();
    for (let k = 0; k < 7; k++) {
      const x = r() * 1000, y = r() * 1000, s = 0.6 + r() * 2.2;
      ctx.globalAlpha = (0.2 + r() * 0.35) * amount * K.A;
      ctx.fillStyle = r() > 0.3 ? '#2B1A10' : '#FFF4DE';
      ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
    if (r() > 0.55) {
      const x = r() * 1000, y = r() * 1000;
      ctx.globalAlpha = 0.3 * amount * K.A;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 20, y + r() * 30, x + 10, y + 40, x + 30 + r() * 20, y + 55);
      ctx.strokeStyle = '#2B1A10'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    ctx.restore();
  }

  /** Plate III's composition. g = memory time (continues into plate IV).
      s: { fl: flame 0..1, lit: ember at wick, thread: fn(ctx, g), heartI, zoom } */
  function memoryScene(ctx, g, s) {
    K.paper(ctx, '#E7C98F', 0.28);
    sunburst(ctx, g);
    const flick = K.n1(g * 6.3) * 0.6 + K.n1(g * 13.1) * 0.4;
    // interior, inside the locket glass
    ctx.save();
    ctx.beginPath(); ctx.arc(LC[0], LC[1], LR + 1, 0, TAU); ctx.clip();
    const zi = s.zoom;
    ctx.translate(560, 520); ctx.scale(zi, zi); ctx.translate(-560, -520);
    roomBack(ctx, g, s.fl, flick);
    castShadow(ctx, g, s.fl, flick);
    mat(ctx);
    drawChild(ctx, g, K.clamp(0.25 + 0.75 * s.fl));
    heart(ctx, g, s.heartI);
    lamp(ctx, g, s.fl, s.lit, flick);
    if (s.extra) s.extra(ctx);
    if (s.thread) s.thread(ctx, g);
    // the room's warm light over everything, then motes
    if (s.fl > 0.01) K.glow(ctx, WICK[0], WICK[1] - 30, 300 + 20 * flick, '#F3A53A', 0.22 * s.fl, 'screen');
    dustMotes(ctx, g, s.fl);
    // memory vignette at the rim of the glass
    const vg = ctx.createRadialGradient(LC[0], LC[1], LR * 0.62, LC[0], LC[1], LR * 1.05);
    vg.addColorStop(0, 'rgba(40,22,10,0)');
    vg.addColorStop(1, K.rgba('#28160A', 0.55 * K.A));
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 1100, 1100);
    ctx.restore();
    glass(ctx);
    pencilWork(ctx, g);
    locketFrame(ctx, g);
    if (!s.noDust) filmDust(ctx, 1);
  }

  // ---------------------------------------------------------------- PLATE III
  FILM.scenes.memory = {
    tone: 'paper',
    lines: [
      { text: 'I remember my days,', at: 1.3 },
      { text: 'When I had truthful faith.', at: 4.2 },
    ],
    sfx: [{ at: 1.0, kind: 'chime' }].concat(Array.from({ length: 11 }, (_, k) => ({ at: 0.45 + k / 1.2, kind: 'heart' }))),
    mood: (t) => ({ drone: 0.25, warm: 0.8 }),
    init() {
      const r = K.stable(404);
      winStars = [];
      for (let k = 0; k < 46; k++) winStars.push({ x: WIN.x0 + r() * (WIN.x1 - WIN.x0), y: WIN.top - WIN.r + r() * (WIN.y1 - WIN.top + WIN.r), m: Math.pow(r(), 2.5), ph: r() * TAU, hue: r() });
    },
    draw(ctx, t) {
      const g = t;
      memoryScene(ctx, g, {
        fl: 1, lit: 1, heartI: 1,
        zoom: 1 + 0.07 * (g / 10),
        thread: (c, gg) => {
          const pts = threadPts(gg, 1), rv = K.easeInOut(K.range(t, 0.9, 3.6));
          threadGlow(c, K.part(pts, rv), rv > 0 ? 1 : 0);
          K.thread(c, pts, gg, 1, rv, { mode: 'screen', seed: 2601, speed: 0.28, width: 1.6 });
        },
      });
    },
  };

  // ---------------------------------------------------------------- PLATE IV
  const SNAP = 0.52;
  function snappedThread(ctx, g, t) {
    const pts = threadPts(g, 1), n = pts.length - 1;
    const p = K.easeOut(K.range(t, 0.55, 1.7));
    const i = 1 - K.sr(t, 1.3, 3.0);
    if (t < 0.55) { threadGlow(ctx, pts, 1); K.thread(ctx, pts, g, 1, 1, { mode: 'screen', seed: 2601, speed: 0.28, width: 1.6 }); return; }
    if (i <= 0.01) return;
    const cut = Math.round(SNAP * n);
    const curl = (piece, end, dirSign) => {
      // the free end springs back and coils like a cut wire
      const a = piece[piece.length - 1], b = piece[Math.max(0, piece.length - 4)];
      let ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      const out = piece.slice();
      let x = a[0], y = a[1], rad = 16 * p;
      for (let k = 0; k < 16; k++) {
        ang += dirSign * 0.42 * p;
        rad *= 0.9;
        x += Math.cos(ang) * rad * 0.6; y += Math.sin(ang) * rad * 0.6;
        out.push([x, y]);
      }
      return out;
    };
    const lowEnd = Math.max(2, Math.round(cut - 0.34 * n * p));
    const upStart = Math.min(n - 2, Math.round(cut + 0.28 * n * p));
    const low = curl(pts.slice(0, lowEnd), true, 1);
    const up = curl(pts.slice(upStart).reverse(), false, -1);
    threadGlow(ctx, low, i); threadGlow(ctx, up, i * 0.9);
    K.thread(ctx, low, g, i, 1, { mode: 'screen', seed: 2603, speed: 0, width: 1.5 });
    K.thread(ctx, up, g, i * 0.9, 1, { mode: 'screen', seed: 2605, speed: 0, width: 1.5 });
    // sparks from the break
    const [sx, sy] = pts[cut], age = t - 0.55;
    if (age < 1.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      for (let k = 0; k < 18; k++) {
        const a = K.hash(k * 13 + 1) * TAU, v = 60 + K.hash(k * 7 + 2) * 150;
        const x = sx + Math.cos(a) * v * age, y = sy + Math.sin(a) * v * age + 90 * age * age;
        const x2 = x - Math.cos(a) * 9, y2 = y - Math.sin(a) * 9 - 3;
        ctx.moveTo(x2, y2); ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#FFE6A8'; ctx.lineWidth = 1.4; ctx.globalAlpha = (1 - age / 1.2) * K.A; ctx.stroke();
      ctx.restore();
      K.glow(ctx, sx, sy, 60, '#FFE6A8', 0.7 * (1 - age / 0.8), 'screen');
    }
  }

  function smoke(ctx, g, t) {
    const a = K.sr(t, 2.3, 2.8) * (1 - K.sr(t, 4.6, 6.2));
    if (a <= 0.01) return;
    const len = 60 + 260 * K.easeOut(K.range(t, 2.3, 4.8));
    K.seed(2701);
    for (let k = 0; k < 4; k++) {
      const pts = [];
      for (let s = 0; s <= 1.0001; s += 0.04) {
        const y = 662 - s * len;
        const x = 628 + Math.sin(s * 7 + g * 1.7 + k * 1.3) * 16 * s + K.n1(k * 5 + s * 3 + g * 0.6) * 22 * s - 30 * s * s;
        pts.push([x, y]);
      }
      K.ink(ctx, pts, '#CFC6B6', 1.4 + k * 0.3, 0.8, false, a * (0.55 - k * 0.1));
    }
  }

  // blueprint: the Vitruvian construction
  const VC = [500, 450], VR = 330, VH = 534, VTOP = 246, VBOT = 780, VX0 = 233, VX1 = 767;
  const SHL = [444, 346], SHR = [556, 346], HIPL = [476, 528], HIPR = [524, 528];
  const ARM_A = Math.PI, ARM_B = Math.PI + 0.448, LEG_A = 1.528, LEG_B = 2.128;
  const ARM_LEN = 190, LEG_LEN = 236;

  /** Centre line of a limb: joint → … → end, with a gentle bend (5 points). */
  function limbLine(j, ang, len, bend) {
    const dx = Math.cos(ang), dy = Math.sin(ang), pts = [];
    for (const u of [0, 0.25, 0.5, 0.75, 1]) {
      const b = Math.sin(Math.PI * u) * bend;
      pts.push([j[0] + dx * len * u - dy * b, j[1] + dy * len * u + dx * b]);
    }
    return pts;
  }
  const mirrorAng = (a) => Math.PI - a;
  function poseLimbs(w, tremor) {
    const aa = K.lerp(ARM_A, ARM_B, w) + tremor * 0.03, la = K.lerp(LEG_A, LEG_B, w) + tremor * 0.02;
    return {
      armL: limbLine(SHL, aa, ARM_LEN, -5), armR: limbLine(SHR, mirrorAng(aa), ARM_LEN, 5),
      legL: limbLine(HIPL, la, LEG_LEN, 6), legR: limbLine(HIPR, mirrorAng(la), LEG_LEN, -6),
    };
  }
  const TORSO = K.spline([
    [487, 318], [470, 326], [447, 334], [436, 348], [442, 374], [452, 410], [460, 446], [462, 470], [456, 500],
    [454, 524], [470, 546], [500, 556], [530, 546], [546, 524], [544, 500], [538, 470], [540, 446], [548, 410],
    [558, 374], [564, 348], [553, 334], [530, 326], [513, 318],
  ], true, 5);
  const VHEAD = K.spline([[500, 246], [522, 252], [530, 272], [528, 294], [518, 310], [500, 318], [482, 310], [472, 294], [470, 272], [478, 252]], true, 5);
  const VHAIR = K.spline([[471, 280], [471, 258], [484, 246], [500, 242], [516, 246], [529, 258], [529, 280], [523, 266], [512, 258], [500, 257], [488, 258], [477, 266]], true, 5);
  const VNECK = [[489, 312], [489, 330], [511, 330], [511, 312]];

  function limbShapes(L) {
    return {
      armL: limb(L.armL, [30, 25, 19, 18, 12]), armR: limb(L.armR, [30, 25, 19, 18, 12]),
      legL: limb(L.legL, [44, 36, 24, 25, 14]), legR: limb(L.legR, [44, 36, 24, 25, 14]),
    };
  }
  /** Hands and feet, fixed to the limb ends. Returns shapes (filled by the caller). */
  function extremities(L) {
    const out = [];
    for (const k of ['armL', 'armR']) {
      const a = L[k][3], e = L[k][4], ang = Math.atan2(e[1] - a[1], e[0] - a[0]);
      out.push(K.xf(K.spline([[0, -6], [14, -8], [26, -3], [28, 2], [16, 7], [0, 6]], true, 4), e[0], e[1], 1, ang));
    }
    for (const k of ['legL', 'legR']) {
      const e = L[k][4], s = k === 'legL' ? -1 : 1;
      out.push(K.spline([[e[0] - 7, e[1] - 4], [e[0] + 7, e[1] - 4], [e[0] + s * 8 + 6 * s, e[1] + 10], [e[0] + s * 22, e[1] + 14], [e[0] - s * 6, e[1] + 14]], true, 4));
    }
    return out;
  }

  function flickW(t) {
    // the limbs are forced from pose to pose; after the pins land they stay spread
    if (t >= 6.8) return 1 + 0.18 * Math.exp(-(t - 6.8) * 9) * Math.sin((t - 6.8) * 40);
    const per = 0.62, k = Math.floor(t / per), ph = (t - k * per) / 0.16;
    const from = k % 2 ? 1 : 0, to = 1 - from;
    if (ph >= 1) return to;
    const e = K.clamp(ph), back = 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2); // overshoot
    return from + (to - from) * back;
  }

  function arrow(ctx, x, y, ang, s, color, alpha) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang + 0.35) * s, y + Math.sin(ang + 0.35) * s);
    ctx.lineTo(x, y);
    ctx.lineTo(x + Math.cos(ang - 0.35) * s, y + Math.sin(ang - 0.35) * s);
    K.stroke(ctx, color, 1, alpha);
  }

  function pin(ctx, x, y, age) {
    if (age < 0) return;
    const s = 1 + 0.8 * Math.max(0, 1 - age / 0.12);
    const a = K.clamp(age / 0.08);
    if (age < 0.5) K.ink(ctx, K.arc(x, y, 8 + age * 90, 8 + age * 90), BP_LINE, 1, 0.5, false, 0.6 * (1 - age / 0.5));
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    K.seed(2801 + Math.round(x));
    K.ink(ctx, K.seg(2, 2, 12, 16, 4), '#050B18', 2.4, 0.2, false, 0.55 * a);
    K.fill(ctx, K.arc(0, 0, 7.5, 7.5), '#E6EBF0', a, 0.3);
    K.hatch(ctx, K.arc(0, 0, 7.5, 7.5), { angle: 0.8, gap: 2, step: 4, color: '#23406E', width: 0.8, alpha: a, density: (px, py) => K.clamp(0.3 + (px + py) / 12) });
    K.ink(ctx, K.arc(0, 0, 7.5, 7.5), '#050B18', 1.4, 0.2, false, a);
    ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = a * K.A; ctx.beginPath(); ctx.arc(-2.4, -2.4, 1.8, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
  }

  function blueprintGround(ctx, wet = 0) {
    K.paper(ctx, '#1E4C8E', 0.95, 'multiply');
    if (mottle) {
      // pigment settles unevenly, and the paper's fibres still show through the ink
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = (0.32 + 0.68 * wet) * K.A;
      ctx.drawImage(mottle, 0, 0, 1000, 1000);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = (0.45 + 0.35 * wet) * K.A;
      ctx.drawImage(fibres, 0, 0, 1000, 1000);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = K.A;
    ctx.beginPath();
    for (let x = 0; x <= 1000; x += 25) { ctx.moveTo(x, 0); ctx.lineTo(x, 1000); }
    for (let y = 0; y <= 1000; y += 25) { ctx.moveTo(0, y); ctx.lineTo(1000, y); }
    ctx.strokeStyle = K.rgba(BP_SOFT, 0.09); ctx.lineWidth = 0.6; ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= 1000; x += 125) { ctx.moveTo(x, 0); ctx.lineTo(x, 1000); }
    for (let y = 0; y <= 1000; y += 125) { ctx.moveTo(0, y); ctx.lineTo(1000, y); }
    ctx.strokeStyle = K.rgba(BP_SOFT, 0.17); ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
    // registration targets
    K.seed(2811);
    for (const [x, y] of [[62, 62], [938, 62], [938, 938]]) {
      K.ink(ctx, K.arc(x, y, 12, 12), BP_SOFT, 1, 0.3, false, 0.5);
      K.line(ctx, x - 20, y, x + 20, y, BP_SOFT, 0.8, 0.2, 0.5);
      K.line(ctx, x, y - 20, x, y + 20, BP_SOFT, 0.8, 0.2, 0.5);
    }
  }

  function vitruvian(ctx, t, dur) {
    const q = (a, b) => K.sr(t, a, b);
    const W_ = flickW(t);
    const tremor = t < 6.8 ? K.n1(t * 9) : 0;
    // pins: hands, then feet
    const PIN_T = [6.8, 7.1, 7.4, 7.7];
    let shake = 0;
    for (const pt of PIN_T) if (t > pt && t < pt + 0.2) shake = Math.max(shake, 1 - (t - pt) / 0.2);
    const sx = FILM.reduced ? 0 : K.rs(3.2 * shake), sy = FILM.reduced ? 0 : K.rs(3.2 * shake);
    // the whole construction settles to exact centre by the end (match cut to the clock face)
    const z = K.lerp(1.05, 1, K.sr(t, 3, 9));
    ctx.save();
    ctx.translate(VC[0] + sx, VC[1] + sy); ctx.scale(z, z); ctx.translate(-VC[0], -VC[1]);
    const endA = 1 - 0.45 * K.sr(t, 9.0, 10.2); // everything but the circle recedes at the end

    K.fade(endA, () => {
      // square, side by side
      K.seed(2901);
      const sq = [[VX0, VBOT], [VX0, VTOP], [VX1, VTOP], [VX1, VBOT], [VX0, VBOT]];
      for (let k = 0; k < 4; k++) {
        const p = q(3.6 + k * 0.3, 3.95 + k * 0.3);
        if (p <= 0) continue;
        const a = sq[k], b = sq[k + 1];
        K.ink(ctx, K.part(K.seg(a[0], a[1], b[0], b[1], 10), p), BP_LINE, 1.6, 0.6, false, 0.9);
      }
      // square diagonals & centre cross (groin)
      ctx.save(); ctx.setLineDash([4, 8]);
      const dp = q(5.2, 6.0);
      if (dp > 0) {
        K.ink(ctx, K.part(K.seg(VX0, VTOP, VX1, VBOT, 12), dp), BP_SOFT, 0.8, 0.4, false, 0.4);
        K.ink(ctx, K.part(K.seg(VX1, VTOP, VX0, VBOT, 12), dp), BP_SOFT, 0.8, 0.4, false, 0.4);
        K.ink(ctx, K.part(K.seg(500, VTOP - 40, 500, VBOT + 30, 12), dp), BP_SOFT, 0.8, 0.4, false, 0.4);
      }
      ctx.restore();
      // proportion subdivisions: one head-height apart
      ctx.save(); ctx.setLineDash([2, 6]);
      for (let k = 1; k < 8; k++) {
        const p = q(5.6 + k * 0.1, 6.1 + k * 0.1);
        if (p <= 0) continue;
        const y = VTOP + (k * VH) / 8;
        K.ink(ctx, K.part(K.seg(VX0, y, VX1, y, 14), p), BP_SOFT, 0.7, 0.3, false, 0.35);
      }
      ctx.restore();
      // ticks & dimension lines
      const tp = q(5.8, 7.0);
      if (tp > 0) {
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) {
          if (k / 8 > tp) break;
          const y = VTOP + (k * VH) / 8, x = VX0 + (k * (VX1 - VX0)) / 8;
          ctx.moveTo(VX0, y); ctx.lineTo(VX0 - (k % 4 ? 8 : 16), y);
          ctx.moveTo(x, VTOP); ctx.lineTo(x, VTOP - (k % 4 ? 8 : 16));
          for (let m = 1; m < 4 && k < 8; m++) {
            const y2 = y + (m * VH) / 32, x2 = x + (m * (VX1 - VX0)) / 32;
            ctx.moveTo(VX0, y2); ctx.lineTo(VX0 - 4, y2);
            ctx.moveTo(x2, VTOP); ctx.lineTo(x2, VTOP - 4);
          }
        }
        K.stroke(ctx, BP_LINE, 0.9, 0.75);
        K.seed(2911);
        // vertical dimension, broken where a number would sit — a small ring instead
        const dx = 196, dy = 208;
        K.ink(ctx, K.seg(VX0 - 22, VTOP, dx - 8, VTOP, 6), BP_SOFT, 0.7, 0.2, false, 0.6 * tp);
        K.ink(ctx, K.seg(VX0 - 22, VBOT, dx - 8, VBOT, 6), BP_SOFT, 0.7, 0.2, false, 0.6 * tp);
        K.ink(ctx, K.part(K.seg(dx, VTOP, dx, 500, 10), tp), BP_LINE, 1, 0.4, false, 0.8);
        K.ink(ctx, K.part(K.seg(dx, VBOT, dx, 526, 10), tp), BP_LINE, 1, 0.4, false, 0.8);
        K.ink(ctx, K.arc(dx, 513, 7, 7), BP_LINE, 1, 0.2, false, 0.8 * tp);
        arrow(ctx, dx, VTOP, Math.PI / 2, 10, BP_LINE, 0.9 * tp);
        arrow(ctx, dx, VBOT, -Math.PI / 2, 10, BP_LINE, 0.9 * tp);
        K.ink(ctx, K.seg(VX0, VTOP - 22, VX0, dy - 8, 6), BP_SOFT, 0.7, 0.2, false, 0.6 * tp);
        K.ink(ctx, K.seg(VX1, VTOP - 22, VX1, dy - 8, 6), BP_SOFT, 0.7, 0.2, false, 0.6 * tp);
        K.ink(ctx, K.part(K.seg(VX0, dy, 487, dy, 10), tp), BP_LINE, 1, 0.4, false, 0.8);
        K.ink(ctx, K.part(K.seg(VX1, dy, 513, dy, 10), tp), BP_LINE, 1, 0.4, false, 0.8);
        K.ink(ctx, K.arc(500, dy, 7, 7), BP_LINE, 1, 0.2, false, 0.8 * tp);
        arrow(ctx, VX0, dy, 0, 10, BP_LINE, 0.9 * tp);
        arrow(ctx, VX1, dy, Math.PI, 10, BP_LINE, 0.9 * tp);
      }
      // compass arcs: from the lower corners, and protractor arcs at the joints
      const cp = q(6.2, 7.6);
      if (cp > 0) {
        K.seed(2921);
        K.ink(ctx, K.arc(VX0, VBOT, 267, 267, -Math.PI / 2 + 0.25, -Math.PI / 2 + 0.25 + 1.0 * cp), BP_SOFT, 0.8, 0.5, false, 0.5);
        K.ink(ctx, K.arc(VX1, VBOT, 267, 267, -Math.PI / 2 - 0.25, -Math.PI / 2 - 0.25 - 1.0 * cp), BP_SOFT, 0.8, 0.5, false, 0.5);
        K.ink(ctx, K.arc(500, VTOP, 150, 150, 0.35, 0.35 + 2.4 * cp), BP_SOFT, 0.7, 0.5, false, 0.35);
        for (const [c, a0, a1, r] of [[SHL, ARM_A, ARM_B, 78], [SHR, mirrorAng(ARM_A), mirrorAng(ARM_B), 78], [HIPL, LEG_A, LEG_B, 96], [HIPR, mirrorAng(LEG_A), mirrorAng(LEG_B), 96]]) {
          const ae = a0 + (a1 - a0) * cp;
          K.ink(ctx, K.arc(c[0], c[1], r, r, a0, ae), BP_LINE, 1, 0.3, false, 0.75);
          const dir = ae + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2);
          arrow(ctx, c[0] + Math.cos(ae) * r, c[1] + Math.sin(ae) * r, dir + Math.PI, 8, BP_LINE, 0.8 * cp);
        }
      }
      // navel & groin marks
      const mp = q(4.4, 5.0);
      if (mp > 0) {
        K.seed(2931);
        K.ink(ctx, K.arc(VC[0], VC[1], 5, 5), C.soul, 1.2, 0.2, false, 0.9 * mp);
        K.line(ctx, VC[0] - 14, VC[1], VC[0] + 14, VC[1], BP_LINE, 0.8, 0.2, 0.7 * mp);
        K.line(ctx, VC[0], VC[1] - 14, VC[0], VC[1] + 14, BP_LINE, 0.8, 0.2, 0.7 * mp);
      }

      // the man
      const fp = q(4.8, 6.2);
      if (fp > 0) {
        const ghostA = limbShapes(poseLimbs(0, 0)), ghostB = limbShapes(poseLimbs(1, 0));
        K.seed(2941);
        for (const k of ['armL', 'armR', 'legL', 'legR']) {
          K.ink(ctx, K.part(ghostA[k], fp), BP_SOFT, 1, 0.5, false, 0.5);
          K.ink(ctx, K.part(ghostB[k], fp), BP_SOFT, 1, 0.5, false, 0.5);
        }
        for (const e of extremities(poseLimbs(0, 0))) K.ink(ctx, e, BP_SOFT, 0.9, 0.3, true, 0.45 * fp);
        const Lv = poseLimbs(K.clamp(W_, -0.2, 1.2), tremor), live = limbShapes(Lv);
        const body = K.sr(t, 5.2, 6.4);
        const shade = (x, y) => K.clamp((500 - x) / 240 + 0.18);
        K.seed(2951);
        for (const k of ['legL', 'legR', 'armL', 'armR']) {
          K.fill(ctx, live[k], '#2B5288', 0.75 * body, 0.6);
          K.hatch(ctx, live[k], { angle: 1.1, gap: 3, step: 7, amp: 0.4, color: BP_SOFT, width: 0.7, alpha: 0.5 * body, density: shade });
          K.ink(ctx, K.part(live[k], fp), BP_LINE, 1.7, 0.5, true);
        }
        for (const e of extremities(Lv)) {
          K.fill(ctx, e, '#2B5288', 0.75 * body, 0.3);
          K.ink(ctx, e, BP_LINE, 1.3, 0.3, true, fp);
        }
        // knees & elbows
        ctx.beginPath();
        for (const k of ['legL', 'legR']) { const [x, y] = Lv[k][2]; K.trace(ctx, K.arc(x, y, 9, 6, -2.6, -0.5), 0.3); }
        for (const k of ['armL', 'armR']) { const [x, y] = Lv[k][2]; K.trace(ctx, K.arc(x, y, 5, 5, 0, 2.4), 0.3); }
        K.stroke(ctx, BP_LINE, 0.9, 0.6 * body);
        K.fill(ctx, VNECK, '#2B5288', 0.8 * body, 0.3);
        K.fill(ctx, TORSO, '#2B5288', 0.8 * body, 0.6);
        K.hatch(ctx, TORSO, { angle: 1.0, gap: 3, step: 7, amp: 0.4, color: BP_SOFT, width: 0.7, alpha: 0.5 * body, density: (x) => K.clamp((500 - x) / 60 + 0.02) });
        K.hatch(ctx, TORSO, { angle: -0.5, gap: 4, step: 7, amp: 0.4, color: BP_SOFT, width: 0.6, alpha: 0.35 * body, density: (x) => K.clamp((470 - x) / 20) });
        K.ink(ctx, K.part(TORSO, fp), BP_LINE, 1.8, 0.5, true);
        K.ink(ctx, K.seg(489, 312, 489, 330, 4), BP_LINE, 1.1, 0.3, false, 0.8 * fp);
        K.ink(ctx, K.seg(511, 312, 511, 330, 4), BP_LINE, 1.1, 0.3, false, 0.8 * fp);
        // anatomy, Leonardo-light: collarbones, chest, the line of the belly, hips
        ctx.beginPath();
        K.trace(ctx, K.spline([[458, 338], [480, 340], [496, 334]], false, 5), 0.3);
        K.trace(ctx, K.spline([[504, 334], [520, 340], [542, 338]], false, 5), 0.3);
        K.trace(ctx, K.spline([[462, 368], [478, 396], [498, 394]], false, 5), 0.4);
        K.trace(ctx, K.spline([[502, 394], [522, 396], [538, 368]], false, 5), 0.4);
        K.trace(ctx, K.seg(500, 398, 500, 438, 8), 0.3);
        K.trace(ctx, K.spline([[478, 420], [490, 424], [500, 422], [510, 424], [522, 420]], false, 4), 0.3);
        K.trace(ctx, K.spline([[468, 506], [486, 532], [500, 542], [514, 532], [532, 506]], false, 5), 0.4);
        K.stroke(ctx, BP_LINE, 0.9, 0.65 * body);
        // head, hair, a quiet face
        K.fill(ctx, VHEAD, '#2B5288', 0.85 * body, 0.4);
        K.hatch(ctx, VHEAD, { angle: 1.0, gap: 2.6, step: 5, amp: 0.3, color: BP_SOFT, width: 0.6, alpha: 0.5 * body, density: (x) => K.clamp((496 - x) / 30) });
        K.fill(ctx, VHAIR, '#0B1A36', body, 0.4);
        K.hatch(ctx, VHAIR, { angle: 0.5, gap: 2.4, step: 5, amp: 0.3, color: BP_SOFT, width: 0.6, alpha: 0.35 * body });
        K.ink(ctx, K.part(VHEAD, fp), BP_LINE, 1.7, 0.4, true);
        K.ink(ctx, VHAIR, BP_LINE, 1, 0.3, true, 0.7 * body);
        ctx.beginPath();
        for (let k = 0; k < 7; k++) { const x = 478 + k * 7.5; K.trace(ctx, K.spline([[x, 250 + Math.abs(k - 3) * 2], [x + 2, 258 + Math.abs(k - 3)], [x - 1, 266]], false, 3), 0.3); }
        K.stroke(ctx, BP_SOFT, 0.7, 0.6 * body);
        ctx.beginPath();
        ctx.moveTo(486, 282); ctx.quadraticCurveTo(491, 279, 496, 282);
        ctx.moveTo(504, 282); ctx.quadraticCurveTo(509, 279, 514, 282);
        ctx.moveTo(500, 286); ctx.lineTo(498, 297); ctx.lineTo(502, 298);
        ctx.moveTo(493, 305); ctx.quadraticCurveTo(500, 303, 507, 305);
        ctx.moveTo(470, 283); ctx.quadraticCurveTo(466, 290, 471, 296);
        ctx.moveTo(530, 283); ctx.quadraticCurveTo(534, 290, 529, 296);
        K.stroke(ctx, BP_LINE, 1.1, 0.85 * body);
      }
    });

    // the circle — drawn from the feet round, then held hard for the match cut
    const cpr = q(4.3, 5.6);
    if (cpr > 0) {
      K.seed(2961);
      const circ = K.arc(VC[0], VC[1], VR, VR, Math.PI / 2, Math.PI / 2 + TAU * 1.01);
      K.ink(ctx, K.part(circ, cpr), BP_LINE, 1.7, 0.6, false, 0.9);
      const hold = K.sr(t, 8.8, 9.8);
      if (hold > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        K.ink(ctx, circ, C.cyan, 8, 0.6, false, 0.12 * hold);
        ctx.restore();
        K.ink(ctx, circ, BP_LINE, 3.2, 0.6, false, hold);
        K.ink(ctx, K.arc(VC[0], VC[1], VR + 8, VR + 8, 0, TAU * 1.01), BP_SOFT, 1, 0.6, false, 0.6 * hold);
      }
    }
    // the chest's amber point, dimming as the measure completes
    const ci = K.lerp(1, 0.22, K.sr(t, 4.0, 8.6)) * K.sr(t, 3.4, 4.2);
    if (ci > 0.01) {
      const b = beat(10 + t);
      K.glow(ctx, 500, 388, 34 + 20 * b, C.soul, (0.45 + 0.3 * b) * ci);
      K.glow(ctx, 500, 388, 8 + 4 * b, C.soulHot, 0.9 * ci);
    }
    // pins
    const Lb = poseLimbs(1, 0);
    const ends = [Lb.armL[4], Lb.armR[4], Lb.legL[4], Lb.legR[4]];
    ends.forEach((e, k) => pin(ctx, e[0], e[1], t - PIN_T[k]));
    ctx.restore();
  }

  // ---------------------------------------------------------------- the stain
  // The blueprint doesn't arrive as a shape: ink soaks into the paper from the edges in blots whose
  // fronts follow the fibres, pool into a dark tide-line, and flood the locket last.
  const BLOTS = (() => {
    const r = K.stable(612), out = [{ x: 170, y: 880, s: 2.95, d: 0.7, R: 330 }];
    for (let k = 0; k < 30; k++) {
      const a = r() * TAU, d = 120 + Math.sqrt(r()) * 560;
      const x = LC[0] + Math.cos(a) * d, y = LC[1] + Math.sin(a) * d;
      out.push({ x, y, s: 2.8 + K.clamp(1 - d / 620) * 0.9 + r() * 0.2, d: 0.5 + r() * 0.5, R: 110 + r() * 220 });
    }
    return out;
  })();
  const STAIN = '#274E86', RIM = '#0A1F4A', FRINGE = '#2A5590';
  /** Direction of the paper's fibres at (x, y): ink creeps along them. */
  const fibreAt = (x, y) => 0.95 + 0.7 * K.n2(x * 0.004 + 9, y * 0.004);
  let rimC = null, rimX = null, mottle = null, fibres = null;
  let roomC = null, roomX = null, roomReady = false; // the dark room, held still while the ink floods it

  /** Each blot's front: a jagged, fibrous edge (fbm in paper space, so the detail belongs to the
      paper, not the blot) plus a per-point pooling width for the tide-line. */
  function blotFronts(t) {
    const all = K.sr(t, 3.85, 4.35), out = [];
    BLOTS.forEach((b, i) => {
      const g = K.easeOut(K.range(t, b.s, b.s + b.d));
      if (g <= 0) return;
      const rad = b.R * g * (1 + 3.5 * all) + 2;
      const n = Math.round(K.clamp((TAU * rad) / 8.5, 30, 180));
      const c = new Float32Array(n), sn = new Float32Array(n), r = new Float32Array(n), w = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const x0 = b.x + ca * rad, y0 = b.y + sa * rad;
        // big irregular lobes, then fibrous fingers, then the tooth of the paper
        const d = rad * 0.26 * K.fbm(x0 * 0.004 + i * 7.1, y0 * 0.004 - i * 3.3, 3)
          + 15 * K.fbm(x0 * 0.022, y0 * 0.022, 3)
          + 4 * K.n2(x0 * 0.3, y0 * 0.3);
        c[k] = ca; sn[k] = sa;
        r[k] = Math.max(1, rad + d);
        w[k] = 5 + 7 * (0.5 + 0.5 * K.n2(x0 * 0.018 + 3, y0 * 0.018));
      }
      out.push({ b, i, g, n, c, s: sn, r, w, active: (1 - g) * (1 - all) });
    });
    return out;
  }
  /** A front pushed outward by `off` (+ sw × its pooling width). */
  function ring(F, off, sw = 0) {
    const pts = new Array(F.n);
    for (let k = 0; k < F.n; k++) {
      const rr = Math.max(0.5, F.r[k] + off + sw * F.w[k]);
      pts[k] = [F.b.x + F.c[k] * rr, F.b.y + F.s[k] * rr];
    }
    return pts;
  }
  const region = (fronts, off, sw = 0) => (c) => { for (const F of fronts) K.path(c, ring(F, off, sw), true); };

  /** Moisture halo, a stippled bleed and short grain-wise hatches just beyond the front. */
  function fringe(ctx, fronts) {
    K.fill(ctx, region(fronts, 7), FRINGE, 0.17, 0);
    K.seed(2991);
    ctx.beginPath();
    for (const F of fronts) {
      for (let k = 0; k < F.n; k++) {
        for (let m = 0; m < 2; m++) {
          if (m && F.active <= 0.02) break; // a settled front needs less bleed
          const u = K.r(), dist = 1 + u * u * 17, rr = F.r[k] + dist;
          const x = F.b.x + F.c[k] * rr + K.rs(2.6), y = F.b.y + F.s[k] * rr + K.rs(2.6);
          const z = 0.5 + K.r() * 1.5 * (1 - u);
          ctx.rect(x - z / 2, y - z / 2, z, z);
        }
      }
    }
    ctx.fillStyle = FRINGE;
    ctx.globalAlpha = 0.6 * K.A;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const F of fronts) {
      for (let k = 0; k < F.n; k += 3) {
        const rr = F.r[k] + 2 + K.r() * 6, x = F.b.x + F.c[k] * rr, y = F.b.y + F.s[k] * rr;
        const phi = fibreAt(x, y) + K.rs(0.3), L = 3 + K.r() * 8;
        ctx.moveTo(x - Math.cos(phi) * L / 2, y - Math.sin(phi) * L / 2);
        ctx.lineTo(x + Math.cos(phi) * L / 2, y + Math.sin(phi) * L / 2);
      }
    }
    K.stroke(ctx, STAIN, 0.8, 0.5);
  }

  /** Capillary tendrils running ahead of a moving front, along the fibres, now and then forking. */
  function tendrils(ctx, fronts) {
    K.seed(2993);
    ctx.beginPath();
    for (const F of fronts) {
      if (F.active <= 0.02) continue;
      const tr = K.stable(F.i * 53 + 1);
      for (let m = 0; m < 10; m++) {
        const a = tr(), h = tr(), len = (14 + tr() * 42) * (0.35 + 0.65 * F.active);
        const k = Math.round(a * F.n) % F.n;
        let x = F.b.x + F.c[k] * F.r[k], y = F.b.y + F.s[k] * F.r[k];
        const ox = F.c[k], oy = F.s[k];
        let phi = fibreAt(x, y);
        if (Math.cos(phi) * ox + Math.sin(phi) * oy < 0) phi += Math.PI;
        let dx = 0.45 * ox + 0.55 * Math.cos(phi), dy = 0.45 * oy + 0.55 * Math.sin(phi);
        const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const pts = [[x - dx * 4, y - dy * 4], [x, y]], seg = len / 6;
        let fork = null;
        for (let j = 0; j < 6; j++) {
          const turn = K.n1(h * 50 + j * 0.9) * 0.4, c = Math.cos(turn), s = Math.sin(turn);
          [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
          x += dx * seg; y += dy * seg;
          pts.push([x, y]);
          if (j === 2 && h > 0.45) fork = [x, y, dx, dy];
        }
        K.trace(ctx, pts, 0.4);
        if (fork) {
          const sg = h > 0.72 ? 1 : -1, c = Math.cos(0.7 * sg), s = Math.sin(0.7 * sg);
          let [fx, fy, fdx, fdy] = fork;
          [fdx, fdy] = [fdx * c - fdy * s, fdx * s + fdy * c];
          const fp = [[fx, fy]];
          for (let j = 0; j < 3; j++) { fx += fdx * seg * 0.8; fy += fdy * seg * 0.8; fp.push([fx, fy]); }
          K.trace(ctx, fp, 0.3);
        }
      }
    }
    K.stroke(ctx, STAIN, 1, 0.7);
  }

  /** The tide-line: ink pooled just inside the edge, darkest at the rim and fading inward,
      with a hand-inked edge line. Built on its own layer so overlapping blots leave no seams. */
  function tideLine(ctx, fronts) {
    if (!rimX) return;
    const x = rimX;
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, rimC.width, rimC.height); x.restore();
    x.save();
    K.clipTo(x, region(fronts, 0));
    x.fillStyle = RIM;
    x.fillRect(0, 0, 1000, 1000);
    x.restore();
    K.seed(2995);
    for (const F of fronts) {
      x.beginPath();
      K.trace(x, ring(F, -0.8), 0.6, true);
      K.stroke(x, '#041230', 0.8 + 1.6 * K.hash(F.i * 17 + 3), 0.9);
    }
    x.save();
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = '#000';
    x.globalAlpha = 0.45;
    x.beginPath(); region(fronts, -1.5, -0.3)(x); x.fill();
    x.globalAlpha = 1;
    x.beginPath(); region(fronts, -2, -1)(x); x.fill();
    x.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.78 * K.A;
    ctx.drawImage(rimC, 0, 0, 1000, 1000);
    ctx.restore();
  }

  function makeMottle() {
    const [c, x] = K.makeCanvas(1000, 1000, 0.5);
    const r = K.stable(733);
    for (let k = 0; k < 260; k++) {
      const bx = r() * 1000, by = r() * 1000, br = 15 + r() * 110, a = 0.04 + r() * 0.12;
      const g = x.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(8,24,60,${a})`);
      g.addColorStop(0.7, `rgba(8,24,60,${a * 0.6})`);
      g.addColorStop(1, 'rgba(8,24,60,0)');
      x.fillStyle = g;
      x.fillRect(bx - br, by - br, 2 * br, 2 * br);
    }
    // blooms: jagged rings where wet ink pushed its pigment outward
    x.lineWidth = 1.6;
    for (let k = 0; k < 70; k++) {
      const bx = r() * 1000, by = r() * 1000, br = 12 + r() * 60;
      x.beginPath();
      for (let j = 0; j <= 48; j++) {
        const a = (j / 48) * TAU, rr = br * (1 + 0.3 * K.fbm(bx * 0.01 + Math.cos(a) * 1.5, by * 0.01 + Math.sin(a) * 1.5, 3));
        const px = bx + Math.cos(a) * rr, py = by + Math.sin(a) * rr;
        j ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.strokeStyle = `rgba(6,20,52,${0.1 + r() * 0.16})`;
      x.stroke();
    }
    return c;
  }
  function makeFibres() {
    const [c, x] = K.makeCanvas(1000, 1000, Math.min(K.PX, 1.5));
    const r = K.stable(734);
    x.lineCap = 'round';
    for (let k = 0; k < 2400; k++) {
      const fx = r() * 1000, fy = r() * 1000, a = fibreAt(fx, fy) + (r() - 0.5) * 0.9, L = 3 + r() * 15;
      x.strokeStyle = `rgba(200,220,245,${0.05 + r() * 0.13})`;
      x.lineWidth = 0.5 + r() * 0.7;
      x.beginPath();
      x.moveTo(fx, fy);
      x.quadraticCurveTo(fx + Math.cos(a) * L * 0.5 + (r() - 0.5) * 3, fy + Math.sin(a) * L * 0.5 + (r() - 0.5) * 3, fx + Math.cos(a) * L, fy + Math.sin(a) * L);
      x.stroke();
    }
    for (let k = 0; k < 3200; k++) {
      x.fillStyle = `rgba(210,228,248,${0.04 + r() * 0.1})`;
      const z = 0.5 + r() * 1.1;
      x.fillRect(r() * 1000, r() * 1000, z, z);
    }
    return c;
  }

  FILM.scenes.lost = {
    tone: (t) => (t < 3.5 ? 'paper' : 'void'),
    lines: [
      { text: 'I lost my religion,', at: 0.8 },
      { text: 'For what the world says the human.', at: 3.9 },
    ],
    sfx: [
      { at: 0.55, kind: 'snap' }, { at: 2.5, kind: 'hiss' }, { at: 2.9, kind: 'whoosh' },
      { at: 3.6, kind: 'tick' }, { at: 3.9, kind: 'tick' }, { at: 4.2, kind: 'tick' }, { at: 4.5, kind: 'tick' },
      { at: 6.8, kind: 'stamp' }, { at: 7.1, kind: 'stamp' }, { at: 7.4, kind: 'stamp' }, { at: 7.7, kind: 'stamp' },
    ],
    mood: (t) => ({ warm: 0.8 * (1 - K.sr(t, 1.2, 3.2)), drone: 0.25 + 0.4 * K.sr(t, 2.8, 5) }),
    init() {
      [rimC, rimX] = K.makeCanvas(1000, 1000);
      [roomC, roomX] = K.makeCanvas(1000, 1000);
      roomReady = false;
      mottle = makeMottle();
      fibres = makeFibres();
    },
    draw(ctx, t, dur) {
      const g = 10 + t;
      // the caption's paper/void scrim would jump when the ink changes colour; thin it across the switch
      FILM.scenes.lost.scrim = 1 - 0.8 * K.bump(t, 3.0, 4.0);
      const fl = t < 1.2 ? 1 : (1 - K.sr(t, 1.2, 2.6)) * (0.75 + 0.35 * K.n1(t * 16));
      const stainDone = t > 4.35;
      if (t >= 2.8 && !stainDone && roomC) {
        // lamp out, thread gone: the room is a still now — draw it once, keep only the smoke,
        // the dying ember and the film dust alive on top
        if (!roomReady) {
          const A = K.A, boil = K.boil;
          K.A = 1; K.boil = 336;
          roomX.save(); roomX.setTransform(1, 0, 0, 1, 0, 0); roomX.clearRect(0, 0, roomC.width, roomC.height); roomX.restore();
          memoryScene(roomX, 12.8, { fl: 0, lit: 0, heartI: 0.45, zoom: 1 + 0.07 * 1.28, thread: null, noDust: true });
          K.A = A; K.boil = boil;
          roomReady = true;
        }
        ctx.drawImage(roomC, 0, 0, 1000, 1000);
        const zi = 1 + 0.07 * (g / 10);
        ctx.save();
        ctx.beginPath(); ctx.arc(LC[0], LC[1], LR + 1, 0, TAU); ctx.clip();
        ctx.translate(560, 520); ctx.scale(zi, zi); ctx.translate(-560, -520);
        const lit = K.clamp(1 - K.sr(t, 2.6, 3.6));
        if (lit > 0.02) K.glow(ctx, 628, 664, 9, C.ember, lit, 'screen');
        smoke(ctx, g, t);
        ctx.restore();
        filmDust(ctx, 1);
      } else if (!stainDone) {
        memoryScene(ctx, g, {
          fl: K.clamp(fl), lit: K.clamp(1 - K.sr(t, 2.6, 3.6)), heartI: K.lerp(1, 0.45, K.sr(t, 0.6, 2.8)),
          zoom: 1 + 0.07 * (g / 10),
          thread: (c, gg) => snappedThread(c, gg, t),
          extra: (c) => smoke(c, g, t),
        });
      }
      if (t > 2.8) {
        const fronts = stainDone ? null : blotFronts(t);
        if (fronts && !fronts.length) return;
        const wet = 1 - K.sr(t, 4.2, 5.6);
        if (fronts) { fringe(ctx, fronts); tendrils(ctx, fronts); }
        ctx.save();
        if (fronts) K.clipTo(ctx, region(fronts, 0));
        blueprintGround(ctx, wet);
        vitruvian(ctx, t, dur);
        ctx.restore();
        if (fronts) tideLine(ctx, fronts);
      }
    },
  };
})();
