import { render, screen } from '@testing-library/react';
import Hero from '../../src/components/Hero';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { PERSONAL_INFO } from '../../src/constants';

describe('Hero Component', () => {
    test('renders name, title, contact details, profile photo, and booking button', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <Hero />
            </I18nextProvider>
        );
        expect(screen.getByText(/Abhijit Kumar Jha/i)).toBeDefined();
        expect(screen.getByText(/Senior Software Engineer/i)).toBeDefined();
        expect(screen.getByText(/github\.com\/abhijeetjha0/i)).toBeDefined();
        expect(screen.getByText(/linkedin\.com\/in\/abhijeetjha0/i)).toBeDefined();

        expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Location:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/GitHub:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/LinkedIn:/i)).toBeInTheDocument();

        const profileImg = screen.getByRole('img', { name: /Abhijit Kumar Jha/i });
        expect(profileImg).toBeDefined();
        expect(profileImg.getAttribute('src')).toBe('profile.jpeg');

        const bookingBtn = screen.getByRole('link', { name: /book appointment/i });
        expect(bookingBtn).toBeInTheDocument();
        expect(bookingBtn.getAttribute('href')).toBe(PERSONAL_INFO.APPOINTMENT_URL);
        expect(bookingBtn.getAttribute('target')).toBe('_blank');
        expect(bookingBtn.getAttribute('rel')).toContain('noopener');

    });
});
