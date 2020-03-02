import { Flag } from '../src'
import { newFlagClient, cleanUp } from './util'

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

    expect(await redis.get('tog2:flag:foo:black'))
      .toBe(JSON.stringify({ rollout: flag.rollout }))
  })

  test('disabled flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: false }]
    }
    await tog.saveFlag(flag)

    expect(await redis.get('tog2:flag:foo:black'))
      .toBe(JSON.stringify({ rollout: flag.rollout }))
  })

  test('flag with description', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: true }],
      description: 'some description'
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.get('tog2:flag:foo:black'))
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

    const saved = JSON.parse(await redis.get('tog2:flag:foo:black'))
    expect(saved.rollout).toMatchObject(flag.rollout)
  })
})
