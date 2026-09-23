#!/bin/sh
# Every test, one entry point.
#   sh tests/run.sh                      all suites: scaffold check example export
#   sh tests/run.sh scaffold example     only these
#   KEEP=1 sh tests/run.sh               keep the work folder (films, frames, contact sheets, video)
#   SKIP_FPS=1 sh tests/run.sh           skip the live frame-rate runs in check
# Each suite runs in its own folder under one mktemp folder, removed at the end unless KEEP=1. The
# summary lists every suite with its PASS/FAIL counts and time, then every FAIL line. Exits 1 if any
# suite failed.
set -u
unset CDPATH # else `cd relative/dir` prints the folder, and $(cd … && pwd) captures it twice
TESTS=$(cd "$(dirname "$0")" && pwd -P)
SUITES=${*:-scaffold check example export}
for s in $SUITES; do [ -f "$TESTS/$s.sh" ] || { echo "unknown suite '$s' (scaffold, check, example, export)" >&2; exit 2; }; done

WORK=$(mktemp -d "${TMPDIR:-/tmp}/ink-film-tests.XXXXXX") || exit 1
if [ "${KEEP:-0}" = 1 ]; then trap 'echo "work folder (kept): $WORK"' EXIT; else trap 'rm -rf "$WORK"' EXIT; fi
trap 'exit 130' INT
trap 'exit 143' TERM
export INK_TEST_WORK=$WORK
LOGS=$WORK/logs
mkdir -p "$LOGS"

start=$(date +%s)
for s in $SUITES; do
  echo "==== $s"
  t0=$(date +%s)
  { sh "$TESTS/$s.sh" 2>&1; echo $? > "$LOGS/$s.status"; } | tee "$LOGS/$s.log"
  echo $(($(date +%s) - t0)) > "$LOGS/$s.secs"
done

echo
echo "==== summary"
failed=0
for s in $SUITES; do
  code=$(cat "$LOGS/$s.status") secs=$(cat "$LOGS/$s.secs")
  np=$(grep -c '^PASS' "$LOGS/$s.log") nf=$(grep -c '^FAIL' "$LOGS/$s.log")
  if [ "$code" = 0 ] && [ "$nf" = 0 ]; then verdict=PASS; else verdict=FAIL; failed=1; fi
  printf '%s  %-9s %3s passed, %s failed, exit %s, %ss\n' "$verdict" "$s" "$np" "$nf" "$code" "$secs"
done
if [ "$failed" = 1 ]; then
  echo
  for s in $SUITES; do grep '^FAIL' "$LOGS/$s.log" | sed "s/^/$s: /"; done
fi
echo
[ "$failed" = 0 ] && echo "ALL TESTS PASSED ($(($(date +%s) - start))s)" || echo "TESTS FAILED ($(($(date +%s) - start))s)"
exit "$failed"
