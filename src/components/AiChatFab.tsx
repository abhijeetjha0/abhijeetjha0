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
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }} aria-hidden="true">
                    chat
                </span>
            </div>
            <span className="ai-sparkle">✨</span>
        </Button>
    );
}
