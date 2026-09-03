#!/usr/bin/env bash
# Runs the notice parser against a captured page. No network, no cache, no settings.
#
#   bash plugins/msu-statusline/tests/test.sh
set -uo pipefail

here=$(cd "$(dirname "$0")" && pwd)
fixture=$here/notices-fixture.html

# A stand-in config dir, so a developer's own msu-statusline.conf cannot change what
# these assertions see.
export CLAUDE_CONFIG_DIR
CLAUDE_CONFIG_DIR=$(mktemp -d)
trap 'rm -rf "$CLAUDE_CONFIG_DIR"' EXIT

MSU_STATUSLINE_LIB=1 . "$here/../scripts/statusline.sh"

fail=0
check() { # <name> <expected> <actual>
  if [ "$2" = "$3" ]; then
    printf 'ok   %s\n' "$1"
  else
    printf 'FAIL %s\n       expected: %s\n       actual:   %s\n' "$1" "$2" "$3"
    fail=1
  fi
}

payload=$(sed 's/\\"/"/g' "$fixture")

# Renders below read a cache file rather than the network; TMPDIR is where it lives.
export TMPDIR="$CLAUDE_CONFIG_DIR/cache/"
mkdir -p "$TMPDIR"
CACHE=${TMPDIR}msu-statusline-notice
# Config dirs of their own: the conf checks further down rewrite the one at
# $CLAUDE_CONFIG_DIR, and a render reading that would assert against its leftovers.
default_conf=$CLAUDE_CONFIG_DIR/render-default
off_conf=$CLAUDE_CONFIG_DIR/render-off
mkdir -p "$default_conf" "$off_conf"
# POLL_HOURS is enormous so a render never decides the cache is due and reaches out.
printf 'POLL_HOURS=9999\n' > "$default_conf/msu-statusline.conf"
printf 'TIME=off\nPOLL_HOURS=9999\n' > "$off_conf/msu-statusline.conf"
utc_conf=$CLAUDE_CONFIG_DIR/render-utc
mkdir -p "$utc_conf"
printf 'TIME=utc\nPOLL_HOURS=9999\n' > "$utc_conf/msu-statusline.conf"

# What fetch_notice actually hands the parser. The live page is ~157 KB of unrelated
# markup around these arrays and bash pattern matching does not survive a subject that
# long, so production narrows first — and the parser must still read what comes out.
pad=$(head -c 60000 /dev/zero | tr '\0' 'x')
narrowed=$(printf '%s%s%s' "$pad" "$payload" "$pad" | narrow)
# The production path: narrow reads the page as it ships, escaped quotes and all, and
# unescapes only the window it keeps. No sed over the whole document.
check 'narrow reads the raw page, escapes included' \
  '3537195' "$(newest_notice "$(narrow < "$fixture")" | cut -f1)"

check 'narrowing keeps both arrays' \
  '2' "$(printf '%s\n' "$narrowed" | grep -c 'initial')"
check 'the parser reads the narrowed payload' \
  '3537195' "$(newest_notice "$narrowed" | cut -f1)"

# The bug this file exists for: the newest notice is pinned, so it is in
# initialStickyThreads and not yet in initialThreads. Reading the list array alone
# returns a two-week-old post and looks entirely healthy.
check 'newest across both arrays' \
  '3537195' "$(newest_notice "$payload" | cut -f1)"
check 'title of the newest' \
  '[Notice] Sep 2 - Temporary Maintenance' "$(newest_notice "$payload" | cut -f2)"

# Each array alone, so a regression names which side broke.
check 'initialStickyThreads head' \
  '3537195' "$(newest_in "$payload" initialStickyThreads | cut -f1)"
check 'initialThreads head' \
  '3526201' "$(newest_in "$payload" initialThreads | cut -f1)"

# Nothing pinned: the list array has to carry the answer on its own.
check 'falls back when nothing is pinned' \
  '3526201' "$(newest_notice "${payload//initialStickyThreads/absentKey}" | cut -f1)"

# createDate decides, not which array the entry came from. 3526201 heads
# initialThreads and also sits second in the pinned array, so both copies are
# rewritten — the head of initialThreads is what the parser actually reads.
newer=${payload//'"threadId":"3526201"'/'"threadId":"9999999"'}
newer=${newer//'"createDate":1787032800'/'"createDate":1799999999'}
check 'the later createDate wins, whichever array holds it' \
  '9999999' "$(newest_notice "$newer" | cut -f1)"

# A page that is not the notice board must produce nothing rather than a wrong line.
check 'unrecognised payload yields nothing' \
  'no-match' "$(newest_notice '<html>nothing here</html>' || echo no-match)"

check 'html entities are decoded' \
  'New Endpoints & API Enhancements' \
  "$(decode_entities 'New Endpoints &amp; API Enhancements')"
check 'an escaped entity survives one pass' \
  '&lt;' "$(decode_entities '&amp;lt;')"

# The conf file is read, never sourced, so these are the only keys that can take
# effect — and a hand-indented line or a trailing comment has to survive.
cat > "$CLAUDE_CONFIG_DIR/msu-statusline.conf" <<'CONF'
# a comment
  LABEL = BUILDER
POLL_HOURS=12   # trailing comment
MAX_WIDTH=nonsense
REMOVE_ROOT=rm -rf /
CONF
read_conf=$(MSU_STATUSLINE_LIB=1 bash -c '. "$1"; printf "%s|%s|%s|%s" "$LABEL" "$POLL_HOURS" "$MAX_WIDTH" "${REMOVE_ROOT:-unset}"' _ "$here/../scripts/statusline.sh")
check 'conf keys are read, indented and commented alike' \
  'BUILDER|12' "${read_conf%%|*}|$(printf '%s' "$read_conf" | cut -d'|' -f2)"
check 'a non-numeric width falls back to the default' \
  '72' "$(printf '%s' "$read_conf" | cut -d'|' -f3)"
check 'an unknown key is inert, not executed' \
  'unset' "$(printf '%s' "$read_conf" | cut -d'|' -f4)"

# The posting time, which defaults to the board's own UTC. 1788332554 is the fixture's
# newest notice: 2026-09-02 07:02 UTC, which is what msu.io/builder/notices shows.
check 'TIME=local reads the machine clock' \
  '09-02 16:02' "$(TIME=local TZ=Asia/Seoul posted_at 1788332554 1788332554)"
check 'TIME=utc reads the board clock' \
  '09-02 07:02' "$(TIME=utc TZ=Asia/Seoul posted_at 1788332554 1788332554)"
check 'a notice from another year keeps its year' \
  '2025-06-15 15:06' "$(TIME=utc THIS_YEAR= posted_at 1750000000 1788332554)"

render_raw() { # <cache line> [KEY=value ...] — the bytes the terminal receives
  local line=$1; shift
  printf '%s\n' "$line" > "$CACHE"
  env "$@" bash -c 'MSU_STATUSLINE_LIB=1 . "$1"; segment_notice 1788332554' _ \
    "$here/../scripts/statusline.sh"
}

render() { # the same, as text: colours and the hyperlink stripped
  render_raw "$@" | sed $'s/\033\[[0-9;]*m//g; s/\033]8;;[^\a]*\a//g; s/\033]8;;\a//g'
}
newest='3537195	[Notice] Sep 2 - Temporary Maintenance	1788332554'
# 1788332554 is 2026-09-02 07:02 UTC, which is what the board shows, and 16:02 in
# Seoul. The default is the reader's clock, so this pins which of the two ships.
check 'the rendered line leads with the posting time, on the reader clock' \
  '09-02 16:02 · ◆ MSU · [Notice] Sep 2 - Temporary Maintenance' \
  "$(render "$(printf "$newest")" TZ=Asia/Seoul CLAUDE_CONFIG_DIR="$default_conf" TMPDIR="$TMPDIR")"
check 'TIME=utc agrees with the board instead' \
  '09-02 07:02 · ◆ MSU · [Notice] Sep 2 - Temporary Maintenance' \
  "$(render "$(printf "$newest")" TZ=Asia/Seoul CLAUDE_CONFIG_DIR="$utc_conf" TMPDIR="$TMPDIR")"
check 'TIME=off drops the stamp, not the line' \
  '◆ MSU · [Notice] Sep 2 - Temporary Maintenance' \
  "$(render "$(printf "$newest")" CLAUDE_CONFIG_DIR="$off_conf" TMPDIR="$TMPDIR")"
check 'a cache from before the time field still renders' \
  '◆ MSU · [Notice] Older cache' \
  "$(render '3400000	[Notice] Older cache' CLAUDE_CONFIG_DIR="$default_conf" TMPDIR="$TMPDIR")"

# Colour is named, never an escape code, so a conf file cannot push arbitrary bytes at
# the terminal. An unrecognised name has to degrade to plain bold rather than to
# whatever the name happened to be.
# The line opens dim, resets, sets the icon's colour, resets, then the label's — so the
# label's code is the fifth SGR in the stream.
# Set through the conf file, which is the only way a reader ever sets it: the defaults
# block assigns unconditionally, so an environment variable of the same name is
# overwritten at load and would prove nothing.
colour_conf=$CLAUDE_CONFIG_DIR/render-colour
mkdir -p "$colour_conf"
label_sgr() { # $1 = COLOR value
  printf 'POLL_HOURS=9999\nCOLOR=%s\n' "$1" > "$colour_conf/msu-statusline.conf"
  render_raw "$(printf '3537195\t[Notice] x\t1788332554')" \
    CLAUDE_CONFIG_DIR="$colour_conf" TMPDIR="$TMPDIR" \
    | sed $'s/\033/<ESC>/g' | grep -oE '<ESC>\[(1;3[0-7]|1)m' | head -1
}
# The icon leads the line and takes the mark's own colour where 24-bit is declared.
icon_conf=$CLAUDE_CONFIG_DIR/render-icon
mkdir -p "$icon_conf"
icon_line() { # $1 = ICON value
  printf 'POLL_HOURS=9999\nICON=%s\n' "$1" > "$icon_conf/msu-statusline.conf"
  render "$(printf '3537195\t[Notice] x\t1788332554')" \
    CLAUDE_CONFIG_DIR="$icon_conf" TMPDIR="$TMPDIR" TZ=UTC COLORTERM=truecolor
}
check 'the icon sits between the time and the label' \
  '09-02 07:02 · ✦ MSU · [Notice] x' "$(icon_line '✦')"
check 'an empty icon drops it and the space with it' \
  '09-02 07:02 · MSU · [Notice] x' "$(icon_line '')"
# ICON_CYCLE=0 pins the colour: with the cycle running this would assert against
# whatever second the suite happened to run in.
check 'the icon takes the mark colour under truecolor' \
  '<ESC>[1;38;2;92;143;250m' \
  "$(printf 'POLL_HOURS=9999\nICON_CYCLE=0\n' > "$icon_conf/msu-statusline.conf"
     render_raw "$(printf '3537195\t[Notice] x\t1788332554')" \
       CLAUDE_CONFIG_DIR="$icon_conf" TMPDIR="$TMPDIR" COLORTERM=truecolor \
     | sed $'s/\033/<ESC>/g' | grep -o '<ESC>\[1;38;2;[0-9;]*m' | head -1)"
check 'and the label colour where 24-bit is not declared' \
  '<ESC>[1;37m' \
  "$(render_raw "$(printf '3537195\t[Notice] x\t1788332554')" \
       CLAUDE_CONFIG_DIR="$icon_conf" TMPDIR="$TMPDIR" COLORTERM= \
     | sed $'s/\033/<ESC>/g' | grep -oE '<ESC>\[(1;3[0-7]|1)m' | head -1)"

# The cycle is a pure function of the clock, so it is checked against fixed epochs
# rather than by waiting one out.
cycle() { ICON_COLORS=5c8ffa,ff7af9,3fffba,ad3df9 ICON_CYCLE=$1 icon_rgb "$2"; }
check 'the cycle walks the four colours in order' \
  '92;143;250 255;122;249 63;255;186 173;61;249' \
  "$(cycle 3 0) $(cycle 3 3) $(cycle 3 6) $(cycle 3 9)"
check 'and wraps back to the first' \
  '92;143;250' "$(cycle 3 12)"
check 'ICON_CYCLE=0 pins the first colour' \
  '92;143;250' "$(cycle 0 999999)"
check 'a colour that is not six hex digits is refused' \
  'refused' "$(ICON_COLORS=nothex ICON_CYCLE=0 icon_rgb 0 || echo refused)"

check 'a colour name maps to its own SGR code' \
  '<ESC>[1;36m' "$(label_sgr cyan)"
check 'an unknown colour falls back to plain bold' \
  '<ESC>[1m' "$(label_sgr '31m; rm -rf /')"

# ── file age, which every gate below asks about ──────────────────────────────────────
# The predicate the polling gates are built on. It replaced a `stat` pair whose GNU and
# BSD spellings disagree — the wrong one prints a format directive and exits 0, which
# used to put a '?' into arithmetic and abort the render.
probe=$CLAUDE_CONFIG_DIR/probe
: > "$probe"
: > "$probe.old"
touch -t "$(fmt_date $(( $(date +%s) - 20000 )) '%Y%m%d%H%M.%S')" "$probe.old"
check 'a fresh file is not older than the interval' \
  'no' "$(older_than "$probe" 14400 && echo yes || echo no)"
check 'a file past the interval is' \
  'yes' "$(older_than "$probe.old" 14400 && echo yes || echo no)"
# Every caller reads "absent" as "nothing has happened yet, go ahead".
check 'a file that is not there counts as older' \
  'yes' "$(older_than "$CLAUDE_CONFIG_DIR/definitely-absent" 14400 && echo yes || echo no)"

# ── the polling gates ────────────────────────────────────────────────────────────────
# The untested code the whole load contract runs through. fetch_notice is stubbed and
# counts its calls, so none of this reaches the network.
gate=$CLAUDE_CONFIG_DIR/gate
mkdir -p "$gate"
gate_run() { # <conf lines> <cache age s> <stamp age s> <failures> <now offset s>
  local conf=$1 cache_age=$2 stamp_age=$3 failures=$4 offset=${5:-0}
  rm -rf "$gate/cache"; mkdir -p "$gate/cache"
  printf '%s\n' "$conf" > "$gate/msu-statusline.conf"
  local now; now=$(date +%s)
  if [ "$cache_age" != none ]; then
    printf '1\tcached\t1788332554\n' > "$gate/cache/msu-statusline-notice"
    touch -t "$(fmt_date $((now - cache_age)) '%Y%m%d%H%M.%S')" "$gate/cache/msu-statusline-notice"
  fi
  if [ "$stamp_age" != none ]; then
    : > "$gate/cache/msu-statusline-notice.attempted"
    touch -t "$(fmt_date $((now - stamp_age)) '%Y%m%d%H%M.%S')" "$gate/cache/msu-statusline-notice.attempted"
  fi
  [ "$failures" = none ] || printf '%s\n' "$failures" > "$gate/cache/msu-statusline-notice.failures"
  rm -f "$gate/calls"
  CLAUDE_CONFIG_DIR="$gate" TMPDIR="$gate/cache/" bash -c '
    MSU_STATUSLINE_LIB=1 . "$1"
    calls=$2
    # A stub, so no gate check reaches the network. It must not read $2 itself: inside
    # a function that is the function argument, not the script one.
    fetch_notice() { echo FETCHED >> "$calls"; return 1; }
    refresh_notice $(( $(date +%s) + $3 ))
    wait
    if [ -f "$calls" ]; then wc -l < "$calls" | tr -d " "; else echo 0; fi
  ' _ "$here/../scripts/statusline.sh" "$gate/calls" "$offset"
}
check 'a cache inside POLL_HOURS is not refetched' \
  '0' "$(gate_run 'POLL_HOURS=4' 600 none none)"
check 'a cache past POLL_HOURS is refetched' \
  '1' "$(gate_run 'POLL_HOURS=4' 20000 none none)"
check 'a recent failed attempt holds the retry off' \
  '0' "$(gate_run 'POLL_HOURS=4' 20000 60 1)"
check 'the first retry lands after ten minutes' \
  '1' "$(gate_run 'POLL_HOURS=4' 20000 700 1)"
# The load bug this bounds: without escalation a board that answers 200 with markup the
# parser cannot read would poll every ten minutes on every installed machine, for ever.
check 'a fourth failure has stretched the wait past an hour' \
  '0' "$(gate_run 'POLL_HOURS=4' 20000 3000 4)"
check 'and that wait is capped at POLL_HOURS, never longer' \
  '1' "$(gate_run 'POLL_HOURS=4' 20000 15000 99)"
# Sessions on one machine share the cache; a lock another one is holding means this
# render does not add a second request.
locked() {
  rm -rf "$gate/cache"; mkdir -p "$gate/cache/msu-statusline-notice.lock"
  printf 'POLL_HOURS=4\n' > "$gate/msu-statusline.conf"
  printf '1\tcached\t1788332554\n' > "$gate/cache/msu-statusline-notice"
  touch -t "$(fmt_date $(( $(date +%s) - 20000 )) '%Y%m%d%H%M.%S')" \
    "$gate/cache/msu-statusline-notice"
  rm -f "$gate/locked"
  CLAUDE_CONFIG_DIR="$gate" TMPDIR="$gate/cache/" bash -c '
    MSU_STATUSLINE_LIB=1 . "$1"
    calls=$2
    fetch_notice() { echo FETCHED >> "$calls"; return 1; }
    refresh_notice $(date +%s); wait
    if [ -f "$calls" ]; then wc -l < "$calls" | tr -d " "; else echo 0; fi
  ' _ "$here/../scripts/statusline.sh" "$gate/locked"
}
check 'a lock another session holds keeps this one from fetching' '0' "$(locked)"

# ── the link, the truncation, and the off switch ─────────────────────────────────────
check 'the title carries the notice URL as an OSC 8 link' \
  'https://msu.io/builder/notices/3537195' \
  "$(render_raw "$(printf '3537195\t[Notice] x\t1788332554')" \
       CLAUDE_CONFIG_DIR="$default_conf" TMPDIR="$TMPDIR" \
     | tr $'\a' '\n' | grep -o 'https://.*' | head -1)"
long_conf=$CLAUDE_CONFIG_DIR/render-long
mkdir -p "$long_conf"
printf 'POLL_HOURS=9999\nTIME=off\nICON=\nMAX_WIDTH=12\n' > "$long_conf/msu-statusline.conf"
# MAX_WIDTH is the whole width including the marker: 11 characters plus the ellipsis.
check 'a title past MAX_WIDTH is cut and marked' \
  'MSU · 0123456789a…' \
  "$(LC_ALL=en_US.UTF-8 render "$(printf '1\t0123456789abcdef\t1788332554')" \
       CLAUDE_CONFIG_DIR="$long_conf" TMPDIR="$TMPDIR")"
notice_off=$CLAUDE_CONFIG_DIR/render-notice-off
mkdir -p "$notice_off"
printf 'NOTICE=off\n' > "$notice_off/msu-statusline.conf"
check 'NOTICE=off renders nothing at all' \
  '' "$(render "$(printf '1\tx\t1788332554')" CLAUDE_CONFIG_DIR="$notice_off" TMPDIR="$TMPDIR")"

# ── the launcher ─────────────────────────────────────────────────────────────────────
# Never exercised before, and it is what settings.json actually points at.
lroot=$CLAUDE_CONFIG_DIR/launcher
mkdir -p "$lroot/cache"
launch() { # <prev command or empty>
  rm -rf "$lroot/conf"; mkdir -p "$lroot/conf"
  printf 'POLL_HOURS=9999\n' > "$lroot/conf/msu-statusline.conf"
  printf '1\t[Notice] x\t1788332554\n' > "$lroot/cache/msu-statusline-notice"
  [ -z "$1" ] || printf '%s\n' "$1" > "$lroot/conf/msu-statusline.prev"
  CLAUDE_CONFIG_DIR="$lroot/conf" TMPDIR="$lroot/cache/" \
    MSU_STATUSLINE_ROOT="$here/.." bash "$here/../scripts/launcher.sh" </dev/null \
    | sed $'s/\033\[[0-9;]*m//g; s/\033]8;;[^\a]*\a//g; s/\033]8;;\a//g'
}
check 'with no previous status line it emits one row' \
  '1' "$(launch '' | wc -l | tr -d ' ')"
# A previous command that ends without a newline used to merge into the MSU line.
check 'a previous status line with no trailing newline still gets its own row' \
  'PREVLINE' "$(launch 'printf PREVLINE' | head -1)"
# /bin/sh is dash on Debian and Ubuntu, where an ordinary bashism in someone's status
# line would print nothing at all.
check 'a bashism in the previous status line survives the replay' \
  'BASHISM' "$(launch 'if [[ -n x ]]; then echo BASHISM; fi' | head -1)"
check 'a previous status line that fails does not take the MSU line down' \
  '1' "$(launch 'exit 7' | wc -l | tr -d ' ')"

# A plugin the launcher cannot resolve. Exiting quietly here would be the failure this
# whole plugin exists to avoid — and, until it was caught in a rehearsal, it also took
# the user's own status line down with it, because the exit came before the replay.
unresolved() { # $1 = prev command or empty
  rm -rf "$lroot/lost"; mkdir -p "$lroot/lost"
  printf 'POLL_HOURS=9999\n' > "$lroot/lost/msu-statusline.conf"
  [ -z "$1" ] || printf '%s\n' "$1" > "$lroot/lost/msu-statusline.prev"
  CLAUDE_CONFIG_DIR="$lroot/lost" TMPDIR="$lroot/lost/" MSU_STATUSLINE_ROOT= \
    bash "$here/../scripts/launcher.sh" </dev/null 2>&1 \
    | sed $'s/\033\[[0-9;]*m//g'
}
# Removal reads .prev straight back into a JSON string, so the install writes it with
# no trailing newline. The launcher has to accept both, because an older install wrote
# one and a hand edit will add one.
check 'a .prev with no trailing newline replays' \
  'PREVLINE' "$(rm -rf "$lroot/conf"; mkdir -p "$lroot/conf"
                printf 'POLL_HOURS=9999\n' > "$lroot/conf/msu-statusline.conf"
                printf '1\t[Notice] x\t1788332554\n' > "$lroot/cache/msu-statusline-notice"
                printf 'echo PREVLINE' > "$lroot/conf/msu-statusline.prev"
                CLAUDE_CONFIG_DIR="$lroot/conf" TMPDIR="$lroot/cache/" \
                  MSU_STATUSLINE_ROOT="$here/.." bash "$here/../scripts/launcher.sh" </dev/null \
                | head -1)"

# The launcher forwards --config, so there is one path a user can be handed that does
# not move when the plugin is updated. It must answer without reading stdin: a
# diagnostic that blocks on a terminal is worse than none.
check 'the launcher forwards --config' \
  'MAX_WIDTH=72' "$(rm -rf "$lroot/conf"; mkdir -p "$lroot/conf"
                    printf 'echo PREV\n' > "$lroot/conf/msu-statusline.prev"
                    CLAUDE_CONFIG_DIR="$lroot/conf" TMPDIR="$lroot/cache/" \
                      MSU_STATUSLINE_ROOT="$here/.." bash "$here/../scripts/launcher.sh" --config \
                    | sed -n '/^MAX_WIDTH=/p')"
check 'and answers even with no plugin, instead of waiting on stdin' \
  '⚠ MSU statusline: plugin not found' \
  "$(CLAUDE_CONFIG_DIR="$lroot/conf" TMPDIR="$lroot/cache/" MSU_STATUSLINE_ROOT= \
       bash "$here/../scripts/launcher.sh" --config 2>&1 | sed $'s/\033\[[0-9;]*m//g')"

check 'an unresolvable plugin says so rather than going quiet' \
  '⚠ MSU statusline: plugin not found' "$(unresolved '')"
check 'and does not take the wrapped status line down with it' \
  'PREVLINE' "$(unresolved 'echo PREVLINE' | head -1)"
check 'no stray error when there is no previous status line either' \
  '1' "$(unresolved '' | wc -l | tr -d ' ')"

# ── saying so when it has been failing for hours ─────────────────────────────────────
# The state this exists for: the board answers 200 with markup the parser cannot read.
# Nothing else would ever surface that — the line just keeps showing an old notice, or
# nothing at all, and looks exactly like a quiet week.
warn_conf=$CLAUDE_CONFIG_DIR/render-warn
mkdir -p "$warn_conf"
printf 'POLL_HOURS=4\nTIME=off\nICON=\n' > "$warn_conf/msu-statusline.conf"
# Not render(), which writes the cache itself — half of these need it absent.
warn_raw() { # $1 = "<count> <kind>", $2 = cached|empty
  printf '%s\n' "$1" > "${TMPDIR}msu-statusline-notice.failures"
  # A stamp of now, so the render's own gate never decides a fetch is due and no check
  # below reaches the board.
  : > "${TMPDIR}msu-statusline-notice.attempted"
  case $2 in
    cached) printf '1\t[Notice] x\t1788332554\n' > "$CACHE" ;;
    empty)  rm -f "$CACHE" ;;
  esac
  env CLAUDE_CONFIG_DIR="$warn_conf" TMPDIR="$TMPDIR" \
    bash -c 'MSU_STATUSLINE_LIB=1 . "$1"; segment_notice 1788332554' _ \
    "$here/../scripts/statusline.sh"
}
warned() {
  warn_raw "$@" | sed $'s/\033\[[0-9;]*m//g; s/\033]8;;[^\a]*\a//g; s/\033]8;;\a//g'
}
check 'a few failures say nothing — a closed laptop is not news' \
  'MSU · [Notice] x' "$(warned '3 read' cached)"
# 6 failures is where the doubling reaches POLL_HOURS and stops climbing.
check 'at the ceiling it says the format changed' \
  'MSU · [Notice] x ⚠ notice format changed' "$(warned '6 read' cached)"
check 'and distinguishes a board it could not reach at all' \
  'MSU · [Notice] x ⚠ board unreachable' "$(warned '6 reach' cached)"
# The worst case for noticing: an install that never once succeeded shows no line at
# all, which is indistinguishable from working.
check 'it warns even with nothing cached to warn beside' \
  'MSU · ⚠ notice format changed' "$(warned '6 read' empty)"
check 'and still stays quiet there below the ceiling' \
  '' "$(warned '3 read' empty)"
check 'the warning links to the board when there is no notice to link to' \
  'https://msu.io/builder/notices' \
  "$(warn_raw '6 read' empty | tr $'\a' '\n' | grep -o 'https://.*' | head -1)"
rm -f "${TMPDIR}msu-statusline-notice.failures" "${TMPDIR}msu-statusline-notice.attempted"

# ── which failure it was ─────────────────────────────────────────────────────────────
# fetch_notice separates them, and only the parse failure means this plugin is broken.
check 'an unreachable board is a reach failure' \
  '1' "$(curl() { return 7; }; fetch_notice 1 >/dev/null 2>&1; echo $?)"
check 'a page that answers but does not parse is a read failure' \
  '2' "$(curl() { echo '<html>not the board</html>'; }; fetch_notice 1 >/dev/null 2>&1; echo $?)"

# ── what --config reports ────────────────────────────────────────────────────────────
# msu-statusline-config reads this instead of the conf file, so it has to report the
# value in force. A conf full of plausible typos is the case that matters: every one of
# these renders a healthy-looking line while doing something else entirely.
cfg=$CLAUDE_CONFIG_DIR/effective
mkdir -p "$cfg"
printf 'NOTICE=yes\nPOLL_HOURS=4h\nMAX_WIDTH=80px\nTIME=KST\nCOLOR=orange\nICON_CYCLE=5m\nICON_TRUECOLOR=maybe\nBOGUS=x\n' \
  > "$cfg/msu-statusline.conf"
effective() { # $1 = key
  env CLAUDE_CONFIG_DIR="$cfg" bash "$here/../scripts/statusline.sh" --config \
    | sed -n "s/^$1=//p"
}
check 'a non-numeric cycle reports as 0, which is what freezes the colour' \
  '0' "$(effective ICON_CYCLE)"
check 'an unknown timezone reports as local' 'local' "$(effective TIME)"
check 'an unknown colour reports as none' 'none' "$(effective COLOR)"
check 'a width with a unit reports as the default' '72' "$(effective MAX_WIDTH)"
check 'an unknown NOTICE value reports as on' 'on' "$(effective NOTICE)"
check 'an unknown truecolor value reports as auto' 'auto' "$(effective ICON_TRUECOLOR)"
check 'a key the script does not know is not reported at all' \
  '' "$(effective BOGUS)"
# One list, used by the conf loop and by --config alike, so the two cannot disagree.
check 'every key the parser accepts is reported' \
  "$(sed -n "s/^KEYS='\(.*\)'/\1/p" "$here/../scripts/statusline.sh" | tr ' ' '\n' | sort | tr '\n' ' ')" \
  "$(env CLAUDE_CONFIG_DIR="$cfg" bash "$here/../scripts/statusline.sh" --config \
     | cut -d= -f1 | sort | tr '\n' ' ')"

[ "$fail" -eq 0 ] && printf '\nall checks passed\n'
exit "$fail"
