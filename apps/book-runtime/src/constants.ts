import type { Config } from 'activeBook-core/@types';

// Page0 uses a silent sound to unlock browser audio after the reader's first interaction.
// eslint-disable-next-line max-len
export const AUDIO_UNLOCK_SRC = 'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

export const config: Config = {
  id: 'built-book',
  authorComments: 0,
  pages: 1,
  defaultTheme: 'dark',
  disableThemes: false,
};

