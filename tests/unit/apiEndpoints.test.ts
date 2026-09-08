jest.mock('../../api/rateLimit', () => ({
    chatRateLimit: {
        limit: jest.fn(),
    },
}));

import chatHandler from '../../api/chat';
import modelsHandler from '../../api/models';
import { chatRateLimit } from '../../api/rateLimit';

const originalEnv = process.env;


describe('api endpoints (chat and models)', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        (chatRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, remaining: 5 });

        process.env = { ...originalEnv };
        delete process.env.GITHUB_TOKEN;
        delete process.env.GH_MODELS_TOKEN;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.HF_TOKEN;
        delete process.env.HUGGINGFACE_API_KEY;
        delete process.env.OLLAMA_API_KEY;

        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterAll(() => {
        process.env = originalEnv;
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

            mockFetch.mockResolvedValueOnce({
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
            });

            const req = new Request('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'What is Abhijit\'s role?' }],
                }),
            });

            const res = await chatHandler(req);
            expect(res.status).toBe(200);
            expect(res.headers.get('X-AI-Provider')).toBe('openrouter');
            expect(res.headers.get('X-AI-Model')).toBe('openrouter/free');

            const text = await res.text();
            expect(text).toBe('Abhijit is a Senior Software Engineer.');
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
            expect(models).toContain('openrouter/free');
        });

        it('returns models corresponding to configured providers', async () => {
            process.env.OPENROUTER_API_KEY = 'sk-or-token';
            process.env.HF_TOKEN = 'hf_token';

            const req = new Request('http://localhost:3000/api/models', {
                method: 'GET',
            });

            const res = await modelsHandler(req);
            expect(res.status).toBe(200);
            const models = await res.json();
            expect(models).toContain('openrouter/free');
            expect(models).toContain('Qwen/Qwen2.5-72B-Instruct');
        });
    });
});
