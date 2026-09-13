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
├── api/                     # Vercel Edge Functions backend & api AGENTS.md
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

4. **Vercel Edge Functions Architecture**: All backend AI integrations (like `/api/chat.ts` and `/api/models.ts`) are deployed as Vercel Edge Functions. Do not use Node-specific modules (like `fs` or `path`). All shared configuration and system prompts MUST be maintained in `/api/constants.ts` to adhere to Edge Runtime constraints. All relative imports within `api/` must specify explicit `.js` extensions (e.g. `import ... from './constants.js'`) for compatibility with Node16/NodeNext ESM module resolution on Vercel. See `api/AGENTS.md` for detailed guidelines.
5. **AI Chat & Multi-Provider Architecture**: 
    - **Context Management**: Conversation context is managed strictly by passing the entire chat history array in each request. Edge functions remain stateless.
    - **Pluggable Free Provider Layer** (`api/providers/`): Manages an automatic cascading fallback across 100% free providers in default priority order: 1. Ollama Cloud, 2. Hugging Face Inference, and 3. OpenRouter Free Tier (strictly locked to `openrouter/free`) using a zero-dependency OpenAI-compatible HTTP client. Models are service-bound (`ProviderModel[]`) to eliminate cross-provider model mismatch.
    - **Priority Override**: `DEFAULT_AI_PROVIDER` (`ollama` | `huggingface` | `openrouter`) prioritizes a specific provider.
    - **Exposed Response Headers**: Responses include `X-AI-Provider` and `X-AI-Model` headers, exposed to browsers via `Access-Control-Expose-Headers` in `CORS_HEADERS`.
    - **Markdown Rendering**: The UI utilizes `react-markdown` with the `remark-gfm` plugin to support GitHub Flavored Markdown (including tables). The backend proactively strips wrapping markdown code blocks (` ```markdown `) if the LLM incorrectly formats its output.
    - **Link Security**: All markdown links in chat responses must open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). This is enforced via a custom `a` component in `ReactMarkdown`. URLs without a protocol are auto-prefixed with `https://`.
6. **Jest Mocking for ESM**: Packages like `react-markdown` and `remark-gfm` use pure ECMAScript Modules (ESM) which natively conflict with Jest out of the box. Always mock these dependencies via `moduleNameMapper` inside `jest.config.ts` mapping to `tests/__mocks__/`.
7. **Edge Rate Limiting (Upstash / Vercel KV)**: Edge functions employ `@upstash/ratelimit` with Redis for global IP rate limiting:
    - **Burst Rate Limit**: 5 requests / 10s window (`chatRateLimit`) applied to `/api/chat` and `/api/models`.
    - **Daily Quota Limit**: 25 requests / 24h sliding window (`chatDailyRateLimit`) enforced on `/api/chat` to protect provider quotas.
    - Rate limiters fail gracefully (bypass or use in-memory token-bucket `InMemoryRateLimiter`) if KV/Redis credentials are absent from the environment.
    - `/api/chat` attaches `X-RateLimit-Remaining` and `X-RateLimit-Limit: 25` to successful responses and returns HTTP 429 with `X-RateLimit-Remaining: 0` when the daily quota is reached.
8. **Client-Side Rate Limiting & Quota**: The `useAiChat` hook enforces rate limiting and quota synchronization:
    - **Server IP Authority & Progressive Quota Disclosure**: Quota is enforced purely at the server level per IP address (25 requests / 24h). On initial page load / refresh, `remainingQuota` starts as `null` so no unverified count is displayed. The UI progressively reveals the quota badge with the authoritative count once the backend responds with the `X-RateLimit-Remaining` header.
    - **Input Length Limit**: 200 characters per message (`MAX_INPUT_LENGTH`).
    - **Daily Quota 429 & Chatbox Notice**: When the 24-hour daily quota is exhausted (HTTP 429 or `remainingQuota <= 0`), the client locks chat (`isQuotaExceeded = true`, `remainingQuota = 0`) and directly inserts a clear rate limit notification into the chatbox, letting the user know their 25 requests will reset automatically after 24 hours.
    - **Model Caching**: Available models are cached in `sessionStorage` to avoid redundant `/api/models` calls.
    - All config constants are centralized in `src/constants/index.ts` under `AI_CHAT_CONFIG`.
9. **Vite Code Splitting & Vendor Chunking**: Maintain explicit `manualChunks` object mapping in `vite.config.ts` (`vendor-react`, `vendor-bootstrap`, `vendor-markdown`, `vendor-i18n`) to ensure chunk sizes remain strictly below 500 kB and prevent monolithic bundles.
10. **ESLint & Code Standards**: 
    - Standard 4-space indentation enforced via `@stylistic/eslint-plugin`.
    - Mandatory blank lines before `return` statements (`padding-line-between-statements`).
    - Unused variables/arguments must be prefixed with `_` (`argsIgnorePattern: '^_'`).
11. **Dynamic Free Models Synchronization & Cron Automation**:
    - **Automated Free Model Discovery**: Hugging Face models are dynamically fetched from `https://router.huggingface.co/v1/models` and filtered for `pricing.input === 0 && pricing.output === 0 && status === 'live'`. Ollama Cloud models are fetched using `OLLAMA_API_KEY` from `https://ollama.com/api/usage` (`limits.monthly.models` representing the account's "Included usage" free models list) and `/v1/models`.
    - **Upstash Redis Caching**: Synced models are cached in Upstash Redis (`portfolio_free_models_cache`) with a 24-hour TTL and backed by in-memory caching.
    - **Vercel Cron**: Scheduled daily at 04:00 UTC (`0 4 * * *` in `vercel.json`) via `/api/cron/sync-models.ts` with optional `CRON_SECRET` authentication.


> **Note**: Subdirectory-specific guidelines (Edge Functions, React component interfaces, constant declarations, i18n parity, shell script standards, and Jest testing patterns) are maintained directly within their respective modular `AGENTS.md` files:
> - [api/AGENTS.md](file:///api/AGENTS.md)
> - [.github/AGENTS.md](file:///.github/AGENTS.md)
> - [scripts/AGENTS.md](file:///scripts/AGENTS.md)
> - [src/AGENTS.md](file:///src/AGENTS.md)
> - [src/components/AGENTS.md](file:///src/components/AGENTS.md)
> - [src/translations/AGENTS.md](file:///src/translations/AGENTS.md)
> - [tests/AGENTS.md](file:///tests/AGENTS.md)