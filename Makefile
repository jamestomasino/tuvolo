SRC_DIR ?= web
DST_DIR ?= web/public

# Static files
SRC_STATIC_FILES != find $(SRC_DIR)/static/ -type f
DST_STATIC_FILES := $(SRC_STATIC_FILES:$(SRC_DIR)/static/%=$(DST_DIR)/%)

copy = cp $< $@
mkdir = @mkdir -p $(dir $@)

help:
	@echo "targets:"
	@awk -F '#' '/^[a-zA-Z0-9_-]+:.*?#/ { print $0 }' $(MAKEFILE_LIST) \
	| sed -n 's/^\(.*\): \(.*\)#\(.*\)/  \1|-\3/p' \
	| column -t  -s '|'

web: web/node_modules ## Launch web view of files
	@node ./web/index.js

render: web/node_modules $(DST_STATIC_FILES) ## Launch web view of files
	@node ./web/render.js

$(DST_DIR)/%: $(SRC_DIR)/static/%
	$(mkdir)
	$(copy)

wc: ## total wordcount for repository
	@find . -not -path "./web/*" -not -path "./.git/*" -not -path "./.*" -type f -exec cat {} + | wc -w

wc_book: ## total wordcount for book itself
	@find ./book -type f -exec cat {} + | wc -w

wc_notes: ## total wordcount for notes
	@find ./notes -type f -exec cat {} + | wc -w

web/node_modules: web/package.json
	cd web; npm i

.PHONY: help wc wc_book wc_notes web
