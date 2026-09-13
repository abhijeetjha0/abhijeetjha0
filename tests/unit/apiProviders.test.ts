import {
    callOpenAICompatibleProvider,
    executeProviderWaterfall,
    getConfiguredProviders,
    FREE_PROVIDERS,
    fetchFreeHuggingFaceModels,
    fetchOllamaModels,
    syncFreeModels,
    getCachedFreeHuggingFaceModels,
    resetSyncCacheForTesting,
} from '../../api/providers';
import {
    isFreeHuggingFaceModel,
    setDynamicFreeHuggingFaceModels,
    getDynamicFreeHuggingFaceModels,
} from '../../api/providers/registry';

const originalEnv = process.env;

describe('api/providers', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env = { ...originalEnv };
        // Clear all provider env keys by default
        delete process.env.GITHUB_TOKEN;
        delete process.env.GH_MODELS_TOKEN;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.HF_TOKEN;
        delete process.env.HUGGINGFACE_API_KEY;
        delete process.env.OLLAMA_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;

        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('callOpenAICompatibleProvider', () => {
        const testConfig = FREE_PROVIDERS.find(p => p.name === 'openrouter')!;

        it('makes successful POST request with auth header and payload', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'Hello from AI assistant!',
                            },
                        },
                    ],
                }),
            });

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.content).toBe('Hello from AI assistant!');
            expect(result.response?.provider).toBe('openrouter');
            expect(mockFetch).toHaveBeenCalledWith(
                testConfig.endpoint,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-key',
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('strictly forces openrouter/free for OpenRouter even when modelOverride or OPENROUTER_MODEL is set', async () => {
            process.env.OPENROUTER_MODEL = 'openai/gpt-4o';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'Response from free model',
                            },
                        },
                    ],
                }),
            });

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt',
                'anthropic/claude-3.5-sonnet'
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('openrouter');
            expect(result.response?.model).toBe('openrouter/free');
            expect(mockFetch).toHaveBeenCalledWith(
                testConfig.endpoint,
                expect.objectContaining({
                    body: JSON.stringify({
                        model: 'openrouter/free',
                        messages: [
                            { role: 'system', content: 'System prompt' },
                            { role: 'user', content: 'Hi' },
                        ],
                        stream: false,
                    }),
                })
            );
        });

        it('strips markdown code block wrappers if present in output', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: '```markdown\nStripped content\n```',
                            },
                        },
                    ],
                }),
            });

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.content).toBe('Stripped content');
        });

        it('handles 429 rate limit correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: async () => 'Rate limit exceeded',
            });

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(false);
            expect(result.rateLimited).toBe(true);
            expect(result.status).toBe(429);
        });

        it('handles other HTTP error responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Server error',
            });

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe('Server error');
        });

        it('catches network exceptions and returns 500 status', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network offline'));

            const result = await callOpenAICompatibleProvider(
                testConfig,
                'test-key',
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe('Network offline');
        });
    });

    describe('getConfiguredProviders', () => {
        it('returns empty array when no keys are set', () => {
            expect(getConfiguredProviders()).toEqual([]);
        });

        it('detects OpenRouter when OPENROUTER_API_KEY is set', () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            const providers = getConfiguredProviders();
            expect(providers.map(p => p.name)).toContain('openrouter');
        });

        it('detects OpenRouter and Hugging Face when keys are set in priority order', () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.HF_TOKEN = 'hf_xxx';
            const providers = getConfiguredProviders();
            expect(providers.map(p => p.name)).toEqual(['huggingface', 'openrouter']);
        });

        it('detects all providers in priority order (Ollama, Hugging Face, OpenRouter)', () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.HF_TOKEN = 'hf_xxx';
            process.env.OLLAMA_API_KEY = 'ollama_xxx';
            const providers = getConfiguredProviders();
            expect(providers.map(p => p.name)).toEqual(['ollama', 'huggingface', 'openrouter']);
        });
    });

    describe('executeProviderWaterfall', () => {
        it('fails gracefully when no provider is configured', async () => {
            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('No AI provider is configured');
        });

        it('uses configured provider and returns response on success', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Response from OpenRouter' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.content).toBe('Response from OpenRouter');
            expect(result.response?.provider).toBe('openrouter');
            expect(result.attempts).toHaveLength(1);
            expect(result.attempts[0].success).toBe(true);
        });

        it('cascades to next provider when the first provider encounters rate limit (429)', async () => {
            process.env.OLLAMA_API_KEY = 'ollama_xxx';
            process.env.HF_TOKEN = 'hf_xxx';

            // Ollama 429
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: async () => 'Rate limit exceeded on Ollama',
            });

            // Hugging Face succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Fallback response from Hugging Face' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.content).toBe('Fallback response from Hugging Face');
            expect(result.response?.provider).toBe('huggingface');
            expect(result.attempts).toHaveLength(2);
            expect(result.attempts[0].rateLimited).toBe(true);
            expect(result.attempts[1].success).toBe(true);
        });

        it('uses provider-bound model from modelsToTry when executing waterfall', async () => {
            process.env.HF_TOKEN = 'hf_xxx';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Response with bound model' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt',
                undefined,
                [
                    { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:ovhcloud' },
                    { provider: 'openrouter', model: 'openrouter/free' },
                ]
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('huggingface');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"model":"Qwen/Qwen3.8-27B:ovhcloud"'),
                })
            );
        });

        it('strictly replaces non-free Hugging Face models with default Qwen/Qwen3.8-27B:ovhcloud', async () => {
            process.env.HF_TOKEN = 'hf_xxx';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Defaulted model response' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt',
                undefined,
                [{ provider: 'huggingface', model: 'unsupported/paid-model' }]
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('huggingface');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"model":"Qwen/Qwen3.8-27B:ovhcloud"'),
                })
            );
        });

        it('respects DEFAULT_AI_PROVIDER to reorder priority', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.OLLAMA_API_KEY = 'ollama_xxx';
            process.env.DEFAULT_AI_PROVIDER = 'openrouter';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'OpenRouter priority response' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('openrouter');
            expect(result.attempts[0].provider).toBe('openrouter');
        });

        it('returns error when all configured providers fail', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Error',
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('All available AI providers are currently busy');
        });

        it('validates free Hugging Face models using isFreeHuggingFaceModel', () => {
            expect(isFreeHuggingFaceModel('Qwen/Qwen3.8-27B:ovhcloud')).toBe(true);
            expect(isFreeHuggingFaceModel('Qwen/Qwen3.8-27B')).toBe(true);
            expect(isFreeHuggingFaceModel('inclusionAI/Ling-3.0-flash-Fin:novita')).toBe(true);
            expect(isFreeHuggingFaceModel('inclusionAI/Ling-3.0-flash-VL:novita')).toBe(true);
            expect(isFreeHuggingFaceModel('prism-ml/Ternary-Bonsai-27B-AWQ-4bit:together')).toBe(true);
            expect(isFreeHuggingFaceModel('prism-ml/Ternary-Bonsai-27B-gguf:together')).toBe(true);
            expect(isFreeHuggingFaceModel('Qwen/Qwen2.5-72B-Instruct')).toBe(false);
            expect(isFreeHuggingFaceModel('meta-llama/Llama-3.3-70B-Instruct:ovhcloud')).toBe(false);
            expect(isFreeHuggingFaceModel('openai/gpt-4')).toBe(false);
            expect(isFreeHuggingFaceModel('')).toBe(false);
        });

        it('maps bare Qwen/Qwen3.8-27B to Qwen/Qwen3.8-27B:ovhcloud to lock to free provider endpoint', async () => {
            process.env.HF_TOKEN = 'hf_xxx';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'OVH response' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt',
                undefined,
                [{ provider: 'huggingface', model: 'Qwen/Qwen3.8-27B' }]
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('huggingface');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"model":"Qwen/Qwen3.8-27B:ovhcloud"'),
                })
            );
        });
    });

    describe('model synchronization and dynamic discovery (sync.ts)', () => {
        beforeEach(() => {
            resetSyncCacheForTesting();
            setDynamicFreeHuggingFaceModels([]);
        });

        it('fetches and filters free models from Hugging Face router', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [
                        {
                            id: 'Qwen/Qwen3.8-27B',
                            providers: [
                                { provider: 'ovhcloud', pricing: { input: 0, output: 0 }, status: 'live' },
                                { provider: 'novita', pricing: { input: 0.001, output: 0.002 }, status: 'live' },
                            ],
                        },
                        {
                            id: 'meta-llama/Llama-3.3-70B',
                            providers: [
                                { provider: 'cerebras', pricing: { input: 0.002, output: 0.002 }, status: 'live' },
                            ],
                        },
                        {
                            id: 'inclusionAI/Ling-3.0-flash-Fin',
                            providers: [
                                { provider: 'novita', pricing: { input: 0, output: 0 }, status: 'live' },
                            ],
                        },
                    ],
                }),
            });

            const models = await fetchFreeHuggingFaceModels();
            expect(models).toContain('Qwen/Qwen3.8-27B:ovhcloud');
            expect(models).toContain('inclusionAI/Ling-3.0-flash-Fin:novita');
            expect(models).not.toContain('meta-llama/Llama-3.3-70B:cerebras');
            expect(models[0]).toBe('Qwen/Qwen3.8-27B:ovhcloud');
        });

        it('falls back to static FREE_HUGGINGFACE_MODELS on router fetch error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const models = await fetchFreeHuggingFaceModels();
            expect(models).toContain('Qwen/Qwen3.8-27B:ovhcloud');
            expect(models.length).toBeGreaterThan(0);
        });

        it('discovers included Ollama models from /api/usage and available models from /v1/models', async () => {
            // Mock /api/usage
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    limits: {
                        monthly: {
                            models: [
                                { name: 'gemma4:31b' },
                                { name: 'nemotron-3-super' },
                            ],
                        },
                    },
                }),
            });

            // Mock /v1/models
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [
                        { id: 'gemma4:31b' },
                        { id: 'gpt-oss:120b' },
                    ],
                }),
            });

            const models = await fetchOllamaModels('test-ollama-key');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://ollama.com/api/usage',
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-ollama-key' },
                })
            );
            expect(models).toContain('gemma4:31b');
            expect(models).toContain('nemotron-3-super');
            expect(models).toContain('gpt-oss:120b');
            expect(models[0]).toBe('gemma4:31b');
        });

        it('returns default gemma4:31b if no Ollama API key is set', async () => {
            delete process.env.OLLAMA_API_KEY;
            const models = await fetchOllamaModels();
            expect(models).toEqual(['gemma4:31b']);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('synchronizes and caches free models, and allows dynamic HF model validation', async () => {
            // Mock HF router
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [
                        {
                            id: 'custom-org/Dynamic-Free-Model',
                            providers: [
                                { provider: 'ovhcloud', pricing: { input: 0, output: 0 }, status: 'live' },
                            ],
                        },
                    ],
                }),
            });

            // Mock Ollama /api/usage
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    limits: { monthly: { models: [{ name: 'gemma4:31b' }] } },
                }),
            });

            // Mock Ollama /v1/models
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [{ id: 'gemma4:31b' }],
                }),
            });

            const syncResult = await syncFreeModels();
            expect(syncResult.source).toBe('live');
            expect(syncResult.hfFreeModels).toContain('custom-org/Dynamic-Free-Model:ovhcloud');
            expect(syncResult.models).toContainEqual({
                provider: 'huggingface',
                model: 'custom-org/Dynamic-Free-Model:ovhcloud',
            });

            // Dynamic model should now be recognized as free
            expect(isFreeHuggingFaceModel('custom-org/Dynamic-Free-Model:ovhcloud')).toBe(true);
            expect(getCachedFreeHuggingFaceModels()).toContain('custom-org/Dynamic-Free-Model:ovhcloud');

            // Subsequent call should hit in-memory cache without refetching
            const cachedResult = await syncFreeModels();
            expect(cachedResult.source).toBe('cache');
        });

        it('supports registering and querying dynamic HF free models directly', () => {
            setDynamicFreeHuggingFaceModels(['test-org/Free-Model:provider']);
            expect(getDynamicFreeHuggingFaceModels()).toEqual(['test-org/Free-Model:provider']);
            expect(isFreeHuggingFaceModel('test-org/Free-Model:provider')).toBe(true);
            expect(isFreeHuggingFaceModel('test-org/Unknown-Model')).toBe(false);
        });
    });
});

