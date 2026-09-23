'use strict';
/* Looks. A preset fixes the palette roles (K.C), the lettering (K.FONT, K.FONT_UI, K.FONT_DISPLAY,
   K.ITALIC), the paper and void recipe (K.TEX), print misregistration (K.MIS), film grain (K.GRAIN)
   and the page around the film (K.PAGE).
   The config's preset and brand tokens are applied the moment this file loads, before any plate,
   so plates always see the film's own palette. Changing the look later (K.usePreset / K.brand)
   bumps K.lookVersion and the engine rebuilds its textures before the next frame. */
(function () {
  const FILM = window.FILM, K = FILM.K, cfg = FILM.config || {};
  const GF = 'https://fonts.googleapis.com/css2?';
  const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';
  // Role names are the poem film's, kept for continuity: void/voidInk = dark ground and its ink,
  // paper/ink/sepia = light ground and its inks, mind/mindDeep/cyan = the cool (structure, thought),
  // soul/soulHot/ember = the warm (light, self), ash = spent, gold = brass, blueprint/storm = night tones.
  const ROLES = ['void', 'voidInk', 'paper', 'ink', 'sepia', 'mind', 'mindDeep', 'cyan', 'soul', 'soulHot', 'ember', 'ash', 'gold', 'goldLight', 'blueprint', 'storm', 'stormLight'];
  const rgb3 = (c) => K.rgb(c).slice(0, 3);
  /** The colour a sheet shows after a multiply wash of tint at alpha a. */
  const washed = (base, tint, a) => {
    const b = K.rgb(base), t = K.rgb(tint);
    return '#' + b.map((v, i) => Math.round(v * (1 - a) + ((v * t[i]) / 255) * a).toString(16).padStart(2, '0')).join('');
  };

  const PRESETS = {
    // The poem film's look, exactly: iron-gall ink on aged plate paper, and the cosmos.
    'engraved-cosmos': {
      C: {
        void: '#07070F', voidInk: '#E8DDC2', paper: '#EDE0C4', ink: '#2B1A10', sepia: '#6B4A2E',
        mind: '#86B3E3', mindDeep: '#16284A', cyan: '#A9DDEA', soul: '#F3A53A', soulHot: '#FFE6A8',
        ember: '#B8412C', ash: '#6E6862', gold: '#C99A3E', goldLight: '#EACB7A',
        blueprint: '#13274B', storm: '#2B2440', stormLight: '#8E86AA',
      },
      font: '"IM Fell English", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
      fontDisplay: '"IM Fell English SC", "IM Fell English", Georgia, serif',
      fontUI: MONO,
      italic: true,
      fontHref: GF + 'family=IBM+Plex+Mono&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap',
      fontLoad: ['italic 40px "IM Fell English"', '40px "IM Fell English"'],
      mis: 1.4,
      grain: 0.5,
      tex: {
        paper: {
          base: null, stains: 90, stainDark: [160, 128, 84, 0.05, 0.07], stainLight: [255, 248, 228, 0.06, 0.08],
          fibres: 1500, fibre: [110, 82, 50, 0.05, 0.07], specks: 2600, speck: [90, 62, 36, 0.05, 0.12],
          edge: [120, 86, 48, 0.22], noise: 16, tint: null, grid: null,
        },
        void: { clouds: 50, cloudA: [22, 30, 70, 0.12, 0.12], cloudB: [40, 20, 52, 0.1, 0.12], specks: 0, noise: 9 },
        vignette: 0.42,
      },
      page: { scheme: 'dark', ground: '#07070F', ink: '#E8DDC2', muted: '#8C8474', rule: '#2A2733', accent: '#F3A53A' },
    },

    // Cyanotype: a rag sheet washed Prussian blue, drawn over in chalk-white and pale blue.
    blueprint: {
      C: {
        void: '#0B1A36', voidInk: '#DCEBF7', paper: washed('#F1ECE0', '#1E4C8E', 0.95), ink: '#DCEBF7', sepia: '#9CC7E6',
        mind: '#9CC7E6', mindDeep: '#0F2A55', cyan: '#BFE3F7', soul: '#F3A53A', soulHot: '#FFE6A8',
        ember: '#E7743F', ash: '#7C92B0', gold: '#E3BE72', goldLight: '#F4DDA6',
        blueprint: '#0B1A36', storm: '#1A2B4F', stormLight: '#8FA6C8',
      },
      font: '"IBM Plex Serif", Georgia, serif',
      fontDisplay: MONO,
      fontUI: MONO,
      italic: true,
      fontHref: GF + 'family=IBM+Plex+Mono&family=IBM+Plex+Serif:ital@0;1&display=swap',
      fontLoad: ['italic 40px "IBM Plex Serif"', '40px "IBM Plex Serif"'],
      mis: 0.9,
      grain: 0.45,
      tex: {
        paper: {
          base: '#F1ECE0', stains: 120, stainDark: [96, 96, 92, 0.05, 0.1], stainLight: [255, 255, 250, 0.1, 0.14],
          fibres: 900, fibre: [80, 80, 84, 0.05, 0.06], specks: 1600, speck: [50, 50, 60, 0.05, 0.1],
          edge: [60, 50, 40, 0.34], noise: 14, tint: { color: '#1E4C8E', alpha: 0.95, mode: 'multiply' },
          grid: { gap: 25, major: 4, color: '#DCEBF7', alpha: 0.055 },
        },
        void: { clouds: 50, cloudA: [30, 76, 142, 0.12, 0.14], cloudB: [16, 44, 92, 0.12, 0.12], specks: 0, noise: 8 },
        vignette: 0.36,
      },
      page: { scheme: 'dark', ground: '#0B1A36', ink: '#DCEBF7', muted: '#7F9BBE', rule: '#23406E', accent: '#F3A53A' },
    },

    // Risograph: four soy inks on cream stock — Fluorescent Pink, Medium Blue, Yellow, Black —
    // and their overprints (pink × yellow = red-orange, pink × blue = violet). Loose register, heavy grain.
    risograph: {
      C: {
        void: '#1A1A1A', voidInk: '#F3EAD7', paper: '#F3EAD7', ink: '#1A1A1A', sepia: '#0078BF',
        mind: '#0078BF', mindDeep: '#002284', cyan: '#7AB1CB', soul: '#FF48B0', soulHot: '#FFE800',
        ember: '#FF4100', ash: '#918C82', gold: '#FFA500', goldLight: '#FFE800',
        blueprint: '#0078BF', storm: '#002284', stormLight: '#7AB1CB',
      },
      font: '"Fraunces", "Iowan Old Style", Georgia, serif',
      fontDisplay: '"Fraunces", "Iowan Old Style", Georgia, serif',
      fontUI: MONO,
      italic: true,
      fontHref: GF + 'family=Fraunces:ital@0;1&family=IBM+Plex+Mono&display=swap',
      fontLoad: ['italic 40px "Fraunces"', '40px "Fraunces"'],
      mis: 3.5,
      grain: 0.9,
      tex: {
        paper: {
          base: null, stains: 40, stainDark: [190, 170, 130, 0.03, 0.04], stainLight: [255, 252, 240, 0.05, 0.06],
          fibres: 700, fibre: [150, 130, 100, 0.05, 0.06], specks: 1800, speck: [60, 50, 40, 0.05, 0.1],
          edge: [140, 120, 90, 0.08], noise: 10, tint: null, grid: null,
        },
        void: { clouds: 40, cloudA: [0, 120, 191, 0.04, 0.05], cloudB: [255, 72, 176, 0.015, 0.02], specks: 5000, speck: [243, 234, 215, 0.05, 0.16], noise: 12 },
        vignette: 0.12,
      },
      page: { scheme: 'light', ground: '#E9DFC8', ink: '#1A1A1A', muted: '#6E665A', rule: '#CFC2A6', accent: '#FF48B0' },
    },
  };

  // Brand-mapped: a quiet, clean sheet until K.brand() pours a company's tokens into it.
  const BRAND_DEFAULTS = {
    paper: '#F6F4EF', ink: '#1E2228', accent: '#E0782E', accentHot: '#FFD9A6', cool: '#3F6E9E', coolDeep: '#1B2E47',
    dark: '#14171C', darkInk: '#EEF0F2', fontDisplay: 'Inter', fontText: 'Inter',
  };

  /** Roles from brand tokens: the ten tokens set ten roles; the rest are mixed from them. */
  function rolesFrom(b) {
    return {
      void: b.dark, voidInk: b.darkInk, paper: b.paper, ink: b.ink, sepia: K.mix(b.ink, b.paper, 0.3),
      mind: b.cool, mindDeep: b.coolDeep, cyan: K.mix(b.cool, '#FFFFFF', 0.45),
      soul: b.accent, soulHot: b.accentHot, ember: K.mix(b.accent, b.ink, 0.35), ash: K.mix(b.ink, b.paper, 0.55),
      gold: K.mix(b.accent, b.ink, 0.15), goldLight: K.mix(b.accent, b.paper, 0.5),
      blueprint: b.coolDeep, storm: K.mix(b.dark, b.cool, 0.25), stormLight: K.mix(b.cool, b.darkInk, 0.4),
    };
  }
  /** A clean-paper recipe whose stains and specks are the brand's own ink. */
  function brandTex(b) {
    const ink = rgb3(b.ink);
    return {
      paper: {
        base: null, stains: 40, stainDark: [...ink, 0.015, 0.02], stainLight: [255, 255, 255, 0.03, 0.04],
        fibres: 0, fibre: [...ink, 0, 0], specks: 900, speck: [...ink, 0.02, 0.04],
        edge: [...ink, 0.06], noise: 5, tint: null, grid: null,
      },
      void: { clouds: 40, cloudA: [...rgb3(b.cool), 0.05, 0.06], cloudB: [...rgb3(b.accent), 0.02, 0.03], specks: 0, noise: 5 },
      vignette: 0.16,
    };
  }
  const family = (name) => `"${name}", system-ui, -apple-system, "Segoe UI", sans-serif`;
  /** Client-licensed font files, embedded in the page: [{ family, src, style?, weight? }], where src
      is a data:font/…;base64 URI. Anything else is refused with a warning; nothing is ever fetched. */
  const DATA_FONT = /^data:(font|application)\/[\w.+-]+;base64,[A-Za-z0-9+/=\s]+$/;
  function fontFilesFrom(list) {
    if (list == null) return [];
    if (!Array.isArray(list)) { console.warn('[ink-film] brand token fontFiles must be a list of { family, src, style?, weight? }'); return []; }
    return list.filter((f) => {
      const fam = f && f.family, src = f && f.src;
      if (typeof fam !== 'string' || !/^[A-Za-z0-9 _-]+$/.test(fam)) { console.warn(`[ink-film] embedded font family ${JSON.stringify(fam)} must be letters, digits, spaces, - or _; skipped`); return false; }
      if (typeof src !== 'string' || !DATA_FONT.test(src)) { console.warn(`[ink-film] embedded font "${fam}" must be a data:font/…;base64 URI, never a URL; skipped ${String(src).slice(0, 48)}`); return false; }
      if (f.style != null && f.style !== 'normal' && f.style !== 'italic') { console.warn(`[ink-film] embedded font "${fam}" style must be normal or italic; skipped`); return false; }
      return true;
    }).map((f) => ({ family: f.family, src: f.src, style: f.style || 'normal', weight: String(f.weight ?? 400) }));
  }
  /** Lettering from brand family names. Families named in fontFiles (loaded or refused) are never
      requested from Google Fonts; an italic file for the text or display family makes captions italic. */
  function brandFonts(b, files = [], declared = new Set()) {
    const names = [...new Set([b.fontDisplay, b.fontText])].filter((n) => !declared.has(n)).filter((n) => {
      const okName = typeof n === 'string' && /^[A-Za-z0-9 ]+$/.test(n);
      if (!okName) console.warn(`[ink-film] font "${n}" is not a plain Google Fonts family name; skipped`);
      return okName;
    });
    const italic = files.some((f) => f.style === 'italic' && (f.family === b.fontText || f.family === b.fontDisplay));
    return {
      font: family(b.fontText), fontDisplay: family(b.fontDisplay), fontUI: family(b.fontText), italic,
      fontHref: names.length ? GF + names.map((n) => 'family=' + n.trim().replace(/ +/g, '+')).join('&') + '&display=swap' : null,
      fontLoad: [`40px "${b.fontText}"`, ...(italic ? [`italic 40px "${b.fontText}"`] : [])],
      fontFiles: files,
    };
  }
  function brandPage(b) {
    const light = K.luminance(b.paper) > 0.4;
    return {
      scheme: light ? 'light' : 'dark', ground: K.mix(b.paper, b.ink, 0.05), ink: b.ink,
      muted: K.mix(b.ink, b.paper, 0.45), rule: K.mix(b.ink, b.paper, 0.82), accent: b.accent,
    };
  }
  PRESETS.brand = {
    C: rolesFrom(BRAND_DEFAULTS), ...brandFonts(BRAND_DEFAULTS),
    mis: 0.6, grain: 0.25, tex: brandTex(BRAND_DEFAULTS), page: brandPage(BRAND_DEFAULTS),
  };
  K.PRESETS = PRESETS;

  for (const [name, p] of Object.entries(PRESETS)) {
    const missing = ROLES.filter((r) => !/^#[0-9A-Fa-f]{6}$/.test(p.C[r] || ''));
    if (missing.length) console.warn(`[ink-film] preset "${name}" lacks roles: ${missing.join(', ')}`);
  }

  /** The first candidate that reads at 4.5:1 on ground; failing that, the best one pushed toward
      black or white until it does. */
  function readable(ground, candidates) {
    for (const c of candidates) if (K.contrast(c, ground) >= 4.5) return c;
    const best = candidates.reduce((a, b) => (K.contrast(b, ground) > K.contrast(a, ground) ? b : a));
    const pole = K.contrast('#000000', ground) >= K.contrast('#FFFFFF', ground) ? '#000000' : '#FFFFFF';
    for (let k = 1; k <= 20; k++) { const c = K.mix(best, pole, k / 20); if (K.contrast(c, ground) >= 4.5) return c; }
    return pole;
  }
  function captionInks() {
    const C = K.C;
    C.captionInk = readable(C.paper, [C.ink, C.void, C.mindDeep, C.voidInk]);
    C.captionInkDark = readable(C.void, [C.voidInk, C.paper, C.ink]);
  }

  /** Switch the whole look to a named preset. */
  K.usePreset = (name) => {
    let p = PRESETS[name];
    if (!p) { console.warn(`[ink-film] unknown preset "${name}", using engraved-cosmos`); name = 'engraved-cosmos'; p = PRESETS[name]; }
    K.preset = name;
    Object.assign(K.C, p.C);
    captionInks();
    K.FONT = p.font; K.FONT_DISPLAY = p.fontDisplay; K.FONT_UI = p.fontUI; K.ITALIC = p.italic;
    K.FONT_HREF = p.fontHref; K.FONT_FACES = p.fontLoad.slice(); K.FONT_FILES = (p.fontFiles || []).slice();
    K.TEX = JSON.parse(JSON.stringify(p.tex));
    K.MIS = p.mis; K.GRAIN = p.grain;
    K.PAGE = { ...p.page };
    K.lookVersion++;
  };

  /** Map a company's tokens onto the palette roles (tokens left out keep the current look's value).
      BrandTokens = { paper, ink, accent, accentHot, cool, coolDeep, dark, darkInk, fontDisplay, fontText,
      fontFiles? }. fontDisplay / fontText name Google Fonts families, or families the client supplies
      as fontFiles: [{ family, src: 'data:font/…;base64,…', style?: 'normal' | 'italic', weight? }]
      (with fontFiles alone, its first family letters both). The engine loads files before the page shows.
      Warns when ink/paper or darkInk/dark reads under 4.5:1, and letters captions in the better ink. */
  K.brand = (tokens = {}) => {
    const C = K.C, hex = /^#[0-9A-Fa-f]{6}$/;
    const cur = {
      paper: C.paper, ink: C.ink, accent: C.soul, accentHot: C.soulHot, cool: C.mind, coolDeep: C.mindDeep,
      dark: C.void, darkInk: C.voidInk, fontDisplay: null, fontText: null,
    };
    const b = { ...cur };
    const files = fontFilesFrom(tokens.fontFiles);
    const declared = new Set((Array.isArray(tokens.fontFiles) ? tokens.fontFiles : []).map((f) => f && f.family));
    for (const [k, v] of Object.entries(tokens)) {
      if (k === 'fontFiles') continue;
      if (!(k in cur)) { console.warn(`[ink-film] unknown brand token "${k}"`); continue; }
      if (k.startsWith('font') ? typeof v !== 'string' : !hex.test(v)) { console.warn(`[ink-film] brand token ${k} must be ${k.startsWith('font') ? 'a font family name' : '#rrggbb'}; got ${v}`); continue; }
      b[k] = v;
    }
    if (tokens.accent && !tokens.accentHot) b.accentHot = K.mix(b.accent, '#FFFFFF', 0.6);
    Object.assign(C, rolesFrom(b));
    captionInks();
    for (const [pair, fg, bg, role] of [['ink/paper', b.ink, b.paper, 'captionInk'], ['darkInk/dark', b.darkInk, b.dark, 'captionInkDark']]) {
      const r = K.contrast(fg, bg);
      if (r < 4.5) console.warn(`[ink-film] contrast: ${pair} ${fg} on ${bg} is ${r.toFixed(2)}:1, under 4.5:1; captions use ${C[role]} (${K.contrast(C[role], bg).toFixed(2)}:1)`);
    }
    if (b.fontDisplay || b.fontText || files.length) {
      const first = files.length ? files[0].family : null;
      const text = b.fontText || b.fontDisplay || first, display = b.fontDisplay || b.fontText || first;
      const f = brandFonts({ fontDisplay: display, fontText: text }, files, declared);
      K.FONT = f.font; K.FONT_DISPLAY = f.fontDisplay; K.FONT_UI = f.fontUI; K.ITALIC = f.italic;
      K.FONT_HREF = f.fontHref; K.FONT_FACES = f.fontLoad; K.FONT_FILES = f.fontFiles;
    }
    if (K.preset === 'brand') { K.TEX = brandTex(b); K.PAGE = brandPage(b); }
    else {
      if (tokens.paper) { K.TEX.paper.base = null; K.TEX.paper.tint = null; }
      K.PAGE.accent = b.accent;
    }
    K.lookVersion++;
  };

  K.usePreset(cfg.preset || 'engraved-cosmos');
  if (cfg.brand) K.brand(cfg.brand);
})();
