# scripts/AGENTS.md

This document provides instructions for AI Coding Assistants working with utility and build scripts in the `scripts/` directory.

---

## 🛠️ Automated Scripts Overview

### Dynamic Coverage Badge Generator (`scripts/generate-coverage-badge.sh`)

- **Purpose**: Parses Jest test coverage summary (`coverage/coverage-summary.json`) and generates dynamic SVG & JSON coverage badges.
- **Trigger**: Executed automatically during CI pipeline runs and after test suite execution.
- **Inputs**:
  - `coverage/coverage-summary.json` (produced by `jest --coverage`).
- **Color Threshold Logic**:
  - `>= 90%` → `brightgreen` (`#4c1`)
  - `80% - 89%` → `green` (`#97ca00`)
  - `60% - 79%` → `yellow` (`#dfb317`)
  - `< 60%` → `red` (`#e05d44`)
- **Outputs**:
  - `coverage/lcov-report/badge.json`: Endpoint JSON object for Shields.io compatible schema.
  - `coverage/lcov-report/badge.svg`: Custom standalone SVG badge graphic (114x20px).

---

## 📌 Rules for Script Development

1. **POSIX Compliance**: Ensure shell scripts run cleanly across macOS and Linux POSIX environments without assuming non-standard dependencies.
2. **Fallback Parsing**: Support fallback parsers (e.g. `python3`, `jq`, or `node`) for extracting JSON metrics.
3. **Executable Permissions**: Always ensure scripts are marked executable (`chmod +x`).
