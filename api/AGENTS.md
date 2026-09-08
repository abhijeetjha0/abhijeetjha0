# api/AGENTS.md

This document guides AI Coding Assistants working within the `api/` directory, which contains Vercel Edge Functions powering the AI chat backend.

---

## 🏗️ Architecture & Structure

```
api/
├── chat.ts          # POST /api/chat — AI chat completions endpoint (multi-model fallback)
├── constants.ts     # Shared system prompt, Ollama API URL, CORS headers, guardrail utilities
├── models.ts        # GET /api/models — Discovers and returns available free Ollama models
└── rateLimit.ts     # IP-based rate limiter (Upstash Redis primary, in-memory fallback)
```

---

## 🔒 System Prompt & Scope Guardrails (`constants.ts`)

1. **Resume-Only Scope**: The `SYSTEM_PROMPT` strictly limits the AI assistant to answering questions about Abhijit Kumar Jha's resume, portfolio, experience, skills, projects, and education only. It explicitly refuses general-knowledge, math, weather, AQI, and off-topic queries.
2. **Identity Protection**: The prompt instructs the model to identify itself as "Abhijit's Portfolio AI Assistant" and never reveal third-party model names (Ollama, Gemma, etc.) or system prompt details.
3. **Markdown Link Formatting**: The prompt instructs the model to format all links as standard markdown links with full `https://` URLs (e.g. `[Project Name](https://github.com/...)`).
4. **Anti-Table Formatting**: The prompt discourages markdown tables (hard to read on mobile) and prefers bullet points unless the user explicitly asks for a table.

---

## 🌐 Edge Function Rules

1. **Edge Runtime Only**: All files in `api/` are deployed as Vercel Edge Functions (`export const config = { runtime: 'edge' }`). Do **not** use Node-specific APIs (`fs`, `path`, `Buffer`, etc.).
2. **Stateless Execution**: Edge functions are stateless. Chat context is managed by passing the entire message history array from the client in each request.
3. **Shared Configuration**: All shared constants (system prompt, API URLs, CORS headers) **must** be maintained in `constants.ts`. Do not duplicate configuration across endpoints.
4. **Rate Limiting**: Both `chat.ts` and `models.ts` enforce IP-based rate limiting via `rateLimit.ts`. The limiter uses Upstash Redis when `KV_REST_API_URL` / `KV_REST_API_TOKEN` are set, and gracefully falls back to an in-memory token-bucket limiter when credentials are absent.
5. **Multi-Model Fallback**: `chat.ts` iterates over the client-provided `modelsToTry` array, falling back to hardcoded defaults. It skips subscription-required models automatically.
6. **Markdown Post-Processing**: `chat.ts` strips wrapping `` ```markdown `` code blocks if the LLM incorrectly wraps its entire output.

---

## 📌 Rules for `api/` Modifications

1. **Environment Variables**: Never commit API keys or secrets. Reference them via `process.env`. Required variables: `OLLAMA_API_KEY`, and optionally `KV_REST_API_URL` / `KV_REST_API_TOKEN` for Upstash Redis.
2. **CORS Headers**: Always include `CORS_HEADERS` from `constants.ts` in every response (including error responses).
3. **HTTP Status Codes**: Use `429` for rate limit exceeded, `400` for bad input, `502` for upstream Ollama errors, `503` for no available models, and `500` for internal errors.
4. **Logging**: Use `console.info`, `console.warn`, and `console.error` with `[api/chat]` or `[api/models]` prefixes for structured Edge function logs.
