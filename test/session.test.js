const { promisify } = require('util')

const { newClients, cleanUp } = require('./util')

const ttl = (redis, key) => promisify(redis.ttl).call(redis, key)

const setAll = (redis, values) =>
  Promise.all(Object.keys(values).map(key => redis.set(key, values[key])))

describe('session', () => {
  afterEach(() => cleanUp())

  describe('retrieves session', () => {
    test('existing without experiment', async () => {
      const { redis, tog } = newClients()

      await redis.hmset('session:foo:abc123', ['black', '1', 'white', '0'])

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: undefined,
        flags: { black: true, white: false }
      })
    })

    test('existing with experiment', async () => {
      const { redis, tog } = newClients()

      await redis.hmset(
        'session:foo:abc123',
        ['@experiment', 'new-feature', 'black', '1', 'white', '0'])

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: 'new-feature',
        flags: { black: true, white: false }
      })
    })

    test('empty session', async () => {
      const { redis, tog } = newClients()

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: undefined,
        flags: { }
      })

      expect(await redis.keys('*')).toEqual([])
    })
  })

  describe('creates session', () => {
    test('exclusively from flags', async () => {
      const { redis, tog } = newClients()

      await setAll(redis, {
        'flag:foo:black': '1',
        'flag:foo:white': '0'
      })

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: undefined,
        flags: { black: true, white: false }
      })

      // saved session
      expect(await redis.hgetall('session:foo:abc123')).toEqual({
        'black': '1',
        'white': '0'
      })

      // set expiration
      expect(await ttl(tog.redisClient, 'session:foo:abc123')).toEqual(60)
    })

    test('exclusively from experiment', async () => {
      const { redis, tog } = newClients()

      await redis.hmset('exp:foo:new-feature', ['@weight', '100', 'blue', '1'])

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: 'new-feature',
        flags: { blue: true }
      })

      // saved session
      expect(await redis.hgetall('session:foo:abc123')).toEqual({
        '@experiment': 'new-feature',
        'blue': '1'
      })

      // set expiration
      expect(await ttl(tog.redisClient, 'session:foo:abc123')).toEqual(60)

      // bound experiment
      expect(await redis.get('exp_sess:foo:new-feature:abc123')).toEqual('1')
      expect(await ttl(tog.redisClient, 'exp_sess:foo:new-feature:abc123')).toEqual(60)
    })

    test('experiment has precedence over flags', async () => {
      const { redis, tog } = newClients()

      await redis.hmset('exp:foo:new-feature', ['@weight', '100', 'blue', '1', 'white', '1'])
      await setAll(redis, {
        'flag:foo:black': '1',
        'flag:foo:white': '0'
      })

      const session = await tog.session('foo', 'abc123', 60)
      expect(session).toEqual({
        namespace: 'foo',
        id: 'abc123',
        experiment: 'new-feature',
        flags: { blue: true, black: true, white: true }
      })

      // saved session
      expect(await redis.hgetall('session:foo:abc123')).toEqual({
        '@experiment': 'new-feature',
        'blue': '1',
        'black': '1',
        'white': '1'
      })

      // set expiration
      expect(await ttl(tog.redisClient, 'session:foo:abc123')).toEqual(60)

      // bound experiment
      expect(await redis.get('exp_sess:foo:new-feature:abc123')).toEqual('1')
      expect(await ttl(tog.redisClient, 'exp_sess:foo:new-feature:abc123')).toEqual(60)
    })
  })
})
