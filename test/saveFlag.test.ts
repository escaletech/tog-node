import { Flag } from '../src'
import { newFlagClient, cleanUp, newTimestamp } from './util'
import { namespaceKey } from '../src/keys'

describe.only('save flag', () => {
  afterEach(() => cleanUp())

  test('enabled flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: true }]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black'))
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('disabled flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: false }]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black'))
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('flag with description', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      timestamp: 123,
      rollout: [{ value: true }],
      description: 'some description'
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black'))
    expect(saved.description).toBe('some description')
  })

  test('flag with variants', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [
        { value: true, percentage: 42 }
      ]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black'))
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('saves timestamp', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      timestamp: 123,
      rollout: [{ value: true }],
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black'))
    expect(saved.timestamp).toBeCloseTo(newTimestamp())
  })
})
