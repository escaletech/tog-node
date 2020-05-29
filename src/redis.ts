import { Commands } from 'ioredis'
import { EventEmitter } from 'events'

export interface Redis extends EventEmitter, Commands {}
