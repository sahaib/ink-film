#!/bin/sh
# scripts/new-film.sh keeps its contract.   sh tests/scaffold.sh
#   - bad arguments exit 2 and create nothing; --help exits 0
#   - called by absolute path from another folder, it copies the starter (tools without node_modules),
#     sets aspect, preset and a title full of awkward characters, installs the tools, prints the title
#     verbatim, and the film builds (the page <title> is the title), boots and sweeps clean; so does a
#     title that would open an HTML comment ("<!--<script>") in the config's <script>; a title and
#     colophon written in double quotes reach the page, and a line in neither quote style is warned about
#   - relative paths, an existing empty folder (".", "<empty>/.", a symlink to one) work
#   - Review Focus 5: scaffolding into the same folder again exits 2 and leaves it unchanged; so does a
#     folder holding anything else, or a path that is a file
#   - the target is resolved before it is judged: "<non-empty>/typo/.." (typo missing) exits 2 with the
#     folder unchanged and typo/ never created; "<non-empty>/." and "<non-empty>/lib/.." are refused;
#     "a/link/../new" lands beside the link's target, as the file system reads "..", touching nothing else
#   - a failure part-way (the copy) removes everything the run made, including the folders it created,
#     and only that: folders it made named "film*" or "new-[ab]" never take the user's empty film-a or
#     new-b with them; a hangup part-way cleans up the same way; a file appearing in the target while
#     the copy is made is refused and left alone
#   - an exported CDPATH changes nothing: a relative script, film, example build and test suite work
#   - a copy of the skill elsewhere, reached through a symlinked script, scaffolds from its own starter
#   - npm failing or missing is a warning, not a failure: exit 0 and the film still builds
set -u
. "$(dirname "$0")/common.sh"
work scaffold

TITLE='It'\''s "Ink" / A & B \ \c \n </script> — café'
tree_sum() { (cd "$1" && { find . | LC_ALL=C sort; find . -type f -exec shasum -a 256 {} + | LC_ALL=C sort -k 2; } | shasum -a 256 | cut -d ' ' -f 1); }
files() { (cd "$1" && find . -path ./tools/node_modules -prune -o -path ./dist -prune -o -print | LC_ALL=C sort); }
run() { out=$("$@" 2>&1); code=$?; }
say() { printf '%s\n' "$*"; } # not echo: sh's echo reads \c and \n in a title
page_title() { sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$1" | head -n 1; }
html_escape() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'; }

# ---- arguments
mkdir -p "$W/elsewhere"
cd "$W/elsewhere" || exit 1
run "$NEW_FILM"
[ "$code" = 2 ] && pass "no folder: exit 2" || bad "no folder: exit $code"
run "$NEW_FILM" --help
[ "$code" = 0 ] && say "$out" | grep -q '^usage: new-film.sh' && pass "--help: usage, exit 0" || bad "--help: exit $code"
for args in 'bad-aspect|4:3|engraved-cosmos|T' 'bad-preset|1:1|sepia|T' 'two-line-title|1:1|blueprint|one
two'; do
  name=${args%%|*} rest=${args#*|}
  a=${rest%%|*} rest=${rest#*|}
  p=${rest%%|*} t=${rest#*|}
  run "$NEW_FILM" "$W/$name" "$a" "$p" "$t"
  [ "$code" = 2 ] && [ ! -e "$W/$name" ] && pass "$name: exit 2, nothing created ($(say "$out" | head -n 1))" ||
    bad "$name: exit $code, created: $([ -e "$W/$name" ] && echo yes || echo no)"
done
run "$NEW_FILM" "$W/four" 1:1 blueprint My Film
[ "$code" = 2 ] && [ ! -e "$W/four" ] && pass "unquoted title (5 arguments): exit 2, nothing created" || bad "5 arguments: exit $code"

# ---- a full scaffold, by absolute path from another folder
F=$W/films/one
run "$NEW_FILM" "$F" 16:9 risograph "$TITLE"
if [ "$code" = 0 ]; then pass "scaffold 16:9 risograph from $(pwd): exit 0"; else bad "scaffold: exit $code"; say "$out" | sed 's/^/    /'; finish scaffold; fi
say "$out" | grep -q '^next:' && say "$out" | grep -q 'build.sh dist/film.html --wrap' && say "$out" | grep -q 'video.mjs' &&
  pass "prints next steps: build, open, export" || bad "next steps missing"
say "$out" | grep -qxF "  aspect 16:9, preset risograph, title: $TITLE" && pass "prints the title verbatim (\\c and \\n left alone)" ||
  { bad "printed title differs"; say "$out" | grep 'title:' | sed 's/^/    /'; }
want=$(cd "$SK/starter" && { echo .; find film.config.js head.html build.sh lib scenes tools -path tools/node_modules -prune -o ! -name .DS_Store -print | sed 's:^:./:'; } | LC_ALL=C sort)
got=$(files "$F")
[ "$got" = "$want" ] && pass "copied exactly the starter's config, head, build.sh, lib/, scenes/ and tools/ ($(echo "$want" | wc -l | tr -d ' ') entries)" ||
  { bad "file list differs from the starter"; echo "    got:  $(echo $got)"; echo "    want: $(echo $want)"; }
for f in head.html build.sh lib/kit.js lib/engine.js lib/presets.js lib/audio.js scenes/a_opening.js tools/video.mjs tools/package-lock.json; do
  cmp -s "$SK/starter/$f" "$F/$f" || bad "$f differs from the starter"
done
[ -x "$F/build.sh" ] && pass "build.sh is executable" || bad "build.sh not executable"
changed=$(diff "$SK/starter/film.config.js" "$F/film.config.js" | grep -c '^>')
[ "$changed" = 3 ] && pass "film.config.js: exactly 3 lines changed (aspect, preset, title)" || bad "film.config.js: $changed lines changed"
a=$(config_value "$F/film.config.js" aspect) p=$(config_value "$F/film.config.js" preset) t=$(config_value "$F/film.config.js" title)
[ "$a" = 16:9 ] && [ "$p" = risograph ] && pass "config reads aspect $a, preset $p" || bad "config reads aspect $a, preset $p"
[ "$t" = "$TITLE" ] && pass "title round-trips through JavaScript: $t" || bad "title reads back as: $t"
[ -f "$F/tools/node_modules/playwright-core/package.json" ] && pass "npm ci installed playwright-core in tools/" || bad "no tools/node_modules/playwright-core"
if sh "$F/build.sh" "$F/dist/film.html" --wrap > /dev/null; then
  got=$(page_title "$F/dist/film.html") want=$(html_escape "$TITLE")
  [ "$got" = "$want" ] && pass "page <title> is the title, HTML-escaped: $got" || bad "page <title> $got, want $want"
  INK_FILM_TOOLS=$F/tools node "$TESTS/boots.mjs" "$F/dist/film.html" || fail=1
  sw=$(cd "$F/tools" && node sweep.mjs ../dist/film.html 2>&1)
  say "$sw" | grep -q 'errors: 0$' && pass "sweep: $sw" || { bad "sweep"; say "$sw" | sed 's/^/    /'; }
else bad "build"; fi

# ---- a title that would open an HTML comment in the config's <script> (the parser's escaped-script
# state, where the next "<script>" swallows the rest of the page)
H=$W/films/hostile
HT='A <!--<script> B'
run "$NEW_FILM" "$H" 1:1 engraved-cosmos "$HT"
if [ "$code" = 0 ] && sh "$H/build.sh" "$H/dist/film.html" --wrap > /dev/null; then
  t=$(config_value "$H/film.config.js" title)
  [ "$t" = "$HT" ] && pass "title '$HT' round-trips through JavaScript" || bad "title '$HT' reads back as: $t"
  got=$(page_title "$H/dist/film.html") want=$(html_escape "$HT")
  [ "$got" = "$want" ] && pass "page <title> is the title, HTML-escaped: $got" || bad "page <title> $got, want $want"
  INK_FILM_TOOLS=$H/tools node "$TESTS/boots.mjs" "$H/dist/film.html" || fail=1
else bad "title '$HT': scaffold or build failed (exit $code)"; fi

# ---- a title and colophon written in double quotes reach the page too; a line build.sh can't read
# is warned about
D=$W/films/dquote
DT='Ada'\''s "Ink" <b>' DC='Ada'\''s poem'
colophon_of() { sed -n 's:.*<p class="colophon">\(.*\)</p>.*:\1:p' "$1" | head -n 1; }
if scaffold "$D" &&
  replace_line "$D/film.config.js" "  title: 'Untitled ink film'," '  title: "Ada'\''s \"Ink\" <b>",' &&
  replace_line "$D/film.config.js" "  colophon: 'An ink film'," '  colophon: "Ada'\''s poem",' &&
  warned=$(sh "$D/build.sh" "$D/dist/film.html" --wrap 2>&1 > /dev/null); then
  t=$(config_value "$D/film.config.js" title) c=$(config_value "$D/film.config.js" colophon)
  got="$(page_title "$D/dist/film.html")|$(colophon_of "$D/dist/film.html")" want="$(html_escape "$DT")|$(html_escape "$DC")"
  [ "$t|$c" = "$DT|$DC" ] && [ "$got" = "$want" ] && [ -z "$warned" ] &&
    pass "double-quoted title and colophon: JavaScript reads $t / $c; the page shows $got" ||
    bad "double-quoted fields: JavaScript reads $t / $c; page $got, want $want; build said: $warned"
  replace_line "$D/film.config.js" '  colophon: "Ada'\''s poem",' '  colophon: `Ada`,' &&
    warned=$(sh "$D/build.sh" "$D/dist/film.html" --wrap 2>&1 > /dev/null)
  say "$warned" | grep -q 'warning: cannot read the colophon line' && [ -z "$(colophon_of "$D/dist/film.html")" ] &&
    pass "a colophon line in neither quote style: the build warns ($warned)" || bad "unreadable colophon: build said: $warned"
else bad "double-quoted fields: scaffold, config edit or build failed"; fi

# ---- Review Focus 5: the same folder again, with other arguments
before=$(tree_sum "$F")
touch "$W/stamp" && sleep 1
run "$NEW_FILM" "$F" 9:16 blueprint 'Second run'
after=$(tree_sum "$F")
newer=$(find "$F" -newer "$W/stamp" | head -n 3)
[ "$code" = 2 ] && [ "$before" = "$after" ] && [ -z "$newer" ] &&
  pass "Review Focus 5: second scaffold into the same folder exits 2; tree checksum ${before%"${before#????????????}"}… unchanged, nothing modified" ||
  bad "Review Focus 5: exit $code, checksum $before → $after, modified: $newer"
say "$out" | grep -q 'not empty' && pass "the refusal says why: $(say "$out" | head -n 1)" || bad "refusal message: $out"

mkdir -p "$W/notes" && echo keep > "$W/notes/notes.txt"
before=$(tree_sum "$W/notes")
run "$NEW_FILM" "$W/notes"
[ "$code" = 2 ] && [ "$(tree_sum "$W/notes")" = "$before" ] && pass "a folder holding one other file: exit 2, unchanged" || bad "non-empty folder: exit $code"
echo keep > "$W/afile"
run "$NEW_FILM" "$W/afile"
[ "$code" = 2 ] && [ "$(cat "$W/afile")" = keep ] && pass "a path that is a file: exit 2, file untouched" || bad "file target: exit $code"

# ---- the target is resolved before it is judged, so ".." can't reach a folder the check never saw
V=$W/victim
mkdir -p "$V/lib" && echo precious > "$V/build.sh" && echo mine > "$V/film.config.js" && echo mine > "$V/lib/mine.js" && echo keep > "$V/notes.txt"
before=$(tree_sum "$V")
run "$NEW_FILM" "$V/typo/.." 1:1 blueprint Oops
[ "$code" = 2 ] && [ "$(tree_sum "$V")" = "$before" ] && [ ! -e "$V/typo" ] &&
  pass "\"<non-empty>/typo/..\" with typo missing: exit 2, folder unchanged (checksum), typo/ not created: $(say "$out" | head -n 1)" ||
  bad "typo/..: exit $code, checksum $before → $(tree_sum "$V"), typo/ $([ -e "$V/typo" ] && echo created || echo absent), build.sh: $(cat "$V/build.sh")"
for q in . lib/..; do
  run "$NEW_FILM" "$V/$q"
  [ "$code" = 2 ] && [ "$(tree_sum "$V")" = "$before" ] && pass "\"<non-empty>/$q\": exit 2, folder unchanged" || bad "<non-empty>/$q: exit $code"
done
run "$NEW_FILM" "$W/missing/./film"
[ "$code" = 2 ] && [ ! -e "$W/missing" ] && pass "\"missing/./film\": exit 2, nothing created" || bad "missing/./film: exit $code"
# ".." after a symlink is read as the file system reads it: "a/link/../new", with link -> b/inner,
# is b/new (beside the link's target), not a/new
P=$W/phys
mkdir -p "$P/a" "$P/b/inner" && echo keep > "$P/a/keep.txt" && echo keep > "$P/b/inner/keep.txt" && ln -s ../b/inner "$P/a/link"
sa=$(tree_sum "$P/a") sb=$(tree_sum "$P/b/inner")
cd "$P" || exit 1
run "$NEW_FILM" a/link/../new 1:1 blueprint Phys
cd "$W/elsewhere" || exit 1
[ "$code" = 0 ] && [ -f "$P/b/new/film.config.js" ] && [ ! -e "$P/a/new" ] && [ "$(tree_sum "$P/a")" = "$sa" ] && [ "$(tree_sum "$P/b/inner")" = "$sb" ] &&
  pass "\"a/link/../new\" with link -> b/inner: the film is in b/new (the physical reading), a/ and b/inner unchanged (checksums)" ||
  bad "a/link/../new: exit $code, b/new $([ -f "$P/b/new/film.config.js" ] && echo filled || echo empty), a/new $([ -e "$P/a/new" ] && echo created || echo absent)"
mkdir -p "$W/empty-dot" "$W/empty-link-target" && ln -s "$W/empty-link-target" "$W/empty-link"
run "$NEW_FILM" "$W/empty-dot/."
c1=$code
run "$NEW_FILM" "$W/empty-link"
[ "$c1" = 0 ] && [ -f "$W/empty-dot/film.config.js" ] && [ "$code" = 0 ] && [ -f "$W/empty-link-target/film.config.js" ] &&
  pass "\"<empty>/.\" and a symlink to an empty folder: filled" || bad "<empty>/. exit $c1, symlink exit $code"

# ---- a failure part-way removes everything the run made, and only that
B=$W/skill-broken
mkdir -p "$B" && cp -R "$SK/scripts" "$SK/starter" "$B/" || exit 1
chmod 000 "$B/starter/scenes/b_closing.js"
if [ -r "$B/starter/scenes/b_closing.js" ]; then
  echo "note  an unreadable file is still readable here (root?), so the failed-copy case can't be staged"
else
  run "$B/scripts/new-film.sh" "$W/deep/a/b/film"
  [ "$code" = 1 ] && [ ! -e "$W/deep" ] && pass "copy failing into deep/a/b/film: exit 1, the film and the folders created on the way are removed" ||
    bad "copy failing: exit $code, deep/ $([ -e "$W/deep" ] && echo left behind || echo absent)"
  mkdir -p "$W/empty-kept"
  run "$B/scripts/new-film.sh" "$W/empty-kept"
  [ "$code" = 1 ] && [ -d "$W/empty-kept" ] && [ -z "$(ls -A "$W/empty-kept")" ] &&
    pass "copy failing into an existing empty folder: exit 1, the folder is kept, empty" || bad "copy failing into empty folder: exit $code, holds: $(ls -A "$W/empty-kept")"
  # folders named like globs: the cleanup removes the "film*" and "new-[ab]" it made, and never the
  # user's own empty film-a, film-b, new-a, new-b that those names would match
  mkdir -p "$W/globs/film-a" "$W/globs/film-b" "$W/globs/new-a" "$W/globs/new-b"
  run "$B/scripts/new-film.sh" "$W/globs/film*"
  c1=$code
  run "$B/scripts/new-film.sh" "$W/globs/new-[ab]/film"
  left=$(ls -A "$W/globs" | LC_ALL=C sort | tr '\n' ' ')
  [ "$c1" = 1 ] && [ "$code" = 1 ] && [ "$left" = "film-a film-b new-a new-b " ] &&
    pass "copy failing into \"film*\" and \"new-[ab]/film\": exit 1, the folders the run made removed, the user's empty film-a, film-b, new-a, new-b kept" ||
    bad "glob-named targets: exit $c1 and $code, globs/ holds: $left"
fi
chmod 644 "$B/starter/scenes/b_closing.js"

# A file written into the target while the copy is made: a stand-in chmod drops one in when
# new-film.sh marks the staged build.sh executable.
mkdir -p "$W/shim"
cat > "$W/shim/chmod" << 'SHIM'
#!/bin/sh
for last; do :; done
case $last in */.new-film.*/build.sh) echo intruder > "${last%/.new-film.*}/intruder.txt" ;; esac
exec /bin/chmod "$@"
SHIM
/bin/chmod +x "$W/shim/chmod"
run env PATH="$W/shim:$PATH" "$NEW_FILM" "$W/films/raced"
[ "$code" = 2 ] && [ "$(ls -A "$W/films/raced")" = intruder.txt ] &&
  pass "a file appearing in the target mid-copy: exit 2, the copy removed, the file left alone ($(say "$out" | head -n 1))" ||
  bad "raced target: exit $code, holds: $(ls -A "$W/films/raced" 2>&1)"

# A hangup part-way (a stand-in chmod sends it) cleans up like a failure. Run under dash where there
# is one: unlike bash, dash runs no EXIT trap when an untrapped signal ends it.
HUP_SH=$(command -v dash || echo /bin/sh)
mkdir -p "$W/hupshim"
printf '#!/bin/sh\nkill -HUP $PPID\nexec /bin/chmod "$@"\n' > "$W/hupshim/chmod" && /bin/chmod +x "$W/hupshim/chmod"
run env PATH="$W/hupshim:$PATH" "$HUP_SH" "$NEW_FILM" "$W/hup/a/film"
[ "$code" = 129 ] && [ ! -e "$W/hup" ] && pass "a hangup part-way ($HUP_SH): exit 129, everything the run made removed" ||
  bad "hangup ($HUP_SH): exit $code, hup/ $([ -e "$W/hup" ] && echo left behind || echo absent)"

# ---- an exported CDPATH (with it, cd prints the folder it found): relative paths throughout
Q=$W/cdpath
mkdir -p "$Q/skill" && cp -R "$SK/scripts" "$SK/starter" "$SK/tests" "$SK/examples" "$Q/skill/" || exit 1
cd "$Q" || exit 1
run env CDPATH=.:/tmp skill/scripts/new-film.sh films/cd 9:16 blueprint CD
[ "$code" = 0 ] && [ "$(config_value films/cd/film.config.js aspect)" = 9:16 ] && pass "CDPATH=.:/tmp skill/scripts/new-film.sh films/cd: exit 0" ||
  { bad "CDPATH scaffold: exit $code"; say "$out" | sed 's/^/    /'; }
run env CDPATH=.:/tmp sh films/cd/build.sh
[ "$code" = 0 ] && [ -s films/cd/dist/film.html ] && pass "CDPATH: sh films/cd/build.sh writes films/cd/dist/film.html" || bad "CDPATH film build: exit $code"
run env CDPATH=.:/tmp sh skill/examples/to-my-mind/build.sh example.html
[ "$code" = 0 ] && cmp -s example.html "$SK/examples/to-my-mind/to-my-mind.html" && pass "CDPATH: the example builds identically (cmp)" || bad "CDPATH example build: exit $code"
run env CDPATH=.:/tmp sh skill/tests/run.sh example
[ "$code" = 0 ] && say "$out" | grep -q '^ALL TESTS PASSED' && pass "CDPATH: sh skill/tests/run.sh example passes" ||
  { bad "CDPATH test run: exit $code"; say "$out" | tail -n 8 | sed 's/^/    /'; }
cd "$W/elsewhere" || exit 1

# ---- relative path from another folder; defaults
mkdir -p "$W/rel" && cd "$W/rel" || exit 1
run "$NEW_FILM" sub/film/
cd "$W/elsewhere" || exit 1
if [ "$code" = 0 ] && [ -f "$W/rel/sub/film/film.config.js" ]; then
  d="$(config_value "$W/rel/sub/film/film.config.js" aspect) $(config_value "$W/rel/sub/film/film.config.js" preset) $(config_value "$W/rel/sub/film/film.config.js" title)"
  [ "$d" = "1:1 engraved-cosmos Untitled ink film" ] && pass "relative path sub/film/ from its parent: defaults $d" || bad "defaults: $d"
else bad "relative path: exit $code"; fi

# ---- an existing empty folder, named "."
mkdir -p "$W/empty" && cd "$W/empty" || exit 1
run "$NEW_FILM" . 9:16 brand 'Dot'
cd "$W/elsewhere" || exit 1
leftover=$(ls -A "$W/empty" | grep '^\.new-film' || true)
[ "$code" = 0 ] && [ -f "$W/empty/film.config.js" ] && [ -z "$leftover" ] && [ "$(config_value "$W/empty/film.config.js" aspect)" = 9:16 ] &&
  pass "existing empty folder \".\": filled in place, no staging folder left" || bad "empty folder: exit $code, leftover '$leftover'"

# ---- a copy of the skill elsewhere, reached through a symlink: it uses its own starter, and leaves
# the starter's node_modules and .DS_Store files behind
C=$W/skill-copy
mkdir -p "$C" && cp -R "$SK/scripts" "$SK/starter" "$C/" || exit 1
mkdir -p "$C/starter/tools/node_modules/stale" && echo x > "$C/starter/tools/node_modules/stale/SENTINEL"
echo x > "$C/starter/lib/.DS_Store"
echo '// from the copied skill' >> "$C/starter/scenes/b_closing.js"
mkdir -p "$W/bin" && ln -s "$C/scripts/new-film.sh" "$W/bin/new-film"
run "$W/bin/new-film" "$W/films/from-copy" 1:1 blueprint
G=$W/films/from-copy
[ "$code" = 0 ] && tail -n 1 "$G/scenes/b_closing.js" | grep -q 'from the copied skill' &&
  pass "symlinked script in another folder scaffolds from its own skill's starter" || bad "copy via symlink: exit $code"
[ ! -e "$G/tools/node_modules/stale" ] && [ -z "$(find "$G" -name .DS_Store)" ] &&
  pass "the starter's node_modules and .DS_Store are not copied" || bad "node_modules or .DS_Store copied"

# ---- npm failing, then missing: a warning, exit 0, and the film still builds
mkdir -p "$W/fakebin" && printf '#!/bin/sh\necho "npm ERR! pretend failure" >&2\nexit 1\n' > "$W/fakebin/npm" && chmod +x "$W/fakebin/npm"
run env PATH="$W/fakebin:$PATH" "$NEW_FILM" "$W/films/npm-fails"
[ "$code" = 0 ] && say "$out" | grep -q 'warning: npm ci failed' && sh "$W/films/npm-fails/build.sh" > /dev/null && [ -s "$W/films/npm-fails/dist/film.html" ] &&
  pass "npm ci failing: warning, exit 0, the film builds" || { bad "npm failing: exit $code"; say "$out" | sed 's/^/    /'; }
if PATH=/usr/bin:/bin command -v npm > /dev/null 2>&1; then
  echo "note  npm is in /usr/bin or /bin, so the npm-missing case can't be staged here"
else
  run env PATH=/usr/bin:/bin "$NEW_FILM" "$W/films/no-npm"
  [ "$code" = 0 ] && say "$out" | grep -q 'warning: npm not found' && sh "$W/films/no-npm/build.sh" > /dev/null && [ -s "$W/films/no-npm/dist/film.html" ] &&
    pass "npm missing: warning, exit 0, the film builds" || { bad "npm missing: exit $code"; say "$out" | sed 's/^/    /'; }
fi

finish scaffold
