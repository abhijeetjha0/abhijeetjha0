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
    LINKEDIN: 'linkedin.com/in/abhijeetjha0',
    LINKEDIN_URL: 'https://linkedin.com/in/abhijeetjha0',
    PORTFOLIO_URL: 'https://abhijeetjha0.github.io/abhijeetjha0/',
    LOCATION: 'Jaipur, India',
} as const;

export const APP_CONFIG = {
    DEFAULT_LOCALE: 'en-US',
    SUPPORTED_LOCALES: ['en-US'] as const,
    GITHUB_REPO_URL: 'https://github.com/abhijeetjha0/abhijeetjha0',
    DEFAULT_BASENAME: '/abhijeetjha0/',
} as const;

export const SKILL_CATEGORY_METADATA: CategoryMeta[] = [
    {
        id: 'frameworks',
        label: 'Libraries & Frameworks',
        translationKey: 'frameworks',
        color: '#6366f1',
        bgLight: '#eef2ff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }),
            createElement('polyline', { points: '2 17 12 22 22 17' }),
            createElement('polyline', { points: '2 12 12 17 22 12' })
        ),
    },
    {
        id: 'languages',
        label: 'Programming Languages',
        translationKey: 'languages',
        color: '#2563eb',
        bgLight: '#eff6ff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('polyline', { points: '16 18 22 12 16 6' }),
            createElement('polyline', { points: '8 6 2 12 8 18' })
        ),
    },
    {
        id: 'webTech',
        label: 'Web Technologies',
        translationKey: 'webTech',
        color: '#059669',
        bgLight: '#ecfdf5',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('circle', { cx: 12, cy: 12, r: 10 }),
            createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 }),
            createElement('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z' })
        ),
    },
    {
        id: 'aiSkills',
        label: 'AI Skills & Practices',
        translationKey: 'aiSkills',
        color: '#7c3aed',
        bgLight: '#f5f3ff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('path', { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z' })
        ),
    },
    {
        id: 'aiTools',
        label: 'AI Tools & Platforms',
        translationKey: 'aiTools',
        color: '#8b5cf6',
        bgLight: '#f3e8ff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('rect', { x: 3, y: 11, width: 18, height: 10, rx: 2 }),
            createElement('circle', { cx: 12, cy: 5, r: 2 }),
            createElement('path', { d: 'M12 7v4' }),
            createElement('line', { x1: 8, y1: 16, x2: 8, y2: 16.01 }),
            createElement('line', { x1: 16, y1: 16, x2: 16, y2: 16.01 })
        ),
    },
    {
        id: 'buildTools',
        label: 'Build Tools',
        translationKey: 'buildTools',
        color: '#d97706',
        bgLight: '#fffbeb',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('path', { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' })
        ),
    },
    {
        id: 'linting',
        label: 'Quality & Linting',
        translationKey: 'linting',
        color: '#9333ea',
        bgLight: '#faf5ff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }),
            createElement('path', { d: 'm9 12 2 2 4-4' })
        ),
    },
    {
        id: 'others',
        label: 'Tools & Workflows',
        translationKey: 'others',
        color: '#0891b2',
        bgLight: '#ecfeff',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('rect', { x: 2, y: 7, width: 20, height: 14, rx: 2, ry: 2 }),
            createElement('path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' })
        ),
    },
    {
        id: 'leadership',
        label: 'Leadership & Management',
        translationKey: 'leadership',
        color: '#ea580c',
        bgLight: '#fff7ed',
        icon: createElement(
            'svg',
            { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }),
            createElement('circle', { cx: 9, cy: 7, r: 4 }),
            createElement('path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }),
            createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
        ),
    },
];

export const AI_CHAT_CONFIG = {
    // We use process.env to remain compatible with Jest, and use Vite's define to inject it during build
    BACKEND_URL: process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat',
    MODELS_URL: (process.env.VITE_AI_BACKEND_URL || 'http://localhost:3000/api/chat').replace('/api/chat', '/api/models'),
} as const;