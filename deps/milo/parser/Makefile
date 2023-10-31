TARGET:= $(shell rustc -vV | sed -n 's|host: ||p')
COMMON_OPTIONS := -Z unstable-options --target ${TARGET}
RELEASE_OPTIONS := -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort

.PHONY: clean all release debug wasm lib-release lib-debug wasm-release wasm-debug

clean: 
	rm -rf dist target

all: release debug wasm

release: lib-release wasm-release

debug: lib-debug wasm-debug

wasm: wasm-release wasm-debug

lib-release: target/dist/release/libmilo.a
	rm -rf dist/release && mkdir -p dist/release
	cp target/dist/release/libmilo.a dist/release/libmilo.a
	cbindgen --config cbindgen.toml --output dist/release/milo.h --clean
	node ./tools/export_version.mjs release

lib-debug: target/dist/debug/libmilo.a
	rm -rf dist/debug && mkdir -p dist/debug
	cp target/dist/debug/libmilo.a dist/debug/libmilo.a
	cbindgen --config cbindgen.toml --output dist/debug/milo.h --clean
	node ./tools/export_version.mjs	debug

wasm-release: target/dist/wasm32-release/milo_bg.wasm
	rm -rf dist/wasm/release && mkdir -p dist/wasm
	cp -a target/dist/wasm32-release dist/wasm/release
	node ./tools/export_wasm_constants.mjs release
	
wasm-debug: target/dist/wasm32-debug/milo_bg.wasm
	rm -rf dist/wasm/debug && mkdir -p dist/wasm
	cp -a target/dist/wasm32-debug dist/wasm/debug
	node ./tools/export_wasm_constants.mjs debug

target/dist/release/libmilo.a: src/lib.rs
	cargo build ${COMMON_OPTIONS} ${RELEASE_OPTIONS} --out-dir target/dist/release --release 

target/dist/debug/libmilo.a: src/lib.rs	
	cargo build ${COMMON_OPTIONS} --out-dir target/dist/debug

target/dist/wasm32-release/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm32-release -t nodejs

target/dist/wasm32-debug/milo_bg.wasm: src/lib.rs
	wasm-pack build -d target/dist/wasm32-debug -t nodejs --debug

