#!/bin/sh
# Assemble the single-file film.  usage: build.sh [out.html] [--wrap]
#   out.html defaults to to-my-mind.html next to this script (the committed, published form);
#   a relative path is taken from where you run it.
#   --wrap adds a doctype/html/body skeleton for local viewing (the Artifact host adds its own).
unset CDPATH # else `cd relative/dir` prints the folder, and $(cd … && pwd) captures it twice
HERE=$(cd "$(dirname "$0")" && pwd) || exit 1
OUT=${1:-$HERE/to-my-mind.html}
case $OUT in /*) ;; *) OUT=$PWD/$OUT ;; esac
cd "$HERE" || exit 1
mkdir -p "$(dirname "$OUT")"
{
  if [ "${2:-}" = "--wrap" ]; then
    printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>\n'
  fi
  cat head.html
  for f in kit.js scenes/*.js audio.js engine.js; do
    [ -f "$f" ] || continue
    # each file in its own <script>: a syntax error in one plate cannot take the others down
    printf '<script>\n'; cat "$f"; printf '\n</script>\n'
  done
  if [ "${2:-}" = "--wrap" ]; then printf '</body></html>\n'; fi
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
