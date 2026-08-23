import { render, screen } from '@testing-library/react';
import Hero from '../../src/components/Hero';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

describe('Hero Component', () => {
    test('renders name and title', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <Hero />
            </I18nextProvider>
        );
        expect(screen.getByText(/Abhijit Kumar Jha/i)).toBeDefined();
        expect(screen.getByText(/Senior Software Engineer/i)).toBeDefined();
        expect(screen.getByText(/github\.com\/abhijeetjha0/i)).toBeDefined();
        expect(screen.getByText(/linkedin\.com\/in\/abhijeetjha0/i)).toBeDefined();
    });
});
