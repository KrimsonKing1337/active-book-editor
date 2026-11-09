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
ESLint was subsequently migrated to 10.14.0, as described below. No peer
requirements were bypassed and no linter rules were weakened.

## ESLint 10 migration

ESLint 10.14.0 and @eslint/js 10.0.1 use native flat presets; FlatCompat and the
direct @eslint/eslintrc dependency were removed. typescript-eslint 8.72.1 and
Stylistic 5.10.0 already declare ESLint 10 support.

The maintained eslint-plugin-import-x 4.18.1 replaces eslint-plugin-import,
whose peer range excludes ESLint 10. Import grouping, path groups, internal
aliases and default-export warnings keep their exact settings under the new
import-x namespace. The React and JSX-a11y plugins had no active rules, and the
React Hooks plugin was registered without enabling any rules in this repository;
those unused registrations and dependencies were removed. This removes their
incompatible peer requirements without disabling any checks.

The newline-destructuring plugin accepts ESLint >=7.2 but calls the removed
getSourceCode method. The official @eslint/compat 2.1.1 fixupPluginRules adapts
that API while retaining the exact pair/triple/rest formatting rules. The
standard Stylistic rules were considered but do not enforce the same behavior.

The new recommended preserve-caught-error rule identified an audio error that
discarded its cause; the same error message is retained and its original cause
is now attached. no-useless-assignment identified an initial empty outDir value
that was always overwritten; only that initializer was removed. The cleanup
finally block and response behavior remain the same. No new rules were disabled
and no bulk formatting was run.

Validation after `npm ci --strict-peer-deps --no-audit --no-fund`:

- The same 236 files are linted with zero errors and the same 36 warnings.
- All previously active user rules retain their options and severity. ESLint 10's
  new recommended checks and stricter globalThis check are enabled.
- `node --test config/eslint.test.js`: 13 passing regression cases cover formatting,
  import ordering, destructuring, warnings and the new recommended checks.
- Typecheck, all 85 Vitest tests and `npm ls --all` passed again.
- The production editor build and the Chromium production-book integration
  scenario passed again after the two source corrections.

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
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Import-x compatibility and migration](https://github.com/un-ts/eslint-plugin-import-x)
