/* tslint:disable */
/* eslint-disable */
/**
* @param {number} len
* @returns {number}
*/
export function alloc(len: number): number;
/**
* @param {number} ptr
* @param {number} len
*/
export function free(ptr: number, len: number): void;
/**
* Creates a new parser.
* @param {number | undefined} [id]
* @returns {number}
*/
export function create(id?: number): number;
/**
* Destroys a parser.
* @param {number} raw
*/
export function destroy(raw: number): void;
/**
* Resets a parser. The second parameters specifies if to also reset the
* parsed counter.
* @param {number} raw
* @param {boolean} keep_parsed
*/
export function reset(raw: number, keep_parsed: boolean): void;
/**
* Clears all values in the parser.
*
* Persisted fields, unconsumed data and the position are not cleared.
* @param {number} raw
*/
export function clear(raw: number): void;
/**
* @param {number} raw
* @param {number} data
* @param {number} limit
* @returns {number}
*/
export function parse(raw: number, data: number, limit: number): number;
/**
* Pauses the parser. It will have to be resumed via `milo_resume`.
* @param {number} raw
*/
export function pause(raw: number): void;
/**
* Resumes the parser.
* @param {number} raw
*/
export function resume(raw: number): void;
/**
* Marks the parser as finished. Any new data received via `parse` will
* put the parser in the error state.
* @param {number} raw
*/
export function finish(raw: number): void;
/**
* Marks the parser as failed.
* @param {number} raw
* @param {number} code
* @param {string} reason
*/
export function fail(raw: number, code: number, reason: string): void;
/**
* Clear the parser offsets.
* @param {number} raw
*/
export function clearOffsets(raw: number): void;
/**
* Returns the current parser's state as string.
* @param {number} raw
* @returns {string}
*/
export function getStateString(raw: number): string;
/**
* Returns the current parser's error state as string.
* @param {number} raw
* @returns {string}
*/
export function getErrorCodeString(raw: number): string;
/**
* Returns the current parser's error descrition.
* @param {number} raw
* @returns {string}
*/
export function getErrorDescriptionString(raw: number): string;
/**
* @param {number} raw
* @returns {number}
*/
export function getState(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getPosition(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getErrorCode(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getErrorDescriptionLen(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getUnconsumedLen(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getId(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getMode(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getMessageType(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getMethod(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getStatus(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getVersionMajor(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getVersionMinor(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getConnection(raw: number): number;
/**
* @param {number} raw
* @returns {bigint}
*/
export function getParsed(raw: number): bigint;
/**
* @param {number} raw
* @returns {bigint}
*/
export function getContentLength(raw: number): bigint;
/**
* @param {number} raw
* @returns {bigint}
*/
export function getChunkSize(raw: number): bigint;
/**
* @param {number} raw
* @returns {bigint}
*/
export function getRemainingContentLength(raw: number): bigint;
/**
* @param {number} raw
* @returns {bigint}
*/
export function getRemainingChunkSize(raw: number): bigint;
/**
* @param {number} raw
* @returns {boolean}
*/
export function isPaused(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function manageUnconsumed(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function continueWithoutData(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function isConnect(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function hasContentLength(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function hasChunkedTransferEncoding(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function hasUpgrade(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function hasTrailers(raw: number): boolean;
/**
* @param {number} raw
* @returns {boolean}
*/
export function skipBody(raw: number): boolean;
/**
* @param {number} raw
* @returns {number}
*/
export function getOffsets(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getUnconsumed(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getErrorDescription(raw: number): number;
/**
* @param {number} raw
* @returns {number}
*/
export function getOwner(raw: number): number;
/**
* @param {number} raw
* @returns {any}
*/
export function getCallbackError(raw: number): any;
/**
* @param {number} raw
* @param {number} value
*/
export function setId(raw: number, value: number): void;
/**
* @param {number} raw
* @param {number} value
*/
export function setMode(raw: number, value: number): void;
/**
* @param {number} raw
* @param {boolean} value
*/
export function setManageUnconsumed(raw: number, value: boolean): void;
/**
* @param {number} raw
* @param {boolean} value
*/
export function setSkipBody(raw: number, value: boolean): void;
/**
* @param {number} raw
* @param {boolean} value
*/
export function setIsConnect(raw: number, value: boolean): void;
/**
*/
export enum MessageTypes {
  AUTODETECT = 0,
  REQUEST = 1,
  RESPONSE = 2,
}
/**
*/
export enum Connections {
  KEEPALIVE = 0,
  CLOSE = 1,
  UPGRADE = 2,
}
/**
*/
export enum Methods {
  ACL = 0,
  BASELINE_CONTROL = 1,
  BIND = 2,
  CHECKIN = 3,
  CHECKOUT = 4,
  CONNECT = 5,
  COPY = 6,
  DELETE = 7,
  GET = 8,
  HEAD = 9,
  LABEL = 10,
  LINK = 11,
  LOCK = 12,
  MERGE = 13,
  MKACTIVITY = 14,
  MKCALENDAR = 15,
  MKCOL = 16,
  MKREDIRECTREF = 17,
  MKWORKSPACE = 18,
  MOVE = 19,
  OPTIONS = 20,
  ORDERPATCH = 21,
  PATCH = 22,
  POST = 23,
  PRI = 24,
  PROPFIND = 25,
  PROPPATCH = 26,
  PUT = 27,
  REBIND = 28,
  REPORT = 29,
  SEARCH = 30,
  TRACE = 31,
  UNBIND = 32,
  UNCHECKOUT = 33,
  UNLINK = 34,
  UNLOCK = 35,
  UPDATE = 36,
  UPDATEREDIRECTREF = 37,
  VERSION_CONTROL = 38,
  DESCRIBE = 39,
  GET_PARAMETER = 40,
  PAUSE = 41,
  PLAY = 42,
  PLAY_NOTIFY = 43,
  REDIRECT = 44,
  SETUP = 45,
  SET_PARAMETER = 46,
  TEARDOWN = 47,
  PURGE = 48,
}
/**
*/
export enum States {
  START = 0,
  FINISH = 1,
  ERROR = 2,
  AUTODETECT = 3,
  REQUEST = 4,
  REQUEST_METHOD = 5,
  REQUEST_URL = 6,
  REQUEST_PROTOCOL = 7,
  REQUEST_VERSION = 8,
  RESPONSE = 9,
  RESPONSE_VERSION = 10,
  RESPONSE_STATUS = 11,
  RESPONSE_REASON = 12,
  HEADER_NAME = 13,
  HEADER_TRANSFER_ENCODING = 14,
  HEADER_CONTENT_LENGTH = 15,
  HEADER_CONNECTION = 16,
  HEADER_VALUE = 17,
  HEADERS = 18,
  TUNNEL = 19,
  BODY_VIA_CONTENT_LENGTH = 20,
  BODY_WITH_NO_LENGTH = 21,
  CHUNK_LENGTH = 22,
  CHUNK_EXTENSION_NAME = 23,
  CHUNK_EXTENSION_VALUE = 24,
  CHUNK_EXTENSION_QUOTED_VALUE = 25,
  CHUNK_DATA = 26,
  CHUNK_END = 27,
  CRLF_AFTER_LAST_CHUNK = 28,
  TRAILER_NAME = 29,
  TRAILER_VALUE = 30,
}
/**
*/
export enum Errors {
  NONE = 0,
  UNEXPECTED_DATA = 1,
  UNEXPECTED_EOF = 2,
  CALLBACK_ERROR = 3,
  UNEXPECTED_CHARACTER = 4,
  UNEXPECTED_CONTENT_LENGTH = 5,
  UNEXPECTED_TRANSFER_ENCODING = 6,
  UNEXPECTED_CONTENT = 7,
  UNEXPECTED_TRAILERS = 8,
  INVALID_VERSION = 9,
  INVALID_STATUS = 10,
  INVALID_CONTENT_LENGTH = 11,
  INVALID_TRANSFER_ENCODING = 12,
  INVALID_CHUNK_SIZE = 13,
  MISSING_CONNECTION_UPGRADE = 14,
  UNSUPPORTED_HTTP_VERSION = 15,
}
/**
*/
export enum Offsets {
  MESSAGE_START = 0,
  MESSAGE_COMPLETE = 1,
  METHOD = 2,
  URL = 3,
  PROTOCOL = 4,
  VERSION = 5,
  STATUS = 6,
  REASON = 7,
  HEADER_NAME = 8,
  HEADER_VALUE = 9,
  HEADERS = 10,
  CHUNK_LENGTH = 11,
  CHUNK_EXTENSION_NAME = 12,
  CHUNK_EXTENSION_VALUE = 13,
  CHUNK = 14,
  DATA = 15,
  BODY = 16,
  TRAILER_NAME = 17,
  TRAILER_VALUE = 18,
  TRAILERS = 19,
}
/**
*/
export enum Callbacks {
  beforeStateChange = 0,
  afterStateChange = 1,
  onError = 2,
  onFinish = 3,
  onMessageStart = 4,
  onMessageComplete = 5,
  onRequest = 6,
  onResponse = 7,
  onReset = 8,
  onMethod = 9,
  onUrl = 10,
  onProtocol = 11,
  onVersion = 12,
  onStatus = 13,
  onReason = 14,
  onHeaderName = 15,
  onHeaderValue = 16,
  onHeaders = 17,
  onConnect = 18,
  onUpgrade = 19,
  onChunkLength = 20,
  onChunkExtensionName = 21,
  onChunkExtensionValue = 22,
  onChunk = 23,
  onBody = 24,
  onData = 25,
  onTrailerName = 26,
  onTrailerValue = 27,
  onTrailers = 28,
}


/*--- MILO MODIFICATIONS ---*/

export declare const AUTODETECT: number = 0
export declare const REQUEST: number = 1
export declare const RESPONSE: number = 2
export declare const CONNECTION_KEEPALIVE: number = 0
export declare const CONNECTION_CLOSE: number = 1
export declare const CONNECTION_UPGRADE: number = 2
export declare const METHOD_ACL: number = 0
export declare const METHOD_BASELINE_CONTROL: number = 1
export declare const METHOD_BIND: number = 2
export declare const METHOD_CHECKIN: number = 3
export declare const METHOD_CHECKOUT: number = 4
export declare const METHOD_CONNECT: number = 5
export declare const METHOD_COPY: number = 6
export declare const METHOD_DELETE: number = 7
export declare const METHOD_GET: number = 8
export declare const METHOD_HEAD: number = 9
export declare const METHOD_LABEL: number = 10
export declare const METHOD_LINK: number = 11
export declare const METHOD_LOCK: number = 12
export declare const METHOD_MERGE: number = 13
export declare const METHOD_MKACTIVITY: number = 14
export declare const METHOD_MKCALENDAR: number = 15
export declare const METHOD_MKCOL: number = 16
export declare const METHOD_MKREDIRECTREF: number = 17
export declare const METHOD_MKWORKSPACE: number = 18
export declare const METHOD_MOVE: number = 19
export declare const METHOD_OPTIONS: number = 20
export declare const METHOD_ORDERPATCH: number = 21
export declare const METHOD_PATCH: number = 22
export declare const METHOD_POST: number = 23
export declare const METHOD_PRI: number = 24
export declare const METHOD_PROPFIND: number = 25
export declare const METHOD_PROPPATCH: number = 26
export declare const METHOD_PUT: number = 27
export declare const METHOD_REBIND: number = 28
export declare const METHOD_REPORT: number = 29
export declare const METHOD_SEARCH: number = 30
export declare const METHOD_TRACE: number = 31
export declare const METHOD_UNBIND: number = 32
export declare const METHOD_UNCHECKOUT: number = 33
export declare const METHOD_UNLINK: number = 34
export declare const METHOD_UNLOCK: number = 35
export declare const METHOD_UPDATE: number = 36
export declare const METHOD_UPDATEREDIRECTREF: number = 37
export declare const METHOD_VERSION_CONTROL: number = 38
export declare const METHOD_DESCRIBE: number = 39
export declare const METHOD_GET_PARAMETER: number = 40
export declare const METHOD_PAUSE: number = 41
export declare const METHOD_PLAY: number = 42
export declare const METHOD_PLAY_NOTIFY: number = 43
export declare const METHOD_REDIRECT: number = 44
export declare const METHOD_SETUP: number = 45
export declare const METHOD_SET_PARAMETER: number = 46
export declare const METHOD_TEARDOWN: number = 47
export declare const METHOD_PURGE: number = 48
export declare const CALLBACKS_BEFORE_STATE_CHANGE: number = 0
export declare const CALLBACKS_AFTER_STATE_CHANGE: number = 1
export declare const CALLBACKS_ON_ERROR: number = 2
export declare const CALLBACKS_ON_FINISH: number = 3
export declare const CALLBACKS_ON_MESSAGE_START: number = 4
export declare const CALLBACKS_ON_MESSAGE_COMPLETE: number = 5
export declare const CALLBACKS_ON_REQUEST: number = 6
export declare const CALLBACKS_ON_RESPONSE: number = 7
export declare const CALLBACKS_ON_RESET: number = 8
export declare const CALLBACKS_ON_METHOD: number = 9
export declare const CALLBACKS_ON_URL: number = 10
export declare const CALLBACKS_ON_PROTOCOL: number = 11
export declare const CALLBACKS_ON_VERSION: number = 12
export declare const CALLBACKS_ON_STATUS: number = 13
export declare const CALLBACKS_ON_REASON: number = 14
export declare const CALLBACKS_ON_HEADER_NAME: number = 15
export declare const CALLBACKS_ON_HEADER_VALUE: number = 16
export declare const CALLBACKS_ON_HEADERS: number = 17
export declare const CALLBACKS_ON_CONNECT: number = 18
export declare const CALLBACKS_ON_UPGRADE: number = 19
export declare const CALLBACKS_ON_CHUNK_LENGTH: number = 20
export declare const CALLBACKS_ON_CHUNK_EXTENSION_NAME: number = 21
export declare const CALLBACKS_ON_CHUNK_EXTENSION_VALUE: number = 22
export declare const CALLBACKS_ON_CHUNK: number = 23
export declare const CALLBACKS_ON_BODY: number = 24
export declare const CALLBACKS_ON_DATA: number = 25
export declare const CALLBACKS_ON_TRAILER_NAME: number = 26
export declare const CALLBACKS_ON_TRAILER_VALUE: number = 27
export declare const CALLBACKS_ON_TRAILERS: number = 28
export declare const ERROR_NONE: number = 0
export declare const ERROR_UNEXPECTED_DATA: number = 1
export declare const ERROR_UNEXPECTED_EOF: number = 2
export declare const ERROR_CALLBACK_ERROR: number = 3
export declare const ERROR_UNEXPECTED_CHARACTER: number = 4
export declare const ERROR_UNEXPECTED_CONTENT_LENGTH: number = 5
export declare const ERROR_UNEXPECTED_TRANSFER_ENCODING: number = 6
export declare const ERROR_UNEXPECTED_CONTENT: number = 7
export declare const ERROR_UNEXPECTED_TRAILERS: number = 8
export declare const ERROR_INVALID_VERSION: number = 9
export declare const ERROR_INVALID_STATUS: number = 10
export declare const ERROR_INVALID_CONTENT_LENGTH: number = 11
export declare const ERROR_INVALID_TRANSFER_ENCODING: number = 12
export declare const ERROR_INVALID_CHUNK_SIZE: number = 13
export declare const ERROR_MISSING_CONNECTION_UPGRADE: number = 14
export declare const ERROR_UNSUPPORTED_HTTP_VERSION: number = 15
export declare const OFFSET_MESSAGE_START: number = 0
export declare const OFFSET_MESSAGE_COMPLETE: number = 1
export declare const OFFSET_METHOD: number = 2
export declare const OFFSET_URL: number = 3
export declare const OFFSET_PROTOCOL: number = 4
export declare const OFFSET_VERSION: number = 5
export declare const OFFSET_STATUS: number = 6
export declare const OFFSET_REASON: number = 7
export declare const OFFSET_HEADER_NAME: number = 8
export declare const OFFSET_HEADER_VALUE: number = 9
export declare const OFFSET_HEADERS: number = 10
export declare const OFFSET_CHUNK_LENGTH: number = 11
export declare const OFFSET_CHUNK_EXTENSION_NAME: number = 12
export declare const OFFSET_CHUNK_EXTENSION_VALUE: number = 13
export declare const OFFSET_CHUNK: number = 14
export declare const OFFSET_DATA: number = 15
export declare const OFFSET_BODY: number = 16
export declare const OFFSET_TRAILER_NAME: number = 17
export declare const OFFSET_TRAILER_VALUE: number = 18
export declare const OFFSET_TRAILERS: number = 19
export declare const STATE_START: number = 0
export declare const STATE_FINISH: number = 1
export declare const STATE_ERROR: number = 2
export declare const STATE_AUTODETECT: number = 3
export declare const STATE_REQUEST: number = 4
export declare const STATE_REQUEST_METHOD: number = 5
export declare const STATE_REQUEST_URL: number = 6
export declare const STATE_REQUEST_PROTOCOL: number = 7
export declare const STATE_REQUEST_VERSION: number = 8
export declare const STATE_RESPONSE: number = 9
export declare const STATE_RESPONSE_VERSION: number = 10
export declare const STATE_RESPONSE_STATUS: number = 11
export declare const STATE_RESPONSE_REASON: number = 12
export declare const STATE_HEADER_NAME: number = 13
export declare const STATE_HEADER_TRANSFER_ENCODING: number = 14
export declare const STATE_HEADER_CONTENT_LENGTH: number = 15
export declare const STATE_HEADER_CONNECTION: number = 16
export declare const STATE_HEADER_VALUE: number = 17
export declare const STATE_HEADERS: number = 18
export declare const STATE_TUNNEL: number = 19
export declare const STATE_BODY_VIA_CONTENT_LENGTH: number = 20
export declare const STATE_BODY_WITH_NO_LENGTH: number = 21
export declare const STATE_CHUNK_LENGTH: number = 22
export declare const STATE_CHUNK_EXTENSION_NAME: number = 23
export declare const STATE_CHUNK_EXTENSION_VALUE: number = 24
export declare const STATE_CHUNK_EXTENSION_QUOTED_VALUE: number = 25
export declare const STATE_CHUNK_DATA: number = 26
export declare const STATE_CHUNK_END: number = 27
export declare const STATE_CRLF_AFTER_LAST_CHUNK: number = 28
export declare const STATE_TRAILER_NAME: number = 29
export declare const STATE_TRAILER_VALUE: number = 30
export declare const FLAGS_DEBUG: boolean = false
export declare const memory: WebAssembly.Memory