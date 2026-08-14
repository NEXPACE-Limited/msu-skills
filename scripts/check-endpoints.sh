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
# Usage: bash scripts/check-endpoints.sh   (exit 1 on any hit)
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
  'http://'                                   # plaintext endpoint
)

# Matches that are not endpoints, or are endpoints that cannot leak.
ALLOW_PATTERNS=(
  'http://localhost'
  'http://127\.0\.0\.1'
  'http://\[::1\]'
  'http://www\.w3\.org/'      # XML and SVG namespace URIs
  'http://schemas\.'          # namespace URIs
  'http://json-schema\.org/'  # namespace URIs
  'http://www\.sitemaps\.org/schemas/'  # sitemap protocol namespace URI, never fetched
)

is_allowed() {
  local line="$1" allow
  for allow in "${ALLOW_PATTERNS[@]}"; do
    printf '%s' "$line" | grep -Eq -- "$allow" && return 0
  done
  return 1
}

scan_paths() { git ls-files | grep -vxF -- "$SELF"; }

failures=0
for pattern in "${DENY_PATTERNS[@]}"; do
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    is_allowed "$hit" && continue
    file="${hit%%:*}"
    rest="${hit#*:}"
    printf '::error file=%s,line=%s::%s\n' "$file" "${rest%%:*}" "${rest#*:}" >&2
    failures=$((failures + 1))
  done < <(scan_paths | tr '\n' '\0' |
    xargs -0 grep -EnI -- "$pattern" /dev/null 2>/dev/null)
done

if [ "$failures" -ne 0 ]; then
  printf '%d forbidden endpoint(s)\n' "$failures" >&2
  exit 1
fi

printf 'no forbidden endpoint in %s tracked file(s)\n' "$(scan_paths | wc -l | tr -d ' ')"
