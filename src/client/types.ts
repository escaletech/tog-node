export interface RedisFlag {
  description?: string
  rollout: Rollout[]
}

export interface Flag extends RedisFlag {
  name: string
  namespace: string
}

export interface Rollout {
  percentage?: number
  value: FlagValue
}

export type FlagValue = boolean

export interface Flags {
  [key: string]: FlagValue
}

export interface Session {
  namespace: string
  id: string
  flags: Flags
}

export interface SessionOptions {
  duration?: number
  flags?: Flags
}
