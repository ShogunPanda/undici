let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextEncoder, TextDecoder } = require(`util`);

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_3(addHeapObject(e));
    }
}
/**
*/
class Parser {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Parser.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_parser_free(ptr);
    }
    /**
    * @returns {Parser}
    */
    static new() {
        const ret = wasm.parser_new();
        return Parser.__wrap(ret);
    }
    /**
    * Resets a parser. The second parameters specifies if to also reset the
    * position counter.
    * @param {boolean} keep_position
    */
    reset(keep_position) {
        wasm.parser_reset(this.__wbg_ptr, keep_position);
    }
    /**
    * Clears all values in the parser.
    *
    * Persisted fields, unconsumed data and the position are not cleared.
    */
    clear() {
        wasm.parser_clear(this.__wbg_ptr);
    }
    /**
    * Pauses the parser. It will have to be resumed via `milo_resume`.
    */
    pause() {
        wasm.parser_pause(this.__wbg_ptr);
    }
    /**
    * Resumes the parser.
    */
    resume() {
        wasm.parser_resume(this.__wbg_ptr);
    }
    /**
    * Marks the parser as finished. Any new data received via `parse` will
    * put the parser in the error state.
    */
    finish() {
        wasm.parser_finish(this.__wbg_ptr);
    }
    /**
    * Returns the current parser's state as string.
    * @returns {string}
    */
    get stateString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_stateString(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_2(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Returns the current parser's error state as string.
    * @returns {string}
    */
    get errorCodeString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_errorCodeString(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_2(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Returns the current parser's error descrition.
    * @returns {string}
    */
    get errorDescription() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_errorDescription(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_2(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Creates a new parser.
    * @param {number | undefined} id
    */
    constructor(id) {
        const ret = wasm.parser_new_with_id(isLikeNone(id) ? 0xFFFFFF : id);
        return Parser.__wrap(ret);
    }
    /**
    * @param {Uint8Array} data
    * @param {number} limit
    * @returns {number}
    */
    parse(data, limit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export_0);
            const len0 = WASM_VECTOR_LEN;
            wasm.parser_parse(retptr, this.__wbg_ptr, ptr0, len0, limit);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {number}
    */
    get state() {
        const ret = wasm.parser_state(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {bigint}
    */
    get position() {
        const ret = wasm.parser_position(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {boolean}
    */
    get paused() {
        const ret = wasm.parser_paused(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {number}
    */
    get errorCode() {
        const ret = wasm.parser_errorCode(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get id() {
        const ret = wasm.parser_get_id(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {number} value
    */
    set id(value) {
        wasm.parser_set_id(this.__wbg_ptr, value);
    }
    /**
    * @returns {number}
    */
    get mode() {
        const ret = wasm.parser_get_mode(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {number} value
    */
    set mode(value) {
        wasm.parser_set_mode(this.__wbg_ptr, value);
    }
    /**
    * @returns {boolean}
    */
    get continueWithoutData() {
        const ret = wasm.parser_continueWithoutData(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {number}
    */
    get messageType() {
        const ret = wasm.parser_messageType(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {boolean}
    */
    get isConnect() {
        const ret = wasm.parser_get_is_connect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @param {boolean} value
    */
    set isConnect(value) {
        wasm.parser_set_is_connect(this.__wbg_ptr, value);
    }
    /**
    * @returns {number}
    */
    get method() {
        const ret = wasm.parser_method(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get status() {
        const ret = wasm.parser_status(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get versionMajor() {
        const ret = wasm.parser_versionMajor(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get versionMinor() {
        const ret = wasm.parser_versionMinor(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get connection() {
        const ret = wasm.parser_connection(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {boolean}
    */
    get hasContentLength() {
        const ret = wasm.parser_hasContentLength(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {boolean}
    */
    get hasChunkedTransferEncoding() {
        const ret = wasm.parser_hasChunkedTransferEncoding(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {boolean}
    */
    get hasUpgrade() {
        const ret = wasm.parser_hasUpgrade(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {boolean}
    */
    get hasTrailers() {
        const ret = wasm.parser_hasTrailers(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {bigint}
    */
    get contentLength() {
        const ret = wasm.parser_contentLength(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {bigint}
    */
    get chunkSize() {
        const ret = wasm.parser_chunkSize(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {bigint}
    */
    get remainingContentLength() {
        const ret = wasm.parser_remainingContentLength(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {bigint}
    */
    get remainingChunkSize() {
        const ret = wasm.parser_remainingChunkSize(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {number}
    */
    get unconsumed() {
        const ret = wasm.parser_unconsumed(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {boolean}
    */
    get skipBody() {
        const ret = wasm.parser_get_skip_body(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @param {boolean} value
    */
    set skipBody(value) {
        wasm.parser_set_skip_body(this.__wbg_ptr, value);
    }
    /**
    * @param {Function} cb
    */
    setBeforeStateChange(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setBeforeStateChange(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setAfterStateChange(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setAfterStateChange(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnError(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnError(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnFinish(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnFinish(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnMessageStart(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnMessageStart(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnMessageComplete(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnMessageComplete(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnRequest(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnRequest(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnResponse(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnResponse(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnReset(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnReset(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnMethod(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnMethod(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnUrl(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnUrl(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnProtocol(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnProtocol(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnVersion(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnVersion(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnStatus(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnStatus(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnReason(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnReason(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnHeaderName(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnHeaderName(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnHeaderValue(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnHeaderValue(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnHeaders(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnHeaders(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnConnect(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnConnect(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnUpgrade(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnUpgrade(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnChunkLength(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnChunkLength(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnChunkExtensionName(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnChunkExtensionName(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnChunkExtensionValue(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnChunkExtensionValue(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnBody(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnBody(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnData(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnData(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnTrailerName(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnTrailerName(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnTrailerValue(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnTrailerValue(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Function} cb
    */
    setOnTrailers(cb) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.parser_setOnTrailers(retptr, this.__wbg_ptr, addHeapObject(cb));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
module.exports.Parser = Parser;

module.exports.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

module.exports.__wbindgen_number_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

module.exports.__wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

module.exports.__wbindgen_number_new = function(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

module.exports.__wbindgen_object_clone_ref = function(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

module.exports.__wbindgen_is_falsy = function(arg0) {
    const ret = !getObject(arg0);
    return ret;
};

module.exports.__wbindgen_is_function = function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

module.exports.__wbg_newnoargs_581967eacc0e2604 = function(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

module.exports.__wbg_call_cb65541d95d71282 = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

module.exports.__wbg_new_d258248ed531ff54 = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

module.exports.__wbg_call_4c92f6aec1e1d6e6 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3));
    return addHeapObject(ret);
}, arguments) };

module.exports.__wbg_buffer_085ec1f694018c4f = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

module.exports.__wbg_newwithbyteoffsetandlength_6da8e527659b86aa = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

module.exports.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

const path = require('path').join(__dirname, 'milo_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

module.exports.AUTODETECT = 0;
module.exports.REQUEST = 1;
module.exports.RESPONSE = 2;
module.exports.CONNECTION_KEEPALIVE = 0;
module.exports.CONNECTION_CLOSE = 1;
module.exports.CONNECTION_UPGRADE = 2;
module.exports.METHOD_ACL = 0;
module.exports.METHOD_BASELINE_CONTROL = 1;
module.exports.METHOD_BIND = 2;
module.exports.METHOD_CHECKIN = 3;
module.exports.METHOD_CHECKOUT = 4;
module.exports.METHOD_CONNECT = 5;
module.exports.METHOD_COPY = 6;
module.exports.METHOD_DELETE = 7;
module.exports.METHOD_GET = 8;
module.exports.METHOD_HEAD = 9;
module.exports.METHOD_LABEL = 10;
module.exports.METHOD_LINK = 11;
module.exports.METHOD_LOCK = 12;
module.exports.METHOD_MERGE = 13;
module.exports.METHOD_MKACTIVITY = 14;
module.exports.METHOD_MKCALENDAR = 15;
module.exports.METHOD_MKCOL = 16;
module.exports.METHOD_MKREDIRECTREF = 17;
module.exports.METHOD_MKWORKSPACE = 18;
module.exports.METHOD_MOVE = 19;
module.exports.METHOD_OPTIONS = 20;
module.exports.METHOD_ORDERPATCH = 21;
module.exports.METHOD_PATCH = 22;
module.exports.METHOD_POST = 23;
module.exports.METHOD_PRI = 24;
module.exports.METHOD_PROPFIND = 25;
module.exports.METHOD_PROPPATCH = 26;
module.exports.METHOD_PUT = 27;
module.exports.METHOD_REBIND = 28;
module.exports.METHOD_REPORT = 29;
module.exports.METHOD_SEARCH = 30;
module.exports.METHOD_TRACE = 31;
module.exports.METHOD_UNBIND = 32;
module.exports.METHOD_UNCHECKOUT = 33;
module.exports.METHOD_UNLINK = 34;
module.exports.METHOD_UNLOCK = 35;
module.exports.METHOD_UPDATE = 36;
module.exports.METHOD_UPDATEREDIRECTREF = 37;
module.exports.METHOD_VERSION_CONTROL = 38;
module.exports.METHOD_DESCRIBE = 39;
module.exports.METHOD_GET_PARAMETER = 40;
module.exports.METHOD_PAUSE = 41;
module.exports.METHOD_PLAY = 42;
module.exports.METHOD_PLAY_NOTIFY = 43;
module.exports.METHOD_REDIRECT = 44;
module.exports.METHOD_SETUP = 45;
module.exports.METHOD_SET_PARAMETER = 46;
module.exports.METHOD_TEARDOWN = 47;
module.exports.METHOD_PURGE = 48;
module.exports.ERROR_NONE = 0;
module.exports.ERROR_UNEXPECTED_DATA = 1;
module.exports.ERROR_UNEXPECTED_EOF = 2;
module.exports.ERROR_CALLBACK_ERROR = 3;
module.exports.ERROR_UNEXPECTED_CHARACTER = 4;
module.exports.ERROR_UNEXPECTED_CONTENT_LENGTH = 5;
module.exports.ERROR_UNEXPECTED_TRANSFER_ENCODING = 6;
module.exports.ERROR_UNEXPECTED_CONTENT = 7;
module.exports.ERROR_UNTRAILERS = 8;
module.exports.ERROR_INVALID_VERSION = 9;
module.exports.ERROR_INVALID_STATUS = 10;
module.exports.ERROR_INVALID_CONTENT_LENGTH = 11;
module.exports.ERROR_INVALID_TRANSFER_ENCODING = 12;
module.exports.ERROR_INVALID_CHUNK_SIZE = 13;
module.exports.ERROR_MISSING_CONNECTION_UPGRADE = 14;
module.exports.ERROR_UNSUPPORTED_HTTP_VERSION = 15;
module.exports.STATE_START = 0;
module.exports.STATE_FINISH = 1;
module.exports.STATE_ERROR = 2;
module.exports.STATE_MESSAGE = 3;
module.exports.STATE_REQUEST = 4;
module.exports.STATE_REQUEST_METHOD = 5;
module.exports.STATE_REQUEST_URL = 6;
module.exports.STATE_REQUEST_PROTOCOL = 7;
module.exports.STATE_REQUEST_VERSION = 8;
module.exports.STATE_RESPONSE = 9;
module.exports.STATE_RESPONSE_VERSION = 10;
module.exports.STATE_RESPONSE_STATUS = 11;
module.exports.STATE_RESPONSE_REASON = 12;
module.exports.STATE_HEADER_NAME = 13;
module.exports.STATE_HEADER_TRANSFER_ENCODING = 14;
module.exports.STATE_HEADER_CONTENT_LENGTH = 15;
module.exports.STATE_HEADER_CONNECTION = 16;
module.exports.STATE_HEADER_VALUE = 17;
module.exports.STATE_HEADERS = 18;
module.exports.STATE_BODY = 19;
module.exports.STATE_TUNNEL = 20;
module.exports.STATE_BODY_VIA_CONTENT_LENGTH = 21;
module.exports.STATE_BODY_WITH_NO_LENGTH = 22;
module.exports.STATE_CHUNK_LENGTH = 23;
module.exports.STATE_CHUNK_EXTENSION_NAME = 24;
module.exports.STATE_CHUNK_EXTENSION_VALUE = 25;
module.exports.STATE_CHUNK_EXTENSION_QUOTED_VALUE = 26;
module.exports.STATE_CHUNK_DATA = 27;
module.exports.STATE_CHUNK_END = 28;
module.exports.STATE_CRLF_AFTER_LAST_CHUNK = 29;
module.exports.STATE_TRAILER_NAME = 30;
module.exports.STATE_TRAILER_VALUE = 31;
