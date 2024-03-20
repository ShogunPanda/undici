let imports = {}
imports['__wbindgen_placeholder__'] = module.exports
let wasm
const { TextDecoder, TextEncoder } = require(`util`)

const heap = new Array(128).fill(undefined)

heap.push(undefined, null, true, false)

function getObject(idx) {
  return heap[idx]
}

let heap_next = heap.length

function dropObject(idx) {
  if (idx < 132) return
  heap[idx] = heap_next
  heap_next = idx
}

function takeObject(idx) {
  const ret = getObject(idx)
  dropObject(idx)
  return ret
}

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1)
  const idx = heap_next
  heap_next = heap[idx]

  heap[idx] = obj
  return idx
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })

cachedTextDecoder.decode()

let cachedUint8Memory0 = null

function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer)
  }
  return cachedUint8Memory0
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len))
}

function handleError(f, args) {
  try {
    return f.apply(this, args)
  } catch (e) {
    wasm.__wbindgen_export_0(addHeapObject(e))
  }
}
/**
 * @param {number} len
 * @returns {number}
 */
module.exports.alloc = function (len) {
  const ret = wasm.alloc(len)
  return ret >>> 0
}

/**
 * @param {number} ptr
 * @param {number} len
 */
module.exports.free = function (ptr, len) {
  wasm.free(ptr, len)
}

function isLikeNone(x) {
  return x === undefined || x === null
}
/**
 * Creates a new parser.
 * @param {number | undefined} [id]
 * @returns {number}
 */
module.exports.create = function (id) {
  const ret = wasm.create(!isLikeNone(id), isLikeNone(id) ? 0 : id)
  return ret >>> 0
}

/**
 * Destroys a parser.
 * @param {number} raw
 */
module.exports.destroy = function (raw) {
  callbacksRegistry[raw] = undefined
  wasm.destroy(raw)
}

/**
 * Resets a parser. The second parameters specifies if to also reset the
 * parsed counter.
 * @param {number} raw
 * @param {boolean} keep_parsed
 */
module.exports.reset = function (raw, keep_parsed) {
  wasm.reset(raw, keep_parsed)
}

/**
 * Clears all values in the parser.
 *
 * Persisted fields, unconsumed data and the position are not cleared.
 * @param {number} raw
 */
module.exports.clear = function (raw) {
  wasm.clear(raw)
}

/**
 * @param {number} raw
 * @param {number} data
 * @param {number} limit
 * @returns {number}
 */
module.exports.parse = function (raw, data, limit) {
  const ret = wasm.parse(raw, data, limit)
  return ret >>> 0
}

/**
 * Pauses the parser. It will have to be resumed via `milo_resume`.
 * @param {number} raw
 */
module.exports.pause = function (raw) {
  wasm.pause(raw)
}

/**
 * Resumes the parser.
 * @param {number} raw
 */
module.exports.resume = function (raw) {
  wasm.resume(raw)
}

/**
 * Marks the parser as finished. Any new data received via `parse` will
 * put the parser in the error state.
 * @param {number} raw
 */
module.exports.finish = function (raw) {
  wasm.finish(raw)
}

let WASM_VECTOR_LEN = 0

let cachedTextEncoder = new TextEncoder('utf-8')

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view)
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg)
        view.set(buf)
        return {
          read: arg.length,
          written: buf.length
        }
      }

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg)
    const ptr = malloc(buf.length, 1) >>> 0
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    WASM_VECTOR_LEN = buf.length
    return ptr
  }

  let len = arg.length
  let ptr = malloc(len, 1) >>> 0

  const mem = getUint8Memory0()

  let offset = 0

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset)
    if (code > 0x7f) break
    mem[ptr + offset] = code
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset)
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len)
    const ret = encodeString(arg, view)

    offset += ret.written
    ptr = realloc(ptr, len, offset, 1) >>> 0
  }

  WASM_VECTOR_LEN = offset
  return ptr
}
/**
 * Marks the parser as failed.
 * @param {number} raw
 * @param {number} code
 * @param {string} reason
 */
module.exports.fail = function (raw, code, reason) {
  const ptr0 = passStringToWasm0(reason, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2)
  const len0 = WASM_VECTOR_LEN
  wasm.fail(raw, code, ptr0, len0)
}

/**
 * Clear the parser offsets.
 * @param {number} raw
 */
module.exports.clearOffsets = function (raw) {
  wasm.clearOffsets(raw)
}

let cachedInt32Memory0 = null

function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer)
  }
  return cachedInt32Memory0
}
/**
 * Returns the current parser's state as string.
 * @param {number} raw
 * @returns {string}
 */
module.exports.getStateString = function (raw) {
  let deferred1_0
  let deferred1_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.getStateString(retptr, raw)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    deferred1_0 = r0
    deferred1_1 = r1
    return getStringFromWasm0(r0, r1)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
    wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1)
  }
}

/**
 * Returns the current parser's error state as string.
 * @param {number} raw
 * @returns {string}
 */
module.exports.getErrorCodeString = function (raw) {
  let deferred1_0
  let deferred1_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.getErrorCodeString(retptr, raw)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    deferred1_0 = r0
    deferred1_1 = r1
    return getStringFromWasm0(r0, r1)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
    wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1)
  }
}

/**
 * Returns the current parser's error descrition.
 * @param {number} raw
 * @returns {string}
 */
module.exports.getErrorDescriptionString = function (raw) {
  let deferred1_0
  let deferred1_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.getErrorDescriptionString(retptr, raw)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    deferred1_0 = r0
    deferred1_1 = r1
    return getStringFromWasm0(r0, r1)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
    wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1)
  }
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getState = function (raw) {
  const ret = wasm.getState(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getPosition = function (raw) {
  const ret = wasm.getPosition(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getErrorCode = function (raw) {
  const ret = wasm.getErrorCode(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getErrorDescriptionLen = function (raw) {
  const ret = wasm.getErrorDescriptionLen(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getUnconsumedLen = function (raw) {
  const ret = wasm.getUnconsumedLen(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getId = function (raw) {
  const ret = wasm.getId(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getMode = function (raw) {
  const ret = wasm.getMode(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getMessageType = function (raw) {
  const ret = wasm.getMessageType(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getMethod = function (raw) {
  const ret = wasm.getMethod(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getStatus = function (raw) {
  const ret = wasm.getStatus(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getVersionMajor = function (raw) {
  const ret = wasm.getVersionMajor(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getVersionMinor = function (raw) {
  const ret = wasm.getVersionMinor(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getConnection = function (raw) {
  const ret = wasm.getConnection(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {bigint}
 */
module.exports.getParsed = function (raw) {
  const ret = wasm.getParsed(raw)
  return BigInt.asUintN(64, ret)
}

/**
 * @param {number} raw
 * @returns {bigint}
 */
module.exports.getContentLength = function (raw) {
  const ret = wasm.getContentLength(raw)
  return BigInt.asUintN(64, ret)
}

/**
 * @param {number} raw
 * @returns {bigint}
 */
module.exports.getChunkSize = function (raw) {
  const ret = wasm.getChunkSize(raw)
  return BigInt.asUintN(64, ret)
}

/**
 * @param {number} raw
 * @returns {bigint}
 */
module.exports.getRemainingContentLength = function (raw) {
  const ret = wasm.getRemainingContentLength(raw)
  return BigInt.asUintN(64, ret)
}

/**
 * @param {number} raw
 * @returns {bigint}
 */
module.exports.getRemainingChunkSize = function (raw) {
  const ret = wasm.getRemainingChunkSize(raw)
  return BigInt.asUintN(64, ret)
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.isPaused = function (raw) {
  const ret = wasm.isPaused(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.manageUnconsumed = function (raw) {
  const ret = wasm.manageUnconsumed(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.continueWithoutData = function (raw) {
  const ret = wasm.continueWithoutData(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.isConnect = function (raw) {
  const ret = wasm.isConnect(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.hasContentLength = function (raw) {
  const ret = wasm.hasContentLength(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.hasChunkedTransferEncoding = function (raw) {
  const ret = wasm.hasChunkedTransferEncoding(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.hasUpgrade = function (raw) {
  const ret = wasm.hasUpgrade(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.hasTrailers = function (raw) {
  const ret = wasm.hasTrailers(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {boolean}
 */
module.exports.skipBody = function (raw) {
  const ret = wasm.skipBody(raw)
  return ret !== 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getOffsets = function (raw) {
  const ret = wasm.getOffsets(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getUnconsumed = function (raw) {
  const ret = wasm.getUnconsumed(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getErrorDescription = function (raw) {
  const ret = wasm.getErrorDescription(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {number}
 */
module.exports.getOwner = function (raw) {
  const ret = wasm.getOwner(raw)
  return ret >>> 0
}

/**
 * @param {number} raw
 * @returns {any}
 */
module.exports.getCallbackError = function (raw) {
  const ret = wasm.getCallbackError(raw)
  return takeObject(ret)
}

/**
 * @param {number} raw
 * @param {number} value
 */
module.exports.setId = function (raw, value) {
  wasm.setId(raw, value)
}

/**
 * @param {number} raw
 * @param {number} value
 */
module.exports.setMode = function (raw, value) {
  wasm.setMode(raw, value)
}

/**
 * @param {number} raw
 * @param {boolean} value
 */
module.exports.setManageUnconsumed = function (raw, value) {
  wasm.setManageUnconsumed(raw, value)
}

/**
 * @param {number} raw
 * @param {boolean} value
 */
module.exports.setSkipBody = function (raw, value) {
  wasm.setSkipBody(raw, value)
}

/**
 * @param {number} raw
 * @param {boolean} value
 */
module.exports.setIsConnect = function (raw, value) {
  wasm.setIsConnect(raw, value)
}

/**
 */
module.exports.MessageTypes = Object.freeze({
  AUTODETECT: 0,
  0: 'AUTODETECT',
  REQUEST: 1,
  1: 'REQUEST',
  RESPONSE: 2,
  2: 'RESPONSE'
})
/**
 */
module.exports.Connections = Object.freeze({
  KEEPALIVE: 0,
  0: 'KEEPALIVE',
  CLOSE: 1,
  1: 'CLOSE',
  UPGRADE: 2,
  2: 'UPGRADE'
})
/**
 */
module.exports.Methods = Object.freeze({
  ACL: 0,
  0: 'ACL',
  BASELINE_CONTROL: 1,
  1: 'BASELINE_CONTROL',
  BIND: 2,
  2: 'BIND',
  CHECKIN: 3,
  3: 'CHECKIN',
  CHECKOUT: 4,
  4: 'CHECKOUT',
  CONNECT: 5,
  5: 'CONNECT',
  COPY: 6,
  6: 'COPY',
  DELETE: 7,
  7: 'DELETE',
  GET: 8,
  8: 'GET',
  HEAD: 9,
  9: 'HEAD',
  LABEL: 10,
  10: 'LABEL',
  LINK: 11,
  11: 'LINK',
  LOCK: 12,
  12: 'LOCK',
  MERGE: 13,
  13: 'MERGE',
  MKACTIVITY: 14,
  14: 'MKACTIVITY',
  MKCALENDAR: 15,
  15: 'MKCALENDAR',
  MKCOL: 16,
  16: 'MKCOL',
  MKREDIRECTREF: 17,
  17: 'MKREDIRECTREF',
  MKWORKSPACE: 18,
  18: 'MKWORKSPACE',
  MOVE: 19,
  19: 'MOVE',
  OPTIONS: 20,
  20: 'OPTIONS',
  ORDERPATCH: 21,
  21: 'ORDERPATCH',
  PATCH: 22,
  22: 'PATCH',
  POST: 23,
  23: 'POST',
  PRI: 24,
  24: 'PRI',
  PROPFIND: 25,
  25: 'PROPFIND',
  PROPPATCH: 26,
  26: 'PROPPATCH',
  PUT: 27,
  27: 'PUT',
  REBIND: 28,
  28: 'REBIND',
  REPORT: 29,
  29: 'REPORT',
  SEARCH: 30,
  30: 'SEARCH',
  TRACE: 31,
  31: 'TRACE',
  UNBIND: 32,
  32: 'UNBIND',
  UNCHECKOUT: 33,
  33: 'UNCHECKOUT',
  UNLINK: 34,
  34: 'UNLINK',
  UNLOCK: 35,
  35: 'UNLOCK',
  UPDATE: 36,
  36: 'UPDATE',
  UPDATEREDIRECTREF: 37,
  37: 'UPDATEREDIRECTREF',
  VERSION_CONTROL: 38,
  38: 'VERSION_CONTROL',
  DESCRIBE: 39,
  39: 'DESCRIBE',
  GET_PARAMETER: 40,
  40: 'GET_PARAMETER',
  PAUSE: 41,
  41: 'PAUSE',
  PLAY: 42,
  42: 'PLAY',
  PLAY_NOTIFY: 43,
  43: 'PLAY_NOTIFY',
  REDIRECT: 44,
  44: 'REDIRECT',
  SETUP: 45,
  45: 'SETUP',
  SET_PARAMETER: 46,
  46: 'SET_PARAMETER',
  TEARDOWN: 47,
  47: 'TEARDOWN',
  PURGE: 48,
  48: 'PURGE'
})
/**
 */
module.exports.States = Object.freeze({
  START: 0,
  0: 'START',
  FINISH: 1,
  1: 'FINISH',
  ERROR: 2,
  2: 'ERROR',
  AUTODETECT: 3,
  3: 'AUTODETECT',
  REQUEST: 4,
  4: 'REQUEST',
  REQUEST_METHOD: 5,
  5: 'REQUEST_METHOD',
  REQUEST_URL: 6,
  6: 'REQUEST_URL',
  REQUEST_PROTOCOL: 7,
  7: 'REQUEST_PROTOCOL',
  REQUEST_VERSION: 8,
  8: 'REQUEST_VERSION',
  RESPONSE: 9,
  9: 'RESPONSE',
  RESPONSE_VERSION: 10,
  10: 'RESPONSE_VERSION',
  RESPONSE_STATUS: 11,
  11: 'RESPONSE_STATUS',
  RESPONSE_REASON: 12,
  12: 'RESPONSE_REASON',
  HEADER_NAME: 13,
  13: 'HEADER_NAME',
  HEADER_TRANSFER_ENCODING: 14,
  14: 'HEADER_TRANSFER_ENCODING',
  HEADER_CONTENT_LENGTH: 15,
  15: 'HEADER_CONTENT_LENGTH',
  HEADER_CONNECTION: 16,
  16: 'HEADER_CONNECTION',
  HEADER_VALUE: 17,
  17: 'HEADER_VALUE',
  HEADERS: 18,
  18: 'HEADERS',
  TUNNEL: 19,
  19: 'TUNNEL',
  BODY_VIA_CONTENT_LENGTH: 20,
  20: 'BODY_VIA_CONTENT_LENGTH',
  BODY_WITH_NO_LENGTH: 21,
  21: 'BODY_WITH_NO_LENGTH',
  CHUNK_LENGTH: 22,
  22: 'CHUNK_LENGTH',
  CHUNK_EXTENSION_NAME: 23,
  23: 'CHUNK_EXTENSION_NAME',
  CHUNK_EXTENSION_VALUE: 24,
  24: 'CHUNK_EXTENSION_VALUE',
  CHUNK_EXTENSION_QUOTED_VALUE: 25,
  25: 'CHUNK_EXTENSION_QUOTED_VALUE',
  CHUNK_DATA: 26,
  26: 'CHUNK_DATA',
  CHUNK_END: 27,
  27: 'CHUNK_END',
  CRLF_AFTER_LAST_CHUNK: 28,
  28: 'CRLF_AFTER_LAST_CHUNK',
  TRAILER_NAME: 29,
  29: 'TRAILER_NAME',
  TRAILER_VALUE: 30,
  30: 'TRAILER_VALUE'
})
/**
 */
module.exports.Errors = Object.freeze({
  NONE: 0,
  0: 'NONE',
  UNEXPECTED_DATA: 1,
  1: 'UNEXPECTED_DATA',
  UNEXPECTED_EOF: 2,
  2: 'UNEXPECTED_EOF',
  CALLBACK_ERROR: 3,
  3: 'CALLBACK_ERROR',
  UNEXPECTED_CHARACTER: 4,
  4: 'UNEXPECTED_CHARACTER',
  UNEXPECTED_CONTENT_LENGTH: 5,
  5: 'UNEXPECTED_CONTENT_LENGTH',
  UNEXPECTED_TRANSFER_ENCODING: 6,
  6: 'UNEXPECTED_TRANSFER_ENCODING',
  UNEXPECTED_CONTENT: 7,
  7: 'UNEXPECTED_CONTENT',
  UNEXPECTED_TRAILERS: 8,
  8: 'UNEXPECTED_TRAILERS',
  INVALID_VERSION: 9,
  9: 'INVALID_VERSION',
  INVALID_STATUS: 10,
  10: 'INVALID_STATUS',
  INVALID_CONTENT_LENGTH: 11,
  11: 'INVALID_CONTENT_LENGTH',
  INVALID_TRANSFER_ENCODING: 12,
  12: 'INVALID_TRANSFER_ENCODING',
  INVALID_CHUNK_SIZE: 13,
  13: 'INVALID_CHUNK_SIZE',
  MISSING_CONNECTION_UPGRADE: 14,
  14: 'MISSING_CONNECTION_UPGRADE',
  UNSUPPORTED_HTTP_VERSION: 15,
  15: 'UNSUPPORTED_HTTP_VERSION'
})
/**
 */
module.exports.Offsets = Object.freeze({
  MESSAGE_START: 0,
  0: 'MESSAGE_START',
  MESSAGE_COMPLETE: 1,
  1: 'MESSAGE_COMPLETE',
  METHOD: 2,
  2: 'METHOD',
  URL: 3,
  3: 'URL',
  PROTOCOL: 4,
  4: 'PROTOCOL',
  VERSION: 5,
  5: 'VERSION',
  STATUS: 6,
  6: 'STATUS',
  REASON: 7,
  7: 'REASON',
  HEADER_NAME: 8,
  8: 'HEADER_NAME',
  HEADER_VALUE: 9,
  9: 'HEADER_VALUE',
  HEADERS: 10,
  10: 'HEADERS',
  CHUNK_LENGTH: 11,
  11: 'CHUNK_LENGTH',
  CHUNK_EXTENSION_NAME: 12,
  12: 'CHUNK_EXTENSION_NAME',
  CHUNK_EXTENSION_VALUE: 13,
  13: 'CHUNK_EXTENSION_VALUE',
  CHUNK: 14,
  14: 'CHUNK',
  DATA: 15,
  15: 'DATA',
  BODY: 16,
  16: 'BODY',
  TRAILER_NAME: 17,
  17: 'TRAILER_NAME',
  TRAILER_VALUE: 18,
  18: 'TRAILER_VALUE',
  TRAILERS: 19,
  19: 'TRAILERS'
})
/**
 */
module.exports.Callbacks = Object.freeze({
  beforeStateChange: 0,
  0: 'beforeStateChange',
  afterStateChange: 1,
  1: 'afterStateChange',
  onError: 2,
  2: 'onError',
  onFinish: 3,
  3: 'onFinish',
  onMessageStart: 4,
  4: 'onMessageStart',
  onMessageComplete: 5,
  5: 'onMessageComplete',
  onRequest: 6,
  6: 'onRequest',
  onResponse: 7,
  7: 'onResponse',
  onReset: 8,
  8: 'onReset',
  onMethod: 9,
  9: 'onMethod',
  onUrl: 10,
  10: 'onUrl',
  onProtocol: 11,
  11: 'onProtocol',
  onVersion: 12,
  12: 'onVersion',
  onStatus: 13,
  13: 'onStatus',
  onReason: 14,
  14: 'onReason',
  onHeaderName: 15,
  15: 'onHeaderName',
  onHeaderValue: 16,
  16: 'onHeaderValue',
  onHeaders: 17,
  17: 'onHeaders',
  onConnect: 18,
  18: 'onConnect',
  onUpgrade: 19,
  19: 'onUpgrade',
  onChunkLength: 20,
  20: 'onChunkLength',
  onChunkExtensionName: 21,
  21: 'onChunkExtensionName',
  onChunkExtensionValue: 22,
  22: 'onChunkExtensionValue',
  onChunk: 23,
  23: 'onChunk',
  onBody: 24,
  24: 'onBody',
  onData: 25,
  25: 'onData',
  onTrailerName: 26,
  26: 'onTrailerName',
  onTrailerValue: 27,
  27: 'onTrailerValue',
  onTrailers: 28,
  28: 'onTrailers'
})

module.exports.__wbg_runCallback_6985facb1a283e74 = function () {
  return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = runCallback(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0)
    return ret
  }, arguments)
}

module.exports.__wbindgen_object_drop_ref = function (arg0) {
  takeObject(arg0)
}

module.exports.__wbindgen_object_clone_ref = function (arg0) {
  const ret = getObject(arg0)
  return addHeapObject(ret)
}

module.exports.__wbindgen_throw = function (arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1))
}

const path = require('path').join(__dirname, 'milo_bg.wasm')
const bytes = require('fs').readFileSync(path)

const wasmModule = new WebAssembly.Module(bytes)
const wasmInstance = new WebAssembly.Instance(wasmModule, imports)
wasm = wasmInstance.exports
module.exports.__wasm = wasm

/*--- MILO MODIFICATIONS ---*/

// TODO@PI: Avoid shapes
const callbacksRegistry = {}

function runCallback(parser, type, at, len) {
  const value = callbacksRegistry[parser][type]?.(at, len) ?? 0

  if (typeof value !== 'number') {
    throw new TypeError(`Callback for ${module.exports.Callbacks[type]} must return a number, got ${typeof value}.`)
  }

  return 0
}

const emptyCallbacks = [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
]

module.exports.setBeforeStateChange = function setBeforeStateChange(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_BEFORE_STATE_CHANGE] = cb
}

module.exports.setAfterStateChange = function setAfterStateChange(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_AFTER_STATE_CHANGE] = cb
}

module.exports.setOnError = function setOnError(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_ERROR] = cb
}

module.exports.setOnFinish = function setOnFinish(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_FINISH] = cb
}

module.exports.setOnMessageStart = function setOnMessageStart(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_MESSAGE_START] = cb
}

module.exports.setOnMessageComplete = function setOnMessageComplete(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_MESSAGE_COMPLETE] = cb
}

module.exports.setOnRequest = function setOnRequest(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_REQUEST] = cb
}

module.exports.setOnResponse = function setOnResponse(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_RESPONSE] = cb
}

module.exports.setOnReset = function setOnReset(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_RESET] = cb
}

module.exports.setOnMethod = function setOnMethod(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_METHOD] = cb
}

module.exports.setOnUrl = function setOnUrl(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_URL] = cb
}

module.exports.setOnProtocol = function setOnProtocol(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_PROTOCOL] = cb
}

module.exports.setOnVersion = function setOnVersion(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_VERSION] = cb
}

module.exports.setOnStatus = function setOnStatus(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_STATUS] = cb
}

module.exports.setOnReason = function setOnReason(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_REASON] = cb
}

module.exports.setOnHeaderName = function setOnHeaderName(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_HEADER_NAME] = cb
}

module.exports.setOnHeaderValue = function setOnHeaderValue(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_HEADER_VALUE] = cb
}

module.exports.setOnHeaders = function setOnHeaders(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_HEADERS] = cb
}

module.exports.setOnConnect = function setOnConnect(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_CONNECT] = cb
}

module.exports.setOnUpgrade = function setOnUpgrade(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_UPGRADE] = cb
}

module.exports.setOnChunkLength = function setOnChunkLength(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_CHUNK_LENGTH] = cb
}

module.exports.setOnChunkExtensionName = function setOnChunkExtensionName(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_CHUNK_EXTENSION_NAME] = cb
}

module.exports.setOnChunkExtensionValue = function setOnChunkExtensionValue(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_CHUNK_EXTENSION_VALUE] = cb
}

module.exports.setOnChunk = function setOnChunk(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_CHUNK] = cb
}

module.exports.setOnBody = function setOnBody(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_BODY] = cb
}

module.exports.setOnData = function setOnData(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_DATA] = cb
}

module.exports.setOnTrailerName = function setOnTrailerName(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_TRAILER_NAME] = cb
}

module.exports.setOnTrailerValue = function setOnTrailerValue(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_TRAILER_VALUE] = cb
}

module.exports.setOnTrailers = function setOnTrailers(parser, cb) {
  callbacksRegistry[parser] ??= structuredClone(emptyCallbacks)
  callbacksRegistry[parser][module.exports.CALLBACKS_ON_TRAILERS] = cb
}

module.exports.AUTODETECT = 0
module.exports.REQUEST = 1
module.exports.RESPONSE = 2
module.exports.CONNECTION_KEEPALIVE = 0
module.exports.CONNECTION_CLOSE = 1
module.exports.CONNECTION_UPGRADE = 2
module.exports.METHOD_ACL = 0
module.exports.METHOD_BASELINE_CONTROL = 1
module.exports.METHOD_BIND = 2
module.exports.METHOD_CHECKIN = 3
module.exports.METHOD_CHECKOUT = 4
module.exports.METHOD_CONNECT = 5
module.exports.METHOD_COPY = 6
module.exports.METHOD_DELETE = 7
module.exports.METHOD_GET = 8
module.exports.METHOD_HEAD = 9
module.exports.METHOD_LABEL = 10
module.exports.METHOD_LINK = 11
module.exports.METHOD_LOCK = 12
module.exports.METHOD_MERGE = 13
module.exports.METHOD_MKACTIVITY = 14
module.exports.METHOD_MKCALENDAR = 15
module.exports.METHOD_MKCOL = 16
module.exports.METHOD_MKREDIRECTREF = 17
module.exports.METHOD_MKWORKSPACE = 18
module.exports.METHOD_MOVE = 19
module.exports.METHOD_OPTIONS = 20
module.exports.METHOD_ORDERPATCH = 21
module.exports.METHOD_PATCH = 22
module.exports.METHOD_POST = 23
module.exports.METHOD_PRI = 24
module.exports.METHOD_PROPFIND = 25
module.exports.METHOD_PROPPATCH = 26
module.exports.METHOD_PUT = 27
module.exports.METHOD_REBIND = 28
module.exports.METHOD_REPORT = 29
module.exports.METHOD_SEARCH = 30
module.exports.METHOD_TRACE = 31
module.exports.METHOD_UNBIND = 32
module.exports.METHOD_UNCHECKOUT = 33
module.exports.METHOD_UNLINK = 34
module.exports.METHOD_UNLOCK = 35
module.exports.METHOD_UPDATE = 36
module.exports.METHOD_UPDATEREDIRECTREF = 37
module.exports.METHOD_VERSION_CONTROL = 38
module.exports.METHOD_DESCRIBE = 39
module.exports.METHOD_GET_PARAMETER = 40
module.exports.METHOD_PAUSE = 41
module.exports.METHOD_PLAY = 42
module.exports.METHOD_PLAY_NOTIFY = 43
module.exports.METHOD_REDIRECT = 44
module.exports.METHOD_SETUP = 45
module.exports.METHOD_SET_PARAMETER = 46
module.exports.METHOD_TEARDOWN = 47
module.exports.METHOD_PURGE = 48
module.exports.CALLBACKS_BEFORE_STATE_CHANGE = 0
module.exports.CALLBACKS_AFTER_STATE_CHANGE = 1
module.exports.CALLBACKS_ON_ERROR = 2
module.exports.CALLBACKS_ON_FINISH = 3
module.exports.CALLBACKS_ON_MESSAGE_START = 4
module.exports.CALLBACKS_ON_MESSAGE_COMPLETE = 5
module.exports.CALLBACKS_ON_REQUEST = 6
module.exports.CALLBACKS_ON_RESPONSE = 7
module.exports.CALLBACKS_ON_RESET = 8
module.exports.CALLBACKS_ON_METHOD = 9
module.exports.CALLBACKS_ON_URL = 10
module.exports.CALLBACKS_ON_PROTOCOL = 11
module.exports.CALLBACKS_ON_VERSION = 12
module.exports.CALLBACKS_ON_STATUS = 13
module.exports.CALLBACKS_ON_REASON = 14
module.exports.CALLBACKS_ON_HEADER_NAME = 15
module.exports.CALLBACKS_ON_HEADER_VALUE = 16
module.exports.CALLBACKS_ON_HEADERS = 17
module.exports.CALLBACKS_ON_CONNECT = 18
module.exports.CALLBACKS_ON_UPGRADE = 19
module.exports.CALLBACKS_ON_CHUNK_LENGTH = 20
module.exports.CALLBACKS_ON_CHUNK_EXTENSION_NAME = 21
module.exports.CALLBACKS_ON_CHUNK_EXTENSION_VALUE = 22
module.exports.CALLBACKS_ON_CHUNK = 23
module.exports.CALLBACKS_ON_BODY = 24
module.exports.CALLBACKS_ON_DATA = 25
module.exports.CALLBACKS_ON_TRAILER_NAME = 26
module.exports.CALLBACKS_ON_TRAILER_VALUE = 27
module.exports.CALLBACKS_ON_TRAILERS = 28
module.exports.ERROR_NONE = 0
module.exports.ERROR_UNEXPECTED_DATA = 1
module.exports.ERROR_UNEXPECTED_EOF = 2
module.exports.ERROR_CALLBACK_ERROR = 3
module.exports.ERROR_UNEXPECTED_CHARACTER = 4
module.exports.ERROR_UNEXPECTED_CONTENT_LENGTH = 5
module.exports.ERROR_UNEXPECTED_TRANSFER_ENCODING = 6
module.exports.ERROR_UNEXPECTED_CONTENT = 7
module.exports.ERROR_UNEXPECTED_TRAILERS = 8
module.exports.ERROR_INVALID_VERSION = 9
module.exports.ERROR_INVALID_STATUS = 10
module.exports.ERROR_INVALID_CONTENT_LENGTH = 11
module.exports.ERROR_INVALID_TRANSFER_ENCODING = 12
module.exports.ERROR_INVALID_CHUNK_SIZE = 13
module.exports.ERROR_MISSING_CONNECTION_UPGRADE = 14
module.exports.ERROR_UNSUPPORTED_HTTP_VERSION = 15
module.exports.OFFSET_MESSAGE_START = 0
module.exports.OFFSET_MESSAGE_COMPLETE = 1
module.exports.OFFSET_METHOD = 2
module.exports.OFFSET_URL = 3
module.exports.OFFSET_PROTOCOL = 4
module.exports.OFFSET_VERSION = 5
module.exports.OFFSET_STATUS = 6
module.exports.OFFSET_REASON = 7
module.exports.OFFSET_HEADER_NAME = 8
module.exports.OFFSET_HEADER_VALUE = 9
module.exports.OFFSET_HEADERS = 10
module.exports.OFFSET_CHUNK_LENGTH = 11
module.exports.OFFSET_CHUNK_EXTENSION_NAME = 12
module.exports.OFFSET_CHUNK_EXTENSION_VALUE = 13
module.exports.OFFSET_CHUNK = 14
module.exports.OFFSET_DATA = 15
module.exports.OFFSET_BODY = 16
module.exports.OFFSET_TRAILER_NAME = 17
module.exports.OFFSET_TRAILER_VALUE = 18
module.exports.OFFSET_TRAILERS = 19
module.exports.STATE_START = 0
module.exports.STATE_FINISH = 1
module.exports.STATE_ERROR = 2
module.exports.STATE_AUTODETECT = 3
module.exports.STATE_REQUEST = 4
module.exports.STATE_REQUEST_METHOD = 5
module.exports.STATE_REQUEST_URL = 6
module.exports.STATE_REQUEST_PROTOCOL = 7
module.exports.STATE_REQUEST_VERSION = 8
module.exports.STATE_RESPONSE = 9
module.exports.STATE_RESPONSE_VERSION = 10
module.exports.STATE_RESPONSE_STATUS = 11
module.exports.STATE_RESPONSE_REASON = 12
module.exports.STATE_HEADER_NAME = 13
module.exports.STATE_HEADER_TRANSFER_ENCODING = 14
module.exports.STATE_HEADER_CONTENT_LENGTH = 15
module.exports.STATE_HEADER_CONNECTION = 16
module.exports.STATE_HEADER_VALUE = 17
module.exports.STATE_HEADERS = 18
module.exports.STATE_TUNNEL = 19
module.exports.STATE_BODY_VIA_CONTENT_LENGTH = 20
module.exports.STATE_BODY_WITH_NO_LENGTH = 21
module.exports.STATE_CHUNK_LENGTH = 22
module.exports.STATE_CHUNK_EXTENSION_NAME = 23
module.exports.STATE_CHUNK_EXTENSION_VALUE = 24
module.exports.STATE_CHUNK_EXTENSION_QUOTED_VALUE = 25
module.exports.STATE_CHUNK_DATA = 26
module.exports.STATE_CHUNK_END = 27
module.exports.STATE_CRLF_AFTER_LAST_CHUNK = 28
module.exports.STATE_TRAILER_NAME = 29
module.exports.STATE_TRAILER_VALUE = 30
module.exports.FLAGS_DEBUG = false
module.exports.memory = wasm.memory
