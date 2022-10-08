import { Logger } from "./logger"

/** A flag's specification */
export interface Flag {
  /** Flag's namespace */
  namespace: string

  /** Flag's name */
  name: string

  /** An optional (short) description of what the flag does */
  description?: string

  /** UNIX timestamp of when the flag was last changed */
  timestamp?: number

  /** Specification of how the flag's value is computed for new sessions */
  rollout: Rollout[]
}

/** Instructions on when to apply a value to a flag */
export interface Rollout {
  /** If defined, applies the given value for X% of the sessions */
  percentage?: number

  /** If defined, applies to only sessions match ALL the elements in this string[] */
  traits?: string[]
  
  /** Value to be used */
  value: FlagValue
}

/** Possible values for a flag */
export type FlagValue = boolean

/** Map of flags' values in a session */
export interface Flags {
  [key: string]: FlagValue
}

/** A user session */
export interface Session {
  /** The session's namespace */
  namespace: string

  /** The session's unique ID */
  id: string

  /** Values for each flag */
  flags: Flags
}

/**
 * Options for creating a new session
 */
export interface SessionOptions {
  /** Flag values that should be overridden */
  flags?: Flags
}

/**
 * Options for creating clients
 */
export interface ClientOptions {
  /** Whether to connect to Redis as a cluster or not */
  cluster?: boolean
}

/**
 * Options for creating session clients
 */
export interface SessionClientOptions extends ClientOptions {
  timeout?: number
  logger?: Logger
}

/** Error that is thrown when a flag cannot be found */
export class FlagNotFoundError extends Error {
  constructor(message?: string | undefined) {
    super(message)
    this.name = 'FlagNotFoundError'
  }
}
