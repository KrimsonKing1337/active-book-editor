import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';

import { getFramePreviewKey } from '../utils';

import { useFrameItemPreviews } from './useFrameItemPreviews';

test('does not carry preview state or delayed callbacks into another page with the same effect IDs', () => {
  const { result, rerender } = renderHook(({ pageId }) => useFrameItemPreviews(pageId), {
    initialProps: { pageId: 'first' },
  });
  const updateFirstPage = result.current.updateFrameItemPreview;
  const key = getFramePreviewKey('frame', 'shadow');

  act(() => updateFirstPage({ effectId: 'frame', itemId: 'shadow', changes: { hidden: true } }));
  expect(result.current.frameItemPreviews[key]).toEqual({ hidden: true });

  rerender({ pageId: 'second' });
  expect(result.current.frameItemPreviews).toEqual({});

  act(() => updateFirstPage({ effectId: 'frame', itemId: 'shadow', changes: { playState: 'paused' } }));
  expect(result.current.frameItemPreviews).toEqual({});

  act(() => result.current.updateFrameItemPreview({
    effectId: 'frame',
    itemId: 'shadow',
    changes: { playState: 'running' },
  }));
  expect(result.current.frameItemPreviews[key]).toEqual({ playState: 'running' });
});
