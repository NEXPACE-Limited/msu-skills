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

root=${MSU_STATUSLINE_ROOT:-}
if [ -n "$root" ]; then
  # Checked like any other candidate, and never fallen back from: a typo here has to
  # reach the warning below rather than exec a path that is not there and exit 127.
  [ -x "$root/scripts/statusline.sh" ] || root=
else
  # The most recently installed copy wins, so an update is picked up with no settings
  # edit. By mtime rather than by version, for two reasons: `claude plugin update` leaves
  # the old version directory in place — MEASURED, an ordinary cache keeps every version
  # it has fetched — and a version sort over whole paths compares the marketplace name
  # first, so z-market/1.0.0 beats a-market/9.0.0. The marketplace directory is globbed
  # because a fork installs under its own name. Every operation here is a builtin, which
  # is why there is no memo file: resolving costs no process, and a memo would pin
  # whichever version was installed the day it was written.
  for dir in "$CONFIG_DIR"/plugins/cache/*/msu-statusline/*/; do
    [ -x "$dir/scripts/statusline.sh" ] || continue
    [ -z "$root" ] || [ "$dir" -nt "$root" ] || continue
    root=${dir%/}
  done
fi
# --config is passed straight through, with no replay and no stdin. It exists here so
# there is one stable path a user can be handed: this file's location never changes,
# while the plugin's is versioned and moves on every update.
#
# It returns unconditionally, including when the plugin cannot be found. Falling through
# would reach the stdin read below, which blocks on a terminal — a diagnostic command
# that hangs is worse than no diagnostic command.
#
# Not found is stderr and a non-zero exit, unlike the render path below where the same
# warning is the line itself. The install skill redirects this into the conf file it
# creates, so a warning on stdout with a zero exit would be saved as the user's
# configuration.
if [ "${1:-}" = --config ]; then
  [ -n "$root" ] || { printf '%s[1;31m⚠ MSU statusline: plugin not found%s\n' $'\033' $'\033[0m' >&2; exit 1; }
  exec bash "$root/scripts/statusline.sh" --config
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
  cmd=$(cat "$PREV")
  # A .prev naming this plugin would make the launcher run itself, find .prev non-empty,
  # and run itself again — unbounded recursion, two processes per level, on every single
  # redraw. The install skill will not write one; this is the backstop for a hand edit,
  # and for whatever an older install already left behind.
  case $cmd in *msu-statusline*) cmd= ;; esac
  if [ -n "$cmd" ]; then
    prev=$(printf '%s' "$input" | bash -c "$cmd") || prev=
    [ -z "$prev" ] || printf '%s\n' "$prev"
  fi
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
