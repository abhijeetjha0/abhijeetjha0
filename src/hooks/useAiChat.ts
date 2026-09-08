import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AiChatState, ChatMessage } from '../@types';
import { AI_CHAT_CONFIG } from '../constants';

function getInitialUsage(): number {
    try {
        const stored = sessionStorage.getItem(AI_CHAT_CONFIG.STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed >= 0) {
                return parsed;
            }
        }
    } catch {
        // Ignore sessionStorage errors (e.g. incognito or disabled)
    }

    return 0;
}

function getCachedModels(): string[] | undefined {
    try {
        const stored = sessionStorage.getItem(AI_CHAT_CONFIG.MODELS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Ignore JSON or storage errors
    }

    return undefined;
}

export function useAiChat() {
    const { t } = useTranslation();
    const initialUsage = getInitialUsage();
    const initialRemaining = Math.max(0, AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION - initialUsage);

    const [state, setState] = useState<AiChatState>({
        messages: [
            {
                id: 'welcome-msg',
                role: 'assistant',
                content: t('aiChat.welcomeMessage'),
                timestamp: Date.now(),
            }
        ],
        isLoading: false,
        isOpen: false,
        error: null,
        modelsToTry: getCachedModels(),
        cooldownRemaining: 0,
        remainingQuota: initialRemaining,
        isQuotaExceeded: initialRemaining <= 0,
    });

    const toggleChat = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
    }, []);

    // Cooldown countdown timer
    useEffect(() => {
        if (state.cooldownRemaining <= 0) {
            return;
        }

        const timer = setTimeout(() => {
            setState(s => ({
                ...s,
                cooldownRemaining: Math.max(0, s.cooldownRemaining - 1),
            }));
        }, 1000);

        return () => {
            clearTimeout(timer);
        };
    }, [state.cooldownRemaining]);

    // Pre-fetch models on landing with session caching
    useEffect(() => {
        let isMounted = true;

        if (!state.modelsToTry) {
            const cached = getCachedModels();
            if (cached) {
                setState(s => ({ ...s, modelsToTry: cached }));

                return;
            }

            // Pre-fetch free models from the edge function on landing
            fetch(AI_CHAT_CONFIG.MODELS_URL)
                .then(res => {
                    if (!res.ok) {
                        return null;
                    }

                    return res.json();
                })
                .then(models => {
                    if (isMounted && Array.isArray(models) && models.length > 0) {
                        try {
                            sessionStorage.setItem(AI_CHAT_CONFIG.MODELS_STORAGE_KEY, JSON.stringify(models));
                        } catch {
                            // Ignore storage error
                        }
                        setState(s => ({ ...s, modelsToTry: models }));
                    }
                })
                .catch(err => {
                    if (isMounted) {
                        console.error('Failed to pre-fetch models:', err);
                    }
                });
        }

        return () => {
            isMounted = false;
        };
    }, [state.modelsToTry]);

    const sendMessage = useCallback(async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) {
            return;
        }

        // Block if quota is exceeded
        if (state.remainingQuota <= 0) {
            setState(prev => ({
                ...prev,
                isQuotaExceeded: true,
                error: t('aiChat.quotaReached'),
            }));

            return;
        }

        // Block if cooldown is active
        if (state.cooldownRemaining > 0) {
            return;
        }

        // Enforce max character limit
        const sanitizedContent = trimmed.slice(0, AI_CHAT_CONFIG.MAX_INPUT_LENGTH);

        // Update quota in session storage
        const nextUsage = getInitialUsage() + 1;
        try {
            sessionStorage.setItem(AI_CHAT_CONFIG.STORAGE_KEY, nextUsage.toString());
        } catch {
            // Ignore storage errors
        }

        const nextRemaining = Math.max(0, AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION - nextUsage);

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: sanitizedContent,
            timestamp: Date.now(),
        };

        const assistantMessageId = (Date.now() + 1).toString();
        const initialAssistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage, initialAssistantMessage],
            isLoading: true,
            error: null,
            remainingQuota: nextRemaining,
            isQuotaExceeded: nextRemaining <= 0,
        }));

        try {
            // The backend expects the message history
            // We send the current state + the new user message, excluding the empty assistant message
            const messagesToSend = state.messages
                .filter(m => m.id !== 'welcome-msg') // backend handles system prompt
                .concat(userMessage)
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(AI_CHAT_CONFIG.BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messagesToSend,
                    modelsToTry: state.modelsToTry
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    let errorText = '';
                    if (typeof response.text === 'function') {
                        errorText = await response.text().catch(() => '');
                    }

                    if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('daily')) {
                        setState(s => ({
                            ...s,
                            isQuotaExceeded: true,
                            remainingQuota: 0,
                        }));

                        throw new Error(errorText || t('aiChat.quotaReached'));
                    }

                    setState(s => ({ ...s, cooldownRemaining: 10 }));

                    throw new Error('You are sending messages too fast. Please wait a moment.');
                }

                throw new Error(t('aiChat.error'));
            }

            const responseText = typeof response.text === 'function' ? await response.text() : '';

            // Sync remaining quota from backend header if provided
            const remainingHeader = response.headers?.get ? response.headers.get('X-RateLimit-Remaining') : null;
            if (remainingHeader !== null) {
                const parsedRemaining = parseInt(remainingHeader, 10);
                if (!isNaN(parsedRemaining) && parsedRemaining >= 0) {
                    setState(s => ({
                        ...s,
                        remainingQuota: parsedRemaining,
                        isQuotaExceeded: parsedRemaining <= 0,
                    }));
                }
            }

            setState(prev => {
                const newMessages = [...prev.messages];
                const lastMsgIndex = newMessages.length - 1;

                if (newMessages[lastMsgIndex].id === assistantMessageId) {
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        content: responseText,
                    };
                }

                return { ...prev, messages: newMessages };
            });
        } catch (err) {
            console.error('Chat error:', err);
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : t('aiChat.error'),
            }));
        } finally {
            setState(prev => ({
                ...prev,
                isLoading: false,
                cooldownRemaining: prev.cooldownRemaining > AI_CHAT_CONFIG.COOLDOWN_SECONDS
                    ? prev.cooldownRemaining
                    : AI_CHAT_CONFIG.COOLDOWN_SECONDS,
            }));
        }
    }, [state.messages, state.modelsToTry, state.remainingQuota, state.cooldownRemaining, t]);

    return {
        ...state,
        toggleChat,
        sendMessage,
    };
}
