jest.mock('../../api/rateLimit', () => ({
    chatRateLimit: {
        limit: jest.fn(),
    },
}));

import projectsHandler from '../../api/projects';
import { chatRateLimit } from '../../api/rateLimit';

const originalEnv = process.env;

describe('/api/projects endpoint', () => {
    let mockFetch: jest.Mock;
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.resetAllMocks();
        (chatRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, remaining: 5 });

        process.env = { ...originalEnv };
        delete process.env.GITHUB_TOKEN;

        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterAll(() => {
        process.env = originalEnv;
        global.fetch = originalFetch;
    });


    it('handles CORS OPTIONS preflight request', async () => {
        const req = new Request('http://localhost:3000/api/projects', {
            method: 'OPTIONS',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('rejects non-GET HTTP methods with 405 Method Not Allowed', async () => {
        const req = new Request('http://localhost:3000/api/projects', {
            method: 'POST',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(405);
        expect(await res.text()).toBe('Method Not Allowed');
    });

    it('enforces rate limiting when limit is exceeded', async () => {
        (chatRateLimit.limit as jest.Mock).mockResolvedValue({ success: false });

        const req = new Request('http://localhost:3000/api/projects', {
            method: 'GET',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(429);
        const data = await res.json();
        expect(data.error).toBe('Too Many Requests');
    });

    it('fetches repositories from GitHub, filters forks, and formats response', async () => {
        const mockRepos = [
            {
                id: 1,
                name: 'spin-your-ai',
                description: 'A browser extension for AI models',
                html_url: 'https://github.com/abhijeetjha0/spin-your-ai',
                homepage: 'https://spinyourai.com',
                language: 'TypeScript',
                fork: false,
                pushed_at: '2026-10-19T15:22:00Z',
            },
            {
                id: 2,
                name: 'forked-repo',
                description: 'Some forked library',
                html_url: 'https://github.com/abhijeetjha0/forked-repo',
                homepage: null,
                language: 'JavaScript',
                fork: true,
                pushed_at: '2026-08-01T10:00:00Z',
            },
            {
                id: 3,
                name: 'node-project-builder',
                description: null,
                html_url: 'https://github.com/abhijeetjha0/node-project-builder',
                homepage: null,
                language: 'Shell',
                fork: false,
                pushed_at: '2026-09-12T17:09:18Z',
            },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockRepos,
        });

        const req = new Request('http://localhost:3000/api/projects', {
            method: 'GET',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');

        const data = await res.json();
        // Forked repo should be filtered out
        expect(data).toHaveLength(2);
        expect(data[0].name).toBe('spin-your-ai');
        expect(data[0].homepage).toBe('https://spinyourai.com');
        expect(data[0].language).toBe('TypeScript');
        expect(data[0].isDynamic).toBe(true);

        expect(data[1].name).toBe('node-project-builder');
        expect(data[1].description).toBe('');
        expect(data[1].homepage).toBeUndefined();
    });

    it('includes Authorization header when GITHUB_TOKEN is configured', async () => {
        process.env.GITHUB_TOKEN = 'test-token-123';

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => [],
        });

        const req = new Request('http://localhost:3000/api/projects', {
            method: 'GET',
        });

        await projectsHandler(req);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('api.github.com/users/abhijeetjha0/repos'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token-123',
                }),
            })
        );
    });

    it('handles GitHub API non-200 responses gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            statusText: 'rate limit exceeded',
        });

        const req = new Request('http://localhost:3000/api/projects', {
            method: 'GET',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('Failed to fetch repositories from GitHub');
    });

    it('handles unexpected network exception gracefully with 500 status', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        const req = new Request('http://localhost:3000/api/projects', {
            method: 'GET',
        });

        const res = await projectsHandler(req);
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toBe('Internal Server Error');
    });
});
