# Stage 6: canonical visual descriptions and book ownership

Decision recorded before changing the book format.

An authored visual description contains `{ effect, lifetime, slug }`. `effect`
contains the common id, definitionId, serializable params, placement, visibility
and depth fields. Page lifetime references a permanent `pageId`; range lifetime
contains inclusive positional `{ from, to }` intervals. One shared compiler maps
page IDs to their current positions and resolves the existing artistic style /
filter options into VisualEffectRegistration. The editor preview and builder use
this compiler; the reader consumes its output directly.

Page descriptions live only in `page.document.attrs.visualEffects`, so the existing
TipTap transaction history remains authoritative for page editing and undo/redo.
Book-owned range descriptions live only in `book.visualEffects`. No description
appears in both collections. Specialized audio/vibration/flashlight data stays in
pageEffects. Background/frame groups are no longer saved there. Old book formats
are rejected; fixtures/examples are authored in the new format directly.

Panels use reversible view adapters for their existing controls. A panel write
creates a TipTap transaction containing canonical descriptions. Temporary CSS
previews override a derived preview only, and are flushed through the same write
path before save/navigation. They are not another persisted or playback store.

AppWrapper owns a session for its bookKey. Page changes and structural edits keep
that key; opening/New changes it. The owned session reconciles compiled descriptions
by stable ID and installs loaded definitions. Real unmount destroys it, whereas
StrictMode replay does not. Caller-supplied sessions remain caller-owned. A disposed
session cannot mutate a later book. Resource loading is scoped and cancelled by
project generation; definitions and inline components are never globally installed.

The existing TGZ loader gains a visualEffects manifest section alongside ordinary
inline components. A visual entry declares category, export and JSON defaults.
Its React implementation is wrapped as a VisualEffectDefinition using the existing
Background/Frame shell and native VisualRendererProps, including optional playback.
Serialized custom params and an optional componentKey reach the native renderer;
React handles type/key identity. No ReactNode instance map is retained in a session.

Only positive integer ordered range boundaries are structurally validated. Endpoints
beyond a shortened book remain unchanged, including across save/reopen/build.
Activation additionally requires a valid current book page. Page lifetimes still
require an existing page. No range UI, migrations, new package loader or artistic
features are introduced.

## Stored and compiled shape

```ts
type AuthoredVisualEffect = {
  effect: VisualEffectInstance; // id, definitionId, params, placement, visibility, depth
  lifetime: { type: 'page'; pageId: string } | { type: 'range'; range: PageRange[] };
  slug: string; // panel label, stripped from compiled registrations
};
```

The shared compiler resolves existing styleFilters into CSS while preserving the
source options. depth.order is the single saved z-index; frame layer/mask panel
controls project depth/visibility rather than persisting duplicate fields. Panel
updates preserve independent coordinates, visibility, masks and manual planes.

The built book has a flattened `visualEffects: VisualEffectRegistration[]` and
page documents containing only specialized pageEffects and text. It includes no
authored visual collections in the pages. Runtime loads definitions once, passes
registrations to AppWrapper once, and renders routes without per-page visual
adapters. Page 0 activates no authored visual effects. Unavailable definitions
are diagnosed; missing libraries do not silently delete saved descriptions.

Native TGZ manifest example:

```json
{
  "schemaVersion": 1,
  "components": {
    "Badge": { "title": "Inline badge", "entry": "./index.js", "export": "Badge" }
  },
  "visualEffects": {
    "Smoke": {
      "title": "Smoke",
      "category": "frame",
      "entry": "./index.js",
      "export": "Smoke",
      "defaultParams": { "custom": { "color": "white" } }
    }
  }
}
```

A native export receives `{ id, params, geometry, ref, book }`. Its ref exposes
optional play/pause/stop, while React cleanup owns resources. Source book data
contains only the definition ID and JSON params, including custom and an optional
componentKey. Package styles, modules and Blob URLs are disposed on unload.
Preview media URLs are cached for the open book, survive page changes and parameter
edits, and are revoked on project replacement/unmount. Hiding an effect changes
surface visibility without releasing its renderer or playback state.

Removed: BackgroundInstances, FrameInstances, global installed-library registry,
reader background/frame mapping, useBuiltinDeclarations, useVisualRanges and the
session ReactNode map. Public CSS/media hooks remain on the common reconciler.
createBuiltinRegistration remains a pure, shared declaration utility. Its pure
entry point has no renderer or stylesheet imports, so builder runs in Node.

Limits: author planes can still remount React surfaces; no range, geometry or
composition editor is added. Source books use the new format directly. The TGZ
loader shares the host React runtime and cannot interrupt arbitrary package code;
abort prevents its results from entering another book and releases host resources.

## Verification

Verified in Linux Chromium on 2026-11-02, without changing golden screenshots:

- Types: declaration checking, NodeNext consumer tests and Bundler consumer tests.
- Core: source/browser TypeScript, 43 Jest tests, 23 Chromium lifecycle/placement/
  screenshot tests, 8 SCSS packaging tests, ESLint on changed TypeScript.
- Editor/builder/runtime: all workspace and test TypeScript; 58 unit tests; 4
  component tests; 11 Chromium tests; the editor-to-production three-page book
  scenario; editor production build; ESLint on changed TypeScript; Stylelint.
- `npm run core:package` generated and installed core 0.0.40; manifests and lock
  agree. Archives stay generated/ignored, following the existing sibling workflow.

Core Stylelint reports 17 pre-existing errors in five unchanged SCSS files
(BackgroundEffects, FrameElement, FrameShadow, FrameText and Caramelldansen).
Neither these files nor Stylelint configuration changed in this stage. No style
rules were disabled. ESLint has warnings for existing large files and hook
initialization; there are no errors in the changed code. Production builds retain
the existing large-chunk warning.

The production scenario creates a background and frame via real panels, edits
settings, checks image/video/native state across a direct disjoint-range jump,
hides/resumes the visual layer without replacing video, exits/re-enters ranges,
saves, adds/deletes a page, reloads the saved book, reorders pages, saves again,
builds through the existing UI, and reads all three routes in the built book.
Native renderer params are compared with compiled JSON; IDs, audio cleanup, page 0,
filters, ordinary inline components and native TGZ exports are asserted separately.
The project-switch case delays actual TGZ ESM evaluation, switches to New, verifies
URL disposal and absence of stale definitions, then opens the original library
again. A separate StrictMode test covers equal props, changed props, React key,
playback, session replacement and stale controller isolation.
