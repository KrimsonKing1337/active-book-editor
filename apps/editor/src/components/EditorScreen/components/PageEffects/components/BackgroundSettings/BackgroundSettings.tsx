import { useRef, useState, type CSSProperties } from 'react';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { useBackgroundStylePreviewUpdater, usePageEffects } from '../../PageEffectsContext';

import { Images, Videos, Shadow, Background, CustomComponent } from './components';

import { BackgroundStyleProvider } from './BackgroundStyleContext';

import { getBlurFilter } from '../StyleEditor/utils';

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

const defaultShadowOptions: NonNullable<BackgroundOptions['shadow']> = {
  show: false,
  style: { zIndex: 2, backdropFilter: getBlurFilter(10) },
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
  const [idDraft, setIdDraft] = useState(effect.id);
  const importsInProgressRef = useRef(0);
  const updateStylePreview = useBackgroundStylePreviewUpdater();
  const { flushStylePreviews } = usePageEffects();

  const options = effect.options;

  const style = options.style ?? {};
  const images = options.images ?? [];
  const videos = options.videos ?? [];
  const shadow = options.shadow ?? defaultShadowOptions;

  const updateOptions = (updates: Partial<BackgroundOptions>) => {
    const updatedOptions = {
      ...options,
      ...updates,
    };

    onUpdate(effect.id, {
      ...effect,
      options: updatedOptions,
    });
  };

  const updateId = () => {
    const normalized = idDraft.trim();

    const alreadyExists = effects.some((effectCur) => {
      return effectCur.id === normalized && effectCur.id !== effect.id;
    });

    if (!normalized || alreadyExists) {
      return;
    }

    onUpdate(effect.id, {
      ...effect,
      id: normalized,
    });
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

  const handleNameChange = (name: string) => {
    onUpdate(effect.id, {
      ...effect,
      slug: name,
    });
  };

  const handleImagesChange = (nextImages: NonNullable<BackgroundOptions['images']>) => {
    updateOptions({ images: nextImages });
  };

  const handleVideosChange = (nextVideos: NonNullable<BackgroundOptions['videos']>) => {
    updateOptions({ videos: nextVideos });
  };

  const handleShadowChange = (nextShadow: NonNullable<BackgroundOptions['shadow']>) => {
    updateOptions({ shadow: nextShadow });
  };

  const updateStylePreviewForEffect = (
    layer: 'background' | 'shadow' | 'image' | 'video',
    mediaId: string | null,
    style: CSSProperties,
  ) => {
    updateStylePreview(effect.id, layer, mediaId, style);
  };

  const handleComponentChange = (component: BackgroundOptions['component']) => {
    updateOptions({ component });
  };

  return (
    <BackgroundStyleProvider preview={updateStylePreviewForEffect} commit={flushStylePreviews}>
      <div className={styles.Settings}>
        <label className={styles.Field}>
          <span>
            Название эффекта
          </span>

          <input
            type="text"
            value={effect.slug}
            onChange={(event) => handleNameChange(event.target.value)}
          />
        </label>

        <div className={styles.Field}>
          <span>
            ID эффекта
          </span>

          <div className={styles.Row}>
            <input value={idDraft} onChange={(event) => setIdDraft(event.target.value)} />

            <button type="button" onClick={updateId}>
              Применить
            </button>
          </div>
        </div>

        <Background style={style} />
        <Images
          images={images}
          canImport={Boolean(project)}
          onChange={handleImagesChange}
          onImportAsset={(file, handle) => importAsset(file, handle, 'image')}
        />
        <Videos
          videos={videos}
          canImport={Boolean(project)}
          onChange={handleVideosChange}
          onImportAsset={(file, handle) => importAsset(file, handle, 'video')}
        />
        <Shadow shadow={shadow} onChange={handleShadowChange} />
        <CustomComponent component={options.component} onChange={handleComponentChange} />

        <div className={styles.Actions}>
          <button type="button" onClick={onDuplicate}>
            Дублировать
          </button>

          <button type="button" onClick={onDelete}>
            Удалить эффект
          </button>
        </div>
      </div>
    </BackgroundStyleProvider>
  );
};
