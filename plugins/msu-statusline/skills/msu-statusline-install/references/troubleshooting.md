# When something looks wrong

Each symptom below is what the user actually sees. `CONFIG` is
`${CLAUDE_CONFIG_DIR:-$HOME/.claude}`, and "step 6" is the install's last step, the one
that renders the line in the foreground. The install and removal paths are in the skill
body; nothing here changes `settings.json`.

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
  which fetches in the foreground. If step 6 itself prints nothing at all, the launcher
  is not being reached — check that `.statusLine.command` names it.
- **A wrapped status line renders, and the MSU line is simply not there.** The launcher
  is running and the segment produced nothing, which is the same cold-cache case above
  seen from a session that already had a status line — it looks like the install did
  nothing at all. Run step 6.
- **`⚠ MSU statusline: plugin not found`.** The launcher walks
  `$CONFIG/plugins/cache/*/msu-statusline/*/` on every render and takes the most recently
  installed one — nothing is cached, so an update is picked up on the next redraw. This
  warning means nothing was found: the plugin is not installed, it is a checkout, or
  `MSU_STATUSLINE_ROOT` is set and points at a directory with no
  `scripts/statusline.sh` in it. That variable wins outright and is never fallen back
  from, so a typo in it produces this warning rather than a working line from somewhere
  else. A status line being wrapped still renders; only the MSU line is lost.
- **Title not clickable.** OSC 8 hyperlinks need a terminal that supports them
  (iTerm2, Kitty, WezTerm, Ghostty). Elsewhere the title still reads normally.
- **A second status line appeared instead of one.** That is `.prev` working as
  intended. To drop the old one, empty `$CONFIG/msu-statusline.prev`.
- **The status line they had before the install stopped rendering.** Read
  `$CONFIG/msu-statusline.prev`. If it names `msu-statusline`, the launcher is refusing
  to replay it on purpose — replaying a command that runs the launcher would recurse
  without bound — and whatever was there was overwritten by an install that mis-read its
  own command as the user's. The file cannot be recovered; put the command back by hand
  if they can name it, and the launcher replays it again from the next redraw.
