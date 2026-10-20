import { StrictMode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    useGitHubProjects,
    formatProjectTitle,
    formatProjectDescription,
    clearProjectFetchCacheForTesting,
} from '../../src/hooks/useGitHubProjects';
import { PROJECTS_CONFIG } from '../../src/constants';


describe('useGitHubProjects hook and utilities', () => {
    let mockFetch: jest.Mock;
    const originalFetch = global.fetch;

    beforeEach(() => {
        clearProjectFetchCacheForTesting();
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
            expect(formatProjectDescription('my-repo', '  A great repository  ')).toBe('A great repository');
        });

        it('falls back to curated description when description is null or empty', () => {
            expect(formatProjectDescription('node-project-builder', null)).toContain('CLI tool');
            expect(formatProjectDescription('VaccinationSlotsMonitor', '')).toContain('vaccination slots');
        });

        it('falls back to matched static project description if available in optional list', () => {
            const desc = formatProjectDescription('project-one', null, [
                {
                    name: 'project-one',
                    description: 'Curated description for project one',
                    link: 'https://github.com/abhijeetjha0/project-one',
                },
            ]);
            expect(desc).toBe('Curated description for project one');
        });

        it('falls back to formatted title if no description is available', () => {
            expect(formatProjectDescription('brand-new-project', null)).toBe('Brand New Project');
        });
    });

    describe('useGitHubProjects hook data fetching & HTTP edge integration', () => {
        it('fetches from backend endpoint (/api/projects) on mount', async () => {
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
            expect(mockFetch).toHaveBeenCalledWith(
                PROJECTS_CONFIG.BACKEND_URL,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                    }),
                })
            );
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

        it('handles failure gracefully when both backend and GitHub API fail', async () => {
            mockFetch.mockRejectedValue(new Error('Network offline'));

            const { result } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.projects).toEqual([]);
        });

        it('refresh() triggers a fresh fetch with cache: reload', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => [
                    {
                        name: 'initial-project',
                        description: 'Initial desc',
                        link: 'https://github.com/abhijeetjha0/initial',
                    },
                ],
            });

            const { result } = renderHook(() => useGitHubProjects());
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            expect(result.current.projects[0].name).toBe('Initial Project');

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
            expect(mockFetch).toHaveBeenLastCalledWith(
                PROJECTS_CONFIG.BACKEND_URL,
                expect.objectContaining({
                    cache: 'reload',
                })
            );
        });

        it('refresh() handles API failure and marks error state on error', async () => {
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

        it('survives React StrictMode remount without remaining stuck in loading shimmer state', async () => {
            const mockBackendProjects = [
                {
                    name: 'spin-your-ai',
                    description: 'AI model extension',
                    link: 'https://github.com/abhijeetjha0/spin-your-ai',
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockBackendProjects,
            });

            const { result } = renderHook(() => useGitHubProjects(), { wrapper: StrictMode });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.projects).toHaveLength(1);
            expect(result.current.projects[0].name).toBe('Spin Your AI');
            expect(result.current.isError).toBe(false);
        });

        it('deduplicates in-flight fetches when multiple components call useGitHubProjects concurrently', async () => {
            const mockBackendProjects = [
                {
                    name: 'shared-project',
                    description: 'Shared desc',
                    link: 'https://github.com/abhijeetjha0/shared',
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockBackendProjects,
            });

            // Simulate Home and Projects mounting concurrently
            const { result: hook1 } = renderHook(() => useGitHubProjects());
            const { result: hook2 } = renderHook(() => useGitHubProjects());

            await waitFor(() => {
                expect(hook1.current.isLoading).toBe(false);
                expect(hook2.current.isLoading).toBe(false);
            });

            expect(hook1.current.projects).toHaveLength(1);
            expect(hook2.current.projects).toHaveLength(1);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('does not trigger fetch when skip: true is passed', async () => {
            const { result } = renderHook(() => useGitHubProjects({ skip: true }));

            expect(result.current.isLoading).toBe(false);
            expect(result.current.projects).toEqual([]);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });
});
