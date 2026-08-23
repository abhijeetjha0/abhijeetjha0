import { render, screen, fireEvent } from '@testing-library/react';
import AiChatFab from '../../src/components/AiChatFab';

// Mock translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'aiChat.title': 'Ask Abhijit\'s AI',
      };

      return translations[key] || key;
    }
  })
}));

describe('AiChatFab Component', () => {
  it('renders correctly when closed', () => {
    const toggleChat = jest.fn();
    render(<AiChatFab isOpen={false} toggleChat={toggleChat} />);

    const button = screen.getByRole('button', { name: "Ask Abhijit's AI" });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('is-open');
    
    // Sparkle should be visible when closed
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    const toggleChat = jest.fn();
    render(<AiChatFab isOpen={true} toggleChat={toggleChat} />);

    const button = screen.getByRole('button', { name: "Ask Abhijit's AI" });
    expect(button).toHaveClass('is-open');
    
    // Sparkle should be hidden when open
    expect(screen.queryByText('✨')).not.toBeInTheDocument();
  });

  it('calls toggleChat on click', () => {
    const toggleChat = jest.fn();
    render(<AiChatFab isOpen={false} toggleChat={toggleChat} />);

    fireEvent.click(screen.getByRole('button'));
    expect(toggleChat).toHaveBeenCalledTimes(1);
  });
});
