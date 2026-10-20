import { render, screen } from '@testing-library/react';
import Projects from '../../src/components/Projects';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { useGitHubProjects } from '../../src/hooks/useGitHubProjects';
import { ProjectInfo } from '../../src/@types';

jest.mock('../../src/hooks/useGitHubProjects');

describe('Projects Component', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('renders skeleton loading placeholders while projects are loading', () => {
        (useGitHubProjects as jest.Mock).mockReturnValue({
            projects: [],
            isLoading: true,
            isError: false,
            refresh: jest.fn(),
        });

        const { container } = render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        expect(screen.getByRole('heading', { level: 2, name: /Projects/i })).toBeDefined();
        const placeholders = container.querySelectorAll('.placeholder');
        expect(placeholders.length).toBeGreaterThan(0);
    });

    test('renders section heading and project items when loaded', () => {
        const mockProjects: ProjectInfo[] = [
            {
                name: 'Markdown Notes App',
                description: 'Google Keep inspired note-taking web app',
                link: 'https://github.com/abhijeetjha0/markdown-notes-app',
            },
            {
                name: 'Leave Planner',
                description: 'Vacation and leave optimization dashboard',
                link: 'https://github.com/abhijeetjha0/leave-planner',
            },
        ];

        (useGitHubProjects as jest.Mock).mockReturnValue({
            projects: mockProjects,
            isLoading: false,
            isError: false,
            refresh: jest.fn(),
        });

        render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        expect(screen.getByRole('heading', { level: 2, name: /Projects/i })).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Markdown Notes App' })).toBeDefined();
        expect(screen.getByRole('heading', { level: 3, name: 'Leave Planner' })).toBeDefined();
        expect(screen.getAllByRole('link', { name: /View Project/i }).length).toBe(2);
    });

    test('renders section element with correct projects id', () => {
        (useGitHubProjects as jest.Mock).mockReturnValue({
            projects: [],
            isLoading: false,
            isError: false,
            refresh: jest.fn(),
        });

        const { container } = render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        const section = container.querySelector('section#projects');
        expect(section).not.toBeNull();
    });

    test('renders language badge and Live Demo button when available', () => {
        const mockProjects: ProjectInfo[] = [
            {
                name: 'Rich Project',
                description: 'Project with language and homepage',
                link: 'https://github.com/abhijeetjha0/rich-project',
                homepage: 'https://rich-project.demo.com',
                language: 'TypeScript',
            },
        ];

        (useGitHubProjects as jest.Mock).mockReturnValue({
            projects: mockProjects,
            isLoading: false,
            isError: false,
            refresh: jest.fn(),
        });

        render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        expect(screen.getByText('TypeScript')).toBeDefined();
        const liveDemoLink = screen.getByRole('link', { name: /Live Demo/i });
        expect(liveDemoLink.getAttribute('href')).toBe('https://rich-project.demo.com');
        expect(liveDemoLink.getAttribute('target')).toBe('_blank');
        expect(liveDemoLink.getAttribute('rel')).toBe('noopener noreferrer');

        const codeLink = screen.getByRole('link', { name: /View Project/i });
        expect(codeLink.getAttribute('href')).toBe('https://github.com/abhijeetjha0/rich-project');
    });

    test('handles empty projects array gracefully after loading completes', () => {
        (useGitHubProjects as jest.Mock).mockReturnValue({
            projects: [],
            isLoading: false,
            isError: false,
            refresh: jest.fn(),
        });

        render(
            <I18nextProvider i18n={i18n}>
                <Projects />
            </I18nextProvider>
        );

        expect(screen.getByRole('heading', { level: 2, name: /Projects/i })).toBeDefined();
        expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    });
});
