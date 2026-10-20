import { render, screen, act } from '@testing-library/react';
import Home from '../../src/components/Home';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

describe('Home Component', () => {
    const actualUseTranslation = jest.requireActual('react-i18next').useTranslation;

    beforeEach(() => {
        if (jest.isMockFunction(useTranslation)) {
            (useTranslation as jest.Mock).mockImplementation(actualUseTranslation);
        }
        localStorage.clear();
        sessionStorage.clear();
        fetchMock.resetMocks();
        fetchMock.mockImplementation(async req => {
            const url = typeof req === 'string' ? req : (req && 'url' in req ? (req as Request).url : '');
            if (url.includes('/api/models')) {
                return new Response(JSON.stringify(['mock-model-1']), { status: 200 });
            }

            return new Response(JSON.stringify([]), { status: 200 });
        });
    });




    test('renders all child components and footer with copyright notice', async () => {
        let container: HTMLElement = document.createElement('div');

        await act(async () => {
            const rendered = render(
                <I18nextProvider i18n={i18n}>
                    <Home />
                </I18nextProvider>
            );
            container = rendered.container;
        });

        // Root container
        expect(container.querySelector('.portfolio-content')).not.toBeNull();

        // Hero section
        expect(screen.getAllByText('Abhijit Kumar Jha').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Senior Software Engineer/i).length).toBeGreaterThan(0);

        // Experience section
        expect(screen.getByRole('heading', { level: 2, name: /Professional Experience/i })).toBeDefined();

        // Skills section

        // Education section
        expect(screen.getByRole('heading', { level: 2, name: /Education/i })).toBeDefined();

        // Footer section
        expect(screen.getByText(/Developed by/i)).toBeDefined();
    });
});
