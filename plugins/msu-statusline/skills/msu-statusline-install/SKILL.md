---
name: msu-statusline-install
description: "Claude Code only — a status line is a Claude Code concept and this skill does nothing on another CLI. Puts the newest MSU Builder notice in the Claude Code status line, or takes it back out. Use when the user asks to install, enable, set up, turn off, remove, or repair the MSU status line, wants MSU notices or announcements shown under the prompt or in the terminal, or reports that the MSU status line is blank, stale, or gone after an update. Wraps a status line that is already configured rather than replacing it."
---

# msu-statusline-install

Wires the MSU status line into the user's own settings, and unwires it. Claude Code
reads `statusLine` from `settings.json` rather than from plugin config, so a plugin
cannot install one — this skill writes it on the user's behalf.

What lands where, all under `CONFIG` = `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`:

| Path | What it is |
|---|---|
| `$CONFIG/msu-statusline.sh` | copy of `${CLAUDE_PLUGIN_ROOT}/scripts/launcher.sh`; what `settings.json` points at |
| `$CONFIG/msu-statusline.prev` | the status-line command that was configured before, verbatim |
| `$CONFIG/msu-statusline.conf` | the settings `msu-statusline-config` edits |
| `$CONFIG/msu-statusline.cache` | the last notice read, plus `.lock`, `.attempted` and `.failures` beside it |

`settings.json` points at the copy rather than into the plugin because the plugin
cache is versioned — a path into it would break on the next `claude plugin update`.
The launcher resolves the most recently installed copy itself, on every render, so an
update to the body of the status line is picked up with nothing to re-run. The launcher
*copy* is the exception: it is a file, not a resolution, and `claude plugin update` does
not touch it. Re-running this install is what refreshes it, and step 3 does that
unconditionally.

## Install

Everything below writes to `$CONFIG`, so assign it once in whatever shell you use:

```bash
CONFIG=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
```

Two things hold for every write to `settings.json` in either direction. **Keep its file
mode** — the obvious atomic idiom, `mktemp` then `mv`, silently replaces a 0644 file
with a 0600 one, and this is the file holding the user's permissions and hooks. Clone
the mode by making the temporary file a copy of the original, which `cp -p` does and
`mktemp` cannot:

```bash
S=$CONFIG/settings.json
cp -p "$S" "$S.new" && jq '<the edit>' "$S" > "$S.new" && mv -f "$S.new" "$S" \
  || rm -f "$S.new"
```

`cp -p` first, then the redirect: `>` truncates the copy and leaves its mode alone, and
`mv` over the original is atomic, so a `jq` that fails writes nothing. On a machine with
no settings file the `cp` fails and there is no mode to keep — write the file directly
there.

And **leave a `statusLine` sibling you did not put there alone**, `padding` being the one
that exists today.

1. **Read `$CONFIG/settings.json`.** Create `$CONFIG` if it is not there, and treat a
   missing or empty file as `{}` — a first install has neither, and the JSON below is
   then the whole file rather than a patch. Edit the file as JSON, never as text: it holds the user's permissions and hooks, and a bad
   patch costs them more than this feature. Parsing and re-serialising reflows the
   file — every value survives, the formatting may not, and that is fine.
2. **Preserve an existing status line.** If `.statusLine.command` is set and does
   **not** already mention `msu-statusline`, write it to `$CONFIG/msu-statusline.prev`
   — the decoded value of that JSON string, the shell command itself, because the
   launcher runs it with `bash -c`. Write no trailing newline: removal puts this file
   straight back into a JSON string, and a stray `\n` there is a command that no longer
   matches what the user had. If there is no existing command, write no file.

   If `.prev` already exists and the current command is *not* ours, the user changed
   their status line since the last install: overwrite it, because the newer one is
   what they expect back.

   **If the current command does mention `msu-statusline`, this is a repair or a
   reinstall: leave `.prev` exactly as it is.** Writing the launcher's own command into
   `.prev` makes the launcher run itself, find `.prev` non-empty, and run itself again —
   unbounded recursion, two processes per level, on every status-line redraw.

   Match on `msu-statusline`, exactly as the removal below does, and not on
   `msu-statusline.sh`: a command pointing straight into the plugin at
   `…/msu-statusline/<version>/scripts/launcher.sh` is this plugin's too, and the
   stricter spelling does not see it. The launcher refuses to replay a `.prev` naming
   itself, so a mismatch here costs the user's own status line rather than the machine —
   but it costs it silently, which is why the two matches have to agree.
3. **Copy the launcher**: `${CLAUDE_PLUGIN_ROOT}/scripts/launcher.sh` →
   `$CONFIG/msu-statusline.sh`, then make it executable.
4. **Point `settings.json` at it.** Set `.statusLine.type` and `.statusLine.command`
   and nothing else — assigning a whole new `statusLine` object would silently drop a
   sibling the user had set, such as `padding`. The two fields, not the block below as a
   template; on a machine with no settings file the block is a fragment, not a document.

   Store the command **literally**, `${CLAUDE_CONFIG_DIR:-...}` and all. It is written
   that way so it resolves when the status line runs; let a shell expand it while you
   build the string and you bake in today's absolute path instead.

   ```json
   "statusLine": {
     "type": "command",
     "command": "bash \"${CLAUDE_CONFIG_DIR:-$HOME/.claude}/msu-statusline.sh\""
   }
   ```

   No `refreshInterval`. Claude Code redraws the line on every session event *and* on
   that timer, so the timer earns nothing at the default ten-minute colour cycle — the
   events are already far more frequent. It is only worth adding for an `ICON_CYCLE`
   short enough that an idle session would visibly freeze the colour, under a minute or
   so, and then it costs a full re-run of this command on every tick, including any
   status line being wrapped.

5. **Create `$CONFIG/msu-statusline.conf` if it is absent** — never overwrite one that
   exists, it is the user's configuration. Ask the script for its contents rather than
   transcribing them from anywhere:

   ```bash
   bash "$CONFIG/msu-statusline.sh" --config > "$CONFIG/msu-statusline.conf.new" \
     && mv "$CONFIG/msu-statusline.conf.new" "$CONFIG/msu-statusline.conf" \
     || rm -f "$CONFIG/msu-statusline.conf.new"
   ```

   Redirecting straight onto the real name would leave an empty conf behind if the
   command failed — and step 5's own "never overwrite one that exists" would then
   protect that empty file from every future install. `--config` fails with a non-zero
   status and nothing on stdout when the plugin cannot be resolved, which is exactly the
   case this guards: no conf is written, and step 6 says what went wrong.

   With no conf to read, that prints exactly the defaults in `KEY=value` form, which is
   the format the file takes. Do not assemble the list by reading the script: the keys
   are named once inside it and every other list — including any in this file — would be
   a second source that goes stale.
6. **Show the real line**, which also proves the whole chain works. Feed it a session
   JSON object rather than `/dev/null`: a wrapped status line usually reads one, and on
   empty input it prints nothing and makes this step look like a failure.

   ```bash
   echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"'"$PWD"'"}}' \
     | bash "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/msu-statusline.sh"
   ```

   Expect the MSU line, and above it the previous status line if step 2 saved one. It
   waits for the board — up to three seconds, and it is the only render that ever does.
   Every render after it reads the cache and returns in a few hundredths of a second,
   and later polls are forked.

   **`⚠ MSU statusline: plugin not found` means the launcher cannot see the plugin.** It
   resolves the newest `$CONFIG/plugins/cache/*/msu-statusline/*/`, which matches nothing
   when the plugin is a checkout rather than an installed copy. Point
   `MSU_STATUSLINE_ROOT` at the plugin directory, or install the plugin properly. Nothing
   at all, not even that warning, means the command in `settings.json` is not reaching
   the launcher.

Then tell the user it takes effect in new sessions, and — if step 2 saved one — that
their previous status line now renders on the line above.

## Remove

Edit `settings.json` as JSON here too, never as text — this path *deletes* a key, which
is the easier one to get wrong.

1. **Check the status line is still ours.** Match `.statusLine.command` against
   `msu-statusline`, not `msu-statusline.sh`: a command pointing straight into the
   plugin at `…/scripts/launcher.sh` is still this plugin's, and a stricter match would
   declare it the user's own and leave it running with no way to remove it.

   If it does **not** match, the user has changed their status line since installing.
   Leave `settings.json` alone and say why, then skip to step 3 — restoring would
   overwrite their newer choice.
2. **Put back what was there.** If `$CONFIG/msu-statusline.prev` holds a command —
   anything other than whitespace — restore it as `.statusLine.command` and delete the
   file. Strip any trailing newline, or the restored command is not the one the user
   had; `jq --arg c "$(cat …)"` does that for free, while `jq --rawfile` keeps the
   newline and quietly produces the wrong string.

   Otherwise — no file, or nothing but whitespace in it — there is nothing to put back.
   Delete `.statusLine.type` and `.statusLine.command`, and `.statusLine.refreshInterval`
   with them — a timer with no command left to re-run does nothing, and
   `msu-statusline-config` is what usually put it there. Then delete `statusLine` itself
   only if nothing else is left inside it. The surgical form for the same reason step 4
   of the install gives: a `padding` the user set is theirs, and deleting the object
   whole takes it with no word said. Delete `.prev` too if it is there — an emptied one
   is a state the troubleshooting below tells users to create, and it would outlive the
   thing that reads it.

   **Say what this costs them.** An emptied `.prev` means the status line they had
   before installing was never recorded, so removal leaves them with none at all rather
   than with the one they started from. That is the right outcome and a surprising one;
   offer to put a command back if they can name it.

   The restored object keeps `"type": "command"`, which is the only type a command
   status line has; if the user's original omitted it, that is the one difference from
   the file as it was.
3. **Delete `$CONFIG/msu-statusline.sh`**, and `$CONFIG/msu-statusline.prev` if it is
   still there — step 2 has usually done that already, but the skip in step 1 has not.
   Delete this copy whether or not it was the one being run: a command pointing into the
   plugin means the launcher here was already an orphan. Delete
   `$CONFIG/msu-statusline.cache` and anything beside it — `.cache.lock`,
   `.cache.attempted`, `.cache.failures` — in the same breath: nothing reads them once
   the launcher is gone, and a reinstall rebuilds all of them on the first render.
4. **Leave `$CONFIG/msu-statusline.conf` alone and say so** — a reinstall keeps the
   user's settings, and it is one line to delete if they want it gone.
5. **Show that it worked**, and that the restored command actually runs. `bash -c`, not
   `sh -c`: the launcher ran it with bash, and on Debian and Ubuntu `/bin/sh` is dash,
   which would fail a command that was working perfectly a minute ago. Feed it a session
   JSON object for the same reason install does — a status line that reads one prints
   nothing without it.

   ```bash
   CONFIG=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
   echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"'"$PWD"'"}}' \
     | bash -c "$(jq -r '.statusLine.command // empty' "$CONFIG/settings.json")"
   ```

   Expect the user's own status line and nothing else.

   **On the delete branch that command proves nothing** — `// empty` reduces it to
   `bash -c ""`, which cannot fail and would print nothing against a file you never
   touched. Ask for the command instead of for the object: a `padding` the user set
   keeps `statusLine` in the file quite legitimately, so its presence answers nothing.

   ```bash
   jq '.statusLine.command' "$CONFIG/settings.json"    # expect null
   ```

   Then tell the user the MSU line stays until they start a new session; that the status
   line being wrapped is now the whole of it again, or that there is none if step 2 took
   the delete branch; and that this unwired the status line rather than uninstalling the
   plugin, which is still there.

## When something looks wrong

A symptom and what it means — a blank line, a stale notice, a red warning, a link that
will not open — is in
[`references/troubleshooting.md`](references/troubleshooting.md). Read it when the
request is a symptom rather than an install or a removal.

Segments and how often the board is polled belong to `msu-statusline-config`.
