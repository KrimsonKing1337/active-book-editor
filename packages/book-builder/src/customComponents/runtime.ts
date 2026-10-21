import type { BookRuntime } from '@active-book/types';

import { H1, H2, P } from 'activeBook-core/components';
import { useAudioController } from 'activeBook-core/hooks/effects';

// One host-owned implementation. Custom components import only the @active-book/types
// declaration and receive these runtime values via the "book" prop.
export const createBookRuntime = (mode: BookRuntime['mode']): BookRuntime => ({
  mode,
  components: {
    P,
    H1,
    H2,
  },
  hooks: {
    useAudioController,
  },
});
