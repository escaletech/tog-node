import RedisClient, { Redis } from 'ioredis';

import { FlagClient, SessionClient, Flag } from '../src'

const redisUrl = 'redis://127.0.0.1:6379/1'

const clients = []

export function newFlagClient (n: number = 1): [FlagClient, Redis] {
  const tog = new FlagClient(redisUrl)
  tog.redis.on('error', err => fail(err))
  clients.push(tog.redis)
  return [tog, tog.redis]
}

export function newSessionClient (n: number = 1): [SessionClient, Redis] {
  const tog = new SessionClient(redisUrl)
  tog.redis.on('error', err => fail(err))
  clients.push(tog.redis)
  return [tog, tog.redis]
}

export function cleanUp(): Promise<any> {
  const redisClient = new RedisClient(redisUrl)
  return redisClient.flushdb().then(() => redisClient.quit())
}

export function saveAllFlags (redis: Redis, flags: Flag[]): Promise<any> {
  return Promise.all(flags.map(flag =>
    redis.set(`tog2:flag:${flag.namespace}:${flag.name}`, JSON.stringify(flag))))
}

afterAll(() => clients.forEach(c => c.quit()))
