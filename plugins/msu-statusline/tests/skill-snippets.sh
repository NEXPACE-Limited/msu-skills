#!/usr/bin/env bash
# Execute the skills' own shell examples in an isolated config directory. No network.
# A second implementation of those examples would let the instructions drift unseen.
set -uo pipefail
shopt -u patsub_replacement 2>/dev/null || :

here=$(cd "$(dirname "$0")" && pwd)
plugin=${1:-"$here/.."}
install=$plugin/skills/msu-statusline-install/SKILL.md
config=$plugin/skills/msu-statusline-config/SKILL.md
uninstall=$plugin/skills/msu-statusline-uninstall/SKILL.md
sandbox=$(mktemp -d)
trap 'rm -rf "$sandbox"' EXIT
export CLAUDE_CONFIG_DIR="$sandbox/config" MSU_STATUSLINE_ROOT="$plugin"
export CONFIG="$CLAUDE_CONFIG_DIR" S="$CLAUDE_CONFIG_DIR/settings.json"
mkdir -p "$CONFIG"
fail=0
checks=0
check() {
  checks=$((checks + 1))
  if [ "$2" = "$3" ]; then
    printf 'ok   %s\n' "$1"
  else
    printf 'FAIL %s\n       expected: %s\n       actual:   %s\n' "$1" "$2" "$3"
    fail=1
  fi
}

snippet() { # first bash fence containing a pattern; fail if the example disappeared
  awk -v pattern="$2" '
    /^[[:space:]]*```bash/ { inside=1; code=""; next }
    inside && /^[[:space:]]*```/ {
      inside=0
      if (code ~ pattern) { printf "%s", code; found=1; exit }
    }
    inside { sub(/^   /, ""); code=code $0 "\n" }
    END { if (!found) exit 1 }
  ' "$1"
}

# The edit is the documented placeholder; the file operation is the actual example.
for skill in "$install" "$uninstall"; do
  edit=$(snippet "$skill" '<the edit>') || exit 1
  printf '{"permissions":{"allow":[]},"statusLine":{"padding":0}}\n' > "$S"
  chmod 640 "$S"
  before_mode=$(ls -l "$S" | cut -c1-10)
  bash -c "${edit//<the edit>/.statusLine.command = \"echo previous\"}" || exit 1
  check 'settings edit preserves mode and unrelated fields' \
    "$before_mode|true" \
    "$(ls -l "$S" | cut -c1-10)|$(jq '.permissions == {allow:[]} and .statusLine.padding == 0 and .statusLine.command == "echo previous"' "$S")"
  cp -p "$S" "$sandbox/settings.before"
  bash -c "${edit//<the edit>/error(\"deliberate failure\")}" 2>"$sandbox/error"
  rc=$?
  check 'failed settings edit reports failure' 'nonzero' "$([ "$rc" -ne 0 ] && echo nonzero || echo zero)"
  check 'failed settings edit preserves original and removes temporary file' 'safe' \
    "$(cmp -s "$S" "$sandbox/settings.before" && [ ! -e "$S.new" ] && echo safe)"
done

preserve=$(snippet "$install" 'jq -j') || exit 1
printf 'printf "old line\\n"\n\n' > "$sandbox/previous"
jq -n --rawfile c "$sandbox/previous" '{statusLine:{command:$c}}' > "$S"
bash -c "$preserve" || exit 1
check 'install preserves the previous command byte for byte' 'same' \
  "$(cmp -s "$sandbox/previous" "$CONFIG/msu-statusline.prev" && echo same)"
printf '{"statusLine":{"command":"bash /cache/msu-statusline/1/scripts/launcher.sh"}}\n' > "$S"
bash -c "$preserve" || exit 1
check 'repair preserves the previous backup' 'same' \
  "$(cmp -s "$sandbox/previous" "$CONFIG/msu-statusline.prev" && echo same)"
printf '{}\n' > "$S"
bash -c "$preserve" || exit 1
check 'install with no current command clears a stale backup' 'absent' \
  "$([ ! -e "$CONFIG/msu-statusline.prev" ] && echo absent)"
printf '{"statusLine":{"command":false}}\n' > "$S"
cp "$sandbox/previous" "$CONFIG/msu-statusline.prev"
bash -c "$preserve" 2>"$sandbox/error"
rc=$?
check 'install rejects a non-string command before touching the backup' 'nonzero' \
  "$([ "$rc" -ne 0 ] && echo nonzero || echo zero)"
check 'invalid settings leave the backup intact' 'same' \
  "$(cmp -s "$sandbox/previous" "$CONFIG/msu-statusline.prev" && echo same)"

cp "$plugin/scripts/launcher.sh" "$CONFIG/msu-statusline.sh"
defaults=$(snippet "$install" 'conf.new') || exit 1
bash -c "$defaults" || exit 1
check 'first install writes the effective defaults' 'same' \
  "$(bash "$CONFIG/msu-statusline.sh" --config > "$sandbox/defaults" && cmp -s "$sandbox/defaults" "$CONFIG/msu-statusline.conf" && echo same)"
printf '# keep my choices\nNOTICE=off\nLABEL=My label\n' > "$CONFIG/msu-statusline.conf"
cp "$CONFIG/msu-statusline.conf" "$sandbox/conf.before"
bash -c "$defaults" || exit 1
check 'reinstall keeps the existing conf verbatim' 'same' \
  "$(cmp -s "$sandbox/conf.before" "$CONFIG/msu-statusline.conf" && echo same)"
rm "$CONFIG/msu-statusline.conf"
MSU_STATUSLINE_ROOT="$sandbox/missing-plugin" bash -c "$defaults" 2>"$sandbox/error"
rc=$?
check 'missing plugin makes conf creation fail' 'nonzero' "$([ "$rc" -ne 0 ] && echo nonzero || echo zero)"
check 'failed conf creation leaves no conf or temporary file' 'absent' \
  "$([ ! -e "$CONFIG/msu-statusline.conf" ] && [ ! -e "$CONFIG/msu-statusline.conf.new" ] && echo absent)"

# Real launcher plus a wrapped command that needs model/workspace fields. The path
# also forces proper JSON escaping. NOTICE=off ensures these previews never fetch.
printf 'NOTICE=off\n' > "$CONFIG/msu-statusline.conf"
printf '%s' 'jq -er "[.model.display_name,.workspace.current_dir] | join(\"|\")"' > "$CONFIG/msu-statusline.prev"
jq -n --rawfile c "$CONFIG/msu-statusline.prev" '{statusLine:{command:$c}}' > "$S"
workdir="$sandbox/quote\"and\\backslash"
mkdir "$workdir"
for skill in "$install" "$config" "$uninstall"; do
  preview=$(snippet "$skill" 'workspace|what does it look like') || exit 1
  output=$(cd "$workdir" && bash -c "$preview")
  check "$(basename "$(dirname "$skill")") preview passes valid session JSON" \
    "Opus|$workdir" "$(printf '%s\n' "$output" | tail -1)"
done

branch=$(snippet "$uninstall" 'PREV=') || exit 1
for state in absent empty whitespace valid recursive; do
  case $state in
    absent) rm -f "$CONFIG/msu-statusline.prev"; expected=delete ;;
    empty) : > "$CONFIG/msu-statusline.prev"; expected=delete ;;
    whitespace) printf ' \t\n' > "$CONFIG/msu-statusline.prev"; expected=delete ;;
    valid) printf 'echo original' > "$CONFIG/msu-statusline.prev"; expected=restore ;;
    recursive) printf 'bash /old/msu-statusline/scripts/launcher.sh' > "$CONFIG/msu-statusline.prev"; expected=delete ;;
  esac
  check "uninstall chooses the $state backup branch" "$expected" "$(bash -c "$branch" 2>"$sandbox/error")"
  if [ "$state" = absent ]; then
    check 'missing backup produces no shell redirection error' '' "$(cat "$sandbox/error")"
  fi
done

cleanup=$(snippet "$uninstall" 'cache.lock') || exit 1
mkdir "$CONFIG/msu-statusline.cache.lock"
printf 'keep\n' > "$CONFIG/msu-statusline.cache.backup"
printf 'incomplete\n' > "$CONFIG/msu-statusline.cache.new"
# A refresh already in flight writes after removal has started, then releases its lock.
(
  sleep 1
  printf 'late writer\n' > "$CONFIG/msu-statusline.cache"
  rmdir "$CONFIG/msu-statusline.cache.lock"
) &
writer=$!
bash -c "$cleanup" || exit 1
wait "$writer" || exit 1
check 'uninstall cleans up after an in-flight writer' 'absent' \
  "$([ ! -e "$CONFIG/msu-statusline.cache" ] && [ ! -e "$CONFIG/msu-statusline.cache.new" ] && [ ! -e "$CONFIG/msu-statusline.cache.lock" ] && [ ! -e "$CONFIG/msu-statusline.sh" ] && [ ! -e "$CONFIG/msu-statusline.prev" ] && echo absent)"
check 'uninstall keeps the conf and unrelated similarly named files' 'kept' \
  "$([ -e "$CONFIG/msu-statusline.conf" ] && [ "$(cat "$CONFIG/msu-statusline.cache.backup")" = keep ] && echo kept)"

printf '\n%s skill snippet checks; failures=%s\n' "$checks" "$fail"
exit "$fail"
