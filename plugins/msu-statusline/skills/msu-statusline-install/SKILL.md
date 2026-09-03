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

`settings.json` points at the copy rather than into the plugin because the plugin
cache is versioned — a path into it would break on the next `claude plugin update`.
The launcher resolves the newest installed version itself.

## Install

1. **Read `$CONFIG/settings.json`.** Create `$CONFIG` first if it is not there. Edit
   the file as JSON, never as text: it holds the user's permissions and hooks, and a bad
   patch costs them more than this feature. Parsing and re-serialising reflows the
   file — every value survives, the formatting may not, and that is fine.
2. **Preserve an existing status line.** If `.statusLine.command` is set and does
   **not** already mention `msu-statusline.sh`, write it to `$CONFIG/msu-statusline.prev`
   — the decoded value of that JSON string, the shell command itself, because the
   launcher runs it with `bash -c`. Write no trailing newline: removal puts this file
   straight back into a JSON string, and a stray `\n` there is a command that no longer
   matches what the user had. If there is no existing command, write no file.

   **If it does mention `msu-statusline.sh`, this is a repair or a reinstall: leave
   `.prev` exactly as it is.** Writing the launcher's own command into `.prev` makes the
   launcher run itself, find `.prev` non-empty, and run itself again — unbounded
   recursion, two processes per level, on every status-line redraw. This guard is the
   only thing standing between a reinstall and a fork bomb.
3. **Copy the launcher**: `${CLAUDE_PLUGIN_ROOT}/scripts/launcher.sh` →
   `$CONFIG/msu-statusline.sh`, then make it executable.
4. **Point `settings.json` at it.** Set `.statusLine.type` and `.statusLine.command`
   and nothing else — assigning a whole new `statusLine` object would silently drop a
   sibling the user had set, such as `padding`:

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

5. **Create `$CONFIG/msu-statusline.conf` if it is absent.** Its format is `KEY=value`,
   one per line, unquoted, no comments needed. The keys and their values are the block
   of `${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh` between `# Defaults` and
   `# End defaults`; the `case` in the conf loop just below it is the authority on which
   of them take effect, so cross-check against that and copy no key it does not accept.
   Never overwrite a conf that exists — it is the user's configuration.
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

1. **Check the status line is still ours.** If `.statusLine.command` does not mention
   `msu-statusline.sh`, the user has changed it since installing; leave `settings.json`
   alone entirely and go to step 3, or restoring would overwrite their newer choice.
2. **Put back what was there.** If `$CONFIG/msu-statusline.prev` is non-empty, restore
   its contents — with any trailing newline stripped, or the restored command will not
   be the one the user had — as `.statusLine.command`, and delete the file. Otherwise
   delete the `statusLine` key entirely so Claude Code goes back to its own footer, and
   delete `.prev` too if it is there: an emptied one is a state the troubleshooting
   below tells users to create, and it would outlive the thing that reads it.

   The restored object keeps `"type": "command"`, which is the only type a command
   status line has; if the user's original omitted it, that is the one difference from
   the file as it was.
3. **Delete `$CONFIG/msu-statusline.sh`.** The launcher's own leftovers,
   `${TMPDIR:-/tmp}/msu-statusline-root` and `${TMPDIR:-/tmp}/msu-statusline-notice`,
   can stay — nothing reads them once the launcher is gone, and both are rebuilt on a
   reinstall.
4. **Leave `$CONFIG/msu-statusline.conf` alone and say so** — a reinstall keeps the
   user's settings, and it is one line to delete if they want it gone.
5. **Show that it worked**, and that the restored command actually runs:

   ```bash
   sh -c "$(jq -r '.statusLine.command // empty' "$CONFIG/settings.json")"
   ```

   Then tell the user the MSU line stays until they start a new session.

## When something looks wrong

- **`⚠ board unreachable`.** Polling has been failing for hours and has backed off to
  the polling interval. Usually a network the machine has not had; it clears itself on
  the next successful poll. `curl -sS -o /dev/null -w '%{http_code}\n'
  https://msu.io/builder/notices` says whether the board answers at all.
- **`⚠ notice format changed`.** The board answered and the parser could not read it,
  for hours. This one does not clear itself: the page's shape moved and the plugin has
  to be taught the new one. It is worth reporting — the notice shown, if any, is frozen
  at whatever last parsed. Confirm with
  `bash "${CLAUDE_PLUGIN_ROOT}/tests/test.sh"`, which runs the parser against a captured
  copy of the page: passing there and failing live is exactly this.
- **Blank line, no warning at all.** The MSU line has nothing to say and nothing to
  complain about: the cache is cold and the first fetch has not landed. Run step 6 once,
  which fetches in the foreground. If step 6 itself prints nothing, the launcher is not
  being reached — check that `settings.json` names it and that the file is executable.
- **`⚠ MSU statusline: plugin not found`.** The launcher resolves the newest
  `$CONFIG/plugins/cache/*/msu-statusline/*/` and memoises the answer in
  `${TMPDIR:-/tmp}/msu-statusline-root`, re-resolving whenever what it points at is
  gone. This warning means the glob matched nothing — the plugin is not installed, or it
  is a checkout. Reinstall it, or set `MSU_STATUSLINE_ROOT` to a plugin directory, which
  wins over both. A status line being wrapped still renders; only the MSU line is lost.
- **Title not clickable.** OSC 8 hyperlinks need a terminal that supports them
  (iTerm2, Kitty, WezTerm, Ghostty). Elsewhere the title still reads normally.
- **A second status line appeared instead of one.** That is `.prev` working as
  intended. To drop the old one, empty `$CONFIG/msu-statusline.prev`.

Segments and how often the board is polled belong to `msu-statusline-config`.
