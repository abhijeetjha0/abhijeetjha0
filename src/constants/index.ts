import { createElement } from 'react';
import { CategoryMeta } from '../@types';

export const SECTION_IDS = {
    HOME: 'home',
    EXPERIENCE: 'experience',
    SKILLS: 'skills',
    EDUCATION: 'education',
    PROJECTS: 'projects',
} as const;

export const NAV_LINKS = [
    { id: SECTION_IDS.EXPERIENCE, href: `#${SECTION_IDS.EXPERIENCE}`, labelKey: 'sections.experience' },
    { id: SECTION_IDS.SKILLS, href: `#${SECTION_IDS.SKILLS}`, labelKey: 'sections.skills' },
    { id: SECTION_IDS.PROJECTS, href: `#${SECTION_IDS.PROJECTS}`, labelKey: 'sections.projects' },
    { id: SECTION_IDS.EDUCATION, href: `#${SECTION_IDS.EDUCATION}`, labelKey: 'sections.education' },
] as const;

export const PERSONAL_INFO = {
    NAME: 'Abhijit Kumar Jha',
    TITLE: 'Senior Software Engineer',
    EMAIL: 'abhijeetjha0@hotmail.com',
    GITHUB: 'github.com/abhijeetjha0',
    GITHUB_URL: 'https://github.com/abhijeetjha0',
    LINKEDIN: 'linkedin.com/in/abhijeetjha0',
    LINKEDIN_URL: 'https://linkedin.com/in/abhijeetjha0',
    NPM: 'npmjs.com/~abhijeetjha0',
    NPM_URL: 'https://www.npmjs.com/~abhijeetjha0',
    GOOGLE_DEV: 'g.dev/abhijeetjha0',
    GOOGLE_DEV_URL: 'https://g.dev/abhijeetjha0',
    OLLAMA: 'ollama.com/abhijeetjha0',
    OLLAMA_URL: 'https://ollama.com/abhijeetjha0',
    HUGGINGFACE: 'huggingface.co/abhijeetjha0',
    HUGGINGFACE_URL: 'https://huggingface.co/abhijeetjha0',
    LOVABLE: 'lovable.dev/@abhijeetjha0',
    LOVABLE_URL: 'https://lovable.dev/@abhijeetjha0',
    PORTFOLIO_URL: 'https://abhijeetjha0.github.io/abhijeetjha0/',
    LOCATION: 'Jaipur, India',
    APPOINTMENT_URL: 'https://calendar.app.google/BFfU1CSpF3XL9ja69',
} as const;



export const APP_CONFIG = {
    DEFAULT_LOCALE: 'en-US',
    SUPPORTED_LOCALES: ['en-US'] as const,
    GITHUB_REPO_URL: 'https://github.com/abhijeetjha0/abhijeetjha0',
    DEFAULT_BASENAME: '/abhijeetjha0/',
} as const;

const createCategoryIcon = (iconName: string) =>
    createElement(
        'span',
        {
            className: 'material-symbols-outlined',
            'aria-hidden': 'true',
            style: { fontSize: '24px' },
        },
        iconName
    );

export const SKILL_CATEGORY_METADATA: CategoryMeta[] = [
    {
        id: 'frameworks',
        label: 'Libraries & Frameworks',
        translationKey: 'frameworks',
        color: '#6366f1',
        bgLight: '#eef2ff',
        icon: createCategoryIcon('layers'),
    },
    {
        id: 'languages',
        label: 'Programming Languages',
        translationKey: 'languages',
        color: '#2563eb',
        bgLight: '#eff6ff',
        icon: createCategoryIcon('code'),
    },
    {
        id: 'webTech',
        label: 'Web Technologies',
        translationKey: 'webTech',
        color: '#059669',
        bgLight: '#ecfdf5',
        icon: createCategoryIcon('language'),
    },
    {
        id: 'aiSkills',
        label: 'AI Skills & Practices',
        translationKey: 'aiSkills',
        color: '#7c3aed',
        bgLight: '#f5f3ff',
        icon: createCategoryIcon('auto_awesome'),
    },
    {
        id: 'aiTools',
        label: 'AI Tools & Platforms',
        translationKey: 'aiTools',
        color: '#8b5cf6',
        bgLight: '#f3e8ff',
        icon: createCategoryIcon('smart_toy'),
    },
    {
        id: 'buildTools',
        label: 'Build Tools',
        translationKey: 'buildTools',
        color: '#d97706',
        bgLight: '#fffbeb',
        icon: createCategoryIcon('build'),
    },
    {
        id: 'linting',
        label: 'Quality & Linting',
        translationKey: 'linting',
        color: '#9333ea',
        bgLight: '#faf5ff',
        icon: createCategoryIcon('verified_user'),
    },
    {
        id: 'others',
        label: 'Tools & Workflows',
        translationKey: 'others',
        color: '#0891b2',
        bgLight: '#ecfeff',
        icon: createCategoryIcon('terminal'),
    },
    {
        id: 'leadership',
        label: 'Leadership & Management',
        translationKey: 'leadership',
        color: '#ea580c',
        bgLight: '#fff7ed',
        icon: createCategoryIcon('groups'),
    },
];

export const AI_CHAT_CONFIG = {
    // We use process.env to remain compatible with Jest, and use Vite's define to inject it during build
    BACKEND_URL: process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat',
    MODELS_URL: (process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat').replace('/api/chat', '/api/models'),
    PROJECTS_URL: (process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat').replace('/api/chat', '/api/projects'),
    MAX_MESSAGES_PER_SESSION: 25,
    MAX_INPUT_LENGTH: 200,
    STORAGE_KEY: 'abhijeetjha0_ai_chat_usage',
    MODELS_STORAGE_KEY: 'abhijeetjha0_ai_models',
} as const;

export const PROJECTS_CONFIG = {
    GITHUB_USERNAME: 'abhijeetjha0',
    GITHUB_API_URL: 'https://api.github.com/users/abhijeetjha0/repos?sort=pushed&per_page=100',
    BACKEND_URL: (process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat').replace('/api/chat', '/api/projects'),
    LANGUAGE_COLORS: {
        TypeScript: '#3178c6',
        JavaScript: '#f7df1e',
        HTML: '#e34c26',
        CSS: '#563d7c',
        SCSS: '#c6538c',
        Python: '#3572A5',
        Shell: '#89e051',
        Go: '#00add8',
        Rust: '#dea584',
    } as Record<string, string>,
    KNOWN_REPO_NAMES: {
        'markdown-notes-app': 'Markdown Notes App',
        'leave-planner': 'Leave Planner',
        'ai': 'AI Agent Skills',
        'poke-dexter': 'Poke-Dexter',
        'abhijeetjha0': 'Personal Portfolio',
        'VaccinationSlotsMonitor': 'Vaccination Slots Monitor',
        'spin-your-ai': 'Spin Your AI',
        'spin-your-ai-vscode-extension': 'Spin Your AI (VS Code Extension)',
        'node-project-builder': 'Node Project Builder',
        'ai-vs-ai-pokemon-showdown': 'AI vs AI Pokémon Showdown',
        'ai-vs-ai-chess': 'AI vs AI Chess',
        'ollama-router': 'Ollama Router',
        'lint-rules': 'Lint Rules',
    } as Record<string, string>,
    CURATED_DESCRIPTIONS: {
        'node-project-builder': 'A comprehensive CLI tool to quickly generate and scaffold production-ready Node.js project templates.',
        'VaccinationSlotsMonitor': 'A monitoring tool designed to track and notify users about available vaccination slots.',
        'lint-rules': 'Custom, industry-level ESLint and code style configurations for modern TypeScript and JavaScript development.',
    } as Record<string, string>,
} as const;

export const THEME_CONFIG = {
    STORAGE_KEY: 'abhijeetjha0_theme',
    DEFAULT_THEME: 'system' as const,
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system',
    } as const,
} as const;