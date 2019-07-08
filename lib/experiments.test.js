const {
  getExperiment,
  listExperiments,
  saveExperiment,
  bindSession,
  pickExperiment
} = require('./experiments')

describe('get experiment', () => {
  test('minimal experiment', () => {
    const redis = {
      hgetall: jest.fn().mockResolvedValue({
        '@weight': '30',
        'rounded': '1',
        'red': '0'
      })
    }

    return getExperiment(redis, 'foo', 'bigger-cta')
      .then(result => {
        expect(result).toMatchObject({
          name: 'bigger-cta',
          weight: 30,
          flags: {
            rounded: true,
            red: false
          }
        })
        expect(redis.hgetall).toHaveBeenCalledWith('exp:foo:bigger-cta')
      })
  })

  test('experiment with no flags', () => {
    const redis = {
      hgetall: jest.fn().mockResolvedValue({ '@weight': '30' })
    }

    return getExperiment(redis, 'foo', 'bigger-cta')
      .then(result => {
        expect(result.flags).toMatchObject({})
      })
  })

  test('not found', () => {
    const redis = {
      hgetall: jest.fn().mockResolvedValue({ })
    }

    return getExperiment(redis, 'foo', 'bigger-cta')
      .then(result => {
        expect(result).toBe(undefined)
      })
  })
})

describe('list experiments', () => {
  test('returning some experiments', () => {
    const storage = {
      'exp:foo:one': { '@weight': '50' }, // only weight
      'exp:foo:two': { '@weight': '50', red: '1', rounded: '0' }, // some flags
      'exp:foo:three': { '@weight': '0' } // disabled
    }
    const redis = {
      keys: jest.fn().mockResolvedValue(Object.keys(storage)),
      hgetall: jest.fn(key => Promise.resolve(storage[key]))
    }

    return listExperiments(redis, 'foo')
      .then(result => {
        expect(result).toMatchObject([
          { name: 'one', weight: 50, flags: {} },
          { name: 'two', weight: 50, flags: { red: true, rounded: false } },
          { name: 'three', weight: 0, flags: {} }
        ])

        expect(redis.keys).toHaveBeenCalledWith('exp:foo:*')
      })
  })

  test('returning zero experiments', () => {
    const redis = {
      keys: jest.fn().mockResolvedValue([])
    }

    return listExperiments(redis, 'foo')
      .then(result => {
        expect(result).toEqual([])
        expect(redis.keys).toHaveBeenCalledWith('exp:foo:*')
      })
  })
})

describe('save experiment', () => {
  test('sets experiment without flags', () => {
    const redis = { hmset: jest.fn().mockResolvedValue(), hdel: jest.fn().mockResolvedValue() }

    const exp = {
      namespace: 'foo',
      name: 'bigger-cta',
      weight: 50,
      flags: {}
    }

    return saveExperiment(redis, exp)
      .then(() => {
        expect(redis.hmset).toHaveBeenCalledWith('exp:foo:bigger-cta', '@weight', '50')
      })
  })

  test('sets experiment with flags', () => {
    const redis = { hmset: jest.fn().mockResolvedValue(), hdel: jest.fn().mockResolvedValue() }

    const exp = {
      namespace: 'foo',
      name: 'bigger-cta',
      weight: 50,
      flags: { red: true, rounded: false }
    }

    return saveExperiment(redis, exp)
      .then(() => {
        expect(redis.hmset)
          .toHaveBeenCalledWith('exp:foo:bigger-cta', '@weight', '50', 'red', '1', 'rounded', '0')
      })
  })

  test('sets experiment with zero weight', () => {
    const redis = { hmset: jest.fn().mockResolvedValue(), hdel: jest.fn().mockResolvedValue() }

    const exp = {
      namespace: 'foo',
      name: 'bigger-cta',
      weight: 0,
      flags: { red: true, rounded: false }
    }

    return saveExperiment(redis, exp)
      .then(() => {
        expect(redis.hmset)
          .toHaveBeenCalledWith('exp:foo:bigger-cta', '@weight', '0', 'red', '1', 'rounded', '0')
      })
  })
})

describe('bind session', () => {
  test('binds session to experiment with expiration', () => {
    const redis = {
      set: jest.fn().mockResolvedValue(),
      expire: jest.fn().mockResolvedValue()
    }

    return bindSession(redis, 'foo', 'bigger-cta', 'abc123', 60)
      .then(() => {
        const expectedKey = 'exp_sess:foo:bigger-cta:abc123'
        expect(redis.set).toHaveBeenCalledWith(expectedKey, '')
        expect(redis.expire).toHaveBeenCalledWith(expectedKey, 60)
      })
  })
})

describe('pick experiment', () => {
  const getDistribution = (reps, pick) =>
    Array(reps).fill(0)
      .map(() => pick())
      .map(exp => exp && exp.name)
      .reduce((acc, exp) => ({ ...acc, [exp]: (acc[exp] || 0) + 1 }), {})

  test('returns undefined for no experiments', () =>
    expect(pickExperiment([])).toBe(undefined))

  test('always returns the same experiment with weight 100', () => {
    const n = 1000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 100 }
    ]))

    expect(distribution).toEqual({ e1: n })
  })

  test('correct distribution with complementing weights', () => {
    const n = 10000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 70 },
      { name: 'e2', weight: 30 }
    ]))

    expect(distribution.e1 + distribution.e2).toEqual(n)
    expect(distribution.e1 / n).toBeCloseTo(0.7, 1)
    expect(distribution.e2 / n).toBeCloseTo(0.3, 1)
  })

  test('correct distribution with incomplete experiments', () => {
    const n = 10000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 20 },
      { name: 'e2', weight: 50 }
    ]))

    expect(distribution.e1 + distribution.e2 + distribution[undefined]).toEqual(n)
    expect(distribution.e1 / n).toBeCloseTo(0.2, 1)
    expect(distribution.e2 / n).toBeCloseTo(0.5, 1)
    expect(distribution[undefined] / n).toBeCloseTo(0.3, 1)
  })
})
