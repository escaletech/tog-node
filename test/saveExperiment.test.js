const { newClients, cleanUp } = require('./util')

describe('save experiment', () => {
  afterEach(() => cleanUp())

  test('saves new experiment', async () => {
    const { redis, tog } = newClients()

    await tog.saveExperiment({
      namespace: 'foo',
      name: 'new-feature',
      weight: 20,
      flags: { black: true, white: false }
    })

    const fields = await redis.hgetall('exp:foo:new-feature')
    expect(fields).toEqual({
      '@weight': '20',
      black: '1',
      white: '0'
    })
  })

  test('overwrites existing experiment', async () => {
    const { redis, tog } = newClients()

    await redis.hmset('exp:foo:new-feature', ['@weight', '20', 'black', '1', 'white', '0'])

    await tog.saveExperiment({
      namespace: 'foo',
      name: 'new-feature',
      weight: 50,
      flags: { white: true, blue: false }
    })

    const fields = await redis.hgetall('exp:foo:new-feature')
    expect(fields).toEqual({
      '@weight': '50',
      black: '1',
      white: '1',
      blue: '0'
    })
  })
})
