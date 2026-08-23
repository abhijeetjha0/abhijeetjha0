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
# Edit .env.local and add your OLLAMA_API_KEY

# 5. Start full-stack local development server (Frontend + API Backend)
npx vercel dev
```

> **Note**: If you only want to test the React frontend without the AI backend, you can still use `npm run dev`.

The application will be accessible at `http://localhost:5173/`.

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
# Compile TypeScript and build Vite production bundle
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

> **Note on Backend API Deployment**: The GitHub Actions pipeline deploys the frontend to GitHub Pages. To deploy the `/api/chat.ts` AI backend, you must link this repository to a **Vercel Project** and set the `OLLAMA_API_KEY` in your Vercel project settings. Vercel automatically deploys the backend serverless functions.
