import { Redis } from '@upstash/redis';
import { ProviderModel } from './types.js';
import { setDynamicFreeHuggingFaceModels, getDynamicFreeHuggingFaceModels } from './registry.js';

interface CachedData {
    timestamp: number;
    models: ProviderModel[];
    hfFreeModels: string[];
    ollamaModels: string[];
    opencodeZenModels?: string[];
}

let inMemoryCache: CachedData | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REDIS_KEY = 'portfolio_free_models_cache';

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

let redisClient: Redis | null = null;
if (redisUrl && redisToken) {
    redisClient = new Redis({
        url: redisUrl,
        token: redisToken,
    });
}

export function resetSyncCacheForTesting(): void {
    inMemoryCache = null;
}

export function getCachedFreeHuggingFaceModels(): string[] {
    if (inMemoryCache && Array.isArray(inMemoryCache.hfFreeModels) && inMemoryCache.hfFreeModels.length > 0) {
        return inMemoryCache.hfFreeModels;
    }

    const dynamic = getDynamicFreeHuggingFaceModels();
    if (dynamic.length > 0) {
        return dynamic;
    }

    return ['Qwen/Qwen3.8-27B:ovhcloud'];
}

export async function fetchFreeHuggingFaceModels(): Promise<string[]> {
    try {
        const res = await fetch('https://router.huggingface.co/v1/models');
        if (!res.ok) {
            console.warn(`[api/providers/sync] Failed to fetch HF router models: HTTP ${res.status}`);

            return getCachedFreeHuggingFaceModels();
        }

        const data = await res.json();
        const freeModels: string[] = [];

        if (Array.isArray(data?.data)) {
            for (const m of data.data) {
                for (const p of m.providers || []) {
                    if (p.pricing && p.pricing.input === 0 && p.pricing.output === 0 && p.status === 'live') {
                        freeModels.push(`${m.id}:${p.provider}`);
                    }
                }
            }
        }

        if (freeModels.length > 0) {
            // Prioritize Qwen instruction/chat models
            freeModels.sort((a, b) => {
                const aQwen = a.toLowerCase().includes('qwen');
                const bQwen = b.toLowerCase().includes('qwen');
                if (aQwen && !bQwen) {
                    return -1;
                }
                if (!aQwen && bQwen) {
                    return 1;
                }

                return 0;
            });

            return freeModels;
        }
    } catch (err) {
        console.warn('[api/providers/sync] Error fetching HF free models:', err);
    }

    return getCachedFreeHuggingFaceModels();
}

export async function fetchOllamaModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || process.env.OLLAMA_API_KEY;
    if (!key) {
        return ['gemma4:31b'];
    }

    try {
        // Fetch usage to discover included models on the account
        const usageRes = await fetch('https://ollama.com/api/usage', {
            headers: { Authorization: `Bearer ${key}` },
        });

        const includedModels: string[] = [];
        if (usageRes.ok) {
            const usageData = await usageRes.json();
            const monthlyModels = usageData?.limits?.monthly?.models;
            if (Array.isArray(monthlyModels)) {
                for (const item of monthlyModels) {
                    if (item.name && typeof item.name === 'string') {
                        includedModels.push(item.name);
                    }
                }
            }
        }

        // Fetch available models from /v1/models
        const modelsRes = await fetch('https://ollama.com/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
        });

        let availableModels: string[] = [];
        if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            if (Array.isArray(modelsData?.data)) {
                availableModels = modelsData.data.map((m: { id: string }) => m.id);
            }
        }

        const combined = Array.from(new Set([...includedModels, ...availableModels]));
        if (combined.length > 0) {
            // Prioritize gemma4:31b if present
            combined.sort((a, b) => {
                if (a === 'gemma4:31b') {
                    return -1;
                }
                if (b === 'gemma4:31b') {
                    return 1;
                }

                return 0;
            });

            return combined;
        }
    } catch (err) {
        console.warn('[api/providers/sync] Error discovering Ollama models:', err);
    }

    return ['gemma4:31b'];
}

export async function fetchOpenCodeZenModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || process.env.OPENCODE_ZEN_API_KEY || process.env.OPENCODE_API_KEY;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (key) {
        headers.Authorization = `Bearer ${key}`;
    }

    try {
        const res = await fetch('https://opencode.ai/zen/v1/models', { headers });
        if (!res.ok) {
            console.warn(`[api/providers/sync] Failed to fetch OpenCode Zen models: HTTP ${res.status}`);

            return ['glm-5.3-flash-free'];
        }

        const data = await res.json();
        let availableModels: string[] = [];
        if (Array.isArray(data?.data)) {
            availableModels = data.data
                .map((m: { id: string }) => m.id)
                .filter((id: string) => id.endsWith('-free'));
        }

        if (availableModels.length > 0) {
            // Prioritize glm-5.3-flash-free and flash-free models
            availableModels.sort((a, b) => {
                if (a === 'glm-5.3-flash-free') {
                    return -1;
                }
                if (b === 'glm-5.3-flash-free') {
                    return 1;
                }
                if (a.includes('flash') && !b.includes('flash')) {
                    return -1;
                }
                if (!a.includes('flash') && b.includes('flash')) {
                    return 1;
                }

                return 0;
            });

            return availableModels;
        }
    } catch (err) {
        console.warn('[api/providers/sync] Error discovering OpenCode Zen models:', err);
    }

    return ['glm-5.3-flash-free'];
}

export async function syncFreeModels(forceRefresh = false): Promise<{
    models: ProviderModel[];
    hfFreeModels: string[];
    ollamaModels: string[];
    opencodeZenModels?: string[];
    source: 'cache' | 'kv' | 'live';
}> {
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceRefresh && inMemoryCache && now - inMemoryCache.timestamp < CACHE_TTL_MS) {
        setDynamicFreeHuggingFaceModels(inMemoryCache.hfFreeModels);

        return {
            models: inMemoryCache.models,
            hfFreeModels: inMemoryCache.hfFreeModels,
            ollamaModels: inMemoryCache.ollamaModels || ['gemma4:31b'],
            opencodeZenModels: inMemoryCache.opencodeZenModels || ['glm-5.3-flash-free'],
            source: 'cache',
        };
    }

    // 2. Check Upstash Redis / KV cache
    if (!forceRefresh && redisClient) {
        try {
            const cached = await redisClient.get<CachedData>(REDIS_KEY);
            if (cached && Array.isArray(cached.models) && Array.isArray(cached.hfFreeModels)) {
                inMemoryCache = cached;
                setDynamicFreeHuggingFaceModels(cached.hfFreeModels);

                return {
                    models: cached.models,
                    hfFreeModels: cached.hfFreeModels,
                    ollamaModels: cached.ollamaModels || ['gemma4:31b'],
                    opencodeZenModels: cached.opencodeZenModels || ['glm-5.3-flash-free'],
                    source: 'kv',
                };
            }
        } catch (err) {
            console.warn('[api/providers/sync] Redis read error:', err);
        }
    }

    // 3. Perform live sync
    console.info('[api/providers/sync] Performing live sync of free AI models...');
    const [hfFreeModels, ollamaModels, opencodeZenModels] = await Promise.all([
        fetchFreeHuggingFaceModels(),
        fetchOllamaModels(),
        fetchOpenCodeZenModels(),
    ]);

    setDynamicFreeHuggingFaceModels(hfFreeModels);

    const dynamicModels: ProviderModel[] = [
        { provider: 'openrouter', model: 'openrouter/free' },
        { provider: 'opencode_zen', model: opencodeZenModels[0] || 'glm-5.3-flash-free' },
        { provider: 'ollama', model: ollamaModels[0] || 'gemma4:31b' },
        { provider: 'huggingface', model: hfFreeModels[0] || 'Qwen/Qwen3.8-27B:ovhcloud' },
    ];

    const cacheEntry: CachedData = {
        timestamp: now,
        models: dynamicModels,
        hfFreeModels,
        ollamaModels,
        opencodeZenModels,
    };

    inMemoryCache = cacheEntry;

    if (redisClient) {
        try {
            await redisClient.set(REDIS_KEY, cacheEntry, { ex: 86400 }); // 24-hour TTL
        } catch (err) {
            console.warn('[api/providers/sync] Redis write error:', err);
        }
    }

    return {
        models: dynamicModels,
        hfFreeModels,
        ollamaModels,
        opencodeZenModels,
        source: 'live',
    };
}

