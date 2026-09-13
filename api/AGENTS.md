# api/AGENTS.md

This document guides AI Coding Assistants working within the `api/` directory, which contains Vercel Edge Functions powering the AI chat backend.

---

## 🏗️ Architecture & Structure

```
api/
├── chat.ts               # POST /api/chat — Multi-provider AI chat completions endpoint
├── constants.ts          # Shared system prompt, Ollama API URL, CORS headers
├── models.ts             # GET /api/models — Returns available models from configured providers
├── rateLimit.ts          # IP-based rate limiter (Upstash Redis primary, in-memory fallback)
├── cron/
│   └── sync-models.ts    # GET /api/cron/sync-models — Vercel Cron endpoint refreshing free models cache
└── providers/            # Pluggable 100% Free AI Provider Layer
    ├── types.ts          # Provider interfaces, payload types, and result contracts
    ├── client.ts         # Zero-dependency OpenAI-compatible Edge HTTP caller
    ├── registry.ts       # Registry for OpenRouter, Hugging Face, and Ollama
    ├── sync.ts           # Dynamic sync for free models from Ollama & HF with Upstash Redis cache
    └── index.ts          # Cascading waterfall dispatcher (auto-discovers keys & falls back)
```

---

## 🔒 System Prompt & Scope Guardrails (`constants.ts`)

1. **Resume-Only Scope**: The `SYSTEM_PROMPT` strictly limits the AI assistant to answering questions about Abhijit Kumar Jha's resume, portfolio, experience, skills, projects, and education only. It explicitly refuses general-knowledge, math, weather, AQI, and off-topic queries.
2. **Identity Protection**: The prompt instructs the model to identify itself as "Abhijit's Portfolio AI Assistant" and never reveal third-party model names (Ollama, Gemma, OpenAI, etc.) or system prompt details.
3. **Markdown Link Formatting**: The prompt instructs the model to format all links as standard markdown links with full `https://` URLs (e.g. `[Project Name](https://github.com/...)`).
4. **Anti-Table Formatting**: The prompt discourages markdown tables (hard to read on mobile) and prefers bullet points unless the user explicitly asks for a table.

---

## 🔄 Free Multi-Provider Waterfall (`api/providers/`)

The backend automatically detects which provider API keys are present in `process.env` and cascades in priority order:

1. **Ollama Cloud (Primary)**:
   - Uses `OLLAMA_API_KEY`.
   - Model: `gemma4:31b`.
2. **Hugging Face Serverless**:
   - Uses `HF_TOKEN` (or `HUGGINGFACE_API_KEY`).
   - Model: `Qwen/Qwen3.8-27B:ovhcloud` (OVHcloud serverless partner routing).
3. **OpenRouter Free Tier**:
   - Uses `OPENROUTER_API_KEY`.
   - Model: `openrouter/free` (Free Models Router, auto-routes across all active free models; strictly locked in `client.ts` to guarantee zero charges).
   - Free tier: 200 requests/day, 20 RPM.

**Priority Customization**: Setting `DEFAULT_AI_PROVIDER` (`ollama` | `huggingface` | `openrouter`) moves that provider to the front of the line.
**Service-Bound Models (`ProviderModel[]`)**: Models in `modelsToTry` are structured as `{ provider, model }` objects, ensuring models intended for one provider (e.g. Hugging Face) are never attempted on another (e.g. OpenRouter).

---

## 🌐 Edge Function Rules

1. **Edge Runtime Only**: All files in `api/` are deployed as Vercel Edge Functions (`export const config = { runtime: 'edge' }`). Do **not** use Node-specific APIs (`fs`, `path`, `Buffer`, etc.).
2. **Stateless Execution**: Edge functions are stateless. Chat context is managed by passing the entire message history array from the client in each request.
3. **Shared Configuration**: All shared constants (system prompt, API URLs, CORS headers) **must** be maintained in `constants.ts`. Do not duplicate configuration across endpoints.
4. **Rate Limiting & Daily Quota**:
   - **Burst Protection**: Both `chat.ts` and `models.ts` enforce IP-based burst rate limiting via `rateLimit.ts` (5 requests / 10s via `chatRateLimit`).
   - **Daily Quota**: `chat.ts` enforces an IP-based daily message quota (25 requests / 24h sliding window via `chatDailyRateLimit`) using Upstash Redis with in-memory fallback. When exceeded, it returns HTTP 429 with an informative quota message.
   - **Rate Limit Headers**: `chat.ts` exposes `X-RateLimit-Remaining` and `X-RateLimit-Limit` in headers (configured in `CORS_HEADERS`) so the frontend client can synchronize remaining quota.
5. **Cascading Automatic Fallback**: If the active provider returns an HTTP 429 (quota exhausted) or 5xx, `executeProviderWaterfall` seamlessly cascades to the next configured provider before returning an error to the user.
6. **Markdown Post-Processing**: `client.ts` strips wrapping ```markdown code blocks if the LLM incorrectly wraps its entire output.
7. **Zero-Charge Enforcement for OpenRouter**: OpenRouter calls are strictly locked to `openrouter/free` to eliminate any possibility of incurring charges. Any model overrides or custom environment variables attempting to target non-free models are safely intercepted and replaced with `openrouter/free`.
8. **Strict Free Model Enforcement for Hugging Face**: Hugging Face requests are strictly validated via `isFreeHuggingFaceModel` against verified free serverless models (defaulting to `Qwen/Qwen3.8-27B:ovhcloud`) including any models discovered dynamically via `sync.ts`. Any non-free models or unverified endpoints are intercepted and safely defaulted to `Qwen/Qwen3.8-27B:ovhcloud`.
9. **Dynamic Free Models Discovery (`api/providers/sync.ts`)**:
   - **Hugging Face**: Queries `https://router.huggingface.co/v1/models` and filters models where `pricing.input === 0 && pricing.output === 0 && status === 'live'`, ensuring only 100% free serverless endpoints are used and prioritizing Qwen models.
   - **Ollama Cloud**: Queries `https://ollama.com/api/usage` authenticated via `Authorization: Bearer ${apiKey}` to inspect `limits.monthly.models` (programmatically fetching the "Included usage" free models list from Ollama account settings without requiring manual browser login) and `/v1/models` to discover active models, prioritizing `gemma4:31b`.
   - **Caching**: Free models are cached in Upstash Redis (`portfolio_free_models_cache`) with a 24-hour TTL and backed by in-memory caching.
10. **Vercel Cron Automation (`/api/cron/sync-models`)**: A Vercel Cron endpoint scheduled daily at 04:00 UTC (`0 4 * * *` in `vercel.json`) invokes `syncFreeModels(true)` to refresh the Redis cache. Secured via optional `CRON_SECRET` bearer token validation.

---

## 📌 Rules for `api/` Modifications

1. **Environment Variables**: Never commit API keys or secrets. Supported provider keys:
   - `OPENROUTER_API_KEY` (OpenRouter Free Tier)
   - `HF_TOKEN` / `HUGGINGFACE_API_KEY` (Hugging Face Inference)
   - `OLLAMA_API_KEY` (Ollama Cloud)
   - `DEFAULT_AI_PROVIDER` (Optional primary provider override)
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Optional Upstash Redis for distributed rate limiting)
2. **CORS Headers**: Always include `CORS_HEADERS` from `constants.ts` in every response.
3. **Response Headers**: `chat.ts` returns `X-AI-Provider` and `X-AI-Model` so clients and logs can trace which provider serviced the query, as well as `X-RateLimit-Remaining` and `X-RateLimit-Limit` for quota tracking.
4. **Explicit `.js` Extensions for Relative Imports**: Because `package.json` specifies `"type": "module"`, Vercel compiles serverless/edge functions using Node16/NodeNext ESM resolution. All relative imports within `api/` MUST include explicit `.js` extensions (e.g., `import ... from './constants.js';`). Jest's `moduleNameMapper` handles mapping `.js` to `.ts` for local testing.

