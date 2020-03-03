import { Flag, Rollout, FlagNotFoundError } from "./types";
import RedisClient, { Redis } from 'ioredis';
import { flagKey } from './keys'

interface RedisFlag {
  description?: string
  rollout: Rollout[]
}

/**
 * A client for managing flags
 *
 * ```js
 * const { FlagClient } = require('tog-node')
 *
 * const tog = new FlagClient('redis://127.0.0.1:6379')
 * ```
 */
export class FlagClient {
  readonly redis: Redis

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
   * @hidden
   */
  private async getFlagByKey(key: string):  Promise<Flag> {
    const value = await this.redis.get(key)
    return value
      ? parseFlag(key, value)
      : Promise.reject(new FlagNotFoundError('flag not found'))
  }
}

function parseFlag (key: string, value: string): Flag {
  const [,, namespace, name] = key.split(':')
  return { namespace, name, ...JSON.parse(value) }
}
