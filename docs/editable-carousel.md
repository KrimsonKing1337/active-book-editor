# Editable carousel

Follow-up [issue #65](./content-validation-review.md) documents range boundaries,
incremental validation measurements and the updated regression results.

Stage 2 uses the text-content contract already merged into `main`.

```text
doc
└─ carousel
   ├─ carouselSlide
   │  ├─ paragraph / heading (standard inline marks and hardBreak)
   │  └─ coreComponent (including custom packages)
   └─ carouselSlide
      └─ paragraph
```

`CarouselNode` and `CarouselSlide` extend the page's existing TipTap schema.
Ordinary author blocks belong to `slideBlock`; carousel belongs only to `block`.
Both container boundaries are isolating. A slide and a carousel must be nonempty.
The last slide cannot be deleted; select the carousel and use Delete to remove
the entire node. A new carousel starts with two empty paragraphs in two slides.

There is one Editor per page. `CarouselNodeView` has one `NodeViewContent`, so
ProseMirror owns all slide children, selection, clipboard and history. Editor
buttons are `contentEditable=false` and do not appear in serialized HTML/JSON.
`carouselSelectionPlugin` remembers only the active index by mapped document
position and follows the selection. Decorations hide inactive slides. Switching
slides dispatches selection alone and produces neither an update nor an undo
entry. Add/delete/reorder replace the slide fragment in one history action.

`ContentValidation` validates JSON/HTML insertion sources before ProseMirror
fitting, and validates the resulting document on changes. This prevents fitting
from silently lifting a nested carousel out of its slide. Rejected input produces
TipTap's `contentError`, displayed by `ContentError`. Project import and
book-builder use the same recursive content validator, with source paths in
diagnostics. Carousel and segment cannot occur inside a slide.

Reader's existing `renderValidatedNode` recursively renders slide children using
the same paragraph, heading, mark and component cases as the main narrative.
It passes the resulting slide elements to Core's `Carousel`; no block-specific
slide renderer or parallel AST is introduced.

Core uses stable `embla-carousel` and `embla-carousel-react` **8.6.0** (MIT).
The React adapter explicitly supports React 19. Embla owns dragging, snapping,
movement and the selected index. There is no autoplay or stored reading progress.
Inactive slides are inert and hidden from accessibility navigation. Native buttons
and arrow keys on the carousel region provide keyboard access; dragging ignores
links, controls and editable content. Narrative's global swipe/keyboard handlers
leave carousel interactions to Embla.

Sources: [release/license](https://www.npmjs.com/package/embla-carousel/v/8.6.0),
[React adapter](https://www.npmjs.com/package/embla-carousel-react/v/8.6.0),
[Embla options](https://www.embla-carousel.com/docs/api/options/).

Core's Embla-based `Carousel` is the only reader carousel implementation.
The editor's TipTap `CarouselNodeView` remains a separate authoring component:
ProseMirror owns its editable content, selection and undo/redo history.

Core is packaged as `0.0.62` through `npm run core:package`; the editor's manifest
and lock refer to its local sibling TGZ, following the existing workflow in
[core-tgz-development.md](./core-tgz-development.md). TGZ outputs remain ignored.

Browser coverage includes editing two slides, switching without document changes,
structural undo/redo, boundary keys, clipboard round trips, rejected JSON/HTML and
transactions, interactive custom components, real project save/open/compile,
single-slide reader and the production book with mouse, keyboard and native touch
input at mobile width. The production test checks browser console/page errors and
that opening the page again resets to its first slide.

Appearance settings and per-slide visual effects remain a separate next stage.
They currently have no attributes or editor controls in this contract.

Validation on 2026-11-11:

- Types: typecheck, NodeNext and Bundler contract tests pass.
- Core: typecheck, test typecheck, Stylelint, 47 unit tests and 8 SCSS alias
  tests pass. Packaging produces the archive consumed by the integration tests.
- Editor: typecheck, test typecheck, Stylelint, 94 unit tests, 8 component tests,
  the packaging script test, editor production build and production reader test
  pass. All 15 focused carousel/text browser tests pass.
- Full browser run: 29 pass; one existing effects screenshot fails. A clean
  `origin/main` source snapshot reproduces the same 1116 changed pixels in text.
  The snapshot test was given the same alias discovery and filesystem access to
  the installed dependencies. Its reference image was not updated.
- Full ESLint still fails: Core 121 errors / 47 warnings; Editor 70 errors /
  47 warnings. Both baselines have the same errors; the editor baseline has 45
  warnings. The two additional warnings concern file length. New carousel modules
  have no lint errors. Existing unrelated diagnostics are not reformatted.
- The production test captures console errors as well as page exceptions. Its
  video fixture now includes Core's default poster asset to avoid an unrelated
  missing-poster request. Production builds retain the large-chunk warning.
