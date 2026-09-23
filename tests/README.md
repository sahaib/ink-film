# tests

Checks for the skill itself: the scaffold, the starter in every look and shape, the frozen example, and the tools through to a finished video. Run them after any change to `scripts/`, `starter/` or `examples/`.

```sh
sh tests/run.sh                    # everything, about 2¾ minutes on an M4 Pro
sh tests/run.sh scaffold example   # only these suites
KEEP=1 sh tests/run.sh             # keep the films, frames, contact sheets and video to look at
SKIP_FPS=1 sh tests/run.sh         # skip the live frame-rate runs (on a busy or slow machine)
```

`run.sh` prints every suite's output, then a summary: one line per suite with its PASS and FAIL counts, exit code and time, then every FAIL line. It exits 1 if anything failed. Each suite also runs on its own, for example `sh tests/check.sh blueprint`.

**Needs:** macOS with Google Chrome, Node.js 20 or later with npm, ffmpeg and ffprobe (`brew install ffmpeg`), and network access for Google Fonts and the first `npm ci`. The tests have no `node_modules` of their own. Every film is scaffolded with `scripts/new-film.sh`, which runs `npm ci` in the film's `tools/`, and the browser tests borrow one film's `playwright-core`. Everything is written inside one `mktemp -d` folder, removed at the end. Nothing is written into the repository.

## Suites

"Review Focus" items are the five failure modes the skill's build plan singled out as most likely to hurt a real user: (1) plates that assume a square frame, (2) a preset switch leaving stale textures, (3) brand colours with unreadable contrast, (4) exported frames drifting from the rendered ones, (5) the scaffold overwriting an existing folder. Each has a test below.

| Suite | Time | What it proves |
|---|---|---|
| `scaffold.sh` | ~24 s | `scripts/new-film.sh` keeps its contract. A bad aspect, preset or title, or a missing folder, exits 2 and creates nothing. Called by absolute path from another folder, it copies exactly the starter (`tools/` without `node_modules`), changes only the aspect, preset and title lines, installs the tools, and prints the title verbatim. A title holding `' " / & \ \c </script>` and non-ASCII reads back unchanged in JavaScript and as the page `<title>`, and the film boots (`boots.mjs`) and sweeps clean. So does `A <!--<script> B`, which would otherwise put the HTML parser in its escaped-script state and swallow the page. A title and colophon written in double quotes (`"Ada's \"Ink\" <b>"`) reach the page escaped, and a colophon line in neither quote style makes `build.sh` warn. A relative path, an existing empty folder (`.`, `<empty>/.`) and a symlink to one work. **Review Focus 5:** scaffolding into the same folder again exits 2, and a checksum of the file list and contents shows the folder unchanged, with nothing modified. A folder holding one stray file, or a path that is a file, is refused the same way. The target is resolved before it is judged: `<non-empty>/typo/..` with `typo` missing exits 2 with the folder unchanged and `typo/` never created, and `<non-empty>/.` and `<non-empty>/lib/..` are refused. `..` is read as the file system reads it: `a/link/../new` lands beside the link's target, and nothing else is touched. A copy that fails part-way removes everything the run made, including the folders it created on the way, and only that: folders it made named `film*` or `new-[ab]` never take the user's empty `film-a` or `new-b` with them. A hangup part-way (under dash, which runs no exit trap on an untrapped signal) cleans up the same way. A file written into the target during the copy is refused and left alone. With `CDPATH=.:/tmp` exported, a relative script, film build, example build and test suite all work. A copy of the skill reached through a symlinked script scaffolds from its own starter. npm failing or missing gives a warning with exit 0, and the film still builds. |
| `check.sh` | ~100 s | The starter in all 12 combinations: 4 presets × 1:1, 9:16 and 16:9. Each film is scaffolded, built, swept with its own tools (`errors: 0`) and rendered. Contact sheets of the frames go in `sheets/`. A film with a plate listed in its config but no scene file sweeps with exactly one error, the engine's warning for that plate, and passes `missing.mjs` (below). It then runs `focus.mjs`, `extras.mjs`, `exact.mjs`, `latefont.mjs` and live fps (below). |
| `example.sh` | ~12 s | `examples/to-my-mind/build.sh` rebuilds `to-my-mind.html` byte for byte (`cmp`), both with no arguments and with an explicit relative path from another folder. Its wrapped build sweeps all 90 s with no errors, and passes `latefont.mjs` (below): a caption face that lands 6 s late re-measures the poem's first line. |
| `export.sh` | ~30 s | The tools end to end on a fresh 16:9 blueprint film. It runs `sweep` and `ui` (every line PASS), then `video.mjs --size 540 --workers 4`, whose own self-check must be clean. ffprobe must show 960×540, the config's duration and an AAC track. The share cut has the master's streams and audio packets and is smaller, and every other file is written. **Review Focus 4:** the MP4 frame at 2.0 s is within 3/255 of a direct `renderAt(2)` and nearer to it than to `renderAt(2.1)` (`framematch.mjs`). `captions.srt` parses with `ffmpeg -i captions.srt -map 0:s -c:s srt -f null -`, and its first cue is the first plate's first line. |

What `check.sh` runs after building its films:

| File | What it proves |
|---|---|
| `focus.mjs` | **Review Focus 1, aspect centring.** The brightest region of `a_opening@4` sits within 8% of the frame centre in all 12 films. Two negative controls, plate A with the square hard-coded in 9:16 and 16:9, must fail the same measure. **Review Focus 2, preset switch.** Mean colour differs by more than 40 between blueprint and risograph, and a live `K.usePreset()` rebuilds the textures. **Review Focus 3, low-contrast brand.** `ink #777` on `paper #888`, and the dark pair, each log one contrast warning and get a caption ink of at least 4.5:1. Also: caption inks reach 4.5:1 in every preset; 9:16 captions and their scrim stay out of the bottom 20%; and a client font embedded as a data URI loads and letters the captions, while a remote font URL is refused and no request leaves the page. |
| `extras.mjs` | Page behaviour in each preset. The preset's font stylesheet is linked once and the caption face loads. Reduced motion starts paused on the poster frame. The sound button is shown, because the starter ships `lib/audio.js`. `film.size` matches the canvas, and network requests go only to Google Fonts. |
| `exact.mjs` | The starter's `engraved-cosmos` preset reproduces the poem film's kit (`examples/to-my-mind/kit.js`): palette roles, caption face and the paper, void, grain and vignette textures are byte-identical at 1, 1.08 and 1.8 px/unit. |
| `missing.mjs` | A plate with no scene registered draws the bare ground and letters nothing: no `fillText` across 12 frames of it, so its id never appears on screen. The engine warns `[ink-film] no scene registered for plate "<id>"` exactly once. |
| `latefont.mjs` | A caption face that lands after the engine stops waiting for it (2.5 s) re-measures the lettering. With every `fonts.gstatic.com` response held back 6 s, the 1:1 engraved-cosmos film starts in the fallback face, and once the face lands the first script line is as wide as on a normal load, within 0.5 units. The width is read from where `K.write` puts the first and last letter. |
| fps | The 9:16 engraved-cosmos film plays at 30 frames/s or more (≥ 29.5), from 1 s and from 5 s. |

## Helpers

- `common.sh`: shared shell setup. It finds the skill folder, `new-film.sh`, ffmpeg and ffprobe, and provides `pass`/`bad`, the work folder, `scaffold`, `replace_line` and `config_value`.
- `browser.mjs`: loads `playwright-core` from the film tools folder named by `INK_FILM_TOOLS`.
- `boots.mjs`: a built film boots: every `<script>` build.sh wrote is its own element, `film.ready` turns true, no page error.
- `framematch.mjs`: the Review Focus 4 comparison, callable on its own: `node framematch.mjs <video.mp4> <t> <renderAt(t).png> <control.png>`.
- `look.sh`: not a test. It gives a quick look at the starter in one preset and aspect: `sh tests/look.sh risograph 9:16 ~/Desktop/look a_opening@4 b_closing@3`.
