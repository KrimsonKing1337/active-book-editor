import { expect, test } from 'vitest';

import { useGoToPage } from '@active-book/core/hooks/control';
import { useBackground } from '@active-book/core/hooks/effects/background';
import { useFrameEffect, useFrameEffects } from '@active-book/core/hooks/effects/frame';

import * as components from '@active-book/core/components';
import * as app from '@active-book/core/components/App';

test('directory entrypoints share the App context and export runtime hooks', () => {
  expect(app.App).toBeTypeOf('function');
  expect(app.AppModeContext).toHaveProperty('Provider');
  expect(app.useAppMode).toBeTypeOf('function');
  expect(app.App).toBe(components.App);
  expect(app.AppModeContext).toBe(components.AppModeContext);
  expect(app.useAppMode).toBe(components.useAppMode);

  const hooks = {
    useGoToPage,
    useBackground,
    useFrameEffect,
    useFrameEffects,
  };

  for (const [nameCur, hookCur] of Object.entries(hooks)) {
    expect(hookCur, nameCur).toBeTypeOf('function');
  }
});
