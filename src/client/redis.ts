import { createClient, RedisClient as BaseClient, Callback } from 'redis'
import { promisify } from 'util'

export default class RedisClient {
  readonly redis: BaseClient
  readonly keys: (pattern: string) => Promise<string[]>
  readonly get: (key: string) => Promise<string>
  readonly set: (key: string, value: string, flag?: string, duration?: number) => Promise<'OK'>
  readonly expire: (key: string) => Promise<number>
  readonly on: (event: string, listener: (...args: any[]) => void) => BaseClient
  readonly quit: (cb?: Callback<'OK'>) => boolean
  readonly ttl: (key: string) => Promise<number>

  constructor(redisUrl: string) {
    const redis = createClient(redisUrl)
    this.redis = redis
    this.keys = promisify(redis.keys).bind(redis)
    this.get = promisify(redis.get).bind(redis)
    this.set = promisify(redis.set).bind(redis)
    this.expire = promisify(redis.expire).bind(redis)
    this.ttl = promisify(redis.ttl).bind(redis)

    this.on = redis.on
    this.quit = redis.quit
  }
}
