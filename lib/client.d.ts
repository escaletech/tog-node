import { Flag, Session, SessionOptions } from "./types";
import RedisClient from './redis';
/**
 * A client for Tog operations
 *
 * ```js
 * const { TogClient } = require('tog-node')
 *
 * const tog = new TogClient('redis://127.0.0.1:6379')
 * ```
 */
export declare class TogClient {
    readonly redis: RedisClient;
    /**
     * @param redisUrl The Redis connection string
     */
    constructor(redisUrl: string);
    /**
     * Lists flags in a namespace
     * @param namespace Flags namespace
     */
    listFlags(namespace: string): Promise<Flag[]>;
    /**
     * Gets a single flag from a namespace
     * @param namespace Flag namespace
     * @param name Flag name
     */
    getFlag(namespace: string, name: string): Promise<Flag>;
    /**
     * Creates or updates a flag
     * @param flag The flag to be saved
     */
    saveFlag(flag: Flag): Promise<Flag>;
    /**
     * Deletes a flag from a namespace
     * @param namespace Flag namespace
     * @param name Flag name
     * @returns Whether a flag existed and was deleted (`true`), or not (`false`)
     */
    deleteFlag(namespace: string, name: string): Promise<boolean>;
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
    private getFlagByKey;
    /**
     * @hidden
     */
    private createSession;
    /**
     * @hidden
     */
    private saveSession;
}
