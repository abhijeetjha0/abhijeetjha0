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
                'aiChat.suggestedQuestions': ['Question 1', 'Question 2']
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
        toggleChat: jest.fn()
    };

    it('does not render when isOpen is false', () => {
        const { container } = render(<AiChatPanel {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders messages correctly', () => {
        render(<AiChatPanel {...defaultProps} />);
    
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi')).toBeInTheDocument();
        expect(screen.getByText("Ask Abhijit's AI")).toBeInTheDocument();
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
});
