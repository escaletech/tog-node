import waitForExpect from 'wait-for-expect'

import { newSessionClient, cleanUp, saveAllFlags, newFlagClient } from './util'
import { SessionClient } from '../src'

const fakeLogger = () => ({
  loggedMessage: <string><unknown>undefined,
  infoMessage: <string><unknown>undefined,
  error(message) {
    this.loggedMessage = message
  },
  info(message) {
    this.infoMessage = message
  }
})

describe('session', () => {
  afterEach(() => cleanUp())

  describe('handles errors gracefully', () => {
    test('on redis timeout', async () => {
      const logger = fakeLogger()

      // there is no Redis server listening on this port
      const tog = new SessionClient('redis://127.0.0.1:8888/1', { logger })

      const session = await tog.session('foo', 'abc123')
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: {}
      })
      expect(logger.loggedMessage?.toString()).toEqual('Error: timeout after 300ms')
      tog.redis.quit()
      tog.subscriber.quit()
    })

    test('on redis error', async () => {
      const logger = fakeLogger()

      const [tog, redis] = newSessionClient({ logger })
      redis.quit()

      const session = await tog.session('foo', 'abc123')
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: {}
      })
      expect(logger.loggedMessage?.toString()).toEqual('Error: Connection is closed.')
    })
  })

  describe('uses flags cache', () => {
    test('when it is already empty', async () => {
      const logger = fakeLogger()
      const [sess] = newSessionClient({logger})
      const [flags] = newFlagClient()

      await flags.saveFlag({namespace: 'foo', name: 'black', rollout: [{ value: true }]})

      await waitForExpect(() => {
        expect(logger.infoMessage).toEqual('namespace foo has changed')
      })

      expect(await sess.session('foo', 'abc123'))
        .toMatchObject({
          flags: { black: true }
        })
    })

    test('uses cache when available', async () => {
      const logger = fakeLogger()
      const [sess, redis] = newSessionClient({logger})
      await saveAllFlags(redis, [{namespace: 'foo', name: 'black', rollout: [{ value: true }]}])

      // preload cache
      await sess.session('foo', 'abc123')

      // close redis connection
      await redis.quit()

      // still resolves flags
      expect(await sess.session('foo', 'abc123'))
        .toMatchObject({
          flags: { black: true }
        })
    })
  })

  describe('creates session', () => {
    test('from static flags', async () => {
      const [tog, redis] = newSessionClient()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, timestamp: 1, name: 'black', rollout: [{ value: true }] },
        { namespace, timestamp: 2, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123')
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false }
      })
    })

    test('using rigged variant', async () => {
      const [tog, redis] = newSessionClient()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, timestamp: 1, name: 'black', rollout: [{ value: true }] },
        { namespace, timestamp: 2, name: 'white', rollout: [{ value: true, percentage: 100 }] }
      ])

      const session = await tog.session('foo', 'abc123')
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: true }
      })
    })

    test('disconsidering unprioritized variant', async () => {
      const [tog, redis] = newSessionClient()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, timestamp: 1, name: 'black', rollout: [{ value: true }] },
        { namespace, timestamp: 2, name: 'white', rollout: [{ value: true, percentage: 0 }] }
      ])

      const session = await tog.session('foo', 'abc123')
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false }
      })
    })

    test('forcing a new flag to be set', async () => {
      const [tog, redis] = newSessionClient()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, timestamp: 1, name: 'black', rollout: [{ value: true }] },
        { namespace, timestamp: 2, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123', [], { flags: { blue: true } })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false, blue: true }
      })
    })

    test('forcing a flag to be overridden', async () => {
      const [tog, redis] = newSessionClient()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, timestamp: 1, name: 'black', rollout: [{ value: true }] },
        { namespace, timestamp: 2, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123', [], { flags: { white: true } })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: true }
      })
    })
  })
})
