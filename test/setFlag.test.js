const { newClients, cleanUp } = require('./util')

describe('set flag', () => {
  afterEach(() => cleanUp())

  test('enabled flag', async () => {
    const { redis, tog } = newClients()

    const flag = await tog.setFlag('foo', 'black', true)

    expect(flag).toMatchObject({ name: 'black', state: true })
    expect(await redis.get('flag:foo:black')).toBe('1')
  })

  test('disabled flag', async () => {
    const { redis, tog } = newClients()

    const flag = await tog.setFlag('foo', 'black', false)

    expect(flag).toMatchObject({ name: 'black', state: false })
    expect(await redis.get('flag:foo:black')).toBe('0')
  })

  test('flag with description', async () => {
    const { redis, tog } = newClients()

    const flag = await tog.setFlag('foo', 'black', true, 'some description')

    expect(flag).toMatchObject({ name: 'black', description: 'some description' })
    expect(await redis.get('flag:foo:black')).toMatch(/;some description$/)
  })
})
