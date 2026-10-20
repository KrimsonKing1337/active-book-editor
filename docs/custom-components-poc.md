# Custom components: manifest proof of concept

This branch demonstrates the **library registration and render path**, not the import-button workflow.

## Contract

The npm package `activebook-custom-test@0.0.5` contains:

- `package.json#activeBook` pointing to `./active-book.json`
- a JSON manifest with `schemaVersion: 1`, `components.Counter.title`, `entry` and `export`
- ordinary ESM and compiled CSS, with React supplied as a peer dependency

The book has its own `package.json`, separate from `book.json`.
The former lists npm dependencies; the latter stores nodes using the package name and component name:

```json
{ "type": "coreComponent", "attrs": { "package": "activebook-custom-test", "name": "Counter" } }
```

## Quick smoke test

1. Pull `activeBook-custom-test`, run `npm install && npm run make`; create `0.0.5.tgz`.
2. Copy the archive into `activeBook-editor/example-book/dependencies/` (create the directory).
3. From the **activeBook-editor repository root**, install the test package so Vite can currently find it:

   ```sh
   npm install ./example-book/dependencies/activebook-custom-test-0.0.5.tgz
   ```

   The installation modifies the root npm files locally; do not commit that temporary dependency.
4. Run `npm run dev` and open `example-book` through the file picker.
5. The toolbar now offers `Добавить Счётчик`, sourced from the JSON manifest.
6. Click it, test the component, then build the book. The runtime reads the uploaded book `package.json`
   and builds the same registry; the example `book.json` also includes a custom Counter node.
7. Alternatively run `npm run build:book` to exercise `example-book` directly.

To point the **dev server's registry** at another local book, set `ACTIVE_BOOK_CUSTOM_PROJECT_ROOT`
to that book's absolute directory **before starting Vite**. For example, in PowerShell:

```powershell
$env:ACTIVE_BOOK_CUSTOM_PROJECT_ROOT = "D:\\Books\\MyBook"
npm run dev
```

That directory must have `package.json` listing its custom package; the package must already be
installed in that book's `node_modules` or in the editor workspace.

## Where the imports come from

`packages/book-builder/src/customComponents/plugin.ts`:

1. Reads the book's `package.json` dependency names, without executing the libraries.
2. Locates each installed npm package, then reads `package.json#activeBook` and its manifest.
3. Resolves the declared `entry` using Node npm package resolution.
4. Generates a Vite virtual module with actual static module imports, a component registry, and UI metadata.

The editor's Tiptap node view and the built runtime import the **same virtual module name**.
Vite compiles the resulting graph, including the library's CSS imports. React is deduplicated by Vite.

## Deliberate limitations of this stage

- There is **no import .tgz button** and no npm installation by the editor; those are later steps.
- The dev server cannot infer the local path selected through File System Access API. The chosen
  registry project is currently fixed at server startup (default: `example-book`).
- On a browser build, `package.json` is uploaded with `book.json`. Installed dependency files
  are **not** uploaded; the builder finds packages already installed in the editor workspace,
  or in a real project folder for the CLI path.
- The metadata format is deliberately minimal. Props editing, package upgrade/replacement,
  and third-party code isolation are not included.

The point is to inspect the registration and module resolution mechanisms before implementing
file copying, installation and project switching in the UI.
