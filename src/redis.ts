import { KeyType, ValueType } from 'ioredis'

export interface Redis {
        get(key: KeyType): Promise<string | null>;

        set(
            key: KeyType,
            value: ValueType,
            expiryMode?: string | any[],
            time?: number | string,
            setMode?: number | string,
        ): Promise<string>;

        del(...keys: KeyType[]): Promise<number>;

        keys(pattern: string): Promise<string[]>;

        quit(): Promise<string>;
}
