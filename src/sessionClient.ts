import RedisClient from 'ioredis';

import { Flag, Session, SessionOptions, SessionClientOptions } from "./types";
import { resolveState } from './sessions';
import { FlagClient } from "./flagClient";
import { Redis } from "./redis";
import { Logger, defaultLogger } from "./logger";
import { namespaceChangedKey } from "./keys";

const DEFAULT_TIMEOUT = 300

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
  private readonly options: SessionClientOptions
  private readonly logger: Logger
  private readonly flags: FlagClient
  readonly redis: Redis
  readonly subscriber: Redis
  readonly cache: {[namespace: string]: Promise<Flag[]>}

  /**
   * @param redisUrl The Redis connection string
   */
  constructor(redisUrl: string, options: SessionClientOptions = {}) {
    this.options = options
    this.logger = options.logger || defaultLogger
    this.flags = new FlagClient(redisUrl, options)
    this.redis = this.flags.redis
    this.cache = {}

    this.subscriber = options.cluster
      ? new RedisClient.Cluster([redisUrl])
      : new RedisClient(redisUrl)

    this.subscriber.subscribe(namespaceChangedKey)
    this.subscriber.on('message', (key, namespace) => this.clearCache(namespace))
  }

  /**
   * Resolves a session, either by retrieving it or by computing a new one
   * @param namespace Flags namespace
   * @param id Unique session ID
   * @param options Options used when creating the flag, which are ignored if it already exists
   */
  async session(namespace: string, id: string, options?: SessionOptions): Promise<Session> {
    try {
      const flagOverrides = options && options.flags || {}
      const availableFlags = await withTimeout(
        this.options.timeout || DEFAULT_TIMEOUT,
        () => this.listFlags(namespace))
      const flags = availableFlags
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
    } catch (e) {
      this.logger.error(e)
      return { namespace, id, flags: {} }
    }
  }

  private clearCache(namespace: string) {
    this.logger.info(`namespace ${namespace} has changed`)
    delete(this.cache[namespace])
  }

  private listFlags(namespace: string): Promise<Flag[]> {
    return this.cache[namespace] || (this.cache[namespace] = this.flags.listFlags(namespace))
  }
}

/**
 * @hidden
 */
function withTimeout<T>(durationMs: number, promise: () => Promise<T>): Promise<T> {
  let timeout: NodeJS.Timeout
  const timeoutPromise: Promise<T> = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(`timeout after ${durationMs}ms`)), durationMs)
  })

  return Promise.race([
    promise().then(res => {
      clearTimeout(timeout)
      return res
    }),
    timeoutPromise
  ])
}
