const { getSession } = require('./sessions')
const internals = require('./sessions.internals')

const experiments = require('./experiments')
const flags = require('./flags')

describe('get session', () => {
  afterEach(jest.restoreAllMocks)

  test('returns existing session', () => {
    const redis = {
      hgetall: jest.fn().mockResolvedValue({
        '@experiment': 'bigger-cta',
        red: '1',
        rounded: '0'
      })
    }

    return getSession(redis, 'foo', 'abc123', 60)
      .then(result => {
        expect(result).toMatchObject({
          namespace: 'foo',
          id: 'abc123',
          experiment: 'bigger-cta',
          flags: { red: true, rounded: false }
        })

        expect(redis.hgetall).toHaveBeenCalledWith('session:foo:abc123')
      })
  })

  test('has new session created', () => {
    jest.spyOn(internals, 'createSession').mockResolvedValue('created session')

    const redis = {
      hgetall: jest.fn().mockResolvedValue({})
    }

    return getSession(redis, 'foo', 'abc123', 60)
      .then(result => {
        expect(result).toBe('created session')
        expect(internals.createSession).toHaveBeenCalledWith(redis, 'foo', 'abc123', 60)
      })
  })
})

describe('create session', () => {
  const { createSession } = internals

  const mockRedis = () => ({
    hmset: jest.fn().mockResolvedValue(),
    expire: jest.fn().mockResolvedValue()
  })

  afterEach(jest.restoreAllMocks)

  const mockScenario = (experimentList, pickedName, flagList) => {
    jest.spyOn(experiments, 'bindSession').mockResolvedValue()
    jest.spyOn(experiments, 'listExperiments').mockResolvedValue(experimentList)
    jest.spyOn(experiments, 'pickExperiment')
      .mockReturnValue(pickedName && experimentList.find(({ name }) => name === pickedName))
    jest.spyOn(flags, 'listFlags').mockResolvedValue(flagList)
  }

  describe('with an experiment', () => {
    const allExperiments = [
      { name: 'one', flags: { red: true, rounded: false, bigger: true } },
      { name: 'two', weight: 0 },
      { name: 'three', weight: 50 }
    ]

    beforeEach(() => mockScenario(allExperiments, 'one', { blinking: true, red: false }))

    test('returns created session', () => {
      const redis = mockRedis()
      return createSession(redis, 'foo', 'abc123', 60)
        .then(result => {
          expect(result).toMatchObject({
            namespace: 'foo',
            id: 'abc123',
            experiment: 'one',
            flags: {
              red: true, rounded: false, bigger: true, blinking: true
            }
          })
        })
    })

    test('saves created session', () => {
      const redis = mockRedis()
      return createSession(redis, 'foo', 'abc123', 60)
        .then(result => {
          const sessionKey = 'session:foo:abc123'
          expect(redis.hmset).toHaveBeenCalledWith(sessionKey,
            ['@experiment', 'one', 'blinking', '1', 'red', '1', 'rounded', '0', 'bigger', '1'])
          expect(experiments.bindSession).toHaveBeenCalledWith(redis, 'foo', 'one', 'abc123', 60)
        })
    })
  })

  describe('without an experiment', () => {
    beforeEach(() => mockScenario([], undefined, { blinking: true, red: false }))

    test('returns created session', () => {
      const redis = mockRedis()
      return createSession(redis, 'foo', 'abc123', 60)
        .then(result => {
          expect(result).toMatchObject({
            namespace: 'foo',
            id: 'abc123',
            experiment: undefined,
            flags: { blinking: true, red: false }
          })
        })
    })

    test('saves created session', () => {
      const redis = mockRedis()
      return createSession(redis, 'foo', 'abc123', 60)
        .then(result => {
          const sessionKey = 'session:foo:abc123'
          expect(redis.hmset).toHaveBeenCalledWith(sessionKey,
            ['blinking', '1', 'red', '0'])
        })
    })
  })
})
