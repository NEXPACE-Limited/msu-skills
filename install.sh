#!/usr/bin/env bash
set -euo pipefail

# msu-skills manual installer — copies skills/ into each CLI's skills directory
# and (best effort) registers the maple-lookup MCP server.
#
# Usage:
#   ./install.sh                  # auto-detect ~/.codex ~/.gemini ~/.kimi
#   ./install.sh --target <dir>   # copy into <dir> (repeatable; skips MCP setup)
#
# Claude Code does not need this script — install the msu plugin instead.
# Most agents are also covered by: npx skills add NEXPACE-Limited/msu-skills
# Run from a cloned checkout; this script never downloads anything itself.

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$SRC_DIR/skills" ]; then
  echo "skills/ not found next to install.sh — run from a cloned msu-skills checkout." >&2
  exit 1
fi

# .mcp.json at the repo root is the single source of the MCP server name and URL.
# Reads the first server only — extend this if more servers are ever added.
MCP_NAME="$(sed -n '
  /"mcpServers"[[:space:]]*:/ {
    :find_server
    n
    s/^[[:space:]]*"\([^"]*\)"[[:space:]]*:[[:space:]]*{[[:space:]]*$/\1/p
    t found_server
    b find_server
    :found_server
    q
  }
' "$SRC_DIR/.mcp.json")"
MCP_URL="$(sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SRC_DIR/.mcp.json" | head -1)"
[ -n "$MCP_NAME" ] || { echo "Could not read the MCP server name from .mcp.json." >&2; exit 1; }
[ -n "$MCP_URL" ] || { echo "Could not read the MCP url from .mcp.json." >&2; exit 1; }

# Resolve an existing or prospective directory without creating it. This lets the
# installer reject paths inside the source tree before any files are touched.
canonical_path() {
  local candidate="$1"
  local component parent
  # Keep a sentinel so Bash 3.2 with `set -u` can expand an otherwise empty array.
  local -a suffix=("")

  [[ "$candidate" = /* ]] || candidate="$PWD/$candidate"
  while [ ! -d "$candidate" ]; do
    component="$(basename "$candidate")"
    suffix=("$component" "${suffix[@]}")
    parent="$(dirname "$candidate")"
    [ "$parent" != "$candidate" ] || break
    candidate="$parent"
  done

  candidate="$(cd "$candidate" && pwd -P)"
  for component in "${suffix[@]}"; do
    case "$component" in
      ''|.) ;;
      ..) candidate="$(dirname "$candidate")" ;;
      *) candidate="$candidate/$component" ;;
    esac
  done
  printf '%s\n' "$candidate"
}

TARGETS=()
CLIS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --target)
      [ $# -ge 2 ] || { echo "--target needs a directory argument." >&2; exit 1; }
      TARGETS+=("$2"); shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  for cli in codex gemini kimi; do
    [ -d "$HOME/.$cli" ] && { TARGETS+=("$HOME/.$cli/skills"); CLIS+=("$cli"); }
  done
fi

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "No target CLI found (~/.codex, ~/.gemini, ~/.kimi missing)." >&2
  echo "Specify a directory manually: ./install.sh --target <skills-dir>" >&2
  exit 1
fi

# Resolve and validate every destination before copying any skill. A destination
# equal to, inside, or containing its source could make replacement delete source
# data. Preflight all targets so one unsafe target cannot cause a partial install.
RESOLVED_TARGETS=()
for target in "${TARGETS[@]}"; do
  target="$(canonical_path "$target")"
  for src in "$SRC_DIR"/skills/*/; do
    [ -d "$src" ] || continue
    src="$(cd "$src" && pwd -P)"
    name="$(basename "$src")"
    destination="$target/$name"
    if [[ "$destination" = "$src" || "$destination" = "$src/"* || "$src" = "$destination/"* ]]; then
      echo "Refusing to install: destination '$destination' overlaps source '$src'." >&2
      echo "Choose a target directory outside the source tree." >&2
      exit 1
    fi
  done
  RESOLVED_TARGETS+=("$target")
done

# Copy every directory under skills/ wholesale, so shared asset directories
# (if any are added later) ride along with the skills themselves.
for target in "${RESOLVED_TARGETS[@]}"; do
  mkdir -p "$target"
  count=0
  for src in "$SRC_DIR"/skills/*/; do
    [ -d "$src" ] || continue
    name="$(basename "$src")"
    rm -rf "${target:?}/${name:?}"
    cp -R "$src" "$target/$name"
    count=$((count + 1))
  done
  echo "✅ Installed $count directory(ies) from skills/ → $target"
done

if [ ${#CLIS[@]} -eq 0 ]; then
  echo "ℹ️  --target mode: MCP was not configured. See README 'MCP Configuration'."
  exit 0
fi

# MCP registration. The gateway needs an MSU Builder OpenAPI key, so this is
# best effort: codex reads the key from the environment at runtime (config
# references the variable name), gemini/kimi need the key value at add time.
# User configs are never edited directly — each CLI's own `mcp add` does it.
for cli in "${CLIS[@]}"; do
  case "$cli" in
    codex)
      echo "ℹ️  codex: add to ~/.codex/config.toml (reads \$MSU_OPENAPI_KEY at runtime):"
      printf '    [mcp_servers.%s]\n    url = "%s"\n    env_http_headers = { "x-nxopen-api-key" = "MSU_OPENAPI_KEY" }\n' "$MCP_NAME" "$MCP_URL"
      continue
      ;;
    gemini)
      args=(mcp add -t http -s user --header "x-nxopen-api-key: ${MSU_OPENAPI_KEY:-}" "$MCP_NAME" "$MCP_URL")
      shown="gemini mcp add -t http -s user --header \"x-nxopen-api-key: \$MSU_OPENAPI_KEY\" $MCP_NAME $MCP_URL"
      ;;
    kimi)
      args=(mcp add -t http --header "x-nxopen-api-key: ${MSU_OPENAPI_KEY:-}" "$MCP_NAME" "$MCP_URL")
      shown="kimi mcp add -t http --header \"x-nxopen-api-key: \$MSU_OPENAPI_KEY\" $MCP_NAME $MCP_URL"
      ;;
  esac

  if [ -z "${MSU_OPENAPI_KEY:-}" ]; then
    echo "ℹ️  $cli: MSU_OPENAPI_KEY is not set — register after issuing a key:"
    echo "    export MSU_OPENAPI_KEY=\"<issued key>\" && $shown"
    continue
  fi

  # Key values are never echoed; failure messages show the env-var form only.
  if command -v "$cli" >/dev/null 2>&1 && "$cli" "${args[@]}" >/dev/null 2>&1; then
    echo "✅ MCP $MCP_NAME registered → $cli"
  else
    echo "⚠️  $cli: automatic MCP registration failed — run manually: $shown"
  fi
done
