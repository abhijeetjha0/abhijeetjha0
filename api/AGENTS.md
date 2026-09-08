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
└── providers/            # Pluggable 100% Free AI Provider Layer
    ├── types.ts          # Provider interfaces, payload types, and result contracts
    ├── client.ts         # Zero-dependency OpenAI-compatible Edge HTTP caller
    ├── registry.ts       # Registry for GitHub Models, OpenRouter, Hugging Face, and Ollama
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

1. **GitHub Models (Primary)**:
   - Uses `GITHUB_TOKEN` (or `GH_MODELS_TOKEN`).
   - Model: `gpt-4o-mini` (Genuine OpenAI ChatGPT without an OpenAI account!).
   - Free tier: 150 requests/day, 15 RPM.
2. **OpenRouter Free Tier**:
   - Uses `OPENROUTER_API_KEY`.
   - Model: `meta-llama/llama-3.3-70b-instruct:free` (or DeepSeek R1).
   - Free tier: 200 requests/day, 20 RPM.
3. **Hugging Face Serverless**:
   - Uses `HF_TOKEN` (or `HUGGINGFACE_API_KEY`).
   - Model: `Qwen/Qwen2.5-72B-Instruct`.
4. **Ollama Cloud**:
   - Uses `OLLAMA_API_KEY`.
   - Model: `gemma4:31b`.

**Priority Customization**: Setting `DEFAULT_AI_PROVIDER` (`github` | `openrouter` | `huggingface` | `ollama`) moves that provider to the front of the line.

---

## 🌐 Edge Function Rules

1. **Edge Runtime Only**: All files in `api/` are deployed as Vercel Edge Functions (`export const config = { runtime: 'edge' }`). Do **not** use Node-specific APIs (`fs`, `path`, `Buffer`, etc.).
2. **Stateless Execution**: Edge functions are stateless. Chat context is managed by passing the entire message history array from the client in each request.
3. **Shared Configuration**: All shared constants (system prompt, API URLs, CORS headers) **must** be maintained in `constants.ts`. Do not duplicate configuration across endpoints.
4. **Rate Limiting**: Both `chat.ts` and `models.ts` enforce IP-based rate limiting via `rateLimit.ts` (5 requests / 10s).
5. **Cascading Automatic Fallback**: If the active provider returns an HTTP 429 (quota exhausted) or 5xx, `executeProviderWaterfall` seamlessly cascades to the next configured provider before returning an error to the user.
6. **Markdown Post-Processing**: `client.ts` strips wrapping `` ```markdown `` code blocks if the LLM incorrectly wraps its entire output.

---

## 📌 Rules for `api/` Modifications

1. **Environment Variables**: Never commit API keys or secrets. Supported provider keys:
   - `GITHUB_TOKEN` / `GH_MODELS_TOKEN` (GitHub Models — ChatGPT `gpt-4o-mini`)
   - `OPENROUTER_API_KEY` (OpenRouter Free Tier)
   - `HF_TOKEN` / `HUGGINGFACE_API_KEY` (Hugging Face Inference)
   - `OLLAMA_API_KEY` (Ollama Cloud)
   - `DEFAULT_AI_PROVIDER` (Optional primary provider override)
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Optional Upstash Redis for distributed rate limiting)
2. **CORS Headers**: Always include `CORS_HEADERS` from `constants.ts` in every response.
3. **Response Headers**: `chat.ts` returns `X-AI-Provider` and `X-AI-Model` so clients and logs can trace which provider serviced the query.

