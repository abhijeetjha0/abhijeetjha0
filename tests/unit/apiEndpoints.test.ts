jest.mock('../../api/rateLimit', () => ({
    chatRateLimit: {
        limit: jest.fn(),
    },
    chatDailyRateLimit: {
        limit: jest.fn(),
    },
}));

import chatHandler from '../../api/chat';
import modelsHandler from '../../api/models';
import cronHandler from '../../api/cron/sync-models';
import { chatRateLimit, chatDailyRateLimit } from '../../api/rateLimit';

const originalEnv = process.env;
const originalFetch = global.fetch;

describe('api endpoints (chat and models)', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        (chatRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, remaining: 5 });
        (chatDailyRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, remaining: 24 });

        process.env = { ...originalEnv };
        delete process.env.GITHUB_TOKEN;
        delete process.env.GH_MODELS_TOKEN;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.HF_TOKEN;
        delete process.env.HUGGINGFACE_API_KEY;
        delete process.env.OLLAMA_API_KEY;
        delete process.env.OPENCODE_ZEN_API_KEY;
        delete process.env.OPENCODE_API_KEY;
        delete process.env.OPENCODE_ZEN_MODEL;
        delete process.env.OPENCODE_MODEL;
        delete process.env.DEFAULT_AI_PROVIDER;

        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterAll(() => {
        process.env = originalEnv;
        global.fetch = originalFetch;
    });


    describe('/api/chat endpoint', () => {
        it('handles CORS OPTIONS preflight request', async () => {
            const req = new Request('http://localhost:3000/api/chat', {
                method: 'OPTIONS',
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(204);
            expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
        });

        it('rejects non-POST HTTP methods with 405', async () => {
            const req = new Request('http://localhost:3000/api/chat', {
                method: 'GET',
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(405);
        });

        it('rejects missing or invalid messages payload with 400', async () => {
            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(400);
        });

        it('executes chat successfully with provider waterfall and returns headers', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-test-token';

            mockFetch.mockImplementation(async (url: string) => {
                if (url.includes('api.github.com/users/abhijeetjha0/repos')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => [
                            {
                                id: 1,
                                name: 'lint-rules',
                                description: 'Linting presets',
                                html_url: 'https://github.com/abhijeetjha0/lint-rules',
                                homepage: 'https://www.npmjs.com/package/@abhijeetjha0/lint-rules',
                                language: 'JavaScript',
                                fork: false,
                            },
                        ],
                    };
                }

                if (url.includes('openrouter.ai')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            choices: [
                                {
                                    message: {
                                        content: 'Abhijit is a Senior Software Engineer.',
                                    },
                                },
                            ],
                        }),
                    };
                }

                return { ok: true, status: 200, json: async () => ({}) };
            });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'What is Abhijit\'s role?' }],
                    projects: [
                        {
                            name: 'lint-rules',
                            description: 'Linting presets',
                            link: 'https://github.com/abhijeetjha0/lint-rules',
                            homepage: 'https://www.npmjs.com/package/@abhijeetjha0/lint-rules',
                            language: 'JavaScript',
                        },
                    ],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(200);
            expect(res.headers.get('X-AI-Provider')).toBe('openrouter');
            expect(res.headers.get('X-AI-Model')).toBe('openrouter/free');
            expect(res.headers.get('X-RateLimit-Remaining')).toBe('24');
            expect(res.headers.get('X-RateLimit-Limit')).toBe('25');

            const text = await res.text();
            expect(text).toBe('Abhijit is a Senior Software Engineer.');
        });

        it('auto-feeds server-fetched projects into prompt when client projects are not provided', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-test-token';

            let receivedSystemPrompt = '';
            mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
                if (url.includes('api.github.com/users/abhijeetjha0/repos')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => [
                            {
                                id: 99,
                                name: 'server-synced-project',
                                description: 'Server synced description',
                                html_url: 'https://github.com/abhijeetjha0/server-synced-project',
                                fork: false,
                            },
                        ],
                    };
                }

                if (url.includes('openrouter.ai')) {
                    if (options && options.body) {
                        const parsed = JSON.parse(options.body as string);
                        const sysMsg = parsed.messages?.find((m: { role?: string; content?: string }) => m.role === 'system');
                        if (sysMsg) {
                            receivedSystemPrompt = sysMsg.content;
                        }
                    }

                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            choices: [
                                {
                                    message: {
                                        content: 'Here are the projects.',
                                    },
                                },
                            ],
                        }),
                    };
                }

                return { ok: true, status: 200, json: async () => ({}) };
            });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Tell me about your projects' }],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(200);
            expect(receivedSystemPrompt).toContain('server-synced-project');
            expect(receivedSystemPrompt).toContain('Server synced description');
        });

        it('rejects request when burst rate limit is exceeded with 429', async () => {
            (chatRateLimit.limit as jest.Mock).mockResolvedValueOnce({ success: false, remaining: 0 });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(429);
            const text = await res.text();
            expect(text).toBe('Too Many Requests');
        });

        it('rejects request when daily quota is exceeded with 429 and sets remaining to 0', async () => {
            (chatDailyRateLimit.limit as jest.Mock).mockResolvedValueOnce({ success: false, remaining: 0 });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(429);
            expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
            expect(res.headers.get('X-RateLimit-Limit')).toBe('25');
            const text = await res.text();
            expect(text).toContain('Daily message quota reached');
        });

        it('executes chat successfully with opencode_zen and returns provider header', async () => {
            process.env.OPENCODE_ZEN_API_KEY = 'zen-secret-key';

            mockFetch.mockImplementation(async (url: string) => {
                if (url.includes('api.github.com')) {
                    return { ok: true, status: 200, json: async () => [] };
                }

                if (url.includes('opencode.ai/zen')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            choices: [{ message: { content: 'Response from OpenCode Zen' } }],
                            model: 'glm-5.3-flash-free',
                        }),
                    };
                }

                return { ok: true, status: 200, json: async () => ({}) };
            });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Tell me about Abhijit' }],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(200);
            expect(res.headers.get('X-AI-Provider')).toBe('opencode_zen');
            expect(res.headers.get('X-AI-Model')).toBe('glm-5.3-flash-free');
            const text = await res.text();
            expect(text).toBe('Response from OpenCode Zen');
        });
    });

    describe('/api/models endpoint', () => {
        it('handles CORS OPTIONS preflight request', async () => {
            const req = new Request('http://localhost:3000/api/models', {
                method: 'OPTIONS',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(204);
        });

        it('rejects non-GET HTTP methods with 405', async () => {
            const req = new Request('http://localhost:3000/api/models', {
                method: 'POST',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(405);
        });

        it('returns default fallback model list when no provider is configured', async () => {
            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toEqual([
                { provider: 'openrouter', model: 'openrouter/free' },
                { provider: 'opencode_zen', model: 'glm-5.3-flash-free' },
                { provider: 'ollama', model: 'gemma4:31b' },
                { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:ovhcloud' },
            ]);
        });

        it('returns models corresponding to configured providers in priority order (OpenRouter, Ollama, HF)', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-token';
            process.env.HF_TOKEN = 'hf_token';
            process.env.OLLAMA_API_KEY = 'ollama_token';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toEqual([
                { provider: 'openrouter', model: 'openrouter/free' },
                { provider: 'ollama', model: 'gemma4:31b' },
                { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:ovhcloud' },
            ]);
        });

        it('returns all 4 providers in priority order when all keys are configured', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-token';
            process.env.HF_TOKEN = 'hf_token';
            process.env.OLLAMA_API_KEY = 'ollama_token';
            process.env.OPENCODE_ZEN_API_KEY = 'zen_token';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toEqual([
                { provider: 'openrouter', model: 'openrouter/free' },
                { provider: 'opencode_zen', model: 'glm-5.3-flash-free' },
                { provider: 'ollama', model: 'gemma4:31b' },
                { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:ovhcloud' },
            ]);
        });

        it('strictly returns openrouter/free for OpenRouter even if OPENROUTER_MODEL is set to a paid model', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-token';
            process.env.OPENROUTER_MODEL = 'openai/gpt-4o';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toContainEqual({ provider: 'openrouter', model: 'openrouter/free' });
            expect(models).not.toContainEqual({ provider: 'openrouter', model: 'openai/gpt-4o' });
        });

        it('strictly defaults to Qwen/Qwen3.8-27B:ovhcloud for Hugging Face even if HF_MODEL is set to a non-free model', async () => {
            process.env.HF_TOKEN = 'hf_token';
            process.env.HF_MODEL = 'custom/paid-endpoint';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toContainEqual({ provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:ovhcloud' });
            expect(models).not.toContainEqual({ provider: 'huggingface', model: 'custom/paid-endpoint' });
        });

        it('returns opencode_zen model when OPENCODE_ZEN_API_KEY is configured', async () => {
            process.env.OPENCODE_ZEN_API_KEY = 'zen-test-key';
            process.env.OPENCODE_ZEN_MODEL = 'deepseek-v4.1-flash-free';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toContainEqual({ provider: 'opencode_zen', model: 'deepseek-v4.1-flash-free' });
        });

        it('strictly defaults to glm-5.3-flash-free for OpenCode Zen even if OPENCODE_ZEN_MODEL is set to a non-free model', async () => {
            process.env.OPENCODE_ZEN_API_KEY = 'zen-test-key';
            process.env.OPENCODE_ZEN_MODEL = 'paid/deepseek-chat';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toContainEqual({ provider: 'opencode_zen', model: 'glm-5.3-flash-free' });
            expect(models).not.toContainEqual({ provider: 'opencode_zen', model: 'paid/deepseek-chat' });
        });
    });

    describe('/api/cron/sync-models endpoint', () => {
        it('rejects non-GET HTTP methods with 405', async () => {
            const req = new Request('http://localhost:3000/api/cron/sync-models', {
                method: 'POST',
            });

            const res = await cronHandler(req);
            expect(res.status).toBe(405);
        });

        it('rejects request with 401 when CRON_SECRET is set and auth header is missing or invalid', async () => {
            process.env.CRON_SECRET = 'super-secret-cron-token';

            const req = new Request('http://localhost:3000/api/cron/sync-models', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer invalid-token',
                },
            });

            const res = await cronHandler(req);
            expect(res.status).toBe(401);
            const text = await res.text();
            expect(text).toBe('Unauthorized');
        });

        it('executes scheduled cache refresh successfully with 200 when authorized', async () => {
            process.env.CRON_SECRET = 'super-secret-cron-token';

            const req = new Request('http://localhost:3000/api/cron/sync-models', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer super-secret-cron-token',
                },
            });

            const res = await cronHandler(req);
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.message).toBe('Free models cache refreshed successfully');
            expect(Array.isArray(json.models)).toBe(true);
        });
    });
});

