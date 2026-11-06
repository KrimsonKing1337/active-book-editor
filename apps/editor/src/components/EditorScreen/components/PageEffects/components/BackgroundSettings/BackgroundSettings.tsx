import { type ChangeEvent, type CSSProperties, useRef, useState } from 'react';

import type { VisualLayout } from '@active-book/book-builder/effects';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { useBackgroundStylePreviewUpdater, usePageEffects } from '../../context';

import { BackgroundStyleProvider } from './BackgroundStyleContext';

import { Image, Video, Shadow, Background, CustomComponent } from './components';

import { DEFAULT_SHADOW_OPTIONS } from './constants';

import { TextInput, Button } from '../EffectControls';
import { StyleEditor } from '../StyleEditor';
import { VisualRegionSettings } from '../VisualRegionSettings';

import styles from './BackgroundSettings.module.scss';

type Layer = 'background' | 'image' | 'video' | 'shadow';

export type BackgroundSettingsProps = {
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
    const options = {
      ...effect.options,
      ...updates,
    };

    const updatedEffect = {
      ...effect,
      options,
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

    const loadingMessage = kind === 'image'
      ? 'Загружаем изображение...'
      : 'Загружаем видео...';

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

  const updateStylePreviewForEffect = (
    layer: Layer,
    mediaId: string | null,
    style: CSSProperties,
  ) => {
    const update = {
      effectId: effect.id,
      layer,
      mediaId,
      style,
    };

    updateStylePreview(update);
  };

  const commitFilters = (
    layer: Layer,
    mediaId: string | null,
    styleFilters: FilterOperation[],
  ) => {
    if (!flushStylePreviews()) {
      return;
    }

    const currentEffects = getCurrentEffects();

    const currentEffect = currentEffects.find((effectCur): effectCur is BackgroundEffectDraft => {
      return effectCur.type === 'background' && effectCur.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const currentOptions = currentEffect.options;

    const nextOptions = { ...currentOptions };

    if (layer === 'background') {
      nextOptions.styleFilters = styleFilters;
    } else if (layer === 'image' && currentOptions.image?.id === mediaId) {
      nextOptions.image = {
        ...currentOptions.image,
        styleFilters,
      };
    } else if (layer === 'video' && currentOptions.video?.id === mediaId) {
      nextOptions.video = {
        ...currentOptions.video,
        styleFilters,
      };
    } else if (layer === 'shadow' && currentOptions.shadow) {
      nextOptions.shadow = {
        ...currentOptions.shadow,
        styleFilters,
      };
    }

    const updatedEffect = {
      ...currentEffect,
      options: nextOptions,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const handleIdDraftChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdDraft(e.target.value);
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedEffect = {
      ...effect,
      slug: e.target.value,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const handleImportImage = (file: File, handle?: ProjectFileHandle) => {
    return importAsset(file, handle, 'image');
  };

  const handleImportVideo = (file: File, handle?: ProjectFileHandle) => {
    return importAsset(file, handle, 'video');
  };

  const handleImageChange = (val: NonNullable<BackgroundOptions['image']>) => {
    updateOptions({ image: val });
  };

  const handleVideoChange = (val: NonNullable<BackgroundOptions['video']>) => {
    updateOptions({ video: val });
  };

  const handleShadowChange = (val: NonNullable<BackgroundOptions['shadow']>) => {
    updateOptions({ shadow: val });
  };

  const handleComponentChange = (val: BackgroundOptions['component']) => {
    updateOptions({ component: val });
  };

  const handleLayoutChange = (layout: VisualLayout) => {
    onUpdate(effect.id, {
      ...effect,
      ...layout,
    });
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

          <TextInput maxLength={120} value={effect.slug} onChange={handleNameInputChange} />
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

        <VisualRegionSettings
          placement={effect.placement}
          depth={effect.depth}
          visibility={effect.visibility}
          defaultPlane="background"
          onChange={handleLayoutChange}
        />

        {effect.kind === 'background' && (
          <Background style={options.style ?? {}} styleFilters={options.styleFilters} />
        )}

        {effect.kind === 'image' && options.image && (
          <Image
            image={options.image}
            canImport={Boolean(project)}
            onChange={handleImageChange}
            onImportAsset={handleImportImage}
          />
        )}

        {effect.kind === 'video' && options.video && (
          <Video
            video={options.video}
            canImport={Boolean(project)}
            onChange={handleVideoChange}
            onImportAsset={handleImportVideo}
          />
        )}

        {effect.kind === 'shadow' && (
          <Shadow
            shadow={options.shadow ?? DEFAULT_SHADOW_OPTIONS}
            onChange={handleShadowChange}
          />
        )}

        {effect.kind === 'component' && (
          <>
            <CustomComponent
              component={options.component}
              onChange={handleComponentChange}
            />

            <details className={styles.Section}>
              <summary>
                Стили слоя
              </summary>

              <StyleEditor
                layer="background"
                value={options.style ?? {}}
                styleFilters={options.styleFilters}
              />
            </details>
          </>
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
