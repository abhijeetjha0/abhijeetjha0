import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimiter {
    limit: (identifier: string) => Promise<{ success: boolean; remaining?: number }>;
}

class InMemoryRateLimiter implements RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(maxRequests = 5, windowMs = 10000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    async limit(identifier: string) {
        const now = Date.now();
        const timestamps = this.requests.get(identifier) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            return { success: false, remaining: 0 };
        }

        validTimestamps.push(now);
        this.requests.set(identifier, validTimestamps);

        return { success: true, remaining: this.maxRequests - validTimestamps.length };
    }
}

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

let chatRateLimit: RateLimiter;
let chatDailyRateLimit: RateLimiter;

if (redisUrl && redisToken) {
    const redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });

    chatRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '10 s'),
        prefix: 'chat_burst',
        analytics: true,
    });

    chatDailyRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(25, '24 h'),
        prefix: 'chat_daily',
        analytics: true,
    });
} else {
    chatRateLimit = new InMemoryRateLimiter(5, 10000);
    chatDailyRateLimit = new InMemoryRateLimiter(25, 24 * 60 * 60 * 1000);
}

export { chatRateLimit, chatDailyRateLimit };
