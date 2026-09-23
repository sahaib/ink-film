#!/bin/sh
# Tools and video export, end to end, on a fresh 16:9 blueprint film.   sh tests/export.sh
#   sweep and ui pass; video.mjs at --size 540 with 4 workers passes its own self-check; ffprobe shows
#   960x540, the config's duration and an AAC track; the share cut matches the master's streams, is
#   smaller and carries the same audio packets; every other file is written; the MP4 frame at 2.0 s
#   matches a direct renderAt(2) PNG (Review Focus 4, export drift) better than renderAt(2.1) does;
#   captions.srt parses in ffmpeg and its first cue is the first plate's first line.
set -u
. "$(dirname "$0")/common.sh"
work export
[ -n "$FFMPEG" ] && [ -n "$FFPROBE" ] || { bad "ffmpeg and ffprobe are needed (brew install ffmpeg)"; finish export; }
F=$W/film
V=$W/video
TITLE='Blueprint Test — Wide'
SLUG=blueprint-test-wide-960x540

scaffold "$F" 16:9 blueprint "$TITLE" || { bad "scaffold"; finish export; }
sh "$F/build.sh" "$F/dist/film.html" --wrap > /dev/null || { bad "build"; finish export; }
grep -q 'FILM.audio = {' "$F/dist/film.html" && pass "lib/audio.js is built in" || bad "no FILM.audio in the build"
cd "$F/tools" || exit 1

sw=$(node sweep.mjs ../dist/film.html 2>&1) && pass "sweep: $sw" || { bad "sweep"; echo "$sw" | sed 's/^/    /'; }
echo "--- ui"
node ui.mjs ../dist/film.html || bad "ui.mjs exited non-zero"
echo "--- video --size 540 --workers 4"
node video.mjs ../dist/film.html "$V" --size 540 --workers 4 && pass "video.mjs: exit 0, self-check clean" || bad "video.mjs"

M=$V/$SLUG.mp4
S=$V/$SLUG-share.mp4
probe() { "$FFPROBE" -v error "$@"; }
dims=$(probe -select_streams v -show_entries stream=width,height -of csv=p=0 "$M")
dur=$(probe -show_entries format=duration -of csv=p=0 "$M")
aud=$(probe -select_streams a -show_entries stream=codec_name -of csv=p=0 "$M")
total=$(config_value "$F/film.config.js" total)
[ "$dims" = "960,540" ] && pass "master is 960x540" || bad "master dims $dims"
awk "BEGIN { exit !(($dur - $total) ^ 2 < 0.0001) }" && pass "master lasts $dur s = the plates' $total s" || bad "duration $dur vs $total"
[ "$aud" = aac ] && pass "master has an AAC track" || bad "audio stream: ${aud:-none}"

echo "--- share cut vs master"
pick() { probe -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,color_primaries,color_transfer,color_space,sample_rate,channels:format=duration -of compact=p=0 "$1"; }
if [ -s "$S" ]; then
  [ "$(pick "$M")" = "$(pick "$S")" ] && pass "share cut: same streams, size, fps, frame count, colour tags, audio and duration" || bad "share cut streams differ from the master"
  ms=$(wc -c < "$M" | tr -d ' ') ss=$(wc -c < "$S" | tr -d ' ')
  [ "$ss" -lt "$ms" ] && pass "share cut is smaller: $ss vs $ms bytes ($((ss * 100 / ms))%)" || bad "share cut not smaller ($ss vs $ms)"
  "$FFMPEG" -hide_banner -nostdin -loglevel error -y -i "$M" -map 0:a -c copy -f data "$W/m.aac" &&
    "$FFMPEG" -hide_banner -nostdin -loglevel error -y -i "$S" -map 0:a -c copy -f data "$W/s.aac" &&
    cmp -s "$W/m.aac" "$W/s.aac" && pass "share cut's audio packets are the master's" || bad "share audio differs"
else bad "no share cut $S"; fi
for f in soundtrack.wav poster.png captions.srt "$SLUG-silent.mp4"; do
  [ -s "$V/$f" ] && pass "wrote $f" || bad "missing $f"
done

echo "--- Review Focus 4: MP4 frame at 2.0 s vs a direct renderAt(2) PNG at 0.54 px/unit"
node render.mjs ../dist/film.html "$W/ref" 2 2.1 --px 0.54 > /dev/null || bad "render the reference frames"
node "$TESTS/framematch.mjs" "$M" 2.0 "$W/ref/2.png" "$W/ref/2.1.png" || fail=1

echo "--- captions.srt"
if "$FFMPEG" -hide_banner -nostdin -loglevel error -i "$V/captions.srt" -map 0:s -c:s srt -f null -; then
  pass "captions.srt parses (ffmpeg -i captions.srt -map 0:s -c:s srt -f null -)"
else bad "captions.srt does not parse"; fi
first=$("$FFMPEG" -hide_banner -nostdin -loglevel error -i "$V/captions.srt" -map 0:s -c:s srt -f srt - | sed -n 3p)
want=$(sed -n "s/.*{ text: '\([^']*\)', at: [0-9.]* },*/\1/p" "$F/scenes/a_opening.js" | head -n 1)
[ -n "$first" ] && [ "$first" = "$want" ] && pass "first cue is the first plate's first line: \"$first\"" || bad "first cue \"$first\", want \"$want\""

finish export
