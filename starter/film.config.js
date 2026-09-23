'use strict';
/* What this film is. Loaded before every other script.
   Keep one field per line: scripts/new-film.sh and the tests replace the aspect, preset, title and
   brand lines whole.
     aspect  '1:1' | '9:16' | '16:9'  (the short side is always 1000 drawing units)
     preset  'engraved-cosmos' | 'blueprint' | 'risograph' | 'brand'
     brand   null, or tokens mapped onto the palette (works with any preset, made for 'brand'):
             { paper, ink, accent, accentHot, cool, coolDeep, dark, darkInk, fontDisplay, fontText, fontFiles }
             fonts are Google Fonts family names, or client-licensed files embedded as data URIs:
             fontFiles: [{ family, src: 'data:font/woff2;base64,…', style: 'normal' | 'italic', weight: 400 }]
     poster  the moment (s) a reduced-motion viewer sees first, paused
     plates  running order. id = the key its scene file registers in FILM.scenes.
             tr = how the plate arrives: none | cut | fade | dark | flare | iris, with dur (s);
             iris and flare centre on the frame unless given at: [x, y]. */
window.FILM = window.FILM || { scenes: {} };
window.FILM.config = {
  title: 'Untitled ink film',
  aspect: '1:1',
  preset: 'engraved-cosmos',
  brand: null,
  colophon: 'An ink film',
  poster: 4,
  plates: [
    { id: 'a_opening', dur: 8, tr: { type: 'none' } },
    { id: 'b_closing', dur: 7, tr: { type: 'fade', dur: 1.0 } },
  ],
};
