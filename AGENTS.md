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
├── stylelint.config.js      # Stylelint SCSS rules
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
| `npm run dev` | Dev Server | Launches Vite local development server. |
| `npm run build` | Production Build | Executes TypeScript type check (`tsc -b`) and Vite production bundle build. |
| `npm run test` | Unit Tests | Executes Jest unit tests and generates coverage metrics. |
| `npm run lint` | Code Quality | Runs ESLint across TypeScript/JavaScript files. |
---

## 📌 Master Rules for AI Agents

1. **Verification Requirement**: Never declare a task resolved without running `npm test`, `npm run build`, and `npm run lint`.
2. **No Placeholders**: Maintain exact production URLs and valid Simple Icons logo parameters across all documentation files.
3. **Keep AGENTS.md Up to Date**: Update relevant modular `AGENTS.md` files whenever tooling, configuration, or directory architecture changes.

> **Note**: Subdirectory-specific guidelines (React component interfaces, constant declarations, i18n parity, shell script standards, and Jest testing patterns) are maintained directly within their respective modular `AGENTS.md` files:
> - [.github/AGENTS.md](file:///.github/AGENTS.md)
> - [scripts/AGENTS.md](file:///scripts/AGENTS.md)
> - [src/AGENTS.md](file:///src/AGENTS.md)
> - [src/components/AGENTS.md](file:///src/components/AGENTS.md)
> - [src/translations/AGENTS.md](file:///src/translations/AGENTS.md)
> - [tests/AGENTS.md](file:///tests/AGENTS.md)