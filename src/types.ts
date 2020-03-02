/** A flag's specification */
export interface Flag {
  /** Flag's namespace */
  namespace: string

  /** Flag's name */
  name: string

  /** An optional (short) description of what the flag does */
  description?: string

  /** Specification of how the flag's value is computed for new sessions */
  rollout: Rollout[]
}

/** Instructions on when to apply a value to a flag */
export interface Rollout {
  /** If defined, applies the given value for X% of the sessions */
  percentage?: number

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
  /** Number of seconds for which the session should last */
  duration?: number

  /** Flag values that should be overridden */
  flags?: Flags
}

/** Error that is thrown when a flag cannot be found */
export class FlagNotFoundError extends Error {
  constructor(message?: string | undefined) {
    super(message)
    this.name = 'FlagNotFoundError'
  }
}
