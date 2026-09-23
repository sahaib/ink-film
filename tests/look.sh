#!/bin/sh
# Quick look at the starter in one preset and aspect: scaffold a throwaway film, build it, render
# frames into <outdir>. Not a test; a loop for eyeballing a change to the starter.
#   sh tests/look.sh <preset> <aspect> <outdir> spec...
#   e.g. sh tests/look.sh risograph 9:16 ~/Desktop/look a_opening@4 b_closing@3 6.5
set -u
[ $# -ge 4 ] || { echo 'usage: sh tests/look.sh <preset> <aspect> <outdir> spec...' >&2; exit 2; }
. "$(dirname "$0")/common.sh"
p=$1 a=$2 out=$3
shift 3
case $out in /*) ;; *) out=$PWD/$out ;; esac
work look
scaffold "$W/film" "$a" "$p" "Look $p $a" || exit 1
sh "$W/film/build.sh" "$W/film/dist/film.html" --wrap > /dev/null || exit 1
cd "$W/film/tools" && node render.mjs ../dist/film.html "$out" "$@"
