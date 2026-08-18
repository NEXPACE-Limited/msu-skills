# Convenience wrappers, not a build system. Skills are still shipped verbatim and need no
# build; the only generated artifact is the landing page. Every target below is a command
# you can also type by hand, and CI runs those commands directly rather than calling make.

PORT ?= 8731
OUT  ?= _site

BROWSER := $(shell command -v open 2>/dev/null || command -v xdg-open 2>/dev/null)

.DEFAULT_GOAL := help
.PHONY: help site serve open clean check

help: ## List the targets
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) \
		| awk -F':.*## ' '{ printf "  make %-8s %s\n", $$1, $$2 }'
	@echo
	@echo '  OUT=$(OUT)  PORT=$(PORT)   — override either: make serve PORT=3000'

site: ## Render the landing page
	node scripts/build-site.mjs "$(OUT)"

serve: site ## Render it, then serve it over http
	@echo "→ http://localhost:$(PORT)   (Ctrl+C to stop)"
	python3 -m http.server "$(PORT)" -d "$(OUT)"

open: site ## Render it, then open it in a browser
	@test -n "$(BROWSER)" || { echo "no open/xdg-open on PATH; use make serve" >&2; exit 1; }
	$(BROWSER) "$(OUT)/index.html"

clean: ## Delete the rendered page
	node scripts/build-site.mjs --clean "$(OUT)"

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
	@probe=$$(mktemp -d) && node scripts/build-site.mjs "$$probe" && rm -rf "$$probe"
