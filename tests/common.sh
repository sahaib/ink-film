# Shared by the test suites; sourced, POSIX sh. Sets SK (the skill folder), NEW_FILM, FFMPEG and
# FFPROBE, and gives each suite pass/bad (one PASS or FAIL line per check) and a work folder.
unset CDPATH # else `cd relative/dir` prints the folder, and $(cd … && pwd) captures it twice
TESTS=$(cd "$(dirname "$0")" && pwd -P)
SK=$(dirname "$TESTS")
NEW_FILM=$SK/scripts/new-film.sh
find_bin() { command -v "$1" 2>/dev/null || { [ -x "/opt/homebrew/bin/$1" ] && echo "/opt/homebrew/bin/$1"; } || { [ -x "/usr/local/bin/$1" ] && echo "/usr/local/bin/$1"; }; }
FFMPEG=${FFMPEG:-$(find_bin ffmpeg)}
FFPROBE=${FFPROBE:-$(find_bin ffprobe)}
export FFMPEG

fail=0
pass() { printf 'PASS  %s\n' "$*"; }
bad() { printf 'FAIL  %s\n' "$*"; fail=1; }
finish() { [ "$fail" = 0 ] && echo "$1: all passed" || echo "$1: FAILED"; exit "$fail"; }

# work <suite>: W = a fresh folder for this suite. Under run.sh it lives in the run's folder (run.sh
# removes it); run alone it is a new mktemp folder, removed on exit unless KEEP=1.
work() {
  if [ -n "${INK_TEST_WORK:-}" ]; then
    W=$INK_TEST_WORK/$1
    rm -rf "$W" && mkdir -p "$W" || exit 1
  else
    W=$(mktemp -d "${TMPDIR:-/tmp}/ink-film-$1.XXXXXX") || exit 1
    if [ "${KEEP:-0}" = 1 ]; then echo "work folder (kept): $W"; else trap 'rm -rf "$W"' EXIT; fi
    trap 'exit 130' INT
    trap 'exit 143' TERM
  fi
}

# scaffold <dir> <aspect> <preset> <title>: new-film.sh, quiet unless it fails
scaffold() {
  _scaffold_log=$("$NEW_FILM" "$@" 2>&1) || { echo "$_scaffold_log" | sed 's/^/    /'; return 1; }
}

# replace_line <file> <exact old line> <new line>: swap one whole line (awk, so any text is safe)
replace_line() {
  OLD=$2 NEW=$3 awk '$0 == ENVIRON["OLD"] && !n { print ENVIRON["NEW"]; n++; next } { print } END { exit !n }' "$1" > "$1.tmp" &&
    mv "$1.tmp" "$1"
}

# config_value <film.config.js> <field | total>: a field of FILM.config as the page reads it (the file
# runs as JavaScript), or total = the plates' summed duration
config_value() {
  node -e '
    const vm = require("vm"), fs = require("fs"), g = { window: {} };
    vm.runInNewContext(fs.readFileSync(process.argv[1], "utf8"), g);
    const c = g.window.FILM.config, k = process.argv[2];
    process.stdout.write(String(k === "total" ? c.plates.reduce((a, p) => a + p.dur, 0) : c[k]));
  ' "$1" "$2"
}
