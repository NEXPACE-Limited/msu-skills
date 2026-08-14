#!/usr/bin/env bash
# Scans tracked files for what a public repository must not carry: credentials inside a
# URL, internal or unauthenticated endpoints. Only tracked files are scanned, so the
# scanned set and the published set are the same.
#
# Ported from nexpace-skills-hub/scripts/check-endpoints.sh, which ran this over every
# spoke checkout. That hub is retired, so this repository runs it on itself. The MCP
# half of the original lives in the CI `guards` job instead, next to the other manifest
# checks.
#
# Usage: bash scripts/check-endpoints.sh
#   exit 0  nothing found       exit 1  forbidden endpoint(s)       exit 2  cannot scan
#
# A healthy run of this guard prints nothing but a summary, so a broken scanner and a
# clean repository look identical from the outside. Two things keep them apart: the
# self-test below, and the fact that the scan's error channel is read rather than
# discarded. Both report exit 2 — never 0.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)" || exit 2

# This file holds the deny patterns as literals, so scanning it would always match.
SELF="scripts/check-endpoints.sh"

# Extended regular expressions. A line that matches one of these is reported unless it
# also matches an allow pattern.
DENY_PATTERNS=(
  '://[A-Za-z0-9._%+-]+:[^/@[:space:]"]+@'    # credentials embedded in a URL
  'https?://[0-9]{1,3}(\.[0-9]{1,3}){3}'      # raw IPv4 host
  '[A-Za-z0-9.-]+\.elb\.amazonaws\.com'       # load balancer address
  '[A-Za-z0-9.-]+\.svc\.cluster\.local'       # in-cluster service
  '[A-Za-z0-9.-]+\.internal[/:[:space:]"]'    # internal-only host
  'http://[^[:space:]"'\''<>)]*'              # plaintext endpoint, up to the host+path
)

# Matches that are not endpoints, or are endpoints that cannot leak. Each is anchored at
# the start of a deny match, never searched across the line — see is_allowed.
ALLOW_PATTERNS=(
  'http://localhost'
  'http://127\.0\.0\.1'
  'http://\[::1\]'
  'http://www\.w3\.org/'      # XML and SVG namespace URIs
  'http://schemas\.'          # namespace URIs
  'http://json-schema\.org/'  # namespace URIs
)

# Takes one deny match, not a line. Applied to the whole line, an allowed endpoint would
# clear every other endpoint sharing it — `proxy http://localhost:8080 to http://10.0.0.1`
# would pass on the strength of the localhost half.
is_allowed() {
  local match="$1" allow
  for allow in "${ALLOW_PATTERNS[@]}"; do
    printf '%s' "$match" | grep -Eq -- "^$allow" && return 0
  done
  return 1
}

scan_paths() { git ls-files | grep -vxF -- "$SELF"; }

# One string per deny pattern, built to trip it. They live here rather than in a tracked
# fixture file: a fixture carrying these would be found by the scan itself and reported
# as a real leak. Positions match DENY_PATTERNS.
DENY_CONTROLS=(
  'https://user:pw@example.test'
  'http://203.0.113.7'
  'probe.elb.amazonaws.com'
  'probe.svc.cluster.local'
  'probe.internal/'
  'http://probe.example'
)

# Proves the machinery still works before trusting a quiet scan: an unmatched control
# means a deny pattern stopped catching what it names, and a misjudged allow means the
# acquittal side drifted. Either way the scan below would have run and found nothing.
self_test() {
  local i n=${#DENY_PATTERNS[@]} err
  if [ "${#DENY_CONTROLS[@]}" -ne "$n" ]; then
    printf 'self-test: %d control(s) for %d deny pattern(s)\n' "${#DENY_CONTROLS[@]}" "$n" >&2
    return 1
  fi
  for ((i = 0; i < n; i++)); do
    err="$(printf '%s' "${DENY_CONTROLS[i]}" | grep -E -- "${DENY_PATTERNS[i]}" 2>&1 >/dev/null)"
    if [ -n "$err" ]; then
      printf 'self-test: deny pattern %s is not a usable regex: %s\n' "${DENY_PATTERNS[i]}" "$err" >&2
      return 1
    fi
    if ! printf '%s' "${DENY_CONTROLS[i]}" | grep -Eq -- "${DENY_PATTERNS[i]}"; then
      printf 'self-test: deny pattern %s no longer matches %s\n' "${DENY_PATTERNS[i]}" "${DENY_CONTROLS[i]}" >&2
      return 1
    fi
  done
  if ! is_allowed 'http://localhost:8080'; then
    printf 'self-test: the allow list no longer clears http://localhost:8080\n' >&2
    return 1
  fi
  if is_allowed 'http://203.0.113.7'; then
    printf 'self-test: the allow list cleared a forbidden address\n' >&2
    return 1
  fi
  return 0
}

if ! self_test; then
  printf 'the endpoint scanner is broken — this run proves nothing\n' >&2
  exit 2
fi

hits="$(mktemp)" || exit 2
errs="$(mktemp)" || exit 2
trap 'rm -f "$hits" "$errs"' EXIT

failures=0
for pattern in "${DENY_PATTERNS[@]}"; do
  # Collected to a file rather than piped, so the error channel can be read after the
  # scan has finished instead of racing it.
  scan_paths | tr '\n' '\0' |
    xargs -0 grep -EnI -- "$pattern" /dev/null >"$hits" 2>"$errs"
  if [ -s "$errs" ]; then
    printf 'the endpoint scan failed on pattern %s — this run proves nothing:\n' "$pattern" >&2
    cat "$errs" >&2
    exit 2
  fi

  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    file="${hit%%:*}"
    rest="${hit#*:}"
    lineno="${rest%%:*}"
    text="${rest#*:}"
    # Re-extract the pattern's own matches from the line and judge each one on its own.
    offending=""
    extracted=0
    while IFS= read -r match; do
      [ -n "$match" ] || continue
      extracted=1
      is_allowed "$match" && continue
      offending="$match"
      break
    done < <(printf '%s\n' "$text" | grep -Eo -- "$pattern")
    # Fail closed: the line matched, so extracting nothing back out is a scanner problem,
    # not an acquittal.
    [ "$extracted" -eq 1 ] || offending="$text"
    [ -n "$offending" ] || continue
    printf '::error file=%s,line=%s::%s — in: %s\n' "$file" "$lineno" "$offending" "$text" >&2
    failures=$((failures + 1))
  done <"$hits"
done

if [ "$failures" -ne 0 ]; then
  printf '%d forbidden endpoint(s)\n' "$failures" >&2
  exit 1
fi

printf 'no forbidden endpoint in %s tracked file(s)\n' "$(scan_paths | wc -l | tr -d ' ')"
