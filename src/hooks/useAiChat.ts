import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AiChatState, ChatMessage, ProviderModel } from '../@types';
import { AI_CHAT_CONFIG } from '../constants';

function getCachedModels(): ProviderModel[] | undefined {
    try {
        const stored = sessionStorage.getItem(AI_CHAT_CONFIG.MODELS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (typeof parsed[0] === 'object' && parsed[0] !== null && 'provider' in parsed[0] && 'model' in parsed[0]) {
                    return parsed as ProviderModel[];
                }
            }
        }
    } catch {
        // Ignore JSON or storage errors
    }

    return undefined;
}

export function useAiChat() {
    const { t } = useTranslation();

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
        remainingQuota: null,
        isQuotaExceeded: false,
    });

    const toggleChat = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
    }, []);

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
        if (state.remainingQuota !== null && state.remainingQuota <= 0) {
            setState(prev => ({
                ...prev,
                isQuotaExceeded: true,
                error: t('aiChat.quotaReached'),
            }));

            return;
        }

        // Enforce max character limit
        const sanitizedContent = trimmed.slice(0, AI_CHAT_CONFIG.MAX_INPUT_LENGTH);

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

        setState(prev => {
            const nextRemaining = prev.remainingQuota !== null ? Math.max(0, prev.remainingQuota - 1) : null;

            return {
                ...prev,
                messages: [...prev.messages, userMessage, initialAssistantMessage],
                isLoading: true,
                error: null,
                remainingQuota: nextRemaining,
                isQuotaExceeded: nextRemaining !== null ? nextRemaining <= 0 : prev.isQuotaExceeded,
            };
        });

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

                    const remainingHeader = response.headers?.get ? response.headers.get('X-RateLimit-Remaining') : null;
                    const isDailyQuota = errorText.toLowerCase().includes('quota') ||
                        errorText.toLowerCase().includes('daily') ||
                        remainingHeader === '0';

                    if (isDailyQuota) {
                        const quotaNotice = t('aiChat.quotaReached');
                        setState(s => ({
                            ...s,
                            isQuotaExceeded: true,
                            remainingQuota: 0,
                            messages: s.messages.map(m => m.id === assistantMessageId ? {
                                ...m,
                                content: `⚠️ **${quotaNotice}**`,
                            } : m),
                        }));

                        throw new Error(errorText || quotaNotice);
                    }

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
            }));
        }
    }, [state.messages, state.modelsToTry, state.remainingQuota, t]);

    return {
        ...state,
        toggleChat,
        sendMessage,
    };
}
