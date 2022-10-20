import { Flag } from '../src'
import { newFlagClient, cleanUp, newTimestamp } from './util'
import { namespaceKey } from '../src/keys'

describe.only('save flag', () => {
  afterAll(() => cleanUp())

  test('enabled flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: true }]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "")
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('delete flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: true }]
    }
    await tog.deleteFlag(flag.namespace, flag.name)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "{}")
    expect(saved.rollout).toBe(undefined)
  })

  test('disabled flag', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [{ value: false }]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "")
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('update flag with description', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      timestamp: 123,
      rollout: [{ value: true , percentage: 90}],
      description: 'some description'
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "")
    expect(saved.description).toBe('some description')
  })

  test('update flag with variants (trait)', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      rollout: [
        { value: true, percentage: 42 , traits: ["black","circle"]}
      ]
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "" )
    expect(saved.rollout).toMatchObject(flag.rollout)
  })

  test('saves timestamp', async () => {
    const [tog, redis] = newFlagClient()

    const flag: Flag = {
      namespace: 'foo',
      name: 'black',
      timestamp: 123,
      rollout: [{ value: true , percentage: 73, traits:["blue"]}],
    }
    await tog.saveFlag(flag)

    const saved = JSON.parse(await redis.hget(namespaceKey('foo'), 'black') ?? "")
    expect(saved.timestamp).toBeCloseTo(newTimestamp())
  })
})
