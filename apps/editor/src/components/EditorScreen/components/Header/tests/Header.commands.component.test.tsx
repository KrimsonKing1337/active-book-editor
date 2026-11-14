import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { Header } from '../Header';

import { createHeaderFixture } from './fixture';

test('forwards exact insert/import arguments, preserves the media slot and blocks commands when disabled', async () => {
  const {
    props,
    commands,
    busyProps,
  } = createHeaderFixture();
  const user = userEvent.setup();
  const { rerender } = render(<Header {...props} />);
  const names = [
    'Импортировать .tgz',
    'Добавить Счётчик',
    'Добавить параграф',
    'Добавить заголовок 1',
    'Добавить заголовок 2',
    'Добавить карусель',
  ];
  const custom = screen.getByRole('button', { name: 'Добавить Счётчик' });

  expect(custom).toHaveAttribute('title', 'Fixture counter');

  for (const name of names) {
    await user.click(screen.getByRole('button', { name }));
  }

  expect(commands.onInsertTextBlock.mock.calls).toEqual([
    [{ type: 'paragraph' }],
    [{ type: 'heading', attrs: { level: 1 } }],
    [{ type: 'heading', attrs: { level: 2 } }],
  ]);
  expect(commands.onInsertCustomComponent.mock.calls).toEqual([['@fixture/components', 'Counter']]);
  expect(commands.onInsertCarousel).toHaveBeenCalledTimes(1);
  expect(commands.onImportCustomComponents.mock.calls).toEqual([[]]);
  const buttons = screen.getAllByRole('button');
  const media = screen.getByRole('button', { name: 'Медиа-инструменты' });
  const mediaIndex = buttons.indexOf(media);

  expect(screen.getByRole('banner')).toContainElement(media);
  expect(buttons[mediaIndex - 1]).toHaveAccessibleName('Добавить карусель');
  expect(buttons[mediaIndex + 1]).toHaveAccessibleName('Собрать книгу');
  rerender(<Header {...busyProps} />);

  for (const name of names) {
    const button = screen.getByRole('button', { name });

    expect(button).toBeDisabled();
    await user.click(button);
  }

  expect(commands.onInsertTextBlock).toHaveBeenCalledTimes(3);
  expect(commands.onInsertCustomComponent).toHaveBeenCalledTimes(1);
  expect(commands.onInsertCarousel).toHaveBeenCalledTimes(1);
  expect(commands.onImportCustomComponents).toHaveBeenCalledTimes(1);
});

test('distinguishes build progress from project busy and applies both build disabling conditions', async () => {
  const {
    props,
    commands,
    busyProps,
  } = createHeaderFixture();
  const user = userEvent.setup();
  const { rerender } = render(<Header {...props} />);

  await user.click(screen.getByRole('button', { name: 'Собрать книгу' }));
  expect(commands.onBuildBook.mock.calls).toEqual([[]]);
  rerender(<Header {...props} build={{ ...props.build, state: 'building' }} />);
  const building = screen.getByRole('button', { name: 'Сборка...' });

  expect(building).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Добавить карусель' })).toBeEnabled();
  await user.click(building);
  expect(commands.onBuildBook).toHaveBeenCalledTimes(1);
  rerender(<Header
    {...busyProps}
    build={{ ...busyProps.build, state: 'success' }}
  />);
  const blocked = screen.getByRole('button', { name: 'Собрать книгу' });

  expect(blocked).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Подождите...' })).toBeDisabled();
  await user.click(blocked);
  expect(commands.onBuildBook).toHaveBeenCalledTimes(1);
  rerender(<Header {...props} build={{ ...props.build, state: 'error' }} />);
  expect(screen.getByRole('button', { name: 'Собрать книгу' })).toBeEnabled();
  expect(commands.onBuildBook).toHaveBeenCalledTimes(1);
});
