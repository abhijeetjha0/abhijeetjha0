import { CORS_HEADERS, SYSTEM_PROMPT } from './constants.js';
import { chatRateLimit, chatDailyRateLimit } from './rateLimit.js';
import { executeProviderWaterfall } from './providers/index.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                ...CORS_HEADERS,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 204,
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
        console.info(`[api/chat] Received POST request to /api/chat`);

        const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

        // 1. Anti-abuse burst rate limit (5 requests / 10s)
        if (chatRateLimit) {
            const { success } = await chatRateLimit.limit(ip);
            if (!success) {
                console.warn(`[api/chat] Burst rate limit exceeded for IP: ${ip}`);

                return new Response('Too Many Requests', { status: 429, headers: CORS_HEADERS });
            }
        }

        // 2. Fair-use daily message quota (25 requests / 24h)
        let dailyRemaining: number | undefined;
        if (chatDailyRateLimit) {
            const { success, remaining } = await chatDailyRateLimit.limit(ip);
            dailyRemaining = remaining;
            if (!success) {
                console.warn(`[api/chat] Daily quota reached for IP: ${ip}`);

                return new Response('Daily message quota reached (25/25). Please try again tomorrow.', {
                    status: 429,
                    headers: {
                        ...CORS_HEADERS,
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Limit': '25',
                    },
                });
            }
        }

        const body = await req.json().catch(() => ({}));
        const { messages, preferredProvider } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response('Invalid request body: "messages" array is required', {
                status: 400,
                headers: CORS_HEADERS,
            });
        }

        // Execute the multi-provider waterfall across configured free providers
        const result = await executeProviderWaterfall(
            messages,
            SYSTEM_PROMPT,
            preferredProvider
        );

        if (result.success && result.response) {
            const responseHeaders: Record<string, string> = {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-AI-Provider': result.response.provider,
                'X-AI-Model': result.response.model,
                'X-RateLimit-Limit': '25',
                ...CORS_HEADERS,
            };

            if (dailyRemaining !== undefined) {
                responseHeaders['X-RateLimit-Remaining'] = String(dailyRemaining);
            }

            return new Response(result.response.content, {
                headers: responseHeaders,
            });
        }

        const isRateLimited = result.attempts.some(a => a.rateLimited);
        const status = isRateLimited ? 429 : 503;

        return new Response(
            result.error || 'All AI providers are currently unavailable. Please try again shortly.',
            { status, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error('Chat API Error:', error);

        return new Response('Internal Server Error', { status: 500, headers: CORS_HEADERS });
    }
}

