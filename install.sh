#!/usr/bin/env bash
set -euo pipefail

# msu-skills installer — copies the skills of one or more plugins into each CLI's
# skills directory and (best effort) registers the MCP servers they bundle.
#
# Usage:
#   ./install.sh                    # every plugin, into ~/.codex ~/.gemini ~/.kimi
#   ./install.sh --plugin msu       # one plugin only (repeatable)
#   ./install.sh --target <dir>     # copy into <dir> (repeatable; skips MCP setup)
#   curl -fsSL <raw URL> | bash -s -- --plugin msu
#
# Skills install flat, by skill name, because that is where the target CLIs look for
# them. The plugin a skill came from is a packaging boundary, not an install path.
#
# Claude Code does not need this script — install the plugin instead. Most agents are
# also covered by: npx skills add NEXPACE-Limited/msu-skills

REPOSITORY="NEXPACE-Limited/msu-skills"
ARCHIVE_REF="main"
ARCHIVE_URL="https://codeload.github.com/$REPOSITORY/tar.gz/refs/heads/$ARCHIVE_REF"
BOOTSTRAP_DIR=""
MCP_ERR_FILE=""

cleanup_temp() {
  [ -z "$MCP_ERR_FILE" ] || rm -f -- "$MCP_ERR_FILE"
  [ -n "$BOOTSTRAP_DIR" ] || return 0
  [ -d "$BOOTSTRAP_DIR" ] || return 0
  rm -rf -- "$BOOTSTRAP_DIR"
}

trap cleanup_temp EXIT
trap 'exit 130' HUP INT TERM

# A file next to plugins/ is a local checkout. A script read from stdin, or saved by
# itself elsewhere, acquires a temporary source snapshot and then uses the exact same
# install implementation below. Never infer local mode from $PWD: a piped installer may
# be launched while the user happens to be inside another checkout.
SCRIPT_PATH="${BASH_SOURCE[0]-}"
SRC_DIR=""
if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
  SRC_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
fi

if [ -z "$SRC_DIR" ] || [ ! -d "$SRC_DIR/plugins" ]; then
  for command in curl tar mktemp; do
    if ! command -v "$command" >/dev/null 2>&1; then
      echo "Remote install needs '$command', but it is not available." >&2
      exit 1
    fi
  done

  BOOTSTRAP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/msu-skills.XXXXXX")"
  ARCHIVE_FILE="$BOOTSTRAP_DIR/source.tar.gz"
  ARCHIVE_ENTRIES="$BOOTSTRAP_DIR/archive-entries"
  SRC_DIR="$BOOTSTRAP_DIR/source"
  mkdir -p "$SRC_DIR"

  echo "→ Downloading $REPOSITORY@$ARCHIVE_REF"
  if ! curl -fsSL --retry 3 --connect-timeout 15 "$ARCHIVE_URL" -o "$ARCHIVE_FILE"; then
    echo "Could not download $REPOSITORY@$ARCHIVE_REF from GitHub." >&2
    exit 1
  fi
  if ! tar -tzf "$ARCHIVE_FILE" > "$ARCHIVE_ENTRIES"; then
    echo "The downloaded source archive is invalid." >&2
    exit 1
  fi
  if [ ! -s "$ARCHIVE_ENTRIES" ] || grep -Eq '(^/|(^|/)\.\.(/|$))' "$ARCHIVE_ENTRIES"; then
    echo "The downloaded source archive has an unsafe path." >&2
    exit 1
  fi
  if ! tar -xzf "$ARCHIVE_FILE" -C "$SRC_DIR" --strip-components=1; then
    echo "Could not unpack the downloaded source archive." >&2
    exit 1
  fi
  if [ ! -f "$SRC_DIR/.claude-plugin/marketplace.json" ] || [ ! -d "$SRC_DIR/plugins" ]; then
    echo "The downloaded source archive is not an msu-skills catalog." >&2
    exit 1
  fi
fi

# Each plugin owns its own .mcp.json, which is the single source of that server's name
# and URL. Reads the first server only — extend this if a plugin ever ships more.
read_mcp_name() {
  sed -n '
    /"mcpServers"[[:space:]]*:/ {
      :find_server
      n
      s/^[[:space:]]*"\([^"]*\)"[[:space:]]*:[[:space:]]*{[[:space:]]*$/\1/p
      t found_server
      b find_server
      :found_server
      q
    }
  ' "$1"
}
read_mcp_url() {
  sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$1" | head -1
}

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
PLUGINS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --target)
      [ $# -ge 2 ] || { echo "--target needs a directory argument." >&2; exit 1; }
      TARGETS+=("$2"); shift 2 ;;
    --plugin)
      [ $# -ge 2 ] || { echo "--plugin needs a plugin name argument." >&2; exit 1; }
      case "$2" in
        ''|*[!a-z0-9-]*)
          echo "Invalid plugin name '$2' — use lowercase letters, digits, and hyphens." >&2
          exit 1
          ;;
      esac
      PLUGINS+=("$2"); shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ ${#PLUGINS[@]} -eq 0 ]; then
  for dir in "$SRC_DIR"/plugins/*/; do
    [ -d "$dir/skills" ] && PLUGINS+=("$(basename "$dir")")
  done
fi

if [ ${#PLUGINS[@]} -eq 0 ]; then
  echo "No plugin under plugins/ carries a skills/ directory." >&2
  exit 1
fi

for plugin in "${PLUGINS[@]}"; do
  if [ ! -d "$SRC_DIR/plugins/$plugin/skills" ]; then
    echo "Unknown plugin '$plugin' — expected $SRC_DIR/plugins/$plugin/skills" >&2
    exit 1
  fi
done

# Every skill directory of every selected plugin, as absolute paths. A directory is a
# skill only if it holds a SKILL.md — the same test CI's name-uniqueness guard uses.
# Without it this installer would claim, and replace, a target directory whose name no
# guard ever checked for a collision.
skill_dirs() {
  local plugin src
  for plugin in "${PLUGINS[@]}"; do
    for src in "$SRC_DIR/plugins/$plugin"/skills/*/; do
      [ -f "$src/SKILL.md" ] || continue
      (cd "$src" && pwd -P)
    done
  done
}

SKILL_DIRS=()
while IFS= read -r line; do
  [ -n "$line" ] && SKILL_DIRS+=("$line")
done < <(skill_dirs)

if [ ${#SKILL_DIRS[@]} -eq 0 ]; then
  echo "The selected plugin(s) contain no skill directory." >&2
  exit 1
fi

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

# Parse every bundled MCP definition up front, so a definition this script cannot
# read fails the run before any skill is copied — not after "✅ Installed" printed.
MCP_PLUGINS=()
MCP_NAMES=()
MCP_URLS=()
if [ ${#CLIS[@]} -gt 0 ]; then
  for plugin in "${PLUGINS[@]}"; do
    mcp_file="$SRC_DIR/plugins/$plugin/.mcp.json"
    [ -f "$mcp_file" ] || continue
    mcp_name="$(read_mcp_name "$mcp_file")"
    mcp_url="$(read_mcp_url "$mcp_file")"
    [ -n "$mcp_name" ] || { echo "Could not read the MCP server name from $mcp_file." >&2; exit 1; }
    [ -n "$mcp_url" ] || { echo "Could not read the MCP url from $mcp_file." >&2; exit 1; }
    MCP_PLUGINS+=("$plugin")
    MCP_NAMES+=("$mcp_name")
    MCP_URLS+=("$mcp_url")
  done
fi

# Resolve and validate every destination before copying any skill. A destination
# equal to, inside, or containing its source could make replacement delete source
# data. Preflight all targets so one unsafe target cannot cause a partial install.
RESOLVED_TARGETS=()
for target in "${TARGETS[@]}"; do
  target="$(canonical_path "$target")"
  for src in "${SKILL_DIRS[@]}"; do
    destination="$target/$(basename "$src")"
    if [[ "$destination" = "$src" || "$destination" = "$src/"* || "$src" = "$destination/"* ]]; then
      echo "Refusing to install: destination '$destination' overlaps source '$src'." >&2
      echo "Choose a target directory outside the source tree." >&2
      exit 1
    fi
  done
  RESOLVED_TARGETS+=("$target")
done

for target in "${RESOLVED_TARGETS[@]}"; do
  mkdir -p "$target"
  count=0
  for src in "${SKILL_DIRS[@]}"; do
    name="$(basename "$src")"
    rm -rf "${target:?}/${name:?}"
    cp -R "$src" "$target/$name"
    count=$((count + 1))
  done
  echo "✅ Installed $count skill(s) from ${PLUGINS[*]} → $target"
done

if [ ${#CLIS[@]} -eq 0 ]; then
  echo "ℹ️  --target mode: MCP was not configured. See README 'MCP Configuration'."
  exit 0
fi

# MCP registration. A gateway may need a credential, so this is best effort: codex
# reads the key from the environment at runtime (config references the variable name),
# gemini/kimi need the key value at add time. User configs are never edited directly —
# each CLI's own `mcp add` does it.
# The sentinel expansion keeps Bash 3.2 with `set -u` happy on an empty array.
for mcp_idx in ${MCP_PLUGINS[@]+"${!MCP_PLUGINS[@]}"}; do
  MCP_NAME="${MCP_NAMES[$mcp_idx]}"
  MCP_URL="${MCP_URLS[$mcp_idx]}"

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

    # Key values are never echoed; failure messages show the env-var form only,
    # and the CLI's own stderr is relayed with any key occurrence redacted.
    if ! command -v "$cli" >/dev/null 2>&1; then
      echo "⚠️  $cli: not found on PATH — run manually once it is installed: $shown"
      continue
    fi
    # stderr is captured into a file, not a command substitution: a CLI that
    # leaves a background child holding the pipe would block the substitution
    # until that child exits, long after the CLI itself returned.
    [ -n "$MCP_ERR_FILE" ] || MCP_ERR_FILE="$(mktemp "${TMPDIR:-/tmp}/msu-skills.mcp-err.XXXXXX")"
    if "$cli" "${args[@]}" >/dev/null 2>"$MCP_ERR_FILE"; then
      echo "✅ MCP $MCP_NAME registered → $cli"
    else
      echo "⚠️  $cli: automatic MCP registration failed — run manually: $shown"
      cli_err="$(cat "$MCP_ERR_FILE")"
      if [ -n "$cli_err" ]; then
        printf '%s\n' "${cli_err//"$MSU_OPENAPI_KEY"/\$MSU_OPENAPI_KEY}" | sed 's/^/    /'
      fi
    fi
  done
done
