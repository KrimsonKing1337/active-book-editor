# Authoring block media

This change completes the editor side of [builder/runtime PR #68](https://github.com/KrimsonKing1337/active-book-editor/pull/68),
which depends on [types #15](https://github.com/KrimsonKing1337/active-book-types/pull/15)
and [core #51](https://github.com/KrimsonKing1337/active-book-core/pull/51).
See content-media-runtime.md for the shared data contract and reader behavior.

## Workflow

Open an existing local project, or create a new one and save it to a folder first.
Then use "Добавить изображение" / "Добавить видео". The OS picker imports a local
file into assets/ and inserts a media block at the current selection. A caret
inside a Carousel slide inserts into that slide. Standard TipTap insertion can
split a paragraph, and a native caret paragraph is created when needed at a block
edge. These changes participate in the ordinary ProseMirror undo transaction.

Media are atomic/selectable/draggable blocks. Select the image or video preview
to edit attributes. Width uses a numeric field and a px/% selector. Clearing width
restores 100%; clearing height restores intrinsic aspect ratio. Alignment, fit,
alt and video controls/autoplay/muted/loop update document attributes, support
undo/redo and trigger the existing dirty/autosave flow. Poster accepts an existing
image path under assets/, committed and validated on blur rather than saving
invalid partial text. No attribute edit reimports a file.

Editing video is a passive native preview: it neither autoplays nor exposes player
controls. The checkboxes configure the reader's existing Core Video. The image or
first video frame/poster shows author geometry, independent of reader Dialog
preferences. React NodeViews are used for asynchronous project resource loading,
visible resource errors and the selected-node form; text inside media is not editable.

## Files and project lifetime

The existing LocalProjectStorage imports and build-file enumeration are reused.
Native handles already in assets/ resolve to their existing paths. External files
are copied with collision suffixes; imports on the same storage instance are
serialized so concurrent same-name imports cannot overwrite one another.
When the fallback file input supplies no filesystem handle, that existing-path
identity check is unavailable; no extra hash/deduplication database is introduced.

The import UI and builder share format tables. MIME and extension must agree when
MIME is provided; otherwise the extension supplies the filesystem fallback.
Video container support is checked with native canPlayType. Empty, unsupported
and mismatched files give an author-facing error. No transcoder, server upload
endpoint or second file store is added. Async picker/import results are bound to
their original editor/project/page scope and cannot insert into a successor.

A project-scoped ProjectAssetsProvider now owns preview URLs for both content and
visual effects. The old useVisualAssets remains an adapter for visual params.
Each project path shares its file read/pending promise/object URL; ordinary
rerenders and page navigation reuse it. Ready source URLs remain available while
a newly added poster loads, preserving the native video DOM node. Closed scopes
reject late results before creating URLs; active hooks also ignore stale results.
All owned URLs are revoked when the project is replaced or the provider unmounts.
External edits to files require reopening the project; this is not a filesystem watcher.

## Clipboard and validation

ProseMirror JSON and raw clipboard/drop HTML are validated before fitting can
remove invalid content. Atomic media cannot contain children or appear inline;
invalid attrs, paths, unsupported media extensions and unknown JSON nodes fail
rather than being silently discarded. Existing Carousel/slide boundaries remain.

Copy/drop of media nodes carries their stable project paths, not blob URLs or file
bytes. If another project lacks that path, the node is preserved with an explicit
missing-resource error. Its file is not claimed to have transferred; building
fails with that resource path until the asset is supplied. Reopen the project
when supplying files externally. Raw file paste/drop gives guidance to use the
import commands; it neither navigates away nor implements a parallel importer.
Internal ProseMirror drags retain their normal handler.

## Verification

Browser tests use real TipTap, FileSystem storage (OPFS), object URLs and Chromium.
Only OS picker/confirmation dialogs are replaced by native filesystem handles.
They cover root image and slide video insertion, text splitting, dimensions/fit,
video flags/poster, undo/redo, page switches, save/reopen, collision/handle reuse,
clipboard/drop, missing resources, passive video, stable DOM and URL cleanup in
StrictMode. Unit tests cover format rejection and cache concurrency/stale results.

`npm run test:media:workflow` drives the real editor UI through imports, attributes,
save/reopen, assets reuse and the existing build command. It then serves the built
book and checks image loading/fit, inactive slide video, native manual pause,
position/selection after slide return and resize, and page ownership. Root/slide
images, slide video and a second-page root video are authored through the UI.

No inline media, float, figure/captions, click-to-open viewer, nested Carousel,
new Dialog trigger, reader progress or playback policy change is included.
