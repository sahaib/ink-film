# Ink Film — Style Bible

The look is *a scientific engraving that breathes*: every line inked by hand, every tone built from lines, every surface printed on something with tooth. These are the rules that make it read that way. Presets (`presets/`) change the inks and paper; they do not change these rules.

## 1 · Line

| Rule | Value | Why |
|---|---|---|
| Every outline is traced, never stroked straight | `K.ink(ctx, pts, colour, width, amp)` with `amp` 0.3–1.4 | a pen wanders; a vector doesn't |
| Wobble is smooth, not jitter | `K.trace` offsets along the normal with value noise (2 octaves) | noise per vertex looks like a bad scanner |
| Lines **boil** | re-seed each element with `K.seed(n)` → new strokes 12× per second | the "drawn every frame" feel; 12 fps = animating on twos |
| Hold what must hold | `K.still(n)` for text-adjacent marks, UI-like geometry, anything that would shimmer distractingly | boil everything and nothing reads |
| Weights | outlines 1.3–2.2 · detail 0.7–1.1 · construction 0.6–1.0 at 0.15–0.35 alpha · heroes up to 3.2 | hierarchy by weight, not colour |
| Ends | round caps and joins | ink pools at the ends of a stroke |

## 2 · Tone is made of lines

- **Hatching carries shading.** `K.hatch(ctx, region, { angle, gap, density: (x,y) => 0..1 })`. Each hatch line gets its own threshold, so lines run unbroken through dark passages and stop where the tone lifts — engraving, not noise.
- **Crosshatch only in the darker half** (`K.crosshatch` draws two passes; its second starts at `density − 0.45`). For the very darkest, add a third `K.hatch` pass yourself at `(density − 0.7) / 0.3`.
- **Spheres:** `K.sphereTone(cx, cy, r, lx, ly)` gives a Lambert density — light always comes from a story reason (the soul lights the mind; the lamp lights the room).
- **Gaps:** 2.4–3.6 for objects, 3.3–4.8 for walls/skies, larger for far planes. Step 6–16.
- **Stipple** for dust, grit, nebulae, skin of a planet at the terminator (`K.stipple`, density-weighted).
- **Halftone** (risograph) replaces hatching as the tone device: `K.halftone(ctx, region, { density, cell, angle })`.
- **Form lines:** on hero objects, follow the form (latitudes on a sphere, folds on cloth) in the half-tones only.

## 3 · Fill & print

- Flat fills **off-register** (`K.fill` misregisters by the preset's `K.MIS`: brand 0.6, blueprint 0.9, engraved cosmos 1.4, risograph 3.5). The line art sits on top, slightly out of step — a hand-pulled print.
- Pencil texture: a sparse, light hatch in a lighter tint over lit areas (alpha 0.15–0.2).
- Glows: `K.glow` with `'lighter'` on dark grounds, `'screen'` or `'source-over'` on light paper (lighter blows paper out to white). `K.glowMode(tone)` picks for you — and treats blueprint's dark cyanotype paper as dark.

## 4 · Grounds & texture (built once, drawn every frame)

| Ground | Recipe |
|---|---|
| **Paper** | base colour · 90 soft blotches (~65% darker, ~35% lighter) · 1,500 short curved fibres · 2,600 specks · edge darkening · ±8 pixel noise (engraved cosmos; each preset has its own recipe) |
| **Void** | near-black with a blue bias · 50 faint cloud blotches (navy / plum) · ±4.5 pixel noise |
| **Grain** | 256 px device-pixel tile of black/white specks, offset every boil frame — over everything |
| **Vignette** | radial, 0 → 0.42 black at the corners |
| **Ruled sky** | horizontal wobbling rules, density rising toward the top (`K.ruledSky`) — the engraver's way of laying in a sky |
| **Stains / bleeds** | fbm-displaced fibrous edge + pooled tide-line + stipple fringe + capillary tendrils (see the ink-bleed in `examples/to-my-mind`, plate IV) |

Tint a ground with `K.paper(ctx, tint, alpha)` (multiply keeps the grain): sepia for memory, cool grey for ritual, cyanotype blue for blueprint.

## 5 · Palette roles

Colours are **roles**, not decorations. Every preset fills the same roles.

| Role | Meaning in the story | Engraved Cosmos |
|---|---|---|
| `void` / `voidInk` | the cosmos, the unknown; ink used on it | `#07070F` / `#E8DDC2` |
| `paper` / `ink` | the lived world; iron-gall ink | `#EDE0C4` / `#2B1A10` |
| `soul` / `soulHot` | the warm self, the thing at stake — the anchor motif | `#F3A53A` / `#FFE6A8` |
| `mind` / `mindDeep` / `cyan` | structure, rules, the cold system | `#86B3E3` / `#16284A` / `#A9DDEA` |
| `ember` | danger, the individual, blood | `#B8412C` |
| `gold` / `goldLight` | wealth, brass, machinery | `#C99A3E` / `#EACB7A` |
| `ash` | the soul drained | `#6E6862` |
| `blueprint`, `storm`, `stormLight` | scene-specific grounds | `#13274B`, `#2B2440`, `#8E86AA` |

One warm accent against a cool system is the whole colour story. Spend saturation only on the anchor.

## 6 · Typography

- **Script lines** are hand-lettered: the preset's caption face (IM Fell English italic in Engraved Cosmos), written on letter by letter (≈0.06 s/char, soft 5-char leading edge), tiny per-letter jitter and rotation, a faint second impression offset 0.7 units (ink spread).
- Placement: lower-left band (bottom ~22% of the frame kept quiet), second line indented ~36 units; a scrim of the ground colour fades up behind them. Single-line plates sit on the lower baseline.
- Lines hold until 0.8 s before the plate ends, then fade.
- A signature, if any, is right-aligned in the last plate.
- UI (outside the film) uses a small-caps companion face and a mono for time.

## 7 · Motion grammar

| Device | Rule |
|---|---|
| Camera | slow push ≤ 7% over a plate; parallax ×0.25 for far layers; dives use `easeIn`, pull-backs `easeInOut` |
| Drawing-on | construction lines, orbits, threads and diagrams **draw themselves** (`K.part(pts, p)`) — the film shows its making |
| Life | something always moves: flicker, drift, rotation, breathing, the boil |
| Rhythm | a heartbeat (~72 bpm) is a good clock for anything alive |
| Impact | a single damped jolt (≤ 4 units, softened ×0.2 for reduced motion) on stamps, pins, strikes |
| Cuts inside a plate | jump-cuts with a splice line and a 0.14 s paper flash — for repetition ("as I say again") |

**Transitions** (engine, per plate in `film.config.js`):

| Type | Use when |
|---|---|
| `cut` | the next plate continues the same composition (share the drawing function) |
| `fade` | a match-cut — the same shape in both plates at the same place and size |
| `dark` | a chapter break; the engine veils the outgoing plate to the void, then lifts it off the next |
| `flare` | diving into a light (star, flame, sun) and out into a new world |
| `iris` | opening from black (after an eye closes, a pupil fills the frame) |

**Seam contracts** are written before plates are built: exact geometry at the join and what the outgoing plate shows for `t` up to `dur + transition`.

## 8 · Motifs

- One **anchor** that recurs and changes state across the film (bright → dimmed → cracked open). In the poem film: the amber soul-point at the chest, the thread to a star.
- **Construction geometry** as a visual rhyme: compass arcs, degree ticks, dimension lines with arrowheads (a small ring where a number would sit — no numerals).
- **Callbacks at the climax:** debris from earlier plates (blueprint scraps, coins, gear teeth) returns in the big moment.

## 9 · Composition

- Short side = 1000 units. Keep subjects inside the central 80%; keep the caption band quiet — the bottom ~22% in 1:1 and 16:9, `H × 0.66–0.80` in 9:16.
- 9:16: stack vertically — sky above, subject in the middle third, lines below. 16:9: subject off-centre on a third; lines lower-left.
- Figures: slim ink silhouettes, short dark hair, minimal face (brow/nose line, closed eye), the anchor point at the chest. Seen from behind or in profile more often than front-on.

## 10 · Budgets & accessibility

- ≤ 18 ms/frame per plate at 1.8 px/unit (`tools/bench.mjs`); draws at ≤ 30 fps; resolution steps down automatically on weak devices.
- **Wide and tall frames have 1.78× the pixels.** The engine's fixed cost (paper blit, grain, vignette) is ~5.5 ms in 1:1 but 6–8 ms in 9:16 / 16:9, leaving a plate ~10 ms of its own there. Pre-render more; hatch less densely on big far planes.
- **9:16 captions sit above the platform UI** (Reels, Shorts, TikTok cover the bottom ~20% and a strip on the right): the last line's baseline is at `H × 0.78`, the caption band spans roughly `H × 0.66–0.80`. Keep that band compositionally quiet and keep subjects out of the bottom 20%.
- Heavy static art → pre-render in `init()` (`K.makeCanvas`), 3 boil variants cycled by `K.boil % 3`.
- One flash per scene max, never strobing; `FILM.reduced` → shake ×0.2, no negative frame, softer white; page starts paused on a composed frame.
- Script lines are mirrored into a visually-hidden live region for screen readers.
