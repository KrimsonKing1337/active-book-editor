# Linear books with multiple pages

The current `book.json` format is an ordered book, not an individual TipTap doc:

```json
{
  "type": "book",
  "pages": [
    {
      "id": "permanent-page-id",
      "document": {
        "type": "doc",
        "attrs": { "pageEffects": {} },
        "content": [{ "type": "P" }]
      }
    }
  ]
}
```

`packages/book-builder/src/book` owns this shared envelope and its validation.
Editor storage, project services and builder use the same type. Each page stores
its effects only in the existing `document.attrs.pageEffects`; no independent
per-page effects table is added. IDs are nonempty and unique within the book.
There is at least one author page. The array position + 1 is its runtime number;
position 0 remains the technical audio-unlock screen and is absent from the array.
Old single-document JSON is rejected. Existing examples/fixtures use the new
format directly; no compatibility reader or migration is provided.

## Editing and history

EditorScreen supplies the existing core StoreProvider, MemoryRouter and AppModeContext.
EditorWorkspace owns one TipTap editor and a book state through `useBookPages`.
It uses AppWrapper directly because core App's static `PageN` imports do not
represent editor documents. The same existing useGoToPage and Redux page position
serve both the page list and Toolbar. No new router or navigation store is added.

Each TipTap update copies the active document into the canonical book. Switching
first flushes pending CSS previews and captures the current document. A fresh
EditorState restores the target document, including root pageEffects attributes.
Plugin state, selection and undo/redo are reset: returning to a page does not
restore its old undo stack, and undo on one page cannot modify another page.
There is no global structural undo history.

Node views may flush React synchronously, so navigation's state replacement runs
in a guarded microtask outside the React commit. A superseded selection is cancelled.
PageWrapper and AudioInstances are keyed by project session and persistent page
ID. Their legacy cleanup runs on page changes, while AppWrapper/StoryVisualRoot
remain mounted. Page-effect state, audio statuses and style callbacks are scoped
to that page; obsolete async effect-panel actions cannot commit into its successor.

The page strip shows current order and selection, with Add, Delete and up/down
buttons. A new empty page becomes active. Moving a page keeps its ID, document,
effects and selection together. Deleting the selected page chooses the next page
at that position or the preceding last page. Deleting the last page is disabled
both in the UI and in the model operation.

## Persistence

All saves write the entire book. Text, root attributes and structural operations
advance a monotonic book revision. Structural edits therefore participate in the
saved indicator, autosave and beforeunload warning even without text edits.
Switching captures changes in memory immediately; disk writes use the existing
1.5-second autosave delay or explicit Save / Ctrl/Cmd+S.

Manual and automatic writes share one promise queue, including project creation.
Each queued job reads the latest snapshot when it starts; an older queued autosave
cannot overwrite a newer manual snapshot. Only a successful save of the current
revision clears dirty state. Failures leave later jobs usable. Project replacement
clears the timer, waits for writes and changes its session token so obsolete jobs
cannot mark a newly opened book saved. Opening/restoring a project loads page 1.
New Project creates one new ID. Existing project-directory and recent-handle
storage are reused.

Extra authored top-level metadata is retained by book transformations.
`book.visualEffects` range lifetimes retain their authored ranges exactly. Numeric
bounds are
positive, integral and ordered; adding/removing/reordering pages does not shift
or clip them. Endpoints beyond the shortened book are retained for the author to
review, not silently corrected. There is no new range UI or range renderer here.

## Builder and reader

compileBookDocument validates the envelope and maps compilePageDocument over all
pages in order. Each document independently normalizes its effect groups and
strips editor-only slugs. Content, permanent IDs and component references remain.
The existing build service/CLI still copies media and TGZ dependencies.

The built reader derives config.pages from the array and maps existing Routes to
/page-1 through /page-N. Each BookPage is keyed by permanent ID and receives its
positional number for Audio/Vibration/Flashlight. Background/Frame and inserted
custom components continue through their existing renderers. Technical route /
uses the existing Page0 and real audio-unlock button. The persistent book root
survives reader navigation.

## Stage 5 integration boundary

Core now adapts the existing Background/Frame declarations to the common visual
session. Its implementation lives under src/controllers/visualEffects, and its
factory is exported through @active-book/core/controllers/visualEffects. The editor panels,
PageEffectsProvider, project format and builder are unchanged.

AppWrapper owns one stable default session and updates its page-count bounds from
book.pages.length. Implicit page declarations wait for a valid current page when
navigation, project replacement and count updates commit separately. Core's
PageWrapper no longer bulk-clears Background/Frame registrations, so book-owned
range declarations retain their activation across page switches.

The full integration remains a later stage: create a session for each opened book,
compile and reconcile registrations directly by stable IDs, connect the panels to
that model, and adapt TGZ definitions without replacing the existing loader. No
range UI or book-data migration is introduced here.

## Checks

Use the preceding core PR's archive (0.0.37 for this implementation). The existing
npm run core:package workflow rebuilds core and updates the local archive dependency
when needed; its version/lockfile changes are expected. After npm ci:

```sh
npm run typecheck
npm run test:unit
npm run test:component
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:runtime
npm run build:editor
```

The editor browser cases use real TipTap, OPFS storage and IndexedDB. They cover
three distinct texts, switching, isolated undo/redo, structural autosave, explicit
Save and Ctrl+S, delayed writes, permanent IDs, reorder/delete/minimum page count,
new/reopened projects, distinct frame settings, real audio and a custom TGZ.
The production-runtime test opens the fixture in the real editor, changes text
and page order, and clicks Build Book. It then serves that production output and
reads all three pages forward/backward, checking the edited text, page 0, count,
IDs, effects, audio cleanup, a custom component and a custom effect.

The Linux composition reference is reviewed and updated for the real 1-of-1 page
counter. Browser checks run in Chromium on Linux. The existing Windows reference
needs regeneration/review on Windows after this intentional UI change; see the
platform-specific screenshot workflow in tests/editor-effects/README.md.


Stage 6 makes visual descriptions canonical; see
[visual-effects-integration.md](visual-effects-integration.md). Page visual effects
live in document.attrs.visualEffects and book ranges in book.visualEffects. The
production test now also creates/edits effects through panels, saves/reopens,
adds/deletes a page, checks disjoint-range media identity, and compares native
renderer parameters against the shared compiler's output.
