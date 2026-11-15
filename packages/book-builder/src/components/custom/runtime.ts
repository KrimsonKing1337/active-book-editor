import type { BookRuntime } from '@active-book/types';

import { useAudioController } from '@active-book/core/hooks/effects';
import { useBackground } from '@active-book/core/hooks/effects/background';

import {
  H1,
  H2,
  P,
} from '@active-book/core/components';

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
    useBackground,
  },
});
