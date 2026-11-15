# Media build fixture

The SVG images are synthetic: portrait 120 × 300, wide 1200 × 200 and small
16 × 16. portrait.webm is a synthetic silent VP8 WebM recorded from a 120 × 300
canvas with Chromium MediaRecorder. Its changing green fill distinguishes live
video from a static poster. Tests use the committed file; no encoder dependency
is needed. The other video is reused from the existing multipage fixture.

The project preparation helper copies the portrait SVG to the literal filename
`assets/a #%.svg` to exercise correct filename-to-URL encoding.
