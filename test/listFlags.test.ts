import { Flag, Rollout } from '../src'
import { newFlagClient, cleanUp, saveAllFlags } from './util'

describe('list flags', () => {
  afterEach(() => cleanUp())

  test('returns empty list', async () => {
    const [tog] = newFlagClient()

    const flags = await tog.listFlags('foo')

    expect(flags.length).toBe(0)
  })

  test('returns existing flags', async () => {
    const [tog, redis] = newFlagClient()

    const flagTable: [string, string, number, Rollout, string?][] = [
      ['foo', 'orange', 111, { value: true }],
      ['bar', 'other-namespace', 222, { value: true }],
      ['foo', 'black', 333, { value: false }],
      ['foo', 'red', 444, { value: true }, 'some description'],
      ['foo', 'pink', 555, { value: true, percentage: 30 }],
    ]

    const sources: Flag[] = flagTable.map(([namespace, name, timestamp, rollout, description]) =>
      description
        ? ({ namespace, name, timestamp, rollout: [rollout], description })
        : ({ namespace, name, timestamp, rollout: [rollout] })
    )

    await saveAllFlags(redis, sources)

    const flags = await tog.listFlags('foo')

    expect(flags).toMatchObject(
      sources
        .filter(({ namespace }) => namespace === 'foo')
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  })
})
