import Hero from './Hero';
import Experience from './Experience';
import Skills from './Skills';
import Education from './Education';
import Projects from './Projects';
import AiChatFab from './AiChatFab';
import AiChatPanel from './AiChatPanel';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAiChat } from '../hooks/useAiChat';

export default function Home() {
    const { t } = useTranslation();
    const { messages, isLoading, isOpen, error, sendMessage, toggleChat } = useAiChat();

    return (
        <div className="portfolio-content">
            <Hero />
            <Experience />
            <Skills />
            <Projects />
            <Education />
      
            <AiChatFab isOpen={isOpen} toggleChat={toggleChat} />
            <AiChatPanel 
                isOpen={isOpen} 
                messages={messages} 
                isLoading={isLoading} 
                error={error} 
                sendMessage={sendMessage} 
                toggleChat={toggleChat} 
            />

            <footer className="bg-dark text-white py-4 mt-5">
                <Container className="text-center">
                    <p className="mb-0">{t('footer.developedBy')} {t('personalInfo.name')}</p>
                </Container>
            </footer>
        </div>
    );
}
