'use strict';
/* Plate A — the opening. Out of the dark, a point of light rises over an engraved valley and lets
   down a thread to it.
   A worked example of the plate contract:
   - register FILM.scenes[id] under the id FILM.config.plates lists;
   - place things relative to K.W / K.H (the frame may be 1:1, 9:16 or 16:9) and size them in units
     (the short side is always 1000), so the plate composes itself in every aspect;
   - draw(ctx, t, dur) is a pure function of the plate's own time t: any frame renders alone;
   - colour only by role (K.C), so every preset recolours the plate;
   - `tone` names the ground the captions sit on; `lines` are the only words on screen;
   - `sfx` and `mood` are its sound (one-shots on the timeline, beds that follow the picture;
     see lib/audio.js). */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const W = K.W, H = K.H;
  const CX = W / 2, CY = H / 2; // the star: the plate's subject, on the frame's centre
  const HZ = H * 0.7;           // the valley floor, under the star
  const STAR_R = 34;

  // Land as functions of x, so tones can ask "is this point above the ground?".
  // The near ridge is a shallow valley centred under the star; the far ridge sits behind it.
  const nearY = (x) => { const u = Math.abs(x - CX) / (W / 2); return HZ - 38 * Math.pow(u, 1.6) + 7 * K.n1(x * 0.007 + 3); };
  const farY = (x) => { const u = Math.abs(x - CX) / (W / 2); return HZ - 52 - 30 * Math.pow(u, 1.2) + 16 * K.n1(x * 0.004 + 11) + 5 * K.n1(x * 0.02 + 2); };
  const across = (f) => { const pts = []; for (let x = -30; x <= W + 30; x += 12) pts.push([x, f(x)]); return pts; };
  const nearEdge = across(nearY), farEdge = across(farY);
  const nearLand = [...nearEdge, [W + 30, H + 30], [-30, H + 30]];
  // a footpath winds up the valley to where the thread comes down
  const pathX = (y) => { const d = K.clamp((y - HZ) / (H - HZ)); return CX + 34 * Math.sin(d * 5.2) * d; };
  const pathHalf = (y) => 3 + 105 * Math.pow(K.clamp((y - HZ) / (H - HZ)), 1.25);
  const pathEdge = (side) => { const pts = []; for (let y = nearY(CX) + 2; y <= H + 20; y += 8) pts.push([pathX(y) + side * pathHalf(y), y]); return pts; };
  const pathL = pathEdge(-1), pathR = pathEdge(1);
  const thread = K.spline([[CX, CY + STAR_R + 6], [CX - 24, K.lerp(CY, HZ, 0.33)], [CX + 18, K.lerp(CY, HZ, 0.68)], [CX, nearY(CX) + 1]], false, 14);

  /** Engraved land: rows that follow the ridge line down the slope, bunched toward the horizon
      and flattening as they come nearer. Each row has its own tone threshold, so rows run unbroken
      through dark ground and break off where the light falls (the same rule as K.hatch). */
  function rows(ctx, edge, depth, gap0, tone, color, width) {
    ctx.beginPath();
    for (let off = gap0 * 0.6; off < depth; off += gap0 + off * 0.018) {
      const flat = 1 - 0.75 * (off / depth), tau = K.r() * 0.94 + 0.03, wob = K.r() * 100;
      let pen = false;
      for (let x = -30; x <= W + 30; x += 10) {
        const y = HZ + off + (edge(x) - HZ) * flat + 0.8 * K.n1(wob + x * 0.03);
        if (tone(x, y) > tau) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false;
      }
    }
    K.stroke(ctx, color, width);
  }

  /** Camera: a slow push toward the star, well under 7%. */
  function camera(ctx, t, dur) {
    const z = 1 + 0.035 * K.sr(t, 0, dur);
    ctx.translate(CX, CY); ctx.scale(z, z); ctx.translate(-CX, -CY);
  }

  FILM.scenes.a_opening = {
    tone: 'paper',
    lines: [
      { text: 'A single point of light,', at: 1.2 },
      { text: 'and a line to follow it.', at: 2.4 },
    ],
    // a chime as the star kindles; the drone of the dark gives way to warmth as the light arrives
    sfx: [{ at: 0.5, kind: 'chime' }],
    mood: (t) => ({ drone: K.lerp(0.7, 0.35, K.sr(t, 0.1, 1.4)), warm: 0.5 * K.sr(t, 0.4, 2.6) }),
    draw(ctx, t, dur) {
      const glow = K.glowMode('paper');
      K.paper(ctx);
      // aquatint: night gathers away from the light, and the paper stays clear around the star,
      // so the lightest place in the frame is where the eye should go
      const night = ctx.createRadialGradient(CX, CY, 120, CX, CY, 560);
      night.addColorStop(0, K.rgba(C.void, 0));
      night.addColorStop(1, K.rgba(C.void, 0.2 * K.sr(t, 0.2, 2.2)));
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      camera(ctx, t, dur);
      // the sky, ruled in like an engraver's heaven: darker overhead, clear around the star
      const sky = K.sr(t, 0.2, 2.2);
      K.ruledSky(ctx, {
        gap: 4.5, y1: HZ, color: C.ink, width: 0.7, alpha: 0.5,
        density: (x, y) => {
          if (y > farY(x) - 3) return 0;
          const d = Math.hypot(x - CX, y - CY), clear = Math.exp(-(d * d) / (270 * 270));
          return (0.2 + 0.75 * Math.pow(1 - y / HZ, 1.3)) * (1 - 0.97 * clear) * sky;
        },
      });
      // construction: the drafter's circles and cross, drawn on around the star
      const draft = K.sr(t, 0.9, 3.2);
      if (draft > 0) {
        ctx.save();
        ctx.setLineDash([3, 8]);
        K.seed(101);
        for (const r of [92, 150]) K.ink(ctx, K.arc(CX, CY, r, r, -Math.PI / 2, -Math.PI / 2 + TAU * draft), C.sepia, 1, 0.6, false, 0.75);
        const L = 220 * draft;
        ctx.beginPath();
        ctx.moveTo(CX - L, CY); ctx.lineTo(CX + L, CY);
        ctx.moveTo(CX, CY - L); ctx.lineTo(CX, CY + Math.min(L, 150));
        K.stroke(ctx, C.sepia, 0.8, 0.4);
        ctx.restore();
      }
      // the land: far hills in sepia, the near valley in ink, lighter where the star shines on it
      const land = K.sr(t, 0.3, 1.8);
      K.fade(land, () => {
        K.seed(201);
        rows(ctx, farY, HZ - farY(CX) + 40, 3.2, (x, y) => (y >= nearY(x) - 1 ? 0 : 0.4 + 0.3 * K.clamp((y - farY(x)) / 50)), C.sepia, 0.75);
        K.ink(ctx, farEdge, C.sepia, 1.1, 0.6);
        const tone = (x, y) => {
          const off = Math.abs(x - pathX(y)) - pathHalf(y);
          if (off < 0) return 0.04; // the path is bare paper
          const depth = K.clamp((y - nearY(x)) / (H - HZ + 40));
          const pool = Math.exp(-((x - CX) * (x - CX)) / (2 * 170 * 170)) * (1 - 0.6 * depth);
          return K.clamp(0.46 + 0.52 * depth - 0.42 * pool + 0.25 * Math.exp(-off / 14));
        };
        K.seed(203);
        rows(ctx, nearY, H - HZ + 60, 3.4, tone, C.ink, 0.85);
        K.seed(204);
        K.hatch(ctx, nearLand, { angle: -0.55, gap: 4.4, step: 11, amp: 0.6, color: C.ink, width: 0.7, alpha: 0.9, density: (x, y) => (tone(x, y) - 0.62) / 0.38 });
        K.seed(205);
        K.ink(ctx, nearEdge, C.ink, 1.6, 0.8);
        K.ink(ctx, pathL, C.ink, 1.1, 0.7);
        K.ink(ctx, pathR, C.ink, 1.1, 0.7);
      });
      ctx.restore();

      // out of the dark: the void lifts off the paper as the light arrives
      const dark = 1 - K.sr(t, 0.1, 1.4);
      if (dark > 0) { ctx.save(); ctx.globalAlpha = dark; K.voidBg(ctx); ctx.restore(); }

      ctx.save();
      camera(ctx, t, dur);
      // the thread lets down from the star and touches the valley floor
      const reach = K.sr(t, 1.8, 4.2);
      K.thread(ctx, thread, t, K.sr(t, 1.6, 2.4), reach, { mode: glow, core: C.ember, width: 1.3 });
      K.glow(ctx, CX, nearY(CX), 80, C.soul, 0.4 * K.sr(t, 3.8, 4.6), glow);
      // the star itself, in a halo that lifts the paper toward white
      const shine = K.lerp(0.5, 1, K.sr(t, 0.4, 2.6));
      K.glow(ctx, CX, CY, 170, C.soulHot, 0.5 * shine * K.sr(t, 0.2, 1.6), glow);
      K.soulStar(ctx, CX, CY, K.lerp(3, STAR_R, K.sr(t, 0.2, 2.0)), shine, t, { mode: glow });
      ctx.restore();
    },
  };
})();
