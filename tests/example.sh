#!/bin/sh
# The frozen example still rebuilds to its committed file, byte for byte, and still plays clean.
#   sh tests/example.sh
#   - examples/to-my-mind/build.sh, run in a copy of the example with no arguments, rewrites
#     to-my-mind.html identical to the committed one (cmp); so does an explicit relative out path
#     given from another folder
#   - its --wrap build sweeps with no console errors across the whole 90 s, and re-measures its
#     captions when the caption face lands late (latefont.mjs)
# The repo itself is never written to.
set -u
. "$(dirname "$0")/common.sh"
work example
E=$SK/examples/to-my-mind
REF=$E/to-my-mind.html

[ -s "$REF" ] || { bad "no committed $REF"; finish example; }
cp -R "$E" "$W/copy" || exit 1
rm -f "$W/copy/to-my-mind.html"
if out=$(sh "$W/copy/build.sh" 2>&1) && cmp "$W/copy/to-my-mind.html" "$REF"; then
  pass "rebuild with no arguments writes to-my-mind.html next to build.sh, identical to the committed file ($(wc -c < "$REF" | tr -d ' ') bytes, cmp)"
else bad "rebuild differs from the committed to-my-mind.html: $out"; fi

mkdir -p "$W/elsewhere" && cd "$W/elsewhere" || exit 1
if sh "$E/build.sh" out/film.html > /dev/null && cmp out/film.html "$REF"; then
  pass "build.sh out/film.html from another folder writes there, identical (cmp)"
else bad "explicit relative out path"; fi
sh "$E/build.sh" "$W/wrapped.html" --wrap > /dev/null || bad "--wrap build"

# The sweep borrows a scaffolded film's tools (playwright-core).
if [ -n "${INK_FILM_TOOLS:-}" ] && [ -d "$INK_FILM_TOOLS/node_modules" ]; then TOOLS=$INK_FILM_TOOLS
else
  scaffold "$W/host" || { bad "scaffold a film for its tools"; finish example; }
  TOOLS=$W/host/tools
fi
sw=$(cd "$TOOLS" && node sweep.mjs "$W/wrapped.html" 2>&1)
echo "$sw" | grep -q 'across 0–90s; errors: 0$' && pass "example sweep: $sw" || { bad "example sweep"; echo "$sw" | sed 's/^/    /'; }
INK_FILM_TOOLS=$TOOLS node "$TESTS/latefont.mjs" "$W/wrapped.html" || fail=1

finish example
