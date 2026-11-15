# Editor effects integration (real Chromium)

`../../apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx` mounts the
real EditorScreen, TipTap extensions, effects UI, core Redux/renderers, project
services and application styles. It uses the existing Vitest `browser` project
with `@vitest/browser-playwright`; it does not use jsdom or mock application logic.

Two independent tests each start with a fresh, small OPFS project:

1. Add a background and a frame shadow via the UI. Set both colors, opacity and
   z-index, and change shadow thickness. Add brightness at 80%, assert its actual
   CSS, then edit it to 120%. Assert saved JSON and computed styles, preserving
   the fixture image while changing the background, preserving the background
   while changing the shadow, and preserving the shadow while editing the
   background again. Save, unmount, and mount a fresh EditorScreen. Its normal
   recent-project service restores the real directory handle from IndexedDB and
   reads book.json; no additional folder selection is made. Check both data and
   styles again, and compare the composition before/after restoration to the same
   committed screenshot reference.
2. Independently create the composition, delete the selected shadow through its
   UI confirmation, save, and assert the background/image data and DOM survive.
   Use actual Ctrl+Z / Ctrl+Shift+Z in TipTap, save again, and verify the exact
   restored/deleted data and rendered effects. The supported history operation
   exercised here is effect deletion, not an invented project-level undo toolbar.

The original local SVG is decoded in the browser and checked for a nonzero
naturalWidth. The 1.8 KB downloaded asset, source, checksum and CC BY attribution
are in `tests/fixtures/effects-book/`. Tests do not need network access at runtime.
Masked fields use real keyboard events with animation-frame synchronization for
selection updates, rather than setting DOM values or bypassing handlers.

## Run (PowerShell, repository root)

Use the existing sibling checkouts and Node 24.19.0. The lockfile references the generated core archive named in the root package.json. If you already have that exact
archive, run `npm ci`. If it is missing or locally rebuilt with a different
checksum, run `npm ci` in `active-book-types` and `active-book-core`,
then run `npm run core:package` in this repository. That supported script
rebuilds/version-bumps core and updates the editor dependency and lockfile;
these local manifest changes are expected. Do not bypass checksum checks.

```powershell
npx playwright install chromium
npm run test:browser -- EditorScreen.browser.test.tsx
npm run typecheck
npm run build:editor
```

Use `$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\path\to\chrome.exe'` only if
selecting an existing Chromium. By default Playwright uses its installed browser.
For diagnostic proof of the process launch, set `$env:DEBUG = 'pw:browser'`.

## Screenshot references

Vitest 4's native `toMatchScreenshot` is supported and enabled. References are
tracked under `tests/screenshots/EditorScreen.browser.test.tsx/`; failures and
diffs remain ignored generated artifacts. The viewport is fixed at 1280x900.
The reference contains the real core composition, including the local image,
background, frame shadow and book text; it is not a synthetic image fixture.
Verified here with Node 24.19.0, Vitest 4.1.12 and system Chromium
154.0.8037.57 (the Playwright download is blocked by this cloud network policy).
The complete CI run passed 48 tests in 17 files, including these two integration
scenarios. TypeScript, editor production build and ESLint passed (the existing
Vite default-export warning remains).

The Linux reference was reviewed and then passed a normal CI run without
`--update`. Both the original and restored composition match the same reference.

References include the OS and browser name to avoid treating Windows font
rasterization as a Linux regression. On Windows, create the first Windows
reference explicitly, inspect it, and then run the comparison without updating:

```powershell
npm run test:browser -- EditorScreen.browser.test.tsx --update
npm run test:browser -- EditorScreen.browser.test.tsx
```

Commit the reviewed `effects-composition-chromium-win32.png` for Windows CI.
Do not use `--update` in regular CI. No Windows runtime was available here.

## Boundaries

Only the native OS directory picker and acceptance of the delete confirmation
are replaced. The picker returns a real, fresh Chromium OPFS directory;
LocalProjectStorage writes real files, IndexedDB stores a real directory handle,
and reopening reads those saved files. OPFS files/directories and remembered
handles are cleaned up after each test. No in-memory replacement of project
storage, Redux, TipTap, effect serializers or style resolvers is used.

Native OS folder-picker chrome, permission denial/regrant for external folders,
and restoration after a complete browser-process restart are outside these
Browser Mode tests. Restoration here is an application remount in the same
browser context. Those OS permission flows need a separate manual test or a
platform-specific end-to-end setup. Animated presets, audio/video and project
build/export are intentionally outside this visual-effects lifecycle scenario.


The multipage editor now displays real page positions (1 of 1 in this fixture).
Its Linux screenshot reference has been refreshed for that intentional change.
Regenerate/review the Windows reference using the existing --update workflow on
Windows; Linux rendering is not used to invent a Windows reference.
