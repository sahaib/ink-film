# tools

Checks and video export for this film. Each tool opens the **built** page (`./build.sh dist/film.html --wrap`) in headless system Chrome (`channel: 'chrome'`, through playwright-core) and writes only under the paths you give it.

```sh
cd tools && npm ci               # new-film.sh already did this; re-run only if node_modules is missing
                                 # ffmpeg: $FFMPEG, else /opt/homebrew/bin/ffmpeg, else ffmpeg on your PATH
```

| Tool | Command | Passes when |
|---|---|---|
| sweep | `node sweep.mjs ../dist/film.html [--step 0.25]` | `errors: 0` (renders every step of the whole film, counts console errors and warnings) |
| render | `node render.mjs ../dist/film.html out/ 2 7.5 a_opening@4 [--px 1] [--sheet sheet.png --cols 4 --cell 400]` | writes `2.png`, `7.5.png`, `a_opening_at_4.png`; the sheet is tiled by ffmpeg |
| bench | `node bench.mjs ../dist/film.html 4 a_opening@4 [--px 1.8] [--budget 18]` | every spec ≤ 18 ms/frame at 1.8 px/unit |
| fps | `node fps.mjs ../dist/film.html [start=1] [seconds=4] [--viewport 1000x1200] [--dpr 2]` | 30.0 frames/s playing live |
| ui | `node ui.mjs ../dist/film.html [--shot reduced.png]` | every line PASS: autoplay, the sound toggle, a cue firing as the playhead crosses it, keyboard, pointer, live region, Space, reduced motion, no errors |
| page | `node page.mjs ../dist/film.html shot.png [390] [844] [T]` | `horizontal overflow: false` |
| video | `node video.mjs ../dist/film.html out/ [--size 1080] [--fps 30] [--workers 8]` | `video: done`, with every `check:` line clean |

A frame spec is a global time (`12.5`) or a plate-local one (`a_opening@3.2`), **one per argument**. zsh does not split an unquoted `$T`, so `node render.mjs … $T` passes `"0 2 4"` as a single spec, which is refused. Pass `$(seq 0 2 14)` or an array.

## Video export

`--size` is the short side: 1080 gives 1080×1080, 1080×1920 or 1920×1080. The slug comes from `FILM.config.title`.

| File | What it is |
|---|---|
| `<slug>-<W>x<H>.mp4` | The master: H.264 CRF 16 with AAC 256k at −16 LUFS / −1.5 dBTP. Around 54 Mb/s at 1920×1080. |
| `<slug>-<W>x<H>-share.mp4` | The share cut: the same frames at CRF 24, with the same AAC stream, for messaging and social uploads. The picture is capped at 12 Mb/s (VBV `-maxrate 12M -bufsize 24M`), so a 90 s film is about 141 MB at most (12 Mb/s for 90 s, plus the 24 Mb buffer VBV allows, plus 256 kb/s of audio). Below the cap it is quality-driven: calm looks land well under it, and grain-heavy looks such as risograph sit at the cap. |
| `<slug>-<W>x<H>-silent.mp4` | The master's picture with no sound. |
| `soundtrack.wav` | The normalised soundtrack, 48 kHz, 16-bit stereo. |
| `poster.png` | The frame at `FILM.config.poster`, at the export's size. |
| `captions.srt` | One cue per script line. Not written when no plate has `lines`. |

A film without `lib/audio.js` gets silent cuts: no `soundtrack.wav` and no master with sound.

- **Picture.** Every frame is `renderAt(i / fps)` on a paused page, read back in the same evaluate. The paper and void textures are built at 2 px/unit (or at the export's own density if higher) and drawn down. Frames go to one ffmpeg in order, which encodes both cuts in the same pass: H.264 High, preset slow, yuv420p, a GOP of two seconds, tagged BT.709 (matrix, primaries, transfer, limited range), `+faststart`.
- **Fonts.** Every page waits for the caption faces with every glyph the lines use. Each worker page must load the same faces as the first page, before and after its frames. Otherwise the export fails and names the worker and the face, rather than lettering some frames in a fallback.
- **Sound.** `FILM.audio.renderOffline()` renders the same instrument you hear live, seeded. The loudness chain:
  1. Lift to about −16 LUFS.
  2. A limiter with a −3.5 dB ceiling and a look-ahead, 4× oversampled.
  3. Two-pass linear `loudnorm` to −16 LUFS / −1.5 dBTP.
  4. AAC 256k with Apple's `aac_at` (ffmpeg's own `aac` if that is missing).
- **Loudness readings differ by meter.** On the same file, `loudnorm`'s measurement (printed as `I=-16.00`) and `ebur128` (about −16.5) disagree by about 0.5 LU. That is within tolerance, and the chain is intentional: it targets `loudnorm`'s reading.
- **Captions.** Each plate line is a cue from `at` until its fade ends, 0.1 s before the plate ends, or until the next line starts, whichever comes first.
- **Self-check.** Every video file must decode to every frame; decoded frames are counted, not packets, so an edit list can't hide one. Frames around four moments are then rendered again in a fresh page, last first, and compared with both cuts. For each moment the check takes the first and the last frame of its boil tick, plus the frame either side of each. The ink boils 12 times a second, so frames within a tick are nearly alike, while a frame one early or one late meets a neighbour across a tick change. The export fails when:
  - a re-render is not byte-identical to the frame that was encoded, meaning a plate keeps state between frames or something loaded mid-render;
  - a decoded frame is clearly a neighbour's, meaning a frame was dropped, doubled or shifted either way. The test: at any of four block-average scales (×1, ×2, ×4, ×8), the frame is nearer the neighbour's render than its own, and those two renders are at least twice that distance apart. Averaging strips the encoder's grain-scale loss far faster than a tick's change, which is what lets the capped share cut be checked. That a correct frame passes is measured, not proven: correct exports reach at most about 0.73 of the failing threshold across presets, aspects and 24/30/60 fps, so a failure means a frame sits nearer a neighbour's render than its own. Neighbours too alike to tell apart are marked `alike`;
  - a channel is shifted on average by 1/255 or more on the master, meaning the wrong matrix or range. The conversion runs once, before the cuts split, so the master measures it for both. The share cut is held to 2/255 as a gross check, because its 12 Mb/s cap alone moves chroma by up to about 0.9/255 on grainy looks.
  The remaining mean |Δ| is encoding loss from the finest grain dropped: about 2/255 on the master, and 3–6/255 on the share cut, rising to about 10/255 where the cap bites (risograph at 1080).

To check subtitles with ffmpeg 8, map the stream explicitly: `ffmpeg -i captions.srt -map 0:s -c:s srt -f null -`. Plain `-f null -` refuses any subtitle-only input.
