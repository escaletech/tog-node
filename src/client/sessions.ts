import { Rollout, Session } from './types'

export function parseSession (namespace: string, id: string, value: string): Session {
  return {
    namespace,
    id,
    flags: JSON.parse(value)
  }
}

export function resolveState (rollouts: Rollout[]): boolean {
  if (!rollouts || rollouts.length === 0) {
    return false
  }

  const rollout = rollouts.find(r => {
    return r.percentage !== undefined
      ? Math.floor(Math.random() * 99) + 1 <= r.percentage
      : r.value
  })

  return (rollout && rollout.value) || false
}
