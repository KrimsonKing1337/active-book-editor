import type { ChangeEvent, CSSProperties } from 'react';

import { useRef, useState } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { useBackgroundStylePreviewUpdater, usePageEffects } from '../../PageEffectsContext';

import { Images, Videos, Shadow, Background, CustomComponent } from './components';

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

export type BackgroundEffectLayer = 'background' | 'shadow' | 'image' | 'video';

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

  const style = options.style ?? {};
  const images = options.images ?? [];
  const videos = options.videos ?? [];
  const shadow = options.shadow ?? DEFAULT_SHADOW_OPTIONS;

  const updateOptions = (updates: Partial<BackgroundOptions>) => {
    const updatedOptions = {
      ...options,
      ...updates,
    };

    const updatedEffect = {
      ...effect,
      options: updatedOptions,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateId = () => {
    const normalized = idDraft.trim();

    const alreadyExists = effects.some((effectCur) => {
      return effectCur.id === normalized && effectCur.id !== effect.id;
    });

    if (!normalized || alreadyExists) {
      return;
    }

    const updatedEffect = {
      ...effect,
      id: normalized,
    };

    onUpdate(effect.id, updatedEffect);
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

    const loadingMessage = kind === 'image' ? 'Загружаем изображение...' : 'Загружаем видео...';

    onLoadingChange(true, loadingMessage);

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
    const updatedEffect = {
      ...effect,
      slug: name,
    };

    onUpdate(effect.id, updatedEffect);
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
    layer: BackgroundEffectLayer,
    mediaId: string | null,
    style: CSSProperties,
  ) => {
    updateStylePreview(effect.id, layer, mediaId, style);
  };

  const commitFilters = (
    layer: BackgroundEffectLayer,
    mediaId: string | null,
    styleFilters: FilterOperation[],
  ) => {
    if (!flushStylePreviews()) {
      return;
    }

    const currentEffect = getCurrentEffects().find((cur): cur is BackgroundEffectDraft => {
      return cur.type === 'background' && cur.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const currentOptions = currentEffect.options;

    let nextOptions: BackgroundOptions = currentOptions;

    if (layer === 'background') {
      nextOptions = {
        ...currentOptions,
        styleFilters,
      };
    } else if (layer === 'shadow' && currentOptions.shadow) {
      const shadow = {
        ...currentOptions.shadow,
        styleFilters,
      };

      nextOptions = {
        ...currentOptions,
        shadow,
      };
    } else if (layer === 'image') {
      const images = currentOptions.images?.map((imageCur) => {
        if (imageCur.id !== mediaId) {
          return imageCur;
        }

        return {
          ...imageCur,
          styleFilters,
        };
      });

      nextOptions = {
        ...currentOptions,
        images,
      };
    } else if (layer === 'video') {
      const videos = currentOptions.videos?.map((videoCur) => {
        if (videoCur.id !== mediaId) {
          return videoCur;
        }

        return {
          ...videoCur,
          styleFilters,
        };
      });

      nextOptions = {
        ...currentOptions,
        videos,
      };
    }

    const updatedEffect = {
      ...currentEffect,
      options: nextOptions,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const handleComponentChange = (component: BackgroundOptions['component']) => {
    updateOptions({ component });
  };

  const handleIdDraftChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdDraft(e.target.value);
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleNameChange(e.target.value);
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
            type="text"
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

        <Background style={style} styleFilters={options.styleFilters} />

        <Images
          images={images}
          canImport={Boolean(project)}
          onChange={handleImagesChange}
          onImportAsset={handleImportImage}
        />

        <Videos
          videos={videos}
          canImport={Boolean(project)}
          onChange={handleVideosChange}
          onImportAsset={handleImportVideo}
        />

        <Shadow shadow={shadow} onChange={handleShadowChange} />
        <CustomComponent component={options.component} onChange={handleComponentChange} />

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
