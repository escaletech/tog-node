import { newSessionClient, cleanUp, saveAllFlags } from './util'

describe('session', () => {
  afterEach(() => cleanUp())

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

      const session = await tog.session('foo', 'abc123', { flags: { blue: true } })
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

      const session = await tog.session('foo', 'abc123', { flags: { white: true } })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: true }
      })
    })
  })
})
