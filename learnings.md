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


## From a corporate brand film, 18 s, 9:16 + 1:1 (2026-09-23)

### Process
- **Guessed geometry with thin grey lines was rejected on sight** ("not vivid, not clear, sloppy"). What passed: a two-colour PRINT traced from the client's own photographs (OpenCV posterise into paper / accent / ink rings with a subject mask, edge contours only inside the subject, a coarse tone grid for hatch texture), baked into a scene module and printed on in stages. Photos for scenes with a light subject on a dark ground; clean vector shapes for hero objects (keys, a wheel). Dark close-ups (a part in a hand, a wheel with a wrench) posterise into masses and read as "a wallet" or "a book": do not print those, draw them. → candidate for the style bible once it proves itself again.
- **The brand token `accent` is not a role.** `K.brand` maps it onto `soul` (and `accentHot` onto `soulHot`); `C.accent` is undefined and a fill with it silently keeps the previous fillStyle. Two passes went out with the brand colour missing before anyone noticed. → use `C.soul`; the kit should warn on an unknown role.
- **A draw-on guard.** `K.part(pts, p)` returns two points for any p > 0, so every line showed a stub before it started. Every plate now wraps it: draw only when p > 0.02. → candidate for the kit.
- **Parallel agents need their own config.** `build.sh` now takes `FILM_CONFIG=path` so a dev build lists only the plates that exist without touching film.config.js. → promoted into this film's build.sh; carry to the starter when it proves itself again.
- **Seam points must be in the brief, not negotiated afterward.** The iris centre for the last plate had to sit on a tick the previous plate draws; the two agents' messages crossed twice over its coordinates. State the point once, in the config and both briefs.
- **bench.mjs in batches of six specs or fewer.** After roughly a hundred readbacks Chrome drops the canvas to software rendering and every later spec reads two to five times slow, including plates that were fine a minute earlier.
- **`render.mjs --sheet` takes a bare file name**, written inside the out directory, not a path.

### Voice-over (new)
- **Expressive open-source voice:** Chatterbox (MIT) with the exaggeration and cfg knobs, lines spelled phonetically for the brand name; its bundled watermarker fails to import on macOS (`PerthImplicitWatermarker` is None) and needs a no-op stand-in. Word timings from whisper-timestamped; a 50 Hz loudness envelope so plates can move with the voice.
- **The engine can carry a voice.** `FILM.voice.src` as a data-URI MP3 plays in step with the playhead, only while sound is on, resynced on seek and on the loop's wrap; plates read `FILM.voice.level(T)` and `FILM.voice.at(id, t)` to breathe with it. The exporter ducks the beds under the voice (sidechain) and mixes at 1:2 before the usual loudness chain.
- **Pin the mix to the film's length.** A voice mix shorter than the film made `-shortest` drop 20 frames from the master while the silent cut kept them; `apad,atrim=0:total` on the mix fixed it and the frame-count gate caught it.
- **Word times are film-global.** Subtracting a line's `at` from an already plate-local time put the keys down on "hand" instead of "keys"; an agent caught it. Write the mapping once (`FILM.voice.at`) and use it.

### The closing's car, second pass (2026-09-23, later the same day)
- **A sketched wireframe next to a mature mark reads as "immature".** The client's word for a low-poly hatchback drawn in ink lines that morphed into the logo. What passed: derive the car FROM the mark (its front elevation is the mark, panel for panel), print it solid in flat lit panels parted by hairline paper seams, no outlines, so the object and the logo are the same hand. Seams read as print registration; outlines read as sketch. The "same hand" sheet (the side view beside the final lockup at one scale) is the test that catches a wrong car; keep it in the verifier.
- **Fade a many-panel object as ONE layer.** Per-panel alpha during a dissolve lets every panel show through its neighbours (a jumble). Draw the non-mark panels into an offscreen canvas that copies the plate's transform (`g.setTransform(ctx.getTransform())`) and composite it once at the layer's alpha. About 2 ms, and only while fading.
- **Recessed panels seen at a grazing angle print as stray slivers.** During a turn's settle overshoot (yaw −2°) a wheel well became an 8 px dark tick under the bumper, in the clean sting and the film alike. Cull recessed parts (wells, sills) below 0.12 of facing, not at 0.004.
- **A settle overshoot breaks a monotonic-yaw check.** Allow exactly one change of direction, no deeper than the overshoot, and expose the overshoot on the page so the check reads it.
- **Export what the consumer renders with.** The first share file carried geometry and materials but not the painter's biases, build clusters, seam flags and far-wheel flags the solid renderer depends on. Put them in the schema, with the screen map as numbers, not prose.
- **Keep the lockup framing across versions.** Enlarging the lockup broke the "last frame equals v1" check on nine files; the car phase has its own zoom, so the end frame never needed to move. Byte-equality is too strict across renderer versions: 8 levels of 255 covers antialiasing.
- **One flag to load a scratch export**: `render.mjs` timings printed per frame are the draw call only; use `bench.mjs` for the budget.
- **Accent is a voice-pack and a phonology, not a prompt.** Kokoro has no "Indian English" voice, but its Hindi pipeline (lang 'h') with the Hindi speaker packs reads English text with Hindi phonology, and a brand name written in Devanagari is pronounced natively; the client preferred that over Parler Mini's described accent and MeloTTS's EN-India voice (which mangled the name until spelled phonetically). Transcribe every candidate with whisper as the intelligibility gate, and spell unknown compounds as two words ("Whats App") for Parler.
- **Gated models block a trial**: Indic Parler-TTS (the purpose-built Indian English model) needs the client to accept terms on Hugging Face and log in; plan the trial around what is open.
