import RedisClient from 'ioredis';

import { FlagClient, SessionClient, Flag } from '../src'
import { namespaceKey } from '../src/keys';
import { Redis } from '../src/redis';

const redisUrl = 'redis://127.0.0.1:6379/1'

const clients = []

export function newFlagClient (): [FlagClient, Redis] {
  const tog = new FlagClient(redisUrl)
  tog.redis.on('error', err => fail(err))
  clients.push(tog.redis)
  return [tog, tog.redis]
}

export function newSessionClient (): [SessionClient, Redis] {
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
  return Promise.all(flags.map(({ namespace, name, ...flag }) =>
    redis.hset(namespaceKey(namespace), name, JSON.stringify(flag))))
}

export function newTimestamp(): number {
  return Math.round((new Date()).getTime() / 1000)
}

afterAll(() => clients.forEach(c => c.quit()))
