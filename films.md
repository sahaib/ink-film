# Ink Film — Films Made

Newest first. Each entry is a reference for the next brief: what was asked, what was chosen, what shipped.

---

## To My Mind That Forbids · 2026-09-23 · personal

- **Brief:** Sahaib's 12-line poem, "the life of me … from the cosmos of space", as vivid and detailed as possible. Inspiration: Kevin Ngo, *"Claude Opus 5 drew every frame of this animation using JavaScript. The life of a fruit fly."* (27 s, 1:1).
- **Reading:** a letter to two halves of the self — the mind that forbids, the soul that is grieved; faith traded for the world's definition of "human"; rituals of the grind as the real sin; a repeated bargain with the rich; a plea for a thunder that would *settle* — and a refrain that returns unchanged (a loop, not an arc).
- **Look:** Engraved Cosmos · 1:1 · 90 s · 9 plates · seamless loop.
- **Plates:** I orrery (Mind caged planet / Soul amber star) · II eye (galaxy→iris→hex mosaic of vision/fear) · III memory (child, oil lamp, thread to a star, in a locket) · IV lost (thread snaps, ink bleeds to blueprint, Vitruvian pinning) · V ritual (clock mandala, the warm walker stamped grey) · VI bargain (balance scale, gold towers, tally gates) · VII rumble (storm over the city) · VIII thunder (bolt from the soul star, shatter, rain, puddle) · IX return (Earth → cracked orrery → the first frame).
- **Decisions by the author:** thunder strikes but still loops (cage cracked, not freed) · universal faith imagery · **no tooltips/labels** — only the poem and "— Sahaib".
- **Shipped:** a private web page (Artifact) · 1080×1080 MP4 with soundtrack, silent MP4, WAV and poster via `tools/video.mjs` · source and built page in `examples/to-my-mind/`.
- **Numbers:** ~5,300 lines of JS; 30 fps at 1840 px on every plate; 0 errors across 360 quarter-second frames.

## Car service you can see · 2026-09-23 · corporate (a car-service brand)

- **Brief:** an 18 s brand film "with hooks and cuts and branding" in the trend of films drawn frame by frame in code, plus a reusable clean logo animation, plus an expressive voice-over.
- **Reading:** the owner's one moment of no control, the keys leaving the hand, answered by the window: the phone that shows the bay. Fear to sight; resolves on the lockup.
- **Look:** Brand-mapped (the client's purple, ink and paper; Newsreader lines, Inter colophon) · 9:16 with a 1:1 cut · 5 plates · ends on the lockup.
- **Plates:** I keys drop (vector) · II shutter slams over the faint car · III a phone lights in the dark and a two-colour print of the client's own workshop photograph pulls on inside it, then the camera goes through the screen · IV a wheel rolls in, two approval ticks stamp on the spoken words · V the inked sting: road line into the mark, cabin drops, wordmark inks on.
- **Decisions by the client:** the first pass (procedural geometry, thin lines) rejected for sharpness; photographs traced into prints instead; a traced close-up that read as "a wallet" replaced by a clean vector wheel; an expressive open-source voice (not flat TTS) with the picture moving to it; the logo animation also delivered clean, with alpha, for other reels.
- **Shipped:** a private page · 1080×1920 and 1080×1080 masters with the voice, share cuts, silent cuts, WAV, SRT, posters · a separate clean sting project (in / out / mark variants, ProRes 4444 and VP9 alpha, white and purple H.264, at three sizes).
- **Numbers:** 30.0 fps from five start points; 7 to 14 ms per frame; 0 errors across 72 quarter-second frames in each aspect; every export byte-identical on re-render.
- **Second pass, the same day:** the client watched it and asked for conviction and continuity. Now 25 s: the whole script recorded once (a female open-source voice, Kokoro, with phoneme markup for the brand name), the picture cut to the words through `FILM.voice.cue`, a score written in code, more of the felt problem in the middle (the wait, the bill, the parts, the chat with photo bubbles and an approval tap), an end card with the contact number above the tagline, and the closing rebuilt: a solid car derived from the mark (its front elevation is the mark) assembles in clusters, turns with four service callouts, comes apart into the mark and takes the lockup. The clean sting was rebuilt the same way (v3) with alpha exports at three sizes and a share file the film reads.
- **Third pass, the same evening:** a co-founder asked for an Indian accent on the voice. Ten audio-only candidates were sampled by the client (Kokoro's English and Hindi pipelines with its Hindi speaker packs, Parler Mini with accent descriptions, MeloTTS EN-India); the pick was Kokoro's Hindi pipeline with the hf_alpha voice and the brand name written in Devanagari, because it pronounces the name properly. The take was re-recorded, aligned and baked; every plate timing regenerated from the new line starts (film now 28 s). Lesson: keep the voice a swappable take with the timings generated from it, and check every synthetic sample by transcription when you cannot listen.

## An engraved festival banner · 2026-10-29 · corporate (a car-service app)

- **Brief:** the app's Diwali banner as a short engraved film, picked from an ideation of directions: a line-art car and a rangoli drawn stroke by stroke on warm paper, the festival words lettering themselves on, diyas breathing; a six-second seamless loop the app plays as video, English and Hindi, light and dark.
- **Reading:** a festival card that is always being printed: each part lifts back to its unprinted state (pencil, chalk guide, blind impression) just before its ink returns.
- **Look:** brand-mapped (the client's deep purple ink on warm paper, its night ground with white ink, one amber note, its violet in the rangoli); a custom 358:246 card aspect; one plate.
- **Plates:** one, 6 s: the car inked over its pencil (0 to 2 s), the rangoli ring by ring (2 to 4 s), the words lettered into a blind impression (4 to 6 s).
- **Decisions:** the car traced from the client's own 3D render, without the maker's emblem; Devanagari in a separate face because the brand faces lack it; a finished still for Reduce Motion; moving grain dropped for the file-size cap.
- **Shipped:** four 1074×738 H.264 loops under 2 MB, a poster and a finished still per variant, contact sheet, critique log, loop checks, a Devanagari shaping proof.
- **Numbers:** 180 frames per file; CRF 16 at about 2.2 Mb/s; frames 11 to 15 ms at 1.8 px/unit; every seam step under the loop's 95th percentile step.
