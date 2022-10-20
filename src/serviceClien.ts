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
export class ServiceClient {
  private readonly options: SessionClientOptions
  private readonly logger: Logger
  private readonly flags: FlagClient
  private availableFlags: Flag[]
  private readonly namespace: string
  readonly redis: Redis
  readonly subscriber: Redis
  readonly cache: {[namespace: string]: Promise<Flag[]>}

  // every instance of ServiceClient intialized should be for one namespace only:
  /**
   * @param redisUrl The Redis connection string
   * @param namespace The application namespace this ServiceClient serves
   * @param options The client options {timeout, logger}
   */
  constructor(redisUrl: string, namespace: string, options: SessionClientOptions = {}) {
    this.options = options
    this.logger = options.logger || defaultLogger
    this.namespace = namespace || ""
    this.flags = new FlagClient(redisUrl, options)
    this.availableFlags=[]
    this.redis = this.flags.redis
    this.cache = {}
    this.listFlagsWithTimeout(this.options.timeout || DEFAULT_TIMEOUT )
    
    this.subscriber = options.cluster
      ? new RedisClient.Cluster([redisUrl])
      : new RedisClient(redisUrl)

    this.subscriber.subscribe(namespaceChangedKey)
    this.subscriber.on('message', (key, namespace) => this.clearCache(namespace))
  }

  /**
   * Resolves a session, either by retrieving it or by computing a new one
   * @param id Unique session ID
   * @param traits Properties a session has, i.e. admin-user, or production env
   * @param options Options used when creating the flag, which are ignored if it already exists
   */
  async flagsForSession(id: string, traits?: string[], options?: SessionOptions): Promise<Session> {
    const namespace = this.namespace;
    try {
      const flagOverrides = options && options.flags || {}
      const flags = this.availableFlags
        .reduce((all, flag) => ({
          ...all,
          [flag.name]: resolveState(flag.rollout, flag.timestamp || 0, id, traits ?? [])
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


  /**
   * @hidden
   */
  private listFlagsWithTimeout<T>(durationMs: number): Promise<Flag[]|T> {
    let timeout: NodeJS.Timeout
    const timeoutPromise: Promise<T> = new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error(`timeout after ${durationMs}ms`)), durationMs)
    })
    //this.availableFlags = this.listFlags(this.namespace)
    return Promise.race([
      this.listFlags(this.namespace).then(res => {
        clearTimeout(timeout)
        this.availableFlags = res
        return res
      }),
      timeoutPromise
    ])
  }


}
