import { renderHook, act } from '@testing-library/react';
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

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useAiChat());
    
        expect(result.current.isOpen).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Welcome!');
        expect(result.current.messages[0].role).toBe('assistant');
    });

    it('toggles chat open state', () => {
        const { result } = renderHook(() => useAiChat());
    
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
        // We expect fetch to be called for the chat message (and potentially for models)
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
    
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.current.messages).toHaveLength(1); // Only welcome msg
    });
});
