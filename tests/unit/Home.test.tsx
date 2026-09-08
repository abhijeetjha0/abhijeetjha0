import { render, screen, act } from '@testing-library/react';
import Home from '../../src/components/Home';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

describe('Home Component', () => {
    beforeEach(() => {
        fetchMock.mockResponse(JSON.stringify(['mock-model-1']));
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
