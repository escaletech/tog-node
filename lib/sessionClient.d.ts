import { Session, SessionOptions } from "./types";
import RedisClient from './redis';
/**
 * A client consuming sessions
 *
 * ```js
 * const { SessionClient } = require('tog-node')
 *
 * const tog = new SessionClient('redis://127.0.0.1:6379')
 * ```
 */
export declare class SessionClient {
    private readonly flags;
    readonly redis: RedisClient;
    /**
     * @param redisUrl The Redis connection string
     */
    constructor(redisUrl: string);
    /**
     * Resolves a session, either by retrieving it or by computing a new one
     * @param namespace Flags namespace
     * @param id Unique session ID
     * @param options Options used when creating the flag, which are ignored if it already exists
     */
    session(namespace: string, id: string, options: SessionOptions): Promise<Session>;
    /**
     * @hidden
     */
    private createSession;
    /**
     * @hidden
     */
    private saveSession;
}
