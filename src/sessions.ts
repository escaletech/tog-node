import murmur from 'murmurhash-js'

import { Rollout, Session } from './types'

export function parseSession (namespace: string, id: string, value: string): Session {
  return {
    namespace,
    id,
    flags: JSON.parse(value)
  }
}

export function resolveState (rollouts: Rollout[], timestamp: number, sessionId: string): boolean {
  if (!rollouts || rollouts.length === 0) {
    return false
  }

  const param = murmur.murmur3(`${sessionId}${timestamp}`) % 100

  const rollout = rollouts.find(r =>
    r.percentage === undefined
      ? r.value
      : param <= r.percentage
  )

  return (rollout && rollout.value) || false
}
