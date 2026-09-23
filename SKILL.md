---
name: ink-film
description: Make hand-drawn animated films in code — every frame drawn in JavaScript on a canvas in an engraved, blueprint, risograph or brand-mapped style — from a poem, script or brand story, then deliver a private web page plus MP4, silent MP4, WAV and SRT. Use when the user asks for a film "like the poem one", an animated poem, a hand-drawn / engraved / etched / ink / risograph / blueprint animation, an illustrated explainer or brand film, a video "drawn frame by frame in JavaScript", or types /ink-film.
---

# Ink Film

Turn words into a short film whose every frame is drawn in code: wobbling ink lines, engraved hatching, paper and cosmos textures, hand-lettered lines that write themselves on. The first film made this way — **To My Mind That Forbids** (90 s, 9 plates) — is the reference: `examples/to-my-mind/` (source, plus the built `to-my-mind.html` you can open in Chrome).

`SKILL_DIR` below means this skill's base directory, which Claude Code shows when the skill loads (normally `~/.claude/skills/ink-film`). Shell variables don't carry over between Bash calls, so write that path into each command, or set it in the same command: `SKILL_DIR=~/.claude/skills/ink-film; "$SKILL_DIR/scripts/new-film.sh" …`.

## Start here, every time

1. Read `learnings.md` (pitfalls already paid for) and skim `films.md` (what was made before and why).
2. Get the brief: the template is `brief.md` — **never edit the template itself**. Collect the answers in the conversation; once the film folder exists (stage 3), save them as `<film>/brief.md`. If the user gave a loose request, interview them through the brief — only the missing essentials, one question at a time, multiple choice with a recommendation.
3. Then walk the stages below in order. **Each gate is a real stop: present, then wait for a yes.**

## The seven stages

| # | Stage | Output | Gate |
|---|---|---|---|
| 1 | **Brief** | the brief answered; restate it in five lines | user confirms |
| 2 | **Reading & storyboard** | the interpretation and the plate table, in one message | user approves both |
| 3 | **Style frame** | one representative plate built fully, 1–2 stills shown to the user | user approves the look |
| 4 | **Build** | every plate, drawn by parallel agents, reviewed by you | — |
| 5 | **Verify** | the checklist below, all green, with evidence | — |
| 6 | **Deliver** | page + MP4 (master, share) / silent MP4 / WAV / poster / SRT | — |
| 7 | **Log** | `learnings.md` + `films.md` appended, skill repo committed | — |

### 1 · Brief
Answer every field of the brief. Source text goes in **verbatim**; ask before "fixing" anything in it (typos may be intentional). Pick the preset(s) and aspect ratio(s) here, not later.

### 2 · Reading & storyboard
- For a poem or personal text, **write the reading first**: what it is addressed to, the arc, the central irony or turn, whether it resolves or loops. Separate what the author said from what you infer. Invite correction — it's theirs.
- Then, in the same message, the storyboard: one **plate** per movement of the text. For each: the line(s), what the frame shows, the motif, how it arrives (transition), duration. Durations sum to the brief's length.
- Ask only the genuinely open creative questions (typically: how the climax lands, how specific the imagery is — e.g. a named faith/tradition vs universal symbols, what the recurring anchor motif is). Multiple choice, recommendation first. The gate covers the reading and the storyboard together; if the author corrects the reading, revise the storyboard before building.
- Never infer someone's religion, ethnicity or identity from their name; ask or stay universal.

### 3 · Style frame
- Scaffold the film where the user wants it (default: a new folder in the current project): `"$SKILL_DIR/scripts/new-film.sh" <dir> <aspect> <preset> "<Title>"`. It refuses a non-empty folder, copies the starter and installs the tools (`npm ci`).
- Save the brief as `<dir>/brief.md`.
- The scaffold ships two **example plates** (`scenes/a_opening.js`, `scenes/b_closing.js`) and a two-plate `plates` list in `film.config.js`. Delete them and write your own plates; set `plates` to the storyboard's order, durations and transitions.
- Build the single most representative plate to finished quality, build the page (`./build.sh dist/film.html --wrap`), render it (`node tools/render.mjs dist/film.html out/style <plate>@<t> --px 1.08`) and show the stills — with SendUserFile if you have it, otherwise give the PNG paths. Changing the look here costs minutes; after stage 4 it costs hours.

### 4 · Build
- One agent per plate pair (fork or fresh agent with the brief template below), each owning **one scene file** and rendering + reading its own frames in a loop. Agents never edit `lib/` or another plate's file.
- Define seam contracts before dispatch: where a match-cut circle sits, what the last frame of plate N must be for plate N+1's transition (e.g. "full black at t ≥ dur", "ring at (500,450) r 330").
- You review contact sheets as agents finish and send targeted fixes back to the **same** agent (it keeps its context).

### 5 · Verify (evidence, not confidence)
From the film folder, build the **local** copy the tools use: `./build.sh dist/film.html --wrap`. Then:
- `node tools/sweep.mjs dist/film.html` → `errors: 0` (renders every 0.25 s of the whole film).
- `node tools/render.mjs dist/film.html out/sheet $(seq 0 2.5 <total − 0.1>) --sheet sheet.png --cols 6` — **look at it**. (T = total wraps to frame 0, so stop just short of it.) Then every transition window and the loop seam (last frame ≈ first frame if it loops). One spec per argument (`12.5` or `plate@3.2`); in zsh use `$(seq …)`, never an unquoted variable.
- `node tools/fps.mjs dist/film.html <startT> 4` from several start points → 30.0 frames/s; `node tools/bench.mjs dist/film.html plate@t … --budget 18` → every plate within budget.
- `node tools/ui.mjs dist/film.html` → every line PASS (controls, sound, keyboard, seek, reduced motion).
- `node tools/page.mjs dist/film.html out/phone.png 390 844` and `… out/desk.png 1440 900` → no overflow, no page errors.
- Text rule: `grep -n "K.write\|fillText" scenes/*.js film.config.js` → only script lines and the signature. Network rule: `grep -nE "fetch|XMLHttpRequest|WebSocket|eval\(|localStorage|https?://" scenes/*.js film.config.js` → no hits (the engine's own Google Fonts loading lives in `lib/` and `head.html`).
- **Read every line of agent-written code before publishing.** You never ship what you haven't seen.

### 6 · Deliver
- Build the **publish** copy (no wrapper — the host adds its own page skeleton): `./build.sh dist/publish.html`. Publish it privately with the Artifact tool (`icon: "film"`) if you have it; otherwise give the user `dist/film.html` to open in Chrome or to host (it is the complete page; `dist/publish.html` lacks the page skeleton a host like Artifacts adds).
- `node tools/video.mjs dist/film.html out/ [--size 1080]` → `<slug>-<W>x<H>.mp4` (master: H.264 CRF 16, BT.709, AAC −16 LUFS / −1.5 dBTP), `<slug>-<W>x<H>-share.mp4` (CRF 24, capped at 12 Mb/s, for uploads), `<slug>-<W>x<H>-silent.mp4`, `soundtrack.wav`, `poster.png`, `captions.srt` (only if the film has script lines). It self-checks (re-rendered frames byte-identical, each decoded frame nearest its own render, no colour shift) and exits non-zero on failure.
- More than one aspect: plates written with `K.W`/`K.H` adapt. Change `aspect:` in `film.config.js`, rebuild, check the frames again, and export each aspect into its **own** folder (`out/9x16/`, `out/16x9/`) — `poster.png`, `soundtrack.wav` and `captions.srt` carry no aspect in their names.
- Check the captions file with `ffmpeg -i out/captions.srt -map 0:s -c:s srt -f null -` (exit 0).
- Hand over the files. SendUserFile (if you have it) caps at 30 MB: send the poster and a preview — `ffmpeg -i out/<slug>-<W>x<H>-share.mp4 -c:v libx264 -preset slow -b:v 2250k -maxrate 3200k -bufsize 6400k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/preview.mp4` (~26 MB for 90 s). The masters stay on disk; give their paths.
- Tell the user: the link (private; share from the page's Share menu), how to deep-link a moment (`#t42`), what was verified.

### 7 · Log — this is what makes the next film better
- `learnings.md`: every new pitfall (symptom → cause → fix → where the fix now lives) and every technique that worked better than the bible says. Like `films.md`, it may be public: write lessons, not client details.
- `films.md`: date, brief in two lines, preset, aspect, plates, the user's decisions. **This file may be public** (the skill is shared): no private URLs, no absolute paths, no client names or unreleased scripts without permission — describe client work generically.
- If a technique proved itself twice, **promote it** into `style-bible.md` or the starter, and say so in learnings.
- Commit: `git -C "$SKILL_DIR" add learnings.md films.md && git -C "$SKILL_DIR" commit -m "log: <film title>"` (add any promoted files too).

## Hard rules
- Short side = **1000 logical units** (1:1 → 1000×1000 · 9:16 → 1000×1778 · 16:9 → 1778×1000); export at 1.08 px/unit → 1080×1080 · 1080×1920 · 1920×1080. Plates use `K.W`/`K.H`, never literal 1000.
- Every frame is a **pure function of time**. No `Math.random` in drawing — use `K.seed/K.still/K.stable`.
- Ink boils at **12 fps**; playback draws at **≤ 30 fps**; each plate **≤ 18 ms/frame** (`bench.mjs`, 1.8 px/unit).
- On-screen text = the script lines + optional signature only, unless the brief says otherwise. No labels, tooltips, numerals-as-labels.
- No runtime network except Google Fonts; no external images; no storage; no eval.
- At most **one flash** per scene, never strobing. Reduced motion: the engine starts paused on the `poster` frame and softens the `flare` transition; **each plate softens its own shake and flashes** by checking `K.reduced` (e.g. shake × 0.2, no negative frame).
- Corporate: only brand assets the client owns or supplies; never another company's marks; fonts = Google Fonts or client-licensed files embedded as data URIs.
- The page is published **private** by default; exports go to the film's folder.

## The plate contract
```js
FILM.scenes.<id> = {
  tone: 'paper' | 'void' | (t) => 'paper' | 'void',  // caption ink colour
  lines: [{ text: 'Exact line from the script,', at: 1.2 }], // engine writes them on at `at` s;
         // optional: wd (write-on seconds), out (s when it starts fading; default dur − 0.8)
  scrim: 1 | (t) => 0..1,                  // optional: caption backing strength
  sfx: [{ at: 1.7, kind: 'thunder' }],     // chime heart snap tick stamp coin thunder crackle whoosh hiss
  mood: (t) => ({ drone, warm, rumble, rain, wind }), // 0..1 sound beds
  init() {},                               // one-time layout / pre-rendered art (re-runs on texture rebuild)
  draw(ctx, t, dur) {},                    // the whole frame, K.W × K.H logical units
};
```
`film.config.js` holds everything else, one field per line: `title`, `aspect` (`'1:1' | '9:16' | '16:9'`), `preset` (`'engraved-cosmos' | 'blueprint' | 'risograph' | 'brand'`), `brand` (`null` or tokens — see `presets/brand-mapped.md`), `colophon`, `poster` (the second a reduced-motion viewer sees first), and `plates: [{ id, dur, tr: { type: 'none'|'cut'|'fade'|'dark'|'flare'|'iris', dur, at: [x, y] } }]` — `tr.at` is the iris/flare centre in logical units (default: the frame centre). **A plate's `id` is its scene file's stem** (`scenes/c_storm.js` registers `FILM.scenes.c_storm`); files load alphabetically, the config sets the running order.

## Kit at a glance (`lib/kit.js`, `lib/presets.js`)
- Time & chance: `K.seed(n)` (changes each boil frame), `K.still(n)` (never changes), `K.stable(seed)` (layouts), `K.n1/n2/fbm`, `K.sr(t,a,b)`, `K.range`, `K.easeInOut`, `K.bump`.
- Geometry: `K.seg`, `K.arc`, `K.bez`, `K.spline`, `K.xf`, `K.part`.
- Ink: `K.ink`, `K.trace`, `K.line`, `K.fill` (misregistered), `K.hatch` (tonal: `density(x,y)`), `K.crosshatch` (two passes), `K.stipple`, `K.halftone`, `K.sphereTone`, `K.glow`, `K.ruledSky`.
- Opacity: `K.fade(a, () => …)` fades a whole element — never set `ctx.globalAlpha` around kit primitives.
- Motifs: `K.soulStar`, `K.flame`, `K.thread`, `K.makeStars/drawStars`, `K.nebula`.
- Grounds: `K.paper(ctx, tint, a)`, `K.voidBg(ctx)`. Lettering: `K.write(ctx, text, x, y, { size, align: 'left'|'center'|'right', progress, alpha, color })`, `K.textWidth`.
- Frame: `K.W`, `K.H`, `K.aspect`; `K.glowMode(tone)` picks `'screen'` on light paper and `'lighter'` on dark grounds (including blueprint's dark cyanotype paper); `K.reduced`.
- Looks: `K.usePreset(name)`, `K.brand(tokens)` (warns on contrast < 4.5:1, picks readable caption inks `K.C.captionInk` / `captionInkDark`), `K.contrast(a, b)`, `K.luminance(c)`.

## Agent brief template (stage 4)
```
You are a fork/agent drawing plate(s) <ids> of the film "<title>". Execute directly.
FILE YOU OWN: <film>/scenes/<file>.js — edit nothing else. Read lib/kit.js and scenes/<style-frame plate>.js first (house style).
PLATE <id>, <dur> s, tone <tone>. Arrives via <transition>. Lines: [<exact lines with at>].
Beats: <numbered beats with times>.
END / SEAM: <exact contract with the next plate>.
Rules: plate contract; pure function of t; K.seed per element; K.fade not globalAlpha; K.W/K.H only;
text = lines only; one flash max; soften shake/flash when K.reduced; ≤18 ms/frame; declare sfx + mood.
Verify loop: ./build.sh dist/dev-<name>.html --wrap; node tools/render.mjs dist/dev-<name>.html out/<name> <id>@<t> …;
node tools/bench.mjs dist/dev-<name>.html <id>@<t> … --budget 18; read the frames at full size;
≥3 look-and-fix passes; zero console errors.
Report: file, beats with times, sfx/mood, bench numbers, sheet path, anything the integrator should adjust.
```

## Corporate films
Use `presets/brand-mapped.md`. Collect: logo (SVG/PNG they own), colours (hex), fonts (Google or licensed files), tone of voice, claims that need legal sign-off, platform + aspect + length (15/30/60/90 s), captions (burned-in or SRT), who approves. Keep the house discipline — one idea per plate, one anchor motif, text only where it earns its place.

## Requirements
Google Chrome, Node.js 20+ (tools use playwright-core, installed per film by `new-film.sh`), ffmpeg (with libx264; `aac_at` on macOS, else `aac`).

## Files
`brief.md` (template) · `style-bible.md` · `presets/` (cards + style frames) · `starter/` (engine, example plates, `tools/` with its own README) · `scripts/new-film.sh` · `examples/to-my-mind/` · `tests/` · `learnings.md` · `films.md`

**Improving the skill itself:** after changing anything in `starter/`, `scripts/` or `examples/`, run `tests/run.sh` — it scaffolds films in every preset × aspect, sweeps them for errors, checks centring, preset switching, contrast, fonts, reduced motion and frame-exact export. Log what you changed in `learnings.md`.
