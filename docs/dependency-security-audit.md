# Dependency security audit — 2026-11-09

Baseline: main at `4e0c248`. Validation used Node 24.19.0 and npm 11.9.0.
The editor was tested against core 0.0.55 from core commit `d7e5590`.

## Audit results

| Tree | Before | After |
| --- | --- | --- |
| Full dependency tree | 8: 6 moderate, 2 low | 0 |
| Production (`--omit=dev`) | 2 low | 0 |

`minimatch` caused the moderate entries through typescript-eslint. The current
typescript-eslint release still requests minimatch 10, so a bounded override
updates only `minimatch@>=7.0.0 <11.0.1` to `^11.0.5`. Older minimatch APIs used
by unrelated dependencies remain untouched.

The low entries came from `@svgr/plugin-svgo` and its `deepmerge` dependency.
There is no patched deepmerge release or updated SVGR optimizer plugin. Removed
that wrapper and use the supported SVGR plugin interface to call SVGO directly.
Neither deepmerge nor the wrapper remains in the editor lockfile.

## Dependency and API changes

| Dependency | Previous declaration | Updated declaration |
| --- | --- | --- |
| Vite | 7.2.7 | 8.3.6, including the root Vitest project |
| @vitejs/plugin-react | 5.1.1 | 6.3.0 |
| SVG optimizer | SVGO 3 through @svgr/plugin-svgo | direct SVGO 4.1.0 |
| React / React DOM | 19.2.3 | 19.3.1 |
| TipTap packages | 3.10.2 | 3.33.0 |
| typescript-eslint | 8.49.0 | 8.72.1 |
| Sass | 1.96.0 | 1.108.1 |
| PostCSS | 8.5.6 | 8.5.32 |
| @types/node | 26.5.1 | 26.6.6 |
| activeBook-core | 0.0.54 | 0.0.55 |

Other compatible updates include ESLint 9.39.5, @eslint/compat 2.1.1,
@eslint/eslintrc 3.3.7, React types 19.3.0, react-colorful 5.8.1,
eslint-plugin-react-hooks 7.1.1, lint-staged 16.4.0, Playwright 1.65.0,
stylelint-order 7.0.1 and stylelint-scss 6.14.0.

Vite 8 uses Rolldown/Oxc. The book builder now uses `build.rolldownOptions` and
preserves its output layout and font filenames. The root explicitly declares
Vite so Vitest and the workspaces resolve one Vite 8 installation.

The shared SVG optimizer retains the viewBox, prefixes IDs and their references
using the source filename, and explicitly enables `removeTitle` to preserve the
previous SVGO 3 preset behavior. Two regression tests exercise the resulting JSX
and the option to disable optimization. Both production build configurations use
the same plugin.

Added explicit dependencies that previously relied on hoisting: Sass and
@tiptap/core in the root test project, @tiptap/extension-document in the editor,
and @svgr/core for the book builder's plugin API. Removed the redundant direct
stylelint-config-standard dependency; the SCSS config still includes it.
The Node engine range reflects jsdom 30's supported runtimes.

TypeScript remains on 5.9, matching typescript-eslint's supported compiler range.
ESLint remains on its compatible 9.x line because current import/react plugins
do not declare support for ESLint 10; npm still marks ESLint 9 deprecated. No
peer requirements were bypassed and no linter rules were weakened.

## Validation

The baseline had two ESLint formatting errors and one failing browser test
(`custom-badge` did not appear); the other 82 tests, typecheck, Stylelint and
editor production build passed. The updated full suite passes that same browser
test. Only the two destructuring layouts were adjusted to fix the existing lint
errors; their behavior was not changed.

- `npm ci --no-audit --no-fund`: clean installation passed.
- `npm run typecheck`: all workspaces and test fixtures passed.
- `npx --no-install eslint './{apps,packages}/**/*.{ts,tsx}'`: no errors,
  36 existing warnings.
- `npx --no-install stylelint '{apps,packages}/**/*.scss'`: passed.
- `npm run test:coverage -- --coverage.reportsDirectory=/tmp/dependency-security-audit/editor/coverage`:
  26 files and 85 tests passed after clean installation, including Chromium tests
  and the reviewed screenshot. LCOV and HTML reports were generated; no tests
  were skipped.
- `npm run build:editor`: production build passed.
- `npm run test:runtime`: the production book built and passed the Chromium
  integration scenario with the installed core, custom TGZ, media and persistence.
- `npm run build -w @active-book/book-builder -- ../../tests/fixtures/multipage-book`:
  production book build passed. This uses the repository fixture instead of the
  root build:book script's external `../../../books_editor/new` directory.
- `npm ls --all`: passed, with no missing or invalid dependencies.
- `npm audit --json` and `npm audit --omit=dev --json`: zero vulnerabilities.

Browser commands used `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
Existing warnings about large production chunks and the optional migration from
vite-tsconfig-paths to Vite's native path resolver remain. The browser suite also
logs asset-not-found errors for fixture media while passing all assertions; the
production runtime scenario verifies the complete media fixture.

## Sources

- [Minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [Deepmerge advisory: no patched version](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [Vite 8 migration guide](https://vite.dev/guide/migration)
- [React plugin documentation](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)
- [SVGO 3 to 4 migration guide](https://svgo.dev/docs/migrations/migration-from-v3-to-v4/)
- [SVGR plugin API](https://react-svgr.com/docs/node-api/)
