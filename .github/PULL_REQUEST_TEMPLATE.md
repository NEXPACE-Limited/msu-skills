<!-- Maintainer rules live in AGENTS.md; this checklist is the PR-time subset. -->

## Summary

<!-- What changed and why. One or two sentences is enough. -->

## Change type

- [ ] Skill content (`plugins/<plugin>/skills/<name>/`)
- [ ] New skill
- [ ] New plugin (`plugins/<plugin>/` + a catalog entry + a README row)
- [ ] Packaging (`.claude-plugin/`, `plugins/*/.mcp.json`, `install.sh`)
- [ ] Docs / meta only

## Checklist

- [ ] `version` bumped in **each changed plugin's** `plugins/<plugin>/.claude-plugin/plugin.json` — that string is the only signal that tells installed users to update
- [ ] Local checks pass: `claude plugin validate .` · `claude plugin validate plugins/<plugin>` · `bash install.sh --target /tmp/probe` · `npx skills add . -l` · `bash scripts/check-endpoints.sh`
- [ ] A skill needing a credential sits in the plugin that declares it; no plugin acquires a credential it does not use
- [ ] No unreleased product names, no credentials — this repository is world-readable
- [ ] No skill renamed or removed. If one was, this PR is breaking: bump the minor version (0.x rule) and name the affected skills in the summary
- [ ] New or changed frontmatter follows AGENTS.md naming and description rules

## Consumer impact

<!-- Downstream plugins call these skills by name and pin `msu ~0.<minor>` against the
     `msu-skills` catalog. A renamed skill, a changed contract surface, or a renamed
     catalog breaks them silently. Merging to `main` is the release — there is no
     second step. -->

- [ ] Nothing consumer-visible changed
- [ ] Breaking for consumers — named in the summary, minor version bumped
