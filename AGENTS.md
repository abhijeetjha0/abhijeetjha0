# AGENTS.md

This document serves as an architectural guide for AI Coding Assistants (e.g., Google Antigravity, Claude Code, Google Jules, Gemini) and human contributors working within the `abhijeetjha0` repository. It documents available automated tools, scripts, CI/CD agents, input/output conventions, and execution rules.

---

## 🤖 Repository & Agent Overview

This project is a high-performance React 19 + TypeScript portfolio application deployed via GitHub Actions to GitHub Pages.

```
.
├── .github/
│   ├── assets/              # Custom SVG assets and static badges
│   └── workflows/
│       └── deploy.yml       # GitHub Actions CI/CD deployment agent workflow
├── .gitignore               # Git ignore pattern rules
├── .nvmrc                   # Target Node.js engine version declaration
├── coverage/                # Generated Jest test coverage reports & badges
├── dist/                    # Compiled Vite production bundle output
├── node_modules/            # Installed npm packages and dependencies
├── public/                  # Static assets (favicons, manifest, etc.)
├── scripts/
│   └── generate-coverage-badge.sh # Dynamic SVG & JSON coverage badge generator script
├── src/
│   ├── components/          # Core React components (Skills, Experience, Hero, etc.)
│   ├── routes/              # Application route definitions
│   ├── styles/              # Global and modular SCSS stylesheets
│   ├── translations/        # i18n localization definitions (en-US.json)
│   ├── utilities/           # Shared utility functions and logger
│   ├── Layout.tsx           # Main application layout wrapper
│   ├── main.tsx             # React DOM entry point
│   └── i18n.ts              # i18next configuration & initialization
├── tests/                   # Jest unit testing suite
├── eslint.config.js         # ESLint 9 flat configuration rules
├── index.html               # Single Page Application HTML entry point
├── jest.config.ts           # Jest test runner configuration & DOM environment settings
├── package.json             # NPM dependencies, scripts registry, and engine boundaries
├── package-lock.json        # Locked dependency tree manifest
├── setupTests.ts            # Testing environment initialization & Jest DOM setup
├── stylelint.config.js      # Stylelint SCSS style linting configuration
├── tsconfig.json            # Main TypeScript compiler configuration
├── tsconfig.app.json        # Client application TypeScript settings
├── tsconfig.node.json       # Node environment TypeScript compiler settings
├── vite.config.ts           # Vite bundler, React compiler, & build configuration
├── AGENTS.md                # Agent instruction & tooling registry
├── README.md                # Developer documentation & GitHub profile presentation
└── SETUP.md                 # Local development & setup instructions
```

---

## 🛠️ Automated Tools & Scripts

### 1. Dynamic Coverage Badge Generator (`scripts/generate-coverage-badge.sh`)

- **Purpose**: Parses Jest test coverage results and generates dynamic SVG and JSON status badges for integration into documentation and reporting.
- **Trigger**: Run automatically during `npm test` / CI workflow execution after Jest generates coverage metrics.
- **Input**:
  - `coverage/coverage-summary.json` (Required file produced by `jest --coverage`).
- **Logic**:
  - Reads line coverage percentage (`pct`).
  - Evaluates color thresholds:
    - `>= 90%` → `brightgreen` (`#4c1`)
    - `80% - 89%` → `green` (`#97ca00`)
    - `60% - 79%` → `yellow` (`#dfb317`)
    - `< 60%` → `red` (`#e05d44`)
- **Output Files**:
  - `coverage/lcov-report/badge.json`: Endpoint JSON object compatible with Shields.io endpoint schema:
    ```json
    {
      "schemaVersion": 1,
      "label": "coverage",
      "message": "99%",
      "color": "brightgreen"
    }
    ```
  - `coverage/lcov-report/badge.svg`: Custom standalone SVG badge graphic (114x20px).
- **Execution Command**:
  ```bash
  bash scripts/generate-coverage-badge.sh
  ```

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

## 🎨 Asset Conventions & Badges

### Custom Repository SVG Badges (`.github/assets/`)

To eliminate external third-party dependencies, custom badge SVGs are maintained in `.github/assets/`:
- `portfolio-badge.svg`: Portfolio link badge (`#E85C3B`).
- `linkedin-badge.svg`: LinkedIn link badge (`#0A66C2`).
- `email-badge.svg`: Email link badge (`#10B981`).
- `typing-header.svg`: Dynamic SVG typing text animation.

### Badge Styling Guidelines in `README.md`
- **Style**: Standard `flat` style (`?style=flat`) to preserve exact title casing.
- **Logo Parameter**: `logoColor=black` combined with soft pastel background colors for optimal contrast and readability.

---

## 📋 Developer & Agent Commands Registry

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | Dev Server | Launches Vite local development server. |
| `npm run build` | Production Build | Executes TypeScript type check (`tsc -b`) and Vite production bundle build. |
| `npm run test` | Unit Tests | Executes Jest unit tests and generates coverage metrics. |
| `npm run test-watch` | Test Watcher | Runs Jest in interactive watch mode. |
| `npm run lint` | Code Quality | Runs ESLint across TypeScript/JavaScript files. |
| `npm run lint-fix` | Auto-Fix Lints | Auto-corrects fixable ESLint errors. |
| `npm run lint-style` | CSS Linting | Runs Stylelint across `.scss` stylesheets. |
| `npm run lint-style-fix` | Auto-Fix Styles | Auto-corrects fixable Stylelint errors. |

---

## 📌 Rules for AI Agents

1. **Verification Requirement**: Never declare a task resolved without running `npm test` and ensuring zero build or lint regressions.
2. **i18n Localization Integrity**: Whenever adding or updating skills, ensure both `README.md` and `src/translations/en-US.json` are synchronized with matching category structures.
3. **Casing & Style Enforcement**: Always maintain exact title casing (e.g. `TypeScript`, `Ember.js`, `Stylelint`) when editing documentation or badges.
4. **No Placeholders**: Maintain exact production URLs and valid Simple Icons logo parameters across all markdown files.
4. **Prefer Native Github tools in README**: When adding badges, logo etc, prefer Github's built ins. They are more reliable and maintained.
