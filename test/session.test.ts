import { newClients, cleanUp, saveAllFlags } from './util'

describe('session', () => {
  afterEach(() => cleanUp())

  describe('retrieves session', () => {
    test('existing', async () => {
      const [tog, redis] = newClients()

      await redis.set('tog2:session:foo:abc123', JSON.stringify({ black: true, white: false }))

      const session = await tog.session('foo', 'abc123', { duration: 60 })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false }
      })
    })

    test('empty session', async () => {
      const [tog, redis] = newClients()

      const session = await tog.session('foo', 'abc123', { duration: 60 })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { }
      })

      expect(await redis.keys('*')).toEqual([])
    })
  })

  describe('creates session', () => {
    test('from static flags', async () => {
      const [tog, redis] = newClients()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, name: 'black', rollout: [{ value: true }] },
        { namespace, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123', { duration: 60 })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false }
      })

      // saved session
      expect(JSON.parse(await redis.get('tog2:session:foo:abc123')))
        .toMatchObject({ black: true, white: false })

      // set expiration
      expect(await redis.ttl('tog2:session:foo:abc123')).toEqual(60)
    })

    test('using rigged variant', async () => {
      const [tog, redis] = newClients()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, name: 'black', rollout: [{ value: true }] },
        { namespace, name: 'white', rollout: [{ value: true, percentage: 100 }] }
      ])

      const session = await tog.session('foo', 'abc123', { duration: 60 })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: true }
      })

      // saved session
      expect(JSON.parse(await redis.get('tog2:session:foo:abc123')))
        .toMatchObject({ black: true, white: true })
    })

    test('disconsidering unprioritized variant', async () => {
      const [tog, redis] = newClients()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, name: 'black', rollout: [{ value: true }] },
        { namespace, name: 'white', rollout: [{ value: true, percentage: 0 }] }
      ])

      const session = await tog.session('foo', 'abc123', { duration: 60 })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false }
      })

      // saved session
      expect(JSON.parse(await redis.get('tog2:session:foo:abc123')))
        .toMatchObject({ black: true, white: false })
    })

    test('forcing a new flag to be set', async () => {
      const [tog, redis] = newClients()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, name: 'black', rollout: [{ value: true }] },
        { namespace, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123', { duration: 60, flags: { blue: true } })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: false, blue: true }
      })

      // saved session
      expect(JSON.parse(await redis.get('tog2:session:foo:abc123')))
        .toMatchObject({ black: true, white: false, blue: true })
    })

    test('forcing a flag to be overridden', async () => {
      const [tog, redis] = newClients()

      const namespace = 'foo'
      await saveAllFlags(redis, [
        { namespace, name: 'black', rollout: [{ value: true }] },
        { namespace, name: 'white', rollout: [] }
      ])

      const session = await tog.session('foo', 'abc123', { duration: 60, flags: { white: true } })
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        flags: { black: true, white: true }
      })

      // saved session
      expect(JSON.parse(await redis.get('tog2:session:foo:abc123')))
        .toMatchObject({ black: true, white: true })
    })
  })
})
