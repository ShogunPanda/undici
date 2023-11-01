/* tslint:disable */
/* eslint-disable */
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
  readonly unconsumed: number;
/**
*/
  readonly versionMajor: number;
/**
*/
  readonly versionMinor: number;
}
export declare const AUTODETECT: number = 0;
export declare const REQUEST: number = 1;
export declare const RESPONSE: number = 2;
export declare const CONNECTION_KEEPALIVE: number = 0;
export declare const CONNECTION_CLOSE: number = 1;
export declare const CONNECTION_UPGRADE: number = 2;
export declare const METHOD_ACL: number = 0;
export declare const METHOD_BASELINE_CONTROL: number = 1;
export declare const METHOD_BIND: number = 2;
export declare const METHOD_CHECKIN: number = 3;
export declare const METHOD_CHECKOUT: number = 4;
export declare const METHOD_CONNECT: number = 5;
export declare const METHOD_COPY: number = 6;
export declare const METHOD_DELETE: number = 7;
export declare const METHOD_GET: number = 8;
export declare const METHOD_HEAD: number = 9;
export declare const METHOD_LABEL: number = 10;
export declare const METHOD_LINK: number = 11;
export declare const METHOD_LOCK: number = 12;
export declare const METHOD_MERGE: number = 13;
export declare const METHOD_MKACTIVITY: number = 14;
export declare const METHOD_MKCALENDAR: number = 15;
export declare const METHOD_MKCOL: number = 16;
export declare const METHOD_MKREDIRECTREF: number = 17;
export declare const METHOD_MKWORKSPACE: number = 18;
export declare const METHOD_MOVE: number = 19;
export declare const METHOD_OPTIONS: number = 20;
export declare const METHOD_ORDERPATCH: number = 21;
export declare const METHOD_PATCH: number = 22;
export declare const METHOD_POST: number = 23;
export declare const METHOD_PRI: number = 24;
export declare const METHOD_PROPFIND: number = 25;
export declare const METHOD_PROPPATCH: number = 26;
export declare const METHOD_PUT: number = 27;
export declare const METHOD_REBIND: number = 28;
export declare const METHOD_REPORT: number = 29;
export declare const METHOD_SEARCH: number = 30;
export declare const METHOD_TRACE: number = 31;
export declare const METHOD_UNBIND: number = 32;
export declare const METHOD_UNCHECKOUT: number = 33;
export declare const METHOD_UNLINK: number = 34;
export declare const METHOD_UNLOCK: number = 35;
export declare const METHOD_UPDATE: number = 36;
export declare const METHOD_UPDATEREDIRECTREF: number = 37;
export declare const METHOD_VERSION_CONTROL: number = 38;
export declare const METHOD_DESCRIBE: number = 39;
export declare const METHOD_GET_PARAMETER: number = 40;
export declare const METHOD_PAUSE: number = 41;
export declare const METHOD_PLAY: number = 42;
export declare const METHOD_PLAY_NOTIFY: number = 43;
export declare const METHOD_REDIRECT: number = 44;
export declare const METHOD_SETUP: number = 45;
export declare const METHOD_SET_PARAMETER: number = 46;
export declare const METHOD_TEARDOWN: number = 47;
export declare const METHOD_PURGE: number = 48;
export declare const ERROR_NONE: number = 0;
export declare const ERROR_UNEXPECTED_DATA: number = 1;
export declare const ERROR_UNEXPECTED_EOF: number = 2;
export declare const ERROR_CALLBACK_ERROR: number = 3;
export declare const ERROR_UNEXPECTED_CHARACTER: number = 4;
export declare const ERROR_UNEXPECTED_CONTENT_LENGTH: number = 5;
export declare const ERROR_UNEXPECTED_TRANSFER_ENCODING: number = 6;
export declare const ERROR_UNEXPECTED_CONTENT: number = 7;
export declare const ERROR_UNTRAILERS: number = 8;
export declare const ERROR_INVALID_VERSION: number = 9;
export declare const ERROR_INVALID_STATUS: number = 10;
export declare const ERROR_INVALID_CONTENT_LENGTH: number = 11;
export declare const ERROR_INVALID_TRANSFER_ENCODING: number = 12;
export declare const ERROR_INVALID_CHUNK_SIZE: number = 13;
export declare const ERROR_MISSING_CONNECTION_UPGRADE: number = 14;
export declare const ERROR_UNSUPPORTED_HTTP_VERSION: number = 15;
export declare const STATE_START: number = 0;
export declare const STATE_FINISH: number = 1;
export declare const STATE_ERROR: number = 2;
export declare const STATE_MESSAGE: number = 3;
export declare const STATE_REQUEST: number = 4;
export declare const STATE_REQUEST_METHOD: number = 5;
export declare const STATE_REQUEST_URL: number = 6;
export declare const STATE_REQUEST_PROTOCOL: number = 7;
export declare const STATE_REQUEST_VERSION: number = 8;
export declare const STATE_RESPONSE: number = 9;
export declare const STATE_RESPONSE_VERSION: number = 10;
export declare const STATE_RESPONSE_STATUS: number = 11;
export declare const STATE_RESPONSE_REASON: number = 12;
export declare const STATE_HEADER_NAME: number = 13;
export declare const STATE_HEADER_TRANSFER_ENCODING: number = 14;
export declare const STATE_HEADER_CONTENT_LENGTH: number = 15;
export declare const STATE_HEADER_CONNECTION: number = 16;
export declare const STATE_HEADER_VALUE: number = 17;
export declare const STATE_HEADERS: number = 18;
export declare const STATE_BODY: number = 19;
export declare const STATE_TUNNEL: number = 20;
export declare const STATE_BODY_VIA_CONTENT_LENGTH: number = 21;
export declare const STATE_BODY_WITH_NO_LENGTH: number = 22;
export declare const STATE_CHUNK_LENGTH: number = 23;
export declare const STATE_CHUNK_EXTENSION_NAME: number = 24;
export declare const STATE_CHUNK_EXTENSION_VALUE: number = 25;
export declare const STATE_CHUNK_EXTENSION_QUOTED_VALUE: number = 26;
export declare const STATE_CHUNK_DATA: number = 27;
export declare const STATE_CHUNK_END: number = 28;
export declare const STATE_CRLF_AFTER_LAST_CHUNK: number = 29;
export declare const STATE_TRAILER_NAME: number = 30;
export declare const STATE_TRAILER_VALUE: number = 31;
