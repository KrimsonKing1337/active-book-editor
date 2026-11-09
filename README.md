# active-book-editor

Prototype monorepo for the Active Book visual editor and book build pipeline.

## Layout

- `apps/editor` — Vite + React + TipTap editor. The editable TipTap document is rendered inside the real `@active-book/core` `App` and `PageWrapper`.
- `packages/book-builder` — internal Vite-based book builder used both by an npm script and by the editor dev server.
- `example-book/book.json` — minimal ordered book containing TipTap page documents for CLI builds.

## Local core

Keep the current repositories in sibling directories:

```text
parent/
├─ active-book-core/
├─ active-book-editor/
└─ active-book-types/
```

The core package is `@active-book/core`; its compiled archive is a local file
dependency in the editor root. Install dependencies in `active-book-types` and
`active-book-core` with `npm ci`, then run from this repository:

```sh
npm run core:package
```

The command builds the sibling core, creates `active-book-core-<version>.tgz`,
updates the `@active-book/core` dependency and lockfile, and installs it. Use
`npm ci` for subsequent installs with that exact archive. No npm publication or
old-name alias is required. This repository's root package is
`active-book-editor-workspace`; the application workspace is `active-book-editor`.

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

The root script builds `example-book`. It includes the renamed library archive at
`example-book/dependencies/active-book-custom-test-0.0.8.tgz`. To rebuild that
archive, run `npm ci && npm run make` in the sibling `active-book-custom-test`
repository and copy the result from `tgz/` to this directory.

For another book, pass its project directory to the workspace script:

```sh
npm run build -w @active-book/book-builder -- ./path/to/book
```

The path is relative to `packages/book-builder`; the directory must contain
`book.json` and `package.json`. The runtime application workspace is
`active-book-runtime`.

## Current prototype boundary

The component registry currently contains `Counter` only. The important part of this prototype is the extension point: more `@active-book/core` components can be registered as TipTap nodes without changing the editor/build separation.

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

### Windows (PowerShell)

Use Node.js 24.19.0 (the verified version; jsdom requires Node 24.15+ on the
24.x line). Keep `active-book-types`, `active-book-core` and this
repository in sibling directories. The editor still depends on a local core
archive; it is not downloaded from npm. For an unchanged lockfile, provide the
exact core archive at the path and version recorded in `package.json`.

If that exact archive is unavailable, first run `npm ci` in the types and core
repositories, then run the existing `npm run core:package` from the editor root.
That command builds a new core archive, increments its version, updates the
editor dependency and installs it with a new lockfile integrity. This is a
local dependency refresh, so expect manifest/lockfile changes in both repos;
do not disable integrity checks or substitute a different archive under the recorded filename.

Once the local core dependency is available, run from the editor root:

```powershell
npm ci
npx playwright install chromium
npm run test:unit
npm run test:component
npm run test:browser
npm run typecheck
```

Playwright installs its own Chromium on Windows; no executable path override is
normally needed. If using an existing Chromium, set the optional variable in
PowerShell syntax (replace the example path with your actual executable):

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\path\to\chrome.exe'
npm run test:browser
Remove-Item Env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
```

To verify the real process launch, temporarily set `$env:DEBUG = 'pw:browser'`,
run `npm run test:browser`, then `Remove-Item Env:DEBUG`. Playwright logs the
executable and launched PID. The Button browser test also asserts Chromium's
user agent, actual CSS layout and a trusted native click that does not submit
its parent form. These checks intentionally fail in an emulated DOM.

Infrastructure verification added just three scenarios: CSS RGBA conversion and
clamping (unit), disabled/enabled Button interactions (component), and native
Button behavior/layout (browser). Verified on Linux with Node 24.19.0:
42 unit tests, 2 component tests and 2 browser tests passed in separate runs.
Windows commands are provided for reproduction; Windows execution was not
available in this environment.

### Editor effects integration

The browser suite now covers effect editing, saved data and computed styles,
project restoration, deletion/undo/redo and screenshot comparison in the real
editor. See [the integration test guide](tests/editor-effects/README.md) for
scenarios, OS-dialog boundaries, local-core installation and Windows screenshot
reference commands. The local test book and 1.8 KB graphic live in
`tests/fixtures/effects-book/`.

See [Multiple-page books](docs/multipage-books.md) for the current book.json model, page/history behavior and browser checks.

Current CSS-first experiment: [contract, controls, commits and validation](docs/css-first-story-surfaces.md).

Final story regions: [contract, Toolbar, masks and validation](docs/story-regions-finalization.md).

Regression follow-up: [preserved masks, current reset control and core 0.0.53 validation](docs/story-regions-test-regressions.md).
