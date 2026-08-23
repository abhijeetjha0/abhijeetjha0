import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.app.json',
        }],
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^react-markdown$': '<rootDir>/tests/__mocks__/react-markdown.tsx',
        '^remark-gfm$': '<rootDir>/tests/__mocks__/remark-gfm.ts',
    },
    setupFilesAfterEnv: ['./setupTests.ts'],
    roots: ['src/', 'tests/'],
    testPathIgnorePatterns: ['!/tests/'],
    testMatch: ['**/*.test.(ts|tsx)'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
    reporters: ['default']
};

export default config;