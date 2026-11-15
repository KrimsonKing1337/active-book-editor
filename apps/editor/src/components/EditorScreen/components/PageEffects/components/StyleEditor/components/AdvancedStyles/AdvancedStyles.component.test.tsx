import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  expect,
  test,
  vi,
} from 'vitest';

import { AdvancedStyles } from './AdvancedStyles';

vi.mock('@active-book/core/components', () => ({
  Slider: () => null,
}));

test('preserves uncommitted rows across unrelated style changes and resyncs advanced values', async () => {
  const user = userEvent.setup();
  const handlePreview = vi.fn();
  const handleCommit = vi.fn();
  const view = render(
    <AdvancedStyles
      style={{
        opacity: 0.5,
        color: 'red',
      }}
      isMedia={false}
      onPreview={handlePreview}
      onCommit={handleCommit}
    />,
  );

  await user.click(screen.getByText('Дополнительные эффекты'));
  await user.click(screen.getByRole('button', { name: '+ Добавить свойство' }));
  expect(screen.getAllByRole('button', { name: 'Удалить' })).toHaveLength(2);

  view.rerender(
    <AdvancedStyles
      style={{
        opacity: 0.5,
        color: 'blue',
      }}
      isMedia={false}
      onPreview={handlePreview}
      onCommit={handleCommit}
    />,
  );
  expect(screen.getAllByRole('button', { name: 'Удалить' })).toHaveLength(2);

  view.rerender(
    <AdvancedStyles
      style={{
        opacity: 0.7,
        color: 'blue',
      }}
      isMedia={false}
      onPreview={handlePreview}
      onCommit={handleCommit}
    />,
  );
  expect(screen.getAllByRole('button', { name: 'Удалить' })).toHaveLength(1);
  const opacity = screen.getByRole<HTMLInputElement>('textbox', { name: 'opacity' });
  expect(Number.parseFloat(opacity.value)).toBe(0.7);
  expect(handlePreview).not.toHaveBeenCalled();
  expect(handleCommit).not.toHaveBeenCalled();
});
