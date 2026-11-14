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
    projectStatus: {
      projectName: 'Test book',
      projectMessage: 'Локальный проект',
      isDirty: false,
      showSavedStatus: false,
    },
    projectControls: {
      disabled: false,
      isProjectBusy: false,
      onNewProject: commands.onNewProject,
      onOpenProject: commands.onOpenProject,
      onSaveProject: commands.onSaveProject,
    },
    viewControls: {
      showStructure: false,
      showNarrative: true,
      showBackgrounds: true,
      showFrameEffects: true,
      structureButtonIsDisabled: false,
      onToggleStructure: commands.onToggleStructure,
      onToggleNarrative: commands.onToggleNarrative,
      onToggleBackgrounds: commands.onToggleBackgrounds,
      onToggleFrameEffects: commands.onToggleFrameEffects,
    },
    insertControls: {
      disabled: false,
      onInsertTextBlock: commands.onInsertTextBlock,
      onInsertCarousel: commands.onInsertCarousel,
      mediaTools: (
        <button type="button">
          Медиа-инструменты
        </button>
      ),
    },
    libraryControls: {
      disabled: false,
      onImport: commands.onImportCustomComponents,
      onInsertComponent: commands.onInsertCustomComponent,
      definitions: [{
        id: 'fixture/Counter',
        packageName: '@fixture/components',
        name: 'Counter',
        title: 'Счётчик',
        description: 'Fixture counter',
      }],
    },
    build: {
      state: 'idle',
      disabled: false,
      onBuild: commands.onBuildBook,
    },
  } satisfies ComponentProps<typeof Header>;

  const busyProps = {
    ...props,
    projectControls: {
      ...props.projectControls,
      disabled: true,
      isProjectBusy: true,
    },
    insertControls: { ...props.insertControls, disabled: true },
    libraryControls: { ...props.libraryControls, disabled: true },
    build: { ...props.build, disabled: true },
  } satisfies ComponentProps<typeof Header>;

  return {
    props,
    commands,
    busyProps,
  };
};
