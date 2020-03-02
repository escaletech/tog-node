import redis from 'redis'
import { promisify } from 'util'

import { FlagClient, SessionClient, Flag } from '../src'
import RedisClient from '../src/redis'

const redisUrl = 'redis://127.0.0.1:6379/1'

const clients = []

export function newFlagClient (n: number = 1): [FlagClient, RedisClient] {
  const tog = new FlagClient(redisUrl)
  tog.redis.redis.on('error', err => fail(err))
  clients.push(tog.redis.redis)
  return [tog, tog.redis]
}

export function newSessionClient (n: number = 1): [SessionClient, RedisClient] {
  const tog = new SessionClient(redisUrl)
  tog.redis.redis.on('error', err => fail(err))
  clients.push(tog.redis.redis)
  return [tog, tog.redis]
}

export function cleanUp(): Promise<any> {
  const redisClient = redis.createClient(redisUrl)
  const flushdb = promisify(redisClient.flushdb).bind(redisClient)
  return flushdb().then(() => redisClient.quit())
}

export function saveAllFlags (redis: RedisClient, flags: Flag[]): Promise<any> {
  return Promise.all(flags.map(flag =>
    redis.set(`tog2:flag:${flag.namespace}:${flag.name}`, JSON.stringify(flag))))
}

afterAll(() => clients.forEach(c => c.quit()))
