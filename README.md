# activeBook-editor

Prototype monorepo for the Active Book visual editor and book build pipeline.

## Layout

- `apps/editor` — Vite + React + TipTap editor. The editable TipTap document is rendered inside the real `activeBook-core` `App` and `PageWrapper`.
- `packages/book-builder` — internal Vite-based book builder used both by an npm script and by the editor dev server.
- `example-book/book.json` — minimal serialized TipTap document for CLI builds.

## Local core

The repository expects the core to be available one level above the editor repository:

```text
parent/
├─ activebook-core/
└─ activeBook-editor/
```

The root dependency is intentionally declared as:

```json
"activeBook-core": "file:../activebook-core"
```

The core must have its `lib` output prepared because its package entry points to the compiled output.

## Run

```bash
npm install
npm run dev
```

The editor opens with an editable page inside `PageWrapper`. `Добавить Counter` inserts the real core `Counter` as an atomic TipTap node.

`Собрать книгу` sends the current TipTap JSON to the internal builder. The result is written to `dist-book/`.

## CLI book build

```bash
npm run build:book
```

By default this builds `example-book/book.json`. A custom JSON document can be supplied directly to the workspace script:

```bash
npm run build -w @active-book/book-builder -- ./path/to/book.json
```

## Current prototype boundary

The component registry currently contains `Counter` only. The important part of this prototype is the extension point: more `activeBook-core` components can be registered as TipTap nodes without changing the editor/build separation.

The builder currently maps TipTap headings and paragraphs back to the core `H1`, `H2`, and `P` components and preserves basic inline marks. It deliberately has no Babel/core-js/legacy profile yet; compatibility profiles can be added later inside `packages/book-builder` without affecting the editor build.
