#!/bin/sh
# Start a new ink film from this skill's starter.
#
#   new-film.sh <dir> [aspect=1:1] [preset=engraved-cosmos] [title]
#     aspect  1:1 | 9:16 | 16:9           (the short side is always 1000 drawing units)
#     preset  engraved-cosmos | blueprint | risograph | brand
#     title   one line, any characters; without it the starter's title stays
#
# Copies the starter's film.config.js, head.html, build.sh, lib/, scenes/ and tools/ (without
# node_modules) into <dir>, writes aspect, preset and title into film.config.js (build.sh puts the
# title in the page), then installs the tools' one dependency with `npm ci`.
# Exit 2, with nothing created or changed: a bad argument; <dir> exists and is not an empty folder; or
# <dir> has a . or .. after a folder that does not exist (it can't be resolved without creating that
# folder).
# Exit 1: the copy or the config edit failed. Everything this run made is removed again: the copy,
# and any folders it created on the way to <dir>.
# Exit 0 otherwise. If npm is missing or fails, a warning says so: the film still builds, and only
# the tools (checks, video export) wait for `npm ci`.
# Works from any folder: the starter is found next to this script, whatever the current directory.
set -u
unset CDPATH # else `cd relative/dir` prints the folder, and $(cd … && pwd) captures it twice

USAGE='usage: new-film.sh <dir> [aspect=1:1] [preset=engraved-cosmos] [title]
  aspect  1:1 | 9:16 | 16:9
  preset  engraved-cosmos | blueprint | risograph | brand
  title   one line; quote it if it has spaces'

refuse() { printf 'new-film: %s\n' "$1" >&2; [ "${2:-}" = usage ] && printf '%s\n' "$USAGE" >&2; exit 2; }
fail() { printf 'new-film: %s\n' "$1" >&2; exit 1; }
warn() { printf 'new-film: warning: %s\n' "$1" >&2; }
# a path as a shell word, for the printed next steps
shq() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

case ${1:-} in
  -h | --help) printf '%s\n' "$USAGE"; exit 0 ;;
  '') refuse 'no folder given' usage ;;
  -*) refuse "unknown option $1" usage ;;
esac
[ $# -le 4 ] || refuse 'too many arguments (a title with spaces needs quotes)' usage
DIR=$1
ASPECT=${2:-1:1}
PRESET=${3:-engraved-cosmos}
TITLE=${4:-}

case $ASPECT in 1:1 | 9:16 | 16:9) ;; *) refuse "aspect must be 1:1, 9:16 or 16:9, not '$ASPECT'" usage ;; esac
case $PRESET in engraved-cosmos | blueprint | risograph | brand) ;; *) refuse "preset must be engraved-cosmos, blueprint, risograph or brand, not '$PRESET'" usage ;; esac
NL='
'
CR=$(printf '\r')
case $TITLE in *"$NL"* | *"$CR"*) refuse 'the title must be one line' ;; esac
case $DIR in *"$NL"* | *"$CR"*) refuse 'the folder name must be one line' ;; esac

# The skill folder is the parent of this script's folder (following a symlinked script to its file).
self=$0
while [ -L "$self" ]; do
  link=$(readlink "$self") || break
  case $link in /*) self=$link ;; *) self=$(dirname "$self")/$link ;; esac
done
SK=$(cd "$(dirname "$self")/.." && pwd -P) || fail "cannot find the skill folder from $0"
STARTER=$SK/starter
for f in film.config.js head.html build.sh lib scenes tools; do
  [ -e "$STARTER/$f" ] || fail "the starter is incomplete: $STARTER/$f is missing"
done

# Trailing slashes off ("films/new/" → "films/new"), keeping "/" itself.
while :; do case $DIR in ?*/) DIR=${DIR%/} ;; *) break ;; esac; done

# Resolve the target before looking at it: the longest part of the path that exists is resolved by
# the file system, as `test -e` and `mkdir` read it (`cd -P`: symlinks followed, so "link/.." is the
# folder above the link's target, not the folder holding the link), and every missing part after it
# must be a plain name. So "typo/.." is refused rather than meaning "the folder above typo" once typo
# has been created.
case $DIR in /*) path=$DIR ;; *) path=$PWD/$DIR ;; esac
TAIL=
while [ ! -e "$path" ] && [ ! -L "$path" ]; do
  name=${path##*/}
  path=${path%/*}
  [ -n "$path" ] || path=/
  case $name in
    '') ;;
    . | ..) refuse "cannot resolve '$name' in $DIR: the folder before it does not exist; nothing was changed" ;;
    *) TAIL=/$name$TAIL ;;
  esac
done
[ -d "$path" ] || refuse "$path exists and is not a folder; nothing was changed"
HEAD=$(cd -P "$path" && pwd -P) || refuse "cannot enter $path; nothing was changed"
if [ "$HEAD" = / ]; then TARGET=${TAIL:-/}; else TARGET=$HEAD$TAIL; fi

# The target is a new folder, or an existing empty one. Anything else is left exactly as it is.
if [ -z "$TAIL" ]; then
  entries=$(ls -A "$TARGET") || refuse "cannot read $TARGET; nothing was changed"
  [ -z "$entries" ] || refuse "$TARGET is not empty; nothing was changed (scaffold into a new or empty folder)"
fi

# From here on, everything this run makes is recorded, and removed again unless the film is finished:
# the folders it creates (deepest first, and only while empty), the staging copy, and whatever it
# moved into the target.
CREATED= STAGE= MOVED= DONE=0
undo() {
  if [ "$DONE" = 1 ]; then return; fi
  if [ -n "$STAGE" ]; then rm -rf "$STAGE"; fi
  # no globbing while the recorded paths are split: a folder this run created as "film*" or "new-[ab]"
  # must not expand to the user's own empty folders beside it
  set -f
  for f in $MOVED; do rm -rf "${TARGET:?}/$f"; done
  old_ifs=$IFS
  IFS=$NL
  for d in $CREATED; do rmdir "$d" 2>/dev/null; done
  IFS=$old_ifs
  set +f
}
trap undo EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

# Create the missing folders one at a time, so the ones this run made are known.
d=$HEAD
[ "$d" = / ] && d=
rest=$TAIL
while [ -n "$rest" ]; do
  rest=${rest#/}
  name=${rest%%/*}
  case $rest in */*) rest=/${rest#*/} ;; *) rest= ;; esac
  d=$d/$name
  mkdir "$d" || fail "cannot create $d"
  CREATED=$d$NL$CREATED
done

# Build the film in a private folder inside the target and move it into place only once it is
# complete, so a failure part-way through the copy leaves nothing behind.
STAGE=$(mktemp -d "$TARGET/.new-film.XXXXXX") || fail "cannot write in $TARGET"

cp -R "$STARTER/film.config.js" "$STARTER/head.html" "$STARTER/build.sh" "$STARTER/lib" "$STARTER/scenes" "$STAGE/" &&
  mkdir "$STAGE/tools" || fail "copying the starter failed"
for f in "$STARTER/tools"/*; do
  case ${f##*/} in node_modules) continue ;; esac
  cp -R "$f" "$STAGE/tools/" || fail "copying the starter's tools failed"
done
find "$STAGE" -name .DS_Store -exec rm -f {} + 2>/dev/null
chmod +x "$STAGE/build.sh"

# Set the three fields. awk, not sed: the title is copied character by character, so / & | and the
# like need no escaping. Only \ and ' are escaped for the single-quoted JS string, and after a "<"
# the "/" and "!" are escaped too ("<\/", "<\!"), so a title can neither close the <script> build.sh
# wraps the config in ("</script>") nor put the HTML parser into its escaped-script state ("<!--"),
# where a later "<script>" swallows the rest of the page. JavaScript reads each "\x" as "x".
CFG=$STAGE/film.config.js
if [ -n "$TITLE" ]; then SET_TITLE=1; else SET_TITLE=0; fi
ASPECT=$ASPECT PRESET=$PRESET TITLE=$TITLE SET_TITLE=$SET_TITLE awk '
  BEGIN { Q = sprintf("%c", 39); BS = sprintf("%c", 92) }
  function js(s,   out, prev, i, c) {
    out = ""; prev = ""
    for (i = 1; i <= length(s); i++) {
      c = substr(s, i, 1)
      if (c == BS || c == Q || ((c == "/" || c == "!") && prev == "<")) out = out BS
      out = out c; prev = c
    }
    return out
  }
  /^  aspect: / && !a { a++; print "  aspect: " Q ENVIRON["ASPECT"] Q ","; next }
  /^  preset: / && !p { p++; print "  preset: " Q ENVIRON["PRESET"] Q ","; next }
  /^  title: / && !t { t++; if (ENVIRON["SET_TITLE"] == 1) { print "  title: " Q js(ENVIRON["TITLE"]) Q ","; next } }
  { print }
  END { exit !(a == 1 && p == 1 && t == 1) }
' "$CFG" > "$CFG.tmp" && mv "$CFG.tmp" "$CFG" ||
  fail "could not set the fields: the starter's film.config.js needs one-line '  aspect: ', '  preset: ' and '  title: ' entries"

# Into place, if the target still holds nothing but the copy (a check against anything written there
# while the copy was made).
[ "$(ls -A "$TARGET")" = "${STAGE##*/}" ] || refuse "$TARGET is no longer empty; nothing was changed"
for f in "$STAGE"/*; do
  name=${f##*/}
  mv "$f" "$TARGET/" || fail "moving the film into $TARGET failed"
  MOVED="$MOVED $name"
done
rmdir "$STAGE" && STAGE=
DONE=1
ABS=$TARGET

# The tools' dependency (playwright-core, driving the system Chrome). Quiet unless it fails.
LATER="the film builds without it; before checking or exporting, run: cd $(shq "$ABS/tools") && npm ci"
if ! command -v npm >/dev/null 2>&1; then
  warn "npm not found, so tools/ has no node_modules yet (install Node.js 20 or later). $LATER"
elif ! log=$(cd "$ABS/tools" && npm ci --no-audit --no-fund 2>&1); then
  printf '%s\n' "$log" | tail -n 15 >&2
  warn "npm ci failed in $ABS/tools (log above). $LATER"
fi

printf 'new film: %s\n' "$ABS"
[ -n "$TITLE" ] || TITLE=$(sed -n "s/^  title: '\(.*\)',\$/\1/p" "$ABS/film.config.js")
printf '  aspect %s, preset %s, title: %s\n' "$ASPECT" "$PRESET" "$TITLE"
cat <<EOF
next:
  cd $(shq "$ABS")
  ./build.sh dist/film.html --wrap                     build the page
  open -a 'Google Chrome' dist/film.html               watch it
  (cd tools && node sweep.mjs ../dist/film.html)       check every frame draws cleanly: errors: 0
  (cd tools && node video.mjs ../dist/film.html ../out --size 1080)
                                                       export the video, share cut, poster and captions into out/
EOF
exit 0
