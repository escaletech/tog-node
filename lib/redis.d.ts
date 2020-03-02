import { RedisClient as BaseClient, Callback } from 'redis';
export default class RedisClient {
    readonly redis: BaseClient;
    readonly keys: (pattern: string) => Promise<string[]>;
    readonly get: (key: string) => Promise<string>;
    readonly set: (key: string, value: string, flag?: string, duration?: number) => Promise<'OK'>;
    readonly expire: (key: string) => Promise<number>;
    readonly on: (event: string, listener: (...args: any[]) => void) => BaseClient;
    readonly quit: (cb?: Callback<'OK'>) => boolean;
    readonly ttl: (key: string) => Promise<number>;
    readonly del: (key: string) => Promise<number>;
    constructor(redisUrl: string);
}
