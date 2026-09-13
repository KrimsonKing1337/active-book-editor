import fs from 'node:fs/promises';
import path from 'node:path';

import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import * as sass from 'sass';

const virtualPrefix = '\0active-book-scss-module:';

export function coreScssModulesPlugin({ repoRoot }) {
  const coreSourceRoot = path.resolve(repoRoot, 'node_modules/activeBook-core/lib/src');

  return {
    name: 'active-book-core-scss-modules-compat',
    enforce: 'pre',

    transform(code, id) {
      if (!id.startsWith(coreSourceRoot) || !/\.[cm]?js$/.test(id)) return null;

      const transformed = code.replace(
        /import\s+\*\s+as\s+(\w+)\s+from\s+(['"])(\.\/.+?\.scss)\2;?/g,
        (_match, binding, _quote, request) => `import ${binding} from '${request}?activeBookModule';`,
      );

      return transformed === code ? null : { code: transformed, map: null };
    },

    resolveId(source, importer) {
      if (!source.endsWith('?activeBookModule') || !importer) return null;

      const request = source.slice(0, -'?activeBookModule'.length);
      return `${virtualPrefix}${path.resolve(path.dirname(importer), request)}`;
    },

    async load(id) {
      if (!id.startsWith(virtualPrefix)) return null;

      const filename = id.slice(virtualPrefix.length);
      await fs.access(filename);

      const sassResult = sass.compile(filename, {
        loadPaths: [coreSourceRoot, path.resolve(repoRoot, 'node_modules')],
        style: 'expanded',
      });

      let tokens = {};
      const cssResult = await postcss([
        postcssModules({
          generateScopedName: 'ab_[name]__[local]__[hash:base64:5]',
          getJSON(_filename, json) {
            tokens = json;
          },
        }),
      ]).process(sassResult.css, { from: filename });

      return `
const css = ${JSON.stringify(cssResult.css)};
const style = globalThis.document.createElement('style');
style.dataset.activeBookCore = ${JSON.stringify(path.basename(filename))};
style.textContent = css;
globalThis.document.head.appendChild(style);
export default ${JSON.stringify(tokens)};
`;
    },
  };
}
