import { Flag, Rollout, Session, SessionOptions, FlagNotFoundError } from "./types";
import RedisClient from './redis';
import { parseSession, resolveState } from './sessions';
import { flagKey, sessionKey } from './keys'

interface RedisFlag {
  description?: string
  rollout: Rollout[]
}

/**
 * A client for Tog operations
 *
 * ```js
 * const { TogClient } = require('tog-node')
 *
 * const tog = new TogClient('redis://127.0.0.1:6379')
 * ```
 */
export class TogClient {
  readonly redis: RedisClient

  /**
   * @param redisUrl The Redis connection string
   */
  constructor(redisUrl: string) {
    this.redis = new RedisClient(redisUrl)
  }

  /**
   * Lists flags in a namespace
   * @param namespace Flags namespace
   */
  async listFlags(namespace: string): Promise<Flag[]> {
    const keys = await this.redis.keys(flagKey(namespace, '*'))
    return await Promise.all(keys.sort().map(key => this.getFlagByKey(key)))
  }

  /**
   * Gets a single flag from a namespace
   * @param namespace Flag namespace
   * @param name Flag name
   */
  async getFlag(namespace: string, name: string): Promise<Flag> {
    return this.getFlagByKey(flagKey(namespace, name))
  }

  /**
   * Creates or updates a flag
   * @param flag The flag to be saved
   */
  async saveFlag(flag: Flag): Promise<Flag> {
    const sanitized: RedisFlag = {
      description: flag.description,
      rollout: flag.rollout
    }
    await this.redis.set(flagKey(flag.namespace, flag.name), JSON.stringify(sanitized))
    return flag
  }

  /**
   * Deletes a flag from a namespace
   * @param namespace Flag namespace
   * @param name Flag name
   * @returns Whether a flag existed and was deleted (`true`), or not (`false`)
   */
  async deleteFlag(namespace: string, name: string): Promise<boolean> {
    const res = await this.redis.del(flagKey(namespace, name))
    return res > 0
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
  private async getFlagByKey(key: string):  Promise<Flag> {
    const value = await this.redis.get(key)
    return value
      ? parseFlag(key, value)
      : Promise.reject(new FlagNotFoundError('flag not found'))
  }

  /**
   * @hidden
   */
  private async createSession(namespace: string, id: string, options: SessionOptions): Promise<Session> {
    const flagOverrides = options && options.flags || {}
    const flags = (await this.listFlags(namespace))
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

function parseFlag (key: string, value: string): Flag {
  const [, namespace, name] = key.split(':')
  return { namespace, name, ...JSON.parse(value) }
}
