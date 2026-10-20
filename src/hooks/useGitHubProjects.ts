import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GitHubRepo, ProjectInfo, UseGitHubProjectsResult } from '../@types';
import { PROJECTS_CONFIG } from '../constants';
import { logger } from '../utilities/logger';

interface CachedProjectsPayload {
    timestamp: number;
    data: ProjectInfo[];
}

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
    staticProjects: ProjectInfo[]
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

function getCachedProjects(): ProjectInfo[] | null {
    try {
        const stored = localStorage.getItem(PROJECTS_CONFIG.STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as CachedProjectsPayload;
            if (parsed && typeof parsed.timestamp === 'number' && Array.isArray(parsed.data)) {
                const isFresh = Date.now() - parsed.timestamp < PROJECTS_CONFIG.CACHE_TTL_MS;
                if (isFresh) {
                    return parsed.data;
                }
            }
        }
    } catch (e) {
        logger('Failed to parse cached projects from localStorage', e);
    }

    return null;
}

function setCachedProjects(data: ProjectInfo[]): void {
    try {
        const payload: CachedProjectsPayload = {
            timestamp: Date.now(),
            data,
        };
        localStorage.setItem(PROJECTS_CONFIG.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        logger('Failed to save projects to localStorage cache', e);
    }
}

async function performProjectFetch(
    staticProjects: ProjectInfo[]
): Promise<ProjectInfo[] | null> {
    let fetchedList: (ProjectInfo | GitHubRepo)[] | null = null;

    // Step 1: Try Vercel Edge endpoint (/api/projects)
    try {
        const edgeRes = await fetch(PROJECTS_CONFIG.BACKEND_URL, {
            headers: {
                'Accept': 'application/json',
            },
        });

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
            });

            if (ghRes.ok) {
                fetchedList = await ghRes.json();
            }
        } catch (err) {
            logger('Failed to fetch projects directly from GitHub API', err);
        }
    }

    // Step 3: Process fetched repositories or return null for static fallback
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
                const description = formatProjectDescription(rawName, item.description, staticProjects);
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
    const { t } = useTranslation();
    const staticProjects = useMemo<ProjectInfo[]>(() => {
        const rawProjects = t('projects', { returnObjects: true });

        return Array.isArray(rawProjects) ? (rawProjects as ProjectInfo[]) : [];
    }, [t]);

    const [cached] = useState<ProjectInfo[] | null>(() => getCachedProjects());
    const [projects, setProjects] = useState<ProjectInfo[]>(() => cached || staticProjects);
    const [isLoading, setIsLoading] = useState<boolean>(() => !cached);
    const [isError, setIsError] = useState<boolean>(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (cached || hasFetchedRef.current) {
            return;
        }

        hasFetchedRef.current = true;
        let isMounted = true;

        performProjectFetch(staticProjects)
            .then(normalized => {
                if (!isMounted) return;

                if (normalized) {
                    setProjects(normalized);
                    setCachedProjects(normalized);
                    setIsLoading(false);
                    setIsError(false);
                } else {
                    setIsError(true);
                    setIsLoading(false);
                    if (staticProjects.length > 0) {
                        setProjects(staticProjects);
                    }
                }
            })
            .catch(() => {
                if (!isMounted) return;

                setIsError(true);
                setIsLoading(false);
                if (staticProjects.length > 0) {
                    setProjects(staticProjects);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [cached, staticProjects]);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);

        try {
            const normalized = await performProjectFetch(staticProjects);
            if (normalized) {
                setProjects(normalized);
                setCachedProjects(normalized);
                setIsLoading(false);
                setIsError(false);
            } else {
                setIsError(true);
                setIsLoading(false);
                if (staticProjects.length > 0) {
                    setProjects(staticProjects);
                }
            }
        } catch {
            setIsError(true);
            setIsLoading(false);
            if (staticProjects.length > 0) {
                setProjects(staticProjects);
            }
        }
    }, [staticProjects]);

    return {
        projects,
        isLoading,
        isError,
        refresh,
    };
}
