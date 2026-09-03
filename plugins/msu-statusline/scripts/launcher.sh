#!/usr/bin/env bash
# What Claude Code's statusLine.command runs. The msu-statusline-install skill copies
# this to $CLAUDE_CONFIG_DIR/msu-statusline.sh, and settings.json points there rather
# than into the plugin: the plugin cache is versioned, so a path into it would go
# stale on every `claude plugin update`.
#
# Two jobs — replay whatever status line was already configured, then append MSU's.
set -uo pipefail

CONFIG_DIR=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
PREV=$CONFIG_DIR/msu-statusline.prev
MEMO=${TMPDIR:-/tmp}/msu-statusline-root

root=${MSU_STATUSLINE_ROOT:-}
if [ -z "$root" ] && [ -r "$MEMO" ]; then
  read -r root < "$MEMO"
  [ -x "$root/scripts/statusline.sh" ] || root=
fi
if [ -z "$root" ]; then
  # Highest version wins, so an update is picked up with no settings edit. The
  # marketplace directory is globbed because a fork installs under its own name. This
  # walks a directory tree and spawns three processes, so the answer is memoised — it
  # changes only when the plugin is updated, and the memo is re-checked above.
  root=$(ls -d "$CONFIG_DIR"/plugins/cache/*/msu-statusline/*/ 2>/dev/null \
    | sort -V | tail -1)
  root=${root%/}
  [ -z "$root" ] || printf '%s\n' "$root" > "$MEMO"
fi
# Nothing to replay and a plugin to run: hand the process over rather than spending
# another one. stdin passes through untouched and this launcher stops existing.
if [ ! -s "$PREV" ] && [ -n "$root" ]; then
  exec bash "$root/scripts/statusline.sh"
fi

# Otherwise stdin has to be read here, because two commands need the same bytes and it
# is readable once. `read -d ''` consumes all of it as a builtin; `$(cat)` was a fork
# and an exec for the same result. It reports failure at EOF having filled the variable,
# which is the normal case.
input=
IFS= read -r -d '' input || :

# The status line the user had before installing, kept verbatim. Two things it must not
# do: take the MSU line down when it fails, and merge into it — a status line ending
# without a newline would otherwise leave both on one row.
#
# bash, not sh: on Debian and Ubuntu /bin/sh is dash, and a previous status line using
# [[ ]], (( )), an array or a here-string — all ordinary in one — would print nothing.
#
# Guarded, because the exec above is skipped when the plugin cannot be resolved — so
# this is reachable with no .prev at all.
if [ -s "$PREV" ]; then
  prev=$(printf '%s' "$input" | bash -c "$(cat "$PREV")") || prev=
  [ -z "$prev" ] || printf '%s\n' "$prev"
fi

# An unresolvable root is reported, not swallowed. Exiting quietly here is the failure
# mode this whole plugin is built to avoid: the line would simply stop appearing, which
# looks exactly like a week with no notices. It also has to come *after* the replay
# above — a broken plugin path must never take the user's own status line down with it.
if [ -z "$root" ]; then
  printf '%s[1;31m⚠ MSU statusline: plugin not found%s\n' $'\033' $'\033[0m'
  exit 0
fi

printf '%s' "$input" | bash "$root/scripts/statusline.sh"
