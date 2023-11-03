TARGET:= $(shell rustc -vV | sed -n 's|host: ||p')
COMMON_OPTIONS := -Z unstable-options --target ${TARGET}
RELEASE_OPTIONS := -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort

.PHONY: all lib wasm test clean lib-release-with-copy lib-release-no-copy lib-debug-with-copy lib-debug-no-copy wasm-release-with-copy wasm-release-no-copy wasm-debug-with-copy wasm-debug-no-copy

all: lib wasm

lib: lib-release-with-copy lib-release-no-copy lib-debug-with-copy lib-debug-no-copy

wasm: wasm-release-with-copy wasm-release-no-copy wasm-debug-with-copy wasm-debug-no-copy

test:
	cargo test
	cargo test --features no-copy
	
clean: 
	rm -rf dist target

lib-release-with-copy: target/dist/release/with-copy/libmilo.a
	rm -rf dist/release/with-copy && mkdir -p dist/release/with-copy
	cp target/dist/release/with-copy/libmilo.a dist/release/with-copy/libmilo.a
	cbindgen --config cbindgen/with-copy.toml --profile release --output dist/release/with-copy/milo.h --clean
	node ./tools/export_version.mjs release/with-copy

lib-release-no-copy: target/dist/release/no-copy/libmilo.a
	rm -rf dist/release/no-copy && mkdir -p dist/release/no-copy
	cp target/dist/release/no-copy/libmilo.a dist/release/no-copy/libmilo.a
	cbindgen --config cbindgen/no-copy.toml --profile release --output dist/release/no-copy/milo.h --clean
	node ./tools/export_version.mjs release/no-copy

lib-debug-with-copy: target/dist/debug/with-copy/libmilo.a
	rm -rf dist/debug/with-copy && mkdir -p dist/debug/with-copy
	cp target/dist/debug/with-copy/libmilo.a dist/debug/with-copy/libmilo.a
	cbindgen --config cbindgen/with-copy.toml --output dist/debug/with-copy/milo.h --clean
	node ./tools/export_version.mjs	debug/with-copy

lib-debug-no-copy: target/dist/debug/no-copy/libmilo.a
	rm -rf dist/debug/no-copy && mkdir -p dist/debug/no-copy
	cp target/dist/debug/no-copy/libmilo.a dist/debug/no-copy/libmilo.a
	cbindgen --config cbindgen/no-copy.toml --output dist/debug/no-copy/milo.h --clean
	node ./tools/export_version.mjs	debug/no-copy


wasm-release-with-copy: target/dist/wasm/release/with-copy/milo_bg.wasm
	rm -rf dist/wasm/release/with-copy && mkdir -p dist/wasm/release
	cp -a target/dist/wasm/release/with-copy dist/wasm/release/with-copy
	node ./tools/export_wasm_constants.mjs release/with-copy
	rm -rf dist/wasm/release/with-copy/.gitignore dist/wasm/release/with-copy/README.md

wasm-release-no-copy: target/dist/wasm/release/no-copy/milo_bg.wasm
	rm -rf dist/wasm/release/no-copy && mkdir -p dist/wasm/release
	cp -a target/dist/wasm/release/no-copy dist/wasm/release/no-copy
	node ./tools/export_wasm_constants.mjs release/no-copy
	rm -rf dist/wasm/release/no-copy/.gitignore dist/wasm/release/no-copy/README.md

wasm-debug-with-copy: target/dist/wasm/debug/with-copy/milo_bg.wasm
	rm -rf dist/wasm/debug/with-copy && mkdir -p dist/wasm/debug
	cp -a target/dist/wasm/debug/with-copy dist/wasm/debug/with-copy
	node ./tools/export_wasm_constants.mjs debug/with-copy
	rm -rf dist/wasm/debug/with-copy/.gitignore dist/wasm/debug/with-copy/README.md

wasm-debug-no-copy: target/dist/wasm/debug/no-copy/milo_bg.wasm
	rm -rf dist/wasm/debug/no-copy && mkdir -p dist/wasm/debug
	cp -a target/dist/wasm/debug/no-copy dist/wasm/debug/no-copy
	node ./tools/export_wasm_constants.mjs debug/no-copy
	rm -rf dist/wasm/debug/no-copy/.gitignore dist/wasm/debug/no-copy/README.md


target/dist/release/with-copy/libmilo.a: src/lib.rs
	cargo build ${COMMON_OPTIONS} ${RELEASE_OPTIONS} --out-dir target/dist/release/with-copy --release 

target/dist/release/no-copy/libmilo.a: src/lib.rs
	cargo build ${COMMON_OPTIONS} ${RELEASE_OPTIONS} --out-dir target/dist/release/no-copy --release --features no-copy

target/dist/debug/with-copy/libmilo.a: src/lib.rs	
	cargo build ${COMMON_OPTIONS} --out-dir target/dist/debug/with-copy

target/dist/debug/no-copy/libmilo.a: src/lib.rs	
	cargo build ${COMMON_OPTIONS} --out-dir target/dist/debug/no-copy --features no-copy


target/dist/wasm/release/with-copy/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm/release/with-copy -t nodejs

target/dist/wasm/release/no-copy/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm/release/no-copy -t nodejs --features no-copy

target/dist/wasm/debug/with-copy/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm/debug/with-copy -t nodejs --debug

target/dist/wasm/debug/no-copy/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm/debug/no-copy -t nodejs --debug --features no-copy
