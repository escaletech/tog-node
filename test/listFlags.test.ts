import { Flag, Rollout } from '../src'
import { newClients, cleanUp } from './util'

describe('list flags', () => {
  afterEach(() => cleanUp())

  test('returns empty list', async () => {
    const [tog] = newClients()

    const flags = await tog.listFlags('foo')

    expect(flags.length).toBe(0)
  })

  test('returns existing flags', async () => {
    const [tog, redis] = newClients()

    const flagTable: [string, string, Rollout, string?][] = [
      ['foo', 'orange', { value: true }],
      ['bar', 'other-namespace', { value: true }],
      ['foo', 'black', { value: false }],
      ['foo', 'red', { value: true }, 'some description'],
      ['foo', 'pink', { value: true, percentage: 30 }],
    ]

    const sources: Flag[] = flagTable.map(([namespace, name, rollout, description]) =>
      description
        ? ({ namespace, name, rollout: [rollout], description })
        : ({ namespace, name, rollout: [rollout] })
    )

    const saveFlag = flag => redis.set(`tog2:flag:${flag.namespace}:${flag.name}`, JSON.stringify(flag))
    await Promise.all(sources.map(saveFlag))

    const flags = await tog.listFlags('foo')

    expect(flags).toMatchObject(
      sources
        .filter(({ namespace }) => namespace === 'foo')
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  })
})
