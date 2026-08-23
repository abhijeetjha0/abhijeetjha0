# 🛠️ Project Setup & Local Development Guide

[![Deploy Status](https://github.com/abhijeetjha0/abhijeetjha0/actions/workflows/deploy.yml/badge.svg)](https://github.com/abhijeetjha0/abhijeetjha0/actions/workflows/deploy.yml)
[![Code Coverage](https://abhijeetjha0.github.io/abhijeetjha0/coverage/badge.svg)](https://abhijeetjha0.github.io/abhijeetjha0/coverage/)

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
# - Set OLLAMA_API_KEY for Ollama Cloud models
# - (Optional) Set KV_REST_API_URL and KV_REST_API_TOKEN for Upstash Redis rate limiting locally

# 5. Start local development server
npm run dev
```

> **Note**: Local frontend development relies exclusively on `npm run dev`. The frontend communicates with the deployed Vercel Edge API backend configured via `VITE_AI_BACKEND_URL`.

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
> - Backend Edge functions (`/api/chat.ts` and `/api/models.ts`) are deployed via **Vercel**.
> - Rate Limiting uses **Vercel KV (Upstash Redis)**. To activate in production, create a KV database under the **Storage** tab in your Vercel Dashboard and link it to the project.
> - Verify active rate limit keys in the Vercel Storage **REPL** tab using `KEYS *`.
> - Edge performance timing logs are available in the Vercel Dashboard under **Logs**.
