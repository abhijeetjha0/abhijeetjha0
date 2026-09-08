import { CORS_HEADERS, OLLAMA_API } from './constants.js';
import { chatRateLimit } from './rateLimit.js';
import { getConfiguredProviders } from './providers/index.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                ...CORS_HEADERS,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 204,
        });
    }

    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (chatRateLimit) {
        const { success } = await chatRateLimit.limit(ip);
        if (!success) {
            console.warn(`[api/models] Rate limit exceeded for IP: ${ip}`);

            return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
                status: 429, 
                headers: CORS_HEADERS 
            });
        }
    }

    try {
        const configured = getConfiguredProviders();

        // If no providers are configured at all
        if (configured.length === 0) {
            console.warn('[api/models] No AI providers are configured in environment variables');

            return new Response(JSON.stringify(['meta-llama/llama-3.3-70b-instruct:free']), {
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                },
            });
        }

        // Collect the default models for all configured providers
        const models: string[] = [];
        for (const p of configured) {
            models.push(p.defaultModel);
        }

        // If Ollama is configured and is the only provider, optionally fetch extra models
        if (configured.length === 1 && configured[0].name === 'ollama') {
            const apiKey = process.env.OLLAMA_API_KEY;
            if (apiKey) {
                try {
                    const res = await fetch(`${OLLAMA_API}/models`, {
                        headers: { Authorization: `Bearer ${apiKey}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const ollamaModels = data?.data?.map((m: { id: string }) => m.id) || [];
                        if (ollamaModels.length > 0) {
                            models.push(...ollamaModels.filter((m: string) => !models.includes(m)));
                        }
                    }
                } catch {
                    // Ignore Ollama fetch errors and use default
                }
            }
        }

        return new Response(JSON.stringify(models), {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Models API Error:', error);

        return new Response('Internal Server Error', { status: 500, headers: CORS_HEADERS });
    }
}

