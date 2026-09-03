#!/usr/bin/env bash
# The MSU status line body. Writes one line per enabled segment to stdout.
#
# Claude Code re-runs the status line on every session event, so a segment reads its
# cache file and returns. The board is reached on one render per POLL_HOURS, forked, so
# no render waits for it — the single exception is a cache that has never been written,
# where waiting once beats showing a blank line.
#
# Sourcing this file with MSU_STATUSLINE_LIB=1 defines the functions without
# printing anything, which is how tests/test.sh reaches the parser.
set -uo pipefail

CONFIG_DIR=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
CONF=$CONFIG_DIR/msu-statusline.conf

# Defaults. msu-statusline-config writes the conf file; it never edits this block.
NOTICE=on
POLL_HOURS=4
LABEL=MSU
MAX_WIDTH=72
# The reader's own clock, which is what "when was this posted" means at a terminal.
# Worth knowing: the board itself renders UTC — VERIFIED, its list is formatted with
# dayjs .utc() — so this line and the page it links to differ by the reader's offset on
# the same post. TIME=utc makes them agree; TIME=off drops the stamp.
TIME=local
# The label's colour: yellow cyan green magenta blue red white, or none for no colour
# at all. Named rather than an escape code, so a value here cannot emit arbitrary bytes
# into the terminal — and the basic eight follow the reader's own palette, where a
# 24-bit value would fight whatever theme they chose.
COLOR=white
# The mark, as one character. A status line is one row tall, and MEASURED against this
# repository's own terminal, sixel, the Kitty protocol and iTerm2's OSC 1337 all render
# nothing — the escape is swallowed silently — so a raster is not on the table and a
# glyph is the mark. ◆ over ✦ because the favicon's silhouette is a diamond with
# concave sides, which at one cell reads as the diamond, and because ✦ is drawn with
# dingbat padding that leaves it visibly smaller than the text beside it. Any string
# works here, and an empty one drops the icon.
ICON=◆
# The favicon's four colours, in its own gradient order. ICON_CYCLE is how many seconds
# each one holds; 0 pins the first.
#
# Ten minutes, because the colour is an ornament and a status line is read past, not
# watched — at a few seconds it pulls the eye off the notice it is decorating. The
# length also settles the timer question: Claude Code redraws the line on every session
# event anyway, far more often than once per cycle, so no statusLine.refreshInterval is
# needed to move it. Shorten this below a minute or so and one becomes necessary, and
# every tick of it re-runs the whole command — including any status line being wrapped.
ICON_COLORS=5c8ffa,ff7af9,3fffba,ad3df9
ICON_CYCLE=600
# Whether the four colours are used at all. They are 24-bit values, which a terminal
# that does not understand them renders as nothing, so auto asks the environment first
# and falls back to the label's colour. Terminal.app and a default tmux set no
# COLORTERM despite handling 24-bit fine, which is what `on` is for; `off` pins the
# icon to the label's colour.
ICON_TRUECOLOR=auto
# End defaults.

# The settable keys, named once. The conf loop tests against this list and --config
# prints it, so neither can drift from the other or from the block above.
KEYS='NOTICE POLL_HOURS LABEL MAX_WIDTH TIME COLOR ICON ICON_COLORS ICON_CYCLE ICON_TRUECOLOR'

# Read rather than source: the conf file is data a config skill writes, and a status
# line that executes it would make every future field a shell injection point.
if [ -r "$CONF" ]; then
  # `|| [ -n "$key" ]` so a file whose last line has no newline still yields that line;
  # a hand edit often leaves one, and dropping the last key silently is the worst way
  # to find out.
  while IFS='=' read -r key value || [ -n "$key" ]; do
    key=${key#"${key%%[![:space:]]*}"}
    key=${key%%[[:space:]]*}
    # Only a whitespace-preceded # opens a comment, so LABEL=C#Build survives.
    case $value in *[[:space:]]#*) value=${value%%[[:space:]]#*} ;; '#'*) value= ;; esac
    value=${value#"${value%%[![:space:]]*}"}
    value=${value%"${value##*[![:space:]]}"}
    value=${value#\"} ; value=${value%\"}
    case " $KEYS " in *" $key "*) printf -v "$key" '%s' "$value" ;; esac
  done < "$CONF"
fi

# Every value the guards below reject is replaced silently — a conf saying ICON_CYCLE=5m
# would otherwise pin the icon to one colour for ever while looking perfectly set. That
# is what --config exists to show: what is in force, not what was typed.
case $NOTICE in on | off) ;; *) NOTICE=on ;; esac
case $TIME in local | utc | off) ;; *) TIME=local ;; esac
case $COLOR in yellow | cyan | green | magenta | blue | red | white | none) ;; *) COLOR=none ;; esac
case $ICON_TRUECOLOR in auto | on | off) ;; *) ICON_TRUECOLOR=auto ;; esac
case $ICON_CYCLE in ''|*[!0-9]*) ICON_CYCLE=0 ;; esac
case $POLL_HOURS in ''|*[!0-9]*) POLL_HOURS=4 ;; esac
case $MAX_WIDTH in ''|*[!0-9]*) MAX_WIDTH=72 ;; esac

NOTICES_URL=https://msu.io/builder/notices
CACHE=${TMPDIR:-/tmp}/msu-statusline-notice
LOCK=$CACHE.lock
STAMP=$CACHE.attempted
# First retry after a failure, doubling on each further failure up to the poll interval
# itself. A flat retry is the load bug this bounds: a board that answers 200 with markup
# the parser no longer understands would otherwise leave every installed machine asking
# six times an hour, for ever, with nothing to surface it.
RETRY_MIN=600
FAILURES=$CACHE.failures

# Is this file older than N seconds? A missing file counts as older, which is what every
# caller wants: no cache means fetch, no stamp means nothing has been tried.
#
# `find -mmin` rather than `stat`, for two reasons. `stat` has no portable spelling —
# BSD wants -f %m, GNU wants -c %Y, and GNU's -f means --file-system, so the wrong one
# prints a format directive and *succeeds*, putting a '?' into arithmetic that aborts
# the caller mid-render. And trying both costs two execs on whichever platform loses the
# coin toss. This is one exec, the same 0.9 ms, and nothing external reaches $(( )).
# Granularity drops to the minute; the shortest interval here is ten.
older_than() { # $1 = path, $2 = seconds
  [ -e "$1" ] || return 0
  [ -n "$(find "$1" -mmin "+$(($2 / 60))" 2>/dev/null)" ]
}

# When a notice was posted. BSD date reads an epoch with -r, GNU date with -d @.
#
# The year is dropped for the current one and kept otherwise: a status line is short,
# and a pinned notice can outlive the year it was written in, where "01-04" alone
# would read as days old.
# One date call, not four: the year is asked for in the same format string and split off
# here. A status line render is a hot path and a date exec costs about 6 ms.
posted_at() { # $1 = epoch, $2 = now (epoch)
  # A plain string rather than an array of flags: macOS ships bash 3.2, where
  # "${empty[@]}" under `set -u` is an unbound variable rather than no argument.
  local zone=-u out
  [ "${TIME:-local}" = local ] && zone=
  out=$(fmt_date "$1" '%Y|%m-%d %H:%M' $zone) || return 1
  if [ "${out%%|*}" = "$(this_year "$2" "$zone")" ]; then
    printf '%s' "${out#*|}"
  else
    printf '%s-%s' "${out%%|*}" "${out#*|}"
  fi
}

# Memoised: the year is the same for every render in a session, and asking the system
# for it is another exec.
THIS_YEAR=
this_year() { # $1 = now, $2 = -u or empty
  [ -n "$THIS_YEAR" ] || THIS_YEAR=$(fmt_date "$1" '%Y' $2)
  printf '%s' "$THIS_YEAR"
}

fmt_date() { # $1 = epoch, $2 = format, $3 = -u or empty
  local e=$1 f=$2 z=${3:-}
  date $z -r "$e" "+$f" 2>/dev/null || date $z -d "@$e" "+$f" 2>/dev/null
}

# Titles arrive HTML-escaped ("New Endpoints &amp; API Enhancements"). &amp; is
# decoded last, or "&amp;lt;" would come out as "<".
decode_entities() {
  local s=$1
  s=${s//&lt;/<}
  s=${s//&gt;/>}
  s=${s//&quot;/\"}
  s=${s//&#39;/\'}
  s=${s//&amp;/&}
  printf '%s' "$s"
}

# The newest entry of one array, as "<threadId>\t<title>\t<epoch>".
#
# The board renders pinned notices from initialStickyThreads and the rest from
# initialThreads, and a brand new notice lands in the first while the second does
# not carry it yet — so reading either array alone silently misses the newest post.
# Both arrive sorted newest-first, which is why only the first object is read.
# Exit 1 means the array is not in the payload at all; exit 2 means it is there and
# could not be read. The caller has to tell those apart: an absent array is normal (the
# board ships no pinned notices), while an unreadable one means the page moved and the
# other array's older entry must not be promoted to newest in silence.
newest_in() { # $1 = payload with JSON quotes unescaped, $2 = array key
  local text=$1 key=$2 chunk id title date
  case $text in *"\"$key\":[{"*) ;; *) return 1 ;; esac
  chunk=${text#*"\"$key\":[{"}
  chunk=${chunk%%'"user":'*}
  case $chunk in *'"threadId":"'*) ;; *) return 2 ;; esac
  case $chunk in *'"title":"'*) ;; *) return 2 ;; esac
  case $chunk in *'"createDate":'*) ;; *) return 2 ;; esac
  id=${chunk#*'"threadId":"'} ; id=${id%%'"'*}
  title=${chunk#*'"title":"'} ; title=${title%%'"'*}
  date=${chunk#*'"createDate":'} ; date=${date%%,*}
  case $id in ''|*[!0-9]*) return 2 ;; esac
  case $date in ''|*[!0-9]*) return 2 ;; esac
  [ -n "$title" ] || return 2
  printf '%s\t%s\t%s\n' "$id" "$title" "$date"
}

# The newest notice across both arrays. Compared by createDate rather than by
# preferring the pinned array, so an unpinned post still wins on being newer.
newest_notice() { # $1 = payload
  local best= line key rc
  for key in initialStickyThreads initialThreads; do
    line=$(newest_in "$1" "$key"); rc=$?
    # Present but unreadable: refuse the whole payload. Keeping the last known-good
    # notice beats presenting the other array's older entry as the newest.
    [ "$rc" -ne 2 ] || return 1
    [ "$rc" -eq 0 ] || continue
    if [ -z "$best" ] || [ "${line##*$'\t'}" -gt "${best##*$'\t'}" ]; then
      best=$line
    fi
  done
  [ -n "$best" ] || return 1
  printf '%s\n' "$best"
}

# Cuts the page down to the head of each array, and unescapes only what it kept.
#
# This is not a tidiness step. MEASURED on the real 157 KB page: one newest_notice over
# the whole payload takes 62s, against 0.03s over the ~3 KB this leaves — bash pattern
# matching walks the whole subject once per leading-* pattern, and there are several.
#
# The page ships its JSON inside a JS string, so the keys are searched in their escaped
# form and gsub unescapes the window rather than a sed over all 157 KB. A fixed window
# rather than [^}]* so a '}' inside a title cannot truncate it; 1600 because createDate
# sits ~650 escaped bytes into an entry. awk rather than grep because BSD grep refuses a
# {0,n} repetition above 255, which would cut the field being read.
narrow() {
  awk 'BEGIN { split("initialStickyThreads initialThreads", keys, " ") }
       { for (k in keys) {
           i = index($0, "\\\"" keys[k] "\\\":[")
           if (i == 0) i = index($0, "\"" keys[k] "\":[")
           if (i) { w = substr($0, i, 1600); gsub(/\\"/, "\"", w); print w }
         } }'
}

# Exit 1: the board could not be reached. Exit 2: it answered and the answer could not
# be read. Only the second says something is wrong with this plugin rather than with the
# network, and the two are reported differently — see WARN_AT.
fetch_notice() { # $1 = seconds this request may take in total
  local payload
  # --compressed: MEASURED 164 KB -> 36 KB. Wall clock here is dominated by the origin's
  # think time, but the saving is real on a slow link and is bandwidth the board does
  # not have to serve.
  payload=$(curl -fsSL --compressed --connect-timeout 3 --max-time "$1" \
    -A 'msu-statusline (+https://github.com/NEXPACE-Limited/msu-skills)' \
    "$NOTICES_URL" 2>/dev/null) || return 1
  payload=$(printf '%s' "$payload" | narrow)
  [ -n "$payload" ] || return 2
  newest_notice "$payload" || return 2
}

do_refresh() { # $1 = curl budget in seconds
  trap 'rmdir "$LOCK" 2>/dev/null' EXIT
  local out n kind
  if out=$(fetch_notice "$1"); then
    # Written whole or not at all: a writer killed mid-print would otherwise leave a
    # half line that the read path has to treat as a notice.
    printf '%s\n' "$out" > "$CACHE.new" && mv -f "$CACHE.new" "$CACHE"
    rm -f "$STAMP" "$FAILURES"
  else
    # rc 2 is "answered, unreadable" — the board changed shape under the parser.
    [ "$?" -eq 2 ] && kind=read || kind=reach
    read -r n _ <<EOF
$(failure_state)
EOF
    [ "$n" -ge 16 ] || n=$((n + 1))
    printf '%s %s\n' "$n" "$kind" > "$FAILURES"
  fi
}

# Reaches the board on at most one render per POLL_HOURS. Three gates: the cache's own
# age, a stamp written *before* the request, and a lock.
#
# The stamp goes down first on purpose. A render Claude Code cancels mid-request never
# reaches any code that could record the attempt, so stamping afterwards would leave a
# cold cache looking untried and put a request on every single render.
# How long to wait after $1 consecutive failures. The first waits RETRY_MIN and each one
# after it doubles — 10m, 20m, 40m … — until it reaches the poll interval and stops
# there, so a permanently broken board settles at the same rate as a healthy one.
backoff() { # $1 = failure count
  local n=$1 ttl=$((POLL_HOURS * 3600)) retry=$RETRY_MIN
  while [ "$n" -gt 1 ] && [ "$retry" -lt "$ttl" ]; do
    retry=$((retry * 2)); n=$((n - 1))
  done
  [ "$retry" -lt "$ttl" ] && printf '%s' "$retry" || printf '%s' "$ttl"
}

# The failure count and what kind, as "<count> <kind>". Absent or unreadable reads as
# no failures, because a missing file is the healthy state.
failure_state() {
  local n=0 kind=reach
  [ -r "$FAILURES" ] && read -r n kind < "$FAILURES"
  case $n in '' | *[!0-9]*) n=0 ;; esac
  case $kind in reach | read) ;; *) kind=reach ;; esac
  printf '%s %s' "$n" "$kind"
}

refresh_notice() {
  local ttl retry n
  ttl=$((POLL_HOURS * 3600))
  older_than "$CACHE" "$ttl" || return 0
  read -r n _ <<EOF
$(failure_state)
EOF
  retry=$(backoff "$n")
  older_than "$STAMP" "$retry" || return 0
  # A lock outlives a cancelled render, and the status line is re-run constantly, so
  # without this reap one cancellation would freeze the notice for good.
  if [ -d "$LOCK" ] && older_than "$LOCK" 120; then
    rmdir "$LOCK" 2>/dev/null
  fi
  # Sessions on one machine share the cache, so only one of them fetches.
  mkdir "$LOCK" 2>/dev/null || return 0
  : > "$STAMP"
  # Forked, so a refresh costs the render nothing. The one exception is a cache that has
  # never been written — an install, or a first session — where waiting beats printing a
  # blank line. That branch blocks a render, so it gets a much tighter budget than the
  # forked one, which nobody is waiting on.
  if [ -s "$CACHE" ]; then
    ( do_refresh 8 ) >/dev/null 2>&1 &
  else
    ( do_refresh 3 ) >/dev/null 2>&1
  fi
}

# The icon's colour as an SGR triple, cycling through ICON_COLORS on wall-clock time.
#
# Derived from the clock rather than from a stored counter: every render is independent,
# several sessions on one machine stay in step, and there is no state to go stale.
# Anything that is not six hex digits is dropped, so a typo cannot reach the terminal.
icon_rgb() { # $1 = now (epoch)
  local now=$1 hex i=0
  local -a colours
  # Word splitting rather than a here-string: bash 3.2 implements <<< by creating,
  # writing and unlinking a temp file, which is real I/O on every single render.
  local IFS=', '
  colours=($ICON_COLORS)
  unset IFS
  [ "${#colours[@]}" -gt 0 ] || return 1
  if [ "$ICON_CYCLE" -gt 0 ]; then
    i=$(( (now / ICON_CYCLE) % ${#colours[@]} ))
  fi
  hex=${colours[$i]}
  case $hex in [0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) ;; *) return 1 ;; esac
  printf '%d;%d;%d' "$((16#${hex:0:2}))" "$((16#${hex:2:2}))" "$((16#${hex:4:2}))"
}

segment_notice() { # $1 = now (epoch)
  [ "$NOTICE" = on ] || return 0
  local now=$1
  refresh_notice

  local id= title= posted= stamp= esc dim reset bold label icon rgb
  local fails kind warn= link=$NOTICES_URL

  # Say so once the backoff has climbed to its ceiling. Until then a failure is
  # ordinary — a closed laptop, a lost network — and shouting about it would be noise.
  # At the ceiling it is no longer ordinary: it has been failing for hours, and the
  # `read` kind means the board answered and the parser could not read it, which is a
  # break in this plugin that nothing else would ever surface.
  read -r fails kind <<EOF
$(failure_state)
EOF
  if [ "$fails" -gt 0 ] && [ "$(backoff "$fails")" -ge $((POLL_HOURS * 3600)) ]; then
    case $kind in
      read) warn='notice format changed' ;;
      *)    warn='board unreachable' ;;
    esac
  fi

  # No cache at all and no warning to give: nothing useful to draw. With a warning there
  # is — this is the case the warning matters most for, an install that has never once
  # succeeded, where staying silent looks identical to working.
  if [ ! -s "$CACHE" ]; then
    [ -n "$warn" ] || return 0
  else
  IFS=$'\t' read -r id title posted < "$CACHE" || return 0
  # Re-validated on the way out, not only on the way in. On Linux with no TMPDIR the
  # cache sits at a fixed name in a world-writable /tmp, so its contents are another
  # process's input: the id goes into a URL and the title goes to the terminal.
  case $id in '' | *[!0-9]*) return 0 ;; esac
  [ -n "$title" ] || return 0
  title=${title//[[:cntrl:]]/}
  title=$(decode_entities "$title")

  # A cache written before TIME existed carries no third field; the line still renders,
  # just without the timestamp, until the next poll rewrites it.
  stamp=
  case $TIME/$posted in
    off/* | */ | */*[!0-9]*) ;;
    *) stamp="$(posted_at "$posted" "$now") · " ;;
  esac
  # Only under a UTF-8 locale: elsewhere bash counts and slices bytes, which cuts a
  # multi-byte title mid-character and renders a replacement glyph. An over-long line
  # is the better failure.
  case ${LC_ALL:-${LC_CTYPE:-${LANG:-}}} in
    *[Uu][Tt][Ff]*)
      [ "${#title}" -le "$MAX_WIDTH" ] || title="${title:0:$((MAX_WIDTH - 1))}…" ;;
  esac
  link=$NOTICES_URL/$id
  fi

  # Three weights, so the line reads in one glance against a busy footer: the time is
  # background, the label is the colour, the title is what you came for. Bold rather
  # than a bright (9x) colour on the title — bright white vanishes on a light theme,
  # while bold renders emphatic on both.
  esc=$'\033'
  dim=$esc'[2m'
  reset=$esc'[0m'
  bold=$esc'[1m'
  case $COLOR in
    yellow)  label=$esc'[1;33m' ;;
    cyan)    label=$esc'[1;36m' ;;
    green)   label=$esc'[1;32m' ;;
    magenta) label=$esc'[1;35m' ;;
    blue)    label=$esc'[1;34m' ;;
    red)     label=$esc'[1;31m' ;;
    white)   label=$esc'[1;37m' ;;
    none | *) label=$bold ;;
  esac

  # The icon carries the mark's own colours, which are brand values rather than theme
  # ones — but only where 24-bit colour is declared. Elsewhere it takes the label's,
  # because a 38;2 sequence on a terminal that does not know it renders as nothing.
  icon=
  if [ -n "${ICON:-}" ]; then
    rgb=
    case $ICON_TRUECOLOR in
      on) rgb=$(icon_rgb "$now") ;;
      off) ;;
      # Terminal.app and a default tmux handle 24-bit colour and advertise nothing, so
      # TERM is consulted too; ICON_TRUECOLOR=on is the answer for the rest.
      *) case ${COLORTERM:-}/${TERM:-} in
           truecolor/* | 24bit/* | */*-direct* | */*truecolor*) rgb=$(icon_rgb "$now") ;;
         esac ;;
    esac
    if [ -n "$rgb" ]; then
      icon=$esc'[1;38;2;'$rgb'm'$ICON$reset' '
    else
      icon=$label$ICON$reset' '
    fi
  fi

  # The warning is red and follows the title, so the notice — which is still the last
  # one that did parse, and still worth reading — keeps its place. The whole run is one
  # link: to the notice when there is one, to the board itself when there is not, which
  # is exactly what someone seeing the warning wants to open.
  # The leading space belongs to the title it follows; with no title there is nothing to
  # separate it from, and the line would render "MSU ·  ⚠ …" with a gap.
  if [ -n "$warn" ]; then
    warn=$esc'[1;31m⚠ '$warn$reset
    [ -z "$title" ] || warn=" $warn"
  fi

  # OSC 8: ESC ] 8 ;; URL BEL  text  ESC ] 8 ;; BEL. Cmd- or Ctrl-click opens it in
  # iTerm2, Kitty, WezTerm and Ghostty; elsewhere the escape is invisible and the
  # title still reads normally.
  printf '%s%s%s%s%s%s%s %s]8;;%s%s%s%s%s%s%s]8;;%s\n' \
    "$dim" "$stamp" "$reset" \
    "$icon" \
    "$label" "$LABEL ·" "$reset" \
    "$esc" "$link" $'\a' \
    "$bold" "$title" "$reset" "$warn" \
    "$esc" $'\a'
}

main() {
  # Claude Code sends session JSON on stdin. No segment reads it yet, but it is drained
  # so the writer never blocks on a full pipe. A builtin loop rather than `cat`, which
  # would be a fork and an exec for the same nothing.
  while IFS= read -r _; do :; done
  # One clock read for the whole render, answering both "now" and "which year is it" —
  # the second is what decides whether the stamp carries a year, and asking for it
  # separately was another exec. %s ignores the zone, %Y does not, so the zone the
  # stamp will be formatted in is settled first.
  local zone=-u pair
  [ "$TIME" = local ] && zone=
  pair=$(date $zone '+%s|%Y')
  THIS_YEAR=${pair#*|}
  segment_notice "${pair%%|*}"
}

# The configuration actually in force, after the conf file and every guard above it.
# msu-statusline-config reads this rather than the conf file, so a value the parser
# rejected shows as what it became.
print_config() {
  local k
  for k in $KEYS; do printf '%s=%s\n' "$k" "${!k}"; done
}

if [ "${MSU_STATUSLINE_LIB:-}" != 1 ]; then
  case ${1:-} in
    --config) print_config ;;
    *) main ;;
  esac
fi
