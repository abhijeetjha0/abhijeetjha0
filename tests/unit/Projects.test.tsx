import { render, screen } from '@testing-library/react';
import Projects from '../../src/components/Projects';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

jest.mock('react-i18next', () => {
    const original = jest.requireActual('react-i18next');

    return {
        ...original,
        useTranslation: jest.fn().mockImplementation(original.useTranslation),
    };
});

describe('Projects Component', () => {
    const actualUseTranslation = jest.requireActual('react-i18next').useTranslation;

    beforeEach(() => {
        (useTranslation as jest.Mock).mockImplementation(actualUseTranslation);
    });

    test('renders section heading and default project items', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        expect(screen.getByRole('heading', { level: 2, name: /Projects/i })).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Poke-Dexter' })).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Personal Portfolio' })).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Vaccination Slots Monitor' })).toBeDefined();
        expect(screen.getAllByRole('link', { name: /View Project/i }).length).toBe(3);
    });

    test('renders section element with correct projects id', () => {
        const { container } = render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        const section = container.querySelector('section#projects');
        expect(section).not.toBeNull();
    });

    test('handles custom mock projects data gracefully', () => {
        const mockProjects = [
            {
                name: 'Custom Project',
                description: 'A custom project for testing',
                link: 'https://example.com'
            }
        ];

        (useTranslation as jest.Mock).mockReturnValue({
            t: (key: string, options?: Record<string, unknown>) => {
                if (key === 'sections.projects') return 'My Works';
                if (key === 'projects' && options?.returnObjects) return mockProjects;

                return key;
            },
        });

        render(<Projects />);

        expect(screen.getByText('My Works')).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Custom Project' })).toBeDefined();
        expect(screen.getByText('A custom project for testing')).toBeDefined();
        const link = screen.getByRole('link', { name: /View Project/i });
        expect(link.getAttribute('href')).toBe('https://example.com');
    });

    test('handles empty or missing projects array gracefully without crashing', () => {
        (useTranslation as jest.Mock).mockReturnValue({
            t: (key: string, options?: Record<string, unknown>) => {
                if (key === 'sections.projects') return 'Projects';
                if (key === 'projects' && options?.returnObjects) return null;

                return key;
            },
        });

        render(<Projects />);

        expect(screen.getByRole('heading', { level: 2, name: /Projects/i })).toBeDefined();
        expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    });
});
