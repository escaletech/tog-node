import { Session, SessionOptions, ClientOptions } from "./types";
import { resolveState } from './sessions';
import { FlagClient } from "./flagClient";
import { Redis } from "./redis";

/**
 * A client consuming sessions
 *
 * ```js
 * const { SessionClient } = require('tog-node')
 *
 * const tog = new SessionClient('redis://127.0.0.1:6379')
 * ```
 */
export class SessionClient {
  private readonly flags: FlagClient
  readonly redis: Redis

  /**
   * @param redisUrl The Redis connection string
   */
  constructor(redisUrl: string, options: ClientOptions = {}) {
    this.flags = new FlagClient(redisUrl, options)
    this.redis = this.flags.redis
  }

  /**
   * Resolves a session, either by retrieving it or by computing a new one
   * @param namespace Flags namespace
   * @param id Unique session ID
   * @param options Options used when creating the flag, which are ignored if it already exists
   */
  async session(namespace: string, id: string, options: SessionOptions): Promise<Session> {
    const flagOverrides = options && options.flags || {}
    const flags = (await this.flags.listFlags(namespace))
      .reduce((all, flag) => ({
        ...all,
        [flag.name]: resolveState(flag.rollout, flag.timestamp || 0, id)
      }), {})
    const session: Session = {
      namespace,
      id,
      flags: { ...flags, ...flagOverrides }
    }

    return session
  }
}
