import { renderHook, act } from '@testing-library/react';
import { useTheme, getSystemTheme, getStoredTheme } from '../../src/hooks/useTheme';
import { THEME_CONFIG } from '../../src/constants';

describe('useTheme hook', () => {
    let mockMediaQueryListeners: ((e: MediaQueryListEvent) => void)[] = [];
    let matchesDark = false;

    beforeEach(() => {
        localStorage.clear();
        mockMediaQueryListeners = [];
        matchesDark = false;
        document.documentElement.removeAttribute('data-bs-theme');

        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: matchesDark,
            media: query,
            onchange: null,
            addListener: jest.fn(fn => mockMediaQueryListeners.push(fn)),
            removeListener: jest.fn(),
            addEventListener: jest.fn((_, fn) => mockMediaQueryListeners.push(fn)),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('defaults to system theme when localStorage is empty', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('system');
        expect(result.current.resolvedTheme).toBe('light');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    });

    test('initializes with theme stored in localStorage', () => {
        localStorage.setItem(THEME_CONFIG.STORAGE_KEY, 'dark');

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    });

    test('handles invalid theme in localStorage by defaulting to system', () => {
        localStorage.setItem(THEME_CONFIG.STORAGE_KEY, 'invalid-theme');

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('system');
    });

    test('updates theme, saves to localStorage, and updates DOM attribute', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.setTheme('dark');
        });

        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
        expect(localStorage.getItem(THEME_CONFIG.STORAGE_KEY)).toBe('dark');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

        act(() => {
            result.current.setTheme('light');
        });

        expect(result.current.theme).toBe('light');
        expect(result.current.resolvedTheme).toBe('light');
        expect(localStorage.getItem(THEME_CONFIG.STORAGE_KEY)).toBe('light');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    });

    test('handles localStorage exceptions gracefully when setting theme', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        const { result } = renderHook(() => useTheme());

        expect(() => {
            act(() => {
                result.current.setTheme('dark');
            });
        }).not.toThrow();

        expect(result.current.theme).toBe('dark');
    });

    test('handles localStorage exceptions gracefully on initial load', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('AccessDeniedError');
        });

        expect(getStoredTheme()).toBe(THEME_CONFIG.DEFAULT_THEME);
    });

    test('listens to system media query changes when theme is system', () => {
        const { result, unmount } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('system');
        expect(result.current.resolvedTheme).toBe('light');

        // Simulate OS switching to dark mode
        matchesDark = true;
        act(() => {
            mockMediaQueryListeners.forEach(listener => {
                listener({ matches: true } as MediaQueryListEvent);
            });
        });

        expect(result.current.resolvedTheme).toBe('dark');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

        unmount();
    });

    test('supports legacy addListener/removeListener if addEventListener is absent', () => {
        const legacyListeners: (() => void)[] = [];
        const removeListenerMock = jest.fn();

        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            addListener: jest.fn(fn => legacyListeners.push(fn)),
            removeListener: removeListenerMock,
        }));

        const { unmount } = renderHook(() => useTheme());

        expect(legacyListeners.length).toBeGreaterThan(0);

        unmount();
        expect(removeListenerMock).toHaveBeenCalled();
    });

    test('getSystemTheme returns light if matchMedia is unavailable', () => {
        const originalMatchMedia = window.matchMedia;
        // @ts-expect-error testing undefined matchMedia
        delete window.matchMedia;

        expect(getSystemTheme()).toBe('light');

        window.matchMedia = originalMatchMedia;
    });
});
