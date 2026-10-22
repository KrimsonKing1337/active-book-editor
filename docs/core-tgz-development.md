# Rebuilding the local Active Book Core package

The editor continues to use a packaged `.tgz` dependency. It does **not** import
Core source through an npm workspace or a direct directory link.

Clone or check out these three repositories as siblings:

```text
activeBook-react-core-next/
activeBook-editor/
activeBook-types/
```

When developing visual background effects, use the branch
`feature/visual-background-effects` in each repository.

From `activeBook-editor/`, after installing dependencies in the Core repository:

```bash
npm run core:package
```

The script runs Core's `npm run make`, which compiles Core and produces a new
`.tgz`, updates the editor's `activeBook-core` file dependency and runs
`npm install` to update `package-lock.json` and installed dependencies.

The Core `make` script increments its patch version. This makes each new
archive distinct and avoids accidentally installing a cached older archive.

Afterward, run:

```bash
npm run lint
npm run build:editor
npm run build:book
```

Commit the generated `package.json` / `package-lock.json` changes when ready.
The Core `tgz/` artifacts are local, ignored outputs, and must remain accessible
at the sibling path used by `file:` dependencies.

The editor also depends on the local `@active-book/types` sibling package.
