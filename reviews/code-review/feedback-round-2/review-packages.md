## Package audit: Asset 360 Investigation Workspace (Hanwha) — round 2

Unchanged from round 1 in substance — same packages flagged, same severities. `npm outdated
--json` and `npm audit --json` re-run fresh for this round rather than diffed.

### Dependencies (production, `dependencies` in `package.json`)

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.10.0 | No | 0 | Pass (0.x versioning; treated as a minor bump) |
| `@cognite/aura` | ^0.3.5 | — (not flagged by `npm outdated`, current) | No | 0 | Pass |
| `@cognite/reveal` | 4.36.0 (pinned via `overrides`) | — (not flagged) | No | 0 | Pass — pinned to match `@cognite/reveal-widget`'s actual dependency, not a stale peer range |
| `@cognite/reveal-widget` | ^0.2.0 | — (not flagged) | No | 0 | Pass |
| `@cognite/sdk` | ^10.10.0 | — (not flagged) | No | 0 | Pass |
| `@tabler/icons-react` | ^3.35.0 | — (not flagged) | No | 0 | Pass |
| `@tanstack/react-query` | ^5.90.10 | — (not flagged) | No | 0 | Pass |
| `@tanstack/react-table` | 8.21.3 | 9.2.4 | No | 0 | Warn — 1 major behind |
| `@tanstack/react-virtual` | ^3.14.13 | — (not flagged) | No | 0 | Pass |
| `react` | 18.3.1 | 19.3.0 | No | 0 | Warn — 1 major behind |
| `react-dom` | 18.3.1 | 19.3.0 | No | 0 | Warn — 1 major behind |
| `react-pdf` | 9.2.1 | 11.0.0 | No | 0 | Fail — 2 majors behind, but vendored/pinned via `integrate-file-viewer` (deep import path documented as version-specific; upgrading requires re-verifying that path) |
| `recharts` | ^3.10.1 | — (not flagged) | No | 0 | Pass |

### Dev dependencies (selected, ≥ 1 major behind)

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `eslint` | 9.39.4 | 10.11.0 | No | 0 | Warn (dev-only) |
| `typescript` | 5.9.3 | 7.0.2 | No | 0 | Warn (dev-only) |
| `vite` | 7.3.6 | 8.3.0 | No | 0 | Warn (dev-only) |
| `vitest` | 4.1.10 | 5.0.1 | No | 4 moderate | Warn (dev-only, see below) |
| `@vitest/coverage-v8` | 4.1.10 | 5.0.1 | No | moderate (shared advisory) | Warn (dev-only) |
| `@vitest/ui` | 4.1.10 | 5.0.1 | No | moderate (shared advisory) | Warn (dev-only) |
| `@types/react`, `@types/react-dom` | 18.3.x | 19.3.0 | No | 0 | Warn (dev-only, tracks `react`/`react-dom`) |
| `@vitejs/plugin-react`, `@eslint/js`, `@testing-library/jest-dom` | — | 1 major behind each | No | 0 | Warn (dev-only) |

Not spot-checked with `npm view <pkg> deprecated` beyond `react-pdf` (already flagged, no
deprecation signal found) — none of the other flagged packages are unfamiliar names or in the
audit output, so no further spot-check was warranted per the skill's own bar.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 0 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| `@vitest/mocker` (via `vitest`, `@vitest/coverage-v8`, `@vitest/ui`) | Moderate | Vitest: Path Traversal / Arbitrary File Read via `@vitest/mocker` Redirect Mock | A `vitest`/`@vitest/*` bump to a patched line | GHSA (Vitest dev-server path traversal) |

Dev-only (test tooling, never shipped to users) — not a Must Fix per the skill's bar (high/critical
only). Noted for awareness; a future `vitest` major bump would clear it, but that bump itself would
then need re-vetting against the 1 major-behind flag above.
