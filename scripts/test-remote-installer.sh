#!/usr/bin/env bash
set -euo pipefail

# Exercises install.sh through its public stdin interface. GitHub is a true external
# dependency, so the test puts a deterministic curl adapter in PATH and serves a local
# archive of the checkout instead of making CI depend on the network.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/msu-skills-installer-test.XXXXXX")"

cleanup() {
  rm -rf -- "$TEST_DIR"
}
trap cleanup EXIT

ARCHIVE="$TEST_DIR/source.tar.gz"
FAKE_BIN="$TEST_DIR/bin"
CURL_LOG="$TEST_DIR/curl.log"
PROBE="$TEST_DIR/probe"
mkdir -p "$FAKE_BIN"

git -C "$ROOT" archive --format=tar.gz --prefix=msu-skills-main/ HEAD > "$ARCHIVE"

cat > "$FAKE_BIN/curl" <<'FAKE_CURL'
#!/usr/bin/env bash
set -eu

output=""
url=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o)
      [ $# -ge 2 ] || exit 2
      output="$2"
      shift 2
      ;;
    https://*)
      url="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

[ -n "$output" ] || exit 2
[ -n "$url" ] || exit 2
printf '%s\n' "$url" > "$MSU_SKILLS_CURL_LOG"
[ "${MSU_SKILLS_CURL_FAIL:-0}" != "1" ] || exit 22
cp "$MSU_SKILLS_TEST_ARCHIVE" "$output"
FAKE_CURL
chmod +x "$FAKE_BIN/curl"

# Start inside the real checkout to prove stdin execution doesn't accidentally use $PWD.
(
  cd "$ROOT"
  PATH="$FAKE_BIN:$PATH" \
    MSU_SKILLS_TEST_ARCHIVE="$ARCHIVE" \
    MSU_SKILLS_CURL_LOG="$CURL_LOG" \
    bash -s -- --plugin game-tools --target "$PROBE" < "$ROOT/install.sh"
)

expected_url="https://codeload.github.com/NEXPACE-Limited/msu-skills/tar.gz/refs/heads/main"
[ "$(cat "$CURL_LOG")" = "$expected_url" ] || {
  echo "remote installer requested an unexpected archive URL" >&2
  exit 1
}

count=0
for skill in "$ROOT"/plugins/game-tools/skills/*/; do
  [ -f "$skill/SKILL.md" ] || continue
  name="$(basename "$skill")"
  [ -f "$PROBE/$name/SKILL.md" ] || {
    echo "remote installer missed game-tools skill '$name'" >&2
    exit 1
  }
  count=$((count + 1))
done
[ "$count" -gt 0 ] || { echo "no game-tools skill tested" >&2; exit 1; }
[ ! -e "$PROBE/maple-make" ] || {
  echo "remote --plugin game-tools also installed an msu skill" >&2
  exit 1
}

# A download failure must happen before the target is changed.
FAILURE_TARGET="$TEST_DIR/failure-target"
mkdir -p "$FAILURE_TARGET"
printf 'keep\n' > "$FAILURE_TARGET/sentinel"
set +e
PATH="$FAKE_BIN:$PATH" \
  MSU_SKILLS_TEST_ARCHIVE="$ARCHIVE" \
  MSU_SKILLS_CURL_LOG="$CURL_LOG" \
  MSU_SKILLS_CURL_FAIL=1 \
  bash -s -- --plugin game-tools --target "$FAILURE_TARGET" < "$ROOT/install.sh"
status=$?
set -e
[ "$status" -ne 0 ] || { echo "remote download failure returned success" >&2; exit 1; }
[ "$(cat "$FAILURE_TARGET/sentinel")" = "keep" ] || {
  echo "remote download failure changed the target" >&2
  exit 1
}

echo "remote installer: $count game-tools skill(s), failure path safe"
