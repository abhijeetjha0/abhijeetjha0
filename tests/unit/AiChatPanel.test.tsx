import { render, screen, fireEvent } from '@testing-library/react';
import AiChatPanel from '../../src/components/AiChatPanel';
import { ChatMessage } from '../../src/@types';

// Mock translation hook
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const translations: Record<string, unknown> = {
                'aiChat.title': 'Ask Abhijit\'s AI',
                'aiChat.placeholder': 'Ask me anything...',
                'aiChat.send': 'Send',
                'aiChat.suggestedQuestions': ['Question 1', 'Question 2'],
                'aiChat.queriesRemaining': `${options?.count ?? 25} queries left`,
                'aiChat.cooldown': `Wait ${options?.seconds ?? 0}s...`,
                'aiChat.quotaReached': 'Session query limit reached',
                'aiChat.rateLimitNotice': 'Demo notice',
                'aiChat.contactEmail': 'Send Email',
                'aiChat.contactLinkedIn': 'LinkedIn Profile',
            };
      
            if (options && options.returnObjects) {
                return translations[key] || [];
            }

            return translations[key] || key;
        }
    })
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('AiChatPanel Component', () => {
    const mockMessages: ChatMessage[] = [
        { id: '1', role: 'assistant', content: 'Hello', timestamp: 123 },
        { id: '2', role: 'user', content: 'Hi', timestamp: 124 }
    ];

    const defaultProps = {
        isOpen: true,
        messages: mockMessages,
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        toggleChat: jest.fn(),
        cooldownRemaining: 0,
        remainingQuota: 25,
        isQuotaExceeded: false,
    };

    it('does not render when isOpen is false', () => {
        const { container } = render(<AiChatPanel {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders messages correctly and displays continuous quota badge', () => {
        render(<AiChatPanel {...defaultProps} />);
    
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi')).toBeInTheDocument();
        expect(screen.getByText("Ask Abhijit's AI")).toBeInTheDocument();
        expect(screen.getByText('25 queries left')).toBeInTheDocument();
        expect(screen.getByText('Demo notice')).toBeInTheDocument();
    });

    it('displays character counter as input changes', () => {
        render(<AiChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Ask me anything...');
        expect(screen.getByText('0/200')).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(screen.getByText('5/200')).toBeInTheDocument();
    });

    it('calls sendMessage on form submit', async () => {
        const sendMessageMock = jest.fn().mockResolvedValue(undefined);
        render(<AiChatPanel {...defaultProps} sendMessage={sendMessageMock} />);
    
        const input = screen.getByPlaceholderText('Ask me anything...');
        fireEvent.change(input, { target: { value: 'Test message' } });
    
        // Check if the button gets enabled
        const submitBtn = screen.getByLabelText('Send');
        expect(submitBtn).not.toBeDisabled();
    
        fireEvent.click(submitBtn);
    
        expect(sendMessageMock).toHaveBeenCalledWith('Test message');
    });

    it('disables input and shows loading indicator when isLoading is true', () => {
        const loadingMessages = [
            ...mockMessages, 
            { id: '3', role: 'assistant' as const, content: '', timestamp: 125 }
        ];
    
        render(<AiChatPanel {...defaultProps} isLoading={true} messages={loadingMessages} />);
    
        const input = screen.getByPlaceholderText('Ask me anything...');
        expect(input).toBeDisabled();
    
        const submitBtn = screen.getByLabelText('Send');
        expect(submitBtn).toBeDisabled();
    
        expect(screen.getByText('...')).toHaveClass('typing-indicator');
    });

    it('disables input and displays cooldown countdown on button when cooldownRemaining > 0', () => {
        render(<AiChatPanel {...defaultProps} cooldownRemaining={3} />);

        const input = screen.getByPlaceholderText('Ask me anything...');
        expect(input).toBeDisabled();

        const submitBtn = screen.getByLabelText('Wait 3s...');
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText('3s')).toBeInTheDocument();
    });

    it('renders quota exhausted state when isQuotaExceeded is true', () => {
        render(<AiChatPanel {...defaultProps} isQuotaExceeded={true} remainingQuota={0} />);

        expect(screen.getByText('0 queries left')).toBeInTheDocument();
        expect(screen.getByText('Session query limit reached')).toBeInTheDocument();
        expect(screen.getByText('Send Email')).toHaveAttribute('href', 'mailto:abhijeetjha0@hotmail.com');
        expect(screen.getByText('LinkedIn Profile')).toHaveAttribute('href', 'https://linkedin.com/in/abhijeetjha0');
        expect(screen.queryByPlaceholderText('Ask me anything...')).not.toBeInTheDocument();
    });

    it('renders suggested questions only when there is one message', () => {
        const singleMessage = [mockMessages[0]];
        const { rerender } = render(<AiChatPanel {...defaultProps} messages={singleMessage} />);
    
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
    
        // Rerender with multiple messages
        rerender(<AiChatPanel {...defaultProps} messages={mockMessages} />);
    
        expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
    });

    it('calls sendMessage when a suggested question is clicked', () => {
        const sendMessageMock = jest.fn().mockResolvedValue(undefined);
        const singleMessage = [mockMessages[0]];
    
        render(<AiChatPanel {...defaultProps} messages={singleMessage} sendMessage={sendMessageMock} />);
    
        fireEvent.click(screen.getByText('Question 1'));
        expect(sendMessageMock).toHaveBeenCalledWith('Question 1');
    });

    it('renders markdown links with target="_blank" and rel="noopener noreferrer"', () => {
        const linkMessages: ChatMessage[] = [
            {
                id: '1',
                role: 'assistant',
                content: 'Check out [My GitHub](https://github.com/abhijeetjha0) and [LinkedIn](linkedin.com/in/abhijeetjha0)',
                timestamp: 123,
            }
        ];

        render(<AiChatPanel {...defaultProps} messages={linkMessages} />);

        const githubLink = screen.getByRole('link', { name: 'My GitHub' });
        expect(githubLink).toHaveAttribute('href', 'https://github.com/abhijeetjha0');
        expect(githubLink).toHaveAttribute('target', '_blank');
        expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

        const linkedinLink = screen.getByRole('link', { name: 'LinkedIn' });
        expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/abhijeetjha0');
        expect(linkedinLink).toHaveAttribute('target', '_blank');
        expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
});

