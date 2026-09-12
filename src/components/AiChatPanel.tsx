import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Button } from 'react-bootstrap';
import { AiChatPanelProps } from '../@types';
import { AI_CHAT_CONFIG } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AiChatPanel({
    isOpen,
    messages,
    isLoading,
    error,
    sendMessage,
    toggleChat,
    cooldownRemaining = 0,
    remainingQuota = AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION,
    isQuotaExceeded = false
}: AiChatPanelProps) {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestedQuestions = t('aiChat.suggestedQuestions', { returnObjects: true }) as string[];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || cooldownRemaining > 0 || isQuotaExceeded) {
            return;
        }
    
        const userMsg = input.trim().slice(0, AI_CHAT_CONFIG.MAX_INPUT_LENGTH);
        setInput('');
        await sendMessage(userMsg);
    };

    const handleSuggestionClick = async (question: string) => {
        if (isLoading || cooldownRemaining > 0 || isQuotaExceeded) {
            return;
        }

        await sendMessage(question);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div id="ai-chat-panel" role="region" aria-label={t('aiChat.title')} className="ai-chat-panel shadow-lg rounded-top-4 rounded-start-4">
            <div className="chat-header p-3 bg-primary text-white d-flex justify-content-between align-items-center rounded-top-4">
                <div className="d-flex align-items-center gap-2">
                    <h3 className="h6 mb-0 d-flex align-items-center gap-2">
                        <span className="ai-sparkle">✨</span>
                        {t('aiChat.title')}
                    </h3>
                    <span className="badge quota-badge" title={t('aiChat.queriesRemaining', { count: remainingQuota })}>
                        {t('aiChat.queriesRemaining', { count: remainingQuota })}
                    </span>
                </div>
                <button className="btn-close btn-close-white" onClick={toggleChat} aria-label="Close chat" />
            </div>

            <div className="chat-limitation-notice px-3 py-1 bg-light text-muted small border-bottom">
                {t('aiChat.rateLimitNotice')}
            </div>

            <div className="chat-messages p-3 overflow-auto" aria-live="polite" aria-atomic="false">
                {messages.map((msg, index) => (
                    <div key={msg.id || index} className={`message-bubble-wrapper ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                        <div className={`message-bubble ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'} p-2 px-3 rounded-4 mb-2 shadow-sm`}>
                            {msg.content ? (
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({ node: _node, ...props }) => <div className="table-responsive"><table className="table table-sm table-bordered mb-0" {...props} /></div>,
                                        p: ({ node: _node, ...props }) => <p className="mb-2 last-p-mb-0" {...props} />,
                                        a: ({ node: _node, href, ...props }) => {
                                            const formattedHref = href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')
                                                ? `https://${href}`
                                                : href;

                                            return (
                                                <a 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    href={formattedHref} 
                                                    {...props} 
                                                />
                                            );
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                msg.role === 'assistant' && isLoading && index === messages.length - 1 ? <span className="typing-indicator">...</span> : null
                            )}
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
                {isQuotaExceeded ? (
                    <div className="quota-exhausted-box text-center py-2 px-3">
                        <p className="small text-danger mb-2 fw-semibold">
                            {t('aiChat.quotaReached')}
                        </p>
                        <div className="d-flex justify-content-center gap-2">
                            <a
                                href="mailto:abhijeetjha0@hotmail.com"
                                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            >
                                {t('aiChat.contactEmail')}
                            </a>
                            <a
                                href="https://linkedin.com/in/abhijeetjha0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-primary rounded-pill px-3"
                            >
                                {t('aiChat.contactLinkedIn')}
                            </a>
                        </div>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit} className="d-flex flex-column gap-1">
                        <div className="d-flex gap-2 align-items-center">
                            <Form.Control
                                type="text"
                                placeholder={t('aiChat.placeholder')}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || cooldownRemaining > 0}
                                maxLength={AI_CHAT_CONFIG.MAX_INPUT_LENGTH}
                                className="rounded-pill"
                                ref={inputRef}
                            />
                            <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={isLoading || !input.trim() || cooldownRemaining > 0}
                                className="rounded-circle d-flex align-items-center justify-content-center p-2 flex-shrink-0"
                                style={{ width: '40px', height: '40px' }}
                                aria-label={cooldownRemaining > 0 ? t('aiChat.cooldown', { seconds: cooldownRemaining }) : t('aiChat.send')}
                            >
                                {cooldownRemaining > 0 ? (
                                    <span className="small fw-bold">{cooldownRemaining}s</span>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                )}
                            </Button>
                        </div>
                        <div className="d-flex justify-content-end px-2">
                            <span className="char-counter text-muted small">
                                {input.length}/{AI_CHAT_CONFIG.MAX_INPUT_LENGTH}
                            </span>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    );
}
