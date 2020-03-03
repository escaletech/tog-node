import { Session, SessionOptions } from "./types";
import { Redis } from './redis';
import { parseSession, resolveState } from './sessions';
import { sessionKey } from './keys'
import { FlagClient } from "./flagClient";

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
  constructor(redisUrl: string) {
    this.flags = new FlagClient(redisUrl)
    this.redis = this.flags.redis
  }

  /**
   * Resolves a session, either by retrieving it or by computing a new one
   * @param namespace Flags namespace
   * @param id Unique session ID
   * @param options Options used when creating the flag, which are ignored if it already exists
   */
  async session(namespace: string, id: string, options: SessionOptions): Promise<Session> {
    const key = sessionKey(namespace, id)
    const value = await this.redis.get(key)
    return value
      ? parseSession(namespace, id, value)
      : this.createSession(namespace, id, options)
  }

  /**
   * @hidden
   */
  private async createSession(namespace: string, id: string, options: SessionOptions): Promise<Session> {
    const flagOverrides = options && options.flags || {}
    const flags = (await this.flags.listFlags(namespace))
      .reduce((all, flag) => ({ ...all, [flag.name]: resolveState(flag.rollout) }), {})
    const session: Session = {
      namespace,
      id,
      flags: { ...flags, ...flagOverrides }
    }

    if (Object.keys(session.flags).length > 0) {
      await this.saveSession(session, options.duration || 86400)
    }

    return session
  }

  /**
   * @hidden
   */
  private async saveSession(session: Session, duration: number) {
    const key = sessionKey(session.namespace, session.id)
    await this.redis.set(key, JSON.stringify(session.flags), 'EX', duration)
  }
}
