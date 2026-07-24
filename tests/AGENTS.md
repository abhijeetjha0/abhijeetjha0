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
