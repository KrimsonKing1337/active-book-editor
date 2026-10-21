import type { ComponentType, PropsWithChildren } from 'react';

import { H1, H2, P } from 'activeBook-core/components';

// Public contract mirrored by the standalone @active-book/types package.
// Keep the host implementation and type-only consumer declarations compatible.
export type BookRuntime = {
  mode: 'editor' | 'reader';
  components: {
    P: ComponentType<PropsWithChildren>;
    H1: ComponentType<PropsWithChildren>;
    H2: ComponentType<PropsWithChildren>;
  };
};

export type BookComponentProps = {
  book: BookRuntime;
};

export const createBookRuntime = (mode: BookRuntime['mode']): BookRuntime => ({
  mode,
  components: {
    P,
    H1,
    H2,
  },
});
