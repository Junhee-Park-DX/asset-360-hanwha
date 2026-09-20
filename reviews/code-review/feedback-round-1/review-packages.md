# Package audit: asset-360-hanwha

## Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.10.0 | No | 0 | Pass (1 minor behind, 0.x line) |
| `@cognite/aura` | 0.3.5 | 0.3.5 | No | 0 | Pass |
| `@cognite/reveal` | 4.36.0 (pinned, `overrides`) | 4.36.0 | No | 0 | Pass — pinned deliberately; `@cognite/reveal-widget`'s own declared peer range (`4.35.3`) is stale per the `reveal-3d` skill's own documented note |
| `@cognite/reveal-widget` | 0.2.0 | 0.2.0 | No | 0 | Pass |
| `@cognite/sdk` | ^10.10.0 | current | No | 0 | Pass |
| `@tabler/icons-react` | ^3.35.0 | current | No | 0 | Pass |
| `@tanstack/react-query` | ^5.90.10 | current | No | 0 | Pass |
| `@tanstack/react-table` | 8.21.3 | 9.2.4 | No | 0 | Warn — 1 major behind |
| `@tanstack/react-virtual` | ^3.14.13 | current | No | 0 | Pass |
| `react` | 18.3.1 | 19.3.0 | No | 0 | Warn — 1 major behind |
| `react-dom` | 18.3.1 | 19.3.0 | No | 0 | Warn — 1 major behind |
| `react-pdf` | 9.2.1 | 11.0.0 | No | 0 | Warn — 2 majors behind, but pinned by the vendored `integrate-file-viewer` skill bundle (`src/cognite-file-viewer/`), not independently upgradable without re-vendoring that skill's own tested version |
| `recharts` | ^3.10.1 | current | No | 0 | Pass |

No deprecated packages, no CVEs against any production dependency.

## Security audit

`npm audit --json` — 4 moderate, 0 high, 0 critical, all in dev-only test tooling
(`vitest`/`@vitest/coverage-v8`/`@vitest/ui`/`@vitest/mocker`), none shipped in the production
bundle.

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 0 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| `@vitest/mocker` (via `vitest`, `@vitest/coverage-v8`, `@vitest/ui`) | Moderate | Vitest: Path Traversal / Arbitrary File Read via `@vitest/mocker` Redirect Mock | See GHSA below | GHSA (Vitest dev-server path traversal) |

Dev-only, not a Must Fix per the skill's bar (high/critical only) — noted for awareness; a future
`vitest` bump would clear it.
