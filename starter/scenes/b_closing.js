'use strict';
/* Plate B — the closing. A disc of light printed as a dot screen hangs over a flame on a stone.
   Shows the print tools: K.halftone in two inks at two screen angles (an overprint), K.flame, and a
   void-toned plate. A compact group is anchored on the frame's centre with offsets in units, so it
   holds together in a tall or wide frame instead of drifting apart. */
(function () {
  const FILM = window.FILM, K = FILM.K, C = K.C, TAU = K.TAU;
  const W = K.W, H = K.H;
  const CX = W / 2, CY = H / 2;
  const DY = CY - 150, DR = 170;  // the disc
  const FY = CY + 180, FH = 108;  // the flame stands on the stone here
  let stars;

  // a small cairn: flat top, slightly swelling sides
  const stoneTop = K.arc(CX, FY + 4, 66, 12, 0, TAU, 0, 5);
  const stone = [...K.arc(CX, FY + 4, 66, 12, Math.PI, TAU, 0, 5), [CX + 74, FY + 36], ...K.arc(CX, FY + 58, 70, 14, 0, Math.PI, 0, 5), [CX - 74, FY + 36]];

  FILM.scenes.b_closing = {
    tone: 'void',
    lines: [{ text: 'Keep the flame; the rest is ink.', at: 1.1 }],
    sfx: [{ at: 0.5, kind: 'crackle' }], // the flame catches (no mood: a void plate's default beds)
    init() {
      stars = K.makeStars(17, Math.round((420 * W * H) / 1e6));
    },
    draw(ctx, t, dur) {
      K.voidBg(ctx);
      K.drawStars(ctx, stars, t, { alpha: 0.75 });
      K.ruledSky(ctx, { gap: 6, alpha: 0.05, density: (x, y) => 0.2 + 0.6 * (1 - y / H) });

      // the disc: warm dots on the lit side, a cool overprint in the shade; it rises into being
      const grow = K.sr(t, 0.3, 2.2) * (1 - 0.6 * K.sr(t, dur - 1.6, dur));
      const disc = K.arc(CX, DY, DR, DR, 0, TAU, 0, 6);
      const shade = K.sphereTone(CX, DY, DR, -0.55, -0.6, 0);
      K.glow(ctx, CX, DY, DR * 2.1, C.soul, 0.14 * grow);
      K.seed(41);
      K.halftone(ctx, disc, { density: (x, y) => Math.pow(1 - shade(x, y), 1.3) * grow, cell: 7, angle: 0.26, color: C.soul, alpha: 0.95 });
      K.seed(43);
      K.halftone(ctx, disc, { density: (x, y) => K.clamp((shade(x, y) - 0.3) * 0.5) * grow, cell: 7, angle: 0.26 + 0.52, color: C.mind, alpha: 0.8 });
      K.seed(45);
      K.ink(ctx, K.arc(CX, DY, DR + 2, DR + 2, -1.9, -1.9 + TAU * 1.02 * K.sr(t, 0.3, 2.4)), C.soulHot, 1.1, 0.6, false, 0.5 * grow);

      // the stone, hatched in pale ink, lit from the flame above
      const fi = K.sr(t, 0.4, 1.4) * (1 - 0.7 * K.sr(t, dur - 1.8, dur));
      K.seed(61);
      K.hatch(ctx, stone, {
        angle: -0.5, gap: 3.6, step: 8, amp: 0.5, color: C.voidInk, width: 0.8, alpha: 0.6,
        density: (x, y) => K.clamp(0.25 + 0.6 * ((y - FY) / 60) + 0.3 * Math.abs(x - CX) / 74),
      });
      K.ink(ctx, stone, C.voidInk, 1.2, 0.5, true, 0.8);
      K.ink(ctx, stoneTop, C.voidInk, 1, 0.4, true, 0.6);
      K.glow(ctx, CX, FY + 4, 90, C.soul, 0.3 * fi);

      // the flame, with a slow heartbeat
      const beat = K.bump(K.frac(t / 1.15), 0, 0.3);
      K.flame(ctx, CX, FY, FH, t, fi, { beat });
    },
  };
})();
