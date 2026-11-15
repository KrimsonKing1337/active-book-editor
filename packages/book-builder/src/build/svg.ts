import type { Plugin } from '@svgr/core';

import { optimize } from 'svgo';

// Контракт плагина для svgr требует три аргумента
// eslint-disable-next-line max-params
export const optimizeSvg: Plugin = (code, config, state) => {
  if (config.svgo === false) {
    return code;
  }

  const result = optimize(code, {
    path: state.filePath,
    plugins: [
      'preset-default',
      'removeTitle',
      'prefixIds',
    ],
  });

  return result.data;
};
