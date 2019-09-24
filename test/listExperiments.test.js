const { newClients, cleanUp } = require('./util')

describe('list experiments', () => {
  afterEach(() => cleanUp())

  test('returns empty list', async () => {
    const { tog } = newClients()

    const experiments = await tog.listExperiments('foo')

    expect(experiments.length).toBe(0)
  })

  test('returns existing experiments', async () => {
    const { redis, tog } = newClients()

    const values = {
      'exp:foo:just-weight': ['@weight', '30'],
      'exp:bar:other-namespace': ['@weight', '1', 'blue', '1'],
      'exp:foo:just-flags': ['black', '1', 'white', '0'],
      'exp:foo:both': ['@weight', '30', 'black', '1', 'white', '0']
    }

    await Promise.all(Object.keys(values).map(key => redis.hmset(key, values[key])))

    const experiments = await tog.listExperiments('foo')
    expect(experiments).toMatchObject([
      { name: 'both', weight: 30, flags: { black: true, white: false } },
      { name: 'just-flags', weight: 0, flags: { black: true, white: false } },
      { name: 'just-weight', weight: 30, flags: { } }
    ])
  })
})
