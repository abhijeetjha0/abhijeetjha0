import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import jestFetchMock from 'jest-fetch-mock';

Object.assign(globalThis, { TextEncoder, TextDecoder });

jestFetchMock.enableMocks();

// Mute console globally to keep test output clean
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
