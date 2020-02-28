import { Flag, Session, SessionOptions, RedisFlag, FlagNotFoundError } from "./types";
import RedisClient from './redis';
import { parseSession, resolveState } from './sessions';

export * from './types'

const keyFormat = {
  flag(namespace: string, name: string): string {
    return `flag:${namespace}:${name}`
  },
  session(namespace: string, id: string): string {
    return `session:${namespace}:${id}`
  }
}

export class TogClient {
  readonly redis: RedisClient

  constructor(redisUrl: string) {
    this.redis = new RedisClient(redisUrl)
  }

  async listFlags(namespace: string): Promise<Flag[]> {
    const keys = await this.redis.keys(keyFormat.flag(namespace, '*'))
    return await Promise.all(keys.sort().map(key => this.getFlagByKey(key)))
  }

  async getFlag(namespace: string, name: string): Promise<Flag> {
    return this.getFlagByKey(keyFormat.flag(namespace, name))
  }

  async saveFlag(flag: Flag): Promise<Flag> {
    const sanitized: RedisFlag = {
      description: flag.description,
      rollout: flag.rollout
    }
    await this.redis.set(keyFormat.flag(flag.namespace, flag.name), JSON.stringify(sanitized))
    return flag
  }

  async deleteFlag(namespace: string, name: string): Promise<boolean> {
    const res = await this.redis.del(keyFormat.flag(namespace, name))
    return res > 0
  }

  async session(namespace: string, id: string, options: SessionOptions): Promise<Session> {
    const key = `session:${namespace}:${id}`
    const value = await this.redis.get(key)
    return value
      ? parseSession(namespace, id, value)
      : this.createSession(namespace, id, options)
  }

  private async getFlagByKey(key: string):  Promise<Flag> {
    const value = await this.redis.get(key)
    return value
      ? parseFlag(key, value)
      : Promise.reject(new FlagNotFoundError('flag not found'))
  }

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

  private async saveSession(session: Session, duration: number) {
    const key = `session:${session.namespace}:${session.id}`
    await this.redis.set(key, JSON.stringify(session.flags), 'EX', duration)
  }
}

function parseFlag (key: string, value: string): Flag {
  const [, namespace, name] = key.split(':')
  return { namespace, name, ...JSON.parse(value) }
}
