# src/AGENTS.md

This document guides AI Coding Assistants working within the `src/` application directory.

---

## 🏗️ Architecture & Structure

```
src/
├── @types/          # Global TypeScript domain interfaces & types (index.ts)
├── components/      # Modular React UI components & sub-AGENTS.md rules
├── constants/       # Centralized application constants & design tokens (index.ts)
├── hooks/           # Custom React hooks (useAiChat.ts — AI chat state, quota, cooldown)
├── routes/          # Application page routes & views
├── styles/          # Modular SCSS stylesheets & global design tokens
├── translations/    # i18n localization JSON assets (en-US.json)
├── utilities/       # Utility functions (logger.ts)
├── Layout.tsx       # Root layout wrapper component
├── main.tsx         # React DOM entry point
└── i18n.ts          # i18next configuration & initialization
```

---

## 📌 Rules for `src/` Codebase

1. **No Interfaces in TSX Components**: Always declare shared TypeScript interfaces and types inside `src/@types/index.ts`. Avoid inline interface definitions in `.tsx` files.
2. **Centralized Constants**: Declare constant readonly values in `src/constants/index.ts` instead of declaring hardcoded strings or design tokens in components. AI chat configuration (quota, cooldown, input limits, storage keys) is centralized under `AI_CHAT_CONFIG`.
3. **No `any` Type**: Prefer explicit types or `unknown` over `any`.
4. **i18n Localization Integrity**: Ensure text content is loaded via `useTranslation()` from `src/translations/en-US.json`.
5. **No Disabled Lint Rules**: Never use `eslint-disable` comments unless explicitly approved and documented with a valid technical reason.
6. **Custom Hooks** (`src/hooks/`):
   - `useAiChat` manages AI chat state including messages, model discovery, session quota tracking (`sessionStorage`), cooldown countdown, and error handling.
   - Hooks must return a clean public API and keep internal state private.
   - Session persistence (quota, model cache) uses `sessionStorage` with keys from `AI_CHAT_CONFIG`.

