# activeBook-editor

Prototype monorepo for the Active Book visual editor and book build pipeline.

## Layout

- `apps/editor` — Vite + React + TipTap editor. The editable TipTap document is rendered inside the real `activeBook-core` `App` and `PageWrapper`.
- `packages/book-builder` — internal Vite-based book builder used both by an npm script and by the editor dev server.
- `example-book/book.json` — minimal serialized TipTap document for CLI builds.

## Local core

The repository expects the core to be available one level above the editor repository:

```text
parent/
├─ activebook-core/
└─ activeBook-editor/
```

The root dependency is intentionally declared as:

```json
"activeBook-core": "file:../activebook-core"
```

The core must have its `lib` output prepared because its package entry points to the compiled output.

## Run

```bash
npm install
npm run dev
```

The editor opens with an editable page inside `PageWrapper`. `Добавить Counter` inserts the real core `Counter` as an atomic TipTap node.

`Собрать книгу` sends the current TipTap JSON to the internal builder. The result is written to `dist-book/`.

## CLI book build

```bash
npm run build:book
```

By default this builds `example-book/book.json`. A custom JSON document can be supplied directly to the workspace script:

```bash
npm run build -w @active-book/book-builder -- ./path/to/book.json
```

## Current prototype boundary

The component registry currently contains `Counter` only. The important part of this prototype is the extension point: more `activeBook-core` components can be registered as TipTap nodes without changing the editor/build separation.

The builder currently maps TipTap headings and paragraphs back to the core `H1`, `H2`, and `P` components and preserves basic inline marks. It deliberately has no Babel/core-js/legacy profile yet; compatibility profiles can be added later inside `packages/book-builder` without affecting the editor build.

## Tests (Vitest)

Run from the repository root with the existing Node/npm toolchain:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

`vitest.config.ts` defines three projects and reuses the editor Vite configuration
(React, SVG, SCSS and TypeScript path aliases). Scripts use Vite's `runner` config
loader, as the editor does, to resolve the TypeScript workspace exports.

- `npm run test:unit` — Node.js utilities, business logic, Redux and builder functions.
  Use `*.test.ts` / `*.spec.ts` (or TSX) under `apps/` and `packages/`.
- `npm run test:component` — jsdom, React Testing Library and user-event.
  Use `*.component.test.tsx` (or TS). jsdom is verified with React 19 and user-event;
  it does not replace a browser for layout, media or browser-only APIs.
- `npm run test:browser` — real headless Chromium via Vitest Browser Mode and
  `@vitest/browser-playwright`. Use `*.browser.test.tsx` (or TS).
- `npm run test:coverage` — all projects with V8 reports in `coverage/`:
  terminal text, HTML (`coverage/index.html`) and LCOV (`coverage/lcov.info`).
- `npm run test:ci` — all projects, coverage and JUnit at `test-results/junit.xml`.
  Local scripts do not enable JUnit. No coverage thresholds are imposed.

`npm test` runs all projects once. For watch mode, append `-- --watch`.
`npm run typecheck` also checks the test infrastructure. Import test APIs from
`vitest`; no global test functions are enabled. DOM setups register jest-dom
matchers and explicitly clean up RTL after each test. Browser tests can use
`page` and native interactions from `vitest/browser`.

Existing Node tests retain their assertions and scenarios, with only the runner
imports migrated to Vitest. The old `browser.test.ts` archive-parser test remains
in the Node unit project: browser tests require the `.browser.test.ts` suffix.
The builder workspace's `npm test` still runs its own unit tests.

In CI, install Chromium and its OS dependencies before `npm run test:ci`, then
archive `coverage/` and `test-results/` even when tests fail. Chromium installation
requires network access to Playwright's download hosts (including
`cdn.playwright.dev` and any redirect destination). Do not skip browser tests if
installation fails. This cloud environment blocks the download with HTTP 403,
but has a system Chromium that was successfully verified using:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

The optional variable selects an existing Chromium executable; omit it to use
Playwright's installed browser. The same variable works with `test`,
`test:coverage` and `test:ci`. No browser path is hardcoded in the configuration.
