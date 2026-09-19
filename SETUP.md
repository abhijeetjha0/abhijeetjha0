# 🛠️ Project Setup & Local Development Guide

[![Deploy Status](https://github.com/abhijeetjha0/abhijeetjha0/actions/workflows/deploy.yml/badge.svg)](https://github.com/abhijeetjha0/abhijeetjha0/actions/workflows/deploy.yml)
[![Code Coverage](https://abhijeetjha0.github.io/abhijeetjha0/coverage/badge.svg)](https://abhijeetjha0.github.io/abhijeetjha0/coverage/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Instructions for setting up, running, testing, and building the React portfolio application locally.

---

## 📋 Prerequisites

- **Node.js**: `^24.12.0` (managed via `.nvmrc`)
- **npm**: Comes with Node.js

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/abhijeetjha0/abhijeetjha0.git
cd abhijeetjha0

# 2. Use recommended Node version (if using nvm)
nvm use

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local:
# - (Optional) Set OLLAMA_API_KEY for Ollama Cloud (Primary)
# - (Optional) Set HF_TOKEN for free Hugging Face serverless inference
# - (Optional) Set OPENROUTER_API_KEY for free OpenRouter models (openrouter/free)
# - (Optional) Set DEFAULT_AI_PROVIDER to force a primary provider (ollama | huggingface | openrouter)
# - (Optional) Set KV_REST_API_URL and KV_REST_API_TOKEN for Upstash Redis rate limiting and free models cache
# - (Optional) Set CRON_SECRET to secure the Vercel Cron cache synchronization endpoint (/api/cron/sync-models)


# 5. Start local development server
npm run dev
```

> **Note on AI Chat Backend**: 
> - **Default Flow**: By default, `VITE_AI_BACKEND_URL` points to your deployed Vercel Edge API backend (`https://abhijeetjha0.vercel.app/api/chat`).
> - **Local Edge Testing**: To test backend changes locally without deploying, set `VITE_AI_BACKEND_URL=http://localhost:3000/api/chat` in `.env.local` and start the local Edge runtime in a separate terminal with `npx vercel dev`.
> - **Tracing Providers**: Every chat response returns `X-AI-Provider` and `X-AI-Model` headers, allowing you to see which free provider serviced the request via Chrome DevTools Network tab.

---

## 🤖 AI Provider Configuration (100% Free Tiers)

The backend features an automated **Cascading Fallback Waterfall** across multiple free AI providers (zero credit card, zero subscriptions):

| Provider | Free Quota | Setup & Key Link | Default Model |
| :--- | :--- | :--- | :--- |
| **Ollama Cloud (Primary)** | Free tier | [Ollama Cloud](https://ollama.com) (`OLLAMA_API_KEY`) | `gemma4:31b` |
| **Hugging Face Serverless** | Generous | [Hugging Face Tokens](https://huggingface.co/settings/tokens) (`HF_TOKEN`) | `Qwen/Qwen3.8-27B:ovhcloud` |
| **OpenRouter Free Tier** | 200 req/day | [OpenRouter Keys](https://openrouter.ai/settings/keys) (`OPENROUTER_API_KEY`) | `openrouter/free` (Auto-routed) |

> **Zero-Cost Safeguard**: OpenRouter is strictly locked to `openrouter/free`, and Hugging Face is strictly validated against verified free serverless models (defaulting to `Qwen/Qwen3.8-27B:ovhcloud` with OVHcloud partner routing) across the backend to ensure zero commercial charges. Models are service-bound (`{ provider, model }`) to guarantee that free models from one service are never executed on another. To add an extra account-level safety net, you can set the **Credit Limit** of your OpenRouter API key to `$0.00` in the [OpenRouter Keys Dashboard](https://openrouter.ai/settings/keys).

If a provider reaches its daily rate limit (HTTP 429) or is temporarily unavailable, the engine automatically cascades to the next configured provider in the waterfall.


---

## 🧪 Testing & Code Coverage

```bash
# Run unit test suite (automatically collects & prints coverage)
npm test

# Run tests matching a specific pattern (e.g. Experience component)
npm run test-filter -- Experience

# Run tests in watch mode for TDD development
npm run test-watch
```

---

## 📦 Production Build & Preview

```bash
# Compile TypeScript and build Vite production bundle (with automated vendor chunking)
npm run build

# Preview production build locally
npm run preview
```

---

## 🔄 CI/CD & Deployment Pipeline

Automated via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. **Dependency Installation**: `npm ci`
2. **Mandatory Test Execution**: `npm test` runs the unit test suite and generates HTML coverage report in `coverage/lcov-report`. Build fails immediately if any test fails.
3. **Dynamic Badge Generation**: `bash scripts/generate-coverage-badge.sh` generates `badge.json` & `badge.svg`.
4. **Application Build**: `npm run build` compiles Vite bundle to `dist`.
5. **Deployment**: Deploys `dist` to GitHub Pages (`https://abhijeetjha0.github.io/abhijeetjha0/`).

> **Note on Backend API & Rate Limiting Deployment**:
> - Frontend is automatically deployed to GitHub Pages via GitHub Actions.
> - Backend Edge functions (`/api/chat.ts`, `/api/models.ts`, and `/api/cron/sync-models.ts`) are deployed via **Vercel**.
> - Rate Limiting & Dynamic Model Caching uses **Vercel KV (Upstash Redis)**. To activate in production, create a KV database under the **Storage** tab in your Vercel Dashboard and link it to the project.
> - **Daily Free Model Sync Cron**: Configured in `vercel.json` (`0 4 * * *`) to automatically trigger `/api/cron/sync-models` once every 24 hours, discovering included Ollama Cloud models and free Hugging Face models and updating the Upstash Redis cache.
> - Verify active rate limit and model cache keys in the Vercel Storage **REPL** tab using `KEYS *`.
> - Edge performance timing logs are available in the Vercel Dashboard under **Logs**.
