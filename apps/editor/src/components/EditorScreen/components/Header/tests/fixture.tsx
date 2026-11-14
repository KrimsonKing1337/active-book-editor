import type { ComponentProps } from 'react';

import { vi } from 'vitest';

import type { TextBlock } from '../../../@types';

import type { Header } from '../Header';

export const createHeaderFixture = () => {
  const commands = {
    onNewProject: vi.fn(async () => {}),
    onOpenProject: vi.fn(async () => {}),
    onSaveProject: vi.fn(async () => {}),
    onToggleStructure: vi.fn(),
    onToggleNarrative: vi.fn(),
    onToggleBackgrounds: vi.fn(),
    onToggleFrameEffects: vi.fn(),
    onInsertCustomComponent: vi.fn<(packageName: string, name: string) => void>(),
    onInsertTextBlock: vi.fn<(block: TextBlock) => void>(),
    onInsertCarousel: vi.fn(),
    onBuildBook: vi.fn(async () => {}),
    onImportCustomComponents: vi.fn(),
  };

  const props = {
    ...commands,
    projectName: 'Test book',
    projectMessage: 'Локальный проект',
    isDirty: false,
    isProjectBusy: false,
    showSavedStatus: false,
    showStructure: false,
    showNarrative: true,
    showBackgrounds: true,
    showFrameEffects: true,
    buildState: 'idle',
    buttonIsDisabled: false,
    structureButtonIsDisabled: false,
    customComponentDefinitions: [{
      id: 'fixture/Counter',
      packageName: '@fixture/components',
      name: 'Counter',
      title: 'Счётчик',
      description: 'Fixture counter',
    }],
    mediaTools: (
      <button type="button">
        Медиа-инструменты
      </button>
    ),
  } satisfies ComponentProps<typeof Header>;

  return { props, commands };
};
