const { newClients, cleanUp } = require('./util')

describe('get experiment', () => {
  afterEach(() => cleanUp())

  test('returns experiment with only weight', async () => {
    const { redis, tog } = newClients()

    await redis.hmset('exp:foo:new-feature', ['@weight', '20'])

    const exp = await tog.getExperiment('foo', 'new-feature')
    expect(exp).toMatchObject({
      name: 'new-feature',
      weight: 20,
      flags: {}
    })
  })

  test('returns experiment with only flags', async () => {
    const { redis, tog } = newClients()

    await redis.hmset('exp:foo:new-feature', ['black', '0', 'white', 1])

    const exp = await tog.getExperiment('foo', 'new-feature')
    expect(exp).toMatchObject({
      name: 'new-feature',
      weight: 0,
      flags: { black: false, white: true }
    })
  })

  test('returns experiment with both weight and flags', async () => {
    const { redis, tog } = newClients()

    await redis.hmset('exp:foo:new-feature', ['@weight', '1', 'black', '0', 'white', 1])

    const exp = await tog.getExperiment('foo', 'new-feature')
    expect(exp).toMatchObject({
      name: 'new-feature',
      weight: 1,
      flags: { black: false, white: true }
    })
  })

  test('return undefined for when name doesn\'t exist', async () => {
    const { tog } = newClients()

    const exp = await tog.getExperiment('foo', 'new-feature')
    expect(exp).toBeUndefined()
  })
})
