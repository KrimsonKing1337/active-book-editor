# Three-page integration fixture

Three permanent IDs, different text/background/frame settings, two page-owned
sounds, vibration/flashlight declarations and a real TGZ custom component. All
assets are local and authored for this test. The sound is 800 unsigned 8-bit PCM
samples of silence at 8000 Hz. `library/package` contains the archive source;
rebuild with `tar -czf dependencies/fixture-parts.tgz -C library package`.

The Badge uses the existing shared React host and BookRuntime audio-controller
hooks. It exposes loaded audio state and an interactive per-page counter.
