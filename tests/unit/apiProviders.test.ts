import {
    callOpenAICompatibleProvider,
    executeProviderWaterfall,
    getConfiguredProviders,
    FREE_PROVIDERS,
} from '../../api/providers';

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
        const testConfig = FREE_PROVIDERS[0]; // github

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

        it('detects OpenRouter and Hugging Face when keys are set', () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.HF_TOKEN = 'hf_xxx';
            const providers = getConfiguredProviders();
            expect(providers.map(p => p.name)).toEqual(['openrouter', 'huggingface']);
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
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.HF_TOKEN = 'hf_xxx';

            // OpenRouter 429
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: async () => 'Rate limit exceeded on OpenRouter',
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

        it('respects DEFAULT_AI_PROVIDER to reorder priority', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-xxx';
            process.env.HF_TOKEN = 'hf_xxx';
            process.env.DEFAULT_AI_PROVIDER = 'huggingface';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Hugging Face priority response' } }],
                }),
            });

            const result = await executeProviderWaterfall(
                [{ role: 'user', content: 'Hi' }],
                'System prompt'
            );

            expect(result.success).toBe(true);
            expect(result.response?.provider).toBe('huggingface');
            expect(result.attempts[0].provider).toBe('huggingface');
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
    });
});
