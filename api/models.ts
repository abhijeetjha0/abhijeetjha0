import { CORS_HEADERS } from './constants.js';
import { chatRateLimit } from './rateLimit.js';
import { getConfiguredProviders } from './providers/index.js';
import { isFreeHuggingFaceModel } from './providers/registry.js';
import { syncFreeModels } from './providers/sync.js';
import { ProviderModel } from './providers/types.js';

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
        const { models: dynamicModels, ollamaModels } = await syncFreeModels();
        const configured = getConfiguredProviders();

        // If no providers are configured at all
        if (configured.length === 0) {
            console.warn('[api/models] No AI providers are configured in environment variables, using synced free models');

            return new Response(JSON.stringify(dynamicModels), {
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
                },
            });
        }

        // Collect the default models for all configured providers
        const models: ProviderModel[] = [];
        for (const p of configured) {
            let envModel: string | undefined;
            if (p.name === 'openrouter') {
                // OpenRouter is strictly locked to openrouter/free to eliminate charges
                envModel = 'openrouter/free';
            } else if (p.name === 'huggingface') {
                envModel = process.env.HF_MODEL;
                if (envModel && !isFreeHuggingFaceModel(envModel)) {
                    console.warn(`[api/models] Ignoring non-free HF_MODEL "${envModel}". Defaulting to verified free model.`);
                    envModel = undefined;
                }
                if (!envModel) {
                    const dynamicHf = dynamicModels.find(m => m.provider === 'huggingface')?.model;
                    envModel = dynamicHf || p.defaultModel;
                }
            } else if (p.name === 'ollama') {
                envModel = process.env.OLLAMA_MODEL;
                if (!envModel) {
                    const dynamicOllama = dynamicModels.find(m => m.provider === 'ollama')?.model;
                    envModel = dynamicOllama || p.defaultModel;
                }
            }
            models.push({
                provider: p.name,
                model: envModel || p.defaultModel,
            });
        }

        // If Ollama is configured and is the only provider, include extra discovered models
        if (configured.length === 1 && configured[0].name === 'ollama' && Array.isArray(ollamaModels)) {
            for (const extraModel of ollamaModels) {
                if (!models.some(existing => existing.provider === 'ollama' && existing.model === extraModel)) {
                    models.push({ provider: 'ollama', model: extraModel });
                }
            }
        }

        // Prioritize DEFAULT_AI_PROVIDER if set
        const preferred = process.env.DEFAULT_AI_PROVIDER;
        if (preferred) {
            models.sort((a, b) => {
                if (a.provider === preferred) return -1;
                if (b.provider === preferred) return 1;

                return 0;
            });
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

