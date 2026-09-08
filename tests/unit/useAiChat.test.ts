import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiChat } from '../../src/hooks/useAiChat';

// Mock translation
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'aiChat.welcomeMessage') return 'Welcome!';
            if (key === 'aiChat.error') return 'Error occurred';

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

describe('useAiChat hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock for all fetch calls (both /api/models and /api/chat)
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ['mock-model-1'],
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

        await waitFor(() => {
            expect(result.current.modelsToTry).toEqual(['mock-model-1']);
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/models'));
    });

    it('handles models fetch error gracefully on landing', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAiChat());

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to pre-fetch models:', expect.any(Error));
        });
        expect(result.current.modelsToTry).toBeUndefined();
        consoleErrorSpy.mockRestore();
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
            expect(result.current.modelsToTry).toEqual(['mock-model-1']);
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

    it('handles successful message sending', async () => {
        const { result } = renderHook(() => useAiChat());
    
        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });
    
        // Check fetch arguments
        // We expect fetch to be called for the chat message (and models on landing)
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
    });

    it('handles rate limiting (429) correctly', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return { ok: false, status: 429 };
            }

            return { ok: true, json: async () => ['mock-model-1'] };
        });

        const { result } = renderHook(() => useAiChat());

        await act(async () => {
            await result.current.sendMessage('Hello AI');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('You are sending messages too fast. Please wait a moment.');
    });

    it('handles fetch errors correctly', async () => {
        mockFetch.mockImplementation(async (_url, options) => {
            if (options && options.method === 'POST') {
                return { ok: false };
            }

            return { ok: true, json: async () => ['mock-model-1'] };
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
