import { renderHook, act, waitFor } from '@testing-library/react';
import {
    useGitHubProjects,
    formatProjectTitle,
    formatProjectDescription,
} from '../../src/hooks/useGitHubProjects';
import { PROJECTS_CONFIG } from '../../src/constants';
import { ProjectInfo } from '../../src/@types';

const mockStaticProjects: ProjectInfo[] = [
    {
        name: 'Static Project One',
        description: 'Curated description for project one',
        link: 'https://github.com/abhijeetjha0/project-one',
    },
    {
        name: 'Node Project Builder',
        description: 'A comprehensive CLI tool to quickly generate and scaffold production-ready Node.js project templates.',
        link: 'https://github.com/abhijeetjha0/node-project-builder',
    },
];

jest.mock('react-i18next', () => {
    const original = jest.requireActual('react-i18next');

    return {
        ...original,
        useTranslation: () => ({
            t: (key: string, options?: { returnObjects?: boolean }) => {
                if (key === 'projects' && options?.returnObjects) {
                    return mockStaticProjects;
                }

                return key;
            },
        }),
    };
});


describe('useGitHubProjects hook and utilities', () => {
    let mockFetch: jest.Mock;
    const originalFetch = global.fetch;

    beforeEach(() => {
        localStorage.clear();
        jest.resetAllMocks();
        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterEach(() => {
        localStorage.clear();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });


    describe('formatProjectTitle', () => {
        it('returns known mapped repository title', () => {
            expect(formatProjectTitle('spin-your-ai')).toBe('Spin Your AI');
            expect(formatProjectTitle('markdown-notes-app')).toBe('Markdown Notes App');
            expect(formatProjectTitle('node-project-builder')).toBe('Node Project Builder');
        });

        it('formats unknown kebab-case repo names to title case', () => {
            expect(formatProjectTitle('cool-new-utility')).toBe('Cool New Utility');
            expect(formatProjectTitle('my_awesome_tool')).toBe('My Awesome Tool');
        });
    });

    describe('formatProjectDescription', () => {
        it('returns trimmed repository description if present', () => {
            expect(formatProjectDescription('my-repo', '  A great repository  ', [])).toBe('A great repository');
        });

        it('falls back to curated description when description is null or empty', () => {
            expect(formatProjectDescription('node-project-builder', null, [])).toContain('CLI tool');
            expect(formatProjectDescription('VaccinationSlotsMonitor', '', [])).toContain('vaccination slots');
        });

        it('falls back to matched static project description if available', () => {
            const desc = formatProjectDescription('project-one', null, mockStaticProjects);
            expect(desc).toBe('Curated description for project one');
        });

        it('falls back to formatted title if no description is available', () => {
            expect(formatProjectDescription('brand-new-project', null, [])).toBe('Brand New Project');
        });
    });

    describe('useGitHubProjects hook data fetching & caching', () => {
        it('returns fresh cached projects from localStorage without calling fetch', async () => {
            const cachedData: ProjectInfo[] = [
                {
                    name: 'Cached Project',
                    description: 'From localStorage',
                    link: 'https://github.com/abhijeetjha0/cached',
                    language: 'TypeScript',
                },
            ];

            localStorage.setItem(
                PROJECTS_CONFIG.STORAGE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    data: cachedData,
                })
            );

            const { result } = renderHook(() => useGitHubProjects());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.projects).toEqual(cachedData);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('fetches from backend endpoint (/api/projects) when cache is empty', async () => {
            const mockBackendProjects = [
                {
                    name: 'spin-your-ai',
                    description: 'AI model extension',
                    link: 'https://github.com/abhijeetjha0/spin-your-ai',
                    homepage: 'https://spinyourai.com',
                    language: 'TypeScript',
                    updatedAt: '2026-10-19T15:22:00Z',
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockBackendProjects,
            });

            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.projects).toHaveLength(1);
            expect(result.current.projects[0].name).toBe('Spin Your AI');
            expect(result.current.projects[0].homepage).toBe('https://spinyourai.com');
            expect(result.current.isError).toBe(false);

            // Verifies saved to localStorage
            const stored = localStorage.getItem(PROJECTS_CONFIG.STORAGE_KEY);
            expect(stored).not.toBeNull();
            expect(JSON.parse(stored!).data[0].name).toBe('Spin Your AI');
        });

        it('falls back to direct GitHub API if backend endpoint fails', async () => {
            // First call (backend) fails
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            // Second call (direct GitHub REST API) succeeds
            const mockGitHubRepos = [
                {
                    id: 101,
                    name: 'ai-vs-ai-chess',
                    description: 'Multi-model chess',
                    html_url: 'https://github.com/abhijeetjha0/ai-vs-ai-chess',
                    homepage: null,
                    language: 'JavaScript',
                    fork: false,
                    pushed_at: '2026-10-19T12:52:52Z',
                },
                {
                    id: 102,
                    name: 'forked-library',
                    description: 'Forked stuff',
                    html_url: 'https://github.com/abhijeetjha0/forked-library',
                    fork: true,
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockGitHubRepos,
            });

            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.projects).toHaveLength(1);
            expect(result.current.projects[0].name).toBe('AI vs AI Chess');
            expect(result.current.isError).toBe(false);
        });

        it('falls back safely to static projects if both backend and GitHub API fail', async () => {
            mockFetch.mockRejectedValue(new Error('Network offline'));

            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.projects).toEqual(mockStaticProjects);
        });

        it('refresh() ignores existing cache and triggers a fresh fetch', async () => {
            const cachedData: ProjectInfo[] = [
                {
                    name: 'Old Cached',
                    description: 'Old desc',
                    link: 'https://github.com/abhijeetjha0/old',
                },
            ];

            localStorage.setItem(
                PROJECTS_CONFIG.STORAGE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    data: cachedData,
                })
            );

            const { result } = renderHook(() => useGitHubProjects());
            expect(result.current.projects[0].name).toBe('Old Cached');

            const freshBackendProjects = [
                {
                    name: 'Freshly Synced Project',
                    description: 'Fresh desc',
                    link: 'https://github.com/abhijeetjha0/fresh',
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => freshBackendProjects,
            });

            await act(async () => {
                await result.current.refresh();
            });

            expect(result.current.projects[0].name).toBe('Freshly Synced Project');
        });

        it('handles corrupted localStorage JSON gracefully', async () => {
            localStorage.setItem(PROJECTS_CONFIG.STORAGE_KEY, 'invalid-json{{{');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => [],
            });

            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.projects).toEqual(mockStaticProjects);
        });

        it('refresh() handles API failure and preserves static projects on error', async () => {
            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Mock fetch failure on refresh
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            }).mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            await act(async () => {
                await result.current.refresh();
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.projects).toEqual(mockStaticProjects);
        });

        it('refresh() handles unexpected network exceptions gracefully', async () => {
            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            mockFetch.mockImplementationOnce(() => {
                throw new Error('Fatal socket failure');
            });

            await act(async () => {
                await result.current.refresh();
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
