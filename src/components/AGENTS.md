# src/components/AGENTS.md

This document specifies rules and standards for AI Coding Assistants creating or modifying React components in `src/components/`.

---

## 🧩 Component Guidelines

1. **Separation of Concerns**:
   - Component logic must remain focused on UI presentation.
   - Move category configurations, navigation lists, and external links to `src/constants/index.ts`.
   - Move data contracts and interfaces to `src/@types/index.ts`.

2. **Performance & Render Optimization**:
   - Pre-compute or memoize inline style objects (`useMemo`) instead of instantiating new objects inside `.map()` loops.
   - Avoid using array indices (`index`, `sIndex`) as React keys. Always use stable, data-driven keys derived from content.

3. **Mandatory Unit Tests**:
   - Whenever creating or modifying a component in `src/components/`, create or update a corresponding test file in `tests/unit/Component.test.tsx`.
   - Ensure the test suite passes cleanly with `@testing-library/react`.

4. **Styling & Framework Constraints**:
   - The project uses **Bootstrap 5**. Utility classes like `gap-*`, `me-*`, `ms-*`, and `flex-shrink-0` are fully supported.
   - Strictly avoid inline `style={{ ... }}` objects in JSX for dynamic parameters when possible. Use SCSS variables (e.g. `var(--accent-color)`) and classes for dynamic thematic properties.

5. **ReactMarkdown Custom Components** (`AiChatPanel.tsx`):
   - All markdown links must open in a new tab using a custom `a` component: `target="_blank"`, `rel="noopener noreferrer"`.
   - URLs without `http://` or `https://` protocols are auto-prefixed with `https://` to prevent relative path resolution.
   - Tables are wrapped in `.table-responsive` divs for horizontal scroll on narrow screens.

6. **AiChatPanel Rate Limiting UI**:
   - A continuous quota badge in the header always shows remaining queries.
   - A limitation notice banner is always visible below the header.
   - A character counter (`X/200`) displays in the input area.
   - The send button shows a cooldown countdown (`Xs`) and disables during active cooldown.
   - When quota is exhausted, the input area is replaced with a contact card (Email & LinkedIn).

