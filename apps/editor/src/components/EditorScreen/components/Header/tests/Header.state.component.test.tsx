import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { Header } from '../Header';

import { createHeaderFixture } from './fixture';

test('renders project status without issuing commands and forwards New, Open and Save once', async () => {
  const { props, commands } = createHeaderFixture();
  const user = userEvent.setup();
  const { rerender } = render(<Header {...props} />);
  const saved = screen.getByText('Сохранено');

  expect(screen.getByText('Test book')).toBeInTheDocument();
  expect(screen.getByText('Локальный проект')).toBeInTheDocument();
  expect(saved).toHaveAttribute('aria-hidden', 'true');
  rerender(<Header
    {...props}
    isDirty
    showSavedStatus
    projectMessage="Запись завершена"
  />);
  expect(screen.getByText('Test book *')).toBeInTheDocument();
  expect(screen.getByText('Запись завершена')).toBeInTheDocument();
  expect(screen.getByText('Сохранено')).toBe(saved);
  expect(saved).toHaveAttribute('aria-hidden', 'false');

  for (const command of Object.values(commands)) {
    expect(command).not.toHaveBeenCalled();
  }

  await user.click(screen.getByRole('button', { name: 'Новый проект' }));
  await user.click(screen.getByRole('button', { name: 'Открыть проект' }));
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(commands.onNewProject.mock.calls).toEqual([[]]);
  expect(commands.onOpenProject.mock.calls).toEqual([[]]);
  expect(commands.onSaveProject.mock.calls).toEqual([[]]);

  rerender(<Header {...props} isProjectBusy buttonIsDisabled />);
  expect(screen.getByText('Test book')).toBeInTheDocument();

  for (const name of [
    'Новый проект',
    'Открыть проект',
    'Подождите...',
  ]) {
    const button = screen.getByRole('button', { name });

    expect(button).toBeDisabled();
    await user.click(button);
  }

  expect(commands.onNewProject).toHaveBeenCalledTimes(1);
  expect(commands.onOpenProject).toHaveBeenCalledTimes(1);
  expect(commands.onSaveProject).toHaveBeenCalledTimes(1);
});

test('keeps view labels, pressed states and their distinct availability rules', async () => {
  const { props, commands } = createHeaderFixture();
  const user = userEvent.setup();
  const { rerender } = render(<Header {...props} isProjectBusy buttonIsDisabled />);
  const controls = [
    {
      show: 'Показать структуру',
      hide: 'Скрыть структуру',
      command: commands.onToggleStructure,
    },
    {
      show: 'Показать нарратив',
      hide: 'Скрыть нарратив',
      command: commands.onToggleNarrative,
    },
    {
      show: 'Показать фон',
      hide: 'Скрыть фон',
      command: commands.onToggleBackgrounds,
    },
    {
      show: 'Показать рамочные эффекты',
      hide: 'Скрыть рамочные эффекты',
      command: commands.onToggleFrameEffects,
    },
  ];

  for (const [index, control] of controls.entries()) {
    let name = control.hide;
    let pressed = 'true';

    if (index === 0) {
      name = control.show;
      pressed = 'false';
    }

    const button = screen.getByRole('button', { name });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-pressed', pressed);
    await user.click(button);
    expect(control.command).toHaveBeenCalledTimes(1);
  }

  rerender(
    <Header
      {...props}
      showStructure
      showNarrative={false}
      showBackgrounds={false}
      showFrameEffects={false}
      structureButtonIsDisabled
    />,
  );

  for (const [index, control] of controls.entries()) {
    let name = control.show;
    let pressed = 'false';

    if (index === 0) {
      name = control.hide;
      pressed = 'true';
    }

    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', pressed);
    expect(control.command).toHaveBeenCalledTimes(1);
  }

  const structure = screen.getByRole('button', { name: 'Скрыть структуру' });

  expect(structure).toBeDisabled();
  await user.click(structure);
  expect(commands.onToggleStructure).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Показать нарратив' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Показать фон' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Показать рамочные эффекты' })).toBeEnabled();
});
