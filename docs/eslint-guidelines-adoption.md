# AGENTS.md and ESLint guideline adoption

Baseline: editor `3b04d6f`, core `72e374b`, after the conditional-logic refactor
was merged in both repositories. This follow-up keeps issue #35 open for review.

## Adopted rules

The same five compact English principles are integrated into the existing
AGENTS.md sections in both repositories: placeholder states in 5.1, feature
eligibility in 5.4, coherent fallbacks and related optional values in 5.5, and API
boundaries/React lifecycle in 7.1. Existing overlapping wording was consolidated.
Short ternaries, nullish coalescing, optional chaining, meaningful intermediates
and legitimate absence remain allowed. No new tutorial or shared-config layer
was added.

Both ESLint configs enable `no-unneeded-ternary` at error with
`defaultAssignment: true`. Editor adds `eslint-plugin-react-hooks` 7.1.1, whose
peer range explicitly accepts ESLint 10, and enables only `rules-of-hooks: error`
and `exhaustive-deps: warn`. Core's existing hook settings are unchanged.
No recommended compiler preset, nested-ternary restriction, AST restriction,
typed stylistic rule, suppression or additional lint plugin was introduced.

## Initial findings and individual decisions

Baseline lint was 0 errors / 36 warnings in editor, and 0 / 40 in core. The new
configuration found **0 Rules of Hooks errors**, **0 unneeded-ternary violations**,
and **11 new exhaustive-deps warnings** in editor. Core's diagnostics did not
change. Each new warning was reviewed:

| Location | Count | Decision and reasoning |
| --- | --- | --- |
| `useProjectActions.handleNewProject` | 1 | Add the four referenced state setters to the existing callback dependencies. |
| `useProjectActions.handleOpenProject` | 1 | Add the same referenced setters; do not add another callback layer. |
| `useProjectActions.handleSaveProject` | 1 | Add the busy/message state setters. |
| `useProjectActions.handleContinueLastProject` | 1 | Add the project/restore/busy/message setters. |
| `useProjectActions.handleForgetLastProject` | 1 | Replace the empty dependency list with its three referenced state setters. |
| `useProjectActions.buildBook` | 1 | Add the busy/build-state setters. |
| `AdvancedStyles` synchronization effect | 1 | Capture exactly opacity, borderRadius, objectFit and objectPosition, the four supported advanced fields, and build the effect's snapshot from them. Preserve the previous trigger set instead of adding the entire style object. |
| `useBookPages` layout effect | 1 | Retain and document below; whole-array reactivity changes document-switch scheduling. |
| `useVisualAssets` cache memo | 1 | Retain and document below; project/session are intentional resource-ownership keys. |
| `useAsyncEffect` adapter | 2 | Retain and document below; the dynamic dependency-list contract cannot be validated inside this wrapper. |

All six action callbacks receive genuine React useState setters from
EditorWorkspace. Their identities are stable for the mounted workspace, so
listing them does not change callback stability in the application. It also
avoids stale closures if a different caller supplies different dispatchers.
No effect body, event flow, queue, dependency array of an effect, or mounting
condition was changed by these callback fixes.

AdvancedStyles previously passed the full style object to getDrafts while
tracking only its four supported fields. Depending on style itself would reset
uncommitted rows on unrelated color changes or fresh object identities. The
explicit field snapshot has exactly the same tracked values. A component
regression test verifies unsaved-row preservation, resynchronization when opacity
changes, and absence of preview/commit side effects. Its unused external core
Slider is mocked; the existing production/browser scenarios exercise the real
core components. This avoids expanding the test runner's external ESM handling
just for a draft-state test.

## Four retained warnings

These warnings remain visible at warn, without eslint-disable or severity changes.
They identify architectural contracts that warrant a separate review; retaining
them does not claim the patterns are ideal.

### useBookPages: missing book.pages

The layout effect synchronizes navigation and queues TipTap document replacement
outside React's commit phase. Its triggers use active page ID, numeric position
and page count. `captureCurrentPage` creates a new pages array on ordinary text
updates; adding that whole array would reschedule the layout effect on typing
and alter microtask cancellation. Add/delete/move/replace actions already publish
the complete page-ID order explicitly, and the queued lookup reads bookRef.

Proposed follow-up: separate publication of the ordered page-ID list from the
document-switch effect, with a dependency representing IDs rather than document
contents. Add regressions for reorder without a count change, rapid navigation
and typing during a queued switch before changing these triggers.

### useVisualAssets: project/session dependencies classified as unnecessary

The memo factory creates Maps/Sets and does not read project/session. Those
values deliberately identify the cache owner: a different book or new session
must recreate the cache even when asset paths happen to be equal. Removing them
would reuse old blob URLs across books and delay their revocation. The cleanup
also owns pending requests and disposed-cache checks.

Proposed follow-up: represent the owner-keyed cache lifecycle explicitly, or
isolate it within a resource-owner component keyed by project/session. Review
StrictMode cleanup, late request completion and cross-book equal-path cases.
Do not add unused owner fields or a dummy helper merely to silence the warning.

### useAsyncEffect: dynamic dependency list and missing effect callback

The generic adapter accepts both a callback and a dependency list, creates an
AbortController per run, and aborts on cleanup. Its only call is project restore,
with an inline callback and `[editor, replaceDocument]`. Adding the callback
itself to the effect dependencies would restart restore whenever render creates
a new callback, potentially cancelling/repeating the asynchronous workflow.
The rule cannot inspect the caller's closure through an arbitrary list.

Proposed follow-up: replace this single call with a direct useEffect containing
its asynchronous restore routine and abort cleanup, then remove the unnecessary
adapter. Alternatively, deliberately redesign and lint a custom-effect API.
Either needs focused restore/cancellation tests and a separate lifecycle decision;
no additional-hooks setting or useCallback wrapper is added in this task.

## Automated configuration coverage

Existing config/eslint.test.js files now test rejection of boolean re-encoding
and acceptance of short value ternaries, nullish chains and intentional truthy
defaults. Core additionally protects the existing exhaustive-deps severity.
Editor tests verify error/warn severities and valid hook usage in all three
workspaces: apps/editor, apps/book-runtime and packages/book-builder, including
TS and TSX. They also verify that no-nested-ternary/no-restricted-syntax remain off.

The plugin was installed through npm without ignoring peers. Its only new
transitive packages are hermes-parser, hermes-estree, zod and zod-validation-error;
existing registry package versions/integrities were retained.

## Validation

Checks used Node 24.19.0 / npm 11.9.0 / Linux Chromium. All applicable checks
passed, with no skipped tests and no disabled assertions.

| Repository | Actual results |
| --- | --- |
| core | npm ci and npm ls --all passed; source/test TypeScript and Stylelint passed. ESLint: 0 errors / 40 unchanged warnings, with the complete diagnostic JSON identical to baseline. Jest 47/47 with coverage; browser scenarios 62/62; tooling tests 27/27, including 17 lint-configuration cases. Production TS/assets/alias compilation passed. |
| editor | npm ci and npm ls --all passed; workspace/test TypeScript and Stylelint passed. ESLint: 0 errors / 40 warnings (36 existing + 4 documented above). Full Vitest coverage run 89/89: 67 unit, 8 component, 14 browser. Lint-configuration tests 18/18. Production editor, example-book and multipage fixture builds passed; production runtime Chromium integration 1/1 passed. |

Lint diagnostics were collected without --fix or --quiet. The standard commit
hook only formats staged TS/TSX files; no repository-wide autofix was run.
Existing production bundle/tooling warnings and fixture-media console messages
remain. The complete media fixture is covered by the passing runtime scenario.

Core compilation used the existing make pipeline's copyLottieWasm, copy-files,
ts, tsc-alias and scssAlias steps. The release/version/packaging steps were not
needed: no runtime source changed, core remains 0.0.57, and its existing archive
and the editor's archive integrity were retained. There was no npm publication.

Screenshot reference images and comparison thresholds were unchanged. Generated
core screenshot artifacts were restored. Windows was unavailable and is not
claimed as tested. AGENTS.md files have identical bytes after the update.

## Future sharing

AGENTS.md is byte-for-byte identical in both repositories, including the five
adopted principles. The guidance can therefore be extracted later without a
semantic reconciliation step. Common ESLint rules also now align for ternaries
and hook severities, while current parser/project discovery, aliases, ignore
patterns, Jest-only rules and workspace paths remain repository-specific.
A future shared flat-config package should export common rules and compose local
options; wholesale sharing of path/project configuration would require extra
care. No central repository, configuration wrapper or shared package is created.

## References

- [Conditional logic review](https://github.com/KrimsonKing1337/active-book-core/blob/main/docs/conditional-logic-review.md)
- [ESLint no-unneeded-ternary](https://eslint.org/docs/latest/rules/no-unneeded-ternary)
- [React exhaustive-deps](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps)
- [React rules-of-hooks](https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks)
