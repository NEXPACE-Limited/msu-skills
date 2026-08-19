# Convenience wrappers, not a build system. Skills are still shipped verbatim and need no
# build; the only generated artifact is the landing page, a Next.js app under web/ that
# static-exports to web/out. Every target below is a command you can also type by hand,
# and CI runs those commands directly rather than calling make.

# Derived exactly the way web/next.config.mjs derives basePath — the repository a plugin
# declares, falling back to owner + catalog name. Typing the name here would be a second
# source that can drift from the one the site is actually built against.
REPO := $(shell jq -r '(.plugins[0].repository // (.owner.url + "/" + .name)) | sub("\\.git$$";"") | split("/") | last' .claude-plugin/marketplace.json)

.DEFAULT_GOAL := help
.PHONY: help dev site clean check

help: ## List the targets
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) \
		| awk -F':.*## ' '{ printf "  make %-7s %s\n", $$1, $$2 }'
	@echo
	@echo '  the site lives under /$(REPO)/ — the bare host root is not it'

# There is no `serve` target. MEASURED: `next start` refuses outright under
# `output: 'export'` and points at a third-party static server, and any static server would
# have to re-create the base-path prefix under a second toolchain to serve web/out
# faithfully. `next dev` already serves every page, sitemap.xml and llms.txt at the same
# URLs Pages will, over localhost — a secure context, which the copy buttons need and a
# `file://` open does not provide. What it cannot show is the exported bytes, and
# ci.yml's site-build job asserts those on every pull request.
# No --port. MEASURED: `next dev` with an explicit port dies on EADDRINUSE, while with none
# it takes 3000 and, when something already holds it, says so and moves to the next free
# one. Passing the default explicitly would only turn that recovery into a crash.
dev: ## Run the site locally, with hot reload
	@test -n "$(REPO)" || { echo "could not read the repository name from .claude-plugin/marketplace.json (is jq installed?)" >&2; exit 1; }
	@echo "→ http://localhost:3000/$(REPO)/   (Next reports the port it actually took)"
	npm --prefix web run dev

site: ## Export the site into web/out, the way CI and the deploy do
	npm --prefix web run build

# A literal rm. The old guarded clean existed because the output directory was an argument
# that could name someone else's files; next build writes one fixed path inside web/.
clean: ## Delete the export and the Next build cache
	rm -rf web/out web/.next

check: ## Run the commands CI runs (CI adds a guards job on top)
	claude plugin validate .
	@for dir in plugins/*/; do \
		[ -f "$$dir/.claude-plugin/plugin.json" ] || continue; \
		echo "── $${dir%/}"; \
		claude plugin validate "$$dir" || exit 1; \
	done
	npx --yes skills add . -l
	@probe=$$(mktemp -d) && bash install.sh --target "$$probe" && rm -rf "$$probe"
	@for dir in plugins/*/; do \
		plugin="$$(basename "$$dir")"; \
		probe=$$(mktemp -d); \
		bash install.sh --plugin "$$plugin" --target "$$probe" || exit 1; \
		rm -rf "$$probe"; \
	done
	bash scripts/test-remote-installer.sh
	bash scripts/check-endpoints.sh
	npm --prefix web ci --ignore-scripts
	npm --prefix web run build
