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
        expect(screen.getByText(/npmjs\.com\/~abhijeetjha0/i)).toBeDefined();
        expect(screen.getByText(/g\.dev\/abhijeetjha0/i)).toBeDefined();
        expect(screen.getByText(/ollama\.com\/abhijeetjha0/i)).toBeDefined();
        expect(screen.getByText(/huggingface\.co\/abhijeetjha0/i)).toBeDefined();

        expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Location:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/GitHub:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/LinkedIn:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/npm:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Google Developer:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Ollama:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Hugging Face:/i)).toBeInTheDocument();

        const profileImg = screen.getByRole('img', { name: /Abhijit Kumar Jha/i });
        expect(profileImg).toBeDefined();
        expect(profileImg.getAttribute('src')).toBe('profile.jpeg');

        const npmLink = screen.getByRole('link', { name: /npmjs\.com\/~abhijeetjha0/i });
        expect(npmLink).toBeInTheDocument();
        expect(npmLink.getAttribute('href')).toBe(PERSONAL_INFO.NPM_URL);
        expect(npmLink.getAttribute('target')).toBe('_blank');
        expect(npmLink.getAttribute('rel')).toContain('noopener');

        const googleDevLink = screen.getByRole('link', { name: /g\.dev\/abhijeetjha0/i });
        expect(googleDevLink).toBeInTheDocument();
        expect(googleDevLink.getAttribute('href')).toBe(PERSONAL_INFO.GOOGLE_DEV_URL);
        expect(googleDevLink.getAttribute('target')).toBe('_blank');
        expect(googleDevLink.getAttribute('rel')).toContain('noopener');

        const ollamaLink = screen.getByRole('link', { name: /ollama\.com\/abhijeetjha0/i });
        expect(ollamaLink).toBeInTheDocument();
        expect(ollamaLink.getAttribute('href')).toBe(PERSONAL_INFO.OLLAMA_URL);
        expect(ollamaLink.getAttribute('target')).toBe('_blank');
        expect(ollamaLink.getAttribute('rel')).toContain('noopener');

        const huggingfaceLink = screen.getByRole('link', { name: /huggingface\.co\/abhijeetjha0/i });
        expect(huggingfaceLink).toBeInTheDocument();
        expect(huggingfaceLink.getAttribute('href')).toBe(PERSONAL_INFO.HUGGINGFACE_URL);
        expect(huggingfaceLink.getAttribute('target')).toBe('_blank');
        expect(huggingfaceLink.getAttribute('rel')).toContain('noopener');

        const bookingBtn = screen.getByRole('link', { name: /book appointment/i });
        expect(bookingBtn).toBeInTheDocument();
        expect(bookingBtn.getAttribute('href')).toBe(PERSONAL_INFO.APPOINTMENT_URL);
        expect(bookingBtn.getAttribute('target')).toBe('_blank');
        expect(bookingBtn.getAttribute('rel')).toContain('noopener');

    });
});
