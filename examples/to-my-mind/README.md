# To My Mind That Forbids

The first ink film, kept exactly as it was published. It is a 90-second film of nine plates in the Engraved Cosmos look, square (1:1). It loops: the last frame is the first. The plates are orrery, eye, memory, lost, ritual, bargain, rumble, thunder and return. Its sound is synthesised in the browser and stays off until you turn it on.

## Open it

Open `to-my-mind.html` in Chrome. It is a single file with nothing to install. It needs the network only for its Google Fonts.

The file is the unwrapped build, the form that was published (the Artifact host adds the doctype and `<html>` itself). For a standalone page with its own skeleton, run `./build.sh dist/to-my-mind.html --wrap`.

## Rebuild it

```sh
./build.sh          # rewrites to-my-mind.html from head.html, kit.js, scenes/*.js, audio.js and engine.js
```

The build is byte-for-byte reproducible, so a rebuild with no source change leaves `to-my-mind.html` identical. `tests/example.sh` checks that.

## It predates the starter

This film was made before the config-driven starter, and it keeps its own `kit.js` and `engine.js`. It is square only. It has no `film.config.js`, presets or brand mapping, and the order of its plates lives in `engine.js`. Read it as the reference for what the style looks like and how a long film is paced. Don't copy it as a template.

The starter's `engraved-cosmos` preset reproduces this kit exactly: the palette, the caption face, and the paper, void, grain and vignette textures are byte-identical (`tests/exact.mjs`).

To make a new film, scaffold it from the starter:

```sh
~/.claude/skills/ink-film/scripts/new-film.sh ~/films/my-film 9:16 engraved-cosmos "My Film"
```

## The words

The poem's words are © 2026 Sahaib Singh Arora, all rights reserved. They are not covered by the code licence; see [`NOTICE`](NOTICE) in this folder, which each scene file holding the poem's words points to in its first line. The code is MIT, per the `LICENSE` at the root of the repository.
