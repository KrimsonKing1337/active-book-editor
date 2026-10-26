import type { ChangeEvent, CSSProperties } from 'react';

import { useRef, useState } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { useBackgroundStylePreviewUpdater, usePageEffects } from '../../PageEffectsContext';

import { Image, Video, Shadow, Background, CustomComponent } from './components';
import { BackgroundStyleProvider } from './BackgroundStyleContext';

import { DEFAULT_SHADOW_OPTIONS } from './constants';

import { TextInput, Button } from '../EffectControls';

import styles from './BackgroundSettings.module.scss';

type BackgroundSettingsProps = {
  effect: BackgroundEffectDraft;
  effects: BackgroundEffectDraft[];
  project: BookProject | null;
  onLoadingChange: (loading: boolean, message?: string) => void;
  onUpdate: (previousId: string, effect: BackgroundEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const BackgroundSettings = ({
  effect,
  effects,
  project,
  onLoadingChange,
  onUpdate,
  onDuplicate,
  onDelete,
}: BackgroundSettingsProps) => {
  const updateStylePreview = useBackgroundStylePreviewUpdater();
  const { flushStylePreviews, getCurrentEffects } = usePageEffects();
  const [idDraft, setIdDraft] = useState(effect.id);
  const importsInProgressRef = useRef(0);

  const options = effect.options;

  const updateOptions = (updates: Partial<BackgroundOptions>) => {
    onUpdate(effect.id, {
      ...effect,
      options: { ...effect.options, ...updates },
    });
  };

  const updateId = () => {
    const normalized = idDraft.trim();
    const alreadyExists = effects.some((current) => current.id === normalized && current.id !== effect.id);

    if (!normalized || alreadyExists) {
      return;
    }

    onUpdate(effect.id, { ...effect, id: normalized });
  };

  const importAsset = async (
    file: File,
    fileHandle: ProjectFileHandle | undefined,
    kind: 'image' | 'video',
  ): Promise<string> => {
    if (!project) {
      throw new Error('Сначала создайте или откройте проект книги');
    }

    importsInProgressRef.current += 1;
    onLoadingChange(true, kind === 'image' ? 'Загружаем изображение...' : 'Загружаем видео...');

    try {
      return await project.storage.importAssetFile(file, fileHandle);
    } finally {
      importsInProgressRef.current -= 1;

      if (importsInProgressRef.current === 0) {
        onLoadingChange(false);
      }
    }
  };

  const updateStylePreviewForEffect = (
    layer: 'background' | 'image' | 'video' | 'shadow',
    mediaId: string | null,
    style: CSSProperties,
  ) => {
    updateStylePreview(effect.id, layer, mediaId, style);
  };

  const commitFilters = (
    layer: 'background' | 'image' | 'video' | 'shadow',
    mediaId: string | null,
    styleFilters: FilterOperation[],
  ) => {
    if (!flushStylePreviews()) {
      return;
    }

    const currentEffect = getCurrentEffects().find((current): current is BackgroundEffectDraft => {
      return current.type === 'background' && current.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const currentOptions = currentEffect.options;
    const nextOptions = { ...currentOptions };

    if (layer === 'background') {
      nextOptions.styleFilters = styleFilters;
    } else if (layer === 'image' && currentOptions.image?.id === mediaId) {
      nextOptions.image = { ...currentOptions.image, styleFilters };
    } else if (layer === 'video' && currentOptions.video?.id === mediaId) {
      nextOptions.video = { ...currentOptions.video, styleFilters };
    } else if (layer === 'shadow' && currentOptions.shadow) {
      nextOptions.shadow = { ...currentOptions.shadow, styleFilters };
    }

    onUpdate(effect.id, { ...currentEffect, options: nextOptions });
  };

  const handleIdDraftChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdDraft(e.target.value);
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdate(effect.id, { ...effect, slug: e.target.value });
  };

  const handleImportImage = (file: File, handle?: ProjectFileHandle) => {
    return importAsset(file, handle, 'image');
  };

  const handleImportVideo = (file: File, handle?: ProjectFileHandle) => {
    return importAsset(file, handle, 'video');
  };

  return (
    <BackgroundStyleProvider
      preview={updateStylePreviewForEffect}
      commit={flushStylePreviews}
      commitFilters={commitFilters}
    >
      <div className={styles.Settings}>
        <label className={styles.Field}>
          <span>
            Название эффекта
          </span>

          <TextInput
            maxLength={120}
            value={effect.slug}
            onChange={handleNameInputChange}
          />
        </label>

        <div className={styles.Field}>
          <span>
            ID эффекта
          </span>

          <div className={styles.Row}>
            <TextInput maxLength={80} value={idDraft} onChange={handleIdDraftChange} />

            <Button variant="success" onClick={updateId}>
              Применить
            </Button>
          </div>
        </div>

        {effect.kind === 'background' && (
          <Background style={options.style ?? {}} styleFilters={options.styleFilters} />
        )}

        {effect.kind === 'image' && options.image && (
          <Image
            image={options.image}
            canImport={Boolean(project)}
            onChange={(image) => updateOptions({ image })}
            onImportAsset={handleImportImage}
          />
        )}

        {effect.kind === 'video' && options.video && (
          <Video
            video={options.video}
            canImport={Boolean(project)}
            onChange={(video) => updateOptions({ video })}
            onImportAsset={handleImportVideo}
          />
        )}

        {effect.kind === 'shadow' && (
          <Shadow
            shadow={options.shadow ?? DEFAULT_SHADOW_OPTIONS}
            onChange={(shadow) => updateOptions({ shadow })}
          />
        )}

        {effect.kind === 'component' && (
          <CustomComponent
            component={options.component}
            onChange={(component) => updateOptions({ component })}
          />
        )}

        <div className={styles.Actions}>
          <Button type="button" onClick={onDuplicate}>
            Дублировать
          </Button>

          <Button variant="danger" onClick={onDelete}>
            Удалить эффект
          </Button>
        </div>
      </div>
    </BackgroundStyleProvider>
  );
};
