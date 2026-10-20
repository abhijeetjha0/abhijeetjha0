import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import SettingsSidebar from '../../src/components/SettingsSidebar';
import { ThemeMode } from '../../src/@types';

describe('SettingsSidebar Component', () => {
    const mockOnClose = jest.fn();
    const mockSetTheme = jest.fn();

    const renderComponent = (props: {
        isOpen?: boolean;
        theme?: ThemeMode;
        resolvedTheme?: 'light' | 'dark';
    } = {}) => {
        const {
            isOpen = true,
            theme = 'system',
            resolvedTheme = 'light',
        } = props;

        return render(
            <I18nextProvider i18n={i18n}>
                <SettingsSidebar
                    isOpen={isOpen}
                    onClose={mockOnClose}
                    theme={theme}
                    resolvedTheme={resolvedTheme}
                    setTheme={mockSetTheme}
                />
            </I18nextProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders main title "Settings", label "Theme", and the three theme buttons without extra helper text', () => {
        renderComponent({ isOpen: true, theme: 'system', resolvedTheme: 'light' });

        expect(screen.getByRole('heading', { level: 5, name: 'Settings' })).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();

        // Ensure no extra texts or repository links exist
        expect(screen.queryByText(/choose your preferred/i)).toBeNull();
        expect(screen.queryByText(/currently active/i)).toBeNull();
        expect(screen.queryByRole('link', { name: /github repository/i })).toBeNull();
    });

    test('does not render visible content when isOpen is false', () => {
        renderComponent({ isOpen: false });

        expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('highlights the active theme button and sets aria-pressed', () => {
        const { rerender } = renderComponent({ isOpen: true, theme: 'dark', resolvedTheme: 'dark' });

        const darkBtn = screen.getByRole('button', { name: /dark/i });
        const lightBtn = screen.getByRole('button', { name: /light/i });
        const systemBtn = screen.getByRole('button', { name: /system/i });

        expect(darkBtn).toHaveClass('active');
        expect(darkBtn.getAttribute('aria-pressed')).toBe('true');
        expect(lightBtn.getAttribute('aria-pressed')).toBe('false');
        expect(systemBtn.getAttribute('aria-pressed')).toBe('false');

        rerender(
            <I18nextProvider i18n={i18n}>
                <SettingsSidebar
                    isOpen={true}
                    onClose={mockOnClose}
                    theme="light"
                    resolvedTheme="light"
                    setTheme={mockSetTheme}
                />
            </I18nextProvider>
        );

        expect(screen.getByRole('button', { name: /light/i })).toHaveClass('active');
        expect(screen.getByRole('button', { name: /light/i }).getAttribute('aria-pressed')).toBe('true');
    });

    test('calls setTheme when theme option buttons are clicked', () => {
        renderComponent({ isOpen: true, theme: 'system' });

        const lightBtn = screen.getByRole('button', { name: /light/i });
        fireEvent.click(lightBtn);
        expect(mockSetTheme).toHaveBeenCalledWith('light');

        const darkBtn = screen.getByRole('button', { name: /dark/i });
        fireEvent.click(darkBtn);
        expect(mockSetTheme).toHaveBeenCalledWith('dark');

        const systemBtn = screen.getByRole('button', { name: /system/i });
        fireEvent.click(systemBtn);
        expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    test('calls onClose when close button is clicked', () => {
        renderComponent({ isOpen: true, resolvedTheme: 'dark' });

        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
