
SHELL := /bin/bash
PATH  := ./node_modules/.bin:$(PATH)

SRC_FILES := $(shell find src -name '*.ts')

all: lib bundle docs

lib: $(SRC_FILES) node_modules
	tsc -p tsconfig.json --outDir lib && \
	VERSION="$$(node -p 'require("./package.json").version')"; \
	echo "module.exports = '$${VERSION}';" > lib/version.js
	touch lib

dist/%.js: lib
	browserify $(filter-out $<,$^) --debug --full-paths \
		--standalone eznode.js --plugin tsify \
		--transform [ babelify --extensions .ts ] \
		| derequire > $@
	uglifyjs $@ \
		--source-map "content=inline,url=$(notdir $@).map,filename=$@.map" \
		--compress "dead_code,collapse_vars,reduce_vars,keep_infinity,drop_console,passes=2" \
		--output $@ || rm $@

dist/eznode.js: src/index-browser.ts

dist/eznode.js.d.ts: $(SRC_FILES) node_modules
	dts-generator --name eznode.js --project . --out dist/eznode.js.d.ts
	sed -e "s@'eznode.js/index'@'eznode.js'@g" -i '' dist/eznode.js.d.ts

dist/%.gz: dist/eznode.js
	gzip -9 -f -c $(basename $@) > $(basename $@).gz

bundle: dist/eznode.js.gz dist/eznode.js.d.ts

.PHONY: coverage
coverage: node_modules
	nyc -r html -r text -e .ts -i ts-node/register mocha --exit --reporter nyan --require ts-node/register test/*.ts

.PHONY: test
test: node_modules
	mocha --exit --require ts-node/register test/*.ts --grep '$(grep)'

.PHONY: ci-test
ci-test: node_modules
	tslint -p tsconfig.json -c tslint.json
	nyc -r lcov -e .ts -i ts-node/register mocha --exit --reporter tap --require ts-node/register test/*.ts

.PHONY: browser-test
browser-test: dist/eznode.js
	BUILD_NUMBER="$$(git rev-parse --short HEAD)-$$(date +%s)" \
		karma start test/_karma-sauce.js

.PHONY: browser-test-local
browser-test-local: dist/eznode.js
	karma start test/_karma.js

.PHONY: lint
lint: node_modules
	tslint -p tsconfig.json -c tslint.json -t stylish --fix

node_modules:
	yarn install --non-interactive --frozen-lockfile

docs: $(SRC_FILES) node_modules
	typedoc --gitRevision master --target ES6 --mode file --out docs src
	find docs -name "*.html" | xargs sed -i '' 's~$(shell pwd)~.~g'
	echo "Served at <https://jnordberg.github.io/eznode.js/>" > docs/README.md
	touch docs

.PHONY: clean
clean:
	rm -rf lib/
	rm -f dist/*
	rm -rf docs/

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
