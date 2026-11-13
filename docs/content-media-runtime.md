# Block image/video: model, build and reader

This stage consumes the public media contracts from active-book-types PR #15 and
Core Video's native-attribute declaration/0.0.64 package from core PR #51. Editor's
`core:package` script builds and installs that local archive through the existing
workflow; the dependency lock includes the already introduced Radix dependency.
No new playback or resource-storage system is introduced.

## Data and validation

`image` and `video` are atomic blocks at doc root or inside carouselSlide.
Paragraph/heading content remains inline-only; media cannot contain children or
marks. Both require `attrs.src` as a canonical file path inside `assets/`.
Blob/data/http URLs, absolute paths, traversal, backslashes, empty segments and
control characters are rejected. Paths describe literal filenames, including
spaces, Unicode, percent signs and URL punctuation. The renderer encodes each
path segment when creating a URL, rather than treating the path as an encoded URL.

Dimensions reuse VisualLength: width px/% (positive; percentages at most 100),
height px or omission/null for automatic intrinsic aspect ratio. Default width is
100% of the content area. Percentage height is deliberately unsupported because
ordinary block flow has no definite height reference. CSS constrains width to the
container; it does not measure natural media sizes in JavaScript.

`align` is left (default), center or right. `fit` is contain (default) or cover,
useful when an explicit height defines the media box. Image alt defaults to an
empty string. Video defaults: controls=true, autoPlay=false, muted=true,
loop=false. Optional poster is an image path under assets/.

Builder and insertion UI share supported extension/MIME tables: PNG, JPEG, WebP,
GIF, AVIF, SVG, BMP; MP4/M4V, WebM, OGV. Native browser decoding still determines
codec support; this stage does not transcode files. Media source extensions must
match their node kind, and a video poster must use an image extension. Unknown
media attributes, malformed booleans/lengths and invalid placements fail validation.

`compileBookDocument` preserves content/attrs. Before the existing Vite build,
each referenced src/poster must exist as a file. A missing reference stops the
build with its project path; it does not silently generate a broken reader.
The existing builder copies assets/ unchanged into the built book.

## Rendering and ownership

Runtime renders semantic img and existing Core Video. Stable model-position keys
and Video IDs follow the established renderer path. Ordinary style/container
updates preserve the media node, playback position and manual-pause intent.
Carousel receives React slides through its existing API and owns selection;
it does not import BookContentNode or acquire a second selection source.

Author geometry uses `--book-media-*` CSS properties and a media class in ordinary
flow. They do not set inline width/height/object-fit declarations. Consequently
the existing StoryDialog media context can override presentation with its own
`--story-dialog-object-fit`, without modifying authored attrs. Typed carousel
nodes classify through getDialogMode and the existing onSelect composition.
There is no new authored Dialog trigger or click-to-open viewer in this stage.

The authoring extension/UI and project resource previews are provided by a
separate dependent editor change. This reader/build stage does not reinterpret
legacy coreComponent names as media and introduces no migration.

## Verification

Contract/builder tests cover mixed documents and media slides, atomic/inline
constraints, invalid attributes/paths/extensions, defaults, unique asset paths
and lossless compilation. Browser component tests check real Core Video across
React layout updates and typed media under the prepared Dialog presentation.

`npm run test:media:runtime` builds an actual book with local images/video and
serves its production output in Chromium. It checks ordinary autoplay, inactive
slide pause, manual pause/position on return, native controls, DOM identity and
selection after narrow resize, encoded asset URLs, author fit/dimensions and
absence of missing HTTP resources. The fixture includes a wide image, small image
and portrait video. A missing resource must fail the build.
