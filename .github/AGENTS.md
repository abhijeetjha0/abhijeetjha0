# .github/AGENTS.md

This document guides AI Coding Assistants working within the `.github/` directory, covering CI/CD deployment workflows and repository assets.

---

## 🚀 CI/CD Pipeline & GitHub Actions Agent

### Deployment Workflow (`.github/workflows/deploy.yml`)

- **Trigger**: Pushes to `main` branch.
- **Permissions**:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- **Execution Lifecycle**:
  1. **Checkout Code**: `actions/checkout@v4`
  2. **Environment Setup**: Node.js `24.x` via `actions/setup-node@v4` using `.nvmrc`.
  3. **Dependency Installation**: `npm ci`
  4. **Automated Testing**: `npm test` (Generates coverage report)
  5. **Badge Generation**: Executes `bash scripts/generate-coverage-badge.sh`
  6. **Production Build**: `npm run build` (`tsc -b && vite build`)
  7. **Coverage Artifact Bundling**: Copies `coverage/lcov-report` to `dist/coverage`.
  8. **Deployment**: Uploads pages artifact (`actions/upload-pages-artifact@v3`) and deploys to GitHub Pages (`actions/deploy-pages@v4`).

---

## 🎨 Asset Conventions & Badges (`.github/assets/`)

To eliminate third-party badge outages, custom SVG badges are stored in `.github/assets/`:
- `portfolio-badge.svg`: Custom portfolio badge graphic (`#E85C3B`).
- `linkedin-badge.svg`: Custom LinkedIn badge graphic (`#0A66C2`).
- `email-badge.svg`: Custom Email badge graphic (`#10B981`).
- `typing-header.svg`: Dynamic SVG typing header animation.

---

## 📌 Rules for `.github` Modifications

1. **Native GitHub Tools**: Prefer GitHub built-in Actions and features for status badges and deployment flows.
2. **Badge Styling**: Preserve standard `flat` badge styles (`?style=flat`) with `logoColor=black` for external Shields.io badges.
3. **Workflow Integrity**: Ensure every CI run executes `npm test`, badge generation, and `npm run build` sequentially.
