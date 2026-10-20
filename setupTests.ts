import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import jestFetchMock from 'jest-fetch-mock';

Object.assign(globalThis, { TextEncoder, TextDecoder });

jestFetchMock.enableMocks();

// Mute console globally to keep test output clean
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

if (typeof window !== 'undefined' && !window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

