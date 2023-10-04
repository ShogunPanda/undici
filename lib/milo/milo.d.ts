/* tslint:disable */
/* eslint-disable */
/**
*/
export enum MessageType {
  AUTODETECT = 0,
  REQUEST = 1,
  RESPONSE = 2,
}
/**
*/
export enum Connection {
  KEEPALIVE = 0,
  CLOSE = 1,
  UPGRADE = 2,
}
/**
*/
export enum Method {
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
export enum State {
  START = 0,
  FINISH = 1,
  ERROR = 2,
  MESSAGE = 3,
  END = 4,
  REQUEST = 5,
  REQUEST_METHOD = 6,
  REQUEST_URL = 7,
  REQUEST_PROTOCOL = 8,
  REQUEST_VERSION = 9,
  RESPONSE = 10,
  RESPONSE_VERSION = 11,
  RESPONSE_STATUS = 12,
  RESPONSE_REASON = 13,
  HEADER_NAME = 14,
  HEADER_TRANSFER_ENCODING = 15,
  HEADER_CONTENT_LENGTH = 16,
  HEADER_CONNECTION = 17,
  HEADER_VALUE = 18,
  HEADERS = 19,
  BODY = 20,
  TUNNEL = 21,
  BODY_VIA_CONTENT_LENGTH = 22,
  BODY_WITH_NO_LENGTH = 23,
  CHUNK_LENGTH = 24,
  CHUNK_EXTENSION_NAME = 25,
  CHUNK_EXTENSION_VALUE = 26,
  CHUNK_EXTENSION_QUOTED_VALUE = 27,
  CHUNK_DATA = 28,
  CHUNK_END = 29,
  CRLF_AFTER_LAST_CHUNK = 30,
  TRAILER_NAME = 31,
  TRAILER_VALUE = 32,
}
/**
*/
export enum Error {
  NONE = 0,
  UNEXPECTED_DATA = 1,
  UNEXPECTED_EOF = 2,
  CALLBACK_ERROR = 3,
  UNEXPECTED_CHARACTER = 4,
  UNEXPECTED_CONTENT_LENGTH = 5,
  UNEXPECTED_TRANSFER_ENCODING = 6,
  UNEXPECTED_CONTENT = 7,
  UNTRAILERS = 8,
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
export class Parser {
  free(): void;
/**
* @returns {Parser}
*/
  static new(): Parser;
/**
* Resets a parser. The second parameters specifies if to also reset the
* position counter.
* @param {boolean} keep_position
*/
  reset(keep_position: boolean): void;
/**
* Clears all values in the parser.
*
* Persisted fields, unconsumed data and the position are not cleared.
*/
  clear(): void;
/**
* Pauses the parser. It will have to be resumed via `milo_resume`.
*/
  pause(): void;
/**
* Resumes the parser.
*/
  resume(): void;
/**
* Marks the parser as finished. Any new data received via `parse` will
* put the parser in the error state.
*/
  finish(): void;
/**
* Creates a new parser.
* @param {number | undefined} id
*/
  constructor(id?: number);
/**
* @param {Uint8Array} data
* @param {number} limit
* @returns {number}
*/
  parse(data: Uint8Array, limit: number): number;
/**
* @param {Function} cb
*/
  setBeforeStateChange(cb: Function): void;
/**
* @param {Function} cb
*/
  setAfterStateChange(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnError(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnFinish(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnMessageStart(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnMessageComplete(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnRequest(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnResponse(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnReset(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnMethod(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnUrl(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnProtocol(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnVersion(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnStatus(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnReason(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnHeaderName(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnHeaderValue(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnHeaders(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnConnect(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnUpgrade(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnChunkLength(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnChunkExtensionName(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnChunkExtensionValue(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnBody(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnData(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnTrailerName(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnTrailerValue(cb: Function): void;
/**
* @param {Function} cb
*/
  setOnTrailers(cb: Function): void;
/**
*/
  readonly chunkSize: bigint;
/**
*/
  readonly connection: number;
/**
*/
  readonly contentLength: bigint;
/**
*/
  readonly continueWithoutData: boolean;
/**
*/
  readonly errorCode: number;
/**
* Returns the current parser's error state as string.
*/
  readonly errorCodeString: string;
/**
* Returns the current parser's error descrition.
*/
  readonly errorDescription: string;
/**
*/
  readonly hasChunkedTransferEncoding: boolean;
/**
*/
  readonly hasContentLength: boolean;
/**
*/
  readonly hasTrailers: boolean;
/**
*/
  readonly hasUpgrade: boolean;
/**
*/
  id: number;
/**
*/
  isConnect: boolean;
/**
*/
  readonly messageType: number;
/**
*/
  readonly method: number;
/**
*/
  mode: number;
/**
*/
  readonly paused: boolean;
/**
*/
  readonly position: bigint;
/**
*/
  readonly remainingChunkSize: bigint;
/**
*/
  readonly remainingContentLength: bigint;
/**
*/
  skipBody: boolean;
/**
*/
  readonly state: number;
/**
* Returns the current parser's state as string.
*/
  readonly stateString: string;
/**
*/
  readonly status: number;
/**
*/
  readonly versionMajor: number;
/**
*/
  readonly versionMinor: number;
}
