# Three-page integration fixture

Three permanent IDs, different text/background/frame settings, two page-owned
sounds, vibration/flashlight declarations and a real TGZ custom component. All
assets are local and authored for this test. The sound is 800 unsigned 8-bit PCM
samples of silence at 8000 Hz. `library/package` contains the archive source;
rebuild with `tar -czf dependencies/fixture-parts.tgz -C library package`.

The Badge uses the existing shared React host and BookRuntime audio-controller
hooks. It exposes loaded audio state and an interactive per-page counter.


Stage 6 uses canonical visual descriptions with a real image, locally generated
WebM, filters, a pulse frame and ranges 1–1 / 3–5. The upper bound deliberately
exceeds the three-page book. Overlay is a native background definition; Native is
a native frame definition exposing playback and instance identity. Badge remains
an ordinary inline component. The optional test-only __fixtureLibraryGate delays
ESM evaluation to verify cancellation while switching projects. Both visual and
inline exports still pass through the same existing TGZ loader.
