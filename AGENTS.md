# AGENTS.md

This document serves as the master architectural guide for AI Coding Assistants (e.g., Google Antigravity, Claude Code, Google Jules, Gemini) working within the `abhijeetjha0` repository.

Subdirectory-specific guidelines are maintained in modular `AGENTS.md` files throughout the project hierarchy.

---

## 🤖 Repository Architecture & Modular AGENTS.md Hierarchy

```
.
├── .github/                 # GitHub workflows, static assets, and CI/CD AGENTS.md
├── .gitignore               # Git ignore pattern rules
├── .nvmrc                   # Target Node.js engine version declaration
├── api/                     # Vercel Serverless Backend API functions
├── coverage/                # Generated Jest test coverage reports & badges
├── dist/                    # Compiled Vite production bundle output
├── node_modules/            # Installed npm packages and dependencies
├── public/                  # Static web assets (favicons, manifest, etc.)
├── scripts/                 # Automation scripts & scripts AGENTS.md
├── src/                     # Source code & source AGENTS.md
├── tests/                   # Jest unit testing suite & tests AGENTS.md
├── eslint.config.js         # ESLint 9 flat configuration
├── index.html               # SPA HTML entry point
├── jest.config.ts           # Jest test runner settings
├── package.json             # Dependencies, scripts, and engine boundaries
├── package-lock.json        # Locked dependency manifest
├── setupTests.ts            # Testing environment initialization
├── .stylelintrc.json        # Stylelint SCSS rules configuration
├── tsconfig.json            # Main TypeScript compiler configuration
├── tsconfig.app.json        # Client application TypeScript settings
├── tsconfig.node.json       # Node environment TypeScript settings
├── vite.config.ts           # Vite bundler & React compiler configuration
├── AGENTS.md                # Master agent instruction & tooling registry
├── README.md                # Developer documentation & portfolio presentation
└── SETUP.md                 # Local development & setup instructions
```

---

## 📋 Developer & Agent Commands Registry

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | Dev Server | Launches Vite frontend development server (configured with remote Edge backend). |
| `npm run preview` | Production Preview | Locally serves the compiled production build output from `dist`. |
| `npm run build` | Production Build | Executes TypeScript type check (`tsc -b`) and Vite production bundle build. |
| `npm run test` | Unit Tests | Executes Jest unit tests and generates coverage metrics. |
| `npm run lint` | Code Quality | Runs ESLint across TypeScript/JavaScript files. |
| `npm run lint-style` | SCSS Linting | Runs Stylelint across all SCSS files (`stylelint '**/*.scss'`). |
---

## 📌 Master Rules for AI Agents

1. **Verification Requirement**: Never declare a task resolved without running `npm test`, `npm run build`, and `npm run lint` when modifying application code files. Verification commands can be skipped when only updating Markdown (`.md`) documentation files.
2. **No Placeholders**: Maintain exact production URLs and valid Simple Icons logo parameters across all documentation files.
3. **Keep AGENTS.md Up to Date**: Update relevant modular `AGENTS.md` files whenever tooling, configuration, or directory architecture changes.

4. **Vercel Edge Functions Architecture**: All backend AI integrations (like `/api/chat.ts` and `/api/models.ts`) are deployed as Vercel Edge Functions. Do not use Node-specific modules (like `fs` or `path`). All shared configuration and system prompts MUST be maintained in `/api/constants.ts` to adhere to Edge Runtime constraints.
5. **AI Chat Context & Formatting**: 
    - **Context Management**: Ollama API context is managed strictly by passing the entire chat history array in each request. Edge functions remain stateless.
    - **Markdown Rendering**: The UI utilizes `react-markdown` with the `remark-gfm` plugin to support GitHub Flavored Markdown (including tables). The backend Edge function proactively strips wrapping markdown code blocks (` ```markdown `) if the LLM incorrectly formats its output.
6. **Jest Mocking for ESM**: Packages like `react-markdown` and `remark-gfm` use pure ECMAScript Modules (ESM) which natively conflict with Jest out of the box. Always mock these dependencies via `moduleNameMapper` inside `jest.config.ts` mapping to `tests/__mocks__/`.
7. **Edge Rate Limiting (Upstash / Vercel KV)**: Edge functions employ `@upstash/ratelimit` with Redis for global IP rate limiting (5 req / 10s). Rate limiters must fail gracefully (bypass) if KV tokens are absent from the environment.
8. **Vite Code Splitting & Vendor Chunking**: Maintain explicit `manualChunks` object mapping in `vite.config.ts` (`vendor-react`, `vendor-bootstrap`, `vendor-markdown`, `vendor-i18n`) to ensure chunk sizes remain strictly below 500 kB and prevent monolithic bundles.
9. **ESLint & Code Standards**: 
    - Standard 4-space indentation enforced via `@stylistic/eslint-plugin`.
    - Mandatory blank lines before `return` statements (`padding-line-between-statements`).
    - Unused variables/arguments must be prefixed with `_` (`argsIgnorePattern: '^_'`).

> **Note**: Subdirectory-specific guidelines (React component interfaces, constant declarations, i18n parity, shell script standards, and Jest testing patterns) are maintained directly within their respective modular `AGENTS.md` files:
> - [.github/AGENTS.md](file:///.github/AGENTS.md)
> - [scripts/AGENTS.md](file:///scripts/AGENTS.md)
> - [src/AGENTS.md](file:///src/AGENTS.md)
> - [src/components/AGENTS.md](file:///src/components/AGENTS.md)
> - [src/translations/AGENTS.md](file:///src/translations/AGENTS.md)
> - [tests/AGENTS.md](file:///tests/AGENTS.md)