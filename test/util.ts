import redis from 'redis'
import { promisify } from 'util'

import { TogClient, Flag } from '../src'
import RedisClient from '../src/client/redis'

const redisUrl = 'redis://127.0.0.1:6379/1'

const clients = []

export function newClients (n: number = 1): [TogClient, RedisClient] {
  const tog = new TogClient(redisUrl)
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
    redis.set(`flag:${flag.namespace}:${flag.name}`, JSON.stringify(flag))))
}

afterAll(() => clients.forEach(c => c.quit()))
