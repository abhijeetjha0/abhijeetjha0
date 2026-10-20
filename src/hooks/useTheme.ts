import { useState, useEffect, useCallback } from 'react';
import { THEME_CONFIG } from '../constants';
import { ThemeMode, ResolvedTheme, UseThemeResult } from '../@types';

export const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getStoredTheme = (): ThemeMode => {
    if (typeof window === 'undefined') {
        return THEME_CONFIG.DEFAULT_THEME;
    }

    try {
        const stored = localStorage.getItem(THEME_CONFIG.STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // Fallback if localStorage is inaccessible or restricted
    }

    return THEME_CONFIG.DEFAULT_THEME;
};

export const useTheme = (): UseThemeResult => {
    const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
        const currentTheme = getStoredTheme();

        return currentTheme === 'system' ? getSystemTheme() : currentTheme;
    });

    const setTheme = useCallback((newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_CONFIG.STORAGE_KEY, newTheme);
        } catch {
            // Ignore storage write errors
        }
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            const currentResolved = theme === 'system' ? getSystemTheme() : theme;
            setResolvedTheme(currentResolved);
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-bs-theme', currentResolved);
            }
        };

        applyTheme();

        if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                applyTheme();
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else if ((mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener) {
                (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener(handleChange);
            }

            return () => {
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', handleChange);
                } else if ((mediaQuery as unknown as { removeListener: (cb: () => void) => void }).removeListener) {
                    (mediaQuery as unknown as { removeListener: (cb: () => void) => void }).removeListener(handleChange);
                }
            };
        }

        return undefined;
    }, [theme]);

    return {
        theme,
        resolvedTheme,
        setTheme,
    };
};
