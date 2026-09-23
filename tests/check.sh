#!/bin/sh
# The starter in every look and shape.
#   sh tests/check.sh                   all 12 films (4 presets x 3 aspects)
#   sh tests/check.sh blueprint brand   only these presets (all aspects)
#   SKIP_FPS=1 sh tests/check.sh        skip the live frame-rate runs
#
# For each preset x aspect: scaffold a film with scripts/new-film.sh, build it with --wrap, sweep it
# with its own tools (expects "errors: 0") and render a_opening@4 and b_closing@3 into frames/.
# Then the fixtures: two low-contrast brand films, a brand film with an embedded client font, two
# negative controls (plate A with the square hard-coded), and a plate with no scene file (swept, and
# checked by missing.mjs). Then contact sheets (ffmpeg tile), the Review
# Focus tests (focus.mjs), page behaviour (extras.mjs), engraved-cosmos against the poem film's kit
# (exact.mjs), a caption face arriving late (latefont.mjs), and fps on the 9:16 engraved-cosmos film.
# Exits non-zero if anything failed.
set -u
. "$(dirname "$0")/common.sh"
work check
PRESETS=${*:-engraved-cosmos blueprint risograph brand}
ASPECTS='1:1 9:16 16:9'
FRAMES=$W/frames
mkdir -p "$FRAMES"
has() { case " $PRESETS " in *" $1 "*) return 0 ;; esac; return 1; }

for p in $PRESETS; do
  for a in $ASPECTS; do
    tag=$p-$(echo "$a" | tr : x)
    dir=$W/$tag
    html=$dir/dist/film.html
    scaffold "$dir" "$a" "$p" "Check $tag" || { bad "$tag: scaffold"; continue; }
    got="$(config_value "$dir/film.config.js" aspect) $(config_value "$dir/film.config.js" preset)"
    [ "$got" = "$a $p" ] || { bad "$tag: config reads $got"; continue; }
    sh "$dir/build.sh" "$html" --wrap > /dev/null || { bad "$tag: build"; continue; }
    [ -s "$html" ] || { bad "$tag: build wrote nothing"; continue; }
    sw=$(cd "$dir/tools" && node sweep.mjs ../dist/film.html 2>&1)
    echo "$sw" | grep -q 'errors: 0$' && pass "$tag  $sw" || { bad "$tag: sweep"; echo "$sw" | sed 's/^/    /'; }
    rn=$(cd "$dir/tools" && node render.mjs ../dist/film.html ../frames a_opening@4 b_closing@3 2>&1)
    echo "$rn" | sed 's/^/    /'
    if echo "$rn" | grep -Eq '^\[(console\.|pageerror)'; then bad "$tag: render logged errors"; fi
    for f in a_opening_at_4 b_closing_at_3; do
      if [ -s "$dir/frames/$f.png" ]; then cp "$dir/frames/$f.png" "$FRAMES/$tag-$f.png"; else bad "$tag: no $f.png"; fi
    done
  done
done

# Low-contrast brand films for Review Focus 3 (warnings expected, so they are built but not swept).
if has brand; then
  for v in "lowcontrast|  brand: { ink: '#777777', paper: '#888888' }," "lowdark|  brand: { dark: '#333333', darkInk: '#444444' },"; do
    name=brand-${v%%|*}
    dir=$W/$name
    scaffold "$dir" 1:1 brand "Check $name" || { bad "$name: scaffold"; continue; }
    replace_line "$dir/film.config.js" '  brand: null,' "${v#*|}" || { bad "$name: no '  brand: null,' line to replace"; continue; }
    sh "$dir/build.sh" "$dir/dist/film.html" --wrap > /dev/null || bad "$name: build"
  done

  # A client-licensed font embedded as a data URI. The fixture is any system TTF, registered under a
  # family no system font has, with an italic file for the same family and one remote URL that must
  # be refused.
  FIXTURE=
  for f in /System/Library/Fonts/Supplemental/Herculanum.ttf /System/Library/Fonts/Supplemental/Arial.ttf /Library/Fonts/Arial.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf; do
    [ -s "$f" ] && { FIXTURE=$f; break; }
  done
  dir=$W/brand-fontfile
  if [ -n "$FIXTURE" ] && scaffold "$dir" 1:1 brand "Check brand-fontfile"; then
    B64=$(base64 < "$FIXTURE" | tr -d '\n')
    LINE="  brand: { fontText: 'Ink Fixture', fontFiles: [{ family: 'Ink Fixture', src: 'data:font/ttf;base64,$B64' }, { family: 'Ink Fixture', src: 'data:font/ttf;base64,$B64', style: 'italic' }, { family: 'Ink Remote', src: 'https://fonts.example.com/remote.woff2' }] },"
    replace_line "$dir/film.config.js" '  brand: null,' "$LINE" || bad "brand-fontfile: no '  brand: null,' line to replace"
    sh "$dir/build.sh" "$dir/dist/film.html" --wrap > /dev/null || bad "brand-fontfile: build"
  else bad "brand-fontfile: scaffold failed or no TTF fixture found"; fi
fi

# Negative controls for Review Focus 1: plate A with the square hard-coded (the bug the centring
# test must catch), in the two non-square aspects.
if has engraved-cosmos; then
  for a in 9:16 16:9; do
    name=negative-$(echo "$a" | tr : x)
    dir=$W/$name
    scaffold "$dir" "$a" engraved-cosmos "Check $name" || { bad "$name: scaffold"; continue; }
    replace_line "$dir/scenes/a_opening.js" '  const W = K.W, H = K.H;' '  const W = 1000, H = 1000;' ||
      { bad "$name: could not hard-code the square"; continue; }
    sh "$dir/build.sh" "$dir/dist/film.html" --wrap > /dev/null || bad "$name: build"
  done

  # A plate listed in the config with no scene file: the bare ground and one warning, which the sweep
  # counts as an error; missing.mjs checks that nothing is lettered and the warning comes once.
  name=missing-scene
  dir=$W/$name
  B_LINE="    { id: 'b_closing', dur: 7, tr: { type: 'fade', dur: 1.0 } },"
  if scaffold "$dir" 1:1 engraved-cosmos "Check $name" &&
    replace_line "$dir/film.config.js" "$B_LINE" "$(printf '%s\n%s' "$B_LINE" "    { id: 'c_missing', dur: 3, tr: { type: 'cut' } },")" &&
    sh "$dir/build.sh" "$dir/dist/film.html" --wrap > /dev/null; then
    sw=$(cd "$dir/tools" && node sweep.mjs ../dist/film.html 2>&1)
    echo "$sw" | grep -q 'errors: 1$' && echo "$sw" | grep -qF 'no scene registered for plate "c_missing"' &&
      pass "$name: the sweep counts the one warning: $(echo "$sw" | head -n 1)" || { bad "$name: sweep"; echo "$sw" | sed 's/^/    /'; }
    INK_FILM_TOOLS=$dir/tools node "$TESTS/missing.mjs" "$dir/dist/film.html" c_missing || fail=1
  else bad "$name: scaffold, config edit or build failed"; fi
fi

# Contact sheets: one per plate (rows = presets, cols = 1:1, 9:16, 16:9) and one of everything.
if [ -n "$FFMPEG" ]; then
  SHEETS=$W/sheets
  mkdir -p "$SHEETS/cells"
  n=0
  for f in a_opening_at_4 b_closing_at_3; do
    k=0
    for p in $PRESETS; do
      for a in $ASPECTS; do
        src=$FRAMES/$p-$(echo "$a" | tr : x)-$f.png
        [ -s "$src" ] || continue
        cell=$(printf '%s/cells/%s_%02d.png' "$SHEETS" "$f" "$k")
        "$FFMPEG" -nostdin -loglevel error -y -i "$src" -vf "scale=440:440:force_original_aspect_ratio=decrease,pad=440:440:(ow-iw)/2:(oh-ih)/2:color=0x1a1a1a" "$cell"
        cp "$cell" "$(printf '%s/cells/all_%02d.png' "$SHEETS" "$n")"
        k=$((k + 1)); n=$((n + 1))
      done
    done
    if [ "$k" -gt 0 ]; then
      "$FFMPEG" -nostdin -loglevel error -y -i "$SHEETS/cells/${f}_%02d.png" -frames:v 1 -vf "tile=3x$(((k + 2) / 3)):padding=8:margin=8:color=0x1a1a1a" "$SHEETS/$f.png" &&
        echo "sheet -> $SHEETS/$f.png"
    fi
  done
  if [ "$n" -gt 0 ]; then
    "$FFMPEG" -nostdin -loglevel error -y -i "$SHEETS/cells/all_%02d.png" -frames:v 1 -vf "tile=6x$(((n + 5) / 6)):padding=8:margin=8:color=0x1a1a1a" "$SHEETS/contact.png" &&
      echo "sheet -> $SHEETS/contact.png"
  fi
else echo "note  no ffmpeg, so no contact sheets"; fi

# The browser tests borrow one film's tools (playwright-core).
first=$(for p in $PRESETS; do [ -d "$W/$p-1x1/tools/node_modules" ] && echo "$W/$p-1x1/tools" && break; done)
if [ -z "$first" ]; then bad "no film with installed tools to run the browser tests"; finish check; fi
export INK_FILM_TOOLS=$first

node "$TESTS/focus.mjs" "$W" $PRESETS || fail=1
if has engraved-cosmos && has blueprint && has risograph && has brand; then
  node "$TESTS/extras.mjs" "$W" || fail=1
fi
if has engraved-cosmos; then
  node "$TESTS/exact.mjs" "$W/engraved-cosmos-1x1" || fail=1
  node "$TESTS/latefont.mjs" "$W/engraved-cosmos-1x1/dist/film.html" || fail=1
fi

# Live frame rate on the tallest canvas.
if [ "${SKIP_FPS:-0}" != 1 ] && [ -s "$W/engraved-cosmos-9x16/dist/film.html" ]; then
  for s in 1 5; do
    r=$(cd "$W/engraved-cosmos-9x16/tools" && node fps.mjs ../dist/film.html "$s" 4 2>&1)
    fps=$(echo "$r" | sed -n 's/.*: \([0-9.]*\) frames\/s.*/\1/p')
    if [ -n "$fps" ] && awk "BEGIN { exit !($fps >= 29.5) }"; then pass "fps  $r"; else bad "fps from ${s}s: ${fps:-none} < 29.5  ($r)"; fi
  done
fi

finish check
