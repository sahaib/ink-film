# Ink Film — Learnings

Read this before every film. Append to it after every film. Format: **symptom → cause → fix → where the fix lives now.** When a fix has been needed twice, promote it into the style bible or the starter and note that here.

---

## From *To My Mind That Forbids* (2026-09-23)

### Process
- **Brainstorm the reading before the storyboard.** Writing back the poem's meaning (addressee, arc, central irony, loop vs resolve) and asking only 2–3 multiple-choice creative questions got a storyboard approved in one pass. → SKILL.md stage 2.
- **Ask, don't infer, identity-bearing imagery.** "Lost my religion" invites specific symbols; the author chose *universal* (lamp, folded hands, thread). Never infer faith from a name. → SKILL.md stage 2.
- **The user's "no tooltips" meant no words in the art at all.** Dimension lines got a small ring where a number would sit; protractor ticks that read as a letter were redrawn. Grep for `K.write`/`fillText` before shipping. → Hard rules.
- **Parallel agents per plate pair, each rendering and reading its own frames, worked** — 7 plates drawn in ~25 min. Seam contracts (e.g. "Vitruvian circle at (500,450) r 330 in the last second" → clock ring at the same place) made the joins land first time. → SKILL.md stage 4.
- **Send fixes back to the same agent** — it keeps its context; three targeted fixes each took 2–6 min.
- **Read every line an agent wrote before publishing** (≈3,600 lines here). Found nothing malicious; did find the rules held. Non-negotiable.

### Engine & kit
- **Composite elements didn't fade** — every kit primitive sets its own `globalAlpha`, so `ctx.globalAlpha` around them does nothing → added the `K.A` multiplier and `K.fade(a, fn)`. → `lib/kit.js`; rule in the bible.
- **Grey half-transparent veil when crossfading a reveal** (galaxy → iris) → don't cross-fade two layers of the same object; make it one camera pull-back where new parts enter from the frame edges at full alpha. → style bible §7.
- **Flat, clip-art stain edges** on the blueprint ink-bleed → fbm-displaced fibrous edge + pooled tide-line layer + stipple fringe + capillary tendrils, paper grain showing through. → style bible §4.
- **Generic purple nebula** → engraved nebula: ruled streaks + stipple dust + tiny star-forming knots over a faint cold wash. → `examples/to-my-mind` (a_orrery `buildDust`).
- **Signature ran off the frame** → `K.write` needs `align: 'right'` for right-anchored text. → noted in the kit API.
- **2-second stall when the canvas shrank** — the adaptive-resolution step rebuilt every texture and re-ran every `init()` → only rebuild textures when the canvas *outgrows* them. → `lib/engine.js`.
- **Captions need per-plate control of their backing** (the paper→blueprint switch) → `scrim` may be a number or `(t) => 0..1`. → engine.
- **Match cuts and continuous cuts** are cheapest when plates share a drawing function (memory → lost, rumble → thunder) or a single clock (storm VII/VIII run on `T = t` and `T = 7 + t`).
- **A plate's `draw` is called with `t` up to `dur + transition`** (outgoing side of a transition) and sometimes twice per frame — keep it pure and cheap.

### Tooling
- **zsh does not word-split unquoted variables** — `node render.mjs … $T` passed the whole list as one argument (→ `renderAt(NaN)` → NaN colours). Use `$(seq …)` or arrays. → tools README.
- **Compositing a contact sheet in the page crashed Chrome** at ~37 full-size PNGs → tile with ffmpeg; the page now only makes one small labelled copy per frame. → `tools/render.mjs --sheet`.
- **Homebrew ffmpeg may lack `drawtext`** — label sheets another way or not at all.
- **`bench.mjs` numbers are pessimistic** (getImageData forces a sync, headless rasterises in software). The truth is `fps.mjs` playing live; both are recorded.
- **Frame-exact export**: pause via `#t0`, force the pixel ratio, and grab the canvas in the same evaluate as `renderAt(T)`, so the rAF loop can't draw in between. *(Superseded in part — see "Build textures at a fixed high resolution" below: the pinned export page now boots small and builds textures at `max(2, px)`.)*

### From building the skill's tools (2026-09-23)
- **Round the canvas down, never up.** Rounding `W·PX` up left a one-pixel sliver of the previous frame in the last column at some sizes — a frame that isn't a pure function of time. → `lib/engine.js`.
- **Build textures at a fixed high resolution before export**, not from the viewport: the poem's first exporter built 16:9 textures at ~1.09 px/unit vs 1.84 for 1:1. The pinned export page boots small, loads every glyph the lines use, builds textures at `max(2, px)`, then draws them down. → `tools/common.mjs`.
- **Stream frames into ffmpeg**, don't write a frames folder (90 s at 1080×1920 ≈ 8 GB of PNG). → `tools/video.mjs`.
- **Tag BT.709 fully** (matrix, primaries, transfer, limited range) — the poem film's MP4 only tagged part of it.
- **A flat "< 3/255 vs the renderer" gate fails good exports** of grainy films (CRF 16 loses up to ~2.9/255 of grain). Gate on determinism (re-render byte-identical), alignment (each decoded frame nearest its own render) and colour shift instead.
- **`ffmpeg -i captions.srt -f null -` fails on ffmpeg 8 for every SRT** — use `-map 0:s -c:s srt -f null -`.
- **Masters are big** (~54 Mb/s at 1920×1080 ≈ 600 MB for 90 s) — ship a share cut alongside: CRF 24 with a 12 Mb/s VBV cap (≤ ~141 MB per 90 s: the VBV bound plus audio). Grain decides the bitrate: uncapped, risograph ran 34 Mb/s where blueprint ran 9–13.
- **Masters are byte-identical run to run; share cuts are not** (VBV + threads). Gate the share cut on frame count, alignment and a looser colour shift (2/255); the colour conversion happens once, upstream of both cuts, so the master's 1/255 check covers it.
- **Muxing to the shorter stream drops the last frame** — count frames in every delivered file, not just the master.
- **Test both shift directions.** Boil ticks (12 fps) inside 30 fps video mean a frame's next neighbour is often near-identical: an alignment check that only compares against "different" neighbours caught late shifts but let an early shift pass. Sample the frame either side of each tick change. Count **decoded** frames — packet counts hide edit-list drops.
- **Never feed a big PNG to a synchronous ffmpeg over stdin** — once in a few hundred runs it never saw EOF and the export hung. Write the file, pass the path.

