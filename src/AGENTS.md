# src/AGENTS.md

This document guides AI Coding Assistants working within the `src/` application directory.

---

## 🏗️ Architecture & Structure

```
src/
├── @types/          # Global TypeScript domain interfaces & types (index.ts)
├── components/      # Modular React UI components & sub-AGENTS.md rules
├── constants/       # Centralized application constants & design tokens (index.ts)
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
2. **Centralized Constants**: Declare constant readonly values in `src/constants/index.ts` instead of declaring hardcoded strings or design tokens in components.
3. **No `any` Type**: Prefer explicit types or `unknown` over `any`.
4. **i18n Localization Integrity**: Ensure text content is loaded via `useTranslation()` from `src/translations/en-US.json`.
5. **No Disabled Lint Rules**: Never use `eslint-disable` comments unless explicitly approved and documented with a valid technical reason.
