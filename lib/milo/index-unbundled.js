/* eslint-disable no-unused-vars,camelcase,no-undef */

function loadWASM() {
  return require('node:fs').readFileSync(require('node:path').resolve(__dirname, 'milo.wasm'))
}
function logger(context, raw) {
  const len = Number(BigInt.asUintN(32, raw))
  const ptr = Number(raw >> 32n)
  console.error(Buffer.from(context.buffer, ptr, len).toString('utf-8'))
}
function alloc(len) {
  return this.alloc(len) >>> 0
}
function create() {
  return this.create() >>> 0
}
function destroy(context, parser) {
  this.destroy(parser)
}
function parse(parser, data, limit) {
  return this.parse(parser, data, limit) >>> 0
}
function fail(parser, code, description) {
  const len = description.length
  const ptr = this.alloc(len)
  const buffer = Buffer.from(this.memory.buffer, ptr, len)
  buffer.set(Buffer.from(description, 'utf-8'))
  this.fail(parser, code, ptr, len)
  this.dealloc(ptr, len)
}
function getErrorDescription(parser) {
  const raw = this.get_error_description_raw(parser)
  const len = Number(BigInt.asUintN(32, raw))
  const ptr = Number(raw >> 32n)
  return Buffer.from(this.memory.buffer, ptr, len).toString('utf-8')
}
function getMode(parser) {
  return this.get_mode(parser) >>> 0
}
function isPaused(parser) {
  return this.is_paused(parser) !== 0
}
function manageUnconsumed(parser) {
  return this.manage_unconsumed(parser) !== 0
}
function continueWithoutData(parser) {
  return this.continue_without_data(parser) !== 0
}
function isConnect(parser) {
  return this.is_connect(parser) !== 0
}
function skipBody(parser) {
  return this.skip_body(parser) !== 0
}
function getState(parser) {
  return this.get_state(parser) >>> 0
}
function getPosition(parser) {
  return this.get_position(parser) >>> 0
}
function getParsed(parser) {
  return BigInt.asUintN(64, this.get_parsed(parser))
}
function getErrorCode(parser) {
  return this.get_error_code(parser) >>> 0
}
function getMessageType(parser) {
  return this.get_message_type(parser) >>> 0
}
function getMethod(parser) {
  return this.get_method(parser) >>> 0
}
function getStatus(parser) {
  return this.get_status(parser) >>> 0
}
function getVersionMajor(parser) {
  return this.get_version_major(parser) >>> 0
}
function getVersionMinor(parser) {
  return this.get_version_minor(parser) >>> 0
}
function getConnection(parser) {
  return this.get_connection(parser) >>> 0
}
function getContentLength(parser) {
  return BigInt.asUintN(64, this.get_content_length(parser))
}
function getChunkSize(parser) {
  return BigInt.asUintN(64, this.get_chunk_size(parser))
}
function getRemainingContentLength(parser) {
  return BigInt.asUintN(64, this.get_remaining_content_length(parser))
}
function getRemainingChunkSize(parser) {
  return BigInt.asUintN(64, this.get_remaining_chunk_size(parser))
}
function hasContentLength(parser) {
  return this.has_content_length(parser) !== 0
}
function hasChunkedTransferEncoding(parser) {
  return this.has_chunked_transfer_encoding(parser) !== 0
}
function hasUpgrade(parser) {
  return this.has_upgrade(parser) !== 0
}
function hasTrailers(parser) {
  return this.has_trailers(parser) !== 0
}
function setContinueWithoutData(parser, value) {
  this.set_continue_without_data(parser, value)
}
function setIsConnect(parser, value) {
  this.set_is_connect(parser, value)
}
function setManageUnconsumed(parser, value) {
  this.set_manage_unconsumed(parser, value)
}
function setMode(parser, value) {
  this.set_mode(parser, value)
}
function setSkipBody(parser, value) {
  this.set_skip_body(parser, value)
}
const MessageTypes = Object.freeze({
  AUTODETECT: 0,
  REQUEST: 1,
  RESPONSE: 2,
  0: 'AUTODETECT',
  1: 'REQUEST',
  2: 'RESPONSE'
})
const Errors = Object.freeze({
  NONE: 0,
  USER: 1,
  CALLBACK_ERROR: 2,
  UNEXPECTED_STATE: 3,
  UNEXPECTED_DATA: 4,
  UNEXPECTED_EOF: 5,
  UNEXPECTED_CHARACTER: 6,
  UNEXPECTED_CONTENT_LENGTH: 7,
  UNEXPECTED_TRANSFER_ENCODING: 8,
  UNEXPECTED_CONTENT: 9,
  UNEXPECTED_TRAILERS: 10,
  INVALID_VERSION: 11,
  INVALID_STATUS: 12,
  INVALID_CONTENT_LENGTH: 13,
  INVALID_TRANSFER_ENCODING: 14,
  INVALID_CHUNK_SIZE: 15,
  MISSING_CONNECTION_UPGRADE: 16,
  UNSUPPORTED_HTTP_VERSION: 17,
  0: 'NONE',
  1: 'USER',
  2: 'CALLBACK_ERROR',
  3: 'UNEXPECTED_STATE',
  4: 'UNEXPECTED_DATA',
  5: 'UNEXPECTED_EOF',
  6: 'UNEXPECTED_CHARACTER',
  7: 'UNEXPECTED_CONTENT_LENGTH',
  8: 'UNEXPECTED_TRANSFER_ENCODING',
  9: 'UNEXPECTED_CONTENT',
  10: 'UNEXPECTED_TRAILERS',
  11: 'INVALID_VERSION',
  12: 'INVALID_STATUS',
  13: 'INVALID_CONTENT_LENGTH',
  14: 'INVALID_TRANSFER_ENCODING',
  15: 'INVALID_CHUNK_SIZE',
  16: 'MISSING_CONNECTION_UPGRADE',
  17: 'UNSUPPORTED_HTTP_VERSION'
})
const Methods = Object.freeze({
  ACL: 0,
  BASELINE_CONTROL: 1,
  BIND: 2,
  CHECKIN: 3,
  CHECKOUT: 4,
  CONNECT: 5,
  COPY: 6,
  DELETE: 7,
  GET: 8,
  HEAD: 9,
  LABEL: 10,
  LINK: 11,
  LOCK: 12,
  MERGE: 13,
  MKACTIVITY: 14,
  MKCALENDAR: 15,
  MKCOL: 16,
  MKREDIRECTREF: 17,
  MKWORKSPACE: 18,
  MOVE: 19,
  OPTIONS: 20,
  ORDERPATCH: 21,
  PATCH: 22,
  POST: 23,
  PRI: 24,
  PROPFIND: 25,
  PROPPATCH: 26,
  PUT: 27,
  REBIND: 28,
  REPORT: 29,
  SEARCH: 30,
  TRACE: 31,
  UNBIND: 32,
  UNCHECKOUT: 33,
  UNLINK: 34,
  UNLOCK: 35,
  UPDATE: 36,
  UPDATEREDIRECTREF: 37,
  VERSION_CONTROL: 38,
  DESCRIBE: 39,
  GET_PARAMETER: 40,
  PAUSE: 41,
  PLAY: 42,
  PLAY_NOTIFY: 43,
  REDIRECT: 44,
  SETUP: 45,
  SET_PARAMETER: 46,
  TEARDOWN: 47,
  PURGE: 48,
  0: 'ACL',
  1: 'BASELINE_CONTROL',
  2: 'BIND',
  3: 'CHECKIN',
  4: 'CHECKOUT',
  5: 'CONNECT',
  6: 'COPY',
  7: 'DELETE',
  8: 'GET',
  9: 'HEAD',
  10: 'LABEL',
  11: 'LINK',
  12: 'LOCK',
  13: 'MERGE',
  14: 'MKACTIVITY',
  15: 'MKCALENDAR',
  16: 'MKCOL',
  17: 'MKREDIRECTREF',
  18: 'MKWORKSPACE',
  19: 'MOVE',
  20: 'OPTIONS',
  21: 'ORDERPATCH',
  22: 'PATCH',
  23: 'POST',
  24: 'PRI',
  25: 'PROPFIND',
  26: 'PROPPATCH',
  27: 'PUT',
  28: 'REBIND',
  29: 'REPORT',
  30: 'SEARCH',
  31: 'TRACE',
  32: 'UNBIND',
  33: 'UNCHECKOUT',
  34: 'UNLINK',
  35: 'UNLOCK',
  36: 'UPDATE',
  37: 'UPDATEREDIRECTREF',
  38: 'VERSION_CONTROL',
  39: 'DESCRIBE',
  40: 'GET_PARAMETER',
  41: 'PAUSE',
  42: 'PLAY',
  43: 'PLAY_NOTIFY',
  44: 'REDIRECT',
  45: 'SETUP',
  46: 'SET_PARAMETER',
  47: 'TEARDOWN',
  48: 'PURGE'
})
const Connections = Object.freeze({
  KEEPALIVE: 0,
  CLOSE: 1,
  UPGRADE: 2,
  0: 'KEEPALIVE',
  1: 'CLOSE',
  2: 'UPGRADE'
})
const Callbacks = Object.freeze({
  ON_STATE_CHANGE: 0,
  ON_ERROR: 1,
  ON_FINISH: 2,
  ON_MESSAGE_START: 3,
  ON_MESSAGE_COMPLETE: 4,
  ON_REQUEST: 5,
  ON_RESPONSE: 6,
  ON_RESET: 7,
  ON_METHOD: 8,
  ON_URL: 9,
  ON_PROTOCOL: 10,
  ON_VERSION: 11,
  ON_STATUS: 12,
  ON_REASON: 13,
  ON_HEADER_NAME: 14,
  ON_HEADER_VALUE: 15,
  ON_HEADERS: 16,
  ON_CONNECT: 17,
  ON_UPGRADE: 18,
  ON_CHUNK_LENGTH: 19,
  ON_CHUNK_EXTENSION_NAME: 20,
  ON_CHUNK_EXTENSION_VALUE: 21,
  ON_CHUNK: 22,
  ON_BODY: 23,
  ON_DATA: 24,
  ON_TRAILER_NAME: 25,
  ON_TRAILER_VALUE: 26,
  ON_TRAILERS: 27,
  0: 'ON_STATE_CHANGE',
  1: 'ON_ERROR',
  2: 'ON_FINISH',
  3: 'ON_MESSAGE_START',
  4: 'ON_MESSAGE_COMPLETE',
  5: 'ON_REQUEST',
  6: 'ON_RESPONSE',
  7: 'ON_RESET',
  8: 'ON_METHOD',
  9: 'ON_URL',
  10: 'ON_PROTOCOL',
  11: 'ON_VERSION',
  12: 'ON_STATUS',
  13: 'ON_REASON',
  14: 'ON_HEADER_NAME',
  15: 'ON_HEADER_VALUE',
  16: 'ON_HEADERS',
  17: 'ON_CONNECT',
  18: 'ON_UPGRADE',
  19: 'ON_CHUNK_LENGTH',
  20: 'ON_CHUNK_EXTENSION_NAME',
  21: 'ON_CHUNK_EXTENSION_VALUE',
  22: 'ON_CHUNK',
  23: 'ON_BODY',
  24: 'ON_DATA',
  25: 'ON_TRAILER_NAME',
  26: 'ON_TRAILER_VALUE',
  27: 'ON_TRAILERS'
})
const States = Object.freeze({
  START: 0,
  FINISH: 1,
  ERROR: 2,
  AUTODETECT: 3,
  REQUEST: 4,
  REQUEST_METHOD: 5,
  REQUEST_URL: 6,
  REQUEST_PROTOCOL: 7,
  REQUEST_VERSION: 8,
  RESPONSE: 9,
  RESPONSE_VERSION: 10,
  RESPONSE_STATUS: 11,
  RESPONSE_REASON: 12,
  HEADER_NAME: 13,
  HEADER_TRANSFER_ENCODING: 14,
  HEADER_CONTENT_LENGTH: 15,
  HEADER_CONNECTION: 16,
  HEADER_VALUE: 17,
  HEADERS: 18,
  COMPLETE: 19,
  TUNNEL: 20,
  BODY_VIA_CONTENT_LENGTH: 21,
  BODY_WITH_NO_LENGTH: 22,
  CHUNK_LENGTH: 23,
  CHUNK_EXTENSION_NAME: 24,
  CHUNK_EXTENSION_VALUE: 25,
  CHUNK_EXTENSION_QUOTED_VALUE: 26,
  CHUNK_DATA: 27,
  CHUNK_END: 28,
  CRLF_AFTER_LAST_CHUNK: 29,
  TRAILER_NAME: 30,
  TRAILER_VALUE: 31,
  TRAILERS: 32,
  0: 'START',
  1: 'FINISH',
  2: 'ERROR',
  3: 'AUTODETECT',
  4: 'REQUEST',
  5: 'REQUEST_METHOD',
  6: 'REQUEST_URL',
  7: 'REQUEST_PROTOCOL',
  8: 'REQUEST_VERSION',
  9: 'RESPONSE',
  10: 'RESPONSE_VERSION',
  11: 'RESPONSE_STATUS',
  12: 'RESPONSE_REASON',
  13: 'HEADER_NAME',
  14: 'HEADER_TRANSFER_ENCODING',
  15: 'HEADER_CONTENT_LENGTH',
  16: 'HEADER_CONNECTION',
  17: 'HEADER_VALUE',
  18: 'HEADERS',
  19: 'COMPLETE',
  20: 'TUNNEL',
  21: 'BODY_VIA_CONTENT_LENGTH',
  22: 'BODY_WITH_NO_LENGTH',
  23: 'CHUNK_LENGTH',
  24: 'CHUNK_EXTENSION_NAME',
  25: 'CHUNK_EXTENSION_VALUE',
  26: 'CHUNK_EXTENSION_QUOTED_VALUE',
  27: 'CHUNK_DATA',
  28: 'CHUNK_END',
  29: 'CRLF_AFTER_LAST_CHUNK',
  30: 'TRAILER_NAME',
  31: 'TRAILER_VALUE',
  32: 'TRAILERS'
})
function noop() {}
const wasmModule = new WebAssembly.Module(loadWASM())
function setup(env = {}) {
  // Create the WASM instance
  const instance = new WebAssembly.Instance(wasmModule, {
    env: {
      logger: noop,
      on_state_change: noop,
      on_error: noop,
      on_finish: noop,
      on_message_start: noop,
      on_message_complete: noop,
      on_request: noop,
      on_response: noop,
      on_reset: noop,
      on_method: noop,
      on_url: noop,
      on_protocol: noop,
      on_version: noop,
      on_status: noop,
      on_reason: noop,
      on_header_name: noop,
      on_header_value: noop,
      on_headers: noop,
      on_connect: noop,
      on_upgrade: noop,
      on_chunk_length: noop,
      on_chunk_extension_name: noop,
      on_chunk_extension_value: noop,
      on_chunk: noop,
      on_body: noop,
      on_data: noop,
      on_trailer_name: noop,
      on_trailer_value: noop,
      on_trailers: noop,
      ...env
    }
  })
  const wasm = instance.exports
  const milo = {
    version: {
      major: 0,
      minor: 2,
      patch: 0
    },
    memory: wasm.memory,
    alloc: alloc.bind(wasm),
    create: create.bind(wasm),
    destroy: destroy.bind(wasm),
    parse: parse.bind(wasm),
    fail: fail.bind(wasm),
    dealloc: wasm.dealloc,
    clear: wasm.clear,
    finish: wasm.finish,
    pause: wasm.pause,
    reset: wasm.reset,
    resume: wasm.resume,
    getMode: getMode.bind(wasm),
    isPaused: isPaused.bind(wasm),
    manageUnconsumed: manageUnconsumed.bind(wasm),
    continueWithoutData: continueWithoutData.bind(wasm),
    isConnect: isConnect.bind(wasm),
    skipBody: skipBody.bind(wasm),
    getState: getState.bind(wasm),
    getPosition: getPosition.bind(wasm),
    getParsed: getParsed.bind(wasm),
    getErrorCode: getErrorCode.bind(wasm),
    getMessageType: getMessageType.bind(wasm),
    getMethod: getMethod.bind(wasm),
    getStatus: getStatus.bind(wasm),
    getVersionMajor: getVersionMajor.bind(wasm),
    getVersionMinor: getVersionMinor.bind(wasm),
    getConnection: getConnection.bind(wasm),
    getContentLength: getContentLength.bind(wasm),
    getChunkSize: getChunkSize.bind(wasm),
    getRemainingContentLength: getRemainingContentLength.bind(wasm),
    getRemainingChunkSize: getRemainingChunkSize.bind(wasm),
    hasContentLength: hasContentLength.bind(wasm),
    hasChunkedTransferEncoding: hasChunkedTransferEncoding.bind(wasm),
    hasUpgrade: hasUpgrade.bind(wasm),
    hasTrailers: hasTrailers.bind(wasm),
    getErrorDescription: getErrorDescription.bind(wasm),
    setContinueWithoutData: setContinueWithoutData.bind(wasm),
    setIsConnect: setIsConnect.bind(wasm),
    setManageUnconsumed: setManageUnconsumed.bind(wasm),
    setMode: setMode.bind(wasm),
    setSkipBody: setSkipBody.bind(wasm),
    MessageTypes,
    Errors,
    Methods,
    Connections,
    Callbacks,
    States,
    MESSAGE_TYPE_AUTODETECT: 0,
    MESSAGE_TYPE_REQUEST: 1,
    MESSAGE_TYPE_RESPONSE: 2,
    CONNECTION_KEEPALIVE: 0,
    CONNECTION_CLOSE: 1,
    CONNECTION_UPGRADE: 2,
    METHOD_ACL: 0,
    METHOD_BASELINE_CONTROL: 1,
    METHOD_BIND: 2,
    METHOD_CHECKIN: 3,
    METHOD_CHECKOUT: 4,
    METHOD_CONNECT: 5,
    METHOD_COPY: 6,
    METHOD_DELETE: 7,
    METHOD_GET: 8,
    METHOD_HEAD: 9,
    METHOD_LABEL: 10,
    METHOD_LINK: 11,
    METHOD_LOCK: 12,
    METHOD_MERGE: 13,
    METHOD_MKACTIVITY: 14,
    METHOD_MKCALENDAR: 15,
    METHOD_MKCOL: 16,
    METHOD_MKREDIRECTREF: 17,
    METHOD_MKWORKSPACE: 18,
    METHOD_MOVE: 19,
    METHOD_OPTIONS: 20,
    METHOD_ORDERPATCH: 21,
    METHOD_PATCH: 22,
    METHOD_POST: 23,
    METHOD_PRI: 24,
    METHOD_PROPFIND: 25,
    METHOD_PROPPATCH: 26,
    METHOD_PUT: 27,
    METHOD_REBIND: 28,
    METHOD_REPORT: 29,
    METHOD_SEARCH: 30,
    METHOD_TRACE: 31,
    METHOD_UNBIND: 32,
    METHOD_UNCHECKOUT: 33,
    METHOD_UNLINK: 34,
    METHOD_UNLOCK: 35,
    METHOD_UPDATE: 36,
    METHOD_UPDATEREDIRECTREF: 37,
    METHOD_VERSION_CONTROL: 38,
    METHOD_DESCRIBE: 39,
    METHOD_GET_PARAMETER: 40,
    METHOD_PAUSE: 41,
    METHOD_PLAY: 42,
    METHOD_PLAY_NOTIFY: 43,
    METHOD_REDIRECT: 44,
    METHOD_SETUP: 45,
    METHOD_SET_PARAMETER: 46,
    METHOD_TEARDOWN: 47,
    METHOD_PURGE: 48,
    CALLBACK_ON_STATE_CHANGE: 0,
    CALLBACK_ON_ERROR: 1,
    CALLBACK_ON_FINISH: 2,
    CALLBACK_ON_MESSAGE_START: 3,
    CALLBACK_ON_MESSAGE_COMPLETE: 4,
    CALLBACK_ON_REQUEST: 5,
    CALLBACK_ON_RESPONSE: 6,
    CALLBACK_ON_RESET: 7,
    CALLBACK_ON_METHOD: 8,
    CALLBACK_ON_URL: 9,
    CALLBACK_ON_PROTOCOL: 10,
    CALLBACK_ON_VERSION: 11,
    CALLBACK_ON_STATUS: 12,
    CALLBACK_ON_REASON: 13,
    CALLBACK_ON_HEADER_NAME: 14,
    CALLBACK_ON_HEADER_VALUE: 15,
    CALLBACK_ON_HEADERS: 16,
    CALLBACK_ON_CONNECT: 17,
    CALLBACK_ON_UPGRADE: 18,
    CALLBACK_ON_CHUNK_LENGTH: 19,
    CALLBACK_ON_CHUNK_EXTENSION_NAME: 20,
    CALLBACK_ON_CHUNK_EXTENSION_VALUE: 21,
    CALLBACK_ON_CHUNK: 22,
    CALLBACK_ON_BODY: 23,
    CALLBACK_ON_DATA: 24,
    CALLBACK_ON_TRAILER_NAME: 25,
    CALLBACK_ON_TRAILER_VALUE: 26,
    CALLBACK_ON_TRAILERS: 27,
    ERROR_NONE: 0,
    ERROR_USER: 1,
    ERROR_CALLBACK_ERROR: 2,
    ERROR_UNEXPECTED_STATE: 3,
    ERROR_UNEXPECTED_DATA: 4,
    ERROR_UNEXPECTED_EOF: 5,
    ERROR_UNEXPECTED_CHARACTER: 6,
    ERROR_UNEXPECTED_CONTENT_LENGTH: 7,
    ERROR_UNEXPECTED_TRANSFER_ENCODING: 8,
    ERROR_UNEXPECTED_CONTENT: 9,
    ERROR_UNEXPECTED_TRAILERS: 10,
    ERROR_INVALID_VERSION: 11,
    ERROR_INVALID_STATUS: 12,
    ERROR_INVALID_CONTENT_LENGTH: 13,
    ERROR_INVALID_TRANSFER_ENCODING: 14,
    ERROR_INVALID_CHUNK_SIZE: 15,
    ERROR_MISSING_CONNECTION_UPGRADE: 16,
    ERROR_UNSUPPORTED_HTTP_VERSION: 17,
    STATE_START: 0,
    STATE_FINISH: 1,
    STATE_ERROR: 2,
    STATE_AUTODETECT: 3,
    STATE_REQUEST: 4,
    STATE_REQUEST_METHOD: 5,
    STATE_REQUEST_URL: 6,
    STATE_REQUEST_PROTOCOL: 7,
    STATE_REQUEST_VERSION: 8,
    STATE_RESPONSE: 9,
    STATE_RESPONSE_VERSION: 10,
    STATE_RESPONSE_STATUS: 11,
    STATE_RESPONSE_REASON: 12,
    STATE_HEADER_NAME: 13,
    STATE_HEADER_TRANSFER_ENCODING: 14,
    STATE_HEADER_CONTENT_LENGTH: 15,
    STATE_HEADER_CONNECTION: 16,
    STATE_HEADER_VALUE: 17,
    STATE_HEADERS: 18,
    STATE_COMPLETE: 19,
    STATE_TUNNEL: 20,
    STATE_BODY_VIA_CONTENT_LENGTH: 21,
    STATE_BODY_WITH_NO_LENGTH: 22,
    STATE_CHUNK_LENGTH: 23,
    STATE_CHUNK_EXTENSION_NAME: 24,
    STATE_CHUNK_EXTENSION_VALUE: 25,
    STATE_CHUNK_EXTENSION_QUOTED_VALUE: 26,
    STATE_CHUNK_DATA: 27,
    STATE_CHUNK_END: 28,
    STATE_CRLF_AFTER_LAST_CHUNK: 29,
    STATE_TRAILER_NAME: 30,
    STATE_TRAILER_VALUE: 31,
    STATE_TRAILERS: 32,
    FLAG_DEBUG: false
  }
  return milo
}
function simpleCreate(spans, create) {
  const parser = create()
  spans[parser] = []
  return parser
}
function simpleDestroy(spans, destroy) {
  spans[parser] = undefined
  destroy(parser)
}
function simpleCallback(spans, type, parser, at, len) {
  spans[parser].push([type, at, len])
}
function simpleParser() {
  const spans = {}
  const milo = setup({
    on_state_change: simpleCallback.bind(null, spans, 0),
    on_error: simpleCallback.bind(null, spans, 1),
    on_finish: simpleCallback.bind(null, spans, 2),
    on_message_start: simpleCallback.bind(null, spans, 3),
    on_message_complete: simpleCallback.bind(null, spans, 4),
    on_request: simpleCallback.bind(null, spans, 5),
    on_response: simpleCallback.bind(null, spans, 6),
    on_reset: simpleCallback.bind(null, spans, 7),
    on_method: simpleCallback.bind(null, spans, 8),
    on_url: simpleCallback.bind(null, spans, 9),
    on_protocol: simpleCallback.bind(null, spans, 10),
    on_version: simpleCallback.bind(null, spans, 11),
    on_status: simpleCallback.bind(null, spans, 12),
    on_reason: simpleCallback.bind(null, spans, 13),
    on_header_name: simpleCallback.bind(null, spans, 14),
    on_header_value: simpleCallback.bind(null, spans, 15),
    on_headers: simpleCallback.bind(null, spans, 16),
    on_connect: simpleCallback.bind(null, spans, 17),
    on_upgrade: simpleCallback.bind(null, spans, 18),
    on_chunk_length: simpleCallback.bind(null, spans, 19),
    on_chunk_extension_name: simpleCallback.bind(null, spans, 20),
    on_chunk_extension_value: simpleCallback.bind(null, spans, 21),
    on_chunk: simpleCallback.bind(null, spans, 22),
    on_body: simpleCallback.bind(null, spans, 23),
    on_data: simpleCallback.bind(null, spans, 24),
    on_trailer_name: simpleCallback.bind(null, spans, 25),
    on_trailer_value: simpleCallback.bind(null, spans, 26),
    on_trailers: simpleCallback.bind(null, spans, 27)
  })
  milo.spans = spans
  milo.create = simpleCreate.bind(null, spans, milo.create)
  milo.destroy = simpleDestroy.bind(null, spans, milo.destroy)
  return milo
}
module.exports = {
  wasmModule,
  logger,
  setup,
  simple: simpleParser()
}
