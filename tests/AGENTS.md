# tests/AGENTS.md

This document guides AI Coding Assistants writing, running, and maintaining unit tests in `tests/`.

---

## 🧪 Testing Guidelines

1. **Test Environment**:
   - Uses Jest test runner configured in `jest.config.ts` with `jsdom` environment and `setupTests.ts`.

2. **React Testing Library Conventions**:
   - Use `@testing-library/react` (`render`, `screen`) for testing component rendering and user interactions.
   - Wrap components using `useTranslation` in `<I18nextProvider i18n={i18n}>` if necessary.

3. **Module Isolation**:
   - For testing utilities with module-level side-effects or singleton bindings (e.g. `logger.ts`), use `jest.isolateModulesAsync` with dynamic ES `import()` instead of disabling linter rules.

4. **Verification**:
   - Always run `npm test` after adding or updating any test file and ensure zero test failures.

5. **i18next Mocking Considerations**:
   - If a component calls `t('key', { returnObjects: true })` and expects an array, ensure the mock `t` function returns a valid array to prevent `.map()` from crashing.

6. **SessionStorage in JSDOM**:
   - `sessionStorage` persists across tests within the same file. Always call `sessionStorage.clear()` in `beforeEach()` to prevent state leakage between tests (e.g. cached models preventing fetch assertions).
   - Use `jest.resetAllMocks()` (not just `clearAllMocks()`) in `beforeEach()` when tests use `mockImplementation` to avoid mock leaks across tests.

7. **react-markdown Mock** (`tests/__mocks__/react-markdown.tsx`):
   - The mock parses markdown link syntax (`[text](url)`) and renders them via the custom `components.a` passed by `AiChatPanel`. This enables testing `target="_blank"` and `rel="noopener noreferrer"` attributes.
   - When updating the mock, ensure it handles multiple markdown links in a single string.

