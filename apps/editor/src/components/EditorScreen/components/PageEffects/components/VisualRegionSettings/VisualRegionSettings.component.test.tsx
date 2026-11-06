
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import type { VisualVisibility } from '@active-book/types';

import { VisualRegionSettings } from './VisualRegionSettings';

const customVisibility: VisualVisibility = {
  sides: ['top', 'right', 'left'],
  frameWidth: {
    top: {
      value: 6,
      unit: 'px',
    },
    right: {
      value: 20,
      unit: '%',
    },
    bottom: {
      value: 11,
      unit: 'px',
    },
    left: {
      value: 16,
      unit: 'px',
    },
  },
};

const assertRegionChangesPreserveVisibility = async (visibility: VisualVisibility) => {
  const handleChange = vi.fn();
  const user = userEvent.setup();
  const placement = {
    region: 'toolbarFrame',
    anchor: 'center',
    rotate: 15,
  } as const;
  const depth = {
    plane: 'aboveNarrative',
    order: 3,
  } as const;

  render(
    <VisualRegionSettings
      placement={placement}
      depth={depth}
      visibility={visibility}
      defaultPlane="background"
      onChange={handleChange}
    />,
  );

  const region = screen.getByRole('combobox', { name: 'Область размещения эффекта' });

  for (const nextRegion of ['storyViewportFrame', 'narrativeFrame', 'toolbarFrame']) {
    await user.selectOptions(region, nextRegion);

    expect(handleChange).toHaveBeenLastCalledWith({
      placement: {
        ...placement,
        region: nextRegion,
      },
      depth,
      visibility,
    });
  }
};

test('switching frame regions preserves custom side widths and the selected sides', async () => {
  await assertRegionChangesPreserveVisibility(customVisibility);
});

test('switching frame regions preserves a disabled mask and its authored widths', async () => {
  await assertRegionChangesPreserveVisibility({ frameWidth: customVisibility.frameWidth });
});

test('switching frame regions preserves an explicitly empty mask', async () => {
  await assertRegionChangesPreserveVisibility({
    ...customVisibility,
    sides: [],
  });
});
