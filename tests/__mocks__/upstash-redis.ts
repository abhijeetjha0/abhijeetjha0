export class Redis {
    private static memoryStore = new Map<string, unknown>();

    constructor(_config?: unknown) {}

    async get<T = unknown>(key: string): Promise<T | null> {
        const val = Redis.memoryStore.get(key);
        if (val === undefined) {
            return null;
        }

        return val as T;
    }

    async set(key: string, value: unknown, _opts?: unknown): Promise<'OK'> {
        Redis.memoryStore.set(key, value);

        return 'OK';
    }

    static clearStore(): void {
        Redis.memoryStore.clear();
    }
}
