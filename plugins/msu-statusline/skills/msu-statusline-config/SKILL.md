---
name: msu-statusline-config
description: "Claude Code only — a status line is a Claude Code concept and this skill does nothing on another CLI. Reads and changes what the MSU status line shows. Use when the user wants to turn a status-line segment on or off, change how often the MSU notice board is polled, shorten or lengthen the displayed title, rename the label, or asks what their MSU status line is currently set to. Editing the settings file by hand is the same operation and belongs here too."
---

# msu-statusline-config

One file holds every setting: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/msu-statusline.conf`,
written as `KEY=value`, one per line, `#` starting a comment.

The status line reads that file as data — it parses the keys it knows and ignores
everything else, rather than executing it. So an unknown key is inert, not an error,
and a value never needs shell quoting.

## The keys

**Ask the script, never this file and never memory.**

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh" --config
```

That prints every key with the value **in force** — after the conf file has been read
and every value checked. No list of keys is written down here on purpose: one would be
a second source, and it would be a version behind the moment a segment is added.

The distinction between what is written and what is in force is the whole reason to ask
the script. A value the parser cannot use is replaced silently, and the render looks
perfectly healthy afterwards: `ICON_CYCLE=5m` becomes `0`, which pins the icon to one
colour for ever; `TIME=KST` becomes `local`; `COLOR=orange` becomes `none`;
`MAX_WIDTH=80px` becomes `72`. Reading the conf file would report the user's typo back
to them as if it had taken effect. `--config` reports what actually did.

## Changing something

1. Run `--config` for what is in force, and read the conf file for what was written.
   A key absent from the file is at its default; that is not a problem to fix. Where the
   two disagree, the file holds a value the script rejected — worth telling the user
   about, whether or not it is what they asked you to change.
2. Show them what is set now, and apply what they asked for. A key `--config` does not
   list cannot be set; say so and name the ones that can, rather than writing a line
   that will be ignored.
3. Write the file back, keeping the user's own comments and key order, appending
   anything new. Values are plain: `NOTICE=off`, not `NOTICE="off"`.
4. Confirm twice, because the two answer different questions:

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh" --config   # did the value take?
   bash "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/msu-statusline.sh"  # what does it look like?
   ```

   The second renders the whole status line, so its first rows may be a status line that
   was already configured before this one was installed — that is the launcher replaying
   it, not this plugin. With a cold cache it also blocks for up to three seconds on a
   live fetch.

   **A render that looks unchanged is not a failed edit.** `MAX_WIDTH` only shows when a
   title is longer than it, so lowering 72 to 48 changes nothing until a longer notice
   arrives. Say that rather than lowering the number until something moves.

**`ICON_CYCLE` is the one key that can reach outside the conf file.** The colour is
computed from the clock at each redraw, and Claude Code redraws on every session event,
so at the default ten minutes nothing else is needed. Shorten it below a minute or so
and an idle session will visibly hold one colour; only then add
`statusLine.refreshInterval` to `settings.json`, set to the same number — and say what
it costs, because each tick re-runs the whole command, wrapped status line included.

Changes apply to the next render — there is nothing to restart and no cache to clear.
A shorter polling interval takes effect immediately, because the interval is measured
against the cache file's age each time the status line runs.

## Worth telling the user

- **"The icon colour is not cycling" is usually not a cycling problem.** Check these
  two before touching `ICON_CYCLE`, because both freeze the colour while looking fine:
  `--config` reporting `ICON_CYCLE=0` (something non-numeric was written, and `0` means
  hold the first colour), and `ICON_TRUECOLOR=auto` on a terminal that advertises
  neither `COLORTERM=truecolor` nor a `*-direct` `TERM` — Terminal.app and a default
  tmux both do this, the icon falls back to the label's colour, and `ICON_TRUECOLOR=on`
  is the answer. Otherwise the cycle is simply ten minutes long and nothing is wrong.
- **`MAX_WIDTH` counts the title, not the line.** The timestamp, the icon and the label
  sit outside it, so the row is around twenty columns wider than the number. It also
  does nothing at all outside a UTF-8 locale, where slicing would cut a multi-byte
  character in half and the script would rather leave the line long.
- **The warning is not configurable, on purpose.** Once polling has backed off all the
  way to the polling interval the line says so, in red, and says which kind of failure
  it was. A silent failure is the one thing this plugin cannot afford: the line would go
  on showing an old notice, or nothing, and look exactly like a quiet week. There is no
  key to switch that off — turn the segment off with `NOTICE=off` if it is unwanted.
- **The time is the reader's own, and the board's is not.** VERIFIED in the site's own
  code: its notice list is formatted with dayjs `.utc()`. So a reader outside UTC sees
  one time here and another on the page this line links to, for the same post. Say so
  if they ask why the two disagree; `TIME=utc` makes them agree.
- **Turning every segment off leaves an empty line, not a removed status line.** If
  they want it gone, that is `msu-statusline-install`'s remove path.
- **Polling less often is free; polling more often is not.** A poll is one request to
  the public notice board. It is forked, so no render waits for it — the cost is on the
  board, not on the reader. Notices are posted on the order of days; anything under an
  hour buys nothing.

Installing, removing, and repairing belong to `msu-statusline-install`.
