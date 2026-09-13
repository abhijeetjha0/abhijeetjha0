import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiChat } from '../../src/hooks/useAiChat';

// Mock translation
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'aiChat.welcomeMessage') return 'Welcome!';
            if (key === 'aiChat.error') return 'Error occurred';
            if (key === 'aiChat.quotaReached') return 'Daily rate limit has been applied (25 queries / 24 hours). Your access will reset automatically after 24 hours.';

            return key;
        }
    })
}));

// Mock fetch and TextDecoder for streaming
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockTextDecoder = jest.fn().mockImplementation(() => ({
    decode: jest.fn().mockReturnValue('chunk')
}));
global.TextDecoder = mockTextDecoder as unknown as typeof TextDecoder;

const mockProviderModels = [{ provider: 'openrouter', model: 'mock-model-1' }];

describe('useAiChat hook', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        sessionStorage.clear();
        // Default mock for all fetch calls (both /api/models and /api/chat)
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: {
                get: (headerName: string) => headerName === 'X-RateLimit-Remaining' ? '24' : null,
            },
            json: async () => mockProviderModels,
            text: async () => 'mock response text'
        });
    });

    it('initializes with correct default state and fetches models on landing', async () => {
        const { result } = renderHook(() => useAiChat());
    
        expect(result.current.isOpen).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Welcome!');
        expect(result.current.messages[0].role).toBe('assistant');
        expect(result.current.remainingQuota).toBeNull();
        expect(result.current.isQuotaExceeded).toBe(false);

        await waitFor(() => {
            expect(result.current.modelsToTry).toEqual(mockProviderModels);
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/models'));
    });

    it('uses cached models from sessionStorage if available', async () => {
        const cachedModels = [{ provider: 'openrouter', model: 'cached-model' }];
        sessionStorage.setItem('abhijeetjha0_ai_models', JSON.stringify(cachedModels));

        const { result } = renderHook(() => useAiChat());

        expect(result.current.modelsToTry).toEqual(cachedModels);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles models fetch error gracefully on landing', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAiChat());

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to pre-fetch models:', expect.any(Error));
        });
        expect(result.current.modelsToTry).toBeUndefined();
    });

    it('handles models fetch non-ok response gracefully on landing', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const { result } = renderHook(() => useAiChat());

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/models'));
        });
        expect(result.current.modelsToTry).toBeUndefined();
    });

    it('toggles chat open state', async () => {
        const { result } = renderHook(() => useAiChat());

        await waitFor(() => {
            expect(result.current.modelsToTry).toEqual(mockProviderModels);
        });
    
        act(() => {
            result.current.toggleChat();
        });
    
        expect(result.current.isOpen).toBe(true);
    
        act(() => {
            result.current.toggleChat();
        });
    
        expect(result.current.isOpen).toBe(false);
    });

    it('handles successful message sending and decrements quota', async () => {
        const { result } = renderHook(() => useAiChat());
    
        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });
    
        // Check fetch arguments
        const chatFetchCall = mockFetch.mock.calls.find(call => call[1] && call[1].method === 'POST');
        expect(chatFetchCall).toBeDefined();
        const fetchBody = JSON.parse(chatFetchCall[1].body);
    
        // Ensure system prompt (welcome message) is excluded from the payload sent
        expect(fetchBody.messages).toHaveLength(1);
        expect(fetchBody.messages[0].content).toBe('Hello AI');
        expect(fetchBody.messages[0].role).toBe('user');
    
        // Check resulting state
        expect(result.current.isLoading).toBe(false);
        expect(result.current.messages).toHaveLength(3); // Welcome, User, Assistant
        expect(result.current.messages[1].content).toBe('Hello AI');
        expect(result.current.messages[1].role).toBe('user');
        expect(result.current.messages[2].role).toBe('assistant');
        expect(result.current.messages[2].content).toBe('mock response text');
        expect(result.current.remainingQuota).toBe(24);
    });

    it('enforces maximum character limit of 200', async () => {
        const { result } = renderHook(() => useAiChat());
        const longMessage = 'A'.repeat(250);

        await act(async () => {
            await result.current.sendMessage(longMessage);
        });

        const chatFetchCall = mockFetch.mock.calls.find(call => call[1] && call[1].method === 'POST');
        expect(chatFetchCall).toBeDefined();
        const fetchBody = JSON.parse(chatFetchCall[1].body);
        expect(fetchBody.messages[0].content).toHaveLength(200);
    });

    it('blocks sending and sets error when daily quota is exhausted', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return {
                    ok: false,
                    status: 429,
                    text: async () => 'Daily message quota reached (25/25). Please try again tomorrow.',
                };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('First message that hits daily quota');
        });

        expect(result.current.remainingQuota).toBe(0);
        expect(result.current.isQuotaExceeded).toBe(true);

        const callsBefore = mockFetch.mock.calls.length;
        await act(async () => {
            await result.current.sendMessage('Should not send when quota exceeded');
        });

        expect(mockFetch.mock.calls.length).toBe(callsBefore);
        expect(result.current.error).toBeDefined();
    });

    it('handles rate limiting (429) correctly', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return { ok: false, status: 429 };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('You are sending messages too fast. Please wait a moment.');
    });

    it('handles daily quota rate limiting (429) and locks chat while displaying rate limit notice in chatbox', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return {
                    ok: false,
                    status: 429,
                    text: async () => 'Daily message quota reached. Please try again tomorrow.',
                };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isQuotaExceeded).toBe(true);
        expect(result.current.remainingQuota).toBe(0);
        expect(result.current.error).toBe('Daily message quota reached. Please try again tomorrow.');
        expect(result.current.messages[result.current.messages.length - 1].content).toContain('Daily rate limit has been applied');
    });

    it('handles 429 with X-RateLimit-Remaining: 0 header even if error text is generic', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return {
                    ok: false,
                    status: 429,
                    headers: {
                        get: (headerName: string) => headerName === 'X-RateLimit-Remaining' ? '0' : null,
                    },
                    text: async () => 'Rate limit exceeded',
                };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isQuotaExceeded).toBe(true);
        expect(result.current.remainingQuota).toBe(0);
        expect(result.current.messages[result.current.messages.length - 1].content).toContain('Daily rate limit has been applied');
    });

    it('syncs remaining quota from X-RateLimit-Remaining response header', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return {
                    ok: true,
                    status: 200,
                    text: async () => 'AI reply',
                    headers: {
                        get: (headerName: string) => headerName === 'X-RateLimit-Remaining' ? '12' : null,
                    },
                };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });

        expect(result.current.remainingQuota).toBe(12);
        expect(result.current.isQuotaExceeded).toBe(false);
    });

    it('handles fetch errors correctly', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return { ok: false, status: 500 };
            }

            return { ok: true, status: 200, json: async () => mockProviderModels, text: async () => '' };
        });

        const { result } = renderHook(() => useAiChat());
    
        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });
    
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Error occurred');
    });

    it('ignores empty messages', async () => {
        const { result } = renderHook(() => useAiChat());
    
        await act(async () => {
            await result.current.sendMessage('   ');
        });
    
        const chatFetchCall = mockFetch.mock.calls.find(call => call[1] && call[1].method === 'POST');
        expect(chatFetchCall).toBeUndefined();
        expect(result.current.messages).toHaveLength(1); // Only welcome msg
    });
});
