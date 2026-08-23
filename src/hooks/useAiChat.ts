import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AiChatState, ChatMessage } from '../@types';
import { AI_CHAT_CONFIG } from '../constants';

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
  });

  const toggleChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
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
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!response.ok) {
        throw new Error(t('aiChat.error'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No readable stream returned');
      }

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          setState(prev => {
            const newMessages = [...prev.messages];
            const lastMsgIndex = newMessages.length - 1;
            
            if (newMessages[lastMsgIndex].id === assistantMessageId) {
              newMessages[lastMsgIndex] = {
                ...newMessages[lastMsgIndex],
                content: newMessages[lastMsgIndex].content + chunk,
              };
            }

            return { ...prev, messages: newMessages };
          });
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : t('aiChat.error'),
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages, t]);

  return {
    ...state,
    toggleChat,
    sendMessage,
  };
}
