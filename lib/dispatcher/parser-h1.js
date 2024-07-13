'use strict'

const assert = require('node:assert')
const util = require('../core/util.js')
const { setup } = require('../milo/index.js')
const timers = require('../util/timers.js')
const {
  HeadersTimeoutError,
  HeadersOverflowError,
  SocketError,
  InformationalError,
  BodyTimeoutError,
  HTTPParserError,
  ResponseContentLengthMismatchError,
  ResponseExceededMaxSizeError
} = require('../core/errors.js')
const {
  kUrl,
  kReset,
  kClient,
  kParser,
  kBlocking,
  kRunning,
  kWriting,
  kQueue,
  kKeepAliveDefaultTimeout,
  kRunningIdx,
  kError,
  kPipelining,
  kSocket,
  kKeepAliveTimeoutValue,
  kMaxHeadersSize,
  kKeepAliveMaxTimeout,
  kKeepAliveTimeoutThreshold,
  kBodyTimeout,
  kMaxResponseSize,
  kListeners,
  kResume,
  kHTTPContext
} = require('../core/symbols.js')

const FastBuffer = Buffer[Symbol.species]

const kBuffer = Symbol('kBuffer')
const kBufferSize = Symbol('kBufferSize')
const kCurrentBuffer = Symbol('kCurrentBuffer')
const kUnconsumedData = Symbol('kUnconsumedData')
const kPausedByHandler = Symbol('kPausedByHandler')

const BUFFER_PAGE_SIZE = 1024 * 60
const EMPTY_BUF = Buffer.alloc(0)
const TIMEOUT_HEADERS = 1
const TIMEOUT_BODY = 2
const TIMEOUT_IDLE = 3

let experimentalHTTPParserEnabled = process.env.UNDICI_USE_EXPERIMENTAL_HTTP_PARSER === 'true'

function onParserTimeout (parser) {
  const { socket, timeoutType, client } = parser

  /* istanbul ignore else */
  if (timeoutType === TIMEOUT_HEADERS) {
    if (!socket[kWriting] || socket.writableNeedDrain || client[kRunning] > 1) {
      assert(!parser.paused, 'cannot be paused while waiting for headers')
      util.destroy(socket, new HeadersTimeoutError())
    }
  } else if (timeoutType === TIMEOUT_BODY) {
    if (!parser.paused) {
      util.destroy(socket, new BodyTimeoutError())
    }
  } else if (timeoutType === TIMEOUT_IDLE) {
    assert(client[kRunning] === 0 && client[kKeepAliveTimeoutValue])
    util.destroy(socket, new InformationalError('socket idle timeout'))
  }
}

function removeAllListeners (obj) {
  for (const [name, listener] of obj[kListeners] ?? []) {
    obj.removeListener(name, listener)
  }
  obj[kListeners] = null
}

class H1Parser {
  constructor (client, socket) {
    assert(Number.isFinite(client[kMaxHeadersSize]) && client[kMaxHeadersSize] > 0)

    this.milo = setup({
      on_message_start: this.onMessageStart.bind(this),
      on_message_complete: this.onMessageComplete.bind(this),
      on_reason: this.onReason.bind(this),
      on_header_name: this.onHeaderName.bind(this),
      on_header_value: this.onHeaderValue.bind(this),
      on_headers: this.onHeaders.bind(this),
      on_data: this.onData.bind(this),
      on_trailer_name: this.onTrailerName.bind(this),
      on_trailer_value: this.onTrailerValue.bind(this),
      on_state_change: (p, at, len) => {
        console.log(this.milo.getPosition(p), this.milo.States[this.milo.getState(p)], at, len)
      }
    })

    this.client = client
    this.socket = socket
    this.parser = this.milo.create()
    this.milo.setMode(this.parser, this.milo.MESSAGE_TYPE_RESPONSE)

    this.timeout = null
    this.timeoutValue = null
    this.timeoutType = null

    this.statusCode = null
    this.statusText = ''
    this.upgrade = false
    this.contentLength = ''
    this.keepAliveTimeout = ''
    this.headers = []
    this.trailers = []

    this.boundResume = this.resume.bind(this)
    this.maxResponseSize = client[kMaxResponseSize]
    this.fieldsCurrentSizes = { headers: 0, trailers: 0 }
    this.fieldsMaxSize = client[kMaxHeadersSize]
    this.shouldKeepAlive = false
    this.paused = false
    this.bytesRead = 0

    this[kBufferSize] = BUFFER_PAGE_SIZE
    this[kBuffer] = this.milo.alloc(this[kBufferSize])
    this[kUnconsumedData] = EMPTY_BUF
    this[kPausedByHandler] = false
  }

  destroy () {
    timers.clearTimeout(this.timeout)
    this.timeout = null
    this.timeoutValue = null
    this.timeoutType = null

    if (this.parser) {
      this[kCurrentBuffer] = null

      this.milo.dealloc(this[kBuffer], this[kBufferSize])
      this[kBuffer] = null

      this.milo.destroy(this.parser)
      this.parser = null
    }

    this.paused = false
  }

  setTimeout (value, type) {
    this.timeoutType = type

    if (value !== this.timeoutValue) {
      timers.clearTimeout(this.timeout)

      if (value) {
        this.timeout = timers.setTimeout(onParserTimeout, value, this)

        // istanbul ignore else: only for jest
        if (this.timeout.unref) {
          this.timeout.unref()
        }
      } else {
        this.timeout = null
      }

      this.timeoutValue = value
    } else if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh()
      }
    }
  }

  resume () {
    if (this.socket.destroyed || !this.paused) {
      return
    }

    this.milo.resume(this.parser)

    assert(this.timeoutType === TIMEOUT_BODY)
    if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh()
      }
    }

    this.paused = false
    this.readMore()
  }

  readMore () {
    if (this.paused || !this.parser) {
      return
    }

    // Prepend previously unconsumed data
    if (this[kUnconsumedData]?.length) {
      this.socket.unshift(this[kUnconsumedData])
      this[kUnconsumedData] = null
    }

    while (!this.paused && this.parser) {
      const chunk = this.socket.read()

      if (chunk === null) {
        break
      }

      this.execute(chunk)
    }
  }

  execute (data) {
    const available = data.length
    assert(!this.paused)

    const { socket } = this

    // Make sure the shared buffer is big enough
    if (available > this[kBufferSize]) {
      this.milo.dealloc(this[kBuffer], this[kBufferSize])

      const newSize = Math.ceil(available / BUFFER_PAGE_SIZE) * BUFFER_PAGE_SIZE

      this[kBuffer] = this.milo.alloc(newSize)
      this[kBufferSize] = newSize
    }

    try {
      this[kCurrentBuffer] = new FastBuffer(this.milo.memory.buffer, this[kBuffer], this[kBufferSize])

      // Copy the data in the shared buffer.
      this[kCurrentBuffer].set(data)

      // Call the parse method in the WebAssembly layer
      const consumed = this.milo.parse(this.parser, this[kBuffer], available)
      const errorCode = this.milo.getErrorCode(this.parser)

      if (errorCode !== this.milo.ERROR_NONE) {
        const errorCodeString = this.milo.Errors[this.milo.getErrorCode(this.parser)]
        const errorDescription = this.milo.getErrorDescription(this.parser)
        const message = `Response does not match the HTTP/1.1 protocol ([ERROR_${errorCodeString}] ${errorDescription})`
        throw new HTTPParserError(message, this.milo.Errors[errorCode], data.slice(consumed))
      } else if (this.upgrade) {
        this.onUpgrade(data.slice(consumed))
      } else if (this.milo.isPaused(this.parser)) {
        /*
          If the handler paused the parser at the end of a message, the parser will be paused forever. Let's resume.
        */
        if (this[kPausedByHandler] && this.milo.getState(this.parser) === this.milo.STATE_START) {
          this.milo.resume(this.parser)
          this[kPausedByHandler] = false
          return
        }

        socket.unshift(data.slice(consumed))
        this.paused = true
      } else if (consumed < available) {
        // Milo might not be able to consumed all inbound data due to its eager nature. Let's retain the data and prepend it later.
        this[kUnconsumedData] = data.slice(consumed)
      }
    } catch (err) {
      util.destroy(socket, err)
    } finally {
      this[kCurrentBuffer] = null
    }
  }

  onMessageStart () {
    const { socket, client } = this

    /* istanbul ignore next: difficult to make a test case for */
    if (socket.destroyed) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    const request = client[kQueue][client[kRunningIdx]]

    if (!request) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    request.onResponseStarted()
  }

  onMessageComplete () {
    const { client, socket, statusCode, upgrade, trailers, contentLength, bytesRead, shouldKeepAlive } = this

    if (socket.destroyed && (!statusCode || shouldKeepAlive)) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    if (upgrade) {
      this.milo.pause(this.parser)
      return
    }

    const request = client[kQueue][client[kRunningIdx]]
    assert(request)

    assert(statusCode >= 100)

    this.statusCode = null
    this.statusText = ''
    this.bytesRead = 0
    this.contentLength = ''
    this.keepAlive = ''
    this.connection = ''

    assert(this.trailers.length % 2 === 0)
    this.trailers = []
    this.fieldsCurrentSizes.trailers = 0

    if (statusCode < 200) {
      return
    }

    if (request.method !== 'HEAD' && contentLength && bytesRead !== parseInt(contentLength, 10)) {
      util.destroy(socket, new ResponseContentLengthMismatchError())
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Response body length does not match content-length header.')
      return
    }

    request.onComplete(trailers)

    client[kQueue][client[kRunningIdx]++] = null

    if (socket[kWriting]) {
      assert.strictEqual(client[kRunning], 0)
      // Response completed before request.
      util.destroy(socket, new InformationalError('reset'))
      this.milo.pause(this.parser)
    } else if (!shouldKeepAlive) {
      util.destroy(socket, new InformationalError('reset'))
      this.milo.pause(this.parser)
    } else if (socket[kReset] && client[kRunning] === 0) {
      // Destroy socket once all requests have completed.
      // The request at the tail of the pipeline is the one
      // that requested reset and no further requests should
      // have been queued since then.
      util.destroy(socket, new InformationalError('reset'))
      this.milo.pause(this.parser)
    } else if (client[kPipelining] == null || client[kPipelining] === 1) {
      // We must wait a full event loop cycle to reuse this socket to make sure
      // that non-spec compliant servers are not closing the connection even if they
      // said they won't.
      setImmediate(() => client[kResume]())
    } else {
      client[kResume]()
    }
  }

  onReason (_, at, len) {
    this.statusText = this.extractPayload(at, len).toString()
  }

  onHeaderName (_, at, len) {
    this.trackField('headers', at, len)
  }

  onHeaderValue (_, at, len) {
    this.trackField('headers', at, len)

    const headersLength = this.headers.length
    const key = this.headers[headersLength - 2]
    if (key.length === 10) {
      const headerName = util.bufferToLowerCasedHeaderName(key)

      if (headerName === 'keep-alive') {
        this.keepAlive = this.headers[headersLength - 1]
      } else if (headerName === 'connection') {
        this.connection += this.headers[headersLength - 1]
      }
    } else if (key.length === 14 && util.bufferToLowerCasedHeaderName(key) === 'content-length') {
      this.contentLength += this.headers[headersLength - 1]
    }
  }

  onHeaders () {
    const { socket, client, headers } = this

    /* istanbul ignore next: difficult to make a test case for */
    if (socket.destroyed) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    const request = client[kQueue][client[kRunningIdx]]

    if (!request) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    assert(!this.upgrade)
    assert(this.statusCode < 200)

    const statusCode = this.milo.getStatus(this.parser)

    if (statusCode === 100) {
      util.destroy(socket, new SocketError('bad response', util.getSocketInfo(socket)))
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Bad response')
      return
    }

    const upgrade = this.milo.hasUpgrade(this.parser)

    /* this can only happen if server is misbehaving */
    if (upgrade && !request.upgrade) {
      util.destroy(socket, new SocketError('bad upgrade', util.getSocketInfo(socket)))
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Bad response')
      return
    }

    assert.strictEqual(this.timeoutType, TIMEOUT_HEADERS)

    // Check the status code
    this.statusCode = statusCode
    this.shouldKeepAlive = this.milo.getConnection(this.parser) === this.milo.CONNECTION_KEEPALIVE

    if (this.statusCode >= 200) {
      const bodyTimeout = request.bodyTimeout != null
        ? request.bodyTimeout
        : client[kBodyTimeout]
      this.setTimeout(bodyTimeout, TIMEOUT_BODY)
    } else if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh()
      }
    }

    if (request.method === 'CONNECT') {
      assert(client[kRunning] === 1)
      this.milo.setIsConnect(this.parser, true)
      this.upgrade = true
      return
    }

    // Check if it is a Upgrade or Connect request
    if (upgrade) {
      assert(client[kRunning] === 1)
      this.upgrade = true
      this.milo.pause(this.parser)
      return
    }

    // Reset the headers
    this.headers = []
    this.fieldsCurrentSizes.headers = 0

    if (this.shouldKeepAlive && client[kPipelining]) {
      const keepAliveTimeout = this.keepAlive ? util.parseKeepAliveTimeout(this.keepAlive) : null

      if (keepAliveTimeout != null) {
        const timeout = Math.min(
          keepAliveTimeout - client[kKeepAliveTimeoutThreshold],
          client[kKeepAliveMaxTimeout]
        )
        if (timeout <= 0) {
          socket[kReset] = true
        } else {
          client[kKeepAliveTimeoutValue] = timeout
        }
      } else {
        client[kKeepAliveTimeoutValue] = client[kKeepAliveDefaultTimeout]
      }
    } else {
      // Stop more requests from being dispatched.
      socket[kReset] = true
    }

    // Execute the callback
    const pause = request.onHeaders(statusCode, headers, this.boundResume, this.statusText) === false

    if (request.aborted) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Request aborted')
      return
    }

    if (request.method === 'HEAD' || statusCode < 200) {
      this.milo.setSkipBody(this.parser, true)
    }

    if (pause) {
      this.milo.pause(this.parser)
      this[kPausedByHandler] = true
    }

    if (socket[kBlocking]) {
      socket[kBlocking] = false
      client[kResume]()
    }
  }

  onUpgrade (unconsumed) {
    const { upgrade, client, socket, headers, statusCode } = this

    assert(upgrade)

    const request = client[kQueue][client[kRunningIdx]]
    assert(request)

    assert(!socket.destroyed)
    assert(socket === client[kSocket])
    assert(!this.paused)
    assert(request.upgrade || request.method === 'CONNECT')

    this.statusCode = null
    this.statusText = ''
    this.shouldKeepAlive = null

    assert(this.headers.length % 2 === 0)
    this.headers = []
    this.headersSize = 0

    socket.unshift(unconsumed)

    socket[kParser].destroy()
    socket[kParser] = null
    socket[kClient] = null
    socket[kError] = null

    removeAllListeners(socket)

    client[kSocket] = null
    client[kHTTPContext] = null // TODO (fix): This is hacky...
    client[kQueue][client[kRunningIdx]++] = null
    client.emit('disconnect', client[kUrl], [client], new InformationalError('upgrade'))

    try {
      request.onUpgrade(statusCode, headers, socket)
    } catch (err) {
      util.destroy(socket, err)
    }

    client[kResume]()
  }

  onTrailerName (_, at, len) {
    this.trackField('trailers', at, len)
  }

  onTrailerValue (_, at, len) {
    this.trackField('trailers', at, len)
  }

  onData (_, at, len) {
    const { client, socket, statusCode, maxResponseSize } = this

    if (socket.destroyed) {
      this.milo.fail(this.parser, this.milo.ERROR_CALLBACK_ERROR, 'Other side closed.')
      return
    }

    const request = client[kQueue][client[kRunningIdx]]
    assert(request)

    assert.strictEqual(this.timeoutType, TIMEOUT_BODY)
    if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh()
      }
    }

    assert(statusCode >= 200)

    if (maxResponseSize > -1 && this.bytesRead + len > maxResponseSize) {
      util.destroy(socket, new ResponseExceededMaxSizeError())
      return -1
    }

    this.bytesRead += len

    if (request.onData(this.extractPayload(at, len)) === false) {
      this.milo.pause(this.parser)
      this[kPausedByHandler] = true
    }
  }

  trackField (kind, at, len) {
    this.fieldsCurrentSizes[kind] += len

    if (this.fieldsCurrentSizes[kind] >= this.fieldsMaxSize) {
      util.destroy(this.socket, new HeadersOverflowError())
    }

    const data = len > 0 ? this.extractPayload(at, len) : EMPTY_BUF
    this[kind].push(data)
  }

  extractPayload (at, len) {
    return Buffer.copyBytesFrom(this[kCurrentBuffer], at, len)
  }
}

function setExperimentalHTTPParserEnabled (value) {
  experimentalHTTPParserEnabled = value
}

function getExperimentalHTTPParserEnabled () {
  return experimentalHTTPParserEnabled
}

module.exports = { onParserTimeout, H1Parser, getExperimentalHTTPParserEnabled, setExperimentalHTTPParserEnabled }
