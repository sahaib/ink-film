#!/bin/sh
# Assemble the single-file film.  usage: build.sh [out.html] [--wrap]
#   out.html defaults to dist/film.html next to this script; a relative path is taken from where you run it.
#   --wrap adds a doctype/html/body skeleton for local viewing (the Artifact host adds its own).
# head.html's {{title}} and {{colophon}} are filled from film.config.js, so the config stays the one
# source of truth. Scripts load in this order, each in its own <script> so a syntax error in one plate
# cannot take the others down: config, kit, presets, scenes (alphabetical), audio (if present), engine.
unset CDPATH # else `cd relative/dir` prints the folder, and $(cd … && pwd) captures it twice
HERE=$(cd "$(dirname "$0")" && pwd) || exit 1
OUT=${1:-$HERE/dist/film.html}
case $OUT in /*) ;; *) OUT=$PWD/$OUT ;; esac
cd "$HERE" || exit 1
mkdir -p "$(dirname "$OUT")"

# one-line config field → text, in either quote style (each \x becomes x, then HTML-escaped):
#   title: 'It\'s A\\B <\/i>',  → It's A\B </i>        title: "It's \"A\"",  → It's "A"
# field <name> <what the page shows without it>. A <name>: line in any other form is warned about.
field() {
  v=$(sed -n -e "s/^[[:space:]]*$1:[[:space:]]*'\(.*\)',[[:space:]]*\$/=\1/p" \
    -e "s/^[[:space:]]*$1:[[:space:]]*\"\(.*\)\",[[:space:]]*\$/=\1/p" film.config.js | head -n 1)
  if [ -z "$v" ]; then
    if grep -q "^[[:space:]]*$1:" film.config.js; then
      printf "build.sh: warning: cannot read the %s line in film.config.js (it must be one line: %s: '…', or %s: \"…\",), so the page shows %s\n" "$1" "$1" "$1" "$2" >&2
    fi
    return 0
  fi
  printf '%s\n' "${v#=}" | sed -e 's/\\\(.\)/\1/g' -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'
}
TITLE=$(field title "the title 'Untitled ink film'")
COLOPHON=$(field colophon 'no colophon')
[ -n "$TITLE" ] || TITLE='Untitled ink film'

{
  if [ "${2:-}" = "--wrap" ]; then
    printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}</style></head><body>\n'
  fi
  # literal replacement (awk index/substr, so & and \ in a title stay as typed)
  TITLE=$TITLE COLOPHON=$COLOPHON awk '
    function rep(s, k, v,   i, out) { out = ""; while ((i = index(s, k)) > 0) { out = out substr(s, 1, i - 1) v; s = substr(s, i + length(k)) } return out s }
    { $0 = rep($0, "{{title}}", ENVIRON["TITLE"]); $0 = rep($0, "{{colophon}}", ENVIRON["COLOPHON"]); print }
  ' head.html
  for f in film.config.js lib/kit.js lib/presets.js scenes/*.js lib/audio.js lib/engine.js; do
    [ -f "$f" ] || continue
    printf '<script>\n'; cat "$f"; printf '\n</script>\n'
  done
  if [ "${2:-}" = "--wrap" ]; then printf '</body></html>\n'; fi
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
