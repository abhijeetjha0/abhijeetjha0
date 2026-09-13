import { useTranslation } from 'react-i18next';
import { Button } from 'react-bootstrap';

interface AiChatFabProps {
    isOpen: boolean;
    toggleChat: () => void;
}

export default function AiChatFab({ isOpen, toggleChat }: AiChatFabProps) {
    const { t } = useTranslation();

    if (isOpen) {
        return null;
    }

    return (
        <Button
            className="ai-chat-fab"
            onClick={toggleChat}
            aria-label={t('aiChat.title')}
            title={t('aiChat.title')}
            aria-expanded={false}
            aria-controls="ai-chat-panel"
        >
            <div className="fab-icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <path d="M12 7v0"></path>
                    <path d="M12 11v0"></path>
                    <path d="M16 11v0"></path>
                    <path d="M8 11v0"></path>
                </svg>
            </div>
            <span className="ai-sparkle">✨</span>
        </Button>
    );
}
