import { CORS_HEADERS } from './constants.js';
import { chatRateLimit } from './rateLimit.js';

export const config = {
    runtime: 'edge',
};

interface GitHubApiRepo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    fork: boolean;
    archived?: boolean;
    pushed_at?: string;
    updated_at?: string;
}

export default async function handler(req: Request) {
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
            console.warn(`[api/projects] Rate limit exceeded for IP: ${ip}`);

            return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
                status: 429,
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                },
            });
        }
    }

    try {
        const githubHeaders: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'abhijeetjha0-portfolio',
        };

        const token = process.env.GITHUB_TOKEN;
        if (token) {
            githubHeaders['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('https://api.github.com/users/abhijeetjha0/repos?sort=pushed&per_page=100', {
            headers: githubHeaders,
        });

        if (!response.ok) {
            console.warn(`[api/projects] GitHub API responded with status ${response.status}`);

            return new Response(JSON.stringify({ error: 'Failed to fetch repositories from GitHub' }), {
                status: response.status,
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                },
            });
        }

        const repos = (await response.json()) as GitHubApiRepo[];

        // Filter for authored original repositories only (excluding forks)
        const projects = repos
            .filter(repo => !repo.fork)
            .map(repo => ({
                name: repo.name,
                description: repo.description ?? '',
                link: repo.html_url,
                homepage: repo.homepage ? repo.homepage : undefined,
                language: repo.language ?? undefined,
                updatedAt: repo.pushed_at ?? repo.updated_at,
                isDynamic: true,
            }));

        return new Response(JSON.stringify(projects), {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
            status: 200,
        });
    } catch (error) {
        console.error('[api/projects] Exception during project sync:', error);

        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/json',
            },
        });
    }
}
