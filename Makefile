MAIN = static/lighting.js

SOURCEDIR = src
SOURCES = $(shell find $(SOURCEDIR) -name '*.js')

.PHONY: all clean build

all: $(MAIN) Makefile

clean: 
	rm $(MAIN)

build: $(MAIN)

$(MAIN): $(SOURCES)
	npm run build

watch: 
	npm run watch

run:
	bundle exec jekyll serve  --host 0.0.0.0

docs:
	echo "Implement me!"
