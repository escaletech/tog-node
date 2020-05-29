import { Flag, Rollout, FlagNotFoundError, ClientOptions } from "./types";
import RedisClient from 'ioredis';
import { namespaceKey, namespaceChangedKey } from './keys'
import { Redis } from "./redis";

interface RedisFlag {
  description?: string
  timestamp: number
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
  constructor(redisUrl: string, options: ClientOptions = {}) {
    this.redis = options.cluster
      ? new RedisClient.Cluster([redisUrl])
      : new RedisClient(redisUrl)
  }

  /**
   * Lists flags in a namespace
   * @param namespace Flags namespace
   */
  async listFlags(namespace: string): Promise<Flag[]> {
    const records = await this.redis.hgetall(namespaceKey(namespace))
    return Object.keys(records).sort().map(name => {
      return { namespace, name, ...JSON.parse(records[name]) }
    })
  }

  /**
   * Gets a single flag from a namespace
   * @param namespace Flag namespace
   * @param name Flag name
   */
  async getFlag(namespace: string, name: string): Promise<Flag> {
    const flag = await this.redis.hget(namespaceKey(namespace), name)
    return flag === null
      ? Promise.reject(new FlagNotFoundError('flag not found'))
      : { namespace, name, ...JSON.parse(flag) }
  }

  /**
   * Creates or updates a flag
   * @param flag The flag to be saved
   */
  async saveFlag(flag: Flag): Promise<Flag> {
    const sanitized: RedisFlag = {
      description: flag.description,
      timestamp: Math.round((new Date()).getTime() / 1000),
      rollout: flag.rollout
    }
    await this.redis.hset(namespaceKey(flag.namespace), flag.name, JSON.stringify(sanitized))
    await this.redis.publish(namespaceChangedKey, flag.namespace)
    return flag
  }

  /**
   * Deletes a flag from a namespace
   * @param namespace Flag namespace
   * @param name Flag name
   * @returns Whether a flag existed and was deleted (`true`), or not (`false`)
   */
  async deleteFlag(namespace: string, name: string): Promise<boolean> {
    const res = await this.redis.hdel(namespaceKey(namespace), name)
    await this.redis.publish(namespaceChangedKey, namespace)
    return res > 0
  }
}
