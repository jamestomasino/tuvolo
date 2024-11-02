help:
	@echo "targets:"
	@awk -F '#' '/^[a-zA-Z0-9_-]+:.*?#/ { print $0 }' $(MAKEFILE_LIST) \
	| sed -n 's/^\(.*\): \(.*\)#\(.*\)/  \1|-\3/p' \
	| column -t  -s '|'

web: ## Launch web view of files
	@node ./web/index.js

wc: ## total wordcount for repository
	@find . -not -path "./web/*" -not -path "./.git/*" -not -path "./.*" -type f -exec cat {} + | wc -w

wc_book: ## total wordcount for book itself
	@find ./book -type f -exec cat {} + | wc -w

wc_notes: ## total wordcount for notes
	@find ./notes -type f -exec cat {} + | wc -w

.PHONY: help wc wc_book wc_notes web
