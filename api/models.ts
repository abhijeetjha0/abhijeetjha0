import { OLLAMA_API, CORS_HEADERS } from './constants';
import { chatRateLimit } from './rateLimit';

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

    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) {
        console.error('OLLAMA_API_KEY is not set');

        return new Response('Server configuration error', { status: 500, headers: CORS_HEADERS });
    }

    const AUTH_HEADERS = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
    // 1. Fetch all available models
        console.info(`[api/models] Fetching all available models from Ollama API...`);
        const modelsResponse = await fetch(`${OLLAMA_API}/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!modelsResponse.ok) {
            throw new Error(`Failed to fetch models: ${await modelsResponse.text()}`);
        }

        const modelsData = await modelsResponse.json();
        const allModels = modelsData?.data?.map((m: { id: string }) => m.id) || [];
        console.info(`[api/models] Discovered ${allModels.length} total models. Testing for free-tier access...`);

        // 2. Test models until we find 3 free ones
        const freeModels: string[] = [];
    
        for (const model of allModels) {
            if (freeModels.length >= 3) break;

            console.info(`[api/models] Testing model: ${model}...`);
            console.time(`ollama-test-${model}`);

            const payload = {
                model,
                messages: [{ role: 'user', content: 'test' }],
                stream: false,
            };

            const response = await fetch(`${OLLAMA_API}/chat/completions`, {
                method: 'POST',
                headers: AUTH_HEADERS,
                body: JSON.stringify(payload),
            });

            console.timeEnd(`ollama-test-${model}`);

            if (response.ok) {
                console.info(`[api/models] Success! Model ${model} is available.`);
                freeModels.push(model);
            } else {
                const errorText = await response.text();
                if (errorText.includes('subscription')) {
                    console.warn(`[api/models] Model ${model} requires subscription. Skipping.`);
                }
                // Stop entirely if unauthorized/invalid key, but ignore subscription errors
                if (response.status === 401 && !errorText.includes('subscription')) {
                    throw new Error('API Key Unauthorized');
                }
            }
        }

        if (freeModels.length === 0) {
            console.warn(`[api/models] No free models could be found out of ${allModels.length} tested models.`);
            return new Response(JSON.stringify({ error: 'No free models available' }), { 
                status: 503, 
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
            });
        }

        console.info(`[api/models] Successfully identified ${freeModels.length} free models: ${freeModels.join(', ')}`);

        // 3. Return the array of free models, heavily cached at the Edge
        return new Response(JSON.stringify(freeModels), {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/json',
                // Cache at edge for 1 hour, serve stale while revalidating
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
            }
        });

    } catch (error) {
        console.error('Models API Error:', error);

        return new Response('Internal Server Error', { status: 500, headers: CORS_HEADERS });
    }
}
