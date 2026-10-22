import { useState, type ChangeEvent, type CSSProperties } from 'react';

import { useCustomComponents } from '@project/customComponentRegistry';
import type { BookProject } from '@project/@types';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { StyleEditor } from '../StyleEditor';

import { Images, Videos, Shadow } from './components';

import styles from './BackgroundSettings.module.scss';

type BackgroundSettingsProps = {
  effect: BackgroundEffectDraft;
  effects: BackgroundEffectDraft[];
  project: BookProject | null;

  onUpdate: (previousId: string, effect: BackgroundEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const defaultShadowOptions = {
  show: false,
  style: undefined,
};

export const BackgroundSettings = ({
  effect,
  effects,
  project,

  onUpdate,
  onDuplicate,
  onDelete,
}: BackgroundSettingsProps) => {
  const { definitions } = useCustomComponents();

  const [idDraft, setIdDraft] = useState(effect.id);

  const options = effect.options;

  const images = options.images ?? [];
  const videos = options.videos ?? [];
  const style = options.style ?? {};
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

  const updateStyle = (value: CSSProperties) => {
    updateOptions({
      style: value,
    });
  };

  const updateZIndex = (value: number) => {
    if (Number.isFinite(value)) {
      updateStyle({
        ...style,
        zIndex: value,
      });
    }
  };

  const otherEffects = effects.filter((cur) => cur.id !== effect.id);

  const otherZIndexes = otherEffects.map((effectCur) => {
    return Number(effectCur.options.style?.zIndex ?? 0);
  });

  const zIndex = Number(style.zIndex ?? 0);

  const moveLayer = (direction: 'forward' | 'backward' | 'top' | 'bottom') => {
    if (direction === 'top') {
      updateZIndex(Math.max(zIndex, ...otherZIndexes, 0) + 1);

      return;
    }

    if (direction === 'bottom') {
      updateZIndex(Math.min(zIndex, ...otherZIndexes, 0) - 1);

      return;
    }

    if (direction === 'forward') {
      const filteredNextZIndexes = otherZIndexes.filter((cur) => cur > zIndex);

      const sortedFollowingZIndexes = filteredNextZIndexes.sort((a, b) => a - b);

      let nextZIndex = zIndex + 1;

      if (sortedFollowingZIndexes[0] !== undefined) {
        nextZIndex = sortedFollowingZIndexes[0] + 1;
      }

      updateZIndex(nextZIndex);

      return;
    }

    const filteredPrevZIndexes = otherZIndexes.filter((cur) => cur < zIndex);

    const sortedPrecedingZIndexes = filteredPrevZIndexes.sort((a, b) => b - a);

    let previousZIndex = zIndex - 1;

    if (sortedPrecedingZIndexes[0] !== undefined) {
      previousZIndex = sortedPrecedingZIndexes[0] - 1;
    }

    updateZIndex(previousZIndex);
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

  const importAsset = async (file: File): Promise<string | null> => {
    if (!project) {
      window.alert('Сначала сохрани проект, чтобы добавить файл в assets/');

      return null;
    }

    try {
      return await project.storage.importAssetFile(file);
    } catch (error) {
      console.error('[background] Failed to import media asset', error);
      window.alert(error instanceof Error ? error.message : 'Не удалось импортировать файл');

      return null;
    }
  };

  const handleZIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateZIndex(Number(event.target.value));
  };

  const updateComponent = (id: string) => {
    if (!id) {
      updateOptions({ component: undefined });

      return;
    }

    const definition = definitions.find((cur) => cur.id === id);

    if (definition) {
      const component = {
        package: definition.packageName,
        name: definition.name,
      };

      updateOptions({
        component,
      });
    }
  };

  let componentId = '';

  if (options.component) {
    componentId = `${options.component.package}/${options.component.name}`;
  }

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

  const customComponentOptions = definitions.map((definitionCur) => {
    const { id, title } = definitionCur;

    return (
      <option key={id} value={id}>
        {title}
      </option>
    );
  });

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        <span>
          Название эффекта
        </span>

        <input
          type="text"
          value={effect.slug}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </label>

      <div className={styles.Field}>
        <span>
          ID эффекта
        </span>

        <div className={styles.Row}>
          <input value={idDraft} onChange={(e) => setIdDraft(e.target.value)} />

          <button type="button" onClick={updateId}>
            Применить
          </button>
        </div>
      </div>

      <section className={styles.Section}>
        <h3>
          Слой
        </h3>

        <div className={styles.Row}>
          <button type="button" title="В самый низ" onClick={() => moveLayer('bottom')}>
            ⇤
          </button>

          <button type="button" title="На один слой назад" onClick={() => moveLayer('backward')}>
            ←
          </button>

          <input
            type="number"
            aria-label="z-index"
            value={zIndex}
            onChange={handleZIndexChange}
          />

          <button type="button" title="На один слой вперёд" onClick={() => moveLayer('forward')}>
            →
          </button>

          <button type="button" title="На самый верх" onClick={() => moveLayer('top')}>
            ⇥
          </button>
        </div>

        <StyleEditor value={style} onChange={updateStyle} />
      </section>

      <Images images={images} onChange={handleImagesChange} onImportAsset={importAsset} />

      <Videos videos={videos} onChange={handleVideosChange} onImportAsset={importAsset} />

      <Shadow shadow={shadow} onChange={handleShadowChange} />

      <section className={styles.Section}>
        <h3>
          Кастомный компонент
        </h3>

        <select value={componentId} onChange={(e) => updateComponent(e.target.value)}>
          <option value="">
            Не использовать
          </option>

          {customComponentOptions}
        </select>
      </section>

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
