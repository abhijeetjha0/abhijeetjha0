import { useState, useEffect, useCallback, useRef } from 'react';
import { GitHubRepo, ProjectInfo, UseGitHubProjectsResult } from '../@types';
import { PROJECTS_CONFIG } from '../constants';
import { logger } from '../utilities/logger';

export function formatProjectTitle(repoName: string): string {
    if (PROJECTS_CONFIG.KNOWN_REPO_NAMES[repoName]) {
        return PROJECTS_CONFIG.KNOWN_REPO_NAMES[repoName];
    }

    return repoName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

export function formatProjectDescription(
    repoName: string,
    desc: string | null | undefined,
    staticProjects: ProjectInfo[] = []
): string {
    if (desc && desc.trim().length > 0) {
        return desc.trim();
    }

    if (PROJECTS_CONFIG.CURATED_DESCRIPTIONS[repoName]) {
        return PROJECTS_CONFIG.CURATED_DESCRIPTIONS[repoName];
    }

    const matchedStatic = staticProjects.find(
        p => p.link.toLowerCase().includes(repoName.toLowerCase())
            || p.name.toLowerCase() === repoName.toLowerCase()
    );

    if (matchedStatic && matchedStatic.description) {
        return matchedStatic.description;
    }

    return formatProjectTitle(repoName);
}

export async function performProjectFetch(
    forceRefresh: boolean = false
): Promise<ProjectInfo[] | null> {
    let fetchedList: (ProjectInfo | GitHubRepo)[] | null = null;

    const fetchOptions: RequestInit = {
        headers: {
            'Accept': 'application/json',
        },
    };

    if (forceRefresh) {
        fetchOptions.cache = 'reload';
    }

    // Step 1: Try Vercel Edge endpoint (/api/projects)
    try {
        const edgeRes = await fetch(PROJECTS_CONFIG.BACKEND_URL, fetchOptions);

        if (edgeRes.ok) {
            fetchedList = await edgeRes.json();
        }
    } catch {
        // Edge API unavailable, fall back to direct GitHub API
    }

    // Step 2: Fall back to direct GitHub REST API if Edge API didn't succeed
    if (!fetchedList) {
        try {
            const ghRes = await fetch(PROJECTS_CONFIG.GITHUB_API_URL, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
                ...(forceRefresh ? { cache: 'reload' } : {}),
            });

            if (ghRes.ok) {
                fetchedList = await ghRes.json();
            }
        } catch (err) {
            logger('Failed to fetch projects directly from GitHub API', err);
        }
    }

    // Step 3: Process fetched repositories
    if (Array.isArray(fetchedList) && fetchedList.length > 0) {
        const validItems = fetchedList.filter(
            (item): item is ProjectInfo | GitHubRepo =>
                typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string'
        );

        const nonForkItems = validItems.filter(item => !('fork' in item) || !item.fork);

        if (nonForkItems.length > 0) {
            return nonForkItems.map(item => {
                const rawName = item.name;
                const displayName = formatProjectTitle(rawName);
                const link = 'link' in item && item.link ? item.link : ('html_url' in item ? item.html_url : '');
                const description = formatProjectDescription(rawName, item.description);
                const homepage = item.homepage && item.homepage.trim().length > 0 ? item.homepage.trim() : undefined;
                const language = item.language || undefined;
                const updatedAt = 'updatedAt' in item && item.updatedAt
                    ? item.updatedAt
                    : ('pushed_at' in item ? item.pushed_at : undefined);

                return {
                    name: displayName,
                    description,
                    link,
                    homepage,
                    language,
                    updatedAt,
                    isDynamic: true,
                };
            });
        }
    }

    return null;
}

export function useGitHubProjects(): UseGitHubProjectsResult {
    const [projects, setProjects] = useState<ProjectInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (hasFetchedRef.current) {
            return;
        }

        hasFetchedRef.current = true;
        let isMounted = true;

        performProjectFetch()
            .then(normalized => {
                if (!isMounted) return;

                if (normalized) {
                    setProjects(normalized);
                    setIsLoading(false);
                    setIsError(false);
                } else {
                    setIsError(true);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!isMounted) return;

                setIsError(true);
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);

        try {
            const normalized = await performProjectFetch(true);
            if (normalized) {
                setProjects(normalized);
                setIsLoading(false);
                setIsError(false);
            } else {
                setIsError(true);
                setIsLoading(false);
            }
        } catch {
            setIsError(true);
            setIsLoading(false);
        }
    }, []);

    return {
        projects,
        isLoading,
        isError,
        refresh,
    };
}
