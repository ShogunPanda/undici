'use strict'

const { resolve } = require('path')
const { test } = require('tap')

process.env.MILO_BASE_PATH = resolve(__dirname, '../../lib')

const undici = require('../..')
const { fetch: theoreticalGlobalFetch } = require('../../undici-fetch')

test('Mocking works with both fetches', async (t) => {
  const mockAgent = new undici.MockAgent()
  const body = JSON.stringify({ foo: 'bar' })

  mockAgent.disableNetConnect()
  undici.setGlobalDispatcher(mockAgent)
  const pool = mockAgent.get('https://example.com')

  pool.intercept({
    path: '/path',
    method: 'POST',
    body (bodyString) {
      t.equal(bodyString, body)
      return true
    }
  }).reply(200, { ok: 1 }).times(2)

  const url = new URL('https://example.com/path').href

  // undici fetch from node_modules
  await undici.fetch(url, {
    method: 'POST',
    body
  })

  // the global fetch bundled with esbuild
  await theoreticalGlobalFetch(url, {
    method: 'POST',
    body
  })

  t.end()
})
