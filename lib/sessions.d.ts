import { Rollout, Session } from './types';
export declare function parseSession(namespace: string, id: string, value: string): Session;
export declare function resolveState(rollouts: Rollout[]): boolean;
