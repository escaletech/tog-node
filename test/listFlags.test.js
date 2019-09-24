const { newClients, cleanUp } = require('./util')

describe('list flags', () => {
  afterEach(() => cleanUp())

  test('returns empty list', async () => {
    const { tog } = newClients()

    const flags = await tog.listFlags('foo')

    expect(flags.length).toBe(0)
  })

  test('returns existing flags', async () => {
    const { redis, tog } = newClients()

    const values = {
      'flag:foo:orange': '1',
      'flag:bar:other-namespace': '1',
      'flag:foo:black': '0',
      'flag:foo:red': '1;This is a description'
    }

    await Promise.all(Object.keys(values).map(key => redis.set(key, values[key])))

    const flags = await tog.listFlags('foo')

    expect(flags).toMatchObject([
      { name: 'black', state: false },
      { name: 'orange', state: true },
      { name: 'red', state: true, description: 'This is a description' }
    ])
  })
})
