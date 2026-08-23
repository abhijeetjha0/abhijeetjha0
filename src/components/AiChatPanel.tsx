import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Button } from 'react-bootstrap';
import { ChatMessage } from '../@types';

interface AiChatPanelProps {
    isOpen: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (msg: string) => Promise<void>;
    toggleChat: () => void;
}

export default function AiChatPanel({
    isOpen,
    messages,
    isLoading,
    error,
    sendMessage,
    toggleChat
}: AiChatPanelProps) {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const suggestedQuestions = t('aiChat.suggestedQuestions', { returnObjects: true }) as string[];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
    
        const userMsg = input.trim();
        setInput('');
        await sendMessage(userMsg);
    };

    const handleSuggestionClick = async (question: string) => {
        if (isLoading) return;
        await sendMessage(question);
    };

    if (!isOpen) return null;

    return (
        <div className="ai-chat-panel shadow-lg rounded-top-4 rounded-start-4">
            <div className="chat-header p-3 bg-primary text-white d-flex justify-content-between align-items-center rounded-top-4">
                <h3 className="h6 mb-0 d-flex align-items-center gap-2">
                    <span className="ai-sparkle">✨</span>
                    {t('aiChat.title')}
                </h3>
                <button className="btn-close btn-close-white" onClick={toggleChat} aria-label="Close chat" />
            </div>

            <div className="chat-messages p-3 overflow-auto">
                {messages.map((msg, index) => (
                    <div key={msg.id || index} className={`message-bubble-wrapper ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                        <div className={`message-bubble ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'} p-2 px-3 rounded-4 mb-2 shadow-sm`}>
                            {msg.content || (msg.role === 'assistant' && isLoading && index === messages.length - 1 ? <span className="typing-indicator">...</span> : null)}
                        </div>
                    </div>
                ))}
        
                {messages.length === 1 && (
                    <div className="suggested-questions mt-4 d-flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                className="btn btn-sm btn-outline-primary rounded-pill"
                                onClick={() => handleSuggestionClick(q)}
                                disabled={isLoading}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
        
                {error && (
                    <div className="text-danger small mt-2 text-center p-2 bg-danger bg-opacity-10 rounded">
                        {error}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area p-3 border-top bg-white rounded-bottom-4">
                <Form onSubmit={handleSubmit} className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        placeholder={t('aiChat.placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="rounded-pill"
                    />
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isLoading || !input.trim()}
                        className="rounded-circle d-flex align-items-center justify-content-center p-2"
                        style={{ width: '40px', height: '40px' }}
                        aria-label={t('aiChat.send')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </Button>
                </Form>
            </div>
        </div>
    );
}
