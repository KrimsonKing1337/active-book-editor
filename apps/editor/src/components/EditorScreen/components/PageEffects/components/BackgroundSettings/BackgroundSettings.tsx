import { useState, type CSSProperties } from 'react';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { useBackgroundBlurPreviewUpdater } from '../../PageEffectsContext';

import { Images, Videos, Shadow, Background, CustomComponent } from './components';

import styles from './BackgroundSettings.module.scss';

type BackgroundSettingsProps = {
  effect: BackgroundEffectDraft;
  effects: BackgroundEffectDraft[];
  project: BookProject | null;

  onUpdate: (previousId: string, effect: BackgroundEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const defaultShadowOptions: NonNullable<BackgroundOptions['shadow']> = {
  show: false,
  style: { zIndex: 2, backdropFilter: 'blur(10px)' },
};

export const BackgroundSettings = ({
  effect,
  effects,
  project,

  onUpdate,
  onDuplicate,
  onDelete,
}: BackgroundSettingsProps) => {
  const [idDraft, setIdDraft] = useState(effect.id);
  const updateBlurPreview = useBackgroundBlurPreviewUpdater();

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

  const importAsset = async (file: File, fileHandle?: ProjectFileHandle): Promise<string> => {
    if (!project) {
      throw new Error('Сначала создайте или откройте проект книги');
    }

    return project.storage.importAssetFile(file, fileHandle);
  };

  const handleNameChange = (name: string) => {
    onUpdate(effect.id, {
      ...effect,
      slug: name,
    });
  };

  const handleBackgroundChange = (updatedStyle: CSSProperties) => {
    updateOptions({ style: updatedStyle });
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

  const previewBackgroundBlur = (blur: number | null) => {
    updateBlurPreview(effect.id, 'background', null, blur);
  };

  const previewShadowBlur = (blur: number | null) => {
    updateBlurPreview(effect.id, 'shadow', null, blur);
  };

  const previewImageBlur = (imageId: string, blur: number | null) => {
    updateBlurPreview(effect.id, 'image', imageId, blur);
  };

  const previewVideoBlur = (videoId: string, blur: number | null) => {
    updateBlurPreview(effect.id, 'video', videoId, blur);
  };

  const handleComponentChange = (component: BackgroundOptions['component']) => {
    updateOptions({ component });
  };

  return (
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

      <Background style={style} onChange={handleBackgroundChange} onBlurPreview={previewBackgroundBlur} />
      <Images
        images={images}
        canImport={Boolean(project)}
        onChange={handleImagesChange}
        onImportAsset={importAsset}
        onBlurPreview={previewImageBlur}
      />
      <Videos
        videos={videos}
        canImport={Boolean(project)}
        onChange={handleVideosChange}
        onImportAsset={importAsset}
        onBlurPreview={previewVideoBlur}
      />
      <Shadow shadow={shadow} onChange={handleShadowChange} onBlurPreview={previewShadowBlur} />
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
  );
};
